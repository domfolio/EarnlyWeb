import { getWeek } from "../services/earnlyApi";
import { calculateEntryPay, calculateWorkedMinutes } from "./calculations";
import { addWeeksToKey, getDateForDay, getWeekKey, WEEK_DAYS } from "./dateHelpers";

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toDisplayDate(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = String(isoDate).split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}-${month}-${year}`;
}

function decimalHours(workedMinutes = 0) {
  return Number(((Number(workedMinutes) || 0) / 60).toFixed(2));
}

function decimalPay(pay = 0) {
  return Number((Number(pay) || 0).toFixed(2));
}

function buildExportColumns(options = {}) {
  const columns = [
    { header: "Date", getValue: (row) => toDisplayDate(row.date) },
    { header: "Day", getValue: (row) => row.dayName || "" },
    { header: "Start", getValue: (row) => row.startTime || "" },
    { header: "End", getValue: (row) => row.endTime || "" },
  ];

  if (options.includeBreaks) {
    columns.push({ header: "Break (min)", getValue: (row) => row.breakMinutes ?? 0 });
  }

  columns.push(
    { header: "Hours", getValue: (row) => decimalHours(row.workedMinutes) },
    { header: "Pay", getValue: (row) => decimalPay(row.pay) }
  );

  if (options.includeNotes) {
    columns.push({ header: "Notes", getValue: (row) => row.notes || "" });
  }

  return columns;
}

function buildExportTable(rows, options) {
  const columns = buildExportColumns(options);
  return [columns.map((column) => column.header), ...rows.map((row) => columns.map((column) => column.getValue(row)))];
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeCsvValue(value) {
  const stringValue = value === null || value === undefined ? "" : String(value);
  const escapedValue = stringValue.replace(/"/g, '""');

  return /[",\n\r]/.test(stringValue) ? `"${escapedValue}"` : escapedValue;
}

export async function gatherEntriesInRange(jobId, startDate, endDate) {
  const rows = [];
  const startWeekKey = getWeekKey(startDate);
  const endWeekKey = getWeekKey(endDate);

  for (let weekKey = startWeekKey; weekKey <= endWeekKey; weekKey = addWeeksToKey(weekKey, 1)) {
    const payload = await getWeek(jobId, weekKey);
    const entries = payload.entries ?? {};
    const defaultHourlyRate = payload.job?.defaultHourlyRate ?? 0;

    WEEK_DAYS.forEach((day) => {
      const date = formatDateKey(getDateForDay(day.key, weekKey));

      if (date < startDate || date > endDate) return;

      const entry = entries[day.key] ?? {};

      if (!entry.startTime && !entry.endTime) return;

      const breakMinutes = entry.breakMinutes ?? 0;
      const workedMinutes = calculateWorkedMinutes(entry.startTime, entry.endTime, breakMinutes);

      rows.push({
        date,
        dayName: day.label,
        startTime: entry.startTime || "",
        endTime: entry.endTime || "",
        breakMinutes,
        workedMinutes,
        hourlyRate: entry.hourlyRate ?? "",
        pay: calculateEntryPay(entry, defaultHourlyRate),
        notes: entry.notes || "",
      });
    });
  }

  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

export function downloadCsv(rows, options) {
  const table = buildExportTable(rows, options);
  const csv = table.map((row) => row.map(escapeCsvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });

  triggerDownload(blob, "earnly-export.csv");
}

export async function downloadXlsx(rows, options) {
  const XLSX = await import("xlsx");
  const table = buildExportTable(rows, options);
  const worksheet = XLSX.utils.aoa_to_sheet(table);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Earnly Export");
  XLSX.writeFile(workbook, "earnly-export.xlsx");
}