"""
Recomendador de Matrícula
Evalúa diferentes combinaciones de cursos y recomienda la mejor opción.
"""
import pandas as pd
import ast
import numpy as np
from pathlib import Path
from app.ml_models.predictor_nota_x_matricula import get_predictor_matricula

# Rutas de archivos
DATA_DIR = Path(__file__).parent.parent.parent / "data"
CSV_INFO_PATH = DATA_DIR / "df_curso.csv"
CSV_PREREQS_PATH = DATA_DIR / "malla_curricular_2016.csv"
CSV_GRAPH_PATH = Path(__file__).parent / "cursos_analisis_grafo.csv"


CLUSTERS_RAW = {
    0: ['COMPUTACION GRAFICA', 'COMPUTACION MOLECULAR BIOLOGICA', 'INTELIGENCIA ARTIFICIAL', 'LENGUAJES DE PROGRAMACION', 'ROBOTICA', 'SISTEMAS DE INFORMACION', 'TOPICOS AVANZADOS EN INGENIERIA DE SOFTWARE', 'TOPICOS EN COMPUTACION GRAFICA'],
    1: ['ALGEBRA ABSTRACTA', 'ALGORITMOS Y ESTRUCTURAS DE DATOS', 'CALCULO I', 'CALCULO II', 'CIENCIA DE LA COMPUTACION I', 'CIENCIA DE LA COMPUTACION II', 'ESTRUCTURAS DISCRETAS I', 'ESTRUCTURAS DISCRETAS II', 'MATEMATICA I', 'MATEMATICA II', 'PROGRAMACION DE VIDEO JUEGOS', 'TEORIA DE LA COMPUTACION'],
    2: ['APRECIACION ARTISTICA', 'APRECIACION MUSICAL', 'INTRODUCCION A LA VIDA UNIVERSITARIA', 'LIDERAZGO', 'MORAL', 'ORATORIA', 'PERSONA, MATRIMONIO Y FAMILIA', 'TEATRO', 'TEOLOGIA'],
    3: ['ANALISIS DE LA REALIDAD PERUANA', 'BASES DE DATOS II', 'CLOUD COMPUTING', 'INGENIERIA DE SOFTWARE III', 'INTERACCION HUMANO COMPUTADOR', 'METODOLOGIA DE LA INVESTIGACION EN COMPUTACION', 'REDES Y COMUNICACION'],
    4: ['BIG DATA', 'COMPUTACION EN LA SOCIEDAD', 'ENSENANZA SOCIAL DE LA IGLESIA', 'ETICA PROFESIONAL', 'FORMACION DE EMPRESAS DE BASE TECNOLOGICA I', 'FORMACION DE EMPRESAS DE BASE TECNOLOGICA II', 'HISTORIA DE LA CIENCIA Y TECNOLOGIA', 'HISTORIA DE LA CULTURA', 'INGLES TECNICO PROFESIONAL'],
    5: ['ANALISIS Y DISENO DE ALGORITMOS', 'BASES DE DATOS I', 'COMPILADORES', 'COMPUTACION PARALELA Y DISTRIBUIDA', 'ESTADISTICA Y PROBABILIDADES', 'ESTRUCTURAS DE DATOS AVANZADAS', 'FISICA COMPUTACIONAL', 'INGENIERIA DE SOFTWARE I', 'INGENIERIA DE SOFTWARE II', 'MATEMATICA APLICADA A LA COMPUTACION', 'PROGRAMACION COMPETITIVA', 'SEGURIDAD EN COMPUTACION', 'SISTEMAS OPERATIVOS', 'TOPICOS EN INTELIGENCIA ARTIFICIAL'],
    6: ['ANALISIS NUMERICO', 'ANTROPOLOGIA FILOSOFICA Y TEOLOGICA', 'APRECIACION LITERARIA', 'ARQUITECTURA DE COMPUTADORES', 'COMUNICACION', 'DESARROLLO BASADO EN PLATAFORMAS', 'INTRODUCCION A LA FILOSIA', 'INTRODUCCION DE CIENCIA DE LA COMPUTACION', 'METODOLOGIA DEL ESTUDIO'],
    7: ['PROYECTO FINAL DE CARRERA I', 'PROYECTO FINAL DE CARRERA II', 'PROYECTO FINAL DE CARRERA III']
}



def create_course_cluster_map(cluster_dict):
    course_map = {}
    for cluster_id, courses in cluster_dict.items():
        for course in courses:
            normalized_course = course.strip().upper()
            course_map[normalized_course] = cluster_id
    return course_map


