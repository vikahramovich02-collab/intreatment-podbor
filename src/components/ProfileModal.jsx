import { useEffect, useMemo, useRef, useState } from "react";
import { Mark, CloseIcon, ChevronLeft, ChevronRight } from "./icons.jsx";
import {
  money,
  buildCalendar,
  weekRange,
  vacationLabel,
  zoneShort,
  BASE_UTC,
  ZONES,
  zoneLabel,
  shiftSlot,
} from "../lib/format.js";

export default function ProfileModal({ person, onClose, onChoose, onNext, focus }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const scheduleRef = useRef(null);

  /* Пояс определяем автоматически, клиент может поменять — слоты пересчитываются */
  const [zone, setZone] = useState(ZONES.find((item) => item.utc === BASE_UTC));
  const [zoneOpen, setZoneOpen] = useState(false);

  const days = useMemo(() => {
    const base = buildCalendar(person, 4);
    if (zone.utc === BASE_UTC) return base;
    return base.map((day) => ({
      ...day,
      slots: day.slots.map((slot) => shiftSlot(slot, zone.utc)).filter(Boolean),
    }));
  }, [person.id, zone.utc]);
  const visibleDays = days;

  const firstFree = Math.max(0, days.findIndex((day) => day.slots.length));
  const [dayIndex, setDayIndex] = useState(firstFree);
  const selectedDay = days[dayIndex];
  const [slot, setSlot] = useState(selectedDay?.slots[0] || "");

  useEffect(() => {
    setSlot(days[dayIndex]?.slots[0] || "");
  }, [dayIndex, person.id, zone.utc]);

  useEffect(() => {
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

  /* Ближайшее свободное время — уже в поясе клиента */
  const vacation = vacationLabel(person);
  const [waitEmail, setWaitEmail] = useState("");
  const [waitSent, setWaitSent] = useState(false);
  const hasAnySlot = days.some((day) => day.slots.length);

  const nearest = (() => {
    const index = days.findIndex((day) => day.slots.length);
    if (index < 0) return null;
    return index === 0 ? "сегодня" : index === 1 ? "завтра" : days[index].label.toLowerCase();
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
              {person.role}
            </p>
            <div className="modal__hero-meta">
              <span className="pill-meta">{money(person.price)} • 50 минут</span>
              {nearest && <span className="pill-meta">Ближайшая запись: {nearest}</span>}
            </div>
          </div>
        </div>

        <div className="modal__body">
          <section className="section">
            <h3>О специалисте</h3>
            <p>{person.about}</p>
            <p>Формат работы: {person.format.toLowerCase()}, сессия 50 минут.</p>
            <p className="modal__links">
              {person.profileUrl && (
                <a className="link" href={person.profileUrl} target="_blank" rel="noreferrer">
                  Полный профиль
                </a>
              )}
              <a className="link" href="#diplomas">
                Документы об образовании
              </a>
            </p>
          </section>

          <section className="section" ref={scheduleRef}>
            <h3>Расписание</h3>
            <div className="cal__head">
              <strong>{weekRange(days)}</strong>
              <span className="cal__zone">Время в поясе {zoneShort(zone)}</span>
            </div>

            {vacation && (
              <p className="cal__vacation">Психолог в отпуске до {vacation}</p>
            )}

            <div className="cal__grid">
              {visibleDays.map((day, index) => {
                const globalIndex = index;
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
                    <em>{free ? `${day.slots.length} окн.` : day.onVacation ? "отпуск" : "—"}</em>
                  </button>
                );
              })}
            </div>

            {!hasAnySlot && (
              <div className="waitlist">
                {waitSent ? (
                  <p className="card__hint" role="status">
                    Готово — сообщим на {waitEmail}, когда появятся свободные даты.
                  </p>
                ) : (
                  <>
                    <p className="card__hint" style={{ marginTop: 0 }}>
                      Свободных дат сейчас нет. Оставьте почту — напишем, когда они появятся.
                    </p>
                    <div className="inline-field">
                      <label className="field" style={{ flex: 1 }}>
                        <span className="sr-only">Почта для уведомления</span>
                        <input
                          type="email"
                          value={waitEmail}
                          onChange={(event) => setWaitEmail(event.target.value)}
                          placeholder="name@example.com"
                        />
                      </label>
                      <button
                        className="btn btn--outline"
                        type="button"
                        disabled={!waitEmail.includes("@")}
                        onClick={() => setWaitSent(true)}
                      >
                        Сообщить о новых датах
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="slots">
              <div className="slots__title">
                Выберите время{" "}
                <span>
                  {selectedDay?.label} · {zoneShort(zone)}
                </span>
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
                  Мы автоматически определили ваш часовой пояс — {zoneLabel(zone)}.{" "}
                  <button className="link" type="button" onClick={() => setZoneOpen((v) => !v)}>
                    {zoneOpen ? "Свернуть" : "Изменить"}
                  </button>
                </span>
                {zoneOpen && (
                  <label className="checkout__select cal__tz-select">
                    <span className="sr-only">Ваш часовой пояс</span>
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
