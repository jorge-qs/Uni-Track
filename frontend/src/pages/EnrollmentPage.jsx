import { useMemo, useState } from 'react';

const HOUR_HEIGHT = 60;
const START_HOUR = 7;
const END_HOUR = 22;

const hourLabels = Array.from({ length: END_HOUR - START_HOUR }, (_, idx) => START_HOUR + idx);
const gridLines = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, idx) => idx);

const daysOfWeek = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miercoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
];

const courseCatalog = [
  {
    code: 'CS350',
    name: 'Sistemas Inteligentes',
    credits: 4,
    prerequisites: ['CS220', 'MAT230'],
    slots: 8,
    estimatedGrade: 17.6,
    sessions: [
      { day: 'monday', start: '09:00', end: '11:00', location: 'Lab 204' },
      { day: 'thursday', start: '08:00', end: '10:00', location: 'Lab IA' },
    ],
  },
  {
    code: 'CS370',
    name: 'Arquitectura de Software',
    credits: 3,
    prerequisites: ['CS201'],
    slots: 5,
    estimatedGrade: 16.9,
    sessions: [
      { day: 'tuesday', start: '11:00', end: '13:00', location: 'Aula 301' },
      { day: 'friday', start: '12:00', end: '14:00', location: 'Lab 210' },
    ],
  },
  {
    code: 'MAT320',
    name: 'Probabilidad y Estadistica',
    credits: 3,
    prerequisites: ['MAT230'],
    slots: 10,
    estimatedGrade: 17.2,
    sessions: [
      { day: 'wednesday', start: '08:00', end: '10:00', location: 'Aula 105' },
      { day: 'friday', start: '10:00', end: '12:00', location: 'Aula 105' },
    ],
  },
  {
    code: 'CS380',
    name: 'Visualizacion de Datos',
    credits: 3,
    prerequisites: ['CS220'],
    slots: 6,
    estimatedGrade: 18.3,
    sessions: [
      { day: 'tuesday', start: '14:00', end: '16:00', location: 'Aula 302' },
      { day: 'thursday', start: '14:00', end: '16:00', location: 'Aula 302' },
    ],
  },
  {
    code: 'CS410',
    name: 'Computacion en la Nube',
    credits: 3,
    prerequisites: ['CS201', 'CS220'],
    slots: 7,
    estimatedGrade: 16.5,
    sessions: [
      { day: 'monday', start: '16:00', end: '18:00', location: 'Lab Cloud' },
      { day: 'wednesday', start: '16:00', end: '18:00', location: 'Lab Cloud' },
    ],
  },
  {
    code: 'ENG210',
    name: 'Academic Writing II',
    credits: 2,
    prerequisites: ['ENG110'],
    slots: 12,
    estimatedGrade: 18.0,
    sessions: [
      { day: 'tuesday', start: '09:00', end: '10:30', location: 'Aula Ling' },
      { day: 'thursday', start: '10:00', end: '11:30', location: 'Aula Ling' },
    ],
  },
  {
    code: 'HIS200',
    name: 'Tecnologia y Sociedad',
    credits: 2,
    prerequisites: ['COM101'],
    slots: 20,
    estimatedGrade: 17.1,
    sessions: [
      { day: 'monday', start: '11:00', end: '12:00', location: 'Aula Humanidades' },
      { day: 'wednesday', start: '11:00', end: '12:00', location: 'Aula Humanidades' },
    ],
  },
  {
    code: 'CS430',
    name: 'Machine Learning Ops',
    credits: 4,
    prerequisites: ['CS350'],
    slots: 5,
    estimatedGrade: 15.8,
    sessions: [
      { day: 'tuesday', start: '18:00', end: '20:00', location: 'Lab IA' },
      { day: 'thursday', start: '18:00', end: '20:00', location: 'Lab IA' },
    ],
  },
  {
    code: 'MAT340',
    name: 'Estadistica Avanzada',
    credits: 3,
    prerequisites: ['MAT320'],
    slots: 6,
    estimatedGrade: 17.7,
    sessions: [
      { day: 'wednesday', start: '12:00', end: '14:00', location: 'Aula 205' },
      { day: 'friday', start: '08:00', end: '10:00', location: 'Aula 205' },
    ],
  },
  {
    code: 'CS450',
    name: 'Proyecto Integrador',
    credits: 5,
    prerequisites: ['CS370', 'CS380'],
    slots: 4,
    estimatedGrade: 18.4,
    sessions: [
      { day: 'wednesday', start: '18:00', end: '20:00', location: 'Sala Proyectos' },
      { day: 'friday', start: '15:00', end: '18:00', location: 'Sala Proyectos' },
    ],
  },
];

