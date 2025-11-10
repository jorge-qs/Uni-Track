const resourceGroups = [
  {
    course: 'Programación II',
    resources: [
      { title: 'Guía de laboratorios', size: '2.4 MB', link: '#' },
      { title: 'Patrones de diseño - resumen', size: '1.1 MB', link: '#' },
      { title: 'Checklist buenas prácticas', size: '650 KB', link: '#' },
    ],
  },
  {
    course: 'Probabilidad y Estadística',
    resources: [
      { title: 'Formulario de distribuciones', size: '950 KB', link: '#' },
      { title: 'Casos de estudio', size: '3.2 MB', link: '#' },
    ],
  },
  {
    course: 'Arquitectura de Software',
    resources: [
      { title: 'Arquitecturas Modernas', size: '4.6 MB', link: '#' },
      { title: 'Documentación de APIs', size: '1.8 MB', link: '#' },
      { title: 'Guía de despliegue', size: '2.1 MB', link: '#' },
    ],
  },
];

export default function ResourcesPage() {
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
            key={group.course}
            className="space-y-4 rounded-2xl border border-utec-border bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-utec-text">
                  {group.course}
                </h2>
                <p className="text-sm text-utec-muted">
                  {group.resources.length} archivos disponibles
                </p>
              </div>
              <button
                type="button"
                className="rounded-full bg-utec-blue/10 px-4 py-2 text-xs font-semibold text-utec-blue"
              >
                Añadir recurso
              </button>
            </div>
            <div className="space-y-3">
              {group.resources.map((resource) => (
                <a
                  key={resource.title}
                  href={resource.link}
                  className="flex items-center justify-between rounded-xl border border-utec-border bg-gray-50 p-4 text-sm text-utec-text transition hover:border-utec-blue hover:bg-white"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl text-utec-blue">
                      picture_as_pdf
                    </span>
                    <div>
                      <p className="font-semibold">{resource.title}</p>
                      <p className="text-xs text-utec-muted">{resource.size}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-xl text-utec-muted">
                    download
                  </span>
                </a>
              ))}
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
          Centraliza tus recursos más utilizados y comparte material con tu
          cohorte para fomentar el aprendizaje colaborativo.
        </p>
      </div>
    </div>
  );
}
