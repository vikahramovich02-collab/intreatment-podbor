import { useEffect, useRef, useState } from "react";
import Header from "../components/Header.jsx";
import Composer from "../components/Composer.jsx";
import RecommendationCard from "../components/RecommendationCard.jsx";
import ProductCard from "../components/ProductCard.jsx";
import ProfileModal from "../components/ProfileModal.jsx";
import HelpModal from "../components/HelpModal.jsx";
import TopicsPanel from "../components/TopicsPanel.jsx";
import { AssistantMessage, UserMessage } from "../components/Message.jsx";
import { crisisPattern } from "../data/flow.js";
import {
  MAIN_CATEGORIES,
  subcategoriesOf,
  subSubcategoriesOf,
  situationOf,
  specialistsOf,
} from "../data/categories.js";
import { specialistsByCodes } from "../data/specialists.js";
import { now, nearestSlotLabel, dative, money } from "../lib/format.js";

const GREETING =
  "Здравствуйте!\n\nПомогу подобрать специалиста, с которым будет спокойно начать. Это займёт около 3 минут — можно выбирать варианты или писать своими словами.";
const ASK_NAME = "Как к вам можно обращаться?";
const ASK_CATEGORY = "В какой сфере вы хотели бы изменений?";
const ASK_SUB = "Что ближе к вашей ситуации?";
const ASK_RECOGNIZE = "Узнаёте себя в этом?";

const DUTY = { signature: "Дежурный психолог Дарья" };
const BACK_TO_CATEGORIES = { label: "Вернуться к категориям", toCategories: true };
const NEXT_SPECIALIST = { label: "Показать другого специалиста", nextPerson: true };
const NEW_TOPIC = { label: "Обсудить другую тему", newTopic: true };

/* Свободный текст сопоставляем с категориями алгоритма по ключевым словам */
const KEYWORDS = [
  [/отношени|партн[её]р|муж|жена|расстав|развод|конфликт|близк/i, "p2"],
  [/ребён|ребен|дет|подрост|мам|родительств|материнств/i, "p3"],
  [/перемен|переезд|работ|уволил|измен|неопредел/i, "p1"],
  [/реализ|проект|творч|карьер|самозван|проявл/i, "p4"],
  [/боле|тело|психосомат|давлени|аллерг|астм/i, "p7"],
  [/самооцен|себе не нравл|осуд|ошиб|несовершен/i, "p8"],
  [/смысл|тревог|паник|депресс|апати|нет сил|выгора/i, "p5"],
  [/травм|насили|войн|жестокост|болезненные воспомин/i, "p6"],
];

const categoryOfText = (text) => {
  const hit = KEYWORDS.find(([pattern]) => pattern.test(text));
  return hit ? hit[1] : null;
};

const labelOfCategory = (code) =>
  (MAIN_CATEGORIES.find(([, key]) => key === code) || [])[0] || "";

