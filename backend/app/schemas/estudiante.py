"""
Schemas Pydantic para Estudiante
Validación y serialización de datos
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import date


class EstudianteBase(BaseModel):
    """Schema base de Estudiante"""
    sexo: Optional[str] = Field(None, max_length=1)
    estado_civil: Optional[str] = Field(None, max_length=20)
    fecha_nacimiento: Optional[date] = None
    per_ingreso: Optional[str] = Field(None, max_length=10)
    tipo_colegio: Optional[str] = Field(None, max_length=30)
    puntaje_ingreso: Optional[float] = None
    beca_vigente: bool = False
    departamento_pro: Optional[str] = Field(None, max_length=50)
    provincia_pro: Optional[str] = Field(None, max_length=50)
    distrito_pro: Optional[str] = Field(None, max_length=50)
    departamento_res: Optional[str] = Field(None, max_length=50)
    provincia_res: Optional[str] = Field(None, max_length=50)
    distrito_res: Optional[str] = Field(None, max_length=50)


class EstudianteCreate(EstudianteBase):
    """Schema para crear un Estudiante"""
    cod_persona: str = Field(..., max_length=10)


class EstudianteUpdate(EstudianteBase):
    """Schema para actualizar un Estudiante"""
    pass


class EstudianteResponse(EstudianteBase):
    """Schema para respuesta de Estudiante"""
    cod_persona: str

    class Config:
        from_attributes = True
