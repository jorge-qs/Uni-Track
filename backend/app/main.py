"""
Aplicación principal de FastAPI para UniTrack
Plataforma Integral de Apoyo Académico Universitario
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routes import auth, estudiantes, cursos, matriculas

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
app.include_router(estudiantes.router, prefix="/api/v1/estudiantes", tags=["Estudiantes"])
app.include_router(cursos.router, prefix="/api/v1/cursos", tags=["Cursos"])
app.include_router(matriculas.router, prefix="/api/v1/matricula", tags=["Matrícula"])


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
