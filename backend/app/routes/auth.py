"""
Endpoints de autenticación
Login simplificado sin contraseña (solo código de estudiante)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.auth import LoginRequest, LoginResponse
from app.models.alumno import Alumno
from app.models.curso import Curso
from app.models.matricula import Matricula
from collections import defaultdict

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
    # Buscar alumno por código
    alumno = db.query(Alumno).filter(
        Alumno.cod_persona == login_data.cod_persona
    ).first()

    if not alumno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró alumno con código {login_data.cod_persona}"
        )

    alumno_info = {
        "nombre": alumno.nombre,
        "apellido": alumno.apellido,
        "carrera": alumno.carrera,
        "cod_persona": alumno.cod_persona,
        "sexo": alumno.sexo,
        "per_ingreso": alumno.per_ingreso,
        "estado_civil": alumno.estado_civil,
        "tipo_colegio": alumno.tipo_colegio,
        "ptje_ingreso": alumno.ptje_ingreso,
        "beca_vigente": alumno.beca_vigente,
        "departamento_pro": alumno.departamento_pro,
        "provincia_pro": alumno.provincia_pro,
        "distrito_pro": alumno.distrito_pro,
        "departamento_res": alumno.departamento_res,
        "provincia_res": alumno.provincia_res,
        "distrito_res": alumno.distrito_res
    }

    def str_to_list(prereq_str: str) -> list[str]:
        """Convertir cadena separada por comas a lista"""
        if not prereq_str:
            return []
        prereq_str = prereq_str[1:-1]  # eliminar corchetes si existen
        return [s.strip() for s in prereq_str.split(",") if s.strip()]
    # 2) cursos_info: dataframe de los cursos => lista de dicts
    cursos = db.query(Curso).all()
    cursos_info = [
        {
            "cod_curso": c.cod_curso,
            "curso": c.curso,
            "creditos": c.creditos,
            "familia": c.familia,
            "nivel_curso": c.nivel_curso,
            "tipo": c.tipo,
            "horas": c.horas,
            "prerequisitos": str_to_list(c.prerequisito),
            "descripcion": "Buen curso sobre " + c.curso  # Descripción ficticia

        }
        for c in cursos
    ]

    # 3) matricula_info: diccionario { per_matricula: [cursos llevados en este periodo] }

    matriculas = db.query(Matricula).filter(
        Matricula.cod_persona == login_data.cod_persona
    ).all()

    # Mapear cod_curso -> nombre de curso para enriquecer la salida (evita consultas N+1)
    curso_nombres = {c.cod_curso: c.curso for c in cursos}

    matricula_dict = defaultdict(list)
    for m in matriculas:
        matricula_dict[m.per_matricula].append({
            "cod_curso": m.cod_curso,
            "curso": curso_nombres.get(m.cod_curso),
            "nota": m.nota,
            "hrs_inasistencia": m.hrs_inasistencia
        })

    matricula_info = dict(matricula_dict)



    # Retornar información del estudiante y variables solicitadas
    return LoginResponse(
        success=True,
        message="Login exitoso",
        cod_persona=str(alumno.cod_persona),
        alumno={
            "cod_persona": alumno.cod_persona,
            "per_ingreso": alumno.per_ingreso,
            "beca_vigente": alumno.beca_vigente,
            "puntaje_ingreso": alumno.ptje_ingreso,
        },
        alumno_info=alumno_info,
        cursos_info=cursos_info,
        matricula_info=matricula_info,
    )
