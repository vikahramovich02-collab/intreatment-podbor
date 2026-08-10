/* Сайт живёт в подпапке GitHub Pages, поэтому пути к файлам строим от базы сборки */
export const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

export const money = (value) => `${value.toLocaleString("ru-RU")} ₽`;

/* Часовые пояса клиентов. Расписание психологов хранится в минском времени (UTC+3).
   Город не спрашиваем — достаточно смещения. */
export const BASE_UTC = 3;
export const ZONES = Array.from({ length: 13 }, (_, index) => {
  const utc = index - 4; // от UTC−4 до UTC+8
  return { id: `utc${utc}`, utc };
});

export const zoneLabel = (zone) => `UTC${zone.utc >= 0 ? "+" : ""}${zone.utc}`;

/* Сдвигаем время слота в пояс клиента. Слоты, уехавшие за пределы суток,
   в прототипе не показываем — иначе поедет и дата. */
export function shiftSlot(time, utc) {
  const delta = utc - BASE_UTC;
  const [h, m] = time.split(":").map(Number);
  const shifted = h + delta;
  if (shifted < 0 || shifted > 23) return null;
  return `${String(shifted).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/* Оборачиваем в кавычки, если внутри уже нет своих — иначе получается «…»» */
export const quoted = (text) => (text.includes("«") ? text : `«${text}»`);

export const now = () =>
  new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const DOW_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const DOW_FULL = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

/* Две недели, начиная с сегодня: то, что показываем в календаре модалки. */
export function buildCalendar(person, weeks = 2) {
  const days = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  for (let i = 0; i < weeks * 7; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dow = date.getDay();
    let slots = person.slots[dow] || [];
    if (i === 0) {
      // Сегодня показываем только то, на что реально успеть записаться (минимум за 2 часа).
      const edge = new Date();
      edge.setHours(edge.getHours() + 2);
      const edgeMinutes = edge.getHours() * 60 + edge.getMinutes();
      slots = slots.filter((slot) => {
        const [h, m] = slot.split(":").map(Number);
        return h * 60 + m >= edgeMinutes;
      });
    }
    days.push({
      key: date.toISOString().slice(0, 10),
      date,
      dow: DOW_SHORT[dow],
      day: date.getDate(),
      label: `${DOW_FULL[dow]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`,
      short: `${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)}`,
      isToday: i === 0,
      slots,
    });
  }
  return days;
}

export function weekRange(days) {
  if (!days.length) return "";
  const from = days[0].date;
  const to = days[days.length - 1].date;
  const fromLabel =
    from.getMonth() === to.getMonth()
      ? from.getDate()
      : `${from.getDate()} ${MONTHS[from.getMonth()]}`;
  return `${fromLabel}–${to.getDate()} ${MONTHS[to.getMonth()]}`;
}

/* «сегодня» / «завтра» / «пн, 10 августа» — время выбирается уже в расписании */
export function nearestSlotLabel(person) {
  const days = buildCalendar(person, 2);
  const day = days.find((item) => item.slots.length);
  if (!day) return null;
  const index = days.indexOf(day);
  return index === 0 ? "сегодня" : index === 1 ? "завтра" : day.label.toLowerCase();
}
