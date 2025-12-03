# Reporte de Cuellos de Botella y Rendimiento

## Resumen Ejecutivo
Durante las pruebas de carga con **500 usuarios concurrentes**, se observó una degradación crítica del rendimiento, alcanzando un **Percentil 95 (p95) de 30,000 ms (30 segundos)** en el tiempo de respuesta. Esto contrasta con el rendimiento estable observado con 50 usuarios.

El análisis del código y la arquitectura identifica que el cuello de botella principal es el **bloqueo del Event Loop de FastAPI** debido a operaciones síncronas intensivas en CPU dentro del servicio de predicción.

## Análisis de Causa Raíz

### 1. Filtrado Síncrono de Pandas (Bloqueante)
**Ubicación:** `backend/app/ml_models/predictor_nota.py` (Líneas 94-103)

El método `predecir_nota` realiza un filtrado secuencial sobre un DataFrame cargado en memoria (`self.df_features`) para cada petición:

```python
filtros = (
    (self.df_features["COD_PERSONA"] == cod_persona_num) &
    (self.df_features["COD_CURSO"] == cod_curso)
)
filas = self.df_features[filtros]
```

*   **Problema:** Pandas libera el GIL (Global Interpreter Lock) para algunas operaciones numéricas, pero la manipulación de índices y máscaras booleanas en DataFrames grandes consume ciclos de CPU significativos en el hilo principal.
*   **Impacto:** Al ser una operación síncrona dentro de una ruta `async` (o llamada desde ella), **detiene el procesamiento de todas las demás peticiones** en ese worker hasta que termina. Con 500 usuarios, la cola de espera crece exponencialmente, causando la latencia de 30s.

### 2. Carga de Datos en Memoria
**Ubicación:** `backend/app/ml_models/predictor_nota.py` (Línea 57)

```python
self.df_features = pd.read_csv(DATA_PATH)
```

*   **Problema:** Cada worker de Uvicorn carga una copia completa del CSV en su memoria RAM.
*   **Impacto:**
    *   **Escalabilidad Vertical Limitada:** Aumentar el número de workers (para usar más CPU) multiplica el consumo de RAM, arriesgando un *Out Of Memory (OOM)* kill.
    *   **Tiempo de Arranque:** El servidor tarda en estar listo mientras lee y parsea el CSV.

### 3. Inferencia ML Síncrona
**Ubicación:** `backend/app/ml_models/predictor_nota.py` (Línea 124)

```python
categoria = self.modelo.predict(X)[0]
```

*   **Problema:** La predicción del modelo (LightGBM/XGBoost/Sklearn) es una operación puramente ligada a CPU (CPU-bound).
*   **Impacto:** Sumado al filtrado de Pandas, esto contribuye al bloqueo del worker.

## Recomendaciones de Optimización

### Corto Plazo (Mitigación)
1.  **Ejecución en ThreadPool:** Envolver la llamada a `predictor.predecir_nota` en `fastapi.concurrency.run_in_threadpool`. Esto moverá la carga de CPU a un hilo separado, permitiendo que el Event Loop siga procesando I/O (otras peticiones).
    ```python
    # En el endpoint (main.py o router)
    from fastapi.concurrency import run_in_threadpool
    resultado = await run_in_threadpool(predictor.predecir_nota, ...)
    ```

### Mediano Plazo (Solución Definitiva)
2.  **Migración a Base de Datos:** Mover los datos de `predictor_nota_data.csv` a una tabla SQL (PostgreSQL) con índices en `COD_PERSONA` y `COD_CURSO`.
    *   Reemplazar el filtrado de Pandas por una consulta `SELECT` eficiente.
    *   Esto reduce el uso de RAM y delega la búsqueda al motor de base de datos optimizado.

3.  **Microservicio de ML:** Separar la lógica de predicción a un servicio independiente (e.g., servido con TensorFlow Serving, TorchServe o un servicio Python ligero dedicado) para escalar independientemente del API principal.
