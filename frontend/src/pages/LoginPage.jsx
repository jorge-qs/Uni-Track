import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [studentCode, setStudentCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!studentCode.trim() || !password) {
      setError('Ingresa tu código de estudiante y contraseña.');
      return;
    }

    try {
      setLoading(true);
      await login({
        cod_persona: studentCode.trim(),
        password,
      });
      navigate('/home');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'No se pudo iniciar sesión. Intenta nuevamente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-utec-bg">
      <div className="grid w-full grid-cols-1 lg:grid-cols-2">
        <div className="hidden items-center justify-center bg-utec-bg lg:flex">
          <div className="mx-auto max-w-md space-y-6 rounded-2xl bg-white/70 p-10 shadow-sm backdrop-blur">
            <img
              src="/logo-utec.png"
              alt="UTEC logo"
              className="h-20 w-auto"
            />
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-utec-text">
                Uni-track
              </h1>
              <p className="text-base text-utec-muted">
                Gestiona tu experiencia académica desde un solo lugar.
                Consulta tu plan de estudios, accede a recursos y usa
                IA para optimizar tu matrícula.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center px-6 py-16 sm:px-10 lg:px-16">
          <div className="w-full max-w-md space-y-8">
            <div className="flex justify-center lg:hidden">
              <img
                src="/logo-utec.png"  
                alt="UTEC logo"
                className="h-14 w-auto"
              />
            </div>
            <div className="rounded-2xl border border-utec-border bg-white/90 p-8 shadow-sm">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-utec-text">
                    Sign in
                  </h2>
                  <p className="mt-1 text-sm text-utec-muted">
                    Ingresa tus credenciales institucionales para continuar.
                  </p>
                </div>
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label
                      htmlFor="studentCode"
                      className="block text-sm font-medium text-utec-secondary"
                    >
                      Código de estudiante
                    </label>
                    <input
                      id="studentCode"
                      name="studentCode"
                      type="text"
                      required
                      value={studentCode}
                      onChange={(event) => setStudentCode(event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-utec-text shadow-sm transition focus:border-utec-red focus:outline-none focus:ring-2 focus:ring-utec-red/40"
                      placeholder="Ej: 20230001"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-utec-secondary"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-utec-text shadow-sm transition focus:border-utec-red focus:outline-none focus:ring-2 focus:ring-utec-red/40"
                      placeholder="********"
                    />
                  </div>
                  {error ? (
                    <p className="text-sm text-red-600">{error}</p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center rounded-lg bg-utec-red px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-utec-red/40 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? 'Ingresando...' : 'Sign in'}
                  </button>
                </form>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-utec-border px-4 py-3 text-sm font-medium text-utec-text transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-utec-blue/30"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign in with Google
                </button>
                <div className="text-center text-sm text-utec-muted">
                  ¿Olvidaste tu contraseña?{' '}
                  <button
                    type="button"
                    className="font-semibold text-utec-blue hover:underline"
                  >
                    Recuperar acceso
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
