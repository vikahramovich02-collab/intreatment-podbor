import { useState } from "react";
import Header from "../components/Header.jsx";
import BookingSummary, { HoldTimer } from "../components/BookingSummary.jsx";
import { ArrowLeft } from "../components/icons.jsx";

/* Вход по почте или через Яндекс ID / VK ID. */
export default function RegisterScreen({ order, holdStartedAt, onBack, onDone }) {
  const [email, setEmail] = useState("");

  return (
    <div className="app">
      <Header onBack={onBack} backLabel="Назад" />

      <main className="funnel register">
        <div className="column funnel__column">
          <div className="layout-2col">
            <div>
              <div className="funnel__head">
                <button className="funnel__back" type="button" onClick={onBack}>
                  <ArrowLeft /> {order.kind === "session" ? "К выбору времени" : "К самопомощи"}
                </button>
                <h1 className="funnel__title">Создайте аккаунт</h1>
                <p className="funnel__sub">
                  {order.kind === "session"
                    ? "Аккаунт нужен, чтобы сохранить запись, прислать ссылку на встречу и дать доступ к личному кабинету."
                    : "Аккаунт нужен, чтобы материал сохранился в личном кабинете и был доступен в любой момент."}
                </p>
              </div>

              <div className="card">
                <form
                  className="field-stack"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (email.includes("@")) onDone({ method: "email", email });
                  }}
                >
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
                  <p className="card__hint" style={{ marginTop: 0 }}>
                    Подойдёт почта российского сервиса — например @yandex.ru, @mail.ru,
                    @bk.ru или @vk.com.
                  </p>
                  <button
                    className="btn btn--primary btn--lg btn--wide"
                    type="submit"
                    disabled={!email.includes("@")}
                  >
                    Войти
                  </button>
                </form>

                <div className="divider">или войти через</div>

                <div className="auth__providers">
                  <button
                    className="provider"
                    type="button"
                    onClick={() => onDone({ method: "yandex", email: "client@yandex.ru" })}
                  >
                    <span className="provider__badge provider__badge--ya">Я</span>
                    Продолжить с Яндекс ID
                  </button>
                  <button
                    className="provider"
                    type="button"
                    onClick={() => onDone({ method: "vk", email: "client@vk.com" })}
                  >
                    <span className="provider__badge provider__badge--vk">VK</span>
                    Продолжить с VK ID
                  </button>
                </div>

                <p className="legal">
                  Продолжая, вы соглашаетесь с условиями сервиса и политикой конфиденциальности.
                  Мы не передаём данные о запросе третьим лицам.
                </p>
              </div>
            </div>

            <aside className="summary">
              <BookingSummary order={order} />
              {holdStartedAt && <HoldTimer startedAt={holdStartedAt} />}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
