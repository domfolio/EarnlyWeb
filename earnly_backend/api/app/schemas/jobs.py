from pydantic import BaseModel, ConfigDict, Field


class JobCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    workplace_name: str = Field(..., min_length=1, max_length=120, alias="workplaceName")
    default_hourly_rate: float = Field(..., ge=0, alias="defaultHourlyRate")


class JobUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    workplace_name: str | None = Field(default=None, min_length=1, max_length=120, alias="workplaceName")
    default_hourly_rate: float | None = Field(default=None, ge=0, alias="defaultHourlyRate")
