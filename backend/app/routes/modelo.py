"""
Endpoints para gestión de Predicción de Notas
Utiliza modelos predictivos para estimar notas de estudiantes
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.services.modelo import verificar_cursos_alumno
from app.schemas.modelo import NotasRequest, NotasResponse, MatriculaRequest, MatriculaResponse

from app.db.database import get_db

router = APIRouter()

@router.get("/notas", response_model=NotasResponse, status_code=status.HTTP_200_OK)
async def get_notas(
    notas_request: NotasRequest,
    db: Session = Depends(get_db)
):
    """
    Llamar al modelo predictivo para obtener notas estimadas de un estudiante en un curso

    Args:
        cod_alumno: Código del alumno
        db: Sesión de base de datos

    Returns:
        Notas estimadas del alumno en los cursos de la malla curricular

    Raises:
        HTTPException 404: Si el alumno no existe
        HTTPException 500: Si ocurre un error en el modelo
    """
    # Verificar si el alumno existe
    cod_persona = notas_request.cod_persona
    alumno = db.query(Alumno).filter(
        Alumno.cod_persona == cod_persona
    ).first()
    if not alumno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró alumno con código {cod_persona}"
        )
    # Llamar al modelo predictivo (lógica ficticia para ilustrar)
    notas = {
        "MA100": 14.5,
        "CS100": 13.0,
        "MA203": 15.0
    }
    return NotasResponse(
        success=True,
        message="Notas estimadas obtenidas exitosamente",
        cod_persona=cod_persona,
        estudiante={
            "cod_persona": alumno.cod_persona,
            "sexo": alumno.sexo,
            "estado_civil": alumno.estado_civil,
            "fecha_nacimiento": alumno.fecha_nacimiento.isoformat() if alumno.fecha_nacimiento else None,
            "per_ingreso": alumno.per_ingreso,
            "tipo_colegio": alumno.tipo_colegio,
            "puntaje_ingreso": alumno.puntaje_ingreso,
            "beca_vigente": alumno.beca_vigente,
            "departamento_pro": alumno.departamento_pro,
            "provincia_pro": alumno.provincia_pro,
            "distrito_pro": alumno.distrito_pro,
            "departamento_res": alumno.departamento_res,
            "provincia_res": alumno.provincia_res,
            "distrito_res": alumno.distrito_res,
        },
        notas_cursos=notas
    )




@router.post("/matricula", response_model=MatriculaResponse, status_code=status.HTTP_201_CREATED)
async def create_curso(
    matricula_request: MatriculaRequest,
    db: Session = Depends(get_db)
):
    """
    Llama al segundo modelo predictivo para obtener notas estimadas tras la matrícula en cursos específicos

    Args:
        cod_alumno: Código del alumno
        cod_cursos: Lista de códigos de cursos a matricular
        db: Sesión de base de datos

    Returns:
        Notas estimadas del alumno en los cursos de la malla curricular

    Raises:
        HTTPException 400: Si el código de curso ya existe
    """
    # Veficcar si los cursos pueden ser llevados por el alumno
    cod_alumno = matricula_request.cod_alumno
    cod_cursos = matricula_request.cod_cursos
    for i in cod_cursos:
        if not verificar_cursos_alumno(cod_alumno, cod_cursos, db):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El curso con código {i} no puede ser llevado por el alumno {cod_alumno}"
            )
    notas = []

    for i in cod_cursos:
        notas.append(15.0)  # Valor ficticio para ilustrar
        # Aquí se llamaría al modelo predictivo con los datos necesarios
        # y se agregarían las notas estimadas a la lista 'notas'

    return MatriculaResponse(
        success=True,
        message="Matrícula creada exitosamente",
        cod_alumno=cod_alumno,
        notas_estimas=dict(zip(cod_cursos, notas))
    )
