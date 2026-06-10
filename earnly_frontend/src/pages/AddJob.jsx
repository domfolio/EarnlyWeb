import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import InputField from "../components/InputField";

function AddJob({ onAddJob }) {
  const navigate = useNavigate();
  const [workplaceName, setWorkplaceName] = useState("");
  const [defaultHourlyRate, setDefaultHourlyRate] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      setFormError("");
      await onAddJob({ workplaceName, defaultHourlyRate });
    } catch (error) {
      setFormError(error.message || "Unable to save this job.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-shell narrow-page">
      <header className="page-header">
        <Button type="button" variant="ghost" onClick={() => navigate("/dashboard")}>
          ← Back
        </Button>
        <div>
          <p className="eyebrow">Jobs</p>
          <h1>Add new job</h1>
        </div>
      </header>

      <section className="panel-card">
        <form className="form-stack" onSubmit={handleSubmit}>
          <InputField
            label="Workplace name"
            type="text"
            placeholder="Library Desk"
            value={workplaceName}
            onChange={(event) => setWorkplaceName(event.target.value)}
            error={errors.workplaceName}
          />
          <InputField
            label="Default hourly rate"
            type="number"
            min="0"
            step="0.01"
            placeholder="30.10"
            value={defaultHourlyRate}
            onChange={(event) => setDefaultHourlyRate(event.target.value)}
            error={errors.defaultHourlyRate}
          />
          {formError ? <p className="form-message form-message--error">{formError}</p> : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save job"}
          </Button>
        </form>
      </section>
    </main>
  );
}

export default AddJob;