const courseColors = {
  CS350: '#2563EB',
  CS370: '#D81E05',
  MAT320: '#0EA5E9',
  CS380: '#7C3AED',
  CS410: '#EA580C',
  ENG210: '#1D4ED8',
  HIS200: '#DB2777',
  CS430: '#14B8A6',
  MAT340: '#10B981',
  CS450: '#F59E0B',
};

const schedulePresets = [
  {
    id: 'balanced',
    title: 'Horario Balanceado',
    description: 'Combina IA, estadistica y comunicacion.',
    courses: ['CS350', 'MAT320', 'ENG210'],
  },
  {
    id: 'intensivo',
    title: 'Trayecto Tecnico Intensivo',
    description: 'Enfoque en software y arquitectura.',
    courses: ['CS370', 'CS380', 'CS410'],
  },
  {
    id: 'innovacion',
    title: 'Innovacion y proyectos',
    description: 'Prioriza ML, estadistica avanzada y proyecto integrador.',
    courses: ['CS430', 'MAT340', 'CS450'],
  },
];

const parseTimeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const formatHourLabel = (hour) => {
  const suffix = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${suffix}`;
};

const formatEventRange = (start, end) => {
  const toReadable = (time) => {
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'pm' : 'am';
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`;
  };
  return `${toReadable(start)} - ${toReadable(end)}`;
};

const computeEventPosition = (start, end) => {
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);
  const startOffset = Math.max(startMinutes - START_HOUR * 60, 0);
  const eventDuration = Math.max(endMinutes - startMinutes, 30);

  const top = (startOffset / 60) * HOUR_HEIGHT;
  const height = Math.max((eventDuration / 60) * HOUR_HEIGHT - 6, 44);

  return { top, height };
};

const formatGrade = (grade) => {
  if (grade == null) return '-';
  return Number.isInteger(grade) ? grade : Number(grade).toFixed(1);
};

