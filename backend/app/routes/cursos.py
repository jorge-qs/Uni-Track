"""
Endpoints para gestión de Cursos
Consulta de cursos de la malla curricular
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.curso import Curso
from app.schemas.curso import CursoResponse, CursoCreate

router = APIRouter()


@router.get("/", response_model=List[CursoResponse])
async def get_cursos(
    skip: int = Query(0, ge=0, description="Número de registros a saltar"),
    limit: int = Query(100, ge=1, le=500, description="Número máximo de registros a retornar"),
    familia: Optional[str] = Query(None, description="Filtrar por familia de curso"),
    tipo_curso: Optional[str] = Query(None, description="Filtrar por tipo (Obligatorio/Electivo)"),
    nivel_curso: Optional[int] = Query(None, description="Filtrar por nivel de curso"),
    db: Session = Depends(get_db)
):
    """
    Listar todos los cursos con paginación y filtros opcionales

    Args:
        skip: Número de registros a saltar (paginación)
        limit: Número máximo de registros a retornar
        familia: Filtrar por familia de curso
        tipo_curso: Filtrar por tipo (Obligatorio/Electivo)
        nivel_curso: Filtrar por nivel de curso
        db: Sesión de base de datos

    Returns:
        Lista de cursos según los filtros aplicados
    """
    query = db.query(Curso)

    # Aplicar filtros si se proporcionan
    if familia:
        query = query.filter(Curso.familia == familia)
    if tipo_curso:
        query = query.filter(Curso.tipo_curso == tipo_curso)
    if nivel_curso is not None:
        query = query.filter(Curso.nivel_curso == nivel_curso)

    cursos = query.offset(skip).limit(limit).all()
    return cursos


@router.get("/{cod_curso}", response_model=CursoResponse)
async def get_curso(
    cod_curso: str,
    db: Session = Depends(get_db)
):
    """
    Obtener detalle de un curso específico

    Args:
        cod_curso: Código del curso
        db: Sesión de base de datos

    Returns:
        Información completa del curso

    Raises:
        HTTPException 404: Si el curso no existe
    """
    curso = db.query(Curso).filter(Curso.cod_curso == cod_curso).first()

    if not curso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Curso con código {cod_curso} no encontrado"
        )

    return curso


@router.post("/", response_model=CursoResponse, status_code=status.HTTP_201_CREATED)
async def create_curso(
    curso_create: CursoCreate,
    db: Session = Depends(get_db)
):
    """
    Crear un nuevo curso en la malla curricular

    Args:
        curso_create: Datos del nuevo curso
        db: Sesión de base de datos

    Returns:
        Curso creado

    Raises:
        HTTPException 400: Si el código de curso ya existe
    """
    # Verificar si ya existe
    existing = db.query(Curso).filter(
        Curso.cod_curso == curso_create.cod_curso
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Curso con código {curso_create.cod_curso} ya existe"
        )

    # Crear nuevo curso
    curso = Curso(**curso_create.model_dump())
    db.add(curso)
    db.commit()
    db.refresh(curso)

    return curso