def get_cluster_score(course_name, course_map, SCORE_MAP):
    normalized_course = course_name.strip().upper()
    cluster_id = course_map.get(normalized_course)
    if cluster_id is None:
        return 0.0
    return SCORE_MAP.get(cluster_id, 0.0)


def safe_parse_prerequisitos(prereq_str):
    if pd.isna(prereq_str) or prereq_str.strip() == '[]':
        return []
    try:
        return ast.literal_eval(prereq_str)
    except (ValueError, SyntaxError):
        return [s.strip() for s in prereq_str.strip("[]'\"").split("', '")]


def build_comprehensive_db(csv_info_path, csv_prereqs_path, csv_graph_path):
    try:
        df_info = pd.read_csv(csv_info_path)
        df_prereqs = pd.read_csv(csv_prereqs_path)
        df_graph = pd.read_csv(csv_graph_path)
        df_base = df_info.rename(columns={"COD_CURSO": "CODIGO"})
        df2_prereqs = df_prereqs[['CODIGO', 'PREREQUISITO']]
        df3_graph = df_graph[['CODIGO', 'DEPENDIENTES', 'PROFUNDIDAD_MAX']]
        df_merged = pd.merge(df_base, df2_prereqs, on="CODIGO", how="left")
        df_merged = pd.merge(df_merged, df3_graph, on="CODIGO", how="left")

        comprehensive_db = {}
        for _, row in df_merged.iterrows():
            code = row['CODIGO']
            hrs = row['HRS_CURSO']
            if pd.isna(hrs) or hrs == 0:
                hrs = 1
            comprehensive_db[code] = {
                "CURSO": row['CURSO'],
                "HRS_CURSO": int(hrs),
                "CREDITOS": int(row['CREDITOS']),
                "TIPO_CURSO": row['TIPO_CURSO'],
                "NIVEL_CURSO": int(row['NIVEL_CURSO']),
                "FAMILIA": row['FAMILIA'],
                "PREREQUISITOS": safe_parse_prerequisitos(row.get('PREREQUISITO')),
                "DEPENDIENTES": int(row.get('DEPENDIENTES', 0)),
                "PROFUNDIDAD_MAX": int(row.get('PROFUNDIDAD_MAX', 0))
            }
        print("OK - Comprehensive DB creada")
        return comprehensive_db
    except Exception as e:
        print(f"Error en build_comprehensive_db: {e}")
        print(list(DATA_DIR.iterdir()))
        return {}







DB = build_comprehensive_db(str(CSV_INFO_PATH), str(CSV_PREREQS_PATH), str(CSV_GRAPH_PATH))












def calculate_course_metrics(data, student_semester, familia_map, course_map, SCORE_MAP):
    """Calcula las 8 métricas para un solo curso."""

    # Métrica 1: Atraso
    nivel = data.get('NIVEL_CURSO', student_semester)
    metric_atraso = student_semester - nivel

    # Métrica 2: Eficiencia
    creds = data.get('CREDITOS', 0)
    hrs = data.get('HRS_CURSO', 1) or 1
    metric_eficiencia = creds / hrs

    # Métrica 3: Simplicidad
    prereqs = data.get('PREREQUISITOS', [])
    metric_simplicidad = 1 / (1 + len(prereqs))

    # Métrica 4: Obligatorio
    tipo = data.get('TIPO_CURSO', '')
    metric_obligatorio = 1.0 if tipo == 'O' else 0.0

    # Métrica 5: Familia
    familia = data.get('FAMILIA', '')
    metric_familia = familia_map.get(familia, 0.0)

    # Métrica 6: Puntaje de Cluster
    course_name = data.get('CURSO', '')
    metric_cluster = get_cluster_score(course_name, course_map, SCORE_MAP)

    # Métrica 7: Dependientes
    metric_dependientes = data.get('DEPENDIENTES', 0)

    # Métrica 8: Profundidad Máxima
    metric_profundidad = data.get('PROFUNDIDAD_MAX', 0)

    return {
        "atraso": metric_atraso,
        "eficiencia": metric_eficiencia,
        "simplicidad": metric_simplicidad,
        "obligatorio": metric_obligatorio,
        "familia": metric_familia,
        "cluster": metric_cluster,
        "dependientes": metric_dependientes,
        "profundidad": metric_profundidad
    }

