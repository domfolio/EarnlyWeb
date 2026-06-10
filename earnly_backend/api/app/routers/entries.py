from fastapi import APIRouter, Depends

from api.app.core.auth import CurrentUser, get_current_user
from api.app.db.supabase import SupabaseRestClient, get_supabase
from api.app.routers.helpers import (
    build_week_response,
    day_key_for_date,
    entry_payload,
    format_entry,
    format_job,
    get_job_or_404,
)
from api.app.schemas.entries import EntryUpdate
from api.app.services.weeks import get_start_of_week, parse_date


router = APIRouter(prefix="/jobs/{job_id}", tags=["entries"])


@router.get("/weeks/{week_start_date}")
async def get_week(
    job_id: str,
    week_start_date: str,
    user: CurrentUser = Depends(get_current_user),
    db: SupabaseRestClient = Depends(get_supabase),
) -> dict:
    job = await get_job_or_404(db, user, job_id)
    return await build_week_response(db, user, job, week_start_date)


@router.delete("/weeks/{week_start_date}")
async def clear_week(
    job_id: str,
    week_start_date: str,
    user: CurrentUser = Depends(get_current_user),
    db: SupabaseRestClient = Depends(get_supabase),
) -> dict:
    job = await get_job_or_404(db, user, job_id)
    start = get_start_of_week(parse_date(week_start_date)).isoformat()

    await db.request(
        "DELETE",
        "shift_entries",
        params={"user_id": f"eq.{user.id}", "job_id": f"eq.{job_id}", "week_start_date": f"eq.{start}"},
    )

    return await build_week_response(db, user, job, start)


@router.get("/entries/{work_date}")
async def get_entry(
    job_id: str,
    work_date: str,
    user: CurrentUser = Depends(get_current_user),
    db: SupabaseRestClient = Depends(get_supabase),
) -> dict:
    job = await get_job_or_404(db, user, job_id)
    date_value = parse_date(work_date)
    rows = await db.request(
        "GET",
        "shift_entries",
        params={"select": "*", "user_id": f"eq.{user.id}", "job_id": f"eq.{job_id}", "work_date": f"eq.{date_value.isoformat()}", "limit": "1"},
    )
    return {"job": format_job(job), "dayKey": day_key_for_date(date_value), "entry": format_entry(rows[0] if rows else None, date_value)}


@router.patch("/entries/{work_date}")
async def upsert_entry(
    job_id: str,
    work_date: str,
    payload: EntryUpdate,
    user: CurrentUser = Depends(get_current_user),
    db: SupabaseRestClient = Depends(get_supabase),
) -> dict:
    await get_job_or_404(db, user, job_id)
    date_value = parse_date(work_date)
    existing_rows = await db.request(
        "GET",
        "shift_entries",
        params={"select": "*", "user_id": f"eq.{user.id}", "job_id": f"eq.{job_id}", "work_date": f"eq.{date_value.isoformat()}", "limit": "1"},
    )
    existing = existing_rows[0] if existing_rows else {}
    data = {
        "start_time": existing.get("start_time"),
        "end_time": existing.get("end_time"),
        "break_minutes": existing.get("break_minutes", 0),
        "hourly_rate": existing.get("hourly_rate_override"),
        "notes": existing.get("notes", ""),
    }
    data.update(payload.model_dump(exclude_unset=True, by_alias=False))
    row_payload = entry_payload(user, job_id, date_value, data)

    rows = await db.request(
        "POST",
        "shift_entries",
        params={"on_conflict": "job_id,work_date"},
        json=row_payload,
        prefer="resolution=merge-duplicates,return=representation",
    )

    return {"dayKey": day_key_for_date(date_value), "entry": format_entry(rows[0], date_value)}
