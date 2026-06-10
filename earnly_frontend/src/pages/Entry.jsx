import { useParams, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import InputField from "../components/InputField";
import { calculateEntryPay, calculateWorkedMinutes, formatCurrency, formatDuration } from "../utils/calculations";
import { formatLongDate, getDateForDay, getDayByKey } from "../utils/dateHelpers";

const BREAK_OPTIONS = [0, 15, 30, 45, 60, 90, 120];

function Entry({ selectedJob, selectedWeekKey, selectedWeekEntries = {}, onEntryChange, error }) {
  const { dayKey } = useParams();
  const navigate = useNavigate();
  const day = getDayByKey(dayKey);
  const entry = selectedWeekEntries?.[day.key] ?? {};
  const workedMinutes = calculateWorkedMinutes(entry.startTime, entry.endTime, entry.breakMinutes);
  const pay = calculateEntryPay(entry, selectedJob?.defaultHourlyRate);

  function updateField(patch) {
    onEntryChange(day.key, patch);
  }

  return (
    <main className="app-shell entry-page">
      <header className="page-header">
        <Button type="button" variant="ghost" onClick={() => navigate("/dashboard")}>
          ← Back
        </Button>
        <div>
          <p className="eyebrow">{selectedJob?.workplaceName}</p>
          <h1>{formatLongDate(getDateForDay(day.key, selectedWeekKey))}</h1>
        </div>
      </header>

      <section className="entry-card">
        {error ? <p className="form-message form-message--error">{error}</p> : null}
        <div className="entry-grid">
          <InputField
            label="Start Time"
            type="time"
            value={entry.startTime || ""}
            onChange={(event) => updateField({ startTime: event.target.value })}
          />
          <InputField
            label="End Time"
            type="time"
            value={entry.endTime || ""}
            onChange={(event) => updateField({ endTime: event.target.value })}
          />

          <label className="field">
            <span className="field__label">Break Time</span>
            <select
              className="field__input"
              value={entry.breakMinutes ?? 0}
              onChange={(event) => updateField({ breakMinutes: Number(event.target.value) })}
            >
              {BREAK_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} minutes
                </option>
              ))}
            </select>
          </label>

          <InputField
            label="Hourly Rate"
            type="number"
            min="0"
            step="0.01"
            value={entry.hourlyRate ?? selectedJob?.defaultHourlyRate ?? ""}
            onChange={(event) => updateField({ hourlyRate: event.target.value })}
            placeholder={String(selectedJob?.defaultHourlyRate ?? "")}
            hint={`Leave blank to use ${selectedJob?.workplaceName}'s default rate.`}
          />
        </div>

        <label className="field">
          <span className="field__label">Notes</span>
          <textarea
            className="field__input field__textarea"
            placeholder="Add anything useful, like public holiday rate or manager notes."
            value={entry.notes || ""}
            onChange={(event) => updateField({ notes: event.target.value })}
          />
        </label>

        <div className="entry-results">
          <div>
            <span>Total Time Worked</span>
            <strong>{formatDuration(workedMinutes)}</strong>
          </div>
          <div>
            <span>Total Pay</span>
            <strong>{formatCurrency(pay)}</strong>
          </div>
        </div>

        <Button type="button" onClick={() => navigate("/dashboard")}>
          Save entry
        </Button>
      </section>
    </main>
  );
}

export default Entry;