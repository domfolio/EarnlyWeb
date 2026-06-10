from datetime import date
from decimal import Decimal
from typing import Any

from fastapi import HTTPException, status

from api.app.core.auth import CurrentUser
from api.app.db.supabase import SupabaseRestClient
from api.app.services.calculations import calculate_entry_pay, calculate_worked_minutes
from api.app.services.weeks import get_day_key, get_start_of_week, get_week_dates


def decimal_to_float(value: Any) -> float:
    if value in (None, ""):
        return 0.0
    return float(Decimal(str(value)))


def normalize_time(value: str | None) -> str:
    if not value:
        return ""
    return value[:5]


def format_job(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "workplaceName": row["workplace_name"],
        "defaultHourlyRate": decimal_to_float(row["default_hourly_rate"]),
        "createdAt": row.get("created_at"),
        "updatedAt": row.get("updated_at"),
    }


def format_profile(row: dict[str, Any] | None) -> dict[str, Any]:
    return {
        "id": row.get("id") if row else None,
        "displayName": row.get("display_name") if row else None,
        "setupCompleted": bool(row.get("setup_completed")) if row else False,
        "selectedJobId": row.get("selected_job_id") if row else None,
    }


def empty_entry(work_date: date) -> dict[str, Any]:
    return {
        "workDate": work_date.isoformat(),
        "startTime": "",
        "endTime": "",
        "breakMinutes": 0,
        "hourlyRate": "",
        "notes": "",
    }


def format_entry(row: dict[str, Any] | None, work_date: date) -> dict[str, Any]:
    if not row:
        return empty_entry(work_date)

    override = row.get("hourly_rate_override")
    return {
        "id": row.get("id"),
        "workDate": row.get("work_date") or work_date.isoformat(),
        "startTime": normalize_time(row.get("start_time")),
        "endTime": normalize_time(row.get("end_time")),
        "breakMinutes": int(row.get("break_minutes") or 0),
        "hourlyRate": "" if override is None else str(override),
        "notes": row.get("notes") or "",
    }


def calculate_totals(entries_by_day: dict[str, dict[str, Any]], fallback_rate: float) -> dict[str, Any]:
    minutes = 0
    pay = 0.0

    for entry in entries_by_day.values():
        entry_minutes = calculate_worked_minutes(entry["startTime"], entry["endTime"], entry["breakMinutes"])
        hourly_rate = entry.get("hourlyRate")
        pay += calculate_entry_pay(
            entry["startTime"],
            entry["endTime"],
            entry["breakMinutes"],
            fallback_rate,
            None if hourly_rate in (None, "") else hourly_rate,
        )
        minutes += entry_minutes

    return {"minutes": minutes, "pay": round(pay, 2)}


async def ensure_profile(db: SupabaseRestClient, user: CurrentUser) -> dict[str, Any]:
    profiles = await db.request("GET", "profiles", params={"select": "*", "id": f"eq.{user.id}", "limit": "1"})
    if profiles:
        return profiles[0]

    created = await db.request(
        "POST",
        "profiles",
        json={"id": user.id},
        prefer="return=representation",
    )
    return created[0]


async def get_user_jobs(db: SupabaseRestClient, user: CurrentUser) -> list[dict[str, Any]]:
    return await db.request(
        "GET",
        "jobs",
        params={
            "select": "*",
            "user_id": f"eq.{user.id}",
            "archived_at": "is.null",
            "order": "created_at.asc",
        },
    )


async def get_job_or_404(db: SupabaseRestClient, user: CurrentUser, job_id: str) -> dict[str, Any]:
    jobs = await db.request(
        "GET",
        "jobs",
        params={"select": "*", "id": f"eq.{job_id}", "user_id": f"eq.{user.id}", "archived_at": "is.null", "limit": "1"},
    )
    if not jobs:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return jobs[0]


async def build_week_response(
    db: SupabaseRestClient,
    user: CurrentUser,
    job: dict[str, Any],
    week_start_date: str,
) -> dict[str, Any]:
    week_dates = get_week_dates(week_start_date)
    normalized_week_start = week_dates[0][1].isoformat()
    week_end = week_dates[-1][1].isoformat()

    rows = await db.request(
        "GET",
        "shift_entries",
        params={
            "select": "*",
            "user_id": f"eq.{user.id}",
            "job_id": f"eq.{job['id']}",
            "week_start_date": f"eq.{normalized_week_start}",
            "order": "work_date.asc",
        },
    )

    rows_by_date = {row["work_date"]: row for row in rows}
    entries = {day_key: format_entry(rows_by_date.get(work_date.isoformat()), work_date) for day_key, work_date in week_dates}
    fallback_rate = decimal_to_float(job["default_hourly_rate"])

    return {
        "job": format_job(job),
        "weekStartDate": normalized_week_start,
        "entries": entries,
        "totals": calculate_totals(entries, fallback_rate),
    }


def normalize_hourly_rate(value: Any) -> float | None:
    if value in (None, ""):
        return None
    return float(value)


def entry_payload(user: CurrentUser, job_id: str, work_date: date, data: dict[str, Any]) -> dict[str, Any]:
    return {
        "user_id": user.id,
        "job_id": job_id,
        "work_date": work_date.isoformat(),
        "week_start_date": get_start_of_week(work_date).isoformat(),
        "start_time": data.get("start_time"),
        "end_time": data.get("end_time"),
        "break_minutes": data.get("break_minutes") if data.get("break_minutes") is not None else 0,
        "hourly_rate_override": normalize_hourly_rate(data.get("hourly_rate")),
        "notes": data.get("notes") or "",
    }


def day_key_for_date(value: date) -> str:
    return get_day_key(value)
