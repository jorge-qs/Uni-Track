from app.ml_models.recomendador_matricula import ranking_cursos, comparar_horarios
import traceback # Para obtener detalles del error

def run_tests_recomendador():
    """
    Ejecuta una suite de pruebas de integración para las funciones
    ranking_cursos y comparar_horarios.

    Retorna:
    - Un diccionario (JSON) con un reporte detallado de la ejecución.
    """
    
    # --- 1. DATOS DE PRUEBA ---
    # Usamos datos realistas basados en los CLUSTERS_RAW de tu código.
    
    TEST_COD_PERSONA = 12345
    TEST_PER_MATRICULA = "2024-01" # Asumimos un período de matrícula

    # --- Test 1: Datos para ranking_cursos ---
    # Mezclamos cursos de alta prioridad (cluster 1 y 5) y baja prioridad (cluster 2)
    # Cluster 1: ALGORITMOS Y ESTRUCTURAS DE DATOS, CALCULO I
    # Cluster 5: INGENIERIA DE SOFTWARE I
    # Cluster 2: TEOLOGIA
    # Esperamos que 'TEOLOGIA' sea el último.
    cursos_para_ranking = [
        'ALGORITMOS Y ESTRUCTURAS DE DATOS',  # Alto Prio (Cluster 1: 10.0)
        'TEOLOGIA',                           # Bajo Prio (Cluster 2: 1.0)
        'INGENIERIA DE SOFTWARE I',           # Alto Prio (Cluster 5: 10.0)
        'CALCULO I'                           # Alto Prio (Cluster 1: 10.0)
    ]
    
    # --- Test 2: Datos para comparar_horarios ---
    
    # Horario A: Un bundle lógico de primer-segundo ciclo
    horario_bueno = {
        "per_matricula": TEST_PER_MATRICULA,
        "cursos": [
            'CALCULO I',                      # Cluster 1
            'ESTRUCTURAS DISCRETAS I',      # Cluster 1
            'INTRODUCCION DE CIENCIA DE LA COMPUTACION' # Cluster 6
        ]
    }
    
    # Horario B: Un bundle ilógico (cursos avanzados, poca sinergia)
    horario_malo = {
        "per_matricula": TEST_PER_MATRICULA,
        "cursos": [
            'PROYECTO FINAL DE CARRERA III',  # Cluster 7 (Puntaje bajo, alta profundidad)
            'TEOLOGIA',                       # Cluster 2 (Puntaje bajo)
            'APRECIACION ARTISTICA'           # Cluster 2 (Puntaje bajo)
        ]
    }
    
    # --- 2. ESTRUCTURA DEL REPORTE ---
    test_report = {
        "status": "PENDIENTE",
        "resumen": {
            "total": 0,
            "pasaron": 0,
            "fallaron": 0
        },
        "results": {}
    }
    
    all_tests_passed = True

    # --- 3. EJECUCIÓN DE PRUEBA: ranking_cursos ---
    test_name_1 = "test_ranking_cursos_prioridad"
    test_report["resumen"]["total"] += 1
    try:
        descripcion_1 = "Prueba que 'ranking_cursos' ordena correctamente, poniendo cursos de baja prioridad (Cluster 2) al final."
        
        # Ejecutar la función
        output = ranking_cursos(TEST_COD_PERSONA, TEST_PER_MATRICULA, cursos_para_ranking)
        
        # --- Aserciones ---
        # 1. La longitud debe ser la misma
        assert len(output) == len(cursos_para_ranking)
        # 2. El curso de más baja prioridad debe estar al final
        assert output[-1] == 'TEOLOGIA'
        # 3. El primer curso NO debe ser el de baja prioridad
        assert output[0] != 'TEOLOGIA'
        
        # Reportar éxito
        test_report["results"][test_name_1] = {
            "status": "PASS",
            "description": descripcion_1,
            "input": {
                "cod_persona": TEST_COD_PERSONA,
                "per_matricula": TEST_PER_MATRICULA,
                "cursos": cursos_para_ranking
            },
            "output": output
        }
        test_report["resumen"]["pasaron"] += 1

    except Exception as e:
        all_tests_passed = False
        test_report["resumen"]["fallaron"] += 1
        test_report["results"][test_name_1] = {
            "status": "FAIL",
            "description": descripcion_1,
            "input": {
                "cod_persona": TEST_COD_PERSONA,
                "per_matricula": TEST_PER_MATRICULA,
                "cursos": cursos_para_ranking
            },
            "error_tipo": type(e).__name__,
            "error_detalle": str(e),
            "traceback": traceback.format_exc()
        }

    # --- 4. EJECUCIÓN DE PRUEBA: comparar_horarios ---
    test_name_2 = "test_comparar_horarios_bueno_vs_malo"
    test_report["resumen"]["total"] += 1
    try:
        descripcion_2 = "Prueba que 'comparar_horarios' prefiere un bundle 'bueno' (cursos base) sobre un bundle 'malo' (cursos avanzados/inconexos)."
        
        # Ejecutar la función
        output = comparar_horarios(TEST_COD_PERSONA, horario_bueno, horario_malo)
        
        # --- Aserciones ---
        # 1. El ganador debe ser 'horario1' (el horario_bueno)
        assert output["horario_ganador"] == "horario1"
        # 2. El score del ganador (horario1) debe ser mayor que el del perdedor (horario2)
        score_ganador = output["score_ganador"]
        # El detalle comparativo es la lista 'todos_los_resultados'
        score_perdedor = output["detalle_comparativo"][1]["bundle_score"] 
        assert score_ganador > score_perdedor
        
        # Reportar éxito
        test_report["results"][test_name_2] = {
            "status": "PASS",
            "description": descripcion_2,
            "input": {
                "cod_persona": TEST_COD_PERSONA,
                "horario1": horario_bueno,
                "horario2": horario_malo
            },
            "output": output
        }
        test_report["resumen"]["pasaron"] += 1

    except Exception as e:
        all_tests_passed = False
        test_report["resumen"]["fallaron"] += 1
        test_report["results"][test_name_2] = {
            "status": "FAIL",
            "description": descripcion_2,
            "input": {
                "cod_persona": TEST_COD_PERSONA,
                "horario1": horario_bueno,
                "horario2": horario_malo
            },
            "error_tipo": type(e).__name__,
            "error_detalle": str(e),
            "traceback": traceback.format_exc()
        }

    # --- 5. FINALIZAR REPORTE ---
    if all_tests_passed:
        test_report["status"] = "Recomendador tests ran successfully: ALL PASS"
    else:
        test_report["status"] = "Recomendador tests FAILED: Al menos una prueba falló."

    return test_report

# --- Ejemplo de cómo ejecutarlo ---
if __name__ == "__main__":
    # Para ejecutar este test, necesitarías tener:
    # 1. El módulo 'app.ml_models.recomendador_matricula' accesible.
    # 2. Todas las dependencias de ese módulo (ej: pandas, y las funciones
    #    create_course_cluster_map, build_comprehensive_db, score_enrollment_bundle).
    # 3. Los archivos CSV (CSV_INFO_PATH, etc.) en las rutas correctas.
    
    print("Ejecutando pruebas del recomendador...")
    reporte_final = run_tests_recomendador()
    
    # Imprimir el reporte en formato JSON "bonito"
    import json
    print(json.dumps(reporte_final, indent=2))