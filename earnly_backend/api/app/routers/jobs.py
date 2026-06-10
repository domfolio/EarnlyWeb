from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from api.app.core.auth import CurrentUser, get_current_user
from api.app.db.supabase import SupabaseRestClient, get_supabase
from api.app.routers.helpers import format_job, get_job_or_404, get_user_jobs
from api.app.schemas.jobs import JobCreate, JobUpdate


router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("")
async def list_jobs(
    user: CurrentUser = Depends(get_current_user),
    db: SupabaseRestClient = Depends(get_supabase),
) -> dict:
    jobs = await get_user_jobs(db, user)
    return {"jobs": [format_job(job) for job in jobs]}


@router.post("")
async def create_job(
    payload: JobCreate,
    user: CurrentUser = Depends(get_current_user),
    db: SupabaseRestClient = Depends(get_supabase),
) -> dict:
    rows = await db.request(
        "POST",
        "jobs",
        json={
            "user_id": user.id,
            "workplace_name": payload.workplace_name.strip(),
            "default_hourly_rate": payload.default_hourly_rate,
        },
        prefer="return=representation",
    )
    job = rows[0]

    await db.request(
        "PATCH",
        "profiles",
        params={"id": f"eq.{user.id}"},
        json={"selected_job_id": job["id"], "setup_completed": True},
    )

    return {"job": format_job(job)}


@router.get("/{job_id}")
async def get_job(
    job_id: str,
    user: CurrentUser = Depends(get_current_user),
    db: SupabaseRestClient = Depends(get_supabase),
) -> dict:
    return {"job": format_job(await get_job_or_404(db, user, job_id))}


@router.patch("/{job_id}")
async def update_job(
    job_id: str,
    payload: JobUpdate,
    user: CurrentUser = Depends(get_current_user),
    db: SupabaseRestClient = Depends(get_supabase),
) -> dict:
    await get_job_or_404(db, user, job_id)

    patch = {}
    if payload.workplace_name is not None:
        patch["workplace_name"] = payload.workplace_name.strip()
    if payload.default_hourly_rate is not None:
        patch["default_hourly_rate"] = payload.default_hourly_rate

    if not patch:
        return {"job": format_job(await get_job_or_404(db, user, job_id))}

    rows = await db.request(
        "PATCH",
        "jobs",
        params={"id": f"eq.{job_id}", "user_id": f"eq.{user.id}"},
        json=patch,
        prefer="return=representation",
    )
    return {"job": format_job(rows[0])}


@router.delete("/{job_id}")
async def delete_job(
    job_id: str,
    user: CurrentUser = Depends(get_current_user),
    db: SupabaseRestClient = Depends(get_supabase),
) -> dict:
    await get_job_or_404(db, user, job_id)
    jobs = await get_user_jobs(db, user)
    if len(jobs) <= 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one job is required")

    rows = await db.request(
        "PATCH",
        "jobs",
        params={"id": f"eq.{job_id}", "user_id": f"eq.{user.id}"},
        json={"archived_at": datetime.now(timezone.utc).isoformat()},
        prefer="return=representation",
    )

    remaining = [job for job in jobs if job["id"] != job_id]
    await db.request(
        "PATCH",
        "profiles",
        params={"id": f"eq.{user.id}", "selected_job_id": f"eq.{job_id}"},
        json={"selected_job_id": remaining[0]["id"]},
    )

    return {"job": format_job(rows[0]), "selectedJobId": remaining[0]["id"]}
