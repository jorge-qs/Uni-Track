# Análisis de Escalabilidad y Rendimiento - Uni-Track

Este documento detalla el análisis de la arquitectura actual del proyecto Uni-Track, identificando puntos críticos para la escalabilidad y proponiendo mejoras de rendimiento.

## 1. Arquitectura General

El proyecto sigue una arquitectura monolítica modularizada, contenerizada con Docker.

*   **Backend:** FastAPI (Python) con Uvicorn.
*   **Frontend:** React (Vite) servido como SPA.
*   **Base de Datos:** PostgreSQL 15.
*   **ML/Data:** Modelos de Scikit-learn/LightGBM y procesamiento con Pandas integrados directamente en el backend.

## 2. Puntos Críticos de Rendimiento (Bottlenecks)

### 2.1. Inferencia de Machine Learning (Crítico)
El análisis del archivo `backend/app/ml_models/predictor_nota.py` revela problemas significativos de escalabilidad:

*   **Carga de Datos en Memoria:** La clase `PredictorNota` carga un archivo CSV de ~80MB (`predictor_nota_data.csv`) en memoria usando Pandas al iniciar.
    *   *Impacto:* Con múltiples workers de Uvicorn (e.g., 4 workers), el consumo de RAM se multiplica (4 x 80MB + overhead), lo que puede saturar servidores pequeños.
*   **Ejecución Síncrona y Bloqueante:** El método `predecir_nota` realiza filtrado de DataFrames (`self.df_features[...]`) de manera síncrona.
    *   *Impacto:* Pandas libera el GIL para algunas operaciones, pero muchas manipulaciones son intensivas en CPU. Al ejecutarse en el hilo principal de FastAPI, esto **bloquea el Event Loop**, impidiendo que el servidor procese otras solicitudes concurrentes mientras realiza una predicción.
*   **Singleton:** El uso de un Singleton (`get_predictor`) mitiga la recarga del modelo por petición, pero no resuelve el problema de memoria por proceso worker.

### 2.2. Base de Datos
*   **Consultas:** El uso de ORM (SQLAlchemy) es conveniente, pero se debe vigilar el problema de "N+1 queries" al acceder a relaciones (e.g., obtener un alumno y sus matrículas).
*   **Índices:** Tablas críticas como `matricula` o las tablas subyacentes a las features del modelo ML necesitarán índices compuestos (e.g., `cod_persona` + `cod_curso`) para búsquedas rápidas si se migran a SQL.

### 2.3. Frontend
*   **Build:** Actualmente se ejecuta en modo desarrollo (`vite`) dentro del contenedor. Para producción, se debe generar el build estático (`npm run build`) y servirlo con un servidor web ligero (Nginx) o CDN, eliminando la carga de Node.js para servir estáticos.

## 3. Estrategia de Escalabilidad

### 3.1. Corto Plazo (Optimizaciones Inmediatas)

1.  **Mover Datos a Base de Datos:**
    *   Migrar `predictor_nota_data.csv` a una tabla en PostgreSQL.
    *   Reemplazar el filtrado de Pandas en memoria por una consulta SQL eficiente (`SELECT ... WHERE cod_persona = X AND cod_curso = Y`).
    *   Esto reduce el uso de RAM drásticamente y aprovecha la indexación de la BD.

2.  **Ejecución Asíncrona:**
    *   Si se mantiene Pandas, ejecutar la predicción en un *Thread Pool* para no bloquear el loop de FastAPI:
        ```python
        from fastapi.concurrency import run_in_threadpool
        prediction = await run_in_threadpool(predictor.predecir_nota, ...)
        ```

3.  **Caching:**
    *   Implementar **Redis** para cachear predicciones frecuentes. Si un alumno consulta su riesgo en el mismo curso varias veces, no se debe recalcular.

### 3.2. Largo Plazo (Escalabilidad Horizontal)

1.  **Separación de Servicios (Microservicios):**
    *   Extraer la lógica de ML a un servicio dedicado (e.g., "ML Worker" o "Prediction Service").
    *   Comunicación vía cola de mensajes (Celery/RabbitMQ) o HTTP interno.
    *   Permite escalar el API (I/O bound) independientemente del ML (CPU bound).

2.  **Infraestructura:**
    *   Implementar un Load Balancer (Nginx/Traefik) frente a múltiples réplicas del contenedor Backend.
    *   Usar una instancia gestionada de PostgreSQL (e.g., AWS RDS) con Read Replicas para reportes.

## 4. Resumen de Recomendaciones

| Prioridad | Acción | Beneficio |
| :--- | :--- | :--- |
| **Alta** | Migrar CSV de features a PostgreSQL | Reducción drástica de RAM (-80MB/worker) y latencia estable. |
| **Alta** | Ejecutar predicción en ThreadPool | Evitar bloqueo del servidor ante múltiples usuarios. |
| **Media** | Implementar Caching (Redis) | Respuesta instantánea para consultas repetidas. |
| **Media** | Build de Frontend para Producción | Mejor carga inicial y menor consumo de recursos. |
