"""Application settings loaded from environment variables.

All configuration is centralized here. Modules must import `settings`
instead of reading environment variables directly.
"""

from functools import lru_cache

from pydantic import PostgresDsn, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    APP_NAME: str = "ComplaintMe AI"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # CORS — comma-separated list of allowed origins. Both localhost:3000 and
    # :3001 are allowed by default because Next.js falls back to :3001 when
    # :3000 is already in use. Override via the CORS_ORIGINS env var.
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    # Supabase (verification implemented in AUTH-002)
    SUPABASE_URL: str = ""
    SUPABASE_JWT_SECRET: str = ""

    # Database
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "complaintme"
    POSTGRES_PASSWORD: str = "complaintme"
    POSTGRES_DB: str = "complaintme"

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_JSON: bool = False

    # Cortexa understanding engine — selects the AI provider (see app.ai.factory).
    # Swappable without code changes; "heuristic" is the dependency-free V1 engine.
    CORTEXA_PROVIDER: str = "heuristic"

    # Consumer Copilot drafting engine (see app.copilot.factory). Separate from
    # Cortexa: Copilot prepares complaints, Cortexa analyzes them.
    COPILOT_PROVIDER: str = "heuristic"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def database_url(self) -> str:
        return str(
            PostgresDsn.build(
                scheme="postgresql+asyncpg",
                username=self.POSTGRES_USER,
                password=self.POSTGRES_PASSWORD,
                host=self.POSTGRES_HOST,
                port=self.POSTGRES_PORT,
                path=self.POSTGRES_DB,
            )
        )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
