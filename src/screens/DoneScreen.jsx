import Header from "../components/Header.jsx";
import { CheckIcon } from "../components/icons.jsx";
import { money } from "../lib/format.js";

export default function DoneScreen({ order, payment, onEnter, onHome }) {
  const isSession = order.kind === "session";
  const { name } = order;

  return (
    <div className="app">
      <Header onHome={onHome} />

      <main className="funnel">
        <div className="column">
          <div className="done">
            <div className="done__mark" aria-hidden="true">
              <CheckIcon />
            </div>
            <h1 className="funnel__title">
              {isSession
                ? name
                  ? `${name}, встреча запланирована`
                  : "Встреча запланирована"
                : "Материал у вас"}
            </h1>
            <p className="funnel__sub" style={{ margin: "10px auto 0" }}>
              {isSession
                ? "Оплата прошла, время закреплено за вами. Ссылку на видеовстречу и напоминание пришлём заранее."
                : "Оплата прошла — материал доступен в личном кабинете в любой момент."}
            </p>

            <div className="done__card">
              <div className="summary__person">
                {isSession && (
                  <span className="avatar">
                    <img src={order.person.photo} alt="" />
                  </span>
                )}
                <div>
                  <strong>{isSession ? order.person.name : order.title}</strong>
                  <span>{isSession ? order.person.role : order.product.kind}</span>
                </div>
              </div>
              <dl className="summary__rows" style={{ borderBottom: "none" }}>
                <div className="summary__row">
                  <dt>{isSession ? "Когда" : "Что получили"}</dt>
                  <dd>{isSession ? `${order.day.label}, ${order.slot}` : order.product.meta}</dd>
                </div>
                <div className="summary__row">
                  <dt>Оплачено</dt>
                  <dd>{money(payment.total)}</dd>
                </div>
              </dl>
            </div>

            <div className="done__actions">
              <button className="btn btn--primary btn--lg" type="button" onClick={onEnter}>
                Вернуться на платформу
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
