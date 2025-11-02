"""
Módulo de schemas Pydantic
Exporta todos los schemas para validación de datos
"""

from app.schemas.estudiante import EstudianteCreate, EstudianteUpdate, EstudianteResponse
from app.schemas.curso import CursoCreate, CursoUpdate, CursoResponse
from app.schemas.matricula import MatriculaCreate, MatriculaUpdate, MatriculaResponse, MatriculaSimulador
from app.schemas.auth import LoginRequest, LoginResponse

__all__ = [
    "EstudianteCreate", "EstudianteUpdate", "EstudianteResponse",
    "CursoCreate", "CursoUpdate", "CursoResponse",
    "MatriculaCreate", "MatriculaUpdate", "MatriculaResponse", "MatriculaSimulador",
    "LoginRequest", "LoginResponse"
]
