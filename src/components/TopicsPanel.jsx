/* «Содержание» разговора: список тем, которые клиент успел обсудить.
   Клик — прокрутка чата к тому месту, где эта тема начиналась. */
export default function TopicsPanel({ topics, activeId, onPick }) {
  if (!topics.length) return null;

  return (
    <nav className="topics" aria-label="Темы разговора">
      <p className="topics__title">Ваши темы</p>
      <ol className="topics__list">
        {topics.map((topic, index) => (
          <li key={topic.id}>
            <button
              type="button"
              className={topic.id === activeId ? "is-active" : ""}
              onClick={() => onPick(topic)}
            >
              <span className="topics__num">{index + 1}</span>
              <span className="topics__body">
                <span className="topics__label">{topic.title}</span>
                {topic.personName && <span className="topics__person">{topic.personName}</span>}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
