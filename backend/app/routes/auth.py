"""
Endpoints de autenticación
Login simplificado sin contraseña (solo código de estudiante)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.estudiante import Estudiante
from app.schemas.auth import LoginRequest, LoginResponse

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Endpoint de login simplificado

    Valida si el código del estudiante existe en la base de datos.
    No requiere contraseña (versión simplificada para MVP).

    Args:
        login_data: Datos de login con código del estudiante
        db: Sesión de base de datos

    Returns:
        LoginResponse con información del estudiante si existe

    Raises:
        HTTPException 404: Si el estudiante no existe
    """
    # Buscar estudiante por código
    estudiante = db.query(Estudiante).filter(
        Estudiante.cod_persona == login_data.cod_persona
    ).first()

    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró estudiante con código {login_data.cod_persona}"
        )

    # Retornar información del estudiante
    return LoginResponse(
        success=True,
        message="Login exitoso",
        cod_persona=estudiante.cod_persona,
        estudiante={
            "cod_persona": estudiante.cod_persona,
            "per_ingreso": estudiante.per_ingreso,
            "beca_vigente": estudiante.beca_vigente,
            "puntaje_ingreso": estudiante.puntaje_ingreso
        }
    )
