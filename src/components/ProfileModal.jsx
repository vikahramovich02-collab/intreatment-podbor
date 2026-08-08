import { useEffect, useMemo, useRef, useState } from "react";
import { Mark, CloseIcon, ChevronLeft, ChevronRight } from "./icons.jsx";
import {
  money,
  buildCalendar,
  weekRange,
  quoted,
  ZONES,
  zoneLabel,
  shiftSlot,
} from "../lib/format.js";

export default function ProfileModal({ match, matchedTags = [], onClose, onChoose, onNext, focus }) {
  const { person } = match;
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const scheduleRef = useRef(null);

  /* Пояс определяем автоматически, клиент может поменять — слоты пересчитываются */
  const [zone, setZone] = useState(ZONES[0]);
  const [zoneOpen, setZoneOpen] = useState(false);

  const days = useMemo(() => {
    const base = buildCalendar(person, 2);
    if (zone.utc === ZONES[0].utc) return base;
    return base.map((day) => ({
      ...day,
      slots: day.slots.map((slot) => shiftSlot(slot, zone.utc)).filter(Boolean),
    }));
  }, [person.id, zone.utc]);
  const [week, setWeek] = useState(0);
  const visibleDays = days.slice(week * 7, week * 7 + 7);

  const firstFree = Math.max(0, days.findIndex((day) => day.slots.length));
  const [dayIndex, setDayIndex] = useState(firstFree);
  const selectedDay = days[dayIndex];
  const [slot, setSlot] = useState(selectedDay?.slots[0] || "");

  useEffect(() => {
    setSlot(days[dayIndex]?.slots[0] || "");
  }, [dayIndex, person.id, zone.utc]);

  useEffect(() => {
    setWeek(Math.floor(firstFree / 7));
    setDayIndex(firstFree);
  }, [person.id]);

  /* Фокус, блокировка скролла страницы, возврат фокуса при закрытии */
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    if (focus === "schedule") {
      scheduleRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }, [focus, person.id]);

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;
    const focusable = [
      ...panelRef.current.querySelectorAll("button:not([disabled]), a[href], input:not([disabled])"),
    ];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const shared = person.tags.filter((tag) => matchedTags.includes(tag));

  /* Ближайшее свободное время — уже в поясе клиента */
  const nearest = (() => {
    const index = days.findIndex((day) => day.slots.length);
    if (index < 0) return null;
    const when = index === 0 ? "сегодня" : index === 1 ? "завтра" : days[index].label.toLowerCase();
    return `${when}, ${days[index].slots[0]}`;
  })();

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-title"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="modal" ref={panelRef} onKeyDown={onKeyDown}>
        <button
          ref={closeRef}
          className="modal__close"
          type="button"
          aria-label="Закрыть"
          onClick={onClose}
        >
          <CloseIcon />
        </button>

        <div className="modal__hero">
          <span className="avatar avatar--lg">
            <img src={person.photo} alt="" />
          </span>
          <div>
            <h2 id="profile-title">{person.name}</h2>
            <p className="modal__hero-role">
              {person.role} · {person.approach}
            </p>
            <div className="modal__hero-meta">
              <span className="pill-meta">{money(person.price)} • 50 минут</span>
              {nearest && <span className="pill-meta">Ближайшая запись: {nearest}</span>}
            </div>
          </div>
        </div>

        <div className="modal__body">
          {shared.length > 0 && (
            <section className="section">
              <h3>Почему подходит вам</h3>
              <p>
                Вы отметили: {shared.join(", ")}. {person.name.split(" ")[0]} работает именно с
                этими запросами — {person.approach.toLowerCase()}.
              </p>
            </section>
          )}

          <section className="section">
            <h3>О специалисте</h3>
            <p>{quoted(person.quote)}</p>
            <p>{person.about}</p>
            <div className="tag-row">
              {person.tags.map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </section>

          <section className="section">
            <h3>Образование и подход</h3>
            <p>{person.education}</p>
            <p>Формат работы: {person.format.toLowerCase()}, сессия 50 минут.</p>
          </section>

          <section className="section" ref={scheduleRef}>
            <h3>Расписание</h3>
            <div className="cal__head">
              <button
                className="cal__nav"
                type="button"
                aria-label="Предыдущая неделя"
                disabled={week === 0}
                onClick={() => setWeek((value) => Math.max(0, value - 1))}
              >
                <ChevronLeft />
              </button>
              <strong aria-live="polite">{weekRange(visibleDays)}</strong>
              <button
                className="cal__nav"
                type="button"
                aria-label="Следующая неделя"
                disabled={week === 1}
                onClick={() => setWeek((value) => Math.min(1, value + 1))}
              >
                <ChevronRight />
              </button>
            </div>

            <div className="cal__grid">
              {visibleDays.map((day, index) => {
                const globalIndex = week * 7 + index;
                const free = day.slots.length > 0;
                return (
                  <button
                    key={day.key}
                    type="button"
                    className={`cal__day ${dayIndex === globalIndex ? "is-selected" : ""} ${
                      free ? "" : "is-empty"
                    }`.trim()}
                    disabled={!free}
                    aria-pressed={dayIndex === globalIndex}
                    aria-label={`${day.label}${free ? `, свободно ${day.slots.length}` : ", нет времени"}`}
                    onClick={() => setDayIndex(globalIndex)}
                  >
                    <small>{day.isToday ? "сег" : day.dow}</small>
                    <span>{day.day}</span>
                    <em>{free ? `${day.slots.length} окн.` : "—"}</em>
                  </button>
                );
              })}
            </div>

            <div className="slots">
              <div className="slots__title">
                Выберите время <span>{selectedDay?.label}</span>
              </div>
              <div className="slots__grid">
                {selectedDay?.slots.length ? (
                  selectedDay.slots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      className={`slot ${slot === time ? "is-selected" : ""}`.trim()}
                      aria-pressed={slot === time}
                      onClick={() => setSlot(time)}
                    >
                      {time}
                    </button>
                  ))
                ) : (
                  <p className="slots__empty" role="status">
                    В этот день свободного времени нет.
                    {nearest ? ` Ближайшая запись: ${nearest}.` : ""}
                  </p>
                )}
              </div>
              <div className="cal__tz">
                <span>
                  Ваше время: {zoneLabel(zone)} — определили автоматически.{" "}
                  <button className="link" type="button" onClick={() => setZoneOpen((v) => !v)}>
                    {zoneOpen ? "Свернуть" : "Изменить"}
                  </button>
                </span>
                {zoneOpen && (
                  <label className="checkout__select cal__tz-select">
                    <span className="sr-only">Ваш город</span>
                    <select
                      value={zone.id}
                      onChange={(event) => {
                        setZone(ZONES.find((item) => item.id === event.target.value));
                        setZoneOpen(false);
                      }}
                    >
                      {ZONES.map((item) => (
                        <option key={item.id} value={item.id}>
                          {zoneLabel(item)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="modal__footer">
          <button className="modal__quiet" type="button" onClick={onClose}>
            Вернуться в чат
          </button>
          <button
            className="btn btn--primary"
            type="button"
            disabled={!slot}
            onClick={() => onChoose({ person, day: selectedDay, slot })}
          >
            <Mark />
            {slot ? `Записаться на ${slot}` : "Выберите время"}
          </button>
        </div>
      </div>
    </div>
  );
}
