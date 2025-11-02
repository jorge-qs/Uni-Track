"""
Configuración de la aplicación usando Pydantic Settings
Maneja variables de entorno y configuración general
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import validator


class Settings(BaseSettings):
    """Configuración general de la aplicación"""

    # Información del proyecto
    PROJECT_NAME: str = "UniTrack API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Base de datos
    DATABASE_URL: str = "postgresql+psycopg2://user:password@localhost:5432/unitrackdb"

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # Seguridad (para futuras implementaciones con JWT)
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Configuración del entorno
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

    @validator("ALLOWED_ORIGINS", pre=True)
    def parse_cors_origins(cls, v):
        """Parsear orígenes permitidos desde string o lista"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v


# Crear instancia global de configuración
settings = Settings()
