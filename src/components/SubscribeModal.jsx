import { useEffect, useRef, useState } from "react";
import { Mark, CloseIcon, CheckIcon } from "./icons.jsx";

/* Подписка на рассылку: почта нужна, чтобы прислать подборку и материалы
   тем, кто ещё не дошёл до оплаты (потенциальный клиент). */
export default function SubscribeModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const panelRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;
    const focusable = [
      ...panelRef.current.querySelectorAll("button:not([disabled]), a[href], input:not([disabled])"),
    ];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscribe-title"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="modal modal--narrow" ref={panelRef} onKeyDown={onKeyDown}>
        <button
          ref={closeRef}
          className="modal__close"
          type="button"
          aria-label="Закрыть"
          onClick={onClose}
        >
          <CloseIcon />
        </button>

        <div className="modal__hero modal__hero--plain">
          <div>
            <h2 id="subscribe-title">{sent ? "Готово" : "Подборка на почту"}</h2>
            <p className="modal__hero-role">
              {sent
                ? `Пришлём подборку и материалы на ${email}.`
                : "Пришлём подборку специалистов и полезные материалы — читать можно в своём темпе."}
            </p>
          </div>
        </div>

        <div className="modal__body">
          <section className="section">
            {sent ? (
              <div className="done__mark" aria-hidden="true">
                <CheckIcon />
              </div>
            ) : (
              <>
                <label className="field">
                  <span>Электронная почта</span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                  />
                </label>
                <p className="legal">
                  Оставляя почту, вы соглашаетесь получать письма от InTreatment и с политикой
                  конфиденциальности. Отписаться можно в любой момент.
                </p>
              </>
            )}
          </section>
        </div>

        <div className="modal__footer">
          {sent ? (
            <button className="btn btn--primary" type="button" onClick={onClose}>
              <Mark />
              Вернуться в чат
            </button>
          ) : (
            <>
              <button className="modal__quiet" type="button" onClick={onClose}>
                Не сейчас
              </button>
              <button
                className="btn btn--primary"
                type="button"
                disabled={!email.includes("@")}
                onClick={() => setSent(true)}
              >
                <Mark />
                Подписаться
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
