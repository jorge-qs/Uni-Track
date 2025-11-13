"""
Aplicación principal de FastAPI para UniTrack
Plataforma Integral de Apoyo Académico Universitario
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routes import auth, modelo, prediccion, recursos, recomendacion
from app.db.database import init_db, engine
from app.db.csv_import import import_csv_tables

# Crear instancia de FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API REST para la plataforma UniTrack - Sistema de apoyo académico universitario",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar rutas
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Autenticación"])
app.include_router(modelo.router, prefix="/api/v1/modelo", tags=["Modelo Predictivo"])
app.include_router(prediccion.router, prefix="/api/v1/prediccion", tags=["Predicción de Notas"])
app.include_router(recomendacion.router, prefix="/api/v1/recomendacion", tags=["Recomendación de Matrícula"])
app.include_router(recursos.router, prefix="/api/v1/recursos", tags=["Recursos Académicos"])

@app.get("/", tags=["Health"])
async def root():
    """Endpoint raíz para verificar que la API está funcionando"""
    return {
        "message": "UniTrack API - Plataforma de Apoyo Académico Universitario",
        "version": settings.VERSION,
        "docs": "/docs",
        "status": "online"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Endpoint de health check"""
    return {"status": "healthy"}


@app.on_event("startup")
async def startup_load_data():
    """Al iniciar: crear tablas ORM y cargar CSVs como tablas nuevas.

    - ORM: crea tablas definidas en modelos (si no existen)
    - CSVs: crea/actualiza tablas "curso", "alumno", "matricula" y carga datos
    """
    try:
        init_db()
    except Exception:
        # Continuar aunque falle la creación ORM para intentar carga CSV
        pass

    try:
        import_csv_tables(engine)
    except Exception:
        # Evitar tumbar la app si la carga CSV falla
        pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
