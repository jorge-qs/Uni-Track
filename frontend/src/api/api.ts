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
