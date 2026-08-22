import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Mark } from "./icons.jsx";
import { money, nearestSlotLabel, nearestSlotShort } from "../lib/format.js";

/* Видео-визитка психолога — паттерн телеграмного кружка:
   в ленте играет сама и без звука, время подписью сбоку;
   по тапу разворачивается на весь экран со звуком, кольцом прогресса
   и перемоткой перетаскиванием по кольцу. */
function VideoCircle({ person }) {
  const smallRef = useRef(null);
  const bigRef = useRef(null);
  const ringRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);

  /* Одновременно в ленте играет только один кружок */
  function stopOthers(current) {
    document.querySelectorAll(".rec__circle--video video").forEach((other) => {
      if (other !== current) other.pause();
    });
  }

  /* Карточка пришла в ленту — визитка стартует сама. Без звука:
     так браузеры разрешают автозапуск, звук включается при развороте. */
  useEffect(() => {
    const node = smallRef.current;
    if (!node) return;
    stopOthers(node);
    node.play().catch(() => {});
  }, []);

  /* Развернули — продолжаем с того же места, уже со звуком */
  useEffect(() => {
    if (!open) return undefined;
    const small = smallRef.current;
    const big = bigRef.current;
    if (big && small) {
      big.currentTime = small.currentTime;
      small.pause();
      big.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
    const onKey = (event) => event.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  if (!person.video) {
    return (
      <span className="rec__circle">
        <img src={person.photo} alt="" />
      </span>
    );
  }

  const close = () => {
    const small = smallRef.current;
    const big = bigRef.current;
    if (small && big) {
      small.currentTime = big.currentTime;
      small.play().catch(() => {});
    }
    setOpen(false);
    setPlaying(false);
  };

  const toggle = () => {
    const node = bigRef.current;
    if (!node) return;
    if (node.paused) {
      node.play();
      setPlaying(true);
    } else {
      node.pause();
      setPlaying(false);
    }
  };

  /* Позицию берём по углу от центра кольца: 12 часов — начало записи */
  const seekTo = (event) => {
    const node = bigRef.current;
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

  const onTime = (event) => {
    const node = event.currentTarget;
    if (!node.duration) return;
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
        className="rec__circle rec__circle--video"
        role="button"
        tabIndex={0}
        aria-label={`Смотреть видео-визитку: ${person.name}`}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <video
          ref={smallRef}
          src={person.video}
          poster={person.photo}
          playsInline
          muted
          preload="metadata"
          onTimeUpdate={(event) => !open && setTime(event.currentTarget.currentTime)}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
          onEnded={(event) => {
            event.currentTarget.currentTime = 0;
            setTime(0);
          }}
        />
        <span className="rec__mute" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path
              d="M4 9.5h3l4-3.2v11.4l-4-3.2H4z"
              fill="currentColor"
            />
            <path
              d="M15 9.5l4 5M19 9.5l-4 5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </span>
      </span>

      {/* Подпись со временем — сбоку от кружка, как в телеграме */}
      <span className="rec__timer">{clock(time)}</span>

      {/* Разворот живёт в body: внутри ленты сообщений fixed «прилипает» к её боксу */}
      {open &&
        createPortal(
          <div className="videoview" role="dialog" aria-label={`Видео-визитка: ${person.name}`}>
          <button className="videoview__scrim" type="button" aria-label="Закрыть" onClick={close} />

          <div className="videoview__stage">
            <span
              className="videoview__circle"
              role="button"
              tabIndex={0}
              aria-label={playing ? "Пауза" : "Смотреть"}
              onClick={toggle}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggle();
                }
              }}
            >
              <video
                ref={bigRef}
                src={person.video}
                poster={person.photo}
                playsInline
                preload="metadata"
                onTimeUpdate={onTime}
                onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
                onEnded={() => {
                  setPlaying(false);
                  setProgress(0);
                }}
              />

              {/* Кольцо прогресса: по нему же и перематываем */}
              <svg
                className="videoview__ring"
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
                <circle className="rec__ring-hit" cx="50" cy="50" r={R} />
                <circle
                  className="rec__ring-line"
                  cx="50"
                  cy="50"
                  r={R}
                  style={{ strokeDasharray: ring, strokeDashoffset: ring * (1 - progress) }}
                />
              </svg>

              {!playing && (
                <span className="rec__play" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M9 6.5l9 5.5-9 5.5z" fill="currentColor" />
                  </svg>
                </span>
              )}
            </span>

            <div className="videoview__bar">
              <span className="videoview__time">
                {clock(time)} / {clock(duration)}
              </span>
              <span className="videoview__name">{person.name}</span>
            </div>
          </div>

            <button className="videoview__close" type="button" onClick={close} aria-label="Закрыть">
              <svg viewBox="0 0 24 24">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </button>
          </div>,
          document.body
        )}
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
