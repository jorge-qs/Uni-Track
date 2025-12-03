# Guía de Pruebas de Rendimiento y Métricas

Este documento describe los escenarios de prueba implementados y cómo interpretar las gráficas generadas por el sistema de benchmarking.

## 1. Escenarios de Prueba (Tests)

El archivo `locustfile.py` define el comportamiento de los usuarios simulados. Se han configurado dos tareas principales con diferentes pesos (frecuencia de ejecución):

### A. `view_dashboard` (Peso: 1)
*   **Acción:** Realiza una petición GET a la raíz (`/`).
*   **Objetivo:** Simular la carga base del sistema cuando los usuarios navegan por la interfaz principal.
*   **Representa:** Operaciones ligeras de lectura, carga de estáticos o consultas simples a la base de datos.
*   **Impacto Esperado:** Bajo consumo de CPU y memoria. Debería tener tiempos de respuesta muy rápidos (< 50ms).

### B. `predict_dropout_risk` (Peso: 3)
*   **Acción:** Realiza una petición POST a `/api/v1/prediccion/predecir` con datos aleatorios de estudiantes y cursos reales.
*   **Objetivo:** Estresar el componente de Machine Learning (modelo LightGBM/XGBoost).
*   **Representa:** La funcionalidad core del negocio. Cada petición requiere:
    1.  Recibir el JSON.
    2.  Preprocesar los datos (codificación, validación).
    3.  Ejecutar la inferencia del modelo (CPU intensivo).
    4.  Devolver la probabilidad de deserción.
*   **Impacto Esperado:** Alto consumo de CPU. Es el principal cuello de botella. Si el servidor se satura, la latencia de esta tarea aumentará drásticamente.

---

## 2. Interpretación de las Gráficas

El script `generate_graphs.py` genera visualizaciones clave para entender la salud del sistema.

### 1. Requests per Second (RPS) - `rps_graph.png`
*   **Qué es:** Número de peticiones que el servidor completa exitosamente por segundo.
*   **Interpretación:**
    *   **Curva Ascendente:** El sistema está escalando bien y aceptando más carga.
    *   **Meseta (Línea Plana):** Se ha alcanzado el límite de capacidad del servidor (Saturation Point). Aunque lleguen más usuarios, el servidor no puede procesar más rápido.
    *   **Caída:** El servidor está fallando o rechazando conexiones (Timeouts/Errores 500).

### 2. Response Time (Mediana y p95) - `response_time_graph.png`
*   **Qué es:** Cuánto tiempo tarda el servidor en responder (en milisegundos).
    *   **Mediana (50%):** El tiempo que experimenta el usuario "promedio".
    *   **p95 (95th Percentile):** El tiempo que experimentan los usuarios más lentos (el 5% peor). Es crítico para garantizar calidad de servicio (SLA).
*   **Interpretación:**
    *   **Estable:** El sistema maneja la carga cómodamente.
    *   **Picos:** Bloqueos momentáneos (e.g., Garbage Collection, bloqueo de base de datos).
    *   **Crecimiento Exponencial:** El sistema está saturado (cola de peticiones llena).
    *   **Valores Ideales:** < 200ms para APIs web, < 500ms para inferencia ML compleja.

### 3. Latencia de Inferencia - `inference_latency_graph.png`
*   **Qué es:** Tiempo específico que toma el endpoint de predicción (`predict_dropout_risk`). Aísla el rendimiento del modelo de ML del resto del sistema.
*   **Interpretación:**
    *   Si esta gráfica sube pero el uso de CPU es bajo, puede haber bloqueos de I/O (lectura de disco/BD).
    *   Si sigue la misma forma que el uso de CPU, el modelo está limitado por la capacidad de procesamiento.

### 4. Uso de CPU - `cpu_usage_graph.png`
*   **Qué es:** Porcentaje de CPU utilizado por el proceso del servidor (`uvicorn`).
*   **Interpretación:**
    *   **Bajo (< 20%):** El sistema está subutilizado o limitado por I/O (esperando base de datos).
    *   **Alto (> 80%):** El sistema está CPU-bound (típico en ML). Es señal de que se necesitan más cores o réplicas.
    *   **100%:** Saturación total. La latencia aumentará inmediatamente.

### 5. RAM Footprint - `ram_usage_graph.png`
*   **Qué es:** Memoria RAM consumida por el proceso (RSS - Resident Set Size).
*   **Interpretación:**
    *   **Crecimiento Constante (Memory Leak):** Si la línea sube y nunca baja, el código tiene una fuga de memoria. El servidor eventualmente crasheará (OOM Kill).
    *   **Salto Inicial:** Carga de modelos y librerías (Pandas/Scikit-learn).
    *   **Estable:** Comportamiento saludable.
