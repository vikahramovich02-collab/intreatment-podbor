import { Mark } from "./icons.jsx";

/* Логотип как на сайте: знак 20×13, при наведении точка облетает кольцо.
   Клик ведёт на главную, словарная карточка раскрывается по наведению
   (на тач-устройствах её не показываем — там логотип просто ссылка). */
export default function Logo({ onHome }) {
  return (
    <div className="logo">
      <button className="logo__link" type="button" onClick={onHome} aria-label="InTreatment, на главную">
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
        <span className="logo__text">InTreatment</span>
      </button>

      <span className="term-card" role="tooltip">
        <span className="term-card__head">
          <span className="term-card__ipa">[ИН&nbsp;ТРИ́ТМЭНТ]</span>
        </span>
        <span className="term-card__body">
          <span>
            Мы&nbsp;вдохновились названием сериала InTreatment, которое дословно переводится
            «В&nbsp;терапии»&nbsp;— сюжет каждой серии разворачивается в&nbsp;кабинете психолога.
          </span>
          <span>Обычно «Я&nbsp;в&nbsp;терапии» говорят, когда регулярно ходят к&nbsp;психологу.</span>
          <span>
            Мы&nbsp;и&nbsp;сами в&nbsp;терапии. Это влияет на&nbsp;каждого из&nbsp;нас
            в&nbsp;отдельности и&nbsp;на&nbsp;качество отношений внутри проекта. И, конечно,
            на&nbsp;качество работы&nbsp;— ничто не&nbsp;развивает специалиста лучше, чем его личная
            терапия.
          </span>
        </span>
      </span>
    </div>
  );
}
