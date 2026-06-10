import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import InputField from "../components/InputField";

function SignUp({ onSignUp }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      setFormError("Please complete all sign-up fields.");
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");
      await onSignUp({ name: name.trim(), email: email.trim(), password });
    } catch (error) {
      setFormError(error.message || "Unable to create your account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-lockup">
          <span className="brand-mark">E</span>
          <div>
            <p className="eyebrow">Start tracking</p>
            <h1>Create your Earnly account</h1>
          </div>
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          <InputField
            label="Name"
            type="text"
            placeholder="Alex Chen"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <InputField
            label="Email"
            type="email"
            placeholder="you@student.edu.au"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <InputField
            label="Password"
            type="password"
            placeholder="Create a password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {formError ? (
            <p className="form-message form-message--error" role="alert">
              {formError}
            </p>
          ) : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Sign up"}
          </Button>
        </form>

        <p className="auth-card__footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}

export default SignUp;