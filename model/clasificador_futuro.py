import pandas as pd
import joblib
import os

CACHE_FILE_NAME = "datasets/predictor_nota_data.csv"


def buscar_fila_prediccion(cod_persona, cod_curso, per_matricula):
    """
    Función principal que busca una fila de predicción y, si no existe
    el caché, lo genera.
    """
    try:
        print(f"Cargando '{CACHE_FILE_NAME}' y buscando la fila...")
        df_predicciones = pd.read_csv(CACHE_FILE_NAME)
        
        # 4. Filtrar la fila específica
        # Asegurarse de que los tipos de datos coincidan para el merge
        fila_encontrada = df_predicciones[
            (df_predicciones["COD_PERSONA"] == cod_persona) &
            (df_predicciones["COD_CURSO"] == cod_curso) &
            (df_predicciones["PER_MATRICULA"] == per_matricula)
        ]
        
        # 5. Imprimir el resultado
        if fila_encontrada.empty:
            print("\n" + "="*50)
            print("--- FILA NO ENCONTRADA ---")
            print(f"No se encontró una entrada simulada para:")
            print(f"  COD_PERSONA:   {cod_persona}")
            print(f"  COD_CURSO:     {cod_curso}")
            print(f"  PER_MATRICULA: {per_matricula}")
            print("  (Esto puede ocurrir si el estudiante o curso no tenían historial).")
            print("="*50)
        else:
            return fila_encontrada

    except Exception as e:
        print(f"Error al leer o filtrar el archivo '{CACHE_FILE_NAME}': {e}")
        print("Intenta eliminar el archivo y volver a ejecutar la función.")

def funcion_prediction(cod_persona, cod_curso, per_matricula):
    x = buscar_fila_prediccion(cod_persona, cod_curso, per_matricula)
    # --- Cargar el modelo entrenado ---
    modelo_path = 'modulos/modelo_produccion_clasificador.pkl'  # Asegúrate de que este sea el path correcto
    modelo = joblib.load(modelo_path)
    # --- Realizar la predicción ---
    if x is not None:
        # Asegúrate de que las columnas coincidan con las usadas en el entrenamiento
        prediccion = modelo.predict(x)
        print(f"Predicción de nota para COD_PERSONA={cod_persona}, COD_CURSO={cod_curso}, PER_MATRICULA={per_matricula}: {prediccion[0]}")
        return prediccion[0]
    


COD_ALUMNO_EJEMPLO = 32899  # Reemplaza con un COD_PERSONA real
COD_CURSO_EJEMPLO = "CS261" # Reemplaza con un COD_CURSO real
SEMESTRE_PREDICCION = "2019-02" 

nota = funcion_prediction(COD_ALUMNO_EJEMPLO, COD_CURSO_EJEMPLO, SEMESTRE_PREDICCION)