def score_enrollment_bundle(bundle_codes, comprehensive_db, student_semester,
                            individual_weights, familia_map, cod_persona, per_matricula, course_map, SCORE_MAP, max_allowed_credits=26):
    """
    Calcula un score para un conjunto de cursos (un "bundle"),
    balanceando la calidad individual y la carga total.
    Retorna detalles individuales por curso.
    """

    if not bundle_codes:
        return {
            "bundle_score": 0,
            "avg_quality_per_course": 0,
            "total_credits": 0,
            "total_hours": 0,
            "is_valid": False,
            "message": "La matrícula está vacía.",
            "course_details": []
        }

    # Desempaquetar pesos (Asegúrate de que el vector tenga 9 elementos ahora)
    (w_atraso, w_eficiencia, w_simplicidad, w_obligatorio,
     w_familia, w_cluster, w_dependientes, w_profundidad, w_prediction) = individual_weights

    # --- 0. Obtener Predicciones usando el modelo de predicción por matrícula ---
    try:
        predictor = get_predictor_matricula()
        metric_prediction_list = predictor.predecir_notas(
            cod_persona=cod_persona,
            lista_cod_curso=bundle_codes,
            per_matricula=per_matricula
        )
    except Exception as e:
        print(f"Error en predicción de notas: {e}")
        # Fallback: usar 14.0 para todos
        metric_prediction_list = [(cod, 14.0) for cod in bundle_codes]

    # Convertir lista de tuplas a diccionario para acceso O(1)
    prediction_map = dict(metric_prediction_list)

    individual_scores = []
    course_details = []

    total_credits = 0
    total_hours = 0

    # Métricas agregadas para el bundle
    sum_metric_criticidad = 0

    # --- 1. Iterar sobre cursos ---
    for code in bundle_codes:
        if code not in comprehensive_db:
            return {
                "bundle_score": 0, "total_credits": 0,
                "is_valid": False,
                "message": f"Curso '{code}' no encontrado en la DB.",
                "course_details": []
            }

        data = comprehensive_db[code]

        # Calcular las 8 métricas base
        metrics = calculate_course_metrics(data, student_semester, familia_map, course_map, SCORE_MAP)

        # Obtener nota predicha (default 0 si falla algo)
        predicted_grade = prediction_map.get(code, 0)

        # Calcular el score individual ponderado
        individual_score = (
            (w_atraso * metrics["atraso"]) +
            (w_eficiencia * metrics["eficiencia"]) +
            (w_simplicidad * metrics["simplicidad"]) +
            (w_obligatorio * metrics["obligatorio"]) +
            (w_familia * metrics["familia"]) +
            (w_cluster * metrics["cluster"]) +
            (w_dependientes * metrics["dependientes"]) +
            (w_profundidad * metrics["profundidad"]) +
            (w_prediction * predicted_grade) # Métrica 9
        )

        individual_scores.append(individual_score)

        # Acumuladores del bundle
        total_credits += data.get('CREDITOS', 0)
        total_hours += data.get('HRS_CURSO', 0)
        sum_metric_criticidad += (metrics["dependientes"] + metrics["profundidad"])

        # --- GUARDAR DETALLE DEL CURSO ---
        course_info = {
            "codigo": code,
            "nombre": data.get('CURSO', 'N/A'),
            "score_individual": individual_score,
            "nota_predicha": predicted_grade,
            "creditos": data.get('CREDITOS', 0),
            "metricas_base": metrics
        }
        course_details.append(course_info)

    # --- 2. Calcular Penalizaciones y Score Final ---

    # Cursos desaprobados (Basado en el diccionario de predicciones)
    cursos_desaprobados = 0
    for nota in prediction_map.values():
        if nota < 11.5:
            cursos_desaprobados += 1

    avg_quality = np.mean(individual_scores) if individual_scores else 0

    # Pesos para el Score GLOBAL del Bundle
    w_bundle_quality = 0.5
    w_bundle_criticidad = 0.3

    # Factores de penalización
    load_penalty_factor = 10
    fail_penalty_factor = 50

    bundle_base_score = (
        (w_bundle_quality * avg_quality) +
        (w_bundle_criticidad * sum_metric_criticidad)
    )

    load_penalty = 0.0
    is_valid = True
    message = "Matrícula válida."

    if total_credits > max_allowed_credits:
        exceso = total_credits - max_allowed_credits
        load_penalty = (exceso * load_penalty_factor)
        is_valid = False
        message = f"Carga excede el límite de {max_allowed_credits} créditos."

    final_bundle_score = bundle_base_score - load_penalty
    final_bundle_score -= (cursos_desaprobados * fail_penalty_factor)

    # --- 3. Retornar JSON Completo ---
    return {
        "bundle_score": final_bundle_score,
        "is_valid": is_valid,
        "message": message,
        "total_credits": total_credits,
        "total_hours": total_hours,
        "avg_quality_per_course": avg_quality,
        "cursos_desaprobados_predichos": cursos_desaprobados,
        "course_details": course_details
    }



