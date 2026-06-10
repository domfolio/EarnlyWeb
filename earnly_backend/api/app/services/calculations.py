from decimal import Decimal, ROUND_HALF_UP


def time_to_minutes(value: str | None) -> int | None:
    if not value or ":" not in value:
        return None

    try:
        hours, minutes = value.split(":")[:2]
        return int(hours) * 60 + int(minutes)
    except (TypeError, ValueError):
        return None


def calculate_worked_minutes(start_time: str | None, end_time: str | None, break_minutes: int = 0) -> int:
    start = time_to_minutes(start_time)
    end = time_to_minutes(end_time)

    if start is None or end is None:
        return 0

    shift_minutes = max(end - start, 0)
    return max(shift_minutes - int(break_minutes or 0), 0)


def calculate_entry_pay(
    start_time: str | None,
    end_time: str | None,
    break_minutes: int,
    fallback_rate: float | str | Decimal,
    hourly_rate_override: float | str | Decimal | None = None,
) -> float:
    worked_minutes = calculate_worked_minutes(start_time, end_time, break_minutes)
    rate = Decimal(str(hourly_rate_override if hourly_rate_override is not None else fallback_rate or 0))
    pay = (Decimal(worked_minutes) / Decimal(60)) * rate
    return float(pay.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
