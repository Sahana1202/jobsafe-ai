"""Configuration defaults. Secrets and provider integrations are added in later phases."""

from os import getenv

APP_NAME = "JOBSAFE AI"
API_PREFIX = "/api"
DATABASE_URL = getenv("DATABASE_URL", "sqlite:///./jobsafe.db")
UPLOAD_LIMIT_BYTES = 10 * 1024 * 1024