def ranking_cursos(cod_persona: int, per_matricula: str, cursos: list[str]) -> list[str]:
    """
    Toma una lista de cursos y los ordena de mejor a peor según su
    puntuación de heurística individual.

    Parámetros:
    - cod_persona: Código del alumno (int)
    - per_matricula: Período de matrícula (str), e.g., "2019-02"
    - cursos: Lista de códigos de cursos a evaluar (list[str])

    Retorna:
    - Lista de códigos de cursos (list[str]) ordenada por su puntaje.
    """
    
    # --- 1. CONFIGURACIONES INICIALES (Copiadas de sistema_recomendacion) ---
    # Estas configuraciones son necesarias para llamar a score_enrollment_bundle
    # con el mismo contexto que la función original.
    
    semestre_alumno = 0  # Fijo

    course_map = create_course_cluster_map(CLUSTERS_RAW)

    SCORE_MAP = {
        0: 8.0, 1: 10.0, 2: 1.0, 3: 7.0, 4: 3.0, 5: 10.0, 6: 9.0, 7: 5.0
    }

    pesos_individuales = [
        0.05,  # w_atraso
        0.05,  # w_eficiencia
        0.05,  # w_simplicidad
        0.25,  # w_obligatorio
        0.10,  # w_familia
        0.10,  # w_cluster
        0.20,  # w_dependientes
        0.20,  # w_profundidad
        0.30   # w_prediction
    ]

    familia_map = {'CS': 1.0, 'MA': 0.5, 'FG': 0.1, 'ET': 0.3, 'ID': 0.3, 'CB': 0.2}

    # Cargar DB
    

    if not DB:
        print("Error: No se pudo cargar la base de datos de cursos. Retornando lista original.")
        return cursos # Fallback

    # --- 2. ITERACIÓN Y EVALUACIÓN INDIVIDUAL ---
    course_scores = {}

    for curso_code in cursos:
        # Se evalúa el curso como un "bundle" de un solo ítem
        bundle = [curso_code]

        # Llamamos a la misma función de scoring
        score_info = score_enrollment_bundle(
            bundle, DB, semestre_alumno,
            pesos_individuales, familia_map, cod_persona, per_matricula, course_map, SCORE_MAP
        )

        # Guardamos el puntaje total del bundle (que es el puntaje del curso)
        course_scores[curso_code] = score_info['bundle_score']

    # --- 3. ORDENAR Y RETORNAR ---
    
    # Ordenamos la lista 'cursos' original basándonos en los puntajes
    # que calculamos y guardamos en 'course_scores'.
    # Usamos reverse=True para que el puntaje más alto quede primero.
    sorted_cursos = sorted(
        cursos,
        key=lambda curso: course_scores.get(curso, -float('inf')),
        reverse=True
    )

    return sorted_cursos



