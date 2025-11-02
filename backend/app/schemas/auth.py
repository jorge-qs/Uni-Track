"""
Schemas Pydantic para Autenticación
Validación de login simplificado
"""

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """Schema para solicitud de login"""
    cod_persona: str = Field(..., max_length=10, description="Código del estudiante")


class LoginResponse(BaseModel):
    """Schema para respuesta de login"""
    success: bool
    message: str
    cod_persona: str | None = None
    estudiante: dict | None = None
