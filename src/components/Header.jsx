import { Mark, CheckIcon } from "./icons.jsx";

/* Оплата и подтверждение происходят уже внутри платформы,
   поэтому в полосе прогресса только путь до входа. */
const FUNNEL_STEPS = [
  { id: "chat", label: "Подбор" },
  { id: "register", label: "Регистрация" },
];

function Steps({ current, onStep }) {
  const activeIndex = FUNNEL_STEPS.findIndex((step) => step.id === current);
  if (activeIndex < 0) return null;
  return (
    <div className="steps" aria-label={`Шаг ${activeIndex + 1} из ${FUNNEL_STEPS.length}`}>
      {FUNNEL_STEPS.map((step, index) => (
        <div key={step.id} style={{ display: "contents" }}>
          {index > 0 && <span className="steps__sep" aria-hidden="true" />}
          {/* На пройденные точки можно вернуться */}
          <span
            role={index < activeIndex && onStep ? "button" : undefined}
            tabIndex={index < activeIndex && onStep ? 0 : undefined}
            onClick={index < activeIndex && onStep ? () => onStep(step.id) : undefined}
            onKeyDown={
              index < activeIndex && onStep
                ? (event) => (event.key === "Enter" || event.key === " ") && onStep(step.id)
                : undefined
            }
            className={`steps__item ${index < activeIndex ? "is-done" : ""} ${
              index === activeIndex ? "is-active" : ""
            }`.trim()}
          >
            {index < activeIndex ? (
              <span className="steps__check" aria-hidden="true">
                <CheckIcon />
              </span>
            ) : (
              <span className="steps__dot" aria-hidden="true" />
            )}
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Header({ onBack, backLabel = "Назад", step, onLogin, onHelp, onStep }) {
  return (
    <header className="header">
      <div className="header__inner">
        {onBack ? (
          <button className="btn btn--ghost" type="button" onClick={onBack}>
            {backLabel}
          </button>
        ) : onHelp ? (
          <nav className="header__nav" aria-label="Быстрые разделы">
            <button type="button" onClick={() => onHelp("list")}>
              <span className="is-wide">Экстренная помощь</span>
              <span className="is-narrow">Помощь</span>
            </button>
            <button className="is-wide-only" type="button" onClick={() => onHelp("products")}>
              Продукты
            </button>
          </nav>
        ) : (
          <span />
        )}

        <a className="header__logo" href="/" aria-label="InTreatment, на главную">
          <Mark />
          InTreatment
        </a>

        <div className="header__right">
          <span className="header__hint">Уже есть аккаунт?</span>
          <button className="btn btn--quiet" type="button" onClick={onLogin}>
            <Mark />
            Войти
          </button>
        </div>
      </div>

      {step && (
        <div className="header__progress">
          <Steps current={step} onStep={onStep} />
        </div>
      )}
    </header>
  );
}
