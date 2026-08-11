import { useEffect, useRef, useState } from "react";
import { Mark, CloseIcon, ArrowLeft } from "./icons.jsx";
import { products } from "../data/products.js";
import { money } from "../lib/format.js";

/* Попап «Помощь прямо сейчас».
   Сначала — бесплатная экстренная помощь, и только ниже платные материалы:
   человеку в остром кризисе мы ничего не продаём.
   Шаги: список → карточка продукта → оплата → забрать. */
export default function HelpModal({ onClose, onBuy, focus = "list" }) {
  const [stage, setStage] = useState("list"); // list → product
  const [picked, setPicked] = useState(null);
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const productsRef = useRef(null);

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

  /* Из пункта «Самопомощь» открываем сразу на каталоге */
  useEffect(() => {
    if (focus === "products") {
      productsRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }, [focus]);

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

  const title = stage === "list" ? "Помощь прямо сейчас" : picked?.title || "";

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="modal modal--help" ref={panelRef} onKeyDown={onKeyDown}>
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
            {stage !== "list" && (
              <button
                className="funnel__back"
                type="button"
                onClick={() => setStage("list")}
              >
                <ArrowLeft /> К списку
              </button>
            )}
            <h2 id="help-title">{title}</h2>
            {stage === "list" && (
              <p className="modal__hero-role">
                Пока идёт подбор или ждёте первую встречу — вот что может поддержать.
              </p>
            )}
          </div>
        </div>

        <div className="modal__body">
          {stage === "list" && (
            <>
              <section className="section">
                <h3>Если сейчас небезопасно</h3>
                <p>
                  Если есть угроза жизни или здоровью — позвоните в экстренную службу вашего региона.
                  Это бесплатно и круглосуточно. InTreatment не заменяет кризисную помощь.
                </p>
                <div className="help-emergency">
                  <span>Экстренные службы — 112</span>
                  <span>Телефон доверия — 8 800 100 49 94</span>
                </div>
              </section>

              <section className="section" ref={productsRef}>
                <h3>Забрать сразу</h3>
                <div className="help-list">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className="help-card"
                      onClick={() => {
                        setPicked(product);
                        setStage("product");
                      }}
                    >
                      <span className="help-card__kind">{product.kind}</span>
                      <strong>{product.title}</strong>
                      <span className="help-card__meta">{product.meta}</span>
                      <span className="help-card__price">{money(product.price)}</span>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {stage === "product" && picked && (
            <>
              <section className="section">
                <h3>{picked.kind}</h3>
                <p>{picked.about}</p>
              </section>
              <section className="section">
                <h3>Кому подойдёт</h3>
                <p>{picked.forWhom}</p>
              </section>
              <section className="section">
                <h3>Что получите</h3>
                <p>{picked.deliver}</p>
                <p className="card__hint">{picked.meta}</p>
              </section>
            </>
          )}

        </div>

        <div className="modal__footer">
          {stage === "list" && (
            <button className="btn btn--quiet" type="button" onClick={onClose}>
              Закрыть
            </button>
          )}

          {stage === "product" && picked && (
            <>
              <button className="link" type="button" onClick={() => setStage("list")}>
                Посмотреть другое
              </button>
              <button
                className="btn btn--primary"
                type="button"
                onClick={() => {
                  onBuy(picked);
                  onClose();
                }}
              >
                <Mark />
                Забрать за {money(picked.price)}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
