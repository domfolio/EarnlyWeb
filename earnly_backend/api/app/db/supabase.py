from typing import Any

import httpx
from fastapi import Depends, HTTPException, status

from api.app.core.config import Settings, get_settings


class SupabaseRestClient:
    def __init__(self, settings: Settings):
        self.settings = settings

    async def request(
        self,
        method: str,
        table: str,
        *,
        params: dict[str, Any] | None = None,
        json: Any | None = None,
        prefer: str | None = None,
    ) -> Any:
        headers = {
            "apikey": self.settings.supabase_service_role_key,
            "Authorization": f"Bearer {self.settings.supabase_service_role_key}",
            "Content-Type": "application/json",
        }
        if prefer:
            headers["Prefer"] = prefer

        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.request(
                method,
                f"{self.settings.rest_url}/{table}",
                params=params,
                json=json,
                headers=headers,
            )

        if response.status_code >= 400:
            try:
                detail = response.json()
            except ValueError:
                detail = response.text
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail={"supabase": detail})

        if response.status_code == status.HTTP_204_NO_CONTENT or not response.content:
            return None

        return response.json()


def get_supabase(settings: Settings = Depends(get_settings)) -> SupabaseRestClient:
    return SupabaseRestClient(settings)
