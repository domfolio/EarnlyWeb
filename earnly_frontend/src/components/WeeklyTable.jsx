import { useNavigate } from "react-router-dom";
import TimePicker from "./TimePicker";
import { calculateEntryPay, formatCurrency } from "../utils/calculations";
import { getDateForDay, formatShortDate, WEEK_DAYS } from "../utils/dateHelpers";

const BREAK_OPTIONS = [0, 15, 30, 45, 60, 90, 120];

function WeeklyTable({ entries, defaultHourlyRate, selectedWeekKey, onEntryChange }) {
  const navigate = useNavigate();

  function handleTimeClick(event) {
    event.stopPropagation();
  }

  function updateEntry(dayKey, patch) {
    onEntryChange(dayKey, patch);
  }

  return (
    <div className="weekly-table-shell">
      <table className="weekly-table">
        <colgroup>
          <col className="weekly-table__col-day" />
          <col className="weekly-table__col-time" />
          <col className="weekly-table__col-time" />
          <col className="weekly-table__col-break" />
          <col className="weekly-table__col-pay" />
          <col className="weekly-table__col-arrow" />
        </colgroup>
        <thead>
          <tr>
            <th>Day</th>
            <th>Start</th>
            <th>End</th>
            <th>Break</th>
            <th>Pay</th>
            <th aria-label="Open day entry" />
          </tr>
        </thead>
        <tbody>
          {WEEK_DAYS.map((day) => {
            const entry = entries[day.key] ?? {};
            const pay = calculateEntryPay(entry, defaultHourlyRate);

            return (
              <tr key={day.key} onClick={() => navigate(`/entry/${day.key}`)} tabIndex="0">
                <td>
                  <span className="weekly-table__day">{day.short}</span>
                  <span className="weekly-table__date">{formatShortDate(getDateForDay(day.key, selectedWeekKey))}</span>
                </td>
                <td onClick={handleTimeClick}>
                  <TimePicker
                    value={entry.startTime || ""}
                    onChange={(event) => updateEntry(day.key, { startTime: event.target.value })}
                    ariaLabel={`${day.label} start time`}
                    className="time-picker--table"
                  />
                </td>
                <td onClick={handleTimeClick}>
                  <TimePicker
                    value={entry.endTime || ""}
                    onChange={(event) => updateEntry(day.key, { endTime: event.target.value })}
                    ariaLabel={`${day.label} end time`}
                    className="time-picker--table"
                  />
                </td>
                <td onClick={handleTimeClick}>
                  <select
                    value={entry.breakMinutes ?? 0}
                    onChange={(event) => updateEntry(day.key, { breakMinutes: Number(event.target.value) })}
                    aria-label={`${day.label} break time`}
                  >
                    {BREAK_OPTIONS.map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes}m
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <strong>{formatCurrency(pay)}</strong>
                </td>
                <td className="weekly-table__arrow">›</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default WeeklyTable;