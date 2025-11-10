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
