import { useMemo, useState, useEffect } from 'react';
import { getStoredLogin, predecirNota } from '../api/api';

const HOUR_HEIGHT = 60;
const START_HOUR = 7;
const END_HOUR = 22;

const hourLabels = Array.from({ length: END_HOUR - START_HOUR }, (_, idx) => START_HOUR + idx);
const gridLines = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, idx) => idx);

const daysOfWeek = [
  { key: 'monday', label: 'Lunes', shortLabel: 'Lun' },
  { key: 'tuesday', label: 'Martes', shortLabel: 'Mar' },
  { key: 'wednesday', label: 'Miercoles', shortLabel: 'Mie' },
  { key: 'thursday', label: 'Jueves', shortLabel: 'Jue' },
  { key: 'friday', label: 'Viernes', shortLabel: 'Vie' },
  { key: 'saturday', label: 'Sábado', shortLabel: 'Sab' },
];

const dayMap = {
  'Lun.': 'monday',
  'Mar.': 'tuesday',
  'Mie.': 'wednesday',
  'Jue.': 'thursday',
  'Vie.': 'friday',
  'Sáb.': 'saturday',
  'Sab.': 'saturday',
  'Lun': 'monday',
  'Mar': 'tuesday',
  'Mie': 'wednesday',
  'Jue': 'thursday',
  'Vie': 'friday',
  'Sab': 'saturday',
};

