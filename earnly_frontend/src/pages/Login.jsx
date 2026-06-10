import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Button from "../components/Button";
import InputField from "../components/InputField";
import Modal from "../components/Modal";

function Login({ onLogin, authError }) {
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    const hasEmail = email.trim().length > 0;
    const hasPassword = password.trim().length > 0;

    if (!hasEmail && !hasPassword) {
      setFormError("Please enter your login details.");
      return;
    }

    if (!hasEmail) {
      setFormError("Please enter your email.");
      return;
    }

    if (!hasPassword) {
      setFormError("Please enter your password.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");
      await onLogin({ email: email.trim(), password });
    } catch (error) {
      setFormError(error.message || "Unable to log in. Please check your details.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function closeLegalModal() {
    setActiveLegalModal(null);
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-lockup">
          <span className="brand-mark">E</span>
          <div>
            <p className="eyebrow">Welcome back</p>
            <h1>Earnly</h1>
          </div>
        </div>

        <p className="auth-card__intro">Track shifts, breaks, and weekly pay without the spreadsheet stress.</p>
        {location.state?.message ? <p className="form-message form-message--success">{location.state.message}</p> : null}
        {authError ? <p className="form-message form-message--error">{authError}</p> : null}

        <form className="form-stack" onSubmit={handleSubmit}>
          <InputField
            label="Email"
            type="email"
            placeholder="you@student.edu.au"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (formError) setFormError("");
            }}
          />
          <InputField
            label="Password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (formError) setFormError("");
            }}
          />
          {formError ? (
            <p className="form-message form-message--error" role="alert">
              {formError}
            </p>
          ) : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log in"}
          </Button>
        </form>

        <div className="auth-card__links">
          <Link to="/forgot-password">Forgot password?</Link>
          <span>
            New here? <Link to="/signup">Create account</Link>
          </span>
        </div>

        <div className="legal-info-box">
          <p>
            By using Earnly, you agree to our{" "}
            <button type="button" className="legal-link-button" onClick={() => setActiveLegalModal("terms")}>
              Terms and Conditions
            </button>{" "}
            and{" "}
            <button type="button" className="legal-link-button" onClick={() => setActiveLegalModal("privacy")}>
              Privacy Notice
            </button>
            .
          </p>
        </div>
      </section>

      {activeLegalModal === "terms" ? (
        <Modal title="Terms and Conditions" actionLabel="Close" onClose={closeLegalModal}>
          <div className="legal-copy">
            <p>
              Earnly is a student MVP prototype designed to help users track work shifts, estimated income,
              break time, and job-related notes. The app is intended for personal organisation only and does
              not provide financial, tax, legal, payroll, or employment advice.
            </p>
            <p>
              Users are responsible for checking their actual payslips, workplace agreements, tax obligations,
              visa conditions, and employment rights through official sources. Earnly’s calculations are
              estimates only and may not reflect final wages, tax deductions, superannuation, penalty rates,
              overtime, or employer payroll adjustments.
            </p>
            <p>
              By using this prototype, users agree to enter accurate information and understand that the app is
              for demonstration and educational purposes.
            </p>
          </div>
        </Modal>
      ) : null}

      {activeLegalModal === "privacy" ? (
        <Modal title="Privacy Notice" actionLabel="Close" onClose={closeLegalModal}>
          <div className="legal-copy">
            <p>
              Earnly stores information that users enter into the app for the purpose of tracking shifts and
              estimated income. This may include workplace names, hourly rates, start times, end times, break
              times, calculated pay, and optional notes.
            </p>
            <p>
              Earnly does not require bank account details, tax file numbers, passport details, visa
              documents, or sensitive identity information. Users should not enter private or highly sensitive
              personal information into the notes field.
            </p>
            <p>
              Data is stored securely in Supabase for authenticated users and is used only to provide the
              shift, job, notes, and pay-estimate features in Earnly.
            </p>
          </div>
        </Modal>
      ) : null}
    </main>
  );
}

export default Login;