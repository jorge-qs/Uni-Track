import { useMemo, useState, useEffect } from 'react';
import { getStoredLogin, predecirNota, predecirNotasPorMatricula, recomendarMejorHorario } from '../api/api';

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

const dayNameMap = {
  Lun: 'Lunes',
  Mar: 'Martes',
  Mie: 'Miercoles',
  Jue: 'Jueves',
  Vie: 'Viernes',
  Sab: 'Sabado',
  'Sab.': 'Sabado',
  'Sáb': 'Sabado',
  'Sáb.': 'Sabado',
  Dom: 'Domingo',
  'Dom.': 'Domingo',
};

const scheduleDaysOrder = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

const getScheduleDayLabel = (dayKey) => {
  if (!dayKey) return 'Dia';
  const normalized = dayKey.replace('.', '');
  return dayNameMap[dayKey] || dayNameMap[normalized] || dayKey;
};

const INDIVIDUAL_PREDICTIONS_KEY_PREFIX = 'unitrack.prediccionesIndividuales';
const SCHEDULE_RECOMMENDATIONS_KEY_PREFIX = 'unitrack.recomendacionesHorarios';

const getStudentStorageKey = (prefix, codPersona) =>
  codPersona ? `${prefix}.${codPersona}` : null;

const readJSONFromStorage = (key) => {
  if (!key || typeof window === 'undefined' || !window.localStorage) return null;
  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) return null;
  try {
    return JSON.parse(rawValue);
  } catch (error) {
    console.warn('Error parsing cached data for key', key, error);
    window.localStorage.removeItem(key);
    return null;
  }
};

const writeJSONToStorage = (key, value) => {
  if (!key || typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Error saving cached data for key', key, error);
  }
};

const getCachedIndividualPredictions = (codPersona) => {
  const key = getStudentStorageKey(
    INDIVIDUAL_PREDICTIONS_KEY_PREFIX,
    codPersona,
  );
  const cached = readJSONFromStorage(key);
  return cached?.predictions || null;
};

const saveCachedIndividualPredictions = (codPersona, predictionsMap) => {
  const key = getStudentStorageKey(
    INDIVIDUAL_PREDICTIONS_KEY_PREFIX,
    codPersona,
  );
  writeJSONToStorage(key, {
    updatedAt: new Date().toISOString(),
    predictions: predictionsMap,
  });
};

const getCachedScheduleRecommendations = (codPersona) => {
  const key = getStudentStorageKey(
    SCHEDULE_RECOMMENDATIONS_KEY_PREFIX,
    codPersona,
  );
  const cached = readJSONFromStorage(key);
  return cached?.schedules || null;
};

