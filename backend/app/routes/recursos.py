"""
Endpoints para recursos académicos recomendados
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional
import csv
from pathlib import Path
from pydantic import BaseModel

router = APIRouter()

# Ruta al CSV de recursos
DATA_DIR = Path(__file__).parent.parent.parent / "data"
RECURSOS_CSV = DATA_DIR / "recursos_recomendados_cursos_descripcion.csv"


class RecursoRecomendado(BaseModel):
    curso: str
    recurso_1: Optional[str] = None
    recurso_2: Optional[str] = None
    recurso_3: Optional[str] = None
    recurso_4: Optional[str] = None
    descripcion: Optional[str] = None


class RecursosResponse(BaseModel):
    success: bool
    curso: str
    recursos: List[str]
    descripcion: Optional[str] = None


def cargar_recursos() -> dict:
    """Cargar recursos desde CSV y retornar como diccionario"""
    recursos_dict = {}

    try:
        with open(RECURSOS_CSV, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                curso_nombre = row['curso'].strip().upper()
                recursos_dict[curso_nombre] = {
                    'recursos': [
                        row.get('recurso_1', ''),
                        row.get('recurso_2', ''),
                        row.get('recurso_3', ''),
                        row.get('recurso_4', '')
                    ],
                    'descripcion': row.get('descripcion', '')
                }
    except Exception as e:
        print(f"Error cargando recursos: {e}")

    return recursos_dict


@router.get("/curso/{nombre_curso}", response_model=RecursosResponse)
async def get_recursos_curso(nombre_curso: str):
    """
    Obtener recursos recomendados para un curso específico

    Args:
        nombre_curso: Nombre del curso (ej: "MATEMATICA I")

    Returns:
        Recursos y descripción del curso
    """
    recursos_dict = cargar_recursos()
    curso_upper = nombre_curso.strip().upper()

    if curso_upper not in recursos_dict:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontraron recursos para el curso '{nombre_curso}'"
        )

    data = recursos_dict[curso_upper]
    # Filtrar recursos vacíos
    recursos = [r for r in data['recursos'] if r.strip()]

    return RecursosResponse(
        success=True,
        curso=nombre_curso,
        recursos=recursos,
        descripcion=data.get('descripcion', '')
    )


@router.get("/todos", response_model=List[RecursoRecomendado])
async def get_todos_recursos():
    """
    Obtener todos los recursos recomendados

    Returns:
        Lista de todos los cursos con sus recursos
    """
    recursos_list = []

    try:
        with open(RECURSOS_CSV, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                recursos_list.append(RecursoRecomendado(
                    curso=row['curso'],
                    recurso_1=row.get('recurso_1'),
                    recurso_2=row.get('recurso_2'),
                    recurso_3=row.get('recurso_3'),
                    recurso_4=row.get('recurso_4'),
                    descripcion=row.get('descripcion')
                ))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error cargando recursos: {str(e)}"
        )

    return recursos_list


@router.post("/matriculados")
async def get_recursos_matriculados(request_data: dict):
    """
    Obtener recursos para una lista de cursos matriculados

    Args:
        request_data: Diccionario con lista de cursos {code, name}

    Returns:
        Diccionario con recursos por curso
    """
    recursos_dict = cargar_recursos()
    resultado = {}

    cursos = request_data.get('cursos', [])

    for curso in cursos:
        curso_code = curso.get('code', '')
        curso_name = curso.get('name', '')

        # Buscar por nombre del curso (normalizado)
        curso_upper = curso_name.strip().upper()

        if curso_upper in recursos_dict:
            data = recursos_dict[curso_upper]
            recursos = [r for r in data['recursos'] if r.strip()]
            resultado[curso_code] = {
                'recursos': recursos,
                'descripcion': data.get('descripcion', '')
            }
        else:
            # Si no se encuentra, devolver vacío
            resultado[curso_code] = {
                'recursos': [],
                'descripcion': 'Sin descripción disponible'
            }

    return {
        'success': True,
        'cursos': resultado
    }
