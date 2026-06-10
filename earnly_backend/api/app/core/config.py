from functools import lru_cache
from typing import List

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: AnyHttpUrl = Field(..., alias="SUPABASE_URL")
    supabase_anon_key: str = Field(..., alias="SUPABASE_ANON_KEY")
    supabase_service_role_key: str = Field(..., alias="SUPABASE_SERVICE_ROLE_KEY")
    cors_allowed_origins: str = Field("http://localhost:5173", alias="CORS_ALLOWED_ORIGINS")
    environment: str = Field("development", alias="ENVIRONMENT")

    model_config = SettingsConfigDict(env_file=".env.local", extra="ignore")

    @property
    def origins(self) -> List[str]:
        return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]

    @property
    def rest_url(self) -> str:
        return f"{str(self.supabase_url).rstrip('/')}/rest/v1"

    @property
    def auth_user_url(self) -> str:
        return f"{str(self.supabase_url).rstrip('/')}/auth/v1/user"


@lru_cache
def get_settings() -> Settings:
    return Settings()
