import { useState } from "react";
import Header from "../components/Header.jsx";
import { HoldTimer } from "../components/BookingSummary.jsx";
import { ArrowLeft, ChevronRight, CardIcon } from "../components/icons.jsx";
import { money } from "../lib/format.js";

const PROMO = { FIRST: 0.1 }; // демо-промокод: −10%

const METHODS = [
  { id: "ru", label: "Карта РФ или МИР" },
  { id: "foreign", label: "Зарубежная карта" },
  { id: "sbp", label: "СБП" },
];

/* Компактный чек: кто и когда, способ оплаты, стоимость, промокод, итог.
   Данные карты просим только на шаге оплаты, чтобы экран не пугал формой. */
export default function CheckoutScreen({ booking, holdStartedAt, onBack, onPaid }) {
  const [method, setMethod] = useState("ru");
  const [promoOpen, setPromoOpen] = useState(false);
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoNote, setPromoNote] = useState("");
  const [cardOpen, setCardOpen] = useState(false);
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const { person, day, slot } = booking;
  const total = Math.round(person.price * (1 - discount));
  const needsCard = method !== "sbp";

  const applyPromo = () => {
    const rate = PROMO[promo.trim().toUpperCase()];
    if (rate) {
      setDiscount(rate);
      setPromoNote(`Промокод применён: −${rate * 100}%`);
    } else {
      setDiscount(0);
      setPromoNote("Такого промокода нет. В прототипе работает FIRST.");
    }
  };

  const formatCard = (value) =>
    value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits;
  };

  const fillDemo = () => {
    if (card) return;
    setCard("4242 4242 4242 4242");
    setExpiry("12 / 30");
    setCvc("123");
    setEmail((value) => value || "demo@intreatment.ru");
  };

  const pay = () => {
    setPending(true);
    setTimeout(() => onPaid({ total, method }), 900);
  };

  const submit = (event) => {
    event.preventDefault();
    if (!needsCard) {
      pay();
      return;
    }
    if (!cardOpen) {
      setCardOpen(true);
      return;
    }
    if (
      card.replace(/\D/g, "").length !== 16 ||
      expiry.replace(/\D/g, "").length !== 4 ||
      cvc.length !== 3 ||
      !email.includes("@")
    ) {
      setError("Проверьте данные карты и email для чека.");
      return;
    }
    setError("");
    pay();
  };

  const actionLabel = pending
    ? "Проводим оплату…"
    : needsCard && !cardOpen
    ? "Добавить карту и записаться"
    : `Оплатить ${money(total)}`;

  return (
    <div className="app">
      <Header step="checkout" onBack={onBack} backLabel="Назад" />

      <main className="funnel">
        <div className="column">
          <div className="checkout">
            <button className="funnel__back" type="button" onClick={onBack}>
              <ArrowLeft /> К регистрации
            </button>

            <form className="checkout__card" onSubmit={submit} noValidate>
              <div className="checkout__person">
                <span className="avatar">
                  <img src={person.photo} alt="" />
                </span>
                <div>
                  <strong>{person.name}</strong>
                  <span>
                    {day.label} в {slot}
                  </span>
                </div>
              </div>

              <label className="checkout__select">
                <CardIcon />
                <select
                  aria-label="Способ оплаты"
                  value={method}
                  onChange={(event) => setMethod(event.target.value)}
                >
                  {METHODS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              {cardOpen && needsCard && (
                <div className="field-stack checkout__fields">
                  <label className="field">
                    <span>Номер карты</span>
                    <input
                      inputMode="numeric"
                      autoComplete="cc-number"
                      value={card}
                      onFocus={fillDemo}
                      onChange={(event) => setCard(formatCard(event.target.value))}
                      placeholder="0000 0000 0000 0000"
                      aria-invalid={Boolean(error)}
                    />
                  </label>
                  <div className="field-row">
                    <label className="field">
                      <span>Срок действия</span>
                      <input
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        value={expiry}
                        onChange={(event) => setExpiry(formatExpiry(event.target.value))}
                        placeholder="ММ / ГГ"
                        aria-invalid={Boolean(error)}
                      />
                    </label>
                    <label className="field">
                      <span>CVC</span>
                      <input
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        value={cvc}
                        onChange={(event) =>
                          setCvc(event.target.value.replace(/\D/g, "").slice(0, 3))
                        }
                        placeholder="000"
                        aria-invalid={Boolean(error)}
                      />
                    </label>
                  </div>
                  <label className="field">
                    <span>Email для чека</span>
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@example.com"
                      aria-invalid={Boolean(error)}
                    />
                  </label>
                </div>
              )}

              <div className="checkout__row">
                <span>Сессия, 50 мин</span>
                <span>{money(person.price)}</span>
              </div>

              {promoOpen ? (
                <div className="inline-field checkout__promo">
                  <label className="field" style={{ flex: 1 }}>
                    <span className="sr-only">Промокод</span>
                    <input
                      value={promo}
                      onChange={(event) => setPromo(event.target.value)}
                      placeholder="Введите промокод"
                    />
                  </label>
                  <button className="btn btn--outline" type="button" onClick={applyPromo}>
                    Применить
                  </button>
                </div>
              ) : (
                <button
                  className="checkout__promo-open"
                  type="button"
                  onClick={() => setPromoOpen(true)}
                >
                  Активировать промокод
                  <ChevronRight />
                </button>
              )}
              {promoNote && <p className="card__hint">{promoNote}</p>}

              <div className="checkout__total">
                <span>Итого</span>
                <strong>{money(total)}</strong>
              </div>

              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}

              <button
                className="btn btn--primary btn--lg btn--wide"
                type="submit"
                disabled={pending}
              >
                {actionLabel}
              </button>

              <p className="legal">
                Записываясь на сессию, вы соглашаетесь с условиями сервиса и политикой
                конфиденциальности. Это демо-экран — деньги не списываются.
              </p>
            </form>

            <HoldTimer startedAt={holdStartedAt} />
          </div>
        </div>
      </main>
    </div>
  );
}
