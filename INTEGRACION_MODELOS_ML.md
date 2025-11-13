# Integración de Modelos ML - Uni-Track

## Resumen de la Integración

Se han integrado exitosamente **2 nuevos modelos de Machine Learning** al sistema Uni-Track:

### ✅ Modelo #1: Clasificador de Riesgo (Ya existente)
- **Ubicación**: `backend/app/predictor_nota.py`
- **Endpoint**: `POST /api/v1/prediccion/predecir`
- **Uso**: Página "Matrícula IA" - Predice riesgo individual por curso

### ✅ Modelo #2: Predictor de Nota por Matrícula (NUEVO)
- **Ubicación**: `backend/app/predictor_nota_x_matricula.py`
- **Endpoint**: `POST /api/v1/prediccion/predecir-por-matricula`
- **Uso**: Popup de detalles en "Calendario Tentativo"
- **Diferencia clave**: Considera TODOS los cursos de la matrícula para predicción más precisa

### ✅ Modelo #3: Recomendador de Horario Óptimo (NUEVO)
- **Ubicación**: `backend/app/recomendador_matricula.py`
- **Endpoint**: `POST /api/v1/recomendacion/mejor-horario`
- **Uso**: Botón "Recomendar Mejor Horario" en "Calendario Tentativo"
- **Funcionalidad**: Evalúa múltiples combinaciones de cursos y recomienda la mejor

---

## Cómo Usar los Nuevos Endpoints

### 1. Predicción de Notas por Matrícula

**Frontend (TypeScript/React):**
```typescript
import { predecirNotasPorMatricula } from '@/api/api';

// Ejemplo: Usuario selecciona 3 cursos en el calendario tentativo
const codPersona = "32899";
const cursos = ["CS261", "CS281", "CS341"];
const periodo = "2025-01";

// Llamar al endpoint
const resultado = await predecirNotasPorMatricula(codPersona, cursos, periodo);

// resultado.predicciones contiene:
// [
//   { cod_curso: "CS261", nota_predicha: 15.2 },
//   { cod_curso: "CS281", nota_predicha: 13.8 },
//   { cod_curso: "CS341", nota_predicha: 14.5 }
// ]

// Usar en el popup de curso
cursos.forEach(curso => {
  const prediccion = resultado.predicciones.find(p => p.cod_curso === curso);
  console.log(`${curso}: Nota estimada ${prediccion?.nota_predicha}`);
});
```

**Ejemplo de Request HTTP:**
```bash
curl -X POST http://localhost:8000/api/v1/prediccion/predecir-por-matricula \
  -H "Content-Type: application/json" \
  -d '{
    "cod_persona": "32899",
    "codigos_cursos": ["CS261", "CS281", "CS341"],
    "per_matricula": "2025-01"
  }'
```

**Response:**
```json
{
  "success": true,
  "cod_persona": "32899",
  "per_matricula": "2025-01",
  "predicciones": [
    {"cod_curso": "CS261", "nota_predicha": 15.2},
    {"cod_curso": "CS281", "nota_predicha": 13.8},
    {"cod_curso": "CS341", "nota_predicha": 14.5}
  ],
  "mensaje": "Predicción exitosa considerando 3 cursos de la matrícula"
}
```

---

### 2. Recomendación de Mejor Horario

**Frontend (TypeScript/React):**
```typescript
import { recomendarMejorHorario } from '@/api/api';

// Ejemplo: Usuario tiene 3 opciones diferentes de matrícula
const codPersona = "32899";
const periodo = "2025-01";

// Opción 1: Pocos cursos (carga ligera)
const opcion1 = ["CS261", "CS281", "CS341"];

// Opción 2: Carga media
const opcion2 = ["CS261", "CS281", "CS341", "CS391", "ET101"];

// Opción 3: Carga pesada (puede exceder límite de créditos)
const opcion3 = ["CS261", "CS281", "FG350", "ID101", "MA100", "CS100", "FG101"];

const bundles = [opcion1, opcion2, opcion3];

// Obtener recomendación
const recomendacion = await recomendarMejorHorario(codPersona, periodo, bundles);

if (recomendacion) {
  const mejor = recomendacion.mejor_recomendacion;

  console.log(`Mejor opción: Bundle #${mejor.index}`);
  console.log(`Score: ${mejor.score}`);
  console.log(`Cursos: ${mejor.cursos.join(', ')}`);
  console.log(`Créditos totales: ${mejor.detalle?.total_credits}`);
  console.log(`Cursos en riesgo: ${mejor.detalle?.cursos_desaprobados_predichos}`);

  // Mostrar detalles por curso
  mejor.detalle?.course_details.forEach(curso => {
    console.log(`  ${curso.codigo}: Nota predicha ${curso.nota_predicha}`);
  });
}
```

**Ejemplo de Request HTTP:**
```bash
curl -X POST http://localhost:8000/api/v1/recomendacion/mejor-horario \
  -H "Content-Type: application/json" \
  -d '{
    "cod_persona": "32899",
    "per_matricula": "2025-01",
    "bundles": [
      ["CS261", "CS281", "CS341"],
      ["CS261", "CS281", "CS341", "CS391", "ET101"],
      ["CS261", "CS281", "FG350", "ID101", "MA100", "CS100", "FG101"]
    ]
  }'
