import { Mark } from "./icons.jsx";
import Logo from "./Logo.jsx";

function LoginIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M15 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3M10 17l5-5-5-5M15 12H3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Header({ onBack, backLabel = "Назад", onLogin, onHelp, onHome }) {
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

        <div className="header__logo">
          <Logo onHome={onHome} />
        </div>

        <div className="header__right">
          <span className="header__hint">Уже есть аккаунт?</span>
          <button className="btn btn--quiet" type="button" onClick={onLogin}>
            <Mark />
            Войти
          </button>
          {/* На телефоне вход — иконкой рядом с «Самопомощь» */}
          <button className="header__login" type="button" aria-label="Войти" onClick={onLogin}>
            <LoginIcon />
          </button>
        </div>
      </div>
    </header>
  );
}
