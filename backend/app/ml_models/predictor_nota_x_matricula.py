"""
Predictor de Nota por Matrícula
Predice la nota que obtendrá un estudiante en un curso considerando
todos los cursos de su matrícula actual.
"""

import pandas as pd
import joblib
from pathlib import Path

# Rutas de archivos
MODEL_PATH = Path(__file__).parent / "modelo_produccion_x_matricula.pkl"
DATA_PATH = Path(__file__).parent / "predictor_nota_data.csv"
df_predicciones = pd.read_csv(DATA_PATH) # Mejora de velocidad x17
print(f"Buscando modelo de prediccion por matricula en: {MODEL_PATH}")
print(f"Buscando datos en: {DATA_PATH}")


def buscar_fila_prediccion(cod_persona, lista_cod_curso, per_matricula):
    """
    Busca las filas correspondientes a los cursos en el dataset.
    Si no encuentra datos para el período específico, busca cualquier período disponible.

    Args:
        cod_persona: Código del estudiante
        lista_cod_curso: Lista de códigos de cursos
        per_matricula: Período de matrícula (puede no existir en el CSV)

    Returns:
        DataFrame con las filas encontradas
    """
    try:
        
        lista_filas_encontradas = []

        for cod_curso in lista_cod_curso:
            # Primero intentar con el período específico
            fila_encontrada = df_predicciones[
                (df_predicciones["COD_PERSONA"] == cod_persona) &
                (df_predicciones["COD_CURSO"] == cod_curso) &
                (df_predicciones["PER_MATRICULA"] == per_matricula)
            ]

            # Si no existe, buscar cualquier período para ese estudiante y curso
            if fila_encontrada.empty:
                fila_encontrada = df_predicciones[
                    (df_predicciones["COD_PERSONA"] == cod_persona) &
                    (df_predicciones["COD_CURSO"] == cod_curso)
                ]

                if not fila_encontrada.empty:
                    # Tomar el registro más reciente
                    fila_encontrada = fila_encontrada.sort_values('PER_MATRICULA', ascending=False).head(1)
                    print(f"INFO - Usando datos historicos de {fila_encontrada['PER_MATRICULA'].values[0]} para {cod_persona}/{cod_curso}")
                else:
                    print(f"WARNING - No hay datos para {cod_persona}/{cod_curso}")

            if not fila_encontrada.empty:
                lista_filas_encontradas.append(fila_encontrada)

        if not lista_filas_encontradas:
            return pd.DataFrame()

        return pd.concat(lista_filas_encontradas, ignore_index=True)

    except Exception as e:
        print(f"Error al leer o filtrar el archivo '{DATA_PATH}': {e}")
        return pd.DataFrame()


def generar_columns(df):
    """
    Añade columnas que describen la carga total del semestre.
    """
    df_out = df.copy()

    # Definir todas las categorías posibles
    CATEGORIAS_FAMILIA = ['CS', 'FG', 'MA', 'ET', 'CB', 'ID']
    CATEGORIAS_CLUSTER = ['0', '1', '2', '3', '4', '5', '6', '7']

    # Calcular totales del semestre
    grupo_semestre_inicial = df_out.groupby(['COD_PERSONA', 'PER_MATRICULA'])

    df_out['N_CURSOS_ACTUAL'] = grupo_semestre_inicial['COD_CURSO'].transform('count')
    df_out['N_CREDITOS_ACTUAL'] = grupo_semestre_inicial['CREDITOS'].transform('sum')

    # Generar dummies
    if 'FAMILIA' not in df_out.columns or 'CLUSTER_DIFICULTAD' not in df_out.columns:
        raise ValueError("El DataFrame de entrada debe tener 'FAMILIA' y 'CLUSTER_DIFICULTAD'.")

    df_out['FAMILIA'] = df_out['FAMILIA'].astype(str)
    df_out['CLUSTER_DIFICULTAD'] = df_out['CLUSTER_DIFICULTAD'].astype(str)

    df_out['FAMILIA'] = pd.Categorical(df_out['FAMILIA'], categories=CATEGORIAS_FAMILIA)
    df_out['CLUSTER_DIFICULTAD'] = pd.Categorical(df_out['CLUSTER_DIFICULTAD'], categories=CATEGORIAS_CLUSTER)

    df_familia_dummies = pd.get_dummies(df_out['FAMILIA'], prefix='N_FAMILIA')
    df_cluster_dummies = pd.get_dummies(df_out['CLUSTER_DIFICULTAD'], prefix='N_CLUSTER')

    df_out = pd.concat([df_out, df_familia_dummies, df_cluster_dummies], axis=1)

    # Calcular los conteos de carga por familia y cluster
    familia_cols = df_familia_dummies.columns.tolist()
    cluster_cols = df_cluster_dummies.columns.tolist()

    grupo_semestre_actualizado = df_out.groupby(['COD_PERSONA', 'PER_MATRICULA'])

    for col in familia_cols + cluster_cols:
        df_out[col] = grupo_semestre_actualizado[col].transform('sum')

    return df_out


class PredictorNotaMatricula:
    """Clase para predecir notas considerando la matrícula completa"""

    def __init__(self):
        """Cargar el modelo de predicción por matrícula"""
        self.modelo = None
        try:
            self.modelo = joblib.load(MODEL_PATH)
            print(f"OK - Modelo de prediccion por matricula cargado exitosamente")
        except Exception as e:
            print(f"Error al cargar modelo de prediccion por matricula: {e}")
            self.modelo = None

    def predecir_notas(self, cod_persona: int, lista_cod_curso: list[str], per_matricula: str) -> list[tuple[str, float]]:
        """
        Predice las notas para una lista de cursos considerando la carga total.

        Args:
            cod_persona: Código del estudiante
            lista_cod_curso: Lista de códigos de cursos
            per_matricula: Período de matrícula

        Returns:
            Lista de tuplas (cod_curso, nota_predicha)
        """
        if self.modelo is None:
            print("Modelo no disponible, retornando fallback")
            return [(cod, 14.0) for cod in lista_cod_curso]

        try:
            # Buscar filas en el dataset
            x = buscar_fila_prediccion(cod_persona, lista_cod_curso, per_matricula)

            if x.empty:
                print("No se encontraron filas para realizar predicciones.")
                return [(cod, 14.0) for cod in lista_cod_curso]

            # Generar features de carga
            x = generar_columns(x)

            # Preparar datos para predicción
            X_pred = x.drop(columns=['NOTA'], errors='ignore')

            # Predecir en lote
            predicciones = self.modelo.predict(X_pred)

            # Asociar predicciones con cursos
            cod_cursos_predichos = x['COD_CURSO'].values

            lista_notas = []
            for i in range(len(predicciones)):
                cod_curso = cod_cursos_predichos[i]
                nota_predicha = predicciones[i]
                lista_notas.append((cod_curso, float(nota_predicha)))
                print(f"OK - Prediccion por matricula: {nota_predicha:.1f} para {cod_persona}/{cod_curso}")

            return lista_notas

        except Exception as e:
            print(f"Error en prediccion por matricula: {e}")
            import traceback
            traceback.print_exc()
            return [(cod, 14.0) for cod in lista_cod_curso]


# Singleton
_predictor_matricula_instance = None

def get_predictor_matricula() -> PredictorNotaMatricula:
    global _predictor_matricula_instance
    if _predictor_matricula_instance is None:
        _predictor_matricula_instance = PredictorNotaMatricula()
    return _predictor_matricula_instance
