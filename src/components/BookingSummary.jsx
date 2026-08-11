import { useEffect, useState } from "react";
import { ClockIcon } from "./icons.jsx";
import { money } from "../lib/format.js";

/* Слот держится 20 минут — это то, что видит клиент на регистрации и оплате. */
export function HoldTimer({ startedAt, minutes = 20 }) {
  const [left, setLeft] = useState(minutes * 60);

  useEffect(() => {
    const tick = () => {
      const passed = Math.floor((Date.now() - startedAt) / 1000);
      setLeft(Math.max(0, minutes * 60 - passed));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [startedAt, minutes]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="note hold">
      <ClockIcon width="16" height="16" />
      <span>
        {left > 0 ? "Время зарезервировано за вами" : "Время резерва истекло — выберите слот заново"}
      </span>
      {left > 0 && (
        <span className="hold__time" aria-live="off">
          {mm}:{ss}
        </span>
      )}
    </div>
  );
}

export default function BookingSummary({ order, total, children }) {
  const isSession = order.kind === "session";
  return (
    <div className="summary__card">
      <div className="summary__person">
        {isSession ? (
          <>
            <span className="avatar">
              <img src={order.person.photo} alt="" />
            </span>
            <div>
              <strong>{order.person.name}</strong>
              <span>{order.person.role}</span>
            </div>
          </>
        ) : (
          <div>
            <strong>{order.title}</strong>
            <span>{order.product.kind}</span>
          </div>
        )}
      </div>

      <dl className="summary__rows">
        {isSession ? (
          <>
            <div className="summary__row">
              <dt>Дата</dt>
              <dd>{order.day.label}</dd>
            </div>
            <div className="summary__row">
              <dt>Время</dt>
              <dd>{order.slot}</dd>
            </div>
            <div className="summary__row">
              <dt>Формат</dt>
              <dd>Онлайн · 1 час</dd>
            </div>
          </>
        ) : (
          <div className="summary__row">
            <dt>Что получите</dt>
            <dd>{order.product.meta}</dd>
          </div>
        )}
      </dl>

      <div className="summary__total">
        <span>К оплате</span>
        <strong>{money(total ?? order.price)}</strong>
      </div>

      {children}
    </div>
  );
}