export default function ChatScreen({ onBook, onBuyProduct, onLogin, onCrisis }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: `${GREETING}\n\n${ASK_NAME}`, time: now(), topicId: null },
  ]);
  /* Стадии повторяют шаги бота: имя → категория → подкатегория →
     третий уровень → узнавание ситуации → выдача специалистов */
  const [stage, setStage] = useState("name");
  const [category, setCategory] = useState(null); // код категории (p1…p8, emergency)
  const [subLabel, setSubLabel] = useState(null); // подкатегория с третьим уровнем
  const [vCode, setVCode] = useState(null);
  const [name, setName] = useState("");
  const [typing, setTyping] = useState(false);
  const [matches, setMatches] = useState([]);
  const [matchIndex, setMatchIndex] = useState(0);
  const [modal, setModal] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [consent, setConsent] = useState(false);

  /* Темы: каждая выбранная категория — своя ветка со своим специалистом */
  const [topics, setTopics] = useState([]);
  const [topicId, setTopicId] = useState(null);
  const [visibleTopic, setVisibleTopic] = useState(null);
  const [visibleCard, setVisibleCard] = useState(null); // карточка, на которой стоит скролл

  const threadRef = useRef(null);
  const nodeRefs = useRef({});
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, typing]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const say = (text, extra = {}, delay = 600) => {
    setTyping(true);
    const timer = setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [...prev, { role: "assistant", text, time: now(), ...extra }]);
    }, delay);
    timers.current.push(timer);
  };

  const snapshotNow = () => ({ stage, category, subLabel, vCode, topicId, topics, name });

  const hear = (text) =>
    setMessages((prev) => [
      ...prev,
      { role: "user", text, time: now(), topicId, snapshot: snapshotNow() },
    ]);

  const withName = (text) => (name ? `${name}, ${text[0].toLowerCase()}${text.slice(1)}` : text);

  const openProfile = (person, focus) => setModal({ person, focus });

  /* Материал из каталога самопомощи приходит в чат карточкой */
  const showProduct = (product) => {
    setMessages((prev) => [...prev, { role: "product", product, topicId, time: now() }]);
  };

  /* ── Выдача специалистов по v-коду ── */
  const showMatch = (code, forTopic = topicId, index = 0, extra = {}) => {
    const people = specialistsByCodes(specialistsOf(code));
    if (!people.length) {
      say(withName("Подходящих специалистов пока нет — попробуйте другую категорию."), {
        topicId: forTopic,
      });
      return;
    }
    setMatches(people);
    setMatchIndex(index);
    setStage("matched");
    setTopics((prev) =>
      prev.map((topic) =>
        topic.id === forTopic ? { ...topic, personName: people[index].name } : topic
      )
    );
    // Специалистов показываем по очереди — по одному на сообщение
    setTyping(true);
    const timer = setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "rec",
          person: people[index],
          lead: withName("Вот кто может подойти под ваш запрос."),
          time: now(),
          topicId: forTopic,
          ...extra,
        },
      ]);
    }, 750);
    timers.current.push(timer);
  };

  /* Описание ситуации из алгоритма — перед выдачей специалистов */
  const askRecognize = (code) => {
    const situation = situationOf(code);
    setVCode(code);
    if (!situation) {
      showMatch(code);
      return;
    }
    setStage("situation");
    say(`${situation}\n\n${ASK_RECOGNIZE}`, { topicId });
  };

  const openTopic = (title) => {
    const id = `t${Date.now()}`;
    setTopics((prev) => [...prev, { id, title, personName: null }]);
    setTopicId(id);
    return id;
  };

  const goToCategories = () => {
    setStage("category");
    setCategory(null);
    setSubLabel(null);
    setVCode(null);
    setTopicId(null);
    say(withName(ASK_CATEGORY), { topicId: null });
  };

  /* ── Ответы ── */
  const pickOption = (option) => {
    hear(option.label);

    if (option.toCategories || option.newTopic) {
      goToCategories();
      return;
    }
    if (option.skip) {
      setStage("category");
      say(ASK_CATEGORY);
      return;
    }
    if (option.duty) {
      say(
        "Передала сообщение дежурному психологу — он ответит здесь в ближайшее время. Можно рассказать, что происходит.",
        DUTY
      );
      return;
    }

    if (stage === "category") {
      if (option.code === "emergency") setHelpOpen("list");
      const id = openTopic(option.label);
      setCategory(option.code);
      setStage("sub");
      say(withName(ASK_SUB), { topicId: id });
      return;
    }

    if (stage === "sub") {
      if (subSubcategoriesOf(option.label).length) {
        setSubLabel(option.label);
        setStage("subsub");
        say(withName(ASK_SUB), { topicId });
        return;
      }
      askRecognize(option.vCode);
      return;
    }

    if (stage === "subsub") {
      askRecognize(option.vCode);
      return;
    }

    if (option.nextPerson) {
      const next = (matchIndex + 1) % matches.length;
      setMatchIndex(next);
      setTopics((prev) =>
        prev.map((topic) =>
          topic.id === topicId ? { ...topic, personName: matches[next].name } : topic
        )
      );
      setTyping(true);
      const timer = setTimeout(() => {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            role: "rec",
            person: matches[next],
            lead: withName("Показываю другого специалиста."),
            time: now(),
            topicId,
          },
        ]);
      }, 700);
      timers.current.push(timer);
      return;
    }

    if (stage === "situation") {
      if (option.recognize) {
        showMatch(vCode);
      } else {
        setStage("sub");
        say(withName("Тогда посмотрим ещё раз: что ближе к вашей ситуации?"), { topicId });
      }
      return;
    }

  };

  const sendText = (value) => {
    if (crisisPattern.test(value)) {
      hear(value);
      onCrisis();
      return;
    }
    hear(value);

    if (stage === "name") {
      const visitor = value.split(" ")[0].slice(0, 24);
      setName(visitor);
      setStage("category");
      say(`Приятно познакомиться, ${visitor}. ${ASK_CATEGORY}`);
      return;
    }

    // В любой момент свободный текст пробуем сопоставить с категорией алгоритма
    const guess = categoryOfText(value);
    if (guess) {
      const id = openTopic(labelOfCategory(guess));
      setCategory(guess);
      setStage("sub");
      say(withName(`Похоже, это про «${labelOfCategory(guess)}». ${ASK_SUB}`), {
        topicId: id,
        ...DUTY,
      });
      return;
    }
    say(withName("Спасибо, что рассказали. Выберите, что ближе к вашей ситуации."), {
      topicId,
      ...DUTY,
    });
  };

  /* ── Редактирование ответа ── */
  const editMessage = (index) => {
    const message = messages[index];
    if (!message?.snapshot) return;
    clearTimers();
    setTyping(false);
    setMessages(messages.slice(0, index));
    setStage(message.snapshot.stage);
    setCategory(message.snapshot.category);
    setSubLabel(message.snapshot.subLabel);
    setVCode(message.snapshot.vCode);
    setTopicId(message.snapshot.topicId);
    setTopics(message.snapshot.topics);
    setName(message.snapshot.name);
    setDraft({ text: message.text, at: Date.now() });
  };

  const onThreadScroll = () => {
    const node = threadRef.current;
    if (!node) return;
    const edge = node.scrollTop + 140;
    const middle = node.scrollTop + node.clientHeight / 2;
    let current = null;
    let card = null;
    messages.forEach((message, index) => {
      const item = nodeRefs.current[index];
      if (!item) return;
      if (message.topicId && item.offsetTop <= edge) current = message.topicId;
      // действие внизу относится к той карточке, что сейчас перед глазами
      if ((message.role === "rec" || message.role === "product") && item.offsetTop <= middle) {
        card = message;
      }
    });
    setVisibleTopic(current);
    setVisibleCard(card);
  };

  const scrollToTopic = (topic) => {
    const index = messages.findIndex((message) => message.topicId === topic.id);
    nodeRefs.current[index]?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  /* Главное действие под чатом — по карточке, на которой стоит скролл */
  const primaryAction = (() => {
    // пока не прокручивали — ориентируемся на последнюю карточку в ленте
    const lastCard = [...messages]
      .reverse()
      .find((message) => message.role === "rec" || message.role === "product");
    const card = visibleCard || lastCard;
    if (card?.role === "product") {
      return {
        label: `Забрать за ${money(card.product.price)}`,
        onClick: () => onBuyProduct(card.product),
      };
    }
    const person = card?.person || (stage === "matched" ? matches[matchIndex] : null);
    if (!person) return null;
    const nearest = nearestSlotLabel(person);
    return {
      label: nearest
        ? `Записаться к ${dative(person.name)} на ${nearest}`
        : `Записаться к ${dative(person.name)}`,
      onClick: () => openProfile(person, "schedule"),
    };
  })();

  /* ── Что показываем в композере ── */
  const composer = (() => {
    if (stage === "name") {
      return { options: [{ label: "Пропустить", skip: true }], placeholder: "Ваше имя.." };
    }
    if (stage === "category") {
      // «Скорая помощь» и дежурный психолог живут в шапке, в меню их не дублируем
      return {
        options: MAIN_CATEGORIES.filter(([, code]) => code.startsWith("p")).map(
          ([label, code]) => ({ label, code })
        ),
      };
    }
    if (stage === "sub") {
      return {
        options: subcategoriesOf(category).map(([label, code]) => ({ label, vCode: code })),
        back: BACK_TO_CATEGORIES,
      };
    }
    if (stage === "subsub") {
      return {
        options: subSubcategoriesOf(subLabel).map(([label, code]) => ({ label, vCode: code })),
        back: BACK_TO_CATEGORIES,
      };
    }
    if (stage === "situation") {
      return {
        options: [
          { label: "Да, узнаю себя", recognize: true },
          { label: "Не совсем, вернуться к списку" },
        ],
        back: BACK_TO_CATEGORIES,
      };
    }
    const hasMore = matches.length > 1;
    return {
      options: hasMore ? [NEXT_SPECIALIST, NEW_TOPIC] : [NEW_TOPIC],
      back: BACK_TO_CATEGORIES,
    };
  })();

  return (
    <div className="app app--fixed">
      <Header onLogin={onLogin} onHelp={(focus) => setHelpOpen(focus || "list")} />

      <div className="chat">
        <TopicsPanel topics={topics} activeId={visibleTopic || topicId} onPick={scrollToTopic} />

        <div className="chat__thread" ref={threadRef} onScroll={onThreadScroll}>
          <div className="column chat__thread-inner">
            {messages.map((message, index) => {
              const setNode = (node) => {
                nodeRefs.current[index] = node;
              };
              if (message.role === "assistant") {
                return (
                  <AssistantMessage
                    key={index}
                    ref={setNode}
                    text={message.text}
                    time={message.time}
                    signature={message.signature}
                  />
                );
              }
              if (message.role === "product") {
                return (
                  <div key={index} ref={setNode}>
                    <ProductCard product={message.product} />
                  </div>
                );
              }
              if (message.role === "rec") {
                return (
                  <div key={index} ref={setNode}>
                    <RecommendationCard
                      person={message.person}
                      lead={message.lead}
                      onOpen={openProfile}
                    />
                  </div>
                );
              }
              return (
                <UserMessage
                  key={index}
                  ref={setNode}
                  text={message.text}
                  time={message.time}
                  onEdit={message.snapshot ? () => editMessage(index) : null}
                />
              );
            })}
            {typing && <AssistantMessage typing />}
          </div>
        </div>

        <Composer
          {...composer}
          primaryAction={primaryAction}
          draft={draft}
          disabled={typing}
          onPick={pickOption}
          onText={sendText}
          consent={consent ? null : { checked: consent, onChange: setConsent }}
        />
      </div>

      {helpOpen && (
        <HelpModal focus={helpOpen} onPick={showProduct} onClose={() => setHelpOpen(false)} />
      )}

      {modal && (
        <ProfileModal
          person={modal.person}
          focus={modal.focus}
          onClose={() => setModal(null)}
          onChoose={(booking) => {
            setModal(null);
            onBook({ ...booking, name });
          }}
          onNext={() => {
            const next = (matches.findIndex((item) => item === modal.person) + 1) % matches.length;
            setMatchIndex(next);
            setModal({ person: matches[next], focus: "about" });
          }}
        />
      )}
    </div>
  );
}
