import { useEffect, useRef, useState } from "react";

/* Логотип как на сайте: знак 20×13, при наведении точка облетает кольцо,
   по клику на слово раскрывается словарная карточка [ИН ТРИ́ТМЭНТ]. */
export default function Logo() {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const speak = (event) => {
    event.stopPropagation();
    if (!window.speechSynthesis) return;
    const phrase = new SpeechSynthesisUtterance("In Treatment");
    phrase.lang = "en-US";
    setPlaying(true);
    phrase.onend = () => setPlaying(false);
    window.speechSynthesis.speak(phrase);
  };

  return (
    <div className="logo" ref={wrapRef}>
      <span className="logo__icon" aria-hidden="true">
        <svg viewBox="0 0 20 13" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle className="logo__dot" cx="4.5" cy="6.5" r="4" fill="#2d2c2a" />
          <circle
            className="logo__ring"
            cx="14.5"
            cy="6.5"
            r="5"
            stroke="#2d2c2a"
            strokeWidth="1"
            strokeDasharray="1 1"
            fill="none"
          />
        </svg>
      </span>

      <button
        className="logo__text"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        InTreatment
      </button>

      {open && (
        <div className="term-card" role="tooltip">
          <div className="term-card__head">
            <span className="term-card__ipa">[ИН&nbsp;ТРИ́ТМЭНТ]</span>
            <button
              className={`term-card__speaker ${playing ? "is-playing" : ""}`.trim()}
              type="button"
              aria-label="Прослушать произношение"
              onClick={speak}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
                <path d="M4 9v6h4l5 4V5L8 9H4z" fill="#2d2c2a" />
                <path d="M16 8.5a5 5 0 010 7" stroke="#2d2c2a" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M18.5 6a8.5 8.5 0 010 12" stroke="#2d2c2a" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="term-card__body">
            <span>
              Мы&nbsp;вдохновились названием сериала InTreatment, которое дословно переводится
              «В&nbsp;терапии»&nbsp;— сюжет каждой серии разворачивается в&nbsp;кабинете психолога.
            </span>
            <span>Обычно «Я&nbsp;в&nbsp;терапии» говорят, когда регулярно ходят к&nbsp;психологу.</span>
            <span>
              Мы&nbsp;и&nbsp;сами в&nbsp;терапии. Это влияет на&nbsp;каждого из&nbsp;нас
              в&nbsp;отдельности и&nbsp;на&nbsp;качество отношений внутри проекта. И, конечно,
              на&nbsp;качество работы&nbsp;— ничто не&nbsp;развивает специалиста лучше, чем его
              личная терапия.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
