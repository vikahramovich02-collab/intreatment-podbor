import Header from "../components/Header.jsx";
import BookingSummary, { HoldTimer } from "../components/BookingSummary.jsx";
import { ArrowLeft } from "../components/icons.jsx";

/* Вход только через Яндекс ID или VK ID — регистрации по телефону нет. */
export default function RegisterScreen({ booking, holdStartedAt, onBack, onDone, onStep }) {
  return (
    <div className="app">
      <Header step="register" onBack={onBack} backLabel="Назад" onStep={onStep} />

      <main className="funnel">
        <div className="column funnel__column">
          <div className="layout-2col">
            <div>
              <div className="funnel__head">
                <button className="funnel__back" type="button" onClick={onBack}>
                  <ArrowLeft /> К выбору времени
                </button>
                <h1 className="funnel__title">Создайте аккаунт</h1>
                <p className="funnel__sub">
                  Аккаунт нужен, чтобы сохранить запись, прислать ссылку на встречу и дать доступ к
                  личному кабинету.
                </p>
              </div>

              <div className="card">
                <div className="auth__providers">
                  <button
                    className="provider"
                    type="button"
                    onClick={() => onDone({ method: "yandex" })}
                  >
                    <span className="provider__badge provider__badge--ya">Я</span>
                    Продолжить с Яндекс ID
                  </button>
                  <button
                    className="provider"
                    type="button"
                    onClick={() => onDone({ method: "vk" })}
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
              <BookingSummary booking={booking} />
              <HoldTimer startedAt={holdStartedAt} />
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
