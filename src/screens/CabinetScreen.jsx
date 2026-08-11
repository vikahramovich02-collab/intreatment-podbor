import { useState } from "react";
import Header from "../components/Header.jsx";
import { HoldTimer } from "../components/BookingSummary.jsx";
import { money } from "../lib/format.js";

/* Личный кабинет — точка, в которой заканчивается путь подбора и начинается
   платформа. Оплата происходит уже здесь: до неё запись висит неоплаченной. */
export default function CabinetScreen({ order, payment, holdStartedAt, onPay, onRestart }) {
  const [tab, setTab] = useState("next");
  const isSession = order.kind === "session";
  const { name } = order;

  return (
    <div className="app">
      <Header />

      <main className="funnel">
        <div className="column" style={{ maxWidth: 1120 }}>
          <div className="funnel__head">
            <h1 className="funnel__title">{name ? `Здравствуйте, ${name}` : "Личный кабинет"}</h1>
            <p className="funnel__sub">
              Здесь ближайшая встреча, история сессий, оплаты и повторный подбор специалиста.
            </p>
          </div>

          <div className="cabinet">
            <nav className="cabinet__nav" aria-label="Разделы кабинета">
              <span className="cabinet__nav-title">Основное</span>
              {[
                ["next", "Ближайшая встреча"],
                ["history", "История встреч"],
                ["payments", "Оплаты и документы"],
                ["match", "Повторный подбор"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={tab === id ? "is-active" : ""}
                  onClick={() => setTab(id)}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div>
              {tab === "next" && (
                <>
                  <div className="cabinet__session">
                    {isSession && (
                      <span className="avatar">
                        <img src={order.person.photo} alt="" />
                      </span>
                    )}
                    <div>
                      <strong>{isSession ? order.person.name : order.title}</strong>
                      <span>{order.meta}</span>
                    </div>
                    <b>{money(payment ? payment.total : order.price)}</b>
                  </div>

                  {payment ? (
                    <>
                      <div className="card">
                        <h2>Что дальше</h2>
                        <ul className="list">
                          <li>За 15 минут до начала пришлём ссылку на видеовстречу.</li>
                          <li>Перенести или отменить встречу можно за 24 часа до начала.</li>
                          <li>После первой сессии здесь появится история следующих записей.</li>
                        </ul>
                      </div>
                      <div className="note" style={{ marginTop: 16 }}>
                        Если перед встречей станет тревожно — это нормально. Можно написать
                        специалисту прямо из кабинета.
                      </div>
                    </>
                  ) : (
                    <div className="card cabinet__unpaid">
                      <h2>{isSession ? "Запись ждёт оплаты" : "Материал ждёт оплаты"}</h2>
                      <p className="card__hint" style={{ marginTop: 0 }}>
                        {isSession
                          ? "Время держим за вами. После оплаты пришлём ссылку на встречу и напоминание."
                          : "После оплаты материал появится здесь — им можно пользоваться в любой момент."}
                      </p>
                      <button className="btn btn--primary" type="button" onClick={onPay}>
                        Оплатить {money(order.price)}
                      </button>
                      {holdStartedAt && <HoldTimer startedAt={holdStartedAt} />}
                    </div>
                  )}
                </>
              )}

              {tab === "history" && (
                <div className="card">
                  <h2>История встреч</h2>
                  <p className="card__hint" style={{ marginTop: 0 }}>
                    Пока пусто — первая встреча ещё впереди.
                  </p>
                </div>
              )}

              {tab === "payments" && (
                <div className="card">
                  <h2>Оплаты и документы</h2>
                  {payment ? (
                    <ul className="list">
                      <li>
                        {order.title} · {money(payment.total)} · чек отправлен на почту
                      </li>
                    </ul>
                  ) : (
                    <p className="card__hint" style={{ marginTop: 0 }}>
                      Пока пусто — встреча ещё не оплачена.
                    </p>
                  )}
                </div>
              )}

              {tab === "match" && (
                <div className="card">
                  <h2>Повторный подбор</h2>
                  <p className="card__hint" style={{ marginTop: 0, marginBottom: 16 }}>
                    Если специалист не подошёл — можно пройти подбор ещё раз, запрос уже сохранён.
                  </p>
                  <button className="btn btn--primary" type="button" onClick={onRestart}>
                    Подобрать другого психолога
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
