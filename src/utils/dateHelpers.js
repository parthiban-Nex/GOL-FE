
/** Returns the Monday of the ISO week that `date` falls in. */
export function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sun .. 6 = Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/** First day of the month at 00:00. */
export function startOfMonth(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Non-mutating addition. `unit` is one of 'day' | 'week' | 'month'. */
export function addTime(date, amount, unit) {
  const d = new Date(date);
  if (unit === "day") d.setDate(d.getDate() + amount);
  if (unit === "week") d.setDate(d.getDate() + amount * 7);
  if (unit === "month") d.setMonth(d.getMonth() + amount);
  return d;
}

/** True if the two dates land on the same calendar day. */
export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** "16 May 2024" / short forms - accepts an Intl options object. */
export function formatLong(
  date,
  options = { weekday: "long", day: "numeric", month: "long", year: "numeric" },
) {
  return new Intl.DateTimeFormat("en-IN", options).format(date);
}

/** "9:30 AM" from a "HH:MM" 24-hour string. */
export function formatTimeLabel(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

/** Minutes-since-midnight from a "HH:MM" string. */
export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}


export function getMonthGrid(monthDate) {
  const first = startOfMonth(monthDate);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addTime(gridStart, i, "day"));
}
