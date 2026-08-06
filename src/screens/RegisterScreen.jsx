import { useRef, useState } from "react";
import Header from "../components/Header.jsx";
import BookingSummary, { HoldTimer } from "../components/BookingSummary.jsx";
import { ArrowLeft } from "../components/icons.jsx";

const DEMO_CODE = "1234";

export default function RegisterScreen({ booking, holdStartedAt, onBack, onDone }) {
  const [stage, setStage] = useState("phone"); // phone → code
  const [phone, setPhone] = useState("+375 ");
  const [code, setCode] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const codeRefs = useRef([]);

  const digits = phone.replace(/\D/g, "");
  const phoneValid = digits.length >= 11;

  const requestCode = (event) => {
    event.preventDefault();
    if (!phoneValid) {
      setError("Проверьте номер телефона — нужно 11–12 цифр.");
      return;
    }
    setError("");
    setStage("code");
    requestAnimationFrame(() => codeRefs.current[0]?.focus());
  };

  const changeDigit = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    setError("");
    if (digit && index < 3) codeRefs.current[index + 1]?.focus();
    if (next.every(Boolean)) confirm(next.join(""));
  };

  const confirm = (value) => {
    if (value !== DEMO_CODE) {
      setError(`Код не подошёл. В прототипе он всегда ${DEMO_CODE}.`);
      return;
    }
    onDone({ phone, method: "phone" });
  };

  return (
    <div className="app">
      <Header step="register" onBack={onBack} backLabel="Назад" />

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

              {stage === "phone" ? (
                <form className="card" onSubmit={requestCode} noValidate>
                  <h2>Номер телефона</h2>
                  <div className="field-stack">
                    <label className="field">
                      <span>Телефон</span>
                      <input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={phone}
                        aria-invalid={Boolean(error)}
                        onChange={(event) => {
                          setPhone(event.target.value);
                          setError("");
                        }}
                        placeholder="+375 29 000 00 00"
                      />
                    </label>
                    {error && (
                      <p className="form-error" role="alert">
                        {error}
                      </p>
                    )}
                    <button className="btn btn--primary btn--lg btn--wide" type="submit">
                      Получить код
                    </button>
                  </div>

                  <div className="divider">или</div>

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
                </form>
              ) : (
                <div className="card">
                  <h2>Введите код из СМС</h2>
                  <p className="card__hint" style={{ marginTop: 0, marginBottom: 16 }}>
                    Отправили четыре цифры на {phone}. В прототипе код — {DEMO_CODE}.
                  </p>
                  <div className="code-inputs">
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        ref={(node) => (codeRefs.current[index] = node)}
                        value={digit}
                        inputMode="numeric"
                        maxLength={1}
                        aria-label={`Цифра ${index + 1}`}
                        onChange={(event) => changeDigit(index, event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Backspace" && !code[index] && index > 0) {
                            codeRefs.current[index - 1]?.focus();
                          }
                        }}
                      />
                    ))}
                  </div>
                  {error && (
                    <p className="form-error" role="alert" style={{ marginTop: 12 }}>
                      {error}
                    </p>
                  )}
                  <p className="card__hint">
                    <button className="link" type="button" onClick={() => setStage("phone")}>
                      Изменить номер
                    </button>
                  </p>
                </div>
              )}
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
