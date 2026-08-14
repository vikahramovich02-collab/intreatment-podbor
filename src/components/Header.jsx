import { useState } from "react";
import { Mark } from "./icons.jsx";

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Header({ onBack, backLabel = "Назад", onLogin, onHelp }) {
  const [menuOpen, setMenuOpen] = useState(false);

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

        {/* На телефоне разделы прячутся в меню */}
        <button
          className="header__burger"
          type="button"
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <MenuIcon />
        </button>
      </div>

      {menuOpen && (
        <div className="header__menu">
          {onHelp && (
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onHelp("list");
              }}
            >
              Самопомощь
            </button>
          )}
          {onBack && (
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onBack();
              }}
            >
              {backLabel}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onLogin?.();
            }}
          >
            Войти
          </button>
        </div>
      )}
    </header>
  );
}
