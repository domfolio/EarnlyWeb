import { useEffect, useRef, useState } from "react";
import Button from "../components/Button";
import JobDropdown from "../components/JobDropdown";
import Modal from "../components/Modal";
import SummaryCard from "../components/SummaryCard";
import WeeklyTable from "../components/WeeklyTable";
import { calculateWeeklyTotals, formatCurrency, formatDuration } from "../utils/calculations";
import { getWeekRange } from "../utils/dateHelpers";

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
  onEntryChange,
  onClearWeek,
  onLogout,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
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
          </div>
          <h1>Weekly earnings</h1>
          <p>{isLoading ? "Loading this week..." : "Update shifts quickly or tap a day for detailed notes."}</p>
          {error ? <p className="form-message form-message--error">{error}</p> : null}
        </div>
        <div className="dashboard-hero__actions">
          <Button type="button" variant="secondary" onClick={onClearWeek}>
            Clear
          </Button>
          <Button type="button" onClick={() => setShowExportModal(true)}>
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
        <Modal title="Export coming soon" onClose={() => setShowExportModal(false)}>
          <p>This feature will be available later.</p>
        </Modal>
      ) : null}
    </main>
  );
}

export default Dashboard;