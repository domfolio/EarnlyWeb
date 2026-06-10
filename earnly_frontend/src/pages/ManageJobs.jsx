import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import InputField from "../components/InputField";
import { formatCurrency } from "../utils/calculations";

function ManageJobs({ jobs, selectedJobId, onSelectJob, onUpdateJob, onDeleteJob }) {
  const navigate = useNavigate();
  const [editingJobId, setEditingJobId] = useState(selectedJobId ?? jobs[0]?.id);
  const editingJob = jobs.find((job) => job.id === editingJobId) ?? jobs[0];
  const [workplaceName, setWorkplaceName] = useState(editingJob?.workplaceName ?? "");
  const [defaultHourlyRate, setDefaultHourlyRate] = useState(String(editingJob?.defaultHourlyRate ?? ""));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!editingJob) return;
    setWorkplaceName(editingJob.workplaceName);
    setDefaultHourlyRate(String(editingJob.defaultHourlyRate));
    setErrors({});
  }, [editingJob]);

  function validate() {
    const nextErrors = {};
    const rate = Number(defaultHourlyRate);

    if (!workplaceName.trim()) nextErrors.workplaceName = "Workplace name is required.";
    if (!defaultHourlyRate || Number.isNaN(rate) || rate <= 0) {
      nextErrors.defaultHourlyRate = "Enter a valid hourly rate.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!editingJob || !validate()) return;

    try {
      setIsSubmitting(true);
      setFormError("");
      await onUpdateJob(editingJob.id, { workplaceName, defaultHourlyRate });
      await onSelectJob(editingJob.id);
      navigate("/dashboard");
    } catch (error) {
      setFormError(error.message || "Unable to save job changes.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!editingJob || jobs.length <= 1) return;

    try {
      setIsSubmitting(true);
      setFormError("");
      await onDeleteJob(editingJob.id);
      const nextJob = jobs.find((job) => job.id !== editingJob.id);
      setEditingJobId(nextJob?.id);
    } catch (error) {
      setFormError(error.message || "Unable to delete this job.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-shell manage-page">
      <header className="page-header">
        <Button type="button" variant="ghost" onClick={() => navigate("/dashboard")}>
          ← Back
        </Button>
        <div>
          <p className="eyebrow">Jobs</p>
          <h1>Manage jobs</h1>
        </div>
      </header>

      <section className="manage-layout">
        <aside className="job-list panel-card">
          <h2>Your jobs</h2>
          {jobs.map((job) => (
            <button
              type="button"
              key={job.id}
              className={`job-list__item ${job.id === editingJob?.id ? "job-list__item--active" : ""}`}
              onClick={() => setEditingJobId(job.id)}
            >
              <span>
                <strong>{job.workplaceName}</strong>
                <small>{formatCurrency(job.defaultHourlyRate)} / hr</small>
              </span>
              {job.id === selectedJobId ? <em>Current</em> : null}
            </button>
          ))}
        </aside>

        <section className="panel-card">
          <h2>Edit selected job</h2>
          <form className="form-stack" onSubmit={handleSave}>
            <InputField
              label="Workplace name"
              type="text"
              value={workplaceName}
              onChange={(event) => setWorkplaceName(event.target.value)}
              error={errors.workplaceName}
            />
            <InputField
              label="Default hourly rate"
              type="number"
              min="0"
              step="0.01"
              value={defaultHourlyRate}
              onChange={(event) => setDefaultHourlyRate(event.target.value)}
              error={errors.defaultHourlyRate}
            />

            <div className="button-row">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={jobs.length <= 1 || isSubmitting}
                title={jobs.length <= 1 ? "At least one job is required" : "Delete job"}
              >
                Delete job
              </Button>
            </div>
            {formError ? <p className="form-message form-message--error">{formError}</p> : null}
            {jobs.length <= 1 ? <p className="soft-note">You need at least one job, so deletion is disabled.</p> : null}
          </form>
        </section>
      </section>
    </main>
  );
}

export default ManageJobs;