"""
Schemas Pydantic para Matricula
Validación y serialización de datos
"""

from pydantic import BaseModel, Field
from typing import Optional


class MatriculaBase(BaseModel):
    """Schema base de Matrícula"""
    per_matricula: str = Field(..., max_length=10)
    cod_persona: str = Field(..., max_length=10)
    cod_curso: str = Field(..., max_length=10)
    nota: Optional[float] = None
    hrs_inasistencia: int = 0
    estado: Optional[str] = Field(None, max_length=20)
    tipo_de_ciclo: Optional[str] = Field(None, max_length=20)


class MatriculaCreate(MatriculaBase):
    """Schema para crear una Matrícula"""
    pass


class MatriculaUpdate(BaseModel):
    """Schema para actualizar una Matrícula"""
    nota: Optional[float] = None
    hrs_inasistencia: Optional[int] = None
    estado: Optional[str] = Field(None, max_length=20)
    tipo_de_ciclo: Optional[str] = Field(None, max_length=20)


class MatriculaResponse(MatriculaBase):
    """Schema para respuesta de Matrícula"""

    class Config:
        from_attributes = True


class MatriculaSimulador(BaseModel):
    """Schema para el simulador 'what-if' de matrícula"""
    cod_persona: str = Field(..., max_length=10)
    cursos_simulados: list[str] = Field(..., description="Lista de códigos de cursos a simular")
    periodo: str = Field(..., max_length=10, description="Periodo a simular (ej: 2024-2)")
