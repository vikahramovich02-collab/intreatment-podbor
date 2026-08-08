import { useEffect, useRef, useState } from "react";
import Header from "../components/Header.jsx";
import Composer from "../components/Composer.jsx";
import RecommendationCard from "../components/RecommendationCard.jsx";
import ProfileModal from "../components/ProfileModal.jsx";
import HelpModal from "../components/HelpModal.jsx";
import TopicsPanel from "../components/TopicsPanel.jsx";
import { AssistantMessage, UserMessage } from "../components/Message.jsx";
import { flow, stepById, refineOptions, crisisPattern } from "../data/flow.js";
import { rankSpecialists } from "../data/specialists.js";
import { now } from "../lib/format.js";

const GREETING =
  "Здравствуйте!\n\nПомогу подобрать специалиста, с которым будет спокойно начать. Это займёт около 3 минут — можно выбирать варианты или писать своими словами.";

/* Свободный текст тоже участвует в подборе: ищем в нём знакомые темы. */
const KEYWORDS = [
  [/тревог|паник|напряж|беспоко/i, "тревога"],
  [/выгора|нет сил|устал|истощ|апати|нет смысла|нет вкуса/i, "выгорание"],
  [/отношени|партн[её]р|муж|жена|близк/i, "отношения"],
  [/расстав|развод|ушл[аи]|бросил/i, "расставание"],
  [/границ|не могу отказ|говорить нет/i, "границы"],
  [/конфликт|ссор|скандал/i, "конфликты"],
  [/ребён|ребен|дет|мам|родител|материнств/i, "родительство"],
  [/вин[ауы]|виноват/i, "вина"],
  [/самооцен|самокрит|не верю в себя|сомнева/i, "самооценка"],
  [/прокрастин|откладыв|не могу начать|не могу собрат/i, "прокрастинация"],
  [/проявл|блог|проект|реализ|карьер/i, "самореализация"],
  [/перемен|измен|переезд|новая жизнь|неопредел/i, "перемены"],
  [/травм|насили|абьюз|птср/i, "травма"],
  [/одинок|никого рядом|не с кем/i, "одиночество"],
  [/страх|боюсь|пугает/i, "страх"],
  [/опор|поддержк|устойчив/i, "опора"],
];

const tagsFromText = (text) =>
  KEYWORDS.filter(([pattern]) => pattern.test(text)).map(([, tag]) => tag);

/* Заголовок темы для боковой панели, когда клиент описал запрос своими словами */
const titleFromText = (text) => {
  const short = text.trim().split(/\s+/).slice(0, 5).join(" ");
  return short.charAt(0).toUpperCase() + short.slice(1) + (text.trim().split(/\s+/).length > 5 ? "…" : "");
};

const NEW_TOPIC = { label: "Обсудить другую тему", newTopic: true };

/* Ответ на свободный текст подписываем живым человеком */
const DUTY = { signature: "Дежурный психолог Дарья" };