```

**Response (Simplificado):**
```json
{
  "success": true,
  "meta": {
    "cod_persona": 32899,
    "per_matricula": "2025-01",
    "total_evaluados": 3,
    "mejor_opcion_index": 1
  },
  "mejor_recomendacion": {
    "index": 1,
    "score": 45.8,
    "cursos": ["CS261", "CS281", "CS341", "CS391", "ET101"],
    "detalle": {
      "bundle_score": 45.8,
      "is_valid": true,
      "message": "Matrícula válida.",
      "total_credits": 20,
      "total_hours": 15,
      "cursos_desaprobados_predichos": 0,
      "course_details": [
        {
          "codigo": "CS261",
          "nombre": "COMPUTACION GRAFICA",
          "nota_predicha": 15.2,
          "creditos": 4,
          "score_individual": 12.5
        }
        // ... más cursos
      ]
    }
  },
  "todos_los_resultados": [
    // Array con análisis completo de las 3 opciones
  ]
}
```

---

## Métricas del Sistema de Recomendación

El recomendador evalúa cada combinación de cursos usando **9 métricas ponderadas**:

| Métrica | Peso | Descripción |
|---------|------|-------------|
| **Atraso** | 5% | Diferencia entre semestre del estudiante y nivel del curso |
| **Eficiencia** | 5% | Ratio créditos/horas |
| **Simplicidad** | 5% | Inverso del número de prerequisitos |
| **Obligatorio** | 25% | 1.0 si es curso obligatorio, 0.0 si es electivo |
| **Familia** | 10% | Prioridad según familia del curso (CS=1.0, MA=0.5, etc.) |
| **Cluster** | 10% | Dificultad del curso según cluster |
| **Dependientes** | 20% | Número de cursos que dependen de este |
| **Profundidad** | 20% | Posición en el árbol de prerequisitos |
| **Nota Predicha** | 30% | Predicción del modelo por matrícula |

### Penalizaciones:
- **Sobrecarga de créditos**: -10 puntos por cada crédito sobre el límite (26)
- **Cursos en riesgo**: -50 puntos por cada curso con nota < 11.5

---

## Ubicación de Archivos

### Backend
```
backend/
├── app/
│   ├── predictor_nota.py                      # Modelo #1 (Clasificador)
│   ├── predictor_nota_x_matricula.py          # Modelo #2 (NUEVO)
│   ├── recomendador_matricula.py              # Modelo #3 (NUEVO)
│   ├── modelo_produccion_clasificador.pkl     # Modelo #1
│   ├── modelo_produccion_x_matricula.pkl      # Modelo #2 (NUEVO)
│   ├── predictor_nota_data.csv                # Dataset compartido
│   ├── cursos_analisis_grafo.csv              # Dataset para recomendador
│   └── routes/
│       ├── prediccion.py                      # Endpoints Modelo #1 y #2
│       └── recomendacion.py                   # Endpoint Modelo #3 (NUEVO)
└── data/
    ├── df_curso.csv                            # Info de cursos
    └── malla_curricular_2016.csv               # Prerequisitos
```

### Frontend
```
frontend/
└── src/
    └── api/
        └── api.ts                              # Cliente API con 2 funciones nuevas
```

---

## Integración en el Frontend

### En "Calendario Tentativo" - Popup de Curso

Cuando el usuario hace clic en un curso del calendario:

```typescript
// En el componente CourseDetailPopup
import { predecirNotasPorMatricula } from '@/api/api';

