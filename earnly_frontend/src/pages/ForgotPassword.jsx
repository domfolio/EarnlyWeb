import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import InputField from "../components/InputField";

function ForgotPassword({ onSendReset }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim()) {
      setFormError("Please enter your email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");
      await onSendReset(email.trim());
      setMessage("If an account exists for that email, Supabase will send a reset link shortly.");
    } catch (error) {
      setFormError(error.message || "Unable to send reset link.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">No stress</p>
        <h1>Forgot password?</h1>
        <p className="auth-card__intro">Enter your email and we’ll send a Supabase password reset link.</p>

        <form className="form-stack" onSubmit={handleSubmit}>
          <InputField
            label="Email"
            type="email"
            placeholder="you@student.edu.au"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {formError ? <p className="form-message form-message--error">{formError}</p> : null}
          {message ? <p className="form-message form-message--success">{message}</p> : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send reset link"}
          </Button>
        </form>

        <p className="auth-card__footer">
          Remembered it? <Link to="/login">Back to login</Link>
          <button type="button" className="link-button" onClick={() => navigate("/reset-password")}>
            Already have a reset link?
          </button>
        </p>
      </section>
    </main>
  );
}

export default ForgotPassword;