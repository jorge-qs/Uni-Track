"""
Endpoints para el sistema de recomendación de matrícula
"""

from fastapi import APIRouter, Depends, HTTPException, status
from backend.app.models.curso import Curso
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict
import sys
from itertools import combinations, count
from pathlib import Path
import heapq
import time

from app.db.database import get_db
from app.models.alumno import Alumno
from app.models.seccion import Seccion

from app.utils.utils import str_to_dict, str_to_list, str_to_list_simple

try:
    from app.ml_models.recomendador_matricula import ranking_cursos, calcular_score_bundle
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
    mejor_recomendacion: Optional[dict] = None
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
    # MANEJO DE ERRORES

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

    # INICIO DEL CODIGO

    # crear horarios posibles dado los cursos disponibles
    secciones = db.query(Seccion).filter(
        Seccion.cod_curso.in_(request.bundles)
    ).all()


    cursos = db.query(Curso).all()
    cred_cursos = {c.cod_curso: c.creditos for c in cursos}

    cod_persona_int = int(request.cod_persona)
    cursos_disp: List[str] = ranking_cursos(cod_persona=cod_persona_int, per_matricula=request.per_matricula, cursos=request.bundles)
    cursos_hor: Dict[str, Dict[str, List[tuple[str, str, str]]]] = {i: {} for i in cursos_disp}    
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

    dict_default: Dict[str, List[tuple[str, str]]] = {
        "Lun": [],
        "Mar": [],
        "Mie": [],
        "Jue": [],
        "Vie": [],
        "Sab": [],
        "Dom": [],
    }

    class Horario:
        """
        Encapsula un horario:
        - bloques: dict[dia] -> list[(inicio, fin)]
        - cursos_secciones: lista de (cod_curso, seccion_key) para saber qué sección exacta se tomó.
        """

        def __init__(
            self,
            base: Optional[Dict[str, List[tuple[str, str]]]] = None,
            cursos_secciones: Optional[List[tuple[str, str]]] = None,
        ):
            if base is None:
                base = dict_default

            # copia profunda "simple" del diccionario de bloques
            self.bloques: Dict[str, List[tuple[str, str]]] = {
                dia: bloques[:] for dia, bloques in base.items()
            }
            # lista de (curso, seccion)
            self.cursos_secciones: List[tuple[str, str]] = (
                list(cursos_secciones) if cursos_secciones else []
            )

        def copy(self) -> "Horario":
            """Devuelve una copia independiente del horario."""
            return Horario(self.bloques, self.cursos_secciones)

        def is_conflict(self, dia: str, inicio_new: str, fin_new: str) -> bool:
            """
            Verifica si el bloque [inicio_new, fin_new] en 'dia' choca
            con algún bloque ya almacenado.
            """
            for inicio_exist, fin_exist in self.bloques.get(dia, []):
                # solapamiento si no se cumple que uno termina antes de que empiece el otro
                if not (fin_new <= inicio_exist or inicio_new >= fin_exist):
                    return True
            return False

        def add_seccion(
            self,
            cod_curso: str,
            seccion_key: str,
            sec_hors: List[tuple[str, str, str]],
        ) -> None:
            """
            Añade TODAS las sesiones de una sección al horario y
            registra (curso, seccion) en cursos_secciones.
            sec_hors: lista de (dia, hora_inicio, hora_fin)
            """
            for dia, hora_inicio, hora_fin in sec_hors:
                self.bloques[dia].append((hora_inicio, hora_fin))
            self.cursos_secciones.append((cod_curso, seccion_key))

        def as_dict(self) -> Dict[str, List[tuple[str, str]]]:
            """
            Devuelve solo la estructura de bloques como dict, útil
            para funciones que todavía esperan un dict (como comparar_horarios).
            """
            return self.bloques

    def serialize_horario_publico(
        bloques: Dict[str, List[tuple[str, str]]]
    ) -> Dict[str, List[Dict[str, str]]]:
        dias = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]
        serializado: Dict[str, List[Dict[str, str]]] = {}
        for dia in dias:
            lista = bloques.get(dia, [])
            bloques_ordenados = sorted(lista, key=lambda bloque: bloque[0])
            serializado[dia] = [
                {"inicio": inicio, "fin": fin}
                for inicio, fin in bloques_ordenados
            ]
        return serializado

    def _a_minutos(valor: str) -> int:
        horas, minutos = valor.split(":")
        return int(horas) * 60 + int(minutos)

    def calcular_total_horas(
        horario_serializado: Dict[str, List[Dict[str, str]]]
    ) -> float:
        total_minutos = 0
        for bloques in horario_serializado.values():
            for bloque in bloques:
                inicio = bloque["inicio"]
                fin = bloque["fin"]
                total_minutos += max(_a_minutos(fin) - _a_minutos(inicio), 0)
        return round(total_minutos / 60.0, 2)

    def construir_resumen_horario(registro: dict, rank: int) -> dict:
        horario_obj: Horario = registro["horario"]
        horario_serializado = serialize_horario_publico(horario_obj.bloques)

        total_bloques = sum(len(bloques) for bloques in horario_serializado.values())
        dias_con_clases = [
            dia for dia, bloques in horario_serializado.items() if bloques
        ]
        total_horas = calcular_total_horas(horario_serializado)

        return {
            "id": registro["id"],
            "rank": rank,
            "cursos": registro["cursos"],  # solo códigos de curso
            "cursos_secciones": horario_obj.cursos_secciones,  # [(curso, seccion)]
            "horario": horario_serializado,
            "total_cursos": len(registro["cursos"]),
            "total_bloques": total_bloques,
            "total_horas": total_horas,
            "dias_con_clases": dias_con_clases,
        }

    time_limit = request.max_time if request.max_time else 30  # segundos
    print(f"Iniciando búsqueda de horarios con límite de tiempo {time_limit} segundos...")

    #---------- horarios ------------------
    # TOP 3 de mejores horarios para la persona
    mejores_horarios = []   # cada elemento: {"id": int, "cursos": [...], "horario": Horario}
    id_now = 0              
    count = 0               # contador de horarios evaluados
    start_time = time.time()
    

    def get_horario_id() -> int:
        nonlocal id_now
        id_now += 1
        return id_now
    
    def conteo() -> int:
        nonlocal count
        count += 1


    def append_horario(cursos_tomados: list, horario_ite: Horario):
        """
        Calcula el score del bundle actual, lo agrega a la lista y mantiene
        solo el TOP K (default 3) ordenado por score descendente.
        """
        conteo()
        nonlocal mejores_horarios
        # Si 'cod_persona' y 'per_matricula' no están en los argumentos, 
        # asumimos que están disponibles en el scope padre (closure).
        # Si no, agrégalos a la definición de la función.
        
        TOP_K = 3

        # 1. Calcular el score usando la función refactorizada
        #    (Asume que cursos_tomados es una lista de códigos ['CS101', ...])
        current_score = calcular_score_bundle(cod_persona_int, request.per_matricula, cursos_tomados)

        # 2. Optimización rápida: 
        #    Si ya tenemos K elementos y el score actual es peor que el último (el peor de los mejores),
        #    no tiene sentido agregarlo ni ordenar.
        if len(mejores_horarios) >= TOP_K and current_score <= mejores_horarios[-1]['score']:
            return

        # 3. Crear el objeto nuevo incluyendo el score calculado
        nuevo = {
            "id": get_horario_id(),
            "cursos": cursos_tomados[:],      # Copia de lista
            "horario": horario_ite.copy(),    # Copia de objeto Horario
            "score": current_score            # Guardamos el score
        }

        # 4. Agregar a la lista
        mejores_horarios.append(nuevo)

        # 5. Ordenar y Recortar
        #    Ordenamos por 'score' de mayor a menor (reverse=True).
        #    Como la lista es pequeña (tamaño ~4), esto es extremadamente rápido.
        mejores_horarios.sort(key=lambda x: x['score'], reverse=True)
        
        #    Mantenemos solo los K mejores
        if len(mejores_horarios) > TOP_K:
            mejores_horarios = mejores_horarios[:TOP_K]

    def cant_cred(cursos: list) -> int:
        """Calcula la cantidad de créditos de una lista de códigos de curso."""
        total = 0
        for curso in cursos:
            total += cred_cursos.get(curso, 0)
        return total


    MIN_CREDITOS = 14
    MAX_CREDITOS = 26

    def backtrack(ite: int, horario_ite: Horario, cursos_tomados: list):
        # cortar si nos pasamos del tiempo
        if time.time() - start_time > time_limit:
            return

        # poda: máximo 7 cursos
        if cant_cred(cursos_tomados) >= MAX_CREDITOS:
            return

        # caso base: ya vimos todos los cursos del ranking
        if ite >= len(cursos_disp):
            # solo considerar combos con más de 3 cursos
            if cant_cred(cursos_tomados) >= MIN_CREDITOS:
                append_horario(cursos_tomados, horario_ite)
            return

        curso = cursos_disp[ite]

        # Opción 1: Tomar una de sus secciones
        for sec_key, sec_hors in cursos_hor[curso].items():
            # Primero verificamos que TODAS las sesiones de esa sección no choquen
            conflicto = False
            for dia, hora_inicio, hora_fin in sec_hors:
                if horario_ite.is_conflict(dia, hora_inicio, hora_fin):
                    conflicto = True
                    break

            if conflicto:
                continue  # esta sección no se puede

            # Si no hay conflicto, copiamos el horario y añadimos TODAS las sesiones de la sección
            nuevo_horario = horario_ite.copy()
            nuevo_horario.add_seccion(curso, sec_key, sec_hors)

            cursos_tomados.append(curso)
            backtrack(ite + 1, nuevo_horario, cursos_tomados)
            cursos_tomados.pop()

        # Opción 2: No tomar este curso
        backtrack(ite + 1, horario_ite, cursos_tomados)

    # iniciar con un horario vacío
    backtrack(0, Horario(dict_default), [])

    elapsed_time = time.time() - start_time

    if not mejores_horarios:
        mensaje = (
            f"Se evaluaron {count} combinaciones en {round(elapsed_time, 2)} segundos "
            "pero no se encontraron horarios compatibles con los cursos proporcionados."
        )
        print(mensaje)
        return RecomendacionResponse(
            success=False,
            meta={
                "cod_persona": request.cod_persona,
                "per_matricula": request.per_matricula,
                "total_evaluados": count,
                "horarios_encontrados": 0,
                "tiempo_procesamiento": round(elapsed_time, 2)
            },
            mejor_recomendacion=None,
            todos_los_resultados=[],
            mensaje=mensaje
        )

    top_horarios = [
        construir_resumen_horario(horario, idx + 1)
        for idx, horario in enumerate(mejores_horarios)
    ]

    print(f"Se evaluaron {count} horarios validos dentro del limite de tiempo.")
    print("Top horarios encontrados (del mejor al peor dentro del top):")
    for horario in top_horarios:
        print(f"- #{horario['rank']} con cursos: {horario['cursos']}")

    resumen_lineas = [
        f"#{horario['rank']} ({', '.join(horario['cursos']) or 'Sin cursos'})"
        for horario in top_horarios
    ]
    mensaje = (
        f"Se evaluaron {count} combinaciones en {round(elapsed_time, 2)} segundos.\n"
        f"Top {len(top_horarios)} horarios: \n" + "\n".join(resumen_lineas)
    )

    return RecomendacionResponse(
        success=True,
        meta={
            "cod_persona": request.cod_persona,
            "per_matricula": request.per_matricula,
            "total_evaluados": count,
            "horarios_encontrados": len(top_horarios),
            "tiempo_procesamiento": round(elapsed_time, 2)
        },
        mejor_recomendacion=top_horarios[0],
        todos_los_resultados=top_horarios,
        mensaje=mensaje
    )


@router.get("/debug")
async def healthcheck():
    from app.tests.recomendador import run_tests_recomendador
    return run_tests_recomendador()