// Función para generar colores consistentes basados en el código del curso
const generateCourseColor = (courseCode) => {
  const colors = [
    '#2563EB', '#D81E05', '#0EA5E9', '#7C3AED', '#EA580C',
    '#1D4ED8', '#DB2777', '#14B8A6', '#10B981', '#F59E0B',
    '#6366F1', '#EC4899', '#8B5CF6', '#F97316', '#06B6D4'
  ];

  let hash = 0;
  for (let i = 0; i < courseCode.length; i++) {
    hash = courseCode.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

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

// Parsear horario del formato "Lun. 11:00 - 13:00" a {day, start, end}
const parseHorario = (horarioStr) => {
  try {
    // Formato: "Lun. 11:00 - 13:00"
    const parts = horarioStr.trim().split(/\s+/);
    const dayPrefix = parts[0]; // "Lun."
    const timeRange = horarioStr.substring(horarioStr.indexOf(dayPrefix) + dayPrefix.length).trim();
    const [start, end] = timeRange.split('-').map(t => t.trim());

    const day = dayMap[dayPrefix];
    if (!day) {
      console.warn('Día no reconocido:', dayPrefix);
      return null;
    }

    return { day, start, end };
  } catch (error) {
    console.error('Error parseando horario:', horarioStr, error);
    return null;
  }
};

export default function EnrollmentPage() {
  const [courseCatalog, setCourseCatalog] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedEventDetail, setSelectedEventDetail] = useState(null);
  const [conflictModal, setConflictModal] = useState(null);
  const [enrollmentConfirmModal, setEnrollmentConfirmModal] = useState(false);
  const [enrollmentSuccessModal, setEnrollmentSuccessModal] = useState(false);

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
      selectedCourses.flatMap((course) => {
        const sectionIndex = course.selectedSectionIndex || 0;
        const section = course.allSections[sectionIndex];
        if (!section) return [];

        return section.sessions.map((session) => ({
          ...session,
          code: course.code,
          name: course.name,
          color: generateCourseColor(course.code),
          grade: course.estimatedGrade,
          sectionName: section.sectionName,
        }));
      }),
    [selectedCourses],
  );

  // Cargar datos del API al montar el componente
  useEffect(() => {
    const loadCourses = async () => {
      const loginData = getStoredLogin();

      if (!loginData || !loginData.cursos_disponibles) {
        console.warn('No hay datos de login disponibles');
        setLoading(false);
        return;
      }

      const { cursos_disponibles, cursos_info, secciones_info, cod_persona } = loginData;

      // Construir catálogo de cursos disponibles
      const catalog = [];

      for (const codCurso of cursos_disponibles) {
        // Buscar info del curso
        const cursoInfo = cursos_info?.find(c => c.cod_curso === codCurso);
        if (!cursoInfo) continue;

        // Obtener TODAS las secciones
        const secciones = secciones_info?.[codCurso] || {};

        // Agrupar horarios por sección
        const allSections = [];
        for (const [seccionId, seccionData] of Object.entries(secciones)) {
          const grupos = seccionData.grupos || [];
          const sessionGroup = [];

          for (const grupo of grupos) {
            const parsed = parseHorario(grupo.horario);
            if (parsed) {
              sessionGroup.push({
                ...parsed,
                location: grupo.ubicacion || 'N/A',
                grupo: grupo.grupo,
                docente: grupo.docente,
              });
            }
          }

          if (sessionGroup.length > 0) {
            allSections.push({
              sectionId: seccionId,
              sectionName: seccionData.seccion || `Sección ${seccionId}`,
              sessions: sessionGroup,
            });
          }
        }

        // Solo agregar curso si tiene secciones
        if (allSections.length > 0) {
          catalog.push({
            code: codCurso,
            name: cursoInfo.curso,
            credits: cursoInfo.creditos || 3,
            prerequisites: cursoInfo.prerequisitos || [],
            slots: 30, // Por defecto
            estimatedGrade: null, // Se cargará después
            allSections: allSections, // Todas las secciones disponibles
            selectedSectionIndex: 0, // Por defecto la primera sección
          });
        }
      }

      setCourseCatalog(catalog);
      setLoading(false);

      // Cargar predicciones en paralelo
      if (cod_persona && catalog.length > 0) {
        setLoadingPredictions(true);
        const predictions = await Promise.all(
          catalog.map(async (course) => {
            const nota = await predecirNota(cod_persona, course.code);
            return { code: course.code, nota };
          })
        );

        // Actualizar catálogo con predicciones
        setCourseCatalog(prevCatalog =>
          prevCatalog.map(course => {
            const pred = predictions.find(p => p.code === course.code);
            return {
              ...course,
              estimatedGrade: pred ? pred.nota : 14.0,
            };
          })
        );
        setLoadingPredictions(false);
      }
    };

    loadCourses();
  }, []);

  // Función para verificar si dos sesiones se solapan
  const checkTimeOverlap = (session1, session2) => {
    // Si son días diferentes, no hay solapamiento
    if (session1.day !== session2.day) return false;

    // Verificar si los horarios se solapan
    // Formato: "HH:MM" (ej: "09:00", "11:00")
    const start1 = parseFloat(session1.start.replace(':', '.'));
    const end1 = parseFloat(session1.end.replace(':', '.'));
    const start2 = parseFloat(session2.start.replace(':', '.'));
    const end2 = parseFloat(session2.end.replace(':', '.'));

    // Hay solapamiento si uno comienza antes de que termine el otro
    return (start1 < end2 && start2 < end1);
  };

  // Función para encontrar conflictos de horario
  const findScheduleConflicts = (newCourse, currentCourses) => {
    const conflicts = [];
    const newSectionIndex = newCourse.selectedSectionIndex || 0;
    const newSection = newCourse.allSections[newSectionIndex];
    if (!newSection) return conflicts;

    for (const existingCourse of currentCourses) {
      const existingSectionIndex = existingCourse.selectedSectionIndex || 0;
      const existingSection = existingCourse.allSections[existingSectionIndex];
      if (!existingSection) continue;

      for (const newSession of newSection.sessions) {
        for (const existingSession of existingSection.sessions) {
          if (checkTimeOverlap(newSession, existingSession)) {
            const dayLabel = daysOfWeek.find(d => d.key === newSession.day)?.label || newSession.day;
            conflicts.push({
              course: existingCourse,
              day: dayLabel,
              time: `${newSession.start} - ${newSession.end}`
            });
          }
        }
      }
    }

    return conflicts;
  };

  const handleSectionChange = (courseCode, newSectionIndex) => {
    setSelectedCourses((prev) =>
      prev.map((course) =>
        course.code === courseCode
          ? { ...course, selectedSectionIndex: newSectionIndex }
          : course
      )
    );

    // También actualizar en el catálogo si existe
    setCourseCatalog((prev) =>
      prev.map((course) =>
        course.code === courseCode
          ? { ...course, selectedSectionIndex: newSectionIndex }
          : course
      )
    );
  };

  const handleToggleCourse = (course) => {
    const exists = selectedCourses.some((item) => item.code === course.code);

    // Si ya está seleccionado, solo quitarlo
    if (exists) {
      setSelectedCourses(prev => prev.filter((item) => item.code !== course.code));
      return;
    }

    // Verificar conflictos de horario antes de agregar
    const conflicts = findScheduleConflicts(course, selectedCourses);

    if (conflicts.length > 0) {
      // Mostrar modal de conflicto
      setConflictModal({
        course,
        conflicts
      });
    } else {
      // Agregar el curso directamente
      setSelectedCourses(prev => [...prev, course]);
    }
  };

  const handleConfirmConflict = () => {
    if (conflictModal) {
      setSelectedCourses(prev => [...prev, conflictModal.course]);
      setConflictModal(null);
    }
  };

  const handleEnroll = () => {
    if (selectedCourses.length === 0) {
      return;
    }
    setEnrollmentConfirmModal(true);
  };

  const confirmEnrollment = async () => {
    setEnrollmentConfirmModal(false);
    setEnrolling(true);

    try {
      // Guardar en localStorage para que los recursos académicos puedan acceder
      const enrollmentData = {
        courses: selectedCourses.map(c => ({
          code: c.code,
          name: c.name,
          credits: c.credits,
          estimatedGrade: c.estimatedGrade
        })),
        totalCredits,
        enrollmentDate: new Date().toISOString()
      };

      localStorage.setItem('unitrack.enrollment', JSON.stringify(enrollmentData));

      // Mostrar modal de éxito
      setEnrollmentSuccessModal(true);
    } catch (error) {
      console.error('Error al guardar matrícula:', error);
      alert('❌ Ocurrió un error al procesar tu matrícula. Por favor intenta de nuevo.');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-utec-blue border-r-transparent"></div>
          <p className="text-utec-muted">Cargando cursos disponibles...</p>
        </div>
      </div>
    );
  }

  if (courseCatalog.length === 0) {
    return (
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-utec-text">Matricula IA</h1>
          <p className="text-sm text-utec-muted">
            Selecciona los cursos disponibles segun tus prerequisitos aprobados y organiza
            tus horarios de manera eficiente.
          </p>
        </header>
        <div className="rounded-xl border border-utec-border bg-white p-8 text-center">
          <p className="text-utec-muted">No tienes cursos disponibles en este momento.</p>
          <p className="text-sm text-utec-muted mt-2">
            Esto puede deberse a que ya completaste todos los cursos o necesitas aprobar prerequisitos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-utec-text">Matricula IA</h1>
        <p className="text-sm text-utec-muted">
          Selecciona los cursos disponibles segun tus prerequisitos aprobados y organiza
          tus horarios de manera eficiente.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr] lg:items-start">
        <div className="flex flex-col rounded-2xl border border-utec-border bg-white shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden" style={{height: 'calc(100vh - 220px)'}}>
          <div className="flex items-center justify-between p-6 pb-4">
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
          {loadingPredictions && (
            <div className="mx-6 rounded-lg bg-blue-50 p-3 text-sm text-utec-blue">
              <span className="material-symbols-outlined text-base mr-2 inline-block">info</span>
              Calculando notas estimadas con IA...
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4" style={{maxHeight: 'calc(100vh - 280px)'}}>
            {courseCatalog.map((course) => {
              const isSelected = selectedCodes.has(course.code);
              return (
                <div
                  key={course.code}
                  className={`space-y-3 rounded-xl border p-4 transition ${
                    isSelected ? 'border-utec-blue shadow-[0_8px_30px_rgba(37,99,235,0.25)]' : 'border-utec-border shadow-[0_4px_15px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.12)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
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
                      {course.estimatedGrade !== null && (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Nota estimada: {formatGrade(course.estimatedGrade)}/20
                        </span>
                      )}
                    </div>
                  </div>
                  {course.prerequisites.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 text-sm text-utec-muted">
                      <span className="material-symbols-outlined text-base text-utec-blue">
                        task_alt
                      </span>
                      Prerequisitos aprobados:
                      {course.prerequisites.map((prereq, idx) => (
                        <span
                          key={`${course.code}-prereq-${idx}`}
                          className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-utec-muted"
                        >
                          {prereq}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Selector de sección */}
                  {course.allSections && course.allSections.length > 1 && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-semibold text-utec-text">Sección:</label>
                      <select
                        value={course.selectedSectionIndex || 0}
                        onChange={(e) => handleSectionChange(course.code, parseInt(e.target.value))}
                        className="rounded-lg border border-utec-border bg-white px-3 py-1 text-sm text-utec-text focus:border-utec-blue focus:outline-none"
                      >
                        {course.allSections.map((section, idx) => (
                          <option key={idx} value={idx}>
                            {section.sectionName} ({section.sessions.length} horario{section.sessions.length !== 1 ? 's' : ''})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Horarios de la sección seleccionada */}
                  <div className="space-y-2 rounded-lg bg-gray-50 p-3 text-sm text-utec-muted">
                    {(() => {
                      const sectionIndex = course.selectedSectionIndex || 0;
                      const section = course.allSections[sectionIndex];
                      if (!section) return null;

                      return section.sessions.map((session, index) => (
                        <div key={`${course.code}-${session.day}-${index}`} className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-utec-blue">
                            schedule
                          </span>
                          <span className="font-medium capitalize">
                            {daysOfWeek.find(d => d.key === session.day)?.label || session.day}
                          </span>
                          <span>- {formatEventRange(session.start, session.end)}</span>
                          <span>- {session.location}</span>
                        </div>
                      ));
                    })()}
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
                      {isSelected ? 'Quitar del plan' : 'Añadir al plan'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botón de Matrícula */}
          {selectedCourses.length > 0 && (
            <div className="px-6 pb-6 pt-4 border-t border-utec-border">
              <button
                type="button"
                onClick={handleEnroll}
                disabled={enrolling}
                className={`w-full rounded-lg px-6 py-3 text-center font-semibold text-white transition ${
                  enrolling
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-utec-blue hover:bg-blue-700'
                }`}
              >
                {enrolling ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></span>
                    Procesando matrícula...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-xl">check_circle</span>
                    Confirmar matrícula ({selectedCourses.length} curso{selectedCourses.length !== 1 ? 's' : ''} - {totalCredits} créditos)
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-2xl border border-utec-border bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-utec-text">Calendario tentativo</h2>
            <span className="text-sm text-utec-muted">Formato semanal - 7am a 10pm</span>
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
                        {dayEvents.map((event, eventIdx) => {
                          const { top, height } = computeEventPosition(
                            event.start,
                            event.end,
                          );
                          return (
                            <button
                              key={`${event.code}-${event.start}-${event.end}-${eventIdx}`}
                              onClick={() => setSelectedEventDetail(event)}
                              className="absolute left-[8%] right-[8%] rounded-xl p-2 text-xs text-white shadow-lg hover:shadow-xl transition cursor-pointer"
                              style={{ top, height, backgroundColor: event.color }}
                            >
                              <p className="text-sm font-bold truncate">
                                {event.code}
                              </p>
                              <p className="font-mono text-[10px] opacity-90">
                                {event.start}
                              </p>
                            </button>
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

      {/* Modal de detalles del evento */}
      {selectedEventDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedEventDetail(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-utec-border bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-utec-text">
                  {selectedEventDetail.code}
                </h3>
                <p className="text-sm text-utec-muted">{selectedEventDetail.name}</p>
              </div>
              <button
                onClick={() => setSelectedEventDetail(null)}
                className="rounded-full p-1 hover:bg-gray-100 transition"
              >
                <span className="material-symbols-outlined text-utec-muted">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-utec-blue">schedule</span>
                  <span className="font-semibold">Horario:</span>
                </div>
                <p className="mt-1 text-sm text-utec-muted ml-7">
                  {daysOfWeek.find(d => d.key === selectedEventDetail.day)?.label} - {formatEventRange(selectedEventDetail.start, selectedEventDetail.end)}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-utec-blue">location_on</span>
                  <span className="font-semibold">Ubicación:</span>
                </div>
                <p className="mt-1 text-sm text-utec-muted ml-7">{selectedEventDetail.location}</p>
              </div>

              {selectedEventDetail.docente && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-utec-blue">person</span>
                    <span className="font-semibold">Docente:</span>
                  </div>
                  <p className="mt-1 text-sm text-utec-muted ml-7">{selectedEventDetail.docente}</p>
                </div>
              )}

              {selectedEventDetail.sectionName && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-utec-blue">group</span>
                    <span className="font-semibold">Sección:</span>
                  </div>
                  <p className="mt-1 text-sm text-utec-muted ml-7">{selectedEventDetail.sectionName}</p>
                </div>
              )}

              {selectedEventDetail.grade !== null && (
                <div className="rounded-lg bg-emerald-50 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-emerald-600">grade</span>
                    <span className="font-semibold text-emerald-700">Nota estimada:</span>
                  </div>
                  <p className="mt-1 text-lg font-bold text-emerald-700 ml-7">
                    {formatGrade(selectedEventDetail.grade)}/20
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedEventDetail(null)}
              className="mt-6 w-full rounded-lg bg-utec-blue px-4 py-2 text-white font-semibold hover:bg-blue-700 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de conflicto de horarios */}
      {conflictModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setConflictModal(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-6 shadow-[0_20px_60px_rgba(220,38,38,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <span className="material-symbols-outlined text-2xl text-red-600">warning</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-600">Conflicto de Horario</h3>
                <p className="text-sm text-utec-muted mt-1">
                  El curso <span className="font-semibold">{conflictModal.course.code} - {conflictModal.course.name}</span> tiene horarios que se solapan con:
                </p>
              </div>
            </div>

            <div className="mb-6 space-y-2 rounded-lg bg-red-50 p-4">
              {conflictModal.conflicts.map((conflict, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-red-600 mt-0.5">schedule</span>
                  <div className="text-sm">
                    <p className="font-semibold text-utec-text">
                      {conflict.course.code} - {conflict.course.name}
                    </p>
                    <p className="text-utec-muted">
                      {conflict.day} • {conflict.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConflictModal(null)}
                className="flex-1 rounded-lg border border-utec-border px-4 py-2 font-semibold text-utec-text hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmConflict}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 transition"
              >
                Agregar de todos modos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de matrícula */}
      {enrollmentConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setEnrollmentConfirmModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-utec-border bg-white p-6 shadow-[0_20px_60px_rgba(37,99,235,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <span className="material-symbols-outlined text-2xl text-utec-blue">assignment_turned_in</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-utec-text">Confirmar Matrícula</h3>
                <p className="text-sm text-utec-muted mt-1">
                  ¿Deseas confirmar tu matrícula con los siguientes cursos?
                </p>
              </div>
            </div>

            <div className="mb-6 max-h-60 space-y-2 overflow-y-auto rounded-lg bg-gray-50 p-4">
              {selectedCourses.map((course) => (
                <div key={course.code} className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                  <div>
                    <p className="font-semibold text-utec-text">{course.code}</p>
                    <p className="text-xs text-utec-muted">{course.name}</p>
                  </div>
                  <span className="rounded-full bg-utec-blue/10 px-2 py-1 text-xs font-semibold text-utec-blue">
                    {course.credits} créditos
                  </span>
                </div>
              ))}
            </div>

            <div className="mb-4 rounded-lg bg-blue-50 p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-utec-text">Total de créditos:</span>
                <span className="text-lg font-bold text-utec-blue">{totalCredits}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEnrollmentConfirmModal(false)}
                className="flex-1 rounded-lg border border-utec-border px-4 py-2 font-semibold text-utec-text hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmEnrollment}
                disabled={enrolling}
                className="flex-1 rounded-lg bg-utec-blue px-4 py-2 font-semibold text-white hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {enrolling ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de éxito de matrícula */}
      {enrollmentSuccessModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setEnrollmentSuccessModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-green-200 bg-white p-6 shadow-[0_20px_60px_rgba(22,163,74,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <span className="material-symbols-outlined text-4xl text-green-600">check_circle</span>
              </div>
              <h3 className="text-2xl font-bold text-green-600">¡Matrícula Exitosa!</h3>
              <p className="mt-2 text-sm text-utec-muted">
                Has sido matriculado en <span className="font-semibold">{selectedCourses.length}</span> curso(s) con un total de <span className="font-semibold">{totalCredits}</span> créditos.
              </p>
            </div>

            <div className="mb-6 rounded-lg bg-blue-50 p-4">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-utec-blue">info</span>
                <p className="text-sm text-utec-text">
                  Puedes ver los recursos recomendados para tus cursos en la sección <span className="font-semibold">"Recursos Académicos"</span>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setEnrollmentSuccessModal(false)}
              className="w-full rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
