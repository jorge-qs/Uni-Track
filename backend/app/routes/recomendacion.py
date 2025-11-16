"""
Endpoints para el sistema de recomendación de matrícula
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import sys
from itertools import combinations
from pathlib import Path
import heapq

from app.db.database import get_db
from app.models.alumno import Alumno
from app.models.seccion import Seccion

from app.utils.utils import str_to_dict, str_to_list, str_to_list_simple

try:
    from app.recomendador_matricula import ranking_cursos, comparar_horarios
    RECOMENDADOR_AVAILABLE = True
    print("Sistema de recomendacion cargado exitosamente")
except ImportError as e:
    print(f"Warning: No se pudo cargar el sistema de recomendacion: {e}")
    RECOMENDADOR_AVAILABLE = False

router = APIRouter()


class RecomendacionRequest(BaseModel):
    cod_persona: str
    per_matricula: str
    max_time: Optional[int] = 30  # en segundos
    bundles: List[str]  # Lista de códigos de cursos disponibles


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

    # Validar que hay cursos disponibles
    if not request.bundles or len(request.bundles) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe proporcionar al menos un curso disponible para evaluar"
        )

    # Validar que los cursos no están vacíos
    for i, curso in enumerate(request.bundles):
        if not curso or curso.strip() == "":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El curso en la posición {i} está vacío"
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

        
   # crear horarios posibles dado los cursos disponibles
    secciones = db.query(Seccion).filter(
        Seccion.cod_curso.in_(request.bundles)
    ).all()
    
    cod_persona_int = int(request.cod_persona)
    cursos_disp = ranking_cursos(cod_persona=cod_persona_int, cursos=request.bundles)
    cursos_hor = {i: {} for i in cursos_disp}

    for seccion in secciones:
        hors = seccion.horarios
        sec = seccion.seccion_key
        hors = str_to_list(hors)
        for h in hors:
            secs = str_to_dict(h)
            dia = secs["Dia"]              # debe coincidir con las claves de dict_default
            hi = secs["Hora_inicio"]
            hf = secs["Hora_fin"]
            if sec not in cursos_hor[seccion.cod_curso]:
                cursos_hor[seccion.cod_curso][sec] = []
            cursos_hor[seccion.cod_curso][sec].append((dia, hi, hf))

    dict_default = {"Lun": [], "Mar": [], "Mie": [], "Jue": [], "Vie": [], "Sab": [], "Dom": []}

    def is_conflict(horarios: dict, new_entry: tuple[str, str, str]) -> bool:
        dia, inicio_new, fin_new = new_entry
        for inicio_exist, fin_exist in horarios[dia]:
            # solapamiento si no se cumple que uno termina antes de que empiece el otro
            if not (fin_new <= inicio_exist or inicio_new >= fin_exist):
                return True
        return False

    def copiar_horario(horario: dict) -> dict:
        # copia profunda "simple": copia diccionario y cada lista
        return {dia: bloques[:] for dia, bloques in horario.items()}


    time_limit = request.max_time if request.max_time else 30  # segundos
    print(f"Iniciando búsqueda de horarios con límite de tiempo {time_limit} segundos...")
    import time

    #---------- horarios ------------------
    # TOP 3 de mejores horarios para la persona
    mejores_horarios = []   # cada elemento: {"id": int, "cursos": [...], "horario": dict}
    id_now = 0              # contador de horarios evaluados
    start_time = time.time()

    def get_horario_id() -> int:
        nonlocal id_now
        id_now += 1
        return id_now

    def es_mejor(candidato: dict, otro: dict) -> bool:
        """
        Usa comparar_horarios(cod_persona, horario1, horario2)
        y devuelve True si 'candidato' es mejor que 'otro'.
        """
        mejor_dict = comparar_horarios(
            cod_persona_int,
            candidato["horario"],
            otro["horario"]
        )
        # asumimos que comparar_horarios devuelve exactamente el dict de horario "ganador"
        # y que los horarios son comparables por igualdad
        return mejor_dict == candidato["horario"]

    def append_horario(cursos_tomados: list, horario_ite: dict):
        """
        Inserta el horario en la lista de mejores_horarios manteniendo
        solo el TOP 3 ordenado (posición 0 = mejor).
        """
        nonlocal mejores_horarios

        nuevo = {
            "id": get_horario_id(),
            "cursos": cursos_tomados[:],          # copiar lista
            "horario": copiar_horario(horario_ite)
        }

        # Caso 1: lista vacía
        if not mejores_horarios:
            mejores_horarios.append(nuevo)
            return

        # Caso general: insertar en posición correcta usando el comparador
        insertado = False
        for i in range(len(mejores_horarios)):
            # si nuevo es mejor que el i-ésimo, va antes
            if es_mejor(nuevo, mejores_horarios[i]):
                mejores_horarios.insert(i, nuevo)
                insertado = True
                break

        # Si no fue mejor que ninguno y todavía hay espacio (<3), va al final
        if not insertado and len(mejores_horarios) < 3:
            mejores_horarios.append(nuevo)

        # Recortar a top 3 en caso de que ahora haya 4
        if len(mejores_horarios) > 3:
            mejores_horarios = mejores_horarios[:3]

    def backtrack(ite: int, horario_ite: dict, cursos_tomados: list):
        # cortar si nos pasamos del tiempo
        if time.time() - start_time > time_limit:
            return

        # poda: máximo 7 cursos
        if len(cursos_tomados) > 7:
            return

        # caso base: ya vimos todos los cursos del ranking
        if ite >= len(cursos_disp):
            # solo considerar combos con más de 3 cursos
            if len(cursos_tomados) > 3:
                append_horario(cursos_tomados, horario_ite)
            return

        curso = cursos_disp[ite]

        # Opción 1: NO tomar este curso
        backtrack(ite + 1, horario_ite, cursos_tomados)

        # Opción 2: Tomar una de sus secciones
        for sec_key, sec_hors in cursos_hor[curso].items():
            # Primero verificamos que TODAS las sesiones de esa sección no choquen
            conflicto = False
            for dia, hora_inicio, hora_fin in sec_hors:
                if is_conflict(horario_ite, (dia, hora_inicio, hora_fin)):
                    conflicto = True
                    break

            if conflicto:
                continue  # esta sección no se puede

            # Si no hay conflicto, copiamos el horario y añadimos TODAS las sesiones de la sección
            nuevo_horario = copiar_horario(horario_ite)
            for dia, hora_inicio, hora_fin in sec_hors:
                nuevo_horario[dia].append((hora_inicio, hora_fin))

            # solo guardamos el curso (no la sección)
            cursos_tomados.append(curso)
            backtrack(ite + 1, nuevo_horario, cursos_tomados)
            cursos_tomados.pop()

    # iniciar con un horario vacío
    backtrack(0, copiar_horario(dict_default), [])

    print(f"Se evaluaron {id_now} horarios válidos dentro del límite de tiempo.")
    print("Top 3 mejores horarios encontrados (del mejor al peor dentro del top):")
    for h in mejores_horarios:
        print(f"- ID {h['id']} con cursos: {h['cursos']}")



    mensaje = (
            f"Se evaluaron {id_now} opciones. "
            "Top 3 mejores horarios encontrados (del mejor al peor dentro del top):"
            f"- ID {mejores_horarios[0]['id']} con cursos: {mejores_horarios[0]['cursos']}"
            f"- ID {mejores_horarios[1]['id']} con cursos: {mejores_horarios[1]['cursos']}"
            f"- ID {mejores_horarios[2]['id']} con cursos: {mejores_horarios[2]['cursos']}"
        )

    return RecomendacionResponse(
        success=True,
        meta={},
        mejor_recomendacion={
            "index": mejores_horarios[0]['id'],
            "score": None,
            "cursos": mejores_horarios[0]['cursos'],
            "detalle": mejores_horarios[0]['horario']
        },
        todos_los_resultados=mejores_horarios,
        mensaje=mensaje
    )