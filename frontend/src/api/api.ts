const API_BASE_URL =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE
    ? String(import.meta.env.VITE_API_BASE).replace(/\/$/, '')
    : 'http://localhost:8000/api/v1';

const LOGIN_RESPONSE_KEY = 'unitrack.loginResponse';

export interface LoginRequest {
  cod_persona: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  cod_persona?: string | null;
  alumno_info?: Record<string, unknown> | null;
  cursos_info?: Record<string, unknown>[] | null;
  matricula_info?: Record<string, unknown>[] | Record<string, unknown> | null;
  academic_info?: Record<string, unknown> | null;
  cursos_disponibles?: string[] | null;
  secciones_info?: Record<string, unknown>[] | null;
  resources_info?: Record<string, unknown> | null;
}

/**
 * Llama al endpoint de autenticación y persiste la respuesta en localStorage.
 * @param payload Datos de login (código de estudiante y contraseña)
 * @returns Respuesta del backend ya parseada.
 */
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Error ${response.status} en login: ${errorBody || response.statusText}`,
    );
  }

  const data: LoginResponse = await response.json();
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(LOGIN_RESPONSE_KEY, JSON.stringify(data));
  }
  return data;
}

/**
 * Recupera el último response almacenado del login.
 */
export function getStoredLogin(): LoginResponse | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  const stored = window.localStorage.getItem(LOGIN_RESPONSE_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as LoginResponse;
  } catch {
    window.localStorage.removeItem(LOGIN_RESPONSE_KEY);
    return null;
  }
}

export interface PrediccionRequest {
  cod_persona: string;
  cod_curso: string;
}

export interface PrediccionResponse {
  success: boolean;
  cod_persona: string;
  cod_curso: string;
  nota_estimada: number;
  categoria_riesgo?: string; // "Riesgo", "Normal", "Factible"
  mensaje?: string;
}

/**
 * Predice la nota estimada de un estudiante para un curso específico
 * Ahora usa el modelo clasificador de riesgo académico
 */
export async function predecirNota(
  codPersona: string,
  codCurso: string,
  perMatricula?: string,
): Promise<{ nota: number; categoria: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/prediccion/predecir`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cod_persona: codPersona,
        cod_curso: codCurso,
        per_matricula: perMatricula,
      }),
    });

    if (!response.ok) {
      console.error(`Error al predecir nota para ${codCurso}`);
      return { nota: 14.0, categoria: 'Normal' }; // Retornar valor por defecto
    }

    const data: PrediccionResponse = await response.json();
    return {
      nota: data.nota_estimada,
      categoria: data.categoria_riesgo || 'Normal'
    };
  } catch (error) {
    console.error(`Error al predecir nota para ${codCurso}:`, error);
    return { nota: 14.0, categoria: 'Normal' }; // Retornar valor por defecto en caso de error
  }
}

export interface RecursoRecomendado {
  curso: string;
  recurso_1?: string | null;
  recurso_2?: string | null;
  recurso_3?: string | null;
  recurso_4?: string | null;
  descripcion?: string | null;
}

export interface RecursosResponse {
  success: boolean;
  curso: string;
  recursos: string[];
  descripcion?: string | null;
}

export interface RecursosMatriculadosResponse {
  success: boolean;
  cursos: Record<string, {
    recursos: string[];
    descripcion?: string;
  }>;
}

/**
 * Obtiene los recursos recomendados para un curso específico
 */
export async function getRecursosCurso(nombreCurso: string): Promise<RecursosResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/recursos/curso/${encodeURIComponent(nombreCurso)}`);

    if (!response.ok) {
      console.error(`Error al obtener recursos para ${nombreCurso}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error al obtener recursos para ${nombreCurso}:`, error);
    return null;
  }
}

/**
 * Obtiene todos los recursos recomendados
 */
export async function getTodosRecursos(): Promise<RecursoRecomendado[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/recursos/todos`);

    if (!response.ok) {
      console.error('Error al obtener todos los recursos');
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtener todos los recursos:', error);
    return [];
  }
}

/**
 * Obtiene los recursos para una lista de cursos matriculados
 */
