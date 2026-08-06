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

export default function BookingSummary({ booking, total, children }) {
  const { person, day, slot } = booking;
  return (
    <div className="summary__card">
      <div className="summary__person">
        <span className="avatar">
          <img src={person.photo} alt="" />
        </span>
        <div>
          <strong>{person.name}</strong>
          <span>{person.role}</span>
        </div>
      </div>

      <dl className="summary__rows">
        <div className="summary__row">
          <dt>Дата</dt>
          <dd>{day.label}</dd>
        </div>
        <div className="summary__row">
          <dt>Время</dt>
          <dd>{slot}</dd>
        </div>
        <div className="summary__row">
          <dt>Формат</dt>
          <dd>Онлайн · 50 минут</dd>
        </div>
      </dl>

      <div className="summary__total">
        <span>К оплате</span>
        <strong>{money(total ?? person.price)}</strong>
      </div>

      {children}
    </div>
  );
}
