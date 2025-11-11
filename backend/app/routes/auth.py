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
from app.models.seccion import Seccion
from app.models.matricula import Matricula
from collections import defaultdict
import ast
import csv

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

    # 1) Buscar alumno por código
    alumno = db.query(Alumno).filter(
        Alumno.cod_persona == login_data.cod_persona
    ).first()

    if not alumno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró alumno con código {login_data.cod_persona}"
        )
    # Procesar la contraseña
    if not alumno.verificar_contrasenia(login_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contraseña incorrecta"
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

    def str_to_list_simple(prereq_str: str) -> list[str]:
        """Convertir cadena separada por comas a lista"""
        if not prereq_str:
            return []
        prereq_str = prereq_str[1:-1]  # eliminar corchetes si existen
        return [s.strip() for s in prereq_str.split(",") if s.strip()]

    def str_to_list(prereq_str: str) -> list[str]:
        """Convertir cadena de prerequisitos a lista, manejando comillas y formatos variados"""
        if not prereq_str:
            return []
        if isinstance(prereq_str, (list, tuple)):
            return [str(x) for x in prereq_str]

        # Primero intentar parsear expresiones Python seguras como "['a','b,c','d']"
        try:
            parsed = ast.literal_eval(prereq_str)
            if isinstance(parsed, (list, tuple)):
                return [str(x) for x in parsed]
        except (ValueError, SyntaxError):
            pass

        # Si falla, usar csv.reader para respetar comillas que contienen comas
        try:
            row = next(csv.reader([prereq_str], skipinitialspace=True))
            return [s.strip().strip("\"'") for s in row if s.strip()]
        except Exception:
            # Fallback final: dividir por coma simple
            return [s.strip().strip("\"'") for s in prereq_str.split(",") if s.strip()]
    
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
            "prerequisitos_cod": str_to_list_simple(c.prerequisito_cod),
            "descripcion": c.descripcion,

        }
        for c in cursos
    ]

    cred_cursos = {c.cod_curso: c.creditos for c in cursos}


    # 3) matricula_info: diccionario { per_matricula: [cursos llevados en este periodo] }

    matriculas = db.query(Matricula).filter(
        Matricula.cod_persona == login_data.cod_persona
    ).all()

    # Mapear cod_curso -> nombre de curso para enriquecer la salida (evita consultas N+1)
    curso_nombres = {c.cod_curso: c.curso for c in cursos}

    matricula_dict = defaultdict(lambda: {"cursos": []})

    for m in matriculas:
        matricula_dict[m.per_matricula]["cursos"].append({
            "cod_curso": m.cod_curso,
            "curso": curso_nombres.get(m.cod_curso),
            "nota": m.nota,
            "hrs_inasistencia": m.hrs_inasistencia
        })
    
    for per in matricula_dict.keys():
        matricula_dict[per]["cant_creditos"] = sum(
            cred_cursos.get(m["cod_curso"], 0) for m in matricula_dict[per]["cursos"]
        )
        matricula_dict[per]["cursos_aprobados"] = sum(
            1 for m in matricula_dict[per]["cursos"] if m["nota"] is not None and round(m["nota"]) >= 11
        )
        matricula_dict[per]["promedio_periodo"] = round(
            sum(m["nota"] for m in matricula_dict[per]["cursos"] if m["nota"] is not None) /
            sum(1 for m in matricula_dict[per]["cursos"] if m["nota"] is not None), 2
        ) if any(m["nota"] is not None for m in matricula_dict[per]["cursos"]) else None

        


    matricula_info = dict(matricula_dict)

    academic_info = {
        "total_cursos": len(matriculas),
        "cursos_aprobados": sum(1 for m in matriculas if m.nota is not None and round(m.nota) >= 11),
        "cursos_reprobados": sum(1 for m in matriculas if m.nota is not None and round(m.nota) < 11),
        "creditos_aprobados": sum(
            cred_cursos.get(m.cod_curso, 0) for m in matriculas if m.nota is not None and round(m.nota) >= 11
        ),
        "promedio_general": round(
            sum(m.nota for m in matriculas if m.nota is not None) / 
            sum(1 for m in matriculas if m.nota is not None), 2
        ) if any(m.nota is not None for m in matriculas) else None
    }


    # 4) cursos disponibles (cursos cuyas prerequisitos se cumplen y que NO ha llevado)

    cursos_aprobados = [
        m.cod_curso for m in matriculas if m.nota is not None and round(m.nota) >= 11
    ]

    # Cursos que ya llevó (aprobados o no)
    cursos_llevados = [m.cod_curso for m in matriculas]


    cursos_disponibles = []
    for i in cursos:
        # Saltar si ya llevó el curso
        if i.cod_curso in cursos_llevados:
            continue

        prereqs = str_to_list_simple(i.prerequisito_cod)
        abierto = True
        for pr in prereqs:
            if pr == "300IN" or pr == "400IN":
                continue  # requisitos especiales que siempre se cumplen
            elif pr == "100CR":
                if academic_info["creditos_aprobados"] < 100:
                    abierto = False
                    break
            elif pr not in cursos_aprobados:
                abierto = False
                break
        if abierto:
            cursos_disponibles.append(i.cod_curso)

    # 5) sacar de la tabla Seccion los recursos asociados a los cursos disponibles

    secciones = db.query(Seccion).filter(
        Seccion.cod_curso.in_(cursos_disponibles)
    ).all()

