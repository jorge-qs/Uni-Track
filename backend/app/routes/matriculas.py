"""
Endpoints para gestión de Matrículas
Registro histórico y simulador de matrícula
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.matricula import Matricula
from app.models.estudiante import Estudiante
from app.models.curso import Curso
from app.schemas.matricula import (
    MatriculaCreate,
    MatriculaResponse,
    MatriculaUpdate,
    MatriculaSimulador
)

router = APIRouter()


@router.post("/", response_model=MatriculaResponse, status_code=status.HTTP_201_CREATED)
async def create_matricula(
    matricula_create: MatriculaCreate,
    db: Session = Depends(get_db)
):
    """
    Registrar una nueva matrícula

    Args:
        matricula_create: Datos de la matrícula
        db: Sesión de base de datos

    Returns:
        Matrícula creada

    Raises:
        HTTPException 400: Si la matrícula ya existe
        HTTPException 404: Si el estudiante o curso no existe
    """
    # Verificar que el estudiante existe
    estudiante = db.query(Estudiante).filter(
        Estudiante.cod_persona == matricula_create.cod_persona
    ).first()
    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estudiante {matricula_create.cod_persona} no encontrado"
        )

    # Verificar que el curso existe
    curso = db.query(Curso).filter(
        Curso.cod_curso == matricula_create.cod_curso
    ).first()
    if not curso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Curso {matricula_create.cod_curso} no encontrado"
        )

    # Verificar si la matrícula ya existe
    existing = db.query(Matricula).filter(
        Matricula.per_matricula == matricula_create.per_matricula,
        Matricula.cod_persona == matricula_create.cod_persona,
        Matricula.cod_curso == matricula_create.cod_curso
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta matrícula ya existe"
        )

    # Crear nueva matrícula
    matricula = Matricula(**matricula_create.model_dump())
    db.add(matricula)
    db.commit()
    db.refresh(matricula)

    return matricula


@router.get("/{cod_persona}", response_model=List[MatriculaResponse])
async def get_historial_matriculas(
    cod_persona: str,
    db: Session = Depends(get_db)
):
    """
    Obtener historial completo de matrículas de un estudiante

    Args:
        cod_persona: Código del estudiante
        db: Sesión de base de datos

    Returns:
        Lista de todas las matrículas del estudiante

    Raises:
        HTTPException 404: Si el estudiante no existe
    """
    # Verificar que el estudiante existe
    estudiante = db.query(Estudiante).filter(
        Estudiante.cod_persona == cod_persona
    ).first()
    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estudiante {cod_persona} no encontrado"
        )

    # Obtener todas las matrículas
    matriculas = db.query(Matricula).filter(
        Matricula.cod_persona == cod_persona
    ).order_by(Matricula.per_matricula.desc()).all()

    return matriculas


@router.post("/simulador", response_model=dict)
async def simular_matricula(
    simulacion: MatriculaSimulador,
    db: Session = Depends(get_db)
):
    """
    Simular una matrícula (análisis "what-if")

    Este endpoint permite simular qué pasaría si un estudiante
    se matricula en un conjunto específico de cursos.

    Args:
        simulacion: Datos de la simulación
        db: Sesión de base de datos

    Returns:
        Análisis de la simulación con información de cursos y recomendaciones

    Raises:
        HTTPException 404: Si el estudiante no existe
    """
    # Verificar que el estudiante existe
    estudiante = db.query(Estudiante).filter(
        Estudiante.cod_persona == simulacion.cod_persona
    ).first()
    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estudiante {simulacion.cod_persona} no encontrado"
        )

    # Obtener información de los cursos simulados
    cursos = []
    total_creditos = 0
    total_horas = 0
    cursos_no_encontrados = []

    for cod_curso in simulacion.cursos_simulados:
        curso = db.query(Curso).filter(Curso.cod_curso == cod_curso).first()
        if curso:
            cursos.append({
                "cod_curso": curso.cod_curso,
                "nombre": curso.curso,
                "creditos": curso.creditos,
                "hrs_curso": curso.hrs_curso,
                "tipo_curso": curso.tipo_curso,
                "nivel_curso": curso.nivel_curso
            })
            total_creditos += curso.creditos or 0
            total_horas += curso.hrs_curso or 0
        else:
            cursos_no_encontrados.append(cod_curso)

    # Obtener historial del estudiante para análisis
    historial = db.query(Matricula).filter(
        Matricula.cod_persona == simulacion.cod_persona
    ).all()

    cursos_aprobados = [m.cod_curso for m in historial if m.estado == "Aprobado"]
    promedio_actual = sum([m.nota for m in historial if m.nota]) / len(historial) if historial else 0

    return {
        "estudiante": {
            "cod_persona": estudiante.cod_persona,
            "per_ingreso": estudiante.per_ingreso,
            "promedio_actual": round(promedio_actual, 2)
        },
        "simulacion": {
            "periodo": simulacion.periodo,
            "cursos": cursos,
            "total_cursos": len(cursos),
            "total_creditos": total_creditos,
            "total_horas": total_horas
        },
        "analisis": {
            "carga_academica": "Alta" if total_creditos > 18 else "Media" if total_creditos > 12 else "Baja",
            "cursos_no_encontrados": cursos_no_encontrados,
            "advertencias": [
                f"Carga de {total_creditos} créditos puede ser alta" if total_creditos > 20 else None,
                f"Total de {total_horas} horas semanales" if total_horas > 0 else None
            ]
        },
        "recomendacion": {
            "mensaje": "Simulación exitosa. Los cursos están dentro de los límites recomendados." if total_creditos <= 20 else "Advertencia: La carga académica es muy alta.",
            "puede_matricularse": total_creditos <= 24
        }
    }


@router.put("/{per_matricula}/{cod_persona}/{cod_curso}", response_model=MatriculaResponse)
async def update_matricula(
    per_matricula: str,
    cod_persona: str,
    cod_curso: str,
    matricula_update: MatriculaUpdate,
    db: Session = Depends(get_db)
):
    """
    Actualizar una matrícula existente (típicamente notas y estado)

    Args:
        per_matricula: Periodo de matrícula
        cod_persona: Código del estudiante
        cod_curso: Código del curso
        matricula_update: Datos a actualizar
        db: Sesión de base de datos

    Returns:
        Matrícula actualizada

    Raises:
        HTTPException 404: Si la matrícula no existe
    """
    matricula = db.query(Matricula).filter(
        Matricula.per_matricula == per_matricula,
        Matricula.cod_persona == cod_persona,
        Matricula.cod_curso == cod_curso
    ).first()

    if not matricula:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Matrícula no encontrada"
        )

    # Actualizar solo los campos proporcionados
    update_data = matricula_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(matricula, field, value)

    db.commit()
    db.refresh(matricula)

    return matricula
