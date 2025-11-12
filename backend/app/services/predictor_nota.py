"""
Predictor de Notas usando Modelo de Machine Learning
Basado en el enfoque correcto: buscar fila completa en CSV con features pre-calculadas
"""

import pickle
import pandas as pd
from pathlib import Path

# Rutas de archivos
MODEL_PATH = Path(__file__).parent.parent.parent.parent / "model/modelo_produccion.pkl"
DATA_PATH = Path(__file__).parent.parent.parent.parent / "model/predictor_nota_data.csv"

print(f"Buscando modelo en: {MODEL_PATH}")
print(f"Buscando datos en: {DATA_PATH}")


class PredictorNota:
    """Clase para predecir notas usando el modelo ML entrenado"""

    def __init__(self):
        """Cargar el modelo y dataset con features pre-calculadas"""
        # Cargar modelo - intentar con joblib primero, luego pickle
        self.modelo = None
        print(f"Buscando modelo en: {MODEL_PATH}")
        print(f"Buscando datos en: {DATA_PATH}")
        try:
            import joblib
            self.modelo = joblib.load(MODEL_PATH)
            print(f"✓ Modelo ML cargado exitosamente (joblib)")
        except Exception as e:
            print(f"Intento con joblib falló: {e}")
            try:
                import pickle5 as pickle_alt
                with open(MODEL_PATH, 'rb') as f:
                    self.modelo = pickle_alt.load(f)
                print(f"✓ Modelo ML cargado exitosamente (pickle5)")
            except Exception as e2:
                print(f"Intento con pickle5 falló: {e2}")
                try:
                    with open(MODEL_PATH, 'rb') as f:
                        self.modelo = pickle.load(f, encoding='latin1')
                    print(f"✓ Modelo ML cargado exitosamente (pickle latin1)")
                except Exception as e3:
                    print(f"Error al cargar modelo con pickle: {e3}")
                    self.modelo = None

        # Cargar dataset con features
        try:
            print(f"Cargando dataset de features...")
            self.df_features = pd.read_csv(DATA_PATH)
            print(f"✓ Dataset cargado: {len(self.df_features)} filas")
        except Exception as e:
            print(f"Error al cargar dataset: {e}")
            self.df_features = None

    def predecir_nota(self, cod_persona: str, cod_curso: str,
                      alumno_data: dict = None, curso_data: dict = None,
                      historial_academico: dict = None) -> float:
        """
        Predecir nota buscando la fila completa en el CSV pre-calculado

        Args:
            cod_persona: Código del estudiante
            cod_curso: Código del curso
            alumno_data: No usado
            curso_data: No usado
            historial_academico: Solo para fallback

        Returns:
            Nota predicha (0-20)
        """
        if self.modelo is None or self.df_features is None:
            print(f"# MODELO: {self.modelo is None} - FEATURES: {self.df_features is None}")
            print("⚠ Modelo o dataset no disponible, usando promedio histórico")
            if historial_academico:
                return historial_academico.get('promedio_acumulado', 14.0)
            return 14.0

        try:
            # Convertir cod_persona a int
            try:
                cod_persona_num = int(cod_persona)
            except ValueError:
                cod_persona_num = cod_persona

            # Buscar fila en dataset
            filas = self.df_features[
                (self.df_features["COD_PERSONA"] == cod_persona_num) &
                (self.df_features["COD_CURSO"] == cod_curso)
            ]

            if filas.empty:
                print(f"⚠ No hay datos para {cod_persona}/{cod_curso}")
                if historial_academico:
                    return historial_academico.get('promedio_acumulado', 14.0)
                return 14.0

            # Tomar última fila
            fila = filas.iloc[-1:].copy()

            # Eliminar columnas que no son features
            cols_eliminar = ['NOTA', 'COD_PERSONA', 'COD_CURSO', 'PER_MATRICULA',
                           'RANKING', 'CURSO', 'CONTRASENIA', 'FECHA_NACIMIENTO',
                           'DEPARTAMENTO_PRO', 'PROVINCIA_PRO', 'DISTRITO_PRO',
                           'DEPARTAMENTO_RES', 'PROVINCIA_RES', 'DISTRITO_RES']

            X = fila.drop(columns=[c for c in cols_eliminar if c in fila.columns], errors='ignore')

            # Predecir
            nota = self.modelo.predict(X)[0]
            nota = max(0, min(20, nota))

            print(f"✓ Predicción: {nota:.1f} para {cod_persona}/{cod_curso}")
            return round(nota, 1)

        except Exception as e:
            print(f"Error en predicción: {e}")
            import traceback
            traceback.print_exc()
            if historial_academico:
                return historial_academico.get('promedio_acumulado', 14.0)
            return 14.0


# Singleton
_predictor_instance = None

def get_predictor() -> PredictorNota:
    global _predictor_instance
    if _predictor_instance is None:
        print("Inicializando PredictorNota singleton...")
        _predictor_instance = PredictorNota()
    return _predictor_instance
