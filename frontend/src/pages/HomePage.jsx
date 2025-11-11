import { Link } from 'react-router-dom';
import { getStoredLogin } from '../api/api';

const recentActivity = [
  {
    icon: 'quiz',
    accent: 'text-red-500 bg-red-500/10',
    title: 'Exam: Calculus II',
    description: 'El examen se realizará el 25 de octubre a las 8:00 a.m.',
    date: 'Oct 15',
  },
  {
    icon: 'flag',
    accent: 'text-blue-600 bg-blue-600/10',
    title: 'Proyecto Alpha - Entrega final',
    description: 'Sube tu entrega en la plataforma antes de las 11:59 p.m.',
    date: 'Oct 20',
  },
  {
    icon: 'build',
    accent: 'text-amber-500 bg-amber-500/10',
    title: 'Mantenimiento programado',
    description: 'La plataforma estará inactiva el 21 de octubre de 1-3 a.m.',
    date: 'Oct 18',
  },
];

const performanceInsights = [
  {
    icon: 'lightbulb',
    text: 'Refuerza “Advanced Physics”: tiene el mayor peso en el GPA este ciclo.',
  },
  {
    icon: 'calendar_month',
    text: 'Existen 2 entregas esta semana. Reserva tiempo para avanzar.',
  },
  {
    icon: 'groups',
    text: 'Tu equipo reportó progreso del 70% en el proyecto interdisciplinario.',
  },
];

const quickAccess = [
          { title: 'Curriculum', icon: 'auto_stories', path: '/curriculum' },
          { title: 'Mis Notas', icon: 'monitoring', path: '/grades' },
          { title: 'Procedures', icon: 'description', path: '/procedures' },
          { title: 'Recursos Académicos', icon: 'library_books', path: '/resources' },
];

export default function HomePage() {
  const storedLogin = getStoredLogin();
  const alumnoInfo = storedLogin?.alumno_info ?? {};
  const academicInfo = storedLogin?.academic_info ?? {};
  const fullName =
    [alumnoInfo.nombre, alumnoInfo.apellido].filter(Boolean).join(' ') ||
    'estudiante';

  const promedio =
    typeof academicInfo.promedio_general === 'number'
      ? academicInfo.promedio_general.toFixed(2)
      : '--';
  const cursosAprobados =
    typeof academicInfo.cursos_aprobados === 'number'
      ? academicInfo.cursos_aprobados
      : '--';
  const creditosAprobados =
    typeof academicInfo.creditos_aprobados === 'number'
      ? academicInfo.creditos_aprobados
      : '--';
  const creditosRestantes =
    typeof academicInfo.creditos_aprobados === 'number'
      ? Math.max(0, 200 - academicInfo.creditos_aprobados)
      : '--';

  const metricCards = [
    { label: 'Promedio ponderado', value: promedio },
    { label: 'Cursos aprobados', value: cursosAprobados },
    { label: 'Créditos aprobados', value: creditosAprobados },
    { label: 'Créditos faltantes', value: creditosRestantes },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-utec-text">
          {`Welcome back, ${fullName}`}
        </h1>
        <p className="text-base text-utec-muted">
          Resumen académico del ciclo en curso. Mantente al día con tus
          actividades y métricas clave.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-utec-border bg-white p-5 shadow-[0_4px_15px_rgba(0,0,0,0.08)]"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-utec-muted">
              {metric.label}
            </p>
            <p className="mt-3 text-3xl font-bold text-utec-text">
              {metric.value}
            </p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-utec-border bg-white p-6 shadow-[0_8px_25px_rgba(0,0,0,0.12)] lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-utec-text">
              Recent activity &amp; announcements
            </h2>
            <button
              type="button"
              className="text-sm font-medium text-utec-blue hover:underline"
            >
              Ver historial
            </button>
          </div>
          <div className="mt-6 space-y-5">
            {recentActivity.map((activity) => (
              <div className="flex items-center gap-4" key={activity.title}>
                <div
                  className={`flex size-12 items-center justify-center rounded-full ${activity.accent}`}
                >
                  <span className="material-symbols-outlined text-xl">
                    {activity.icon}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-utec-text">
                    {activity.title}
                  </p>
                  <p className="text-sm text-utec-muted">
                    {activity.description}
                  </p>
                </div>
                <span className="text-sm font-medium text-utec-muted">
                  {activity.date}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-utec-border bg-white p-6 shadow-[0_8px_25px_rgba(0,0,0,0.12)]">
          <h2 className="text-lg font-semibold text-utec-text">
            Performance insights
          </h2>
          <div className="mt-6 space-y-5">
            {performanceInsights.map((insight) => (
              <div className="flex gap-3" key={insight.text}>
                <span className="material-symbols-outlined text-xl text-utec-blue">
                  {insight.icon}
                </span>
                <p className="text-sm text-utec-muted">{insight.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-utec-text">
          Quick access
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickAccess.map((item) => (
            <Link
              key={item.title}
              to={item.path}
              className="group rounded-2xl border border-utec-border bg-white p-5 shadow-[0_4px_15px_rgba(0,0,0,0.08)] transition hover:border-utec-blue hover:shadow-[0_8px_25px_rgba(0,0,0,0.12)]"
            >
              <span className="material-symbols-outlined text-3xl text-utec-muted transition group-hover:text-utec-blue">
                {item.icon}
              </span>
              <p className="mt-4 text-lg font-semibold text-utec-text">
                {item.title}
              </p>
              <p className="mt-1 text-sm text-utec-muted">
                Ingresa rápidamente a la sección para revisar tu avance.
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
