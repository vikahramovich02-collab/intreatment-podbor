import { useEffect, useState } from "react";
import { Mark, CheckIcon, ArrowLeft } from "./icons.jsx";
import SubscribeModal from "./SubscribeModal.jsx";

const NONE_LABEL = "Ничего из этого";

export default function Composer({
  options = [],
  mode = "single",
  submitLabel = "Продолжить",
  placeholder = "Расскажите..",
  disabled = false,
  draft = null,
  consent = null, // { checked, onChange } — согласие на обработку данных
  primaryAction = null, // главное действие над списком вариантов
  back = null, // возврат к списку категорий
  stepBack = false, // доступен ли шаг назад
  onPick,
  onPickMany,
  onText,
}) {
  const [text, setText] = useState("");
  /* Пока согласие не отмечено, ввод заблокирован — по клику подсвечиваем строку,
     чтобы было видно, куда нажать */
  const [flash, setFlash] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);
  const flashConsent = () => {
    setFlash(false);
    requestAnimationFrame(() => setFlash(true));
    setTimeout(() => setFlash(false), 1200);
  };
  const [checked, setChecked] = useState([]);

  /* Ответ вернули на редактирование — подставляем его текст в поле */
  useEffect(() => {
    if (!draft) return;
    setText(draft.text);
    document.getElementById("composer-text")?.focus();
  }, [draft?.at]);

  useEffect(() => {
    setChecked([]);
  }, [options.map((option) => option.label).join("|")]);

  /* «Ничего из этого» — взаимоисключающий пункт: снимает остальные и снимается сам */
  const toggle = (option) => {
    const { label, none } = option;
    setChecked((prev) => {
      if (prev.includes(label)) return prev.filter((item) => item !== label);
      if (none) return [label];
      return [...prev.filter((item) => item !== NONE_LABEL), label];
    });
  };

  const blocked = disabled || (consent && !consent.checked);
  const canSend = Boolean(text.trim()) || (mode === "multi" && checked.length > 0);

  const submit = (event) => {
    event.preventDefault();
    if (blocked || !canSend) return;
    // Если что-то отмечено — отправляем выбор, иначе свободный текст
    if (mode === "multi" && checked.length) {
      onPickMany(checked.filter((label) => label !== NONE_LABEL));
      setChecked([]);
      setText("");
      return;
    }
    const value = text.trim();
    setText("");
    onText(value);
  };

  return (
    <div className="composer">
      <div className="column composer__inner">
        {(back || stepBack) && (
          <div className="composer__nav">
            {stepBack && (
              <button
                className="composer__back"
                type="button"
                onClick={() =>
                  blocked ? flashConsent() : onPick({ label: "Шаг назад", stepBack: true })
                }
              >
                <ArrowLeft />
                Шаг назад
              </button>
            )}
            {back && (
              <button
                className="composer__back"
                type="button"
                onClick={() => (blocked ? flashConsent() : onPick(back))}
              >
                {back.label}
              </button>
            )}
          </div>
        )}

        {primaryAction && (
          <button
            className={`btn btn--quiet btn--wide composer__primary ${
              blocked ? "is-locked" : ""
            }`.trim()}
            type="button"
            aria-disabled={blocked}
            onClick={() => (blocked ? flashConsent() : primaryAction.onClick())}
          >
            {primaryAction.label}
          </button>
        )}

        {options.length > 0 && (
          <div
            className={`options ${options.length > 3 ? "" : "options--single"}`.trim()}
            role={mode === "multi" ? "group" : undefined}
          >
            {options.map((option) => {
              const isChecked = checked.includes(option.label);
              return (
                <button
                  key={option.label}
                  type="button"
                  className={`option ${isChecked ? "is-checked" : ""} ${
                    blocked ? "is-locked" : ""
                  }`.trim()}
                  aria-disabled={blocked}
                  aria-pressed={mode === "multi" ? isChecked : undefined}
                  onClick={() => {
                    if (blocked) return flashConsent();
                    return mode === "multi" ? toggle(option) : onPick(option);
                  }}
                >
                  {mode === "multi" && (
                    <span className="option__box" aria-hidden="true">
                      <CheckIcon />
                    </span>
                  )}
                  {option.note ? (
                    <span className="option__body">
                      <span className="option__label">
                        {option.label}
                        {option.count != null && (
                          <span className="option__count">{option.count}</span>
                        )}
                      </span>
                      <span className="option__note">{option.note}</span>
                    </span>
                  ) : (
                    option.label
                  )}
                </button>
              );
            })}
          </div>
        )}

        <form className="composer__input" onSubmit={submit}>
          <label className="sr-only" htmlFor="composer-text">
            Напишите своими словами
          </label>
          <input
            id="composer-text"
            value={text}
            placeholder={placeholder}
            readOnly={blocked}
            autoComplete="off"
            onFocus={() => blocked && flashConsent()}
            onClick={() => blocked && flashConsent()}
            onChange={(event) => setText(event.target.value)}
          />
          <button
            className="btn btn--quiet"
            type="submit"
            disabled={!blocked && !canSend}
            aria-disabled={blocked}
          >
            <Mark />
            {mode === "multi" && checked.length ? submitLabel : "Отправить"}
          </button>
        </form>

        {!consent && (
          <div className="subscribe">
            <button className="subscribe__open" type="button" onClick={() => setMailOpen(true)}>
              Прислать подборку и полезные материалы на почту
            </button>
          </div>
        )}

        {mailOpen && <SubscribeModal onClose={() => setMailOpen(false)} />}

        {consent && (
          <label className={`consent ${flash ? "is-flash" : ""}`.trim()}>
            <input
              type="checkbox"
              checked={consent.checked}
              onChange={(event) => consent.onChange(event.target.checked)}
            />
            <span className="consent__box" aria-hidden="true">
              <CheckIcon />
            </span>
            <span className="consent__text">
              Даю согласие на обработку персональных данных, включая сведения о моём самочувствии,
              для подбора специалиста — на условиях{" "}
              <a href="#privacy">политики конфиденциальности</a> и{" "}
              <a href="#terms">условий сервиса</a>.
            </span>
          </label>
        )}
      </div>
    </div>
  );
}
