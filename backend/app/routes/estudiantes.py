"""
Endpoints para gestión de Estudiantes
CRUD de información del estudiante
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.estudiante import Estudiante
from app.schemas.estudiante import EstudianteResponse, EstudianteUpdate, EstudianteCreate

router = APIRouter()


@router.get("/{cod_persona}", response_model=EstudianteResponse)
async def get_estudiante(
    cod_persona: str,
    db: Session = Depends(get_db)
):
    """
    Obtener perfil de un estudiante por su código

    Args:
        cod_persona: Código del estudiante
        db: Sesión de base de datos

    Returns:
        Información completa del estudiante

    Raises:
        HTTPException 404: Si el estudiante no existe
    """
    estudiante = db.query(Estudiante).filter(
        Estudiante.cod_persona == cod_persona
    ).first()

    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estudiante con código {cod_persona} no encontrado"
        )

    return estudiante


@router.put("/{cod_persona}", response_model=EstudianteResponse)
async def update_estudiante(
    cod_persona: str,
    estudiante_update: EstudianteUpdate,
    db: Session = Depends(get_db)
):
    """
    Actualizar datos de un estudiante

    Args:
        cod_persona: Código del estudiante
        estudiante_update: Datos a actualizar
        db: Sesión de base de datos

    Returns:
        Estudiante actualizado

    Raises:
        HTTPException 404: Si el estudiante no existe
    """
    estudiante = db.query(Estudiante).filter(
        Estudiante.cod_persona == cod_persona
    ).first()

    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estudiante con código {cod_persona} no encontrado"
        )

    # Actualizar solo los campos proporcionados
    update_data = estudiante_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(estudiante, field, value)

    db.commit()
    db.refresh(estudiante)

    return estudiante


@router.post("/", response_model=EstudianteResponse, status_code=status.HTTP_201_CREATED)
async def create_estudiante(
    estudiante_create: EstudianteCreate,
    db: Session = Depends(get_db)
):
    """
    Crear un nuevo estudiante

    Args:
        estudiante_create: Datos del nuevo estudiante
        db: Sesión de base de datos

    Returns:
        Estudiante creado

    Raises:
        HTTPException 400: Si el código de estudiante ya existe
    """
    # Verificar si ya existe
    existing = db.query(Estudiante).filter(
        Estudiante.cod_persona == estudiante_create.cod_persona
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Estudiante con código {estudiante_create.cod_persona} ya existe"
        )

    # Crear nuevo estudiante
    estudiante = Estudiante(**estudiante_create.model_dump())
    db.add(estudiante)
    db.commit()
    db.refresh(estudiante)

    return estudiante
