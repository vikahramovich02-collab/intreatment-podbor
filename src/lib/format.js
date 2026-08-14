/* Сайт живёт в подпапке GitHub Pages, поэтому пути к файлам строим от базы сборки */
export const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

/* «к Диане», «к Юлии» — для подписи кнопки записи */
export function dative(name) {
  const first = name.split(" ")[0];
  if (first.endsWith("ия")) return `${first.slice(0, -1)}и`;
  if (first.endsWith("а") || first.endsWith("я")) return `${first.slice(0, -1)}е`;
  return first;
}

export const money = (value) => `${value.toLocaleString("ru-RU")} ₽`;

/* Часовые пояса клиентов. Расписание психологов хранится в минском времени (UTC+3).
   Город не спрашиваем — достаточно смещения. */
export const BASE_UTC = 3;
export const ZONE_GROUPS = [
  {
    title: "Россия",
    zones: [
      { id: "ru2", utc: 2, city: "Калининград" },
      { id: "ru3", utc: 3, city: "Москва, Санкт-Петербург" },
      { id: "ru4", utc: 4, city: "Самара, Ижевск" },
      { id: "ru5", utc: 5, city: "Екатеринбург, Уфа" },
      { id: "ru6", utc: 6, city: "Омск" },
      { id: "ru7", utc: 7, city: "Новосибирск, Красноярск" },
      { id: "ru8", utc: 8, city: "Иркутск" },
      { id: "ru9", utc: 9, city: "Якутск" },
      { id: "ru10", utc: 10, city: "Владивосток" },
      { id: "ru11", utc: 11, city: "Магадан, Сахалин" },
      { id: "ru12", utc: 12, city: "Камчатка" },
    ],
  },
  {
    title: "Соседние страны",
    zones: [
      { id: "by3", utc: 3, city: "Минск" },
      { id: "ge4", utc: 4, city: "Тбилиси, Ереван, Баку" },
      { id: "kz5", utc: 5, city: "Алматы, Ташкент" },
    ],
  },
  {
    title: "Европа и США",
    zones: [
      { id: "eu0", utc: 0, city: "Лондон, Лиссабон" },
      { id: "eu1", utc: 1, city: "Берлин, Прага, Белград" },
      { id: "us-4", utc: -4, city: "Нью-Йорк" },
      { id: "us-7", utc: -7, city: "Лос-Анджелес" },
    ],
  },
];

export const ZONES = ZONE_GROUPS.flatMap((group) => group.zones);

export const zoneShort = (zone) => `UTC${zone.utc >= 0 ? "+" : ""}${zone.utc}`;
export const zoneLabel = (zone) => `${zoneShort(zone)} · ${zone.city}`;

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

export const WEEKDAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

/* Календарь стандартной недельной сеткой: колонки пн—вс,
   отсчёт от понедельника текущей недели. Прошедшие дни показываем неактивными. */
export function buildCalendar(person, weeks = 4) {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  const shift = (today.getDay() + 6) % 7; // сколько дней прошло с понедельника
  start.setDate(today.getDate() - shift);

  for (let i = 0; i < weeks * 7; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const past = date < today;
    const isToday = date.getTime() === today.getTime();
    const dow = date.getDay();
    const onVacation = person.vacationUntil && date <= new Date(person.vacationUntil);
    let slots = past || onVacation ? [] : person.slots[dow] || [];
    if (isToday) {
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
      onVacation: Boolean(onVacation),
      past,
      key: date.toISOString().slice(0, 10),
      date,
      dow: DOW_SHORT[dow],
      day: date.getDate(),
      label: `${DOW_FULL[dow]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`,
      short: `${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)}`,
      isToday,
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
/* «до 25 августа» — для подписи об отпуске */
export function vacationLabel(person) {
  if (!person.vacationUntil) return null;
  const until = new Date(person.vacationUntil);
  if (until < new Date()) return null;
  return `${until.getDate()} ${MONTHS[until.getMonth()]}`;
}

export function nearestSlotLabel(person) {
  const days = buildCalendar(person, 4).filter((item) => !item.past);
  const day = days.find((item) => item.slots.length);
  if (!day) return null;
  const index = days.indexOf(day);
  const date = `${day.date.getDate()} ${MONTHS[day.date.getMonth()]}`;
  if (index === 0) return `сегодня, ${date}`;
  if (index === 1) return `завтра, ${date}`;
  return day.label.toLowerCase();
}