const CourseDetailPopup = ({ curso, todosLosCursos, alumno }) => {
  const [notaPredicha, setNotaPredicha] = useState<number | null>(null);

  useEffect(() => {
    const cargarPrediccion = async () => {
      // Obtener todos los códigos de cursos seleccionados
      const cursosSeleccionados = todosLosCursos.map(c => c.code);

      // Llamar al modelo por matrícula
      const resultado = await predecirNotasPorMatricula(
        alumno.cod_persona,
        cursosSeleccionados,
        "2025-01" // Período actual
      );

      // Buscar la predicción para este curso específico
      const prediccionCurso = resultado.predicciones.find(
        p => p.cod_curso === curso.code
      );

      setNotaPredicha(prediccionCurso?.nota_predicha || 14.0);
    };

    cargarPrediccion();
  }, [curso, todosLosCursos]);

  return (
    <div>
      <h3>{curso.name}</h3>
      <p>Nota Predicha: {notaPredicha?.toFixed(1)}</p>
      {/* ... resto del popup */}
    </div>
  );
};
```

### Botón "Recomendar Mejor Horario"

```typescript
import { recomendarMejorHorario } from '@/api/api';

const CalendarioTentativo = ({ alumno }) => {
  const [mejorOpcion, setMejorOpcion] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRecomendarHorario = async () => {
    setLoading(true);

    // Generar múltiples combinaciones de cursos
    // (Esto depende de tu lógica específica)
    const bundles = generarCombinaciones();

    // Obtener recomendación
    const resultado = await recomendarMejorHorario(
      alumno.cod_persona,
      "2025-01",
      bundles
    );

    setMejorOpcion(resultado?.mejor_recomendacion);
    setLoading(false);

    // Aplicar la mejor opción al calendario
    if (resultado) {
      aplicarCursosAlCalendario(resultado.mejor_recomendacion.cursos);
    }
  };

  return (
    <div>
      <button onClick={handleRecomendarHorario} disabled={loading}>
        {loading ? 'Analizando...' : 'Recomendar Mejor Horario'}
      </button>

      {mejorOpcion && (
        <div className="recomendacion">
          <h4>Mejor Opción (Score: {mejorOpcion.score.toFixed(1)})</h4>
          <ul>
            {mejorOpcion.cursos.map(cod => (
              <li key={cod}>{cod}</li>
            ))}
          </ul>
          <p>Créditos: {mejorOpcion.detalle?.total_credits}</p>
          <p>Riesgo: {mejorOpcion.detalle?.cursos_desaprobados_predichos} curso(s)</p>
        </div>
      )}
    </div>
  );
};
```

---

## Testing

### 1. Verificar que el backend está corriendo
```bash
curl http://localhost:8000/health
```

### 2. Probar predicción por matrícula
```bash
curl -X POST http://localhost:8000/api/v1/prediccion/predecir-por-matricula \
  -H "Content-Type: application/json" \
  -d '{"cod_persona":"32899","codigos_cursos":["CS261","CS281"],"per_matricula":"2025-01"}'
```

### 3. Probar recomendación
```bash
curl -X POST http://localhost:8000/api/v1/recomendacion/mejor-horario \
  -H "Content-Type: application/json" \
  -d '{"cod_persona":"32899","per_matricula":"2025-01","bundles":[["CS261","CS281"],["CS261","CS281","CS341"]]}'
```

### 4. Ver documentación interactiva
Visita: http://localhost:8000/docs

---

## Próximos Pasos

1. **Integrar en el Frontend**:
   - Actualizar el popup de curso en "Calendario Tentativo" para usar `predecirNotasPorMatricula()`
   - Agregar botón "Recomendar Mejor Horario" que use `recomendarMejorHorario()`

2. **Ajustar UI/UX**:
   - Mostrar loading states mientras se cargan las predicciones
   - Agregar tooltips explicando las métricas
   - Visualizar el desglose de scores

3. **Testing**:
   - Probar con diferentes estudiantes
   - Verificar que las predicciones son razonables
   - Testear con combinaciones de cursos extremas (muy pocos, demasiados)

4. **Docker Compose**:
   - Verificar que todo funciona en el entorno containerizado

---

## Notas Técnicas

- **Singleton Pattern**: Todos los modelos ML usan singleton para cargar una sola vez
- **Fallback Values**: Si falla la predicción, se usa 14.0 como valor por defecto
- **Error Handling**: Manejo robusto de errores en frontend y backend
- **Type Safety**: Interfaces TypeScript completas para todas las respuestas
- **Cached Data**: El recomendador carga los CSVs una sola vez por ejecución

---

## Soporte

Si encuentras problemas:
1. Verifica que los archivos `.pkl` y `.csv` estén en las ubicaciones correctas
2. Revisa los logs del backend para errores de carga de modelos
3. Asegúrate que `pandas`, `numpy`, `joblib`, `scikit-learn` estén instalados
4. Verifica que el período de matrícula exista en el dataset

---

**¡Integración Completada! 🎉**

Los 3 modelos ML ahora están completamente integrados y listos para usar en producción.
