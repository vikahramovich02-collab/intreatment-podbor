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
const ASK_RECOGNIZE = "Что из этого про вас? Можно отметить или описать своими словами.";

const DUTY = { signature: "Дежурный психолог Дарья" };
const STEP_BACK = { label: "Шаг назад", stepBack: true };
const NEXT_SPECIALIST = { label: "Показать другого специалиста", nextPerson: true };
const BACK_TO_MATCHING = { label: "Вернуться к подбору", backToMatching: true };
const NEW_TOPIC = { label: "Обсудить другую тему", newTopic: true };

/* Мок: разбор свободного текста возьмёт на себя агентская система, её пока нет.
   Поэтому на любое сообщение отвечаем одинаково — чтобы не ломать флоу. */
const MOCK_REPLY =
  "Спасибо, что рассказали. Передала это дежурному психологу — он посмотрит ваш запрос и вернётся с подходящими специалистами.";

export default function ChatScreen({ onBook, onBuyProduct, onLogin, onCrisis, onHome, reopen, resetAt }) {
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
  const [dismissedProduct, setDismissedProduct] = useState(null); // материал, от которого вернулись к подбору
  const history = useRef([]); // снимки состояния для шага назад

  const threadRef = useRef(null);
  const nodeRefs = useRef({});
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (reopen?.person) setModal({ person: reopen.person, focus: "schedule" });
  }, [reopen?.at]);

  /* Клик по логотипу — начать разговор заново */
  useEffect(() => {
    if (!resetAt) return;
    clearTimers();
    setTyping(false);
    setMessages([{ role: "assistant", text: `${GREETING}\n\n${ASK_NAME}`, time: now(), topicId: null }]);
    setStage("name");
    setCategory(null);
    setSubLabel(null);
    setVCode(null);
    setName("");
    setMatches([]);
    setTopics([]);
    setTopicId(null);
    setModal(null);
    history.current = [];
  }, [resetAt]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
    // разговор пошёл дальше — прежняя карточка больше не «активная»
    setVisibleCard(null);
  }, [messages.length, typing]);

  /* Запоминаем, на чём остановились в текущей теме */
  useEffect(() => {
    if (!topicId) return;
    setTopics((prev) =>
      prev.map((topic) =>
        topic.id === topicId
          ? { ...topic, state: { stage, category, subLabel, vCode, matches, matchIndex } }
          : topic
      )
    );
  }, [topicId, stage, category, subLabel, vCode, matches, matchIndex]);

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

  const snapshotNow = () => ({
    stage,
    category,
    subLabel,
    vCode,
    topicId,
    topics,
    name,
    length: messages.length,
  });

  const restore = (snapshot) => {
    clearTimers();
    setTyping(false);
    setMessages(messages.slice(0, snapshot.length));
    setStage(snapshot.stage);
    setCategory(snapshot.category);
    setSubLabel(snapshot.subLabel);
    setVCode(snapshot.vCode);
    setTopicId(snapshot.topicId);
    setTopics(snapshot.topics);
    setName(snapshot.name);
  };

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
    say(ASK_RECOGNIZE, { topicId });
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
    if (option.backToMatching) {
      const shown = [...messages].reverse().find((message) => message.role === "product");
      setDismissedProduct(shown?.product || null);
      setVisibleCard(null);
      threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
      return;
    }
    if (option.stepBack) {
      const previous = history.current.pop();
      if (previous) restore(previous);
      return;
    }
    history.current.push(snapshotNow());
    /* «Пропустить» — служебный выбор: в ленту его репликой не кладём,
       просто переходим к следующему шагу */
    if (!option.skip) hear(option.label);

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
      setStage("sub");
      say(withName("Тогда посмотрим ещё раз: что ближе к вашей ситуации?"), { topicId });
      return;
    }

  };

  const pickMany = (labels) => {
    history.current.push(snapshotNow());
    hear(labels.length ? labels.join("; ") : "Ничего из этого");
    if (!labels.length) {
      setStage("sub");
      say(withName("Тогда посмотрим ещё раз: что ближе к вашей ситуации?"), { topicId });
      return;
    }
    showMatch(vCode);
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

    // Один и тот же ответ на любой текст — до подключения агентской системы
    setStage("duty");
    say(withName(MOCK_REPLY), { topicId, ...DUTY });
  };

  /* ── Редактирование ответа ── */
  const editMessage = (index) => {
    const message = messages[index];
    if (!message?.snapshot) return;
    clearTimers();
    setTyping(false);
    // возвращаемся в ту точку сценария, но накопленный диалог сохраняем
    setStage(message.snapshot.stage);
    setCategory(message.snapshot.category);
    setSubLabel(message.snapshot.subLabel);
    setVCode(message.snapshot.vCode);
    setTopicId(message.snapshot.topicId);
    setName(message.snapshot.name);
    setDraft({ text: message.text, at: Date.now() });
    say(withName("Хорошо, вернёмся к этому вопросу."), { topicId: message.snapshot.topicId });
  };

  const onThreadScroll = () => {
    const node = threadRef.current;
    if (!node) return;
    const edge = node.scrollTop + 140;
    const top = node.scrollTop;
    const bottom = node.scrollTop + node.clientHeight;
    let current = null;
    let card = null;
    messages.forEach((message, index) => {
      const item = nodeRefs.current[index];
      if (!item) return;
      if (message.topicId && item.offsetTop <= edge) current = message.topicId;
      // действие внизу относится к карточке, которая занимает экран, а не мелькает краем
      const seen =
        Math.min(item.offsetTop + item.offsetHeight, bottom) - Math.max(item.offsetTop, top);
      const visible = seen > Math.min(item.offsetHeight * 0.5, 240);
      if ((message.role === "rec" || message.role === "product") && visible) card = message;
    });
    setVisibleTopic(current);
    setVisibleCard(card);
  };

  const scrollToTopic = (topic) => {
    clearTimers();
    setTyping(false);
    setTopicId(topic.id);
    if (topic.state) {
      setStage(topic.state.stage);
      setCategory(topic.state.category);
      setSubLabel(topic.state.subLabel);
      setVCode(topic.state.vCode);
      setMatches(topic.state.matches || []);
      setMatchIndex(topic.state.matchIndex || 0);
    }
    // ведём к карточке специалиста этой темы, а если её нет — к началу ветки
    let index = messages.reduce(
      (found, message, i) =>
        message.topicId === topic.id && message.role === "rec" ? i : found,
      -1
    );
    if (index < 0) index = messages.findIndex((message) => message.topicId === topic.id);
    const node = nodeRefs.current[index];
    if (!node) return;
    requestAnimationFrame(() => node.scrollIntoView({ block: "start", behavior: "smooth" }));
  };

  /* Карточка, к которой относятся действия под чатом.
     Пока идёт опрос, действий нет — иначе кнопка «прилипает» от прошлого шага. */
  const lastMessage = messages[messages.length - 1];
  const activeCard = (() => {
    if (lastMessage?.role === "product" && lastMessage.product !== dismissedProduct) {
      return lastMessage;
    }
    if (stage !== "matched") return null;
    if (visibleCard?.role === "rec") return visibleCard;
    return [...messages].reverse().find((message) => message.role === "rec") || null;
  })();

  const primaryAction = (() => {
    const card = activeCard;
    if (card?.role === "product") {
      return {
        label: `Забрать за ${money(card.product.price)}`,
        onClick: () => onBuyProduct(card.product),
      };
    }
    const person = card?.person || (stage === "matched" ? matches[matchIndex] : null);
    if (!person) return null;
    return {
      label: "Выбрать дату и время",
      onClick: () => openProfile(person, "schedule"),
    };
  })();

  /* ── Что показываем в композере ── */
  const composer = (() => {
    if (stage === "name") {
      return { options: [{ label: "Пропустить", skip: true }], placeholder: "Ваше имя.." };
    }
    // разговор с дежурным: только ответы и навигация, без меню категорий
    if (stage === "duty") {
      return {
        options: [],
        placeholder: "Расскажите..",
        stepBack: history.current.length > 0,
      };
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
        stepBack: history.current.length > 0,
      };
    }
    if (stage === "subsub") {
      return {
        options: subSubcategoriesOf(subLabel).map(([label, code]) => ({ label, vCode: code })),
        stepBack: history.current.length > 0,
      };
    }
    if (stage === "situation") {
      // пункты ситуации из алгоритма — чекбоксами
      const points = (situationOf(vCode) || "")
        .split("\n")
        .map((line) => line.replace(/^[•\s]+/, "").trim())
        .filter(Boolean);
      return {
        options: [...points.map((label) => ({ label })), { label: "Ничего из этого", none: true }],
        mode: "multi",
        submitLabel: "Узнаю себя в этих ситуациях",
        submitLabelShort: "Узнаю",
        placeholder: "Опишите свою ситуацию..",
        stepBack: history.current.length > 0,
      };
    }
    const hasMore = matches.length > 1;
    return {
      options: hasMore ? [NEXT_SPECIALIST, NEW_TOPIC] : [NEW_TOPIC],
      stepBack: history.current.length > 0,
    };
  })();

  return (
    <div className="app app--fixed">
      <Header onLogin={onLogin} onHome={onHome} onHelp={(focus) => setHelpOpen(focus || "list")} />

      <div className="chat">
        <TopicsPanel topics={topics} activeId={topicId} onPick={scrollToTopic} />

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
                    <ProductCard product={message.product} onBuy={onBuyProduct} />
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
          navExtra={activeCard?.role === "product" ? BACK_TO_MATCHING : null}
          draft={draft}
          disabled={typing}
          onPick={pickOption}
          onPickMany={pickMany}
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
