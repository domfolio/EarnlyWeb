from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class EntryUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    start_time: str | None = Field(default=None, alias="startTime")
    end_time: str | None = Field(default=None, alias="endTime")
    break_minutes: int | None = Field(default=None, ge=0, alias="breakMinutes")
    hourly_rate: Any = Field(default=None, alias="hourlyRate")
    notes: str | None = None

    @field_validator("start_time", "end_time")
    @classmethod
    def normalize_time(cls, value: str | None) -> str | None:
        if value in (None, ""):
            return None
        return value[:5]