# dado
# CS210,ALGORITMOS Y ESTRUCTURAS DE DATOS,1,TEORÍA 1,Presencial,Lun. 11:00 - 13:00,Semana General,UTEC-BA A901(42),30,30,"Nina Choquehuayta, Wilder ",wnina@utec.edu.pe
# CS210,ALGORITMOS Y ESTRUCTURAS DE DATOS,1,LABORATORIO 1.01,Presencial,Jue. 07:00 - 09:00,Semana General,UTEC-BA M604(30),30,30,"Nina Choquehuayta, Wilder ",wnina@utec.edu.pe
# CS210,ALGORITMOS Y ESTRUCTURAS DE DATOS,1,LABORATORIO 1.01,Presencial,Vie. 10:00 - 12:00,Semana General,UTEC-BA M604(30),30,30,"Nina Choquehuayta, Wilder ",wnina@utec.edu.pe
# CS210,ALGORITMOS Y ESTRUCTURAS DE DATOS,2,TEORÍA 2,Presencial,Mar. 18:00 - 20:00,Semana General,UTEC-BA A903(46),45,45,"Sanchez Enriquez, Heider Ysaias",hsanchez@utec.edu.pe
# CS210,ALGORITMOS Y ESTRUCTURAS DE DATOS,2,LABORATORIO 2.01,Presencial,Mie. 18:00 - 20:00,Semana General,UTEC-BA M803(45),45,45,"Sanchez Enriquez, Heider Ysaias",hsanchez@utec.edu.pe
# CS210,ALGORITMOS Y ESTRUCTURAS DE DATOS,2,LABORATORIO 2.01,Presencial,Jue. 18:00 - 20:00,Semana General,UTEC-BA M302(60),45,45,"Sanchez Enriquez, Heider Ysaias",hsanchez@utec.edu.pe
# CS210,ALGORITMOS Y ESTRUCTURAS DE DATOS,3,TEORÍA 3,Presencial,Mar. 11:00 - 13:00,Semana General,UTEC-BA M302(60),30,30,"Ojeda Rios, Brenner Humberto ",bojeda@utec.edu.pe
# CS210,ALGORITMOS Y ESTRUCTURAS DE DATOS,3,LABORATORIO 3.01,Presencial,Jue. 12:00 - 14:00,Semana General,UTEC-BA M601(30),30,30,"Ojeda Rios, Brenner Humberto ",bojeda@utec.edu.pe
# CS210,ALGORITMOS Y ESTRUCTURAS DE DATOS,3,LABORATORIO 3.01,Presencial,Vie. 10:00 - 12:00,Semana General,UTEC-BA M602(30),30,30,"Ojeda Rios, Brenner Humberto ",bojeda@utec.edu.pe

# quiero
# {
#     "CS210":[
#         {
#             "seccion": 1,
#             "grupos":[
#                 {
#                     "grupo": "TEORÍA 1",
#                     "modalidad": "Presencial",
#                     "horario": "Lun. 11:00 - 13:00",
#                     "frecuencia": "Semana General",
#                     "ubicacion":"UTEC-BA A901(42)",
#                     "vacantes": 30,
#                     "matriculados":30,
#                     "docente": "Ojeda Rios, Brenner Humberto",
#                     "correo": "bojeda@utec.edu.pe"
#                 },
#                 {

#                 },
#                 {

#                 }
#             ]
#          },
#         {},
#         {}
#     ]
# }


    secciones_info = {}
    for c in cursos_disponibles:
        secciones_disp = [i for i in secciones if i.cod_curso == c]
        secciones_dic = {}
        for s in secciones_disp:
            if s.seccion not in secciones_dic:
                secciones_dic[s.seccion] = {"grupos": []}
            secciones_dic[s.seccion]["grupos"].append({
                    "grupo": s.grupo,
                    "modalidad": s.modalidad,
                    "horario": s.horario,
                            "frecuencia": s.frecuencia,
                            "ubicacion": s.ubicacion,
                            "vacantes": s.vacantes,
                            "matriculados": s.matriculados,
                            "docente": s.docente,
                            "correo": s.correo
                    }
                )

        # Limitar a solo las primeras 2 secciones (con todos sus grupos)
        secciones_limitadas = {}
        for idx, (seccion_num, seccion_data) in enumerate(secciones_dic.items()):
            if idx < 2:  # Solo las primeras 2 secciones
                secciones_limitadas[seccion_num] = seccion_data

        secciones_info[c] = secciones_limitadas

    # 6) resources_info: diccionario { cod_curso: [resources] }

    resources_info = {}

    for c in cursos:
        if c.cod_curso not in cursos_disponibles:
            continue
        resources_info[c.cod_curso] = str_to_list(c.resources)

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
        academic_info=academic_info,
        cursos_disponibles=cursos_disponibles,
        resources_info=resources_info,
        secciones_info=secciones_info
    )
