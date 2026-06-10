function InputField({ label, hint, error, className = "", ...props }) {
  return (
    <label className={`field ${className}`.trim()}>
      <span className="field__label">{label}</span>
      <input className={`field__input ${error ? "field__input--error" : ""}`} {...props} />
      {hint && !error ? <span className="field__hint">{hint}</span> : null}
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  );
}

export default InputField;