export async function getRecursosMatriculados(cursos: Array<{code: string, name: string}>): Promise<RecursosMatriculadosResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/recursos/matriculados`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cursos }),
    });

    if (!response.ok) {
      console.error('Error al obtener recursos para cursos matriculados');
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtener recursos para cursos matriculados:', error);
    return null;
  }
}

// ============================================================================
// NUEVOS ENDPOINTS - MODELOS DE PREDICCIÓN Y RECOMENDACIÓN
// ============================================================================

export interface CursoPrediccion {
  cod_curso: string;
  nota_predicha: number;
}

export interface PrediccionMatriculaRequest {
  cod_persona: string;
  codigos_cursos: string[];
  per_matricula: string;
}

export interface PrediccionMatriculaResponse {
  success: boolean;
  cod_persona: string;
  per_matricula: string;
  predicciones: CursoPrediccion[];
  mensaje?: string;
}

/**
 * Predice las notas para múltiples cursos considerando la carga total de la matrícula.
 * Este endpoint utiliza el modelo de predicción por matrícula que toma en cuenta
 * todos los cursos de la matrícula para hacer predicciones más precisas.
 *
 * @param codPersona - Código del estudiante
 * @param codigosCursos - Lista de códigos de cursos
 * @param perMatricula - Período de matrícula (ej: "2025-01")
 * @returns Predicciones de notas para cada curso considerando la carga total
 */
export async function predecirNotasPorMatricula(
  codPersona: string,
  codigosCursos: string[],
  perMatricula: string
): Promise<PrediccionMatriculaResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/prediccion/predecir-por-matricula`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cod_persona: codPersona,
        codigos_cursos: codigosCursos,
        per_matricula: perMatricula,
      }),
    });

    if (!response.ok) {
      console.error(`Error al predecir notas por matrícula: ${response.status}`);
      // Retornar respuesta con valores por defecto
      return {
        success: false,
        cod_persona: codPersona,
        per_matricula: perMatricula,
        predicciones: codigosCursos.map(cod => ({
          cod_curso: cod,
          nota_predicha: 14.0
        })),
        mensaje: 'Error al obtener predicciones, usando valores por defecto'
      };
    }

    const data: PrediccionMatriculaResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error al predecir notas por matrícula:', error);
    // Retornar respuesta con valores por defecto en caso de error
    return {
      success: false,
      cod_persona: codPersona,
      per_matricula: perMatricula,
      predicciones: codigosCursos.map(cod => ({
        cod_curso: cod,
        nota_predicha: 14.0
      })),
      mensaje: 'Error de conexión, usando valores por defecto'
    };
  }
}

export interface MetricasBase {
  atraso: number;
  eficiencia: number;
  simplicidad: number;
  obligatorio: number;
  familia: number;
  cluster: number;
  dependientes: number;
  profundidad: number;
}

export interface DetallesCurso {
  codigo: string;
  nombre: string;
  score_individual: number;
  nota_predicha: number;
  creditos: number;
  metricas_base: MetricasBase;
}

export interface ResultadoBundle {
  bundle_id: number;
  bundle_score: number;
  is_valid: boolean;
  message: string;
  total_credits: number;
  total_hours: number;
  avg_quality_per_course: number;
  cursos_desaprobados_predichos: number;
  courses_list: string[];
  course_details: DetallesCurso[];
}

export interface MejorRecomendacion {
  index: number;
  score: number;
  cursos: string[];
  detalle: ResultadoBundle | null;
}

export interface RecomendacionResponse {
  success: boolean;
  meta: {
    cod_persona: number;
    per_matricula: string;
    total_evaluados: number;
    mejor_opcion_index: number;
  };
  mejor_recomendacion: MejorRecomendacion;
  todos_los_resultados: ResultadoBundle[];
  mensaje?: string;
}

/**
 * Evalúa diferentes combinaciones de cursos (bundles) y recomienda la mejor opción.
 *
 * Este endpoint utiliza múltiples métricas para evaluar cada combinación:
 * - Atraso académico
 * - Eficiencia (créditos/horas)
 * - Simplicidad (prerequisitos)
 * - Prioridad de cursos obligatorios
 * - Familia del curso
 * - Dificultad (cluster)
 * - Dependientes (cursos que dependen de este)
 * - Profundidad en el árbol de prerequisitos
 * - Predicción de nota (usando modelo por matrícula)
 *
 * @param codPersona - Código del estudiante
 * @param perMatricula - Período de matrícula (ej: "2025-01")
 * @param bundles - Lista de combinaciones de cursos a evaluar
 * @returns Recomendación con el mejor bundle y análisis detallado
 */
export async function recomendarMejorHorario(
  codPersona: string,
  perMatricula: string,
  bundles: string[][],
  max_time: number = 60
): Promise<RecomendacionResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/recomendacion/mejor-horario`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cod_persona: codPersona,
        per_matricula: perMatricula,
        bundles: bundles,
        max_time: max_time,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error al obtener recomendación de horario: ${response.status}`, errorText);
      return null;
    }

    const data: RecomendacionResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener recomendación de horario:', error);
    return null;
  }
}
