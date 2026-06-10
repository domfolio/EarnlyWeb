from typing import Any

from fastapi import APIRouter, Depends
from fastapi import HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from api.app.core.auth import CurrentUser, get_current_user
from api.app.db.supabase import SupabaseRestClient, get_supabase
from api.app.routers.helpers import ensure_profile, format_job, format_profile, get_job_or_404, get_user_jobs


router = APIRouter(prefix="/me", tags=["me"])


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    display_name: str | None = Field(default=None, alias="displayName")
    selected_job_id: str | None = Field(default=None, alias="selectedJobId")


@router.get("")
async def get_me(
    user: CurrentUser = Depends(get_current_user),
    db: SupabaseRestClient = Depends(get_supabase),
) -> dict[str, Any]:
    profile = await ensure_profile(db, user)
    jobs = await get_user_jobs(db, user)
    active_job_ids = {job["id"] for job in jobs}
    selected_job_id = profile.get("selected_job_id") if profile.get("selected_job_id") in active_job_ids else None
    selected_job_id = selected_job_id or (jobs[0]["id"] if jobs else None)

    if selected_job_id and selected_job_id != profile.get("selected_job_id"):
        updated = await db.request(
            "PATCH",
            "profiles",
            params={"id": f"eq.{user.id}"},
            json={"selected_job_id": selected_job_id},
            prefer="return=representation",
        )
        profile = updated[0]

    return {
        "user": {"id": user.id, "email": user.email},
        "profile": format_profile(profile),
        "jobs": [format_job(job) for job in jobs],
    }


@router.patch("")
async def update_me(
    payload: ProfileUpdate,
    user: CurrentUser = Depends(get_current_user),
    db: SupabaseRestClient = Depends(get_supabase),
) -> dict[str, Any]:
    patch: dict[str, Any] = {}
    if payload.display_name is not None:
        patch["display_name"] = payload.display_name.strip() or None
    if payload.selected_job_id is not None:
        try:
            await get_job_or_404(db, user, payload.selected_job_id)
        except HTTPException as error:
            if error.status_code == status.HTTP_404_NOT_FOUND:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected job is invalid") from error
            raise
        patch["selected_job_id"] = payload.selected_job_id

    profile = await ensure_profile(db, user)
    if patch:
        updated = await db.request(
            "PATCH",
            "profiles",
            params={"id": f"eq.{profile['id']}"},
            json=patch,
            prefer="return=representation",
        )
        profile = updated[0]

    return {"profile": format_profile(profile)}
