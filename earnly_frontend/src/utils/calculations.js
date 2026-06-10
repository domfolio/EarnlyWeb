import { WEEK_DAYS } from "./dateHelpers";

export function timeToMinutes(time) {
  if (!time || !time.includes(":")) return null;

  const [hours, minutes] = time.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  return hours * 60 + minutes;
}

export function calculateWorkedMinutes(startTime, endTime, breakMinutes = 0) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  if (start === null || end === null) return 0;

  const shiftMinutes = Math.max(end - start, 0);
  const total = shiftMinutes - Number(breakMinutes || 0);

  return Math.max(total, 0);
}

export function calculateEntryPay(entry, fallbackRate = 0) {
  const workedMinutes = calculateWorkedMinutes(
    entry?.startTime,
    entry?.endTime,
    entry?.breakMinutes
  );
  const hasCustomRate = entry?.hourlyRate !== undefined && entry?.hourlyRate !== "";
  const hourlyRate = Number(hasCustomRate ? entry.hourlyRate : fallbackRate || 0);

  return (workedMinutes / 60) * hourlyRate;
}

export function formatDuration(minutes = 0) {
  const safeMinutes = Math.max(Math.round(Number(minutes) || 0), 0);
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;

  return `${hours}h ${mins}m`;
}

export function formatCurrency(amount = 0) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(amount) || 0);
}

export function calculateWeeklyTotals(entries = {}, fallbackRate = 0) {
  return WEEK_DAYS.reduce(
    (totals, day) => {
      const entry = entries[day.key] ?? {};
      const workedMinutes = calculateWorkedMinutes(
        entry.startTime,
        entry.endTime,
        entry.breakMinutes
      );
      const pay = calculateEntryPay(entry, fallbackRate);

      return {
        minutes: totals.minutes + workedMinutes,
        pay: totals.pay + pay,
      };
    },
    { minutes: 0, pay: 0 }
  );
}

export function createEmptyEntries(defaultHourlyRate = "") {
  return WEEK_DAYS.reduce((entries, day) => {
    entries[day.key] = {
      startTime: "",
      endTime: "",
      breakMinutes: 0,
      hourlyRate: "",
      notes: "",
    };

    return entries;
  }, {});
}