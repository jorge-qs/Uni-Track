"""
Schemas Pydantic para Autenticación
Validación de login simplificado
"""

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """Schema para solicitud de login"""
    cod_persona: str = Field(..., max_length=10, description="Código del estudiante")
    password: str = Field(..., description="Contraseña del estudiante")


class LoginResponse(BaseModel):
    """Schema para respuesta de login"""
    success: bool
    message: str
    cod_persona: str | None = None
    # Campos adicionales solicitados
    alumno_info: dict | None = None
    cursos_info: list[dict] | None = None
    matricula_info: dict | None = None
    academic_info: dict | None = None
    cursos_disponibles: list[str] | None = None
    secciones_info: dict | None = None
    resources_info: dict | None = None
