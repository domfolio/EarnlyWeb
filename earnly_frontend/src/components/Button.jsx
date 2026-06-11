function Button({ children, variant = "primary", className = "", loading = false, disabled = false, ...props }) {
  const classes = `btn btn--${variant} ${loading ? "btn--loading" : ""} ${className}`.replace(/\s+/g, " ").trim();
  return (
    <button className={classes} disabled={disabled || loading} aria-busy={loading} {...props}>
      {loading ? <span className="btn__spinner" aria-hidden="true" /> : null}
      <span className="btn__label">{children}</span>
    </button>
  );
}

export default Button;