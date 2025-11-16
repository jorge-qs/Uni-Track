"""
Clasificador de Riesgo Académico usando Modelo de Machine Learning
Predice categorías de rendimiento: 0=Riesgo, 1=Normal, 2=Factible
"""

import pickle
import pandas as pd
from pathlib import Path

# Rutas de archivos - AHORA USA EL CLASIFICADOR
MODEL_PATH = Path(__file__).parent / "modelo_produccion_clasificador.pkl"
DATA_PATH = Path(__file__).parent / "predictor_nota_data.csv"

print(f"Buscando modelo clasificador en: {MODEL_PATH}")
print(f"Buscando datos en: {DATA_PATH}")

# Mapeo de categorías a rangos de notas estimadas

CATEGORIA_LABELS = {
    0: "Riesgo",
    1: "Normal",
    2: "Factible"
}


class PredictorNota:
    """Clase para clasificar riesgo académico usando el modelo ML entrenado"""

    def __init__(self):
        """Cargar el modelo clasificador y dataset con features pre-calculadas"""
        # Cargar modelo - intentar con joblib primero, luego pickle
        self.modelo = None
        try:
            import joblib
            self.modelo = joblib.load(MODEL_PATH)
            print(f"OK - Modelo clasificador cargado exitosamente (joblib)")
        except Exception as e:
            print(f"Intento con joblib falló: {e}")
            try:
                import pickle5 as pickle_alt
                with open(MODEL_PATH, 'rb') as f:
                    self.modelo = pickle_alt.load(f)
                print(f"OK - Modelo clasificador cargado exitosamente (pickle5)")
            except Exception as e2:
                print(f"Intento con pickle5 falló: {e2}")
                try:
                    with open(MODEL_PATH, 'rb') as f:
                        self.modelo = pickle.load(f, encoding='latin1')
                    print(f"OK - Modelo clasificador cargado exitosamente (pickle latin1)")
                except Exception as e3:
                    print(f"Error al cargar modelo con pickle: {e3}")
                    self.modelo = None

        # Cargar dataset con features
        try:
            print(f"Cargando dataset de features...")
            self.df_features = pd.read_csv(DATA_PATH)
            print(f"OK - Dataset cargado: {len(self.df_features)} filas")
        except Exception as e:
            print(f"Error al cargar dataset: {e}")
            self.df_features = None

    def predecir_nota(self, cod_persona: str, cod_curso: str,
                      per_matricula: str = None,
                      historial_academico: dict = None) -> str:
        """
        Clasificar riesgo académico y devolver nota estimada + categoría

        Args:
            cod_persona: Código del estudiante
            cod_curso: Código del curso
            per_matricula: Período de matrícula (opcional, se usa para filtrar si está disponible)
            alumno_data: No usado
            curso_data: No usado
            historial_academico: Solo para fallback

        Returns:
            categoria_riesgo: str ("Riesgo", "Normal", "Factible")
        """
        if self.modelo is None or self.df_features is None:
            print("Modelo o dataset no están disponibles, usando promedio acumulado como fallback")
            if historial_academico:
                return (historial_academico.get('promedio_acumulado', 14.0), "Error1")
            return (14.0, "Error2")

        try:
            # Convertir cod_persona a int
            try:
                cod_persona_num = int(cod_persona)
            except ValueError:
                cod_persona_num = cod_persona

            # Buscar fila en dataset
            filtros = (
                (self.df_features["COD_PERSONA"] == cod_persona_num) &
                (self.df_features["COD_CURSO"] == cod_curso)
            )

            # Si se proporciona per_matricula, usarlo como filtro adicional
            if per_matricula and "PER_MATRICULA" in self.df_features.columns:
                filtros = filtros & (self.df_features["PER_MATRICULA"] == per_matricula)

            filas = self.df_features[filtros]

            if filas.empty:
                print(f"WARNING - No hay datos para {cod_persona}/{cod_curso}" +
                      (f"/{per_matricula}" if per_matricula else ""))
                if historial_academico:
                    return "Error3"
                return "Error4"

            # Tomar última fila
            fila = filas.iloc[-1:].copy()

            # Eliminar columnas que no son features
            cols_eliminar = ['NOTA', 'COD_PERSONA', 'COD_CURSO', 'PER_MATRICULA',
                           'RANKING', 'CURSO', 'CONTRASENIA', 'FECHA_NACIMIENTO',
                           'DEPARTAMENTO_PRO', 'PROVINCIA_PRO', 'DISTRITO_PRO',
                           'DEPARTAMENTO_RES', 'PROVINCIA_RES', 'DISTRITO_RES']

            X = fila.drop(columns=[c for c in cols_eliminar if c in fila.columns], errors='ignore')

            # Clasificar (devuelve 0, 1, o 2)
            categoria = self.modelo.predict(X)[0]

            # Convertir categoría a nota estimada
            categoria_label = CATEGORIA_LABELS.get(categoria, "Error")

            print(f"OK - Clasificacion: {categoria_label} (categoria {categoria}) - para {cod_persona}/{cod_curso}")
            return  categoria_label

        except Exception as e:
            print(f"Error en clasificación: {e}")
            import traceback
            traceback.print_exc()
            if historial_academico:
                return "Error5"
            return "Error6"


# Singleton
_predictor_instance = None

def get_predictor() -> PredictorNota:
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = PredictorNota()
    return _predictor_instance