export default function ChatScreen({ onBook, onLogin, onCrisis }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: GREETING, time: now(), topicId: null },
    { role: "assistant", text: stepById("name").prompt, time: now(), topicId: null },
  ]);
  const [phase, setPhase] = useState("flow"); // flow → matched
  const [stepId, setStepId] = useState("name");
  const [tags, setTags] = useState([]);
  const [name, setName] = useState("");
  const [typing, setTyping] = useState(false);
  const [matches, setMatches] = useState([]);
  const [matchIndex, setMatchIndex] = useState(0);
  const [modal, setModal] = useState(null); // { match, focus }
  const [helpOpen, setHelpOpen] = useState(false);
  const [draft, setDraft] = useState(null); // текст, возвращённый в поле при редактировании

  /* Темы: у клиента редко один запрос. Каждая новая тема — своя ветка
     со своими метками и своим подобранным специалистом. */
  const [topics, setTopics] = useState([]);
  const [topicId, setTopicId] = useState(null);
  const [visibleTopic, setVisibleTopic] = useState(null); // тема, до которой долистали

  const threadRef = useRef(null);
  const nodeRefs = useRef({});
  const timers = useRef([]);
  const step = phase === "flow" ? stepById(stepId) : null;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    const node = threadRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
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

  /* Реплика клиента несёт снимок состояния ДО ответа — по нему работает
     редактирование: откатываемся к снимку и проигрываем ответ заново. */
  const hear = (text, snapshot) =>
    setMessages((prev) => [
      ...prev,
      { role: "user", text, time: now(), topicId, snapshot },
    ]);

  const snapshotNow = () => ({
    stepId,
    tags,
    phase,
    topicId,
    topics,
    name,
  });

  const withName = (text) => (name ? `${name}, ${text[0].toLowerCase()}${text.slice(1)}` : text);

  /* ── Подбор ── */
  const showMatch = (allTags, index = 0, lead, forTopic = topicId, extra = {}) => {
    const ranked = rankSpecialists(allTags);
    setMatches(ranked);
    setMatchIndex(index);
    setPhase("matched");
    setTopics((prev) =>
      prev.map((topic) =>
        topic.id === forTopic ? { ...topic, personName: ranked[index].person.name } : topic
      )
    );
    setTyping(true);
    const timer = setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: lead || withName("Вот кто может подойти под ваш запрос."),
          time: now(),
          topicId: forTopic,
          ...extra,
        },
        { role: "rec", match: ranked[index], topicId: forTopic },
      ]);
    }, 750);
    timers.current.push(timer);
  };

  const goTo = (nextId, allTags, extra = {}) => {
    if (!nextId) {
      showMatch(allTags, 0, undefined, topicId, extra);
      return;
    }
    const next = stepById(nextId);
    setStepId(nextId);
    setPhase("flow");
    say(withName(next.prompt), { topicId, ...extra });
  };

  /* Новая тема разговора */
  const openTopic = (title) => {
    const id = `t${Date.now()}`;
    setTopics((prev) => [...prev, { id, title, personName: null }]);
    setTopicId(id);
    return id;
  };

  /* ── Ответы ── */
  const pickOption = (option) => {
    const snapshot = snapshotNow();

    if (phase === "matched") {
      refine(option, snapshot);
      return;
    }
    if (option.skip) {
      hear(option.label, snapshot);
      goTo(step.next, tags);
      return;
    }

    hear(option.label, snapshot);

    const allTags = [...tags, ...(option.tags || [])];
    setTags(allTags);

    // Ответ на вопрос о сфере открывает новую тему
    if (step.id === "topic") {
      const id = openTopic(option.label);
      const next = stepById(option.next || step.next);
      setStepId(next.id);
      setPhase("flow");
      say(withName(next.prompt), { topicId: id });
      return;
    }

    goTo(option.next || step.next, allTags);
  };

  const pickMany = (labels) => {
    const snapshot = snapshotNow();
    const said = labels
      .map((label, index) => (index === 0 ? label : label[0].toLowerCase() + label.slice(1)))
      .join(", ");
    hear(labels.length ? said : "Ничего из этого", snapshot);
    const picked = step.options.filter((option) => labels.includes(option.label));
    const allTags = [...tags, ...picked.flatMap((option) => option.tags || [])];
    setTags(allTags);
    goTo(step.next, allTags);
  };

  const sendText = (value) => {
    const snapshot = snapshotNow();

    if (crisisPattern.test(value)) {
      hear(value, snapshot);
      onCrisis();
      return;
    }
    hear(value, snapshot);

    if (phase === "matched") {
      const allTags = [...tags, ...tagsFromText(value)];
      setTags(allTags);
      showMatch(allTags, 0, withName("Поняла. Тогда посмотрите на этот вариант."), topicId, DUTY);
      return;
    }

    if (step.id === "name") {
      const visitor = value.split(" ")[0].slice(0, 24);
      setName(visitor);
      const next = stepById(step.next);
      setStepId(step.next);
      say(`Приятно познакомиться, ${visitor}. ${next.prompt}`, { topicId });
      return;
    }

    const allTags = [...tags, ...tagsFromText(value)];
    setTags(allTags);

    if (step.id === "topic") {
      const id = openTopic(titleFromText(value));
      const next = stepById(step.freeTextNext || step.next);
      setStepId(next.id);
      setPhase("flow");
      say(withName(next.prompt), { topicId: id, ...DUTY });
      return;
    }

    goTo(step.freeTextNext || step.next, allTags, DUTY);
  };

  const refine = (option, snapshot) => {
    hear(option.label, snapshot);

    if (option.newTopic) {
      setTags([]);
      setStepId("topic");
      setPhase("flow");
      say(withName(stepById("topic").prompt), { topicId: null });
      return;
    }
    if (option.nextPerson) {
      const next = (matchIndex + 1) % matches.length;
      setMatchIndex(next);
      setTopics((prev) =>
        prev.map((topic) =>
          topic.id === topicId ? { ...topic, personName: matches[next].person.name } : topic
        )
      );
      say(withName("Показываю другого специалиста."), { topicId });
      const timer = setTimeout(
        () =>
          setMessages((prev) => [...prev, { role: "rec", match: matches[next], topicId }]),
        700
      );
      timers.current.push(timer);
      return;
    }
    showMatch(tags, 0, withName("Поняла. Уточнила подбор."));
  };

  /* ── Редактирование ответа ──
     Возвращаемся в точку, где этот ответ был дан: всё, что было сказано после,
     отматывается, и подбор пойдёт заново с нового ответа. */
  const editMessage = (index) => {
    const message = messages[index];
    if (!message?.snapshot) return;
    clearTimers();
    setTyping(false);
    setMessages(messages.slice(0, index));
    setStepId(message.snapshot.stepId);
    setTags(message.snapshot.tags);
    setPhase(message.snapshot.phase);
    setTopicId(message.snapshot.topicId);
    setTopics(message.snapshot.topics);
    setName(message.snapshot.name);
    setDraft({ text: message.text, at: Date.now() });
  };

  /* Подсветка в «содержании» идёт за прокруткой: активна та тема,
     чьи сообщения сейчас в верхней части ленты. */
  const onThreadScroll = () => {
    const node = threadRef.current;
    if (!node) return;
    const edge = node.scrollTop + 140;
    let current = null;
    messages.forEach((message, index) => {
      const item = nodeRefs.current[index];
      if (!item || !message.topicId) return;
      if (item.offsetTop <= edge) current = message.topicId;
    });
    setVisibleTopic(current);
  };

  const scrollToTopic = (topic) => {
    const index = messages.findIndex((message) => message.topicId === topic.id);
    const node = nodeRefs.current[index];
    node?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  /* ── Состояние композера ── */
  const composer =
    phase === "matched"
      ? {
          options: [...refineOptions, NEW_TOPIC],
          mode: "single",
          hint: "Можно посмотреть другого специалиста, начать новую тему или написать своими словами",
        }
      : {
          options: step?.options || [],
          mode: step?.kind === "multi" ? "multi" : "single",
          hint: step?.hint,
          submitLabel: step?.submitLabel,
          placeholder: step?.placeholder,
        };

  const openProfile = (person, focus) => {
    const match = matches.find((item) => item.person.id === person.id) || matches[matchIndex];
    setModal({ match, focus });
  };

  return (
    <div className="app app--fixed">
      <Header onLogin={onLogin} onHelp={(focus) => setHelpOpen(focus || "list")} />

      <div className="chat">
        <TopicsPanel
          topics={topics}
          activeId={visibleTopic || topicId}
          onPick={scrollToTopic}
        />

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
              if (message.role === "rec") {
                return (
                  <div key={index} ref={setNode}>
                    <RecommendationCard match={message.match} onOpen={openProfile} />
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
          draft={draft}
          disabled={typing}
          onPick={pickOption}
          onPickMany={pickMany}
          onText={sendText}
          legal={step?.id === "name"}
        />
      </div>

      {helpOpen && (
        <HelpModal focus={helpOpen} onClose={() => setHelpOpen(false)} />
      )}

      {modal && (
        <ProfileModal
          match={modal.match}
          matchedTags={tags}
          focus={modal.focus}
          onClose={() => setModal(null)}
          onChoose={(booking) => {
            setModal(null);
            onBook({ ...booking, name });
          }}
          onNext={() => {
            const next = (matches.findIndex((item) => item === modal.match) + 1) % matches.length;
            setMatchIndex(next);
            setModal({ match: matches[next], focus: "about" });
          }}
        />
      )}
    </div>
  );
}
