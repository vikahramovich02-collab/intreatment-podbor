import useScrollRail from "../lib/useScrollRail.js";

/* «Содержание» разговора: список тем, которые клиент успел обсудить.
   Клик — прокрутка чата к тому месту, где эта тема начиналась. */
export default function TopicsPanel({ topics, activeId, onPick }) {
  const { ref, rail, sync } = useScrollRail();
  if (!topics.length) return null;

  return (
    <nav className="topics" aria-label="Темы разговора">
      <div className="topics__view" ref={ref} onScroll={sync}>
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
      </div>
      {rail && (
        <span
          className={`scroller__rail scroller__rail--${rail.axis} topics__rail`}
          aria-hidden="true"
        >
          <span
            className="scroller__thumb"
            style={
              rail.axis === "y"
                ? { height: `${rail.size}%`, top: `${rail.offset}%` }
                : { width: `${rail.size}%`, left: `${rail.offset}%` }
            }
          />
        </span>
      )}
    </nav>
  );
}