def sistema_recomendacion(cod_persona: int, per_matricula: str, list_of_bundles: list):
    """
    Evalúa una lista de bundles y determina cuál es la mejor.

    Un "bundle" es una lista de códigos de cursos que un estudiante podría matricular.
    Ejemplo de bundle: ['CS101', 'ET101', 'FG101']

    Parámetros:
    - cod_persona: Código del alumno (int)
    - per_matricula: Período de matrícula (str), e.g., "2019-02"
    - list_of_bundles: Lista de bundles a evaluar (list of list of str)

    Retorna:
    - Diccionario con la mejor recomendación y todos los resultados evaluados
    """
    semestre_alumno = 0  # Fijo. Ya que el aporte de semestre es una combinación lineal, no afecta la elección del mejor bundle.

    # --- 1. CONFIGURACIONES INICIALES (Se ejecutan una sola vez) ---
    CLUSTERS_RAW = {
        0: ['COMPUTACION GRAFICA', 'COMPUTACION MOLECULAR BIOLOGICA', 'INTELIGENCIA ARTIFICIAL', 'LENGUAJES DE PROGRAMACION', 'ROBOTICA', 'SISTEMAS DE INFORMACION', 'TOPICOS AVANZADOS EN INGENIERIA DE SOFTWARE', 'TOPICOS EN COMPUTACION GRAFICA'],
        1: ['ALGEBRA ABSTRACTA', 'ALGORITMOS Y ESTRUCTURAS DE DATOS', 'CALCULO I', 'CALCULO II', 'CIENCIA DE LA COMPUTACION I', 'CIENCIA DE LA COMPUTACION II', 'ESTRUCTURAS DISCRETAS I', 'ESTRUCTURAS DISCRETAS II', 'MATEMATICA I', 'MATEMATICA II', 'PROGRAMACION DE VIDEO JUEGOS', 'TEORIA DE LA COMPUTACION'],
        2: ['APRECIACION ARTISTICA', 'APRECIACION MUSICAL', 'INTRODUCCION A LA VIDA UNIVERSITARIA', 'LIDERAZGO', 'MORAL', 'ORATORIA', 'PERSONA, MATRIMONIO Y FAMILIA', 'TEATRO', 'TEOLOGIA'],
        3: ['ANALISIS DE LA REALIDAD PERUANA', 'BASES DE DATOS II', 'CLOUD COMPUTING', 'INGENIERIA DE SOFTWARE III', 'INTERACCION HUMANO COMPUTADOR', 'METODOLOGIA DE LA INVESTIGACION EN COMPUTACION', 'REDES Y COMUNICACION'],
        4: ['BIG DATA', 'COMPUTACION EN LA SOCIEDAD', 'ENSENANZA SOCIAL DE LA IGLESIA', 'ETICA PROFESIONAL', 'FORMACION DE EMPRESAS DE BASE TECNOLOGICA I', 'FORMACION DE EMPRESAS DE BASE TECNOLOGICA II', 'HISTORIA DE LA CIENCIA Y TECNOLOGIA', 'HISTORIA DE LA CULTURA', 'INGLES TECNICO PROFESIONAL'],
        5: ['ANALISIS Y DISENO DE ALGORITMOS', 'BASES DE DATOS I', 'COMPILADORES', 'COMPUTACION PARALELA Y DISTRIBUIDA', 'ESTADISTICA Y PROBABILIDADES', 'ESTRUCTURAS DE DATOS AVANZADAS', 'FISICA COMPUTACIONAL', 'INGENIERIA DE SOFTWARE I', 'INGENIERIA DE SOFTWARE II', 'MATEMATICA APLICADA A LA COMPUTACION', 'PROGRAMACION COMPETITIVA', 'SEGURIDAD EN COMPUTACION', 'SISTEMAS OPERATIVOS', 'TOPICOS EN INTELIGENCIA ARTIFICIAL'],
        6: ['ANALISIS NUMERICO', 'ANTROPOLOGIA FILOSOFICA Y TEOLOGICA', 'APRECIACION LITERARIA', 'ARQUITECTURA DE COMPUTADORES', 'COMUNICACION', 'DESARROLLO BASADO EN PLATAFORMAS', 'INTRODUCCION A LA FILOSIA', 'INTRODUCCION DE CIENCIA DE LA COMPUTACION', 'METODOLOGIA DEL ESTUDIO'],
        7: ['PROYECTO FINAL DE CARRERA I', 'PROYECTO FINAL DE CARRERA II', 'PROYECTO FINAL DE CARRERA III']
    }

    course_map = create_course_cluster_map(CLUSTERS_RAW)

    SCORE_MAP = {
        0: 8.0, 1: 10.0, 2: 1.0, 3: 7.0, 4: 3.0, 5: 10.0, 6: 9.0, 7: 5.0
    }

    pesos_individuales = [
        0.05,  # w_atraso
        0.05,  # w_eficiencia
        0.05,  # w_simplicidad
        0.25,  # w_obligatorio
        0.10,  # w_familia
        0.10,  # w_cluster
        0.20,  # w_dependientes
        0.20,  # w_profundidad
        0.30   # w_prediction
    ]

    familia_map = {'CS': 1.0, 'MA': 0.5, 'FG': 0.1, 'ET': 0.3, 'ID': 0.3, 'CB': 0.2}

    if not DB:
        return {
            "meta": {
                "cod_persona": cod_persona,
                "total_evaluados": 0,
                "mejor_opcion_index": -1
            },
            "mejor_recomendacion": {
                "index": -1,
                "score": 0,
                "cursos": [],
                "detalle": None
            },
            "todos_los_resultados": [],
            "error": "No se pudo cargar la base de datos de cursos"
        }

    # --- 2. ITERACIÓN Y EVALUACIÓN ---
    results = []
    best_score = -float('inf')
    best_bundle_index = -1

    for i, bundle in enumerate(list_of_bundles):
        # Calcular score para el bundle actual
        score_info = score_enrollment_bundle(
            bundle, DB, semestre_alumno,
            pesos_individuales, familia_map, cod_persona, per_matricula, course_map, SCORE_MAP
        )

        # Añadir ID para referencia
        score_info['bundle_id'] = i
        score_info['courses_list'] = bundle

        # Guardar en resultados
        results.append(score_info)

        # Comparar para encontrar el mejor
        current_score = score_info['bundle_score']
        is_valid = score_info['is_valid']

        # Lógica de selección del mejor:
        # Si el actual es mejor que el mejor registrado Y es válido
        if is_valid and current_score > best_score:
            best_score = current_score
            best_bundle_index = i

        # Si no hemos encontrado ninguno válido aún, tomamos el "menos malo"
        elif best_bundle_index == -1 and current_score > best_score:
            best_score = current_score
            best_bundle_index = i

    # --- 3. CONSTRUCCIÓN DE LA RESPUESTA ---

    # Recuperar datos del mejor bundle
    best_bundle_data = results[best_bundle_index] if best_bundle_index != -1 else None

    final_response = {
        "meta": {
            "cod_persona": cod_persona,
            "per_matricula": per_matricula,
            "total_evaluados": len(list_of_bundles),
            "mejor_opcion_index": best_bundle_index
        },
        "mejor_recomendacion": {
            "index": best_bundle_index,
            "score": best_score,
            "cursos": best_bundle_data['courses_list'] if best_bundle_data else [],
            "detalle": best_bundle_data
        },
        "todos_los_resultados": results
    }

    return final_response

