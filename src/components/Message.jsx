import { forwardRef } from "react";
import { Mark } from "./icons.jsx";

export const AssistantMessage = forwardRef(function AssistantMessage(
  { text, time, children, typing = false },
  ref
) {
  return (
    <div className="msg msg--assistant" ref={ref}>
      <div className="msg__head">
        <span className="msg__head-avatar">
          <Mark />
        </span>
        <span>
          <b className="msg__head-name">Ассистент</b>
          <span className="msg__head-role">ИИ-помощник InTreatment</span>
        </span>
      </div>
      {typing ? (
        <span className="typing" aria-label="Ассистент печатает">
          <span />
          <span />
          <span />
        </span>
      ) : (
        <>
          <p className="msg__body">{text}</p>
          {children}
          {time && <time className="msg__time">{time}</time>}
        </>
      )}
    </div>
  );
});

export const UserMessage = forwardRef(function UserMessage({ text, time, onEdit }, ref) {
  return (
    <div className="msg msg--user" ref={ref}>
      <div className="msg__row">
        {onEdit && (
          <button className="msg__edit" type="button" onClick={onEdit}>
            Изменить ответ
          </button>
        )}
        <p className="msg__bubble">{text}</p>
      </div>
      {time && <time className="msg__time">{time}</time>}
    </div>
  );
});
