import { useEffect } from "react";
import Button from "./Button";

function Modal({ title, children, onClose, actionLabel = "Got it" }) {
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose} role="presentation">
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-card__close" type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 id="modal-title">{title}</h2>
        <div className="modal-card__content">{children}</div>
        <Button type="button" onClick={onClose} className="modal-card__action">
          {actionLabel}
        </Button>
      </section>
    </div>
  );
}

export default Modal;