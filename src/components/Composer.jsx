import { useEffect, useState } from "react";
import { Mark, CheckIcon } from "./icons.jsx";

export default function Composer({
  options = [],
  mode = "single",
  hint,
  submitLabel = "Продолжить",
  placeholder = "Расскажите..",
  disabled = false,
  draft = null,
  legal = false,
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

  const toggle = (label) =>
    setChecked((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );

  const canSend = Boolean(text.trim()) || (mode === "multi" && checked.length > 0);

  const submit = (event) => {
    event.preventDefault();
    if (disabled || !canSend) return;
    // Если что-то отмечено — отправляем выбор, иначе свободный текст
    if (mode === "multi" && checked.length) {
      onPickMany(checked);
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
        {(hint || options.length > 0) && (
          <p className="composer__label">{hint || "Выберите вариант ответа или напишите"}</p>
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
                  disabled={disabled}
                  aria-pressed={mode === "multi" ? isChecked : undefined}
                  onClick={() => (mode === "multi" ? toggle(option.label) : onPick(option))}
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

        {mode === "multi" && (
          <button
            className="composer__skip"
            type="button"
            disabled={disabled}
            onClick={() => onPickMany([])}
          >
            Ничего из этого
          </button>
        )}

        <form className="composer__input" onSubmit={submit}>
          <label className="sr-only" htmlFor="composer-text">
            Напишите своими словами
          </label>
          <input
            id="composer-text"
            value={text}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            onChange={(event) => setText(event.target.value)}
          />
          <button className="btn btn--quiet" type="submit" disabled={disabled || !canSend}>
            <Mark />
            {mode === "multi" && checked.length ? submitLabel : "Отправить"}
          </button>
        </form>

        {legal && (
          <p className="composer__legal">
            Продолжая, вы соглашаетесь с <a href="#terms">условиями сервиса</a> и{" "}
            <a href="#privacy">политикой конфиденциальности</a>, включая обработку ответов для
            подбора специалиста.
          </p>
        )}
      </div>
    </div>
  );
}
