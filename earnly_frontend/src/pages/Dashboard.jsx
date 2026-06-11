import { useEffect, useRef, useState } from "react";
import Button from "../components/Button";
import JobDropdown from "../components/JobDropdown";
import Modal from "../components/Modal";
import SummaryCard from "../components/SummaryCard";
import WeeklyTable from "../components/WeeklyTable";
import { calculateWeeklyTotals, formatCurrency, formatDuration } from "../utils/calculations";
import { getWeekRange } from "../utils/dateHelpers";
import { downloadCsv, downloadXlsx, gatherEntriesInRange } from "../utils/exportData";

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getCurrentWeekRange() {
  const today = getToday();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = addDays(today, mondayOffset);

  return {
    startDate: formatDateKey(start),
    endDate: formatDateKey(addDays(start, 6)),
  };
}

function getPresetRange(preset) {
  const today = getToday();

  if (preset === "last7") {
    return {
      startDate: formatDateKey(addDays(today, -6)),
      endDate: formatDateKey(today),
    };
  }

  if (preset === "last2Weeks") {
    return {
      startDate: formatDateKey(addDays(today, -13)),
      endDate: formatDateKey(today),
    };
  }

  return getCurrentWeekRange();
}

function Dashboard({
  jobs,
  selectedJob,
  selectedJobId,
  selectedWeekKey,
  selectedWeekEntries,
  isLoading,
  error,
  onSelectJob,
  onMoveWeek,
  onGoToCurrentWeek,
  onEntryChange,
  onClearWeek,
  onLogout,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState(() => getCurrentWeekRange().startDate);
  const [exportEndDate, setExportEndDate] = useState(() => getCurrentWeekRange().endDate);
  const [includeBreaks, setIncludeBreaks] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [exportFormat, setExportFormat] = useState("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const dropdownRef = useRef(null);
  const totals = calculateWeeklyTotals(selectedWeekEntries, selectedJob?.defaultHourlyRate);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function openExportModal() {
    const range = getCurrentWeekRange();

    setExportStartDate(range.startDate);
    setExportEndDate(range.endDate);
    setIncludeBreaks(true);
    setIncludeNotes(true);
    setExportFormat("csv");
    setExportError("");
    setShowExportModal(true);
  }

  function applyExportPreset(preset) {
    const range = getPresetRange(preset);

    setExportStartDate(range.startDate);
    setExportEndDate(range.endDate);
    setExportError("");
  }

  async function handleExport() {
    if (!exportStartDate || !exportEndDate) {
      setExportError("Choose a start and end date.");
      return;
    }

    if (exportStartDate > exportEndDate) {
      setExportError("Start date must be before end date.");
      return;
    }

    setIsExporting(true);
    setExportError("");

    try {
      const rows = await gatherEntriesInRange(selectedJobId, exportStartDate, exportEndDate);
      const options = { includeBreaks, includeNotes };

      if (exportFormat === "xlsx") {
        await downloadXlsx(rows, options);
      } else {
        downloadCsv(rows, options);
      }

      setShowExportModal(false);
    } catch (error) {
      setExportError(error.message || "Unable to export entries.");
    } finally {
      setIsExporting(false);
    }
  }

  if (!selectedJob) {
    return null;
  }

  return (
    <main className="app-shell dashboard-page">
      <header className="top-bar">
        <div>
          <p className="eyebrow">This week</p>
          <div ref={dropdownRef}>
            <JobDropdown
              jobs={jobs}
              selectedJobId={selectedJobId}
              isOpen={isDropdownOpen}
              onToggle={() => setIsDropdownOpen((isOpen) => !isOpen)}
              onClose={() => setIsDropdownOpen(false)}
              onSelect={onSelectJob}
            />
          </div>
        </div>

        <Button type="button" variant="ghost" onClick={onLogout}>
          Log out
        </Button>
      </header>

      <section className="dashboard-hero">
        <div className="dashboard-hero__copy">
          <div className="week-nav" aria-label="Week navigation">
            <button
              type="button"
              className="week-nav__button"
              onClick={() => onMoveWeek(-1)}
              aria-label="Previous week"
            >
              ‹
            </button>
            <span className="dashboard-hero__range">{getWeekRange(selectedWeekKey)}</span>
            <button
              type="button"
              className="week-nav__button"
              onClick={() => onMoveWeek(1)}
              aria-label="Next week"
            >
              ›
            </button>
            <button type="button" className="week-nav__today" onClick={onGoToCurrentWeek}>
              This week
            </button>
          </div>
          <h1>Weekly earnings</h1>
          <p>{isLoading ? "Loading this week..." : "Update shifts quickly or tap a day for detailed notes."}</p>
          {error ? <p className="form-message form-message--error">{error}</p> : null}
        </div>
        <div className="dashboard-hero__actions">
          <Button type="button" variant="secondary" onClick={onClearWeek}>
            Clear
          </Button>
          <Button type="button" onClick={openExportModal}>
            Export
          </Button>
        </div>
      </section>

      <section className="summary-grid" aria-label="Weekly totals">
        <SummaryCard label="Total time" value={formatDuration(totals.minutes)} helper="Across all shifts" />
        <SummaryCard label="Weekly pay" value={formatCurrency(totals.pay)} helper="Before tax estimate" />
      </section>

      <WeeklyTable
        entries={selectedWeekEntries}
        defaultHourlyRate={selectedJob.defaultHourlyRate}
        selectedWeekKey={selectedWeekKey}
        onEntryChange={onEntryChange}
      />

      {showExportModal ? (
        <Modal title="Export entries" onClose={() => setShowExportModal(false)}>
          <div className="export-dialog">
            <section className="export-dialog__section" aria-labelledby="export-presets-label">
              <span id="export-presets-label" className="export-dialog__label">
                Range presets
              </span>
              <div className="export-dialog__presets">
                <button type="button" className="export-dialog__preset" onClick={() => applyExportPreset("last7")}>
                  Last 7 days
                </button>
                <button type="button" className="export-dialog__preset" onClick={() => applyExportPreset("last2Weeks")}>
                  Last 2 weeks
                </button>
                <button type="button" className="export-dialog__preset" onClick={() => applyExportPreset("thisWeek")}>
                  This week
                </button>
              </div>
            </section>

            <div className="export-dialog__date-grid">
              <label className="field">
                <span className="field__label">Start date</span>
                <input
                  className="field__input"
                  type="date"
                  value={exportStartDate}
                  onChange={(event) => setExportStartDate(event.target.value)}
                />
              </label>
              <label className="field">
                <span className="field__label">End date</span>
                <input
                  className="field__input"
                  type="date"
                  value={exportEndDate}
                  onChange={(event) => setExportEndDate(event.target.value)}
                />
              </label>
            </div>

            <section className="export-dialog__section" aria-labelledby="export-settings-label">
              <span id="export-settings-label" className="export-dialog__label">
                Export settings
              </span>
              <div className="export-dialog__toggles">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={includeBreaks}
                    onChange={(event) => setIncludeBreaks(event.target.checked)}
                  />
                  <span className="toggle-switch__control" aria-hidden="true" />
                  <span>Include breaks</span>
                </label>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={includeNotes}
                    onChange={(event) => setIncludeNotes(event.target.checked)}
                  />
                  <span className="toggle-switch__control" aria-hidden="true" />
                  <span>Include notes</span>
                </label>
              </div>
            </section>

            <label className="field">
              <span className="field__label">Format</span>
              <select className="field__input" value={exportFormat} onChange={(event) => setExportFormat(event.target.value)}>
                <option value="csv">CSV (text)</option>
                <option value="xlsx">Excel (XLSX)</option>
              </select>
            </label>

            {exportError ? <p className="form-message form-message--error">{exportError}</p> : null}

            <Button type="button" onClick={handleExport} loading={isExporting} className="export-dialog__submit">
              Export
            </Button>
          </div>
        </Modal>
      ) : null}
    </main>
  );
}

export default Dashboard;