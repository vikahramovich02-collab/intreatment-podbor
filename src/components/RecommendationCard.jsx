import { useEffect, useRef, useState } from "react";
import { Mark } from "./icons.jsx";
import { money, nearestSlotLabel, nearestSlotShort } from "../lib/format.js";

/* Видео-визитка психолога: кружок как в телеграме — фото до запуска,
   по клику пауза и продолжение, кольцо показывает прогресс,
   а перетаскиванием по кольцу запись можно перемотать. */
function VideoCircle({ person }) {
  const videoRef = useRef(null);
  const ringRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);


  /* Карточка только что пришла в ленту — визитка запускается сама.
     Если браузер запретит (бывает на iOS), останется постер с кнопкой. */
  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    stopOthers(node);
    const started = node.play();
    if (started?.then) {
      started.then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      setPlaying(true);
    }
  }, []);

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
      stopOthers(node);
      node.play();
      setPlaying(true);
    } else {
      node.pause();
      setPlaying(false);
    }
  };

  /* Одновременно в ленте играет только один кружок */
  function stopOthers(current) {
    document.querySelectorAll(".rec__circle--video video").forEach((other) => {
      if (other !== current) other.pause();
    });
  }

  /* Позицию берём по углу от центра кольца: 12 часов — начало записи */
  const seekTo = (event) => {
    const node = videoRef.current;
    const ring = ringRef.current;
    if (!node || !ring || !node.duration) return;
    const box = ring.getBoundingClientRect();
    const x = event.clientX - (box.left + box.width / 2);
    const y = event.clientY - (box.top + box.height / 2);
    let share = (Math.atan2(x, -y) / (2 * Math.PI)) % 1;
    if (share < 0) share += 1;
    node.currentTime = share * node.duration;
    setProgress(share);
    setTime(node.currentTime);
  };

  const onTime = () => {
    const node = videoRef.current;
    if (!node || !node.duration) return;
    setTime(node.currentTime);
    if (!scrubbing) setProgress(node.currentTime / node.duration);
  };

  const clock = (value) => {
    const total = Math.max(0, Math.round(value));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
  };

  const R = 49; // радиус кольца в единицах viewBox
  const ring = 2 * Math.PI * R;

  return (
    <span className="rec__video">
      <span
        className={`rec__circle rec__circle--video ${playing ? "is-playing" : ""}`.trim()}
        role="button"
        tabIndex={0}
        aria-label={playing ? "Пауза" : `Смотреть видео-визитку: ${person.name}`}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle();
          }
        }}
      >
        <video
          ref={videoRef}
          src={person.video}
          poster={person.photo}
          playsInline
          preload="metadata"
          onTimeUpdate={onTime}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
          onEnded={() => {
            setPlaying(false);
            setProgress(0);
            setTime(0);
          }}
        />

        {/* Кольцо прогресса: по нему же и перематываем */}
        <svg
          className="rec__ring"
          viewBox="0 0 100 100"
          ref={ringRef}
          onPointerDown={(event) => {
            event.stopPropagation();
            event.currentTarget.setPointerCapture(event.pointerId);
            setScrubbing(true);
            seekTo(event);
          }}
          onPointerMove={(event) => scrubbing && seekTo(event)}
          onPointerUp={(event) => {
            event.stopPropagation();
            setScrubbing(false);
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <circle className="rec__ring-track" cx="50" cy="50" r={R} />
          {/* Невидимая широкая полоса — за неё удобно хвататься пальцем */}
          <circle className="rec__ring-hit" cx="50" cy="50" r={R} />
          <circle
            className="rec__ring-line"
            cx="50"
            cy="50"
            r={R}
            style={{ strokeDasharray: ring, strokeDashoffset: ring * (1 - progress) }}
          />
        </svg>

        {(playing || time > 0) && (
          <span className="rec__timer">
            {clock(time)} / {clock(duration)}
          </span>
        )}

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
      </span>

    </span>
  );
}

/* Подобранный психолог приходит в ленту как собственная реплика:
   аватар с именем, видео-кружок, короткий рассказ о себе и действия. */
export default function RecommendationCard({ person, lead, onOpen, time }) {
  const nearest = nearestSlotLabel(person);
  const nearestShort = nearestSlotShort(person);

  return (
    <article className="msg rec">
      <div className="msg__head">
        <span className="msg__head-avatar">
          <Mark />
        </span>
        <b className="msg__head-name">InTreatment</b>
      </div>

      {lead && <p className="msg__body rec__lead">{lead}</p>}

      <VideoCircle person={person} />
      {person.video && <p className="rec__videohint">Видео-визитка · 30 секунд</p>}

      {/* Карточка по макету: имя сверху, снизу описание со ссылкой и плашки справа.
          Нажать можно на всю карточку целиком — откроется профиль */
      }
      <div
        className="rec__card rec__card--clickable"
        role="button"
        tabIndex={0}
        aria-label={`Открыть профиль: ${person.name}`}
        onClick={() => onOpen(person, "about")}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen(person, "about");
          }
        }}
      >
        <div className="rec__head">
          <b className="rec__name">{person.name}</b>
          <span className="rec__role">{person.role}</span>
        </div>

        <div className="rec__bottom">
          <div className="rec__col">
            <p className="rec__about">{person.about}</p>
            <button className="rec__more" type="button" onClick={() => onOpen(person, "about")}>
              Подробнее о психологе
            </button>
          </div>

          <div className="rec__meta">
            <span className="rec__price">{money(person.price)} • 1 час</span>
            {nearest ? (
              <button
                type="button"
                className="rec__price rec__price--action"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpen(person, "schedule");
                }}
              >
                <span className="is-wide">Ближайшая запись: {nearest}</span>
                <span className="is-narrow">Ближайшая: {nearestShort}</span>
              </button>
            ) : (
              <span className="rec__price">Ближайших дат нет</span>
            )}
          </div>
        </div>
      </div>

      {time && <time className="msg__time">{time}</time>}
    </article>
  );
}
