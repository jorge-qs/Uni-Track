import { useMemo, useState, useEffect } from 'react';
import { getStoredLogin, predecirNota, predecirNotasPorMatricula, recomendarMejorHorario, getRecomendacionIA, calculateScore } from '../api/api';
import HorarioModal from './AiPage';
import CourseCatalog from '../components/enrollment/CourseCatalog';
import ScheduleCalendar from '../components/enrollment/ScheduleCalendar';
import RecommendationModal from '../components/enrollment/RecommendationModal';
import EventDetailModal from '../components/enrollment/EventDetailModal';
import ConflictModal from '../components/enrollment/ConflictModal';
import EnrollmentConfirmModal from '../components/enrollment/EnrollmentConfirmModal';
import EnrollmentSuccessModal from '../components/enrollment/EnrollmentSuccessModal';

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
  return {
    schedules: cached?.schedules || null,
    allScores: cached?.allScores || []
  };
};

const saveCachedScheduleRecommendations = (codPersona, schedules, allScores = []) => {
  const key = getStudentStorageKey(
    SCHEDULE_RECOMMENDATIONS_KEY_PREFIX,
    codPersona,
  );
  writeJSONToStorage(key, {
    updatedAt: new Date().toISOString(),
    schedules,
    allScores,
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
  const [customPlanSelections, setCustomPlanSelections] = useState([]);
  const [activeScheduleTab, setActiveScheduleTab] = useState('custom');
  const [showExplanation, setShowExplanation] = useState(false);
  const [analisisData, setAnalisisData] = useState(null);
  const [loadingAnalisisData, setLoadingAnalisisData] = useState(false);
  const [allScores, setAllScores] = useState([]);
  const [currentScore, setCurrentScore] = useState(null);

  const cargarAnalisis = async () => {
    // Validación simple
    if (selectedCourses.length === 0) {
      alert("Por favor selecciona al menos un curso para analizar.");
      return;
    }

    setLoading(true); // Activa el spinner del botón

    // 1. Preparamos los datos limpios para enviar al backend
    // Extraemos solo lo necesario: código, nombre, créditos y los horarios de la sección seleccionada
    const payload = selectedCourses.map(course => {
      const sectionIndex = course.selectedSectionIndex || 0;
      const section = course.allSections[sectionIndex];

      return {
        code: course.code,
        name: course.name,
        credits: course.credits,
        sessions: section ? section.sessions.map(s => ({
          day: s.day,
          start: s.start,
          end: s.end,
          location: s.location
        })) : []
      };
    });

    // 2. Llamamos a la API pasando el payload
    const data = await getRecomendacionIA(payload);

    if (data) {
      setAnalisisData(data);
      setShowExplanation(true);
    }

    setLoading(false); // Apaga el spinner
  };

  const selectedCodes = useMemo(
    () => new Set(selectedCourses.map((course) => course.code)),
    [selectedCourses],
  );

  const totalCredits = useMemo(
    () => selectedCourses.reduce((acc, course) => acc + course.credits, 0),
    [selectedCourses],
  );

  const scheduleTabs = useMemo(() => {
    const baseTabs = [{
      id: 'custom',
      label: 'Personalizado',
      type: 'custom',
    }];
    const recommendedTabs = savedSchedules.map((plan, idx) => ({
      id: `plan-${plan.id ?? idx}`,
      label: `Horario #${plan.rank ?? idx + 1}`,
      type: 'recommendation',
      plan,
    }));
    return [...baseTabs, ...recommendedTabs];
  }, [savedSchedules]);

  useEffect(() => {
    if (!scheduleTabs.some((tab) => tab.id === activeScheduleTab)) {
      setActiveScheduleTab('custom');
    }
  }, [scheduleTabs, activeScheduleTab]);

  const activeTabMeta = useMemo(
    () => scheduleTabs.find((tab) => tab.id === activeScheduleTab) ?? scheduleTabs[0],
    [scheduleTabs, activeScheduleTab],
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
        const cachedData = getCachedScheduleRecommendations(cod_persona);
        if (cachedData?.schedules?.length) {
          setSavedSchedules(cachedData.schedules);
        }
        if (cachedData?.allScores?.length) {
          setAllScores(cachedData.allScores);
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

  // Calcular score en tiempo real cuando cambian los cursos seleccionados
  useEffect(() => {
    const updateScore = async () => {
      if (selectedCourses.length === 0) {
        setCurrentScore(null);
        return;
      }

      const loginData = getStoredLogin();
      if (!loginData?.cod_persona) return;

      try {
        const cursosSeleccionados = selectedCourses.map(c => c.code);
        const periodo = "2025-01"; // TODO: Obtener periodo dinamicamente

        const result = await calculateScore(
          loginData.cod_persona,
          periodo,
          cursosSeleccionados
        );

        if (result && result.success) {
          setCurrentScore(result.score);
          setAllScores(prev => [...prev, result.score]);
        }
      } catch (error) {
        console.error('Error al calcular score:', error);
      }
    };

    // Debounce para no llamar a la API en cada cambio rápido
    const timeoutId = setTimeout(() => {
      updateScore();
    }, 500);

    return () => clearTimeout(timeoutId);
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

  const syncCourseCatalogWithSelection = (selectionList) => {
    if (!selectionList?.length) return;
    const sectionMap = new Map(
      selectionList.map((course) => [course.code, course.selectedSectionIndex || 0]),
    );

    setCourseCatalog((prevCatalog) =>
      prevCatalog.map((course) =>
        sectionMap.has(course.code)
          ? { ...course, selectedSectionIndex: sectionMap.get(course.code) }
          : course,
      ),
    );
  };

  const rememberCustomPlan = () => {
    setCustomPlanSelections(
      selectedCourses.map((course) => {
        const sectionIndex = course.selectedSectionIndex || 0;
        const section =
          course.allSections?.[sectionIndex] || course.allSections?.[0] || null;
        return {
          code: course.code,
          sectionIndex,
          sectionId: section?.sectionId || null,
        };
      }),
    );
  };

  const restoreCustomPlan = () => {
    if (!customPlanSelections.length) {
      setSelectedCourses([]);
      return;
    }

    const restoredCourses = [];
    customPlanSelections.forEach(({ code, sectionId, sectionIndex }) => {
      const courseData = courseCatalog.find((course) => course.code === code);
      if (!courseData) {
        return;
      }

      let resolvedIndex =
        typeof sectionIndex === 'number' ? sectionIndex : courseData.selectedSectionIndex || 0;
      if (sectionId) {
        resolvedIndex = findSectionIndexForCourse(courseData, sectionId);
      }
      const maxIndex = Math.max((courseData.allSections?.length || 1) - 1, 0);
      resolvedIndex = Math.min(Math.max(resolvedIndex, 0), maxIndex);

      restoredCourses.push({
        ...courseData,
        selectedSectionIndex: resolvedIndex,
      });
    });

    setSelectedCourses(restoredCourses);
    syncCourseCatalogWithSelection(restoredCourses);
  };

  const displayedCalendarEvents = useMemo(() => {
    if (!activeTabMeta || activeTabMeta.type === 'custom') {
      return calendarEvents;
    }
    const plan = activeTabMeta.plan;
    if (!plan) return [];

    const sectionMap = new Map(
      Array.isArray(plan.cursos_secciones) ? plan.cursos_secciones : [],
    );

    const planEvents = [];
    (plan.cursos || []).forEach((code) => {
      const course = courseCatalog.find((item) => item.code === code);
      if (!course?.allSections?.length) {
        return;
      }

      const sectionKey = sectionMap.get(code);
      const sectionIndex = sectionKey
        ? findSectionIndexForCourse(course, sectionKey)
        : course.selectedSectionIndex || 0;
      const section = course.allSections[sectionIndex];
      if (!section) return;

      section.sessions.forEach((session) => {
        planEvents.push({
          ...session,
          code,
          name: course.name,
          color: generateCourseColor(`${plan.id ?? 'plan'}-${code}`),
          grade: course.estimatedGrade,
          sectionName: section.sectionName,
        });
      });
    });

    return planEvents;
  }, [activeTabMeta, calendarEvents, courseCatalog]);

  const recommendationLevel = useMemo(() => {
    let currentScoreValue = null;

    if (activeTabMeta && activeTabMeta.type === 'recommendation' && activeTabMeta.plan) {
      currentScoreValue = activeTabMeta.plan.score;
    } else if (activeTabMeta && activeTabMeta.type === 'custom') {
      currentScoreValue = currentScore;
    }

    if (typeof currentScoreValue !== 'number' || allScores.length === 0) {
      return { label: 'Recomendado', color: 'bg-blue-100 text-blue-700' };
    }

    // Incluimos el score actual en la comparación para calcular el percentil
    const scoresToCompare = [...allScores, currentScoreValue].sort((a, b) => a - b);
    const rank = scoresToCompare.findIndex(s => s >= currentScoreValue);
    const percentile = (rank / scoresToCompare.length) * 100;
    console.log(percentile)
    console.log(allScores)
    console.log(currentScoreValue)
    console.log(scoresToCompare)
    console.log(rank)
    console.log("=============")
    if (percentile >= 75) {
      return { label: 'Muy Recomendado', color: 'bg-emerald-100 text-emerald-700' };
    } else if (percentile >= 50) {
      return { label: 'Recomendado', color: 'bg-blue-100 text-blue-700' };
    } else if (percentile >= 25) {
      return { label: 'No recomendado', color: 'bg-orange-100 text-orange-700' };
    } else {
      return { label: 'Inviable', color: 'bg-red-100 text-red-700' };
    }
  }, [activeTabMeta, allScores, currentScore]);

  const applyRecommendation = (plan, options = {}) => {
    const { stayOnPlanTab = false } = options;
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
    syncCourseCatalogWithSelection(cursosAgregar);
    setRecommendationModal(null);
    if (!stayOnPlanTab) {
      setActiveScheduleTab('custom');
    }
  };

  const handleScheduleTabClick = (tab) => {
    if (!tab) return;

    if (tab.id === activeScheduleTab) {
      if (tab.type === 'recommendation' && tab.plan) {
        applyRecommendation(tab.plan, { stayOnPlanTab: true });
      }
      return;
    }

    if (tab.type === 'custom') {
      setActiveScheduleTab('custom');
      restoreCustomPlan();
      return;
    }

    if (activeTabMeta?.type === 'custom') {
      rememberCustomPlan();
    }

    setActiveScheduleTab(tab.id);
    if (tab.type === 'recommendation' && tab.plan) {
      applyRecommendation(tab.plan, { stayOnPlanTab: true });
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
    <div>
      <RecommendationModal
        isOpen={!!recommendationModal}
        onClose={() => setRecommendationModal(null)}
        recommendationData={recommendationModal}
        onApply={applyRecommendation}
        courseCatalog={courseCatalog}
      />

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
          style={{ width: '100%', maxWidth: 'min(90vw, 1800px)', margin: '24px auto 0' }}
        >
          <CourseCatalog
            courses={courseCatalog}
            selectedCodes={selectedCodes}
            onToggleCourse={handleToggleCourse}
            onSectionChange={handleSectionChange}
            loadingPredictions={loadingPredictions}
            onEnroll={handleEnroll}
            isEnrolling={enrolling}
            totalCredits={totalCredits}
            selectedCoursesCount={selectedCourses.length}
          />

          <div
            className="space-y-4 overflow-y-auto rounded-2xl border border-utec-border bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)] w-full lg:flex-[0.65]"
            style={{ maxHeight: 'calc(100vh - 120px)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-utec-text">Calendario tentativo</h2>
                <span className="text-sm text-utec-muted">Formato semanal - 7am a 10pm</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-white gap-6">
                <div className="flex flex-col items-start gap-2">
                  <span className="text-sm font-medium text-gray-600">
                    Nivel de recomendación
                  </span>
                  {recommendationLevel ? (
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${recommendationLevel.color}`}>
                      {recommendationLevel.label}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 italic">
                      (Selecciona un horario)
                    </span>
                  )}
                </div>

                <button
                  onClick={cargarAnalisis}
                  disabled={loading}
                  className="group flex flex-col items-center gap-1 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <span className={`text-[10px] font-medium text-utec-blue transition-opacity duration-200 
                    ${loading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {loading ? 'Analizando...' : '¿Por qué?'}
                  </span>

                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-utec-blue text-white shadow transition-all duration-200 group-hover:scale-110 group-hover:shadow-md">
                    {loading ? (
                      <span className="material-symbols-outlined animate-spin text-sm">
                        sync
                      </span>
                    ) : (
                      <span className="font-bold text-sm">?</span>
                    )}
                  </div>
                </button>

                <HorarioModal
                  showExplanation={showExplanation}
                  setShowExplanation={setShowExplanation}
                  data={analisisData}
                />
              </div>

              <button
                onClick={handleRecommendBestSchedule}
                disabled={loadingRecommendation || courseCatalog.length === 0}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${loadingRecommendation || courseCatalog.length === 0
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

            <div className="flex flex-wrap items-center gap-2 border-b border-utec-border/60 pb-3">
              {scheduleTabs.map((tab) => {
                const isActive = activeTabMeta?.id === tab.id;
                const baseClasses =
                  'flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition';
                const className = isActive
                  ? `${baseClasses} bg-utec-blue text-white shadow`
                  : `${baseClasses} bg-gray-100 text-utec-muted hover:text-utec-text`;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleScheduleTabClick(tab)}
                    className={className}
                  >
                    <span>{tab.label}</span>
                    {tab.type === 'recommendation' && (
                      <span className="rounded-full bg-white/20 px-2 py-[1px] text-[10px] uppercase tracking-wide">
                        IA
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <ScheduleCalendar
              events={displayedCalendarEvents}
              onEventClick={setSelectedEventDetail}
              matriculaPredictions={matriculaPredictions}
              loadingPredictions={loadingMatriculaPredictions}
            />
          </div>
        </section>

        <EventDetailModal
          event={selectedEventDetail}
          onClose={() => setSelectedEventDetail(null)}
          matriculaPredictions={matriculaPredictions}
          loadingPredictions={loadingMatriculaPredictions}
        />

        <ConflictModal
          conflictData={conflictModal}
          onClose={() => setConflictModal(null)}
          onConfirm={handleConfirmConflict}
        />

        <EnrollmentConfirmModal
          isOpen={enrollmentConfirmModal}
          onClose={() => setEnrollmentConfirmModal(false)}
          courses={selectedCourses}
          totalCredits={totalCredits}
          onConfirm={confirmEnrollment}
          isEnrolling={enrolling}
        />

        <EnrollmentSuccessModal
          isOpen={enrollmentSuccessModal}
          onClose={() => setEnrollmentSuccessModal(false)}
          coursesCount={selectedCourses.length}
          totalCredits={totalCredits}
        />
      </div>
    </div>
  );
}
