import traceback
import json
import math

# --- IMPORTACIÓN DE FUNCIONES ---
try:
    # Asumimos que ambas funciones residen ahora en el mismo módulo
    from app.ml_models.recomendador_matricula import (
        sistema_recomendacion,
        calcular_score_bundle
    )
except ImportError:
    print("Error: No se pudieron importar las funciones. Asegúrate de que la ruta (sys.path) es correcta.")
    # Definir funciones 'dummy' para evitar crash inmediato si falla el import
    def sistema_recomendacion(*args, **kwargs): raise ImportError("sistema_recomendacion no cargada.")
    def calcular_score_bundle(*args, **kwargs): raise ImportError("calcular_score_bundle no cargada.")

def run_tests_recomendador():
    """
    Ejecuta una prueba de consistencia para verificar que la función refactorizada
    'calcular_score_bundle' devuelve el mismo puntaje que la función original
    'sistema_recomendacion'.

    Retorna:
    - Un diccionario (JSON) con el reporte de la ejecución.
    """
    
    # --- 1. DATOS DE PRUEBA ---
    TEST_COD_PERSONA = 22171
    TEST_PER_MATRICULA = "2019-02"
    
    # Bundle de prueba: Lista de códigos de cursos
    bundle_prueba = ['CS111', 'MA100', 'CS100'] 

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

    # --- 3. PRUEBA: Consistencia de Scores ---
    test_name = "test_consistencia_score_original_vs_refactor"
    test_report["resumen"]["total"] += 1
    
    descripcion = (
        "Verifica que 'calcular_score_bundle' (nuevo) retorne exactamente "
        "el mismo valor numérico que 'sistema_recomendacion' (original) "
        "para el mismo input."
    )
    
    try:
        # A. Ejecutar el sistema ORIGINAL (recibe lista de listas)
        #    Pasamos el bundle envuelto en otra lista: [bundle_prueba]
        output_original = sistema_recomendacion(
            TEST_COD_PERSONA, 
            TEST_PER_MATRICULA, 
            [bundle_prueba]
        )
        
        # Extraemos el score de la estructura compleja de respuesta original
        # Estructura esperada: { 'mejor_recomendacion': { 'score': float, ... }, ... }
        if output_original.get("error"):
            raise ValueError(f"La función original retornó error: {output_original['error']}")
            
        score_original = output_original['mejor_recomendacion']['score']

        # B. Ejecutar la función REFACTORIZADA (recibe un solo bundle)
        score_refactorizado = calcular_score_bundle(
            TEST_COD_PERSONA, 
            TEST_PER_MATRICULA, 
            bundle_prueba
        )

        # --- Aserciones ---
        
        # 1. Validar que ambos resultados sean numéricos (float o int)
        if not isinstance(score_original, (int, float)):
            raise TypeError(f"El score original no es numérico: {type(score_original)}")
        if not isinstance(score_refactorizado, (int, float)):
            raise TypeError(f"El score refactorizado no es numérico: {type(score_refactorizado)}")

        # 2. Comparar valores. Usamos math.isclose para tolerancia a punto flotante
        #    o comparación directa si esperamos determinismo exacto.
        diferencia = abs(score_original - score_refactorizado)
        son_iguales = math.isclose(score_original, score_refactorizado, rel_tol=1e-9)

        if not son_iguales:
            raise AssertionError(
                f"Discrepancia en scores.\n"
                f"Original: {score_original}\n"
                f"Refactor: {score_refactorizado}\n"
                f"Diferencia: {diferencia}"
            )

        test_report["results"][test_name] = {
            "status": "PASS",
            "description": descripcion,
            "input": {
                "cod_persona": TEST_COD_PERSONA,
                "bundle": bundle_prueba
            },
            "output": {
                "score_original": score_original,
                "score_refactorizado": score_refactorizado,
                "match": True
            }
        }
        test_report["resumen"]["pasaron"] += 1

    except Exception as e:
        all_tests_passed = False
        test_report["resumen"]["fallaron"] += 1
        test_report["results"][test_name] = {
            "status": "FAIL",
            "description": descripcion,
            "input": {
                "cod_persona": TEST_COD_PERSONA,
                "bundle": bundle_prueba
            },
            "error_tipo": type(e).__name__,
            "error_detalle": str(e),
            "traceback": traceback.format_exc()
        }

    # --- 4. FINALIZAR REPORTE ---
    if all_tests_passed:
        test_report["status"] = "Consistency tests ran successfully: ALL PASS"
    else:
        test_report["status"] = "Consistency tests FAILED: Al menos una prueba falló."

    return test_report