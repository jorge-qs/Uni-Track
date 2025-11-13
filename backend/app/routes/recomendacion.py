"""
Endpoints para el sistema de recomendación de matrícula
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import sys
from pathlib import Path

from app.db.database import get_db
from app.models.alumno import Alumno

try:
    from app.recomendador_matricula import sistema_recomendacion
    RECOMENDADOR_AVAILABLE = True
    print("Sistema de recomendacion cargado exitosamente")
except ImportError as e:
    print(f"Warning: No se pudo cargar el sistema de recomendacion: {e}")
    RECOMENDADOR_AVAILABLE = False

router = APIRouter()


class RecomendacionRequest(BaseModel):
    cod_persona: str
    per_matricula: str
    bundles: List[List[str]]  # Lista de listas de códigos de cursos


class RecomendacionResponse(BaseModel):
    success: bool
    meta: dict
    mejor_recomendacion: dict
    todos_los_resultados: List[dict]
    mensaje: Optional[str] = None


@router.post("/mejor-horario", response_model=RecomendacionResponse)
async def recomendar_mejor_horario(
    request: RecomendacionRequest,
    db: Session = Depends(get_db)
):
    """
    Evalúa diferentes combinaciones de cursos (bundles) y recomienda la mejor opción.

    Este endpoint toma una lista de posibles horarios (bundles) y los evalúa usando
    múltiples métricas como:
    - Atraso académico
    - Eficiencia (créditos/horas)
    - Simplicidad (pocos prerequisitos)
    - Prioridad de cursos obligatorios
    - Familia del curso
    - Dificultad (cluster)
    - Dependientes (cursos que dependen de este)
    - Profundidad (importancia en el árbol de prerequisitos)
    - Predicción de nota (usando el modelo de predicción por matrícula)

    Args:
        request: Contiene cod_persona, período de matrícula, y lista de bundles a evaluar
        db: Sesión de base de datos

    Returns:
        Recomendación con el mejor bundle y análisis detallado de todas las opciones
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

    # Validar que hay bundles para evaluar
    if not request.bundles or len(request.bundles) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe proporcionar al menos un bundle para evaluar"
        )

    # Validar que los bundles no están vacíos
    for i, bundle in enumerate(request.bundles):
        if not bundle or len(bundle) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El bundle en la posición {i} está vacío"
            )

    # Verificar que el sistema de recomendación está disponible
    if not RECOMENDADOR_AVAILABLE:
        return RecomendacionResponse(
            success=False,
            meta={
                "cod_persona": request.cod_persona,
                "per_matricula": request.per_matricula,
                "total_evaluados": 0,
                "mejor_opcion_index": -1
            },
            mejor_recomendacion={
                "index": -1,
                "score": 0,
                "cursos": [],
                "detalle": None
            },
            todos_los_resultados=[],
            mensaje="Sistema de recomendación no disponible"
        )

    try:
        # Convertir cod_persona a int
        try:
            cod_persona_int = int(request.cod_persona)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El código de persona debe ser un número entero"
            )

        # Llamar al sistema de recomendación
        resultado = sistema_recomendacion(
            cod_persona=cod_persona_int,
            per_matricula=request.per_matricula,
            list_of_bundles=request.bundles
        )

        # Verificar si hubo error en la carga de base de datos
        if "error" in resultado:
            return RecomendacionResponse(
                success=False,
                meta=resultado["meta"],
                mejor_recomendacion=resultado["mejor_recomendacion"],
                todos_los_resultados=resultado["todos_los_resultados"],
                mensaje=resultado["error"]
            )

        # Preparar respuesta exitosa
        mensaje = (
            f"Se evaluaron {resultado['meta']['total_evaluados']} opciones. "
            f"Mejor opción: Bundle #{resultado['meta']['mejor_opcion_index']} "
            f"con score de {resultado['mejor_recomendacion']['score']:.2f}"
        )

        return RecomendacionResponse(
            success=True,
            meta=resultado["meta"],
            mejor_recomendacion=resultado["mejor_recomendacion"],
            todos_los_resultados=resultado["todos_los_resultados"],
            mensaje=mensaje
        )

    except Exception as e:
        print(f"Error en sistema de recomendación: {e}")
        import traceback
        traceback.print_exc()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar la recomendación: {str(e)[:200]}"
        )
