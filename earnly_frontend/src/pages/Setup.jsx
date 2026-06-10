import { useState } from "react";
import Button from "../components/Button";
import InputField from "../components/InputField";

function Setup({ onSetup }) {
  const [workplaceName, setWorkplaceName] = useState("");
  const [defaultHourlyRate, setDefaultHourlyRate] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const nextErrors = {};
    const rate = Number(defaultHourlyRate);

    if (!workplaceName.trim()) nextErrors.workplaceName = "Please enter your workplace name.";
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
      await onSetup({ workplaceName, defaultHourlyRate });
    } catch (error) {
      setFormError(error.message || "Unable to complete setup.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card setup-card">
        <p className="eyebrow">Quick setup</p>
        <h1>Set up your first job</h1>
        <p className="auth-card__intro">Add your workplace and usual hourly rate to start calculating weekly pay.</p>

        <form className="form-stack" onSubmit={handleSubmit}>
          <InputField
            label="Workplace name"
            type="text"
            placeholder="Campus Cafe"
            value={workplaceName}
            onChange={(event) => setWorkplaceName(event.target.value)}
            error={errors.workplaceName}
          />
          <InputField
            label="Default hourly rate"
            type="number"
            min="0"
            step="0.01"
            placeholder="29.33"
            value={defaultHourlyRate}
            onChange={(event) => setDefaultHourlyRate(event.target.value)}
            error={errors.defaultHourlyRate}
            hint="You can customise this later for each job or shift."
          />
          {formError ? <p className="form-message form-message--error">{formError}</p> : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Setting up..." : "Go to dashboard"}
          </Button>
        </form>
      </section>
    </main>
  );
}

export default Setup;