export default function EnrollmentPage() {
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(null);

  const selectedCodes = useMemo(
    () => new Set(selectedCourses.map((course) => course.code)),
    [selectedCourses],
  );

  const totalCredits = useMemo(
    () => selectedCourses.reduce((acc, course) => acc + course.credits, 0),
    [selectedCourses],
  );

  const calendarEvents = useMemo(
    () =>
      selectedCourses.flatMap((course) =>
        course.sessions.map((session) => ({
          ...session,
          code: course.code,
          name: course.name,
          color: courseColors[course.code] ?? '#2563EB',
          grade: course.estimatedGrade,
        })),
      ),
    [selectedCourses],
  );

  const handleToggleCourse = (course) => {
    setSelectedPreset(null);
    setSelectedCourses((prev) => {
      const exists = prev.some((item) => item.code === course.code);
      if (exists) {
        return prev.filter((item) => item.code !== course.code);
      }
      return [...prev, course];
    });
  };

  const handleApplyPreset = (presetId) => {
    const preset = schedulePresets.find((item) => item.id === presetId);
    if (!preset) return;
    const courses = courseCatalog.filter((course) =>
      preset.courses.includes(course.code),
    );
    setSelectedPreset(presetId);
    setSelectedCourses(courses);
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-utec-text">Matricula IA</h1>
        <p className="text-sm text-utec-muted">
          Selecciona los cursos disponibles segun tus prerequisitos aprobados y organiza
          tus horarios de manera eficiente.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-utec-border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-utec-text">Cursos disponibles</h2>
              <p className="text-sm text-utec-muted">
                {selectedCourses.length} en plan - {totalCredits} creditos seleccionados
              </p>
            </div>
            <span className="text-sm text-utec-muted">
              {courseCatalog.length} opciones
            </span>
          </div>
          <div className="space-y-4">
            {courseCatalog.map((course) => {
              const isSelected = selectedCodes.has(course.code);
              return (
                <div
                  key={course.code}
                  className={`space-y-3 rounded-xl border p-4 shadow-sm transition ${
                    isSelected ? 'border-utec-blue shadow-md' : 'border-utec-border'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-utec-muted">
                        {course.code}
                      </p>
                      <p className="text-base font-semibold text-utec-text">
                        {course.name}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="rounded-full bg-utec-blue/10 px-3 py-1 text-xs font-semibold text-utec-blue">
                        {course.credits} creditos
                      </span>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Nota estimada: {formatGrade(course.estimatedGrade)}/20
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-utec-muted">
                    <span className="material-symbols-outlined text-base text-utec-blue">
                      task_alt
                    </span>
                    Prerequisitos aprobados:
                    {course.prerequisites.map((code) => (
                      <span
                        key={code}
                        className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-utec-muted"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                  <div className="space-y-2 rounded-lg bg-gray-50 p-3 text-sm text-utec-muted">
                    {course.sessions.map((session, index) => (
                      <div key={`${course.code}-${session.day}-${index}`} className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-utec-blue">
                          schedule
                        </span>
                        <span className="font-medium capitalize">
                          {session.day}
                        </span>
                        <span>- {formatEventRange(session.start, session.end)}</span>
                        <span>- {session.location}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm text-utec-muted">
                    <p>Cupos disponibles: {course.slots}</p>
                    <button
                      type="button"
                      onClick={() => handleToggleCourse(course)}
                      className={`text-sm font-semibold transition ${
                        isSelected
                          ? 'text-utec-red hover:underline'
                          : 'text-utec-blue hover:underline'
                      }`}
                    >
                      {isSelected ? 'Quitar del plan' : 'Anadir al plan'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-utec-border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-utec-text">Calendario tentativo</h2>
            <span className="text-sm text-utec-muted">Formato semanal - 7am a 10pm</span>
          </div>
          <div className="rounded-xl border border-utec-border bg-gray-50 p-4">
            <p className="text-sm font-semibold text-utec-text">
              Selecciona un horario tentativo
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {schedulePresets.map((preset) => {
                const isActive = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.id)}
                    className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                      isActive
                        ? 'border-utec-blue bg-utec-blue/10 text-utec-blue'
                        : 'border-utec-border bg-white text-utec-text hover:border-utec-blue/60 hover:bg-gray-50'
                    }`}
                  >
                    <p className="font-semibold">{preset.title}</p>
                    <p className="text-xs text-utec-muted">{preset.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-sm text-utec-muted">
            Visualiza los cursos seleccionados en una cuadrilla de 7 dias. Usa esta vista
            para detectar choques y balancear tu carga academica.
          </p>

          {calendarEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-utec-border bg-gray-50 p-6 text-center text-sm text-utec-muted">
              Aun no hay cursos en el plan. Agrega cursos desde la columna izquierda para
              llenar el calendario.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex min-w-[900px] rounded-xl border border-utec-border">
                <div className="w-20 border-r border-utec-border bg-gray-50">
                  <div className="h-12 border-b border-utec-border" />
                  {hourLabels.map((hour) => (
                    <div
                      key={`label-${hour}`}
                      className="flex h-[60px] items-start justify-end pr-2 text-[11px] font-semibold uppercase text-utec-muted"
                    >
                      {formatHourLabel(hour)}
                    </div>
                  ))}
                </div>
                {daysOfWeek.map((day) => {
                  const dayEvents = calendarEvents.filter(
                    (event) => event.day === day.key,
                  );
                  return (
                    <div key={day.key} className="flex-1 border-l border-utec-border">
                      <div className="flex h-12 items-center justify-center border-b border-utec-border bg-gray-50 text-xs font-semibold uppercase text-utec-muted">
                        {day.label}
                      </div>
                      <div
                        className="relative"
                        style={{ height: `${(END_HOUR - START_HOUR) * HOUR_HEIGHT}px` }}
                      >
                        <div className="absolute inset-0">
                          {gridLines.map((line) => (
                            <div
                              key={`${day.key}-line-${line}`}
                              className="absolute left-0 right-0 border-t border-dashed border-utec-border/70"
                              style={{ top: `${line * HOUR_HEIGHT}px` }}
                            />
                          ))}
                        </div>
                        {dayEvents.map((event) => {
                          const { top, height } = computeEventPosition(
                            event.start,
                            event.end,
                          );
                          return (
                            <div
                              key={`${event.code}-${event.start}-${event.end}`}
                              className="absolute left-[8%] right-[8%] rounded-xl p-3 text-xs text-white shadow-lg"
                              style={{ top, height, backgroundColor: event.color }}
                            >
                              <p className="text-sm font-semibold">
                                {event.name}
                              </p>
                              <p className="font-mono text-[11px]">
                                {formatEventRange(event.start, event.end)}
                              </p>
                              <p className="text-[11px] opacity-90">{event.location}</p>
                              <p className="mt-1 text-[11px] font-semibold text-white/90">
                                Nota estimada: {formatGrade(event.grade)}/20
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="rounded-xl bg-blue-50 p-4 text-sm text-utec-secondary">
            <p className="font-semibold text-utec-blue">Consejo:</p>
            <p>
              Deja al menos una tarde libre para proyectos interdisciplinarios y evita
              sobrecargar los dias consecutivos con laboratorios extensos.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
