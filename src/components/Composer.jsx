import { useEffect, useState } from "react";
import { Mark, CheckIcon } from "./icons.jsx";

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
  onPick,
  onPickMany,
  onText,
}) {
  const [text, setText] = useState("");
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
        {primaryAction && (
          <button
            className="btn btn--primary btn--lg btn--wide"
            type="button"
            disabled={blocked}
            onClick={primaryAction.onClick}
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
                  className={`option ${isChecked ? "is-checked" : ""}`.trim()}
                  disabled={blocked}
                  aria-pressed={mode === "multi" ? isChecked : undefined}
                  onClick={() => (mode === "multi" ? toggle(option) : onPick(option))}
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
            disabled={blocked}
            autoComplete="off"
            onChange={(event) => setText(event.target.value)}
          />
          <button className="btn btn--quiet" type="submit" disabled={blocked || !canSend}>
            <Mark />
            {mode === "multi" && checked.length ? submitLabel : "Отправить"}
          </button>
        </form>

        {consent && (
          <label className="consent">
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
