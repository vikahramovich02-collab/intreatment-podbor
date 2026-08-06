import { useRef, useState } from "react";
import { money, nearestSlotLabel, quoted } from "../lib/format.js";

/* Видео-визитка психолога: кружок как в телеграме — фото до запуска,
   по клику проигрывается запись со звуком. */
function VideoCircle({ person }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  if (!person.video) {
    return (
      <span className="rec__circle">
        <img src={person.photo} alt="" />
      </span>
    );
  }

  const toggle = () => {
    const node = videoRef.current;
    if (!node) return;
    if (node.paused) {
      node.play();
      setPlaying(true);
    } else {
      node.pause();
      setPlaying(false);
    }
  };

  return (
    <button
      type="button"
      className={`rec__circle rec__circle--video ${playing ? "is-playing" : ""}`.trim()}
      onClick={toggle}
      aria-label={playing ? "Остановить видео" : `Смотреть видео-визитку: ${person.name}`}
    >
      <video
        ref={videoRef}
        src={person.video}
        poster={person.photo}
        playsInline
        preload="none"
        onEnded={() => setPlaying(false)}
      />
      <span className="rec__play" aria-hidden="true">
        {playing ? (
          <svg viewBox="0 0 24 24">
            <rect x="8" y="7" width="3" height="10" rx="1" fill="currentColor" />
            <rect x="13" y="7" width="3" height="10" rx="1" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24">
            <path d="M9 6.5l9 5.5-9 5.5z" fill="currentColor" />
          </svg>
        )}
      </span>
    </button>
  );
}

/* Подобранный психолог приходит в ленту как собственная реплика:
   аватар с именем, видео-кружок, короткий рассказ о себе и действия. */
export default function RecommendationCard({ match, onOpen, time }) {
  const { person } = match;
  const nearest = nearestSlotLabel(person);

  return (
    <article className="msg rec">
      <div className="msg__head">
        <span className="avatar rec__avatar">
          <img src={person.photo} alt="" />
        </span>
        <span>
          <b className="msg__head-name">{person.name}</b>
          <span className="msg__head-role">{person.role}</span>
        </span>
      </div>

      <VideoCircle person={person} />
      {person.video && <p className="rec__videohint">Видео-визитка · 30 секунд</p>}

      <p className="msg__body rec__about">
        {quoted(person.quote)} {person.about}
      </p>

      <div className="rec__meta">
        <span className="pill-meta">{money(person.price)} • 50 минут</span>
        <span className="pill-meta">
          {nearest ? `Ближайшая запись: ${nearest}` : "Ближайших слотов нет"}
        </span>
      </div>

      <div className="rec__actions">
        <button
          className="btn btn--primary btn--sm"
          type="button"
          onClick={() => onOpen(person, nearest ? "schedule" : "about")}
        >
          Записаться
        </button>
        <button className="link" type="button" onClick={() => onOpen(person, "about")}>
          Подробнее о психологе
        </button>
      </div>

      {time && <time className="msg__time">{time}</time>}
    </article>
  );
}
