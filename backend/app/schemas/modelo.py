
from pydantic import BaseModel, Field


class NotasRequest(BaseModel):
    """Schema para solicitud de notas"""
    cod_persona: str = Field(..., max_length=10, description="Código del estudiante")


class NotasResponse(BaseModel):
    """Schema para respuesta de notas"""
    success: bool
    message: str
    cod_persona: str | None = None
    estudiante: dict | None = None
    # Campos adicionales solicitados
    notas_cursos: dict[str, float] | None = None


class MatriculaRequest(BaseModel):
    """Schema para solicitud de matrícula"""
    cod_alumno: int = Field(..., description="Código del alumno")
    cod_cursos: list[int] = Field(..., description="Lista de códigos de cursos a matricular")

class MatriculaResponse(BaseModel):
    """Schema para respuesta de matrícula"""
    success: bool
    message: str
    cod_alumno: int | None = None
    notas_estimas: dict[str, float] | None = None