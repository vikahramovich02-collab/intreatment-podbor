import { Mark } from "./icons.jsx";

/* Логотип как на сайте: знак 20×13, при наведении точка облетает кольцо.
   Клик ведёт на главную. */
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

    </div>
  );
}
