import { useState, useEffect } from 'react';
import { getRecursosMatriculados } from '../api/api';

export default function ResourcesPage() {
  const [resourceGroups, setResourceGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadResources = async () => {
      try {
        // Obtener cursos matriculados desde localStorage
        const enrollmentData = localStorage.getItem('unitrack.enrollment');

        if (!enrollmentData) {
          // Si no hay matrícula, mostrar mensaje
          setResourceGroups([]);
          setLoading(false);
          return;
        }

        const enrollment = JSON.parse(enrollmentData);
        const cursos = enrollment.courses.map(c => ({
          code: c.code,
          name: c.name
        }));

        // Obtener recursos desde la API
        const response = await getRecursosMatriculados(cursos);

        if (response && response.success) {
          // Transformar la respuesta a formato esperado
          const groups = enrollment.courses.map(course => ({
            course: `${course.code} - ${course.name}`,
            courseCode: course.code,
            description: response.cursos[course.code]?.descripcion || 'Sin descripción disponible',
            resources: response.cursos[course.code]?.recursos || [],
          }));

          setResourceGroups(groups);
        } else {
          setResourceGroups([]);
        }
      } catch (err) {
        console.error('Error cargando recursos:', err);
        setError('Error al cargar los recursos académicos');
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, []);
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-utec-blue border-r-transparent"></div>
          <p className="mt-4 text-sm text-utec-muted">Cargando recursos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-red-500">error</span>
          <p className="mt-4 text-lg font-semibold text-utec-text">{error}</p>
        </div>
      </div>
    );
  }

  if (resourceGroups.length === 0) {
    return (
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-utec-text">
            Recursos Académicos
          </h1>
          <p className="text-sm text-utec-muted">
            Accede a material de apoyo organizado por curso. Guarda tus favoritos y
            mantén a mano los documentos clave de cada asignatura.
          </p>
        </header>

        <div className="rounded-2xl border border-utec-border bg-yellow-50/60 p-8 text-center">
          <span className="material-symbols-outlined text-5xl text-yellow-600">school</span>
          <p className="mt-4 text-lg font-semibold text-utec-text">
            No tienes cursos matriculados
          </p>
          <p className="mt-2 text-sm text-utec-muted">
            Dirígete a la sección de matrícula para seleccionar tus cursos y ver los recursos recomendados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-utec-text">
          Recursos Académicos
        </h1>
        <p className="text-sm text-utec-muted">
          Accede a material de apoyo organizado por curso. Guarda tus favoritos y
          mantén a mano los documentos clave de cada asignatura.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {resourceGroups.map((group) => (
          <div
            key={group.courseCode}
            className="space-y-4 rounded-2xl border border-utec-border bg-white p-6 shadow-sm"
          >
            <div>
              <h2 className="text-lg font-semibold text-utec-text">
                {group.course}
              </h2>
              <p className="text-sm text-utec-muted mt-2">
                {group.description}
              </p>
              <p className="text-sm text-utec-muted mt-2">
                {group.resources.length} recursos recomendados
              </p>
            </div>
            <div className="space-y-3">
              {group.resources.length > 0 ? (
                group.resources.map((resource, index) => (
                  <a
                    key={index}
                    href="#"
                    className="group flex items-center justify-between rounded-xl border border-utec-border bg-gradient-to-r from-gray-50 to-white p-4 text-sm text-utec-text transition hover:border-utec-blue hover:shadow-md"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                        <span className="material-symbols-outlined text-3xl text-red-600">
                          picture_as_pdf
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-utec-text group-hover:text-utec-blue transition">
                          {resource}
                        </p>
                        <p className="text-xs text-utec-muted mt-1">
                          Documento PDF • Material recomendado
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-xl text-utec-blue group-hover:scale-110 transition">
                        download
                      </span>
                    </div>
                  </a>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-utec-border bg-gray-50 p-4 text-center text-sm text-utec-muted">
                  No hay recursos disponibles para este curso
                </div>
              )}
            </div>
          </div>
        ))}
      </section>

      <div className="rounded-2xl border border-utec-border bg-blue-50/60 p-6 text-sm text-utec-secondary">
        <p className="flex items-center gap-2 font-semibold text-utec-blue">
          <span className="material-symbols-outlined text-xl">
            info
          </span>
          Sugerencia
        </p>
        <p className="mt-2">
          Estos recursos han sido cuidadosamente seleccionados para complementar tu aprendizaje en cada curso.
          Consulta regularmente esta sección para aprovechar al máximo los materiales recomendados.
        </p>
      </div>
    </div>
  );
}
