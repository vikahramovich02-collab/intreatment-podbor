import Header from "../components/Header.jsx";
import { CheckIcon } from "../components/icons.jsx";
import { money } from "../lib/format.js";

export default function DoneScreen({ booking, payment, onEnter, onRestart }) {
  const { person, day, slot, name } = booking;

  return (
    <div className="app">
      <Header step="done" />

      <main className="funnel">
        <div className="column">
          <div className="done">
            <div className="done__mark" aria-hidden="true">
              <CheckIcon />
            </div>
            <h1 className="funnel__title">
              {name ? `${name}, встреча запланирована` : "Встреча запланирована"}
            </h1>
            <p className="funnel__sub" style={{ margin: "10px auto 0" }}>
              Оплата прошла, время закреплено за вами. Ссылку на видеовстречу и напоминание
              пришлём заранее.
            </p>

            <div className="done__card">
              <div className="summary__person">
                <span className="avatar">
                  <img src={person.photo} alt="" />
                </span>
                <div>
                  <strong>{person.name}</strong>
                  <span>{person.role}</span>
                </div>
              </div>
              <dl className="summary__rows" style={{ borderBottom: "none" }}>
                <div className="summary__row">
                  <dt>Когда</dt>
                  <dd>
                    {day.label}, {slot}
                  </dd>
                </div>
                <div className="summary__row">
                  <dt>Формат</dt>
                  <dd>Онлайн · 50 минут</dd>
                </div>
                <div className="summary__row">
                  <dt>Оплачено</dt>
                  <dd>{money(payment.total)}</dd>
                </div>
              </dl>
            </div>

            <div className="done__actions">
              <button className="btn btn--primary btn--lg" type="button" onClick={onEnter}>
                Войти на платформу
              </button>
              <button className="btn btn--ghost" type="button" onClick={onRestart}>
                Пройти подбор заново
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
