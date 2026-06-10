from datetime import date, timedelta


WEEK_DAYS = [
    {"key": "mon", "label": "Monday"},
    {"key": "tue", "label": "Tuesday"},
    {"key": "wed", "label": "Wednesday"},
    {"key": "thu", "label": "Thursday"},
    {"key": "fri", "label": "Friday"},
    {"key": "sat", "label": "Saturday"},
    {"key": "sun", "label": "Sunday"},
]


def parse_date(value: str) -> date:
    return date.fromisoformat(value)


def get_start_of_week(value: date) -> date:
    return value - timedelta(days=value.weekday())


def get_week_dates(week_start_date: str) -> list[tuple[str, date]]:
    start = get_start_of_week(parse_date(week_start_date))
    return [(day["key"], start + timedelta(days=index)) for index, day in enumerate(WEEK_DAYS)]


def get_day_key(value: date) -> str:
    return WEEK_DAYS[value.weekday()]["key"]
