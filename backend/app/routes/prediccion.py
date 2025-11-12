"""
Endpoints para predicción de notas usando ML
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import sys
from pathlib import Path

from app.db.database import get_db
from app.models.alumno import Alumno
from app.models.curso import Curso
from app.models.matricula import Matricula

from app.services.predictor_nota import get_predictor

router = APIRouter()


class PrediccionRequest(BaseModel):
    cod_persona: str
    cod_curso: str


class PrediccionResponse(BaseModel):
    success: bool
    cod_persona: str
    cod_curso: str
    nota_estimada: float
    mensaje: Optional[str] = None


@router.post("/predecir", response_model=PrediccionResponse)
async def predecir_nota(
    request: PrediccionRequest,
    db: Session = Depends(get_db)
):
    """
    Predecir la nota de un estudiante en un curso específico

    Args:
        request: Código del estudiante y código del curso
        db: Sesión de base de datos

    Returns:
        Nota estimada para el curso
    """

    # Verificar que el alumno existe
    alumno = db.query(Alumno).filter(
        Alumno.cod_persona == request.cod_persona
    ).first()

    if not alumno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró alumno con código {request.cod_persona}"
        )

    # Verificar que el curso existe
    curso = db.query(Curso).filter(
        Curso.cod_curso == request.cod_curso
    ).first()

    if not curso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró curso con código {request.cod_curso}"
        )

    # Obtener historial académico del alumno
    matriculas = db.query(Matricula).filter(
        Matricula.cod_persona == request.cod_persona
    ).all()

    # Calcular estadísticas del historial
    notas_aprobadas = [m.nota for m in matriculas if m.nota and m.nota >= 11]
    total_matriculas = len(matriculas)
    creditos_aprobados = sum([
        db.query(Curso).filter(Curso.cod_curso == m.cod_curso).first().creditos or 0
        for m in matriculas if m.nota and m.nota >= 11
    ])

    # Calcular total de créditos posibles (aproximado)
    total_creditos_cursados = sum([
        db.query(Curso).filter(Curso.cod_curso == m.cod_curso).first().creditos or 0
        for m in matriculas
    ])

    promedio_acumulado = sum(notas_aprobadas) / len(notas_aprobadas) if notas_aprobadas else 12.0

    historial_academico = {
        'promedio_acumulado': promedio_acumulado,
        'pct_creditos_aprobados': creditos_aprobados / total_creditos_cursados if total_creditos_cursados > 0 else 0.5,
        'pct_cursos_aprobados': len(notas_aprobadas) / total_matriculas if total_matriculas > 0 else 0.5,
        'semestres_cursados': len(set([m.per_matricula for m in matriculas]))
    }

    # Datos del alumno
    alumno_data = {
        'sexo': alumno.sexo,
        'tipo_colegio': alumno.tipo_colegio,
        'ptje_ingreso': alumno.ptje_ingreso,
        'beca_vigente': alumno.beca_vigente
    }

    # Datos del curso
    curso_data = {
        'creditos': curso.creditos,
        'tipo': curso.tipo,
        'horas': curso.horas,
        'familia': curso.familia,
        'nivel_curso': curso.nivel_curso
    }

    PREDICTOR_AVAILABLE = True

    # Realizar predicción con modelo ML
    if PREDICTOR_AVAILABLE:
        try:
            predictor = get_predictor()
            nota_estimada = predictor.predecir_nota(
                request.cod_persona,
                request.cod_curso,
                alumno_data,
                curso_data,
                historial_academico
            )
            mensaje = "Predicción realizada con modelo ML"
        except Exception as e:
            print(f"Error en predicción ML: {e}")
            # Fallback: usar promedio del alumno
            nota_estimada = promedio_acumulado
            mensaje = f"Predicción basada en promedio histórico (error: {str(e)[:50]})"
    else:
        # Fallback: usar promedio del alumno
        nota_estimada = promedio_acumulado
        mensaje = "Predicción basada en promedio histórico (modelo ML no disponible)"

    return PrediccionResponse(
        success=True,
        cod_persona=request.cod_persona,
        cod_curso=request.cod_curso,
        nota_estimada=round(nota_estimada, 1),
        mensaje=mensaje
    )


@router.post("/predecir-multiple")
async def predecir_notas_multiples(
    cod_persona: str,
    codigos_cursos: list[str],
    db: Session = Depends(get_db)
):
    """
    Predecir notas para múltiples cursos de un estudiante

    Args:
        cod_persona: Código del estudiante
        codigos_cursos: Lista de códigos de cursos
        db: Sesión de base de datos

    Returns:
        Lista de predicciones para cada curso
    """
    predicciones = []

    for cod_curso in codigos_cursos:
        try:
            prediccion = await predecir_nota(
                PrediccionRequest(cod_persona=cod_persona, cod_curso=cod_curso),
                db
            )
            predicciones.append({
                'cod_curso': cod_curso,
                'nota_estimada': prediccion.nota_estimada,
                'success': True
            })
        except Exception as e:
            predicciones.append({
                'cod_curso': cod_curso,
                'nota_estimada': None,
                'success': False,
                'error': str(e)
            })

    return {
        'success': True,
        'cod_persona': cod_persona,
        'predicciones': predicciones
    }