const saveCachedScheduleRecommendations = (codPersona, schedules) => {
  const key = getStudentStorageKey(
    SCHEDULE_RECOMMENDATIONS_KEY_PREFIX,
    codPersona,
  );
  writeJSONToStorage(key, {
    updatedAt: new Date().toISOString(),
    schedules,
  });
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
  const [matriculaPredictions, setMatriculaPredictions] = useState({});
  const [loadingMatriculaPredictions, setLoadingMatriculaPredictions] = useState(false);
  const [recommendationModal, setRecommendationModal] = useState(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [savedSchedules, setSavedSchedules] = useState([]);

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

  const applyPredictionsToCatalog = (predictionsMap) => {
    setCourseCatalog((prevCatalog) =>
      prevCatalog.map((course) => {
        const prediction = predictionsMap?.[course.code];
        return {
          ...course,
          estimatedGrade: prediction ? prediction.nota : 14.0,
          riskCategory: prediction ? prediction.categoria : 'Normal',
        };
      }),
    );
  };

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
        const seccionesCurso = secciones_info?.[codCurso];
        if (!seccionesCurso) continue;

        // Agrupar horarios por secciónn
        const allSections = [];

        if (seccionesCurso?.horarios) {
          // Nuevo formato: objeto de horarios agrupados por secci?n
          for (const [seccionId, horariosLista] of Object.entries(seccionesCurso.horarios)) {
            if (!Array.isArray(horariosLista)) continue;

            const sessionGroup = [];
            for (const horarioData of horariosLista) {
              const horarioStr = horarioData?.Horario || horarioData?.horario;
              if (!horarioStr) continue;

              const parsed = parseHorario(horarioStr);
              if (parsed) {
                sessionGroup.push({
                  ...parsed,
                  location: horarioData.Ubicacion || horarioData.ubicacion || 'N/A',
                  grupo: horarioData.Grupo || horarioData.grupo,
                  docente: horarioData.Docente || horarioData.docente,
                  modalidad: horarioData.Modalidad || horarioData.modalidad,
                  frecuencia: horarioData.Frecuencia || horarioData.frecuencia,
                  vacantes: horarioData.Vacantes ?? horarioData.vacantes,
                  matriculados: horarioData.Matriculados ?? horarioData.matriculados,
                });
              }
            }

            if (sessionGroup.length > 0) {
              const sampleHorario = horariosLista[0] || {};
              const sectionLabel = seccionId || sampleHorario.Seccion;
              let sectionName = sectionLabel ? `Sección ${sectionLabel}` : null;
              if (!sectionName && sampleHorario.Grupo) {
                sectionName = sampleHorario.Grupo;
              }
              if (!sectionName) {
                sectionName = `Sección ${allSections.length + 1}`;
              }

              allSections.push({
                sectionId: seccionId,
                sectionName,
                sessions: sessionGroup,
              });
            }
          }
        } else {
          // Formato anterior: cada Sección tiene un objeto con sus grupos
          for (const [seccionId, seccionData] of Object.entries(seccionesCurso)) {
            if (!seccionData || typeof seccionData !== 'object') continue;

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
        }

        // Solo agregar curso si tiene secciones
        if (allSections.length > 0) {
          const availableSlots = allSections.reduce((maxSlots, section) => {
            const sectionMax = section.sessions.reduce((sectionSlots, session) => {
              if (session.vacantes != null && session.matriculados != null) {
                const disponibles = Math.max(session.vacantes - session.matriculados, 0);
                return Math.max(sectionSlots, disponibles);
              }
              return sectionSlots;
            }, 0);
            return Math.max(maxSlots, sectionMax);
          }, 0);

          catalog.push({
            code: codCurso,
            name: seccionesCurso?.curso || cursoInfo.curso,
            credits: cursoInfo.creditos || 3,
            prerequisites: cursoInfo.prerequisitos || [],
            slots: availableSlots > 0 ? availableSlots : 30, // Por defecto si no hay datos
            estimatedGrade: null, // Se cargar? despu?s
            allSections: allSections, // Todas las secciones disponibles
            selectedSectionIndex: 0, // Por defecto la primera Sección
          });
        }
      }

      setCourseCatalog(catalog);
      setLoading(false);

      if (cod_persona) {
        const cachedSchedules = getCachedScheduleRecommendations(cod_persona);
        if (cachedSchedules?.length) {
          setSavedSchedules(cachedSchedules);
        }
      }

      // Cargar predicciones en paralelo con soporte de cache
      if (cod_persona && catalog.length > 0) {
        setLoadingPredictions(true);
        try {
          const cachedPredictions = getCachedIndividualPredictions(cod_persona);
          const hasAllCached =
            cachedPredictions &&
            catalog.every((course) => Boolean(cachedPredictions[course.code]));

          if (hasAllCached) {
            applyPredictionsToCatalog(cachedPredictions);
          } else {
            const predictions = await Promise.all(
              catalog.map(async (course) => {
                const result = await predecirNota(cod_persona, course.code);
                return { code: course.code, ...result };
              }),
            );

            const predictionsMap = predictions.reduce((acc, pred) => {
              acc[pred.code] = { nota: pred.nota, categoria: pred.categoria };
              return acc;
            }, {});

            saveCachedIndividualPredictions(cod_persona, predictionsMap);
            applyPredictionsToCatalog(predictionsMap);
          }
        } catch (error) {
          console.error('Error al obtener predicciones individuales:', error);
        } finally {
          setLoadingPredictions(false);
        }
      }
    };

    loadCourses();
  }, []);

  // Actualizar predicciones por matrícula cuando cambian los cursos seleccionados
  useEffect(() => {
    const updateMatriculaPredictions = async () => {
      if (selectedCourses.length === 0) {
        setMatriculaPredictions({});
        return;
      }

      const loginData = getStoredLogin();
      if (!loginData?.cod_persona) return;

      setLoadingMatriculaPredictions(true);

      try {
        const cursosSeleccionados = selectedCourses.map(c => c.code);
        const periodo = "2019-02"; // TODO: Obtener período actual dinámicamente

        const resultado = await predecirNotasPorMatricula(
          loginData.cod_persona,
          cursosSeleccionados,
          periodo
        );

        // Convertir array de predicciones a objeto {cod_curso: nota}
        const predictionsMap = {};
        resultado.predicciones.forEach(pred => {
          predictionsMap[pred.cod_curso] = pred.nota_predicha;
        });

        setMatriculaPredictions(predictionsMap);
      } catch (error) {
        console.error('Error al actualizar predicciones por matrícula:', error);
      } finally {
        setLoadingMatriculaPredictions(false);
      }
    };

    updateMatriculaPredictions();
  }, [selectedCourses]);

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

  const handleRecommendBestSchedule = async () => {
    const loginData = getStoredLogin();
    if (!loginData?.cod_persona) {
      alert('No se encontro informacion del estudiante');
      return;
    }

    if (courseCatalog.length === 0) {
      alert('No hay cursos disponibles para recomendar');
      return;
    }

    setLoadingRecommendation(true);

    try {
      const periodo = "2025-01"; // TODO: Obtener periodo dinamicamente

      const resultado = await recomendarMejorHorario(
        loginData.cod_persona,
        periodo,
        loginData.cursos_disponibles
      );

      if (resultado) {
        const topSchedules = resultado.todos_los_resultados?.slice(0, 3) ?? [];
        setSavedSchedules(topSchedules);
        saveCachedScheduleRecommendations(loginData.cod_persona, topSchedules);
        setRecommendationModal(resultado);
      } else {
        const fallbackSchedules =
          getCachedScheduleRecommendations(loginData.cod_persona) || [];
        setSavedSchedules(fallbackSchedules);
        alert('Error al obtener recomendacion. Intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error al obtener recomendacion:', error);
      const fallbackSchedules =
        getCachedScheduleRecommendations(loginData.cod_persona) || [];
      setSavedSchedules(fallbackSchedules);
      alert('Error al procesar la recomendacion. Verifica tu conexion.');
    } finally {
      setLoadingRecommendation(false);
    }
  };

  const normalizeSectionIdValue = (value) =>
    (value ?? '').toString().trim().toLowerCase();

  const findSectionIndexForCourse = (course, targetSectionId) => {
    if (!course?.allSections?.length || !targetSectionId) {
      return course?.selectedSectionIndex || 0;
    }
    const normalizedTarget = normalizeSectionIdValue(targetSectionId);
    const byId = course.allSections.findIndex(
      (section) => normalizeSectionIdValue(section.sectionId) === normalizedTarget
    );
    if (byId !== -1) return byId;

    const byName = course.allSections.findIndex((section) => {
      const normalizedName = normalizeSectionIdValue(section.sectionName);
      return (
        normalizedName === normalizedTarget ||
        normalizedName.includes(normalizedTarget) ||
        normalizedTarget.includes(normalizedName)
      );
    });
    return byName !== -1 ? byName : course.selectedSectionIndex || 0;
  };

  const applyRecommendation = (plan) => {
    const isArrayPlan = Array.isArray(plan);
    const courseList = isArrayPlan ? plan : plan?.cursos || [];
    if (!courseList.length) {
      alert('No hay cursos para aplicar en este horario.');
      return;
    }

    const courseSectionMap = new Map();
    if (!isArrayPlan && Array.isArray(plan?.cursos_secciones)) {
      plan.cursos_secciones.forEach((entry) => {
        if (Array.isArray(entry) && entry.length >= 2) {
          courseSectionMap.set(entry[0], entry[1]);
        }
      });
    }

    const cursosAgregar = [];
    courseList.forEach((code) => {
      const courseData = courseCatalog.find((course) => course.code === code);
      if (!courseData) {
        return;
      }
      const targetSectionId = courseSectionMap.get(code);
      const selectedSectionIndex = targetSectionId
        ? findSectionIndexForCourse(courseData, targetSectionId)
        : courseData.selectedSectionIndex || 0;

      cursosAgregar.push({
        ...courseData,
        selectedSectionIndex,
      });
    });

    if (!cursosAgregar.length) {
      alert('Ninguno de los cursos recomendados esta disponible en el catalogo actual.');
      return;
    }

    setSelectedCourses(cursosAgregar);
    setRecommendationModal(null);
  };

  const bestRecommendedSchedule =
    recommendationModal?.mejor_recomendacion ??
    recommendationModal?.todos_los_resultados?.[0] ??
    null;

  const otherRecommendedSchedules = recommendationModal?.todos_los_resultados
    ? recommendationModal.todos_los_resultados.filter(
        (plan) =>
          !bestRecommendedSchedule || plan.id !== bestRecommendedSchedule.id
      )
    : [];

  const planHasScheduleBlocks = (schedule) => {
    if (!schedule) return false;
    return Object.values(schedule).some(
      (blocks) => Array.isArray(blocks) && blocks.length > 0
    );
  };

  const normalizeScheduleBlocks = (schedule) => {
    if (!schedule) return [];
    return scheduleDaysOrder.map((day) => {
      const blocks = schedule[day];
      return [day, Array.isArray(blocks) ? blocks : []];
    });
  };

  const resolveScheduleBlock = (block) => {
    if (Array.isArray(block)) {
      return {
        start: block[0] ?? '--:--',
        end: block[1] ?? '--:--',
      };
    }
    if (block && typeof block === 'object') {
      const start = Object.prototype.hasOwnProperty.call(block, 'inicio')
        ? block.inicio
        : block.start;
      const end = Object.prototype.hasOwnProperty.call(block, 'fin')
        ? block.fin
        : block.end;
      return {
        start: start ?? '--:--',
        end: end ?? '--:--',
      };
    }
    return { start: '--:--', end: '--:--' };
  };

  const renderSchedulePreview = (schedule) => {
    if (!planHasScheduleBlocks(schedule)) {
      return (
        <p className="text-sm text-utec-muted mt-2">
          Horarios detallados no disponibles para esta opcion.
        </p>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3">
        {normalizeScheduleBlocks(schedule).map(([day, blocks]) => {
          if (!blocks.length) return null;
          return (
            <div key={day} className="rounded-lg bg-white/80 p-2 shadow-sm">
              <p className="text-xs font-semibold text-utec-muted uppercase">
                {getScheduleDayLabel(day)}
              </p>
              {blocks.map((block, idx) => {
                const { start, end } = resolveScheduleBlock(block);
                return (
                  <p
                    key={`${day}-${idx}`}
                    className="text-sm font-semibold text-utec-text"
                  >
                    {start} - {end}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const formatPlanHours = (hours) =>
    typeof hours === 'number' ? hours.toFixed(1) : '0.0';

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

  if (courseCatalog.length === 0) {s
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
    <div>
    {/* Modal de recomendación de horario */}
      {recommendationModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setRecommendationModal(null)}
        >
          <div
        className="max-h-[90vh] overflow-y-auto rounded-2xl border border-purple-200 bg-white p-6 shadow-[0_20px_60px_rgba(147,51,234,0.3)] mx-auto"
        style={{ width: '90%', maxWidth: '1200px' }}
        onClick={(e) => e.stopPropagation()}
          >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <span className="material-symbols-outlined text-2xl text-purple-600">auto_awesome</span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-purple-600">Mejor Horario Recomendado</h3>
            <p className="text-sm text-utec-muted mt-1">
          Analizamos {recommendationModal.meta?.total_evaluados ?? 0} opciones usando IA
            </p>
          </div>
          <button
            onClick={() => setRecommendationModal(null)}
            className="rounded-full p-1 hover:bg-gray-100 transition"
          >
            <span className="material-symbols-outlined text-utec-muted">close</span>
          </button>
        </div>

        {/* Mejor horario */}
                  <div className="mb-6 rounded-xl border-2 border-purple-200 bg-purple-50 p-4">
                    {bestRecommendedSchedule ? (
                    <>
                      <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-purple-700">
                        Horario #{bestRecommendedSchedule.rank ?? 1}
                        </h4>
                        <p className="text-sm text-purple-600">
                        {(bestRecommendedSchedule.total_cursos ?? bestRecommendedSchedule.cursos.length)} cursos - {formatPlanHours(bestRecommendedSchedule.total_horas)} h semanales
                        </p>
                      </div>
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                        TOP
                      </span>
                      </div>

                      <div className="mb-3 space-y-2">
                      <p className="text-sm font-semibold text-purple-700">
                        Cursos incluidos:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {bestRecommendedSchedule.cursos.length > 0 ? (
                        bestRecommendedSchedule.cursos.map((codigo, idx) => {
                          const courseName = courseCatalog.find(c => c.code === codigo)?.name || codigo;
                          return (
                          <span
                            key={`${codigo}-${idx}`}
                            className="rounded-lg bg-white px-3 py-1 text-sm font-semibold text-purple-700 shadow-sm"
                          >
                            {courseName}
                          </span>
                          );
                        })
                        ) : (
                        <span className="text-sm text-purple-600">
                          Sin cursos sugeridos
                        </span>
                        )}
                      </div>
                      </div>

                      <div className="mb-4">
                      {renderSchedulePreview(bestRecommendedSchedule.horario)}
                      </div>

                    <button
                      onClick={() => applyRecommendation(bestRecommendedSchedule)}
                      className="w-full rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 transition"
                      >
                      Aplicar este horario
                      </button>
                    </>
                    ) : (
                    <p className="text-sm text-utec-muted">
                      No se encontraron horarios recomendados para los cursos disponibles.
                    </p>
                    )}
                  </div>

                  {otherRecommendedSchedules.length > 0 && (
                    <div className="mb-6 space-y-4">
                    <p className="text-sm font-semibold text-utec-text">
                      Otras opciones destacadas
                    </p>
                    {otherRecommendedSchedules.map((plan) => (
                      <div
                      key={plan.id}
                      className="rounded-xl border border-utec-border bg-white p-4 shadow-sm"
                      >
                      <div className="flex items-center justify-between">
                        <div>
                        <p className="text-base font-bold text-utec-text">
                          Horario #{plan.rank ?? 'N/A'}
                        </p>
                        <p className="text-sm text-utec-muted">
                          {plan.cursos.length} cursos - {formatPlanHours(plan.total_horas)} h semanales
                        </p>
                        </div>
                        <span className="text-xs font-semibold uppercase text-utec-muted">
                        Opcion
                        </span>
                      </div>

                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold text-utec-muted uppercase">
                        Cursos:
                        </p>
                        {plan.cursos.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {plan.cursos.map((codigo) => {
                          const courseName = courseCatalog.find(c => c.code === codigo)?.name || codigo;
                          return (
                            <span
                            key={`${plan.id}-${codigo}`}
                            className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-utec-text"
                            >
                            {courseName}
                            </span>
                          );
                          })}
                        </div>
                        ) : (
                        <p className="text-sm text-utec-muted">
                          Sin cursos asignados.
                        </p>
                        )}
                      </div>

                      <div className="mt-3">
                        {renderSchedulePreview(plan.horario)}
                      </div>

                      <button
                        onClick={() => applyRecommendation(plan)}
                        className="mt-4 w-full rounded-lg border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50 transition"
                      >
                        Aplicar este horario
                      </button>
                      </div>
                    ))}
                    </div>
                  )}

                  {/* Mensaje del sistema */}
            {recommendationModal.mensaje && (
              <div className="mb-4 rounded-lg bg-blue-50 p-3">
                <p className="text-sm text-utec-text">{recommendationModal.mensaje}</p>
              </div>
            )}

            <button
              onClick={() => setRecommendationModal(null)}
              className="w-full rounded-lg border border-utec-border px-4 py-2 font-semibold text-utec-text hover:bg-gray-50 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-utec-text">Matricula IA</h1>
        <p className="text-sm text-utec-muted">
          Selecciona los cursos disponibles segun tus prerequisitos aprobados y organiza
          tus horarios de manera eficiente.
        </p>
      </header>

      <section
        className="flex w-full flex-col gap-6 lg:flex-row lg:items-start"
        style={{ width: '100%', maxWidth: 'min(90vw, 1400px)', margin: '24px auto 0' }}
      >
        <div
          className="flex w-full flex-col rounded-2xl border border-utec-border bg-white shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden lg:flex-[0.35]"
          style={{ height: 'calc(100vh - 220px)' }}
        >
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
            {savedSchedules.length > 0 && (
              <div className="rounded-xl border border-purple-100 bg-purple-50/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-purple-700">Horarios recomendados</p>
                    <p className="text-xs text-purple-600">Ultimo analisis IA</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-purple-700">
                    TOP 3
                  </span>
                </div>
                <div className="mt-3 space-y-3">
                  {savedSchedules.map((plan, idx) => (
                    <div
                      key={plan.id ?? `${plan.rank ?? 'plan'}-${idx}`}
                      className="rounded-lg bg-white/90 p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-utec-text">
                            Horario #{plan.rank ?? plan.id ?? idx + 1}
                          </p>
                          <p className="text-xs text-utec-muted">
                            {plan.cursos?.length ?? 0} cursos - {formatPlanHours(plan.total_horas)} h semanales
                          </p>
                        </div>
                        <button
                          onClick={() => applyRecommendation(plan)}
                          className="rounded-lg border border-purple-200 px-3 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-50 transition"
                        >
                          Aplicar
                        </button>
                      </div>
                      {plan.cursos?.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {plan.cursos.slice(0, 4).map((codigo) => (
                            <span
                              key={`${plan.id ?? idx}-${codigo}`}
                              className="rounded-full bg-purple-100/70 px-3 py-1 text-xs font-semibold text-purple-700"
                            >
                              {codigo}
                            </span>
                          ))}
                          {plan.cursos.length > 4 && (
                            <span className="text-xs font-semibold text-purple-600">
                              +{plan.cursos.length - 4} mas
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-utec-muted">Sin cursos asignados</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                      {course.riskCategory && (
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          course.riskCategory === 'Riesgo' ? 'bg-red-100 text-red-700' :
                          course.riskCategory === 'Factible' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {course.riskCategory}
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

        <div
          className="space-y-4 overflow-y-auto rounded-2xl border border-utec-border bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)] w-full lg:flex-[0.65]"
          style={{ maxHeight: 'calc(100vh - 120px)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-utec-text">Calendario tentativo</h2>
              <span className="text-sm text-utec-muted">Formato semanal - 7am a 10pm</span>
            </div>
            <button
              onClick={handleRecommendBestSchedule}
              disabled={loadingRecommendation || courseCatalog.length === 0}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                loadingRecommendation || courseCatalog.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {loadingRecommendation ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></span>
                  <span>Analizando...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">auto_awesome</span>
                  <span>Recomendar Mejor Horario</span>
                </>
              )}
            </button>
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
                          const predictedGrade = matriculaPredictions[event.code];
                          const gradeLabel = loadingMatriculaPredictions
                            ? '--/20'
                            : predictedGrade != null
                              ? `${formatGrade(predictedGrade)}/20`
                              : '--/20';
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
                                {gradeLabel}
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
                    <span className="font-semibold text-emerald-700">Nota estimada (individual):</span>
                  </div>
                  <p className="mt-1 text-lg font-bold text-emerald-700 ml-7">
                    {formatGrade(selectedEventDetail.grade)}/20
                  </p>
                </div>
              )}

              {matriculaPredictions[selectedEventDetail.code] && (
                <div className="rounded-lg bg-purple-50 p-3 border-2 border-purple-200">
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <span className="material-symbols-outlined text-purple-600">psychology</span>
                    <span className="font-semibold text-purple-700">Nota predicha (con matrícula):</span>
                  </div>
                  <p className="text-lg font-bold text-purple-700 ml-7">
                    {formatGrade(matriculaPredictions[selectedEventDetail.code])}/20
                  </p>
                  <p className="text-xs text-purple-600 mt-2 ml-7">
                    {loadingMatriculaPredictions ? (
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-purple-600 border-r-transparent"></span>
                        Actualizando...
                      </span>
                    ) : (
                      'Considera todos los cursos seleccionados'
                    )}
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
    </div>
    
    
  );
}
