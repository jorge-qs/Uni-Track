"""
Configuración de la base de datos y sesión SQLAlchemy
Maneja la conexión con PostgreSQL
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.core.config import settings

# Crear engine de SQLAlchemy
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Verifica la conexión antes de usarla
    #echo=settings.DEBUG,  # Mostrar SQL queries en modo debug
)

# Crear SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class para los modelos ORM
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency que proporciona una sesión de base de datos
    Se usa en los endpoints de FastAPI

    Ejemplo de uso:
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Inicializar la base de datos
    Crea todas las tablas definidas en los modelos
    """
    Base.metadata.create_all(bind=engine)
