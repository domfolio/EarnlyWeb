from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.app.core.config import get_settings
from api.app.routers import entries, jobs, me, setup


settings = get_settings()

app = FastAPI(title="Earnly API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(me.router, prefix="/api")
app.include_router(setup.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(entries.router, prefix="/api")
