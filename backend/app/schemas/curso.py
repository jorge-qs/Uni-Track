"""
Schemas Pydantic para Curso
Validación y serialización de datos
"""

from pydantic import BaseModel, Field
from typing import Optional


class CursoBase(BaseModel):
    """Schema base de Curso"""
    curso: str = Field(..., max_length=100)
    creditos: int
    tipo_curso: Optional[str] = Field(None, max_length=20)
    hrs_curso: Optional[int] = None
    familia: Optional[str] = Field(None, max_length=50)
    cluster: Optional[str] = Field(None, max_length=50)
    nivel_curso: Optional[int] = None


class CursoCreate(CursoBase):
    """Schema para crear un Curso"""
    cod_curso: str = Field(..., max_length=10)


class CursoUpdate(CursoBase):
    """Schema para actualizar un Curso"""
    curso: Optional[str] = Field(None, max_length=100)
    creditos: Optional[int] = None


class CursoResponse(CursoBase):
    """Schema para respuesta de Curso"""
    cod_curso: str

    class Config:
        from_attributes = True