# --- DEPENDENCIAS ASUMIDAS ---
# (Se asume que estas funciones y variables globales existen en el mismo contexto)
#
# from some_utils import (
#     create_course_cluster_map, 
#     build_comprehensive_db, 
#     score_enrollment_bundle
# )
# 
# CSV_INFO_PATH = "path/to/info.csv"
# CSV_PREREQS_PATH = "path/to/prereqs.csv"
# CSV_GRAPH_PATH = "path/to/graph.csv"
#
# --- FIN DE DEPENDENCIAS ASUMIDAS ---




def calcular_score_bundle(cod_persona: int, per_matricula: str, bundle: list) -> float:
    """
    Evalúa un único bundle y retorna su puntaje (score).

    Parámetros:
    - cod_persona: Código del alumno (int)
    - per_matricula: Período de matrícula (str), e.g., "2019-02"
    - bundle: Lista de códigos de cursos (list of str). Ejemplo: ['CS101', 'ET101']

    Retorna:
    - float: El puntaje calculado del bundle.
    """

    semestre_alumno = 0  # Valor fijo según lógica original

    # --- 1. CONFIGURACIONES (Mapeos y Pesos) ---

    SCORE_MAP = {0: 8.0, 1: 10.0, 2: 1.0, 3: 7.0, 4: 3.0, 5: 10.0, 6: 9.0, 7: 5.0}

    pesos_individuales = [
        0.05,  # w_atraso
        0.05,  # w_eficiencia
        0.05,  # w_simplicidad
        0.25,  # w_obligatorio
        0.10,  # w_familia
        0.10,  # w_cluster
        0.20,  # w_dependientes
        0.20,  # w_profundidad
        0.30   # w_prediction
    ]

    familia_map = {'CS': 1.0, 'MA': 0.5, 'FG': 0.1, 'ET': 0.3, 'ID': 0.3, 'CB': 0.2}

    # Asumimos que estas variables globales o funciones auxiliares existen en tu entorno
    course_map = create_course_cluster_map(CLUSTERS_RAW)
    
    # --- 2. CARGA DE DATOS ---
    # NOTA: Si vas a llamar a esta función muchas veces en un bucle,
    # es recomendable sacar la carga de la DB fuera de esta función.

    if not DB:
        # Retornamos un valor muy bajo para indicar error o fallo crítico
        return -float('inf')

    # --- 3. CÁLCULO DE SCORE ---
    score_info = score_enrollment_bundle(
        bundle, 
        DB, 
        semestre_alumno,
        pesos_individuales, 
        familia_map, 
        cod_persona, 
        per_matricula, 
        course_map, 
        SCORE_MAP
    )

    # Retornamos solo el valor numérico del score
    return score_info['bundle_score']