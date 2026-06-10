from fastapi import APIRouter, Depends

from api.app.core.auth import CurrentUser, get_current_user
from api.app.db.supabase import SupabaseRestClient, get_supabase
from api.app.routers.helpers import format_job, format_profile
from api.app.schemas.jobs import JobCreate


router = APIRouter(prefix="/setup", tags=["setup"])


@router.post("")
async def complete_setup(
    payload: JobCreate,
    user: CurrentUser = Depends(get_current_user),
    db: SupabaseRestClient = Depends(get_supabase),
) -> dict:
    job_rows = await db.request(
        "POST",
        "jobs",
        json={
            "user_id": user.id,
            "workplace_name": payload.workplace_name.strip(),
            "default_hourly_rate": payload.default_hourly_rate,
        },
        prefer="return=representation",
    )
    job = job_rows[0]

    profile_rows = await db.request(
        "PATCH",
        "profiles",
        params={"id": f"eq.{user.id}"},
        json={"setup_completed": True, "selected_job_id": job["id"]},
        prefer="return=representation",
    )

    return {"profile": format_profile(profile_rows[0]), "job": format_job(job)}
