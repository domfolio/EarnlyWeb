import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import InputField from "../components/InputField";

function ResetPassword({ onResetPassword }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!password || !confirmPassword) {
      setFormError("Please enter and confirm your new password.");
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");
      await onResetPassword(password);
      navigate("/login", { state: { message: "Password updated. Please log in with your new password." } });
    } catch (error) {
      setFormError(error.message || "Unable to reset your password. Please open your reset link again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Almost there</p>
        <h1>Reset password</h1>
        <p className="auth-card__intro">Create a new password after opening the reset link from your email.</p>

        <form className="form-stack" onSubmit={handleSubmit}>
          <InputField
            label="New password"
            type="password"
            placeholder="New password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <InputField
            label="Confirm password"
            type="password"
            placeholder="Confirm password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          {formError ? <p className="form-message form-message--error">{formError}</p> : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Resetting..." : "Reset password"}
          </Button>
        </form>

        <p className="auth-card__footer">
          <Link to="/login">Back to login</Link>
        </p>
      </section>
    </main>
  );
}

export default ResetPassword;