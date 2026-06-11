import { useEffect, useRef, useState } from "react";

const EMPTY_PLACEHOLDER = "--:--";
const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, "0"));
const SAVED_TIME_PATTERN = /^(\d{2}):(\d{2})$/;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatTime(hour, minute) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function normaliseSavedTime(value) {
  if (typeof value !== "string") return "";

  const match = value.trim().match(SAVED_TIME_PATTERN);
  if (!match) return "";

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return "";
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return "";

  return formatTime(hour, minute);
}

function getDigitsFromValue(value) {
  const safeValue = normaliseSavedTime(value);
  return safeValue ? safeValue.replace(":", "") : "";
}

function appendDigit(currentDigits, digit) {
  if (!/^\d$/.test(digit)) return currentDigits;
  if (!currentDigits) return digit;

  const usesSingleDigitHour = /^[3-9]$/.test(currentDigits[0]);
  const maxLength = usesSingleDigitHour ? 3 : 4;

  if (currentDigits.length >= maxLength) return digit;

  if (!usesSingleDigitHour && currentDigits.length === 1) {
    const nextDigit = currentDigits[0] === "2" ? String(clamp(Number(digit), 0, 3)) : digit;
    return currentDigits + nextDigit;
  }

  const isFirstMinuteDigit = usesSingleDigitHour ? currentDigits.length === 1 : currentDigits.length === 2;
  const nextDigit = isFirstMinuteDigit ? String(clamp(Number(digit), 0, 5)) : digit;

  return currentDigits + nextDigit;
}

function getDigitsFromTypedValue(value) {
  return String(value)
    .replace(/\D/g, "")
    .split("")
    .reduce((digits, digit) => appendDigit(digits, digit), "");
}

function getTimeState(digits) {
  if (!digits) {
    return {
      displayValue: "",
      hour: "00",
      minute: "00",
      isComplete: false,
      value: "",
    };
  }

  const usesSingleDigitHour = /^[3-9]$/.test(digits[0]);
  const hourDigits = usesSingleDigitHour ? `0${digits[0]}` : digits.slice(0, 2);
  const minuteStartIndex = usesSingleDigitHour ? 1 : 2;
  const minuteDigits = digits.slice(minuteStartIndex, minuteStartIndex + 2);
  const hourDisplay = hourDigits.length === 0 ? "--" : hourDigits.length === 1 ? `${hourDigits}-` : hourDigits;
  const minuteDisplay = minuteDigits.length === 0 ? "--" : minuteDigits.length === 1 ? `${minuteDigits}-` : minuteDigits;
  const isComplete = hourDigits.length === 2 && minuteDigits.length === 2;
  const hour = hourDigits.length === 2 ? hourDigits : "00";
  const minute = minuteDigits.length === 2 ? minuteDigits : "00";

  return {
    displayValue: `${hourDisplay}:${minuteDisplay}`,
    hour,
    minute,
    isComplete,
    value: isComplete ? `${hour}:${minute}` : "",
  };
}

function createChangeEvent(value) {
  return {
    target: { value },
    currentTarget: { value },
  };
}

function TimePicker({ label, value, onChange, ariaLabel, className = "" }) {
  const rootRef = useRef(null);
  const safeValue = normaliseSavedTime(value);
  const [draftDigits, setDraftDigits] = useState(() => getDigitsFromValue(safeValue));
  const [isOpen, setIsOpen] = useState(false);
  const timeState = getTimeState(draftDigits);
  const safeTimeState = getTimeState(getDigitsFromValue(safeValue));
  const selectedHour = timeState.hour || safeTimeState.hour || "00";
  const selectedMinute = timeState.minute || safeTimeState.minute || "00";
  const accessibleLabel = ariaLabel || label || "Time";

  useEffect(() => {
    setDraftDigits(getDigitsFromValue(safeValue));
  }, [safeValue]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleDocumentMouseDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentMouseDown);
    return () => document.removeEventListener("mousedown", handleDocumentMouseDown);
  }, [isOpen]);

  function emitChange(nextValue) {
    onChange?.(createChangeEvent(nextValue));
  }

  function updateDraft(nextDigits) {
    const nextTimeState = getTimeState(nextDigits);

    setDraftDigits(nextDigits);

    if (!nextDigits) {
      if (safeValue !== "") emitChange("");
      return;
    }

    if (nextTimeState.isComplete && nextTimeState.value !== safeValue) {
      emitChange(nextTimeState.value);
    }
  }

  function handleInputChange(event) {
    updateDraft(getDigitsFromTypedValue(event.target.value));
  }

  function handleInputBlur() {
    if (!draftDigits || timeState.isComplete) return;

    setDraftDigits(getDigitsFromValue(safeValue));
  }

  function handleInputKeyDown(event) {
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      updateDraft(appendDigit(draftDigits, event.key));
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      updateDraft(draftDigits.slice(0, -1));
      return;
    }

    if (event.key === "Delete") {
      event.preventDefault();
      updateDraft("");
      return;
    }

    if (event.key === "Enter") {
      event.currentTarget.blur();
    }

    if (event.key === "Escape") {
      setDraftDigits(getDigitsFromValue(safeValue));
      setIsOpen(false);
      event.currentTarget.blur();
    }
  }

  function updateHour(nextHour) {
    const nextValue = `${nextHour}:${selectedMinute}`;
    setDraftDigits(getDigitsFromValue(nextValue));
    emitChange(nextValue);
  }

  function updateMinute(nextMinute) {
    const nextValue = `${selectedHour}:${nextMinute}`;
    setDraftDigits(getDigitsFromValue(nextValue));
    emitChange(nextValue);
  }

  return (
    <div ref={rootRef} className={`field time-picker ${isOpen ? "time-picker--open" : ""} ${className}`.trim()}>
      {label ? <span className="field__label">{label}</span> : null}
      <div className="time-picker__field">
        <input
          className={`field__input time-picker__input ${!timeState.displayValue ? "time-picker__input--empty" : ""}`.trim()}
          type="text"
          inputMode="numeric"
          placeholder={EMPTY_PLACEHOLDER}
          value={timeState.displayValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          aria-label={accessibleLabel}
        />
        <button
          type="button"
          className="time-picker__toggle"
          onClick={() => setIsOpen((open) => !open)}
          aria-label={`Open ${accessibleLabel} picker`}
          aria-expanded={isOpen}
        >
          <svg className="time-picker__icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M12 7v5l3.2 2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </button>
      </div>

      {isOpen ? (
        <div className="time-picker__popover" role="dialog" aria-label={`${accessibleLabel} picker`}>
          <div className="time-picker__column" role="listbox" aria-label={`${accessibleLabel} hours`}>
            {HOURS.map((option) => (
              <button
                key={option}
                type="button"
                className={`time-picker__option ${option === selectedHour ? "time-picker__option--active" : ""}`.trim()}
                onClick={() => updateHour(option)}
                role="option"
                aria-selected={option === selectedHour}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="time-picker__column" role="listbox" aria-label={`${accessibleLabel} minutes`}>
            {MINUTES.map((option) => (
              <button
                key={option}
                type="button"
                className={`time-picker__option ${option === selectedMinute ? "time-picker__option--active" : ""}`.trim()}
                onClick={() => updateMinute(option)}
                role="option"
                aria-selected={option === selectedMinute}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default TimePicker;