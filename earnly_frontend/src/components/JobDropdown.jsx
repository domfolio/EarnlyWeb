import { Link } from "react-router-dom";

function JobDropdown({ jobs, selectedJobId, isOpen, onToggle, onClose, onSelect }) {
  const selectedJob = jobs.find((job) => job.id === selectedJobId);

  return (
    <div className="job-switcher">
      <button
        type="button"
        className="job-switcher__button"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span>{selectedJob?.workplaceName || "Select job"}</span>
        <span className={`job-switcher__chevron ${isOpen ? "job-switcher__chevron--open" : ""}`}>
          ▾
        </span>
      </button>

      {isOpen ? (
        <div className="job-switcher__menu">
          <div className="job-switcher__section-label">Jobs</div>
          {jobs.map((job) => (
            <button
              type="button"
              key={job.id}
              className="job-switcher__item"
              onClick={() => {
                onSelect(job.id);
                onClose();
              }}
            >
              <span>{job.workplaceName}</span>
              {job.id === selectedJobId ? <span aria-label="Selected">✓</span> : null}
            </button>
          ))}

          <div className="job-switcher__divider" />

          <Link className="job-switcher__item job-switcher__link" to="/jobs/manage" onClick={onClose}>
            Manage Job
          </Link>
          <Link className="job-switcher__item job-switcher__link" to="/jobs/add" onClick={onClose}>
            Add New Job
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export default JobDropdown;