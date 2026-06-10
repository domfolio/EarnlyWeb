export const WEEK_DAYS = [
  { key: "mon", short: "Mon", label: "Monday" },
  { key: "tue", short: "Tue", label: "Tuesday" },
  { key: "wed", short: "Wed", label: "Wednesday" },
  { key: "thu", short: "Thu", label: "Thursday" },
  { key: "fri", short: "Fri", label: "Friday" },
  { key: "sat", short: "Sat", label: "Saturday" },
  { key: "sun", short: "Sun", label: "Sunday" },
];

function toLocalDate(value = new Date()) {
  if (value instanceof Date) return new Date(value);

  if (typeof value === "string") {
    const [year, month, day] = value.split("-").map(Number);
    if (year && month && day) return new Date(year, month - 1, day);
  }

  return new Date(value);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getStartOfWeek(date = new Date()) {
  const start = toLocalDate(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function getWeekKey(date = new Date()) {
  return formatDateKey(getStartOfWeek(date));
}

export function addWeeksToKey(weekKey, weekOffset) {
  const date = getStartOfWeek(weekKey);
  date.setDate(date.getDate() + weekOffset * 7);
  return getWeekKey(date);
}

export function getDateForDay(dayKey, referenceDate = new Date()) {
  const dayIndex = WEEK_DAYS.findIndex((day) => day.key === dayKey);
  const date = getStartOfWeek(referenceDate);
  date.setDate(date.getDate() + Math.max(dayIndex, 0));
  return date;
}

export function formatShortDate(date) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatLongDate(date) {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getWeekRange(referenceDate = new Date()) {
  const start = getStartOfWeek(referenceDate);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return `${formatShortDate(start)} – ${formatShortDate(end)}`;
}

export function getDayByKey(dayKey) {
  return WEEK_DAYS.find((day) => day.key === dayKey) ?? WEEK_DAYS[0];
}