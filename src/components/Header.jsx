import { Mark } from "./icons.jsx";

/* Оплата и подтверждение происходят уже внутри платформы,
   поэтому в полосе прогресса только путь до входа. */
export default function Header({ onBack, backLabel = "Назад", onLogin, onHelp }) {
  return (
    <header className="header">
      <div className="header__inner">
        {onBack ? (
          <button className="btn btn--ghost" type="button" onClick={onBack}>
            {backLabel}
          </button>
        ) : onHelp ? (
          <nav className="header__nav" aria-label="Быстрые разделы">
            {/* Экстренная помощь живёт первым блоком внутри этого же попапа */}
            <button type="button" onClick={() => onHelp("list")}>
              Самопомощь
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

    </header>
  );
}
