import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';

const OnboardingTour = ({ codPersona }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigationTimeoutRef = useRef(null);

  // Definición de los 13 pasos del tour
  const steps = [
    // PASO 1: Bienvenida
    {
      target: 'body',
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-utec-text">
            ¡Bienvenido a Uni-Track! 🎓
          </h2>
          <p className="text-base text-gray-700">
            Te guiaremos por las funcionalidades principales de la plataforma.
            Este tour toma menos de 2 minutos.
          </p>
          <p className="text-sm text-gray-500">
            Puedes omitirlo en cualquier momento presionando "Saltar" o ESC.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
      locale: { skip: 'Omitir', next: 'Comenzar Tour', last: 'Finalizar' },
    },

    // PASO 2: Sidebar Navigation
    {
      target: '[data-tour="sidebar"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-utec-text">Navegación Principal</h3>
          <p className="text-sm text-gray-700">
            Desde aquí puedes acceder a todas las secciones: Dashboard, Curriculum,
            Notas, Trámites, Matrícula IA y Recursos Académicos.
          </p>
        </div>
      ),
      placement: 'right',
      disableBeacon: true,
    },

    // PASO 3: Métricas Académicas (Home)
    {
      target: '[data-tour="metrics"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-utec-text">Tus Métricas Académicas</h3>
          <p className="text-sm text-gray-700">
            Visualiza tu promedio ponderado, cursos aprobados, créditos acumulados
            y créditos faltantes de un vistazo.
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },

    // PASO 4: Recent Activity
    {
      target: '[data-tour="recent-activity"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-utec-text">Actividad Reciente</h3>
          <p className="text-sm text-gray-700">
            Mantente al día con exámenes, entregas y anuncios importantes del ciclo académico.
          </p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },

    // PASO 5: Performance Insights
    {
      target: '[data-tour="insights"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-utec-text">Recomendaciones Inteligentes</h3>
          <p className="text-sm text-gray-700">
            Recibe sugerencias personalizadas para mejorar tu rendimiento académico
            basadas en tu historial.
          </p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },

    // PASO 6: Quick Access
    {
      target: '[data-tour="quick-access"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-utec-text">Accesos Rápidos</h3>
          <p className="text-sm text-gray-700">
            Accede directamente a las secciones más utilizadas con un solo clic.
          </p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },

    // PASO 7: Curriculum - Navegación requerida
    {
      target: '[data-tour="curriculum-view"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-utec-text">Tu Malla Curricular</h3>
          <p className="text-sm text-gray-700">
            Explora todos los cursos de tu carrera organizados por ciclo,
            con estados de aprobación en tiempo real.
          </p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
      requiresNavigation: '/curriculum',
    },

    // PASO 8: My Grades - Navegación requerida
    {
      target: '[data-tour="grades-chart"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-utec-text">Evolución de tu Rendimiento</h3>
          <p className="text-sm text-gray-700">
            Visualiza tu progreso académico a través del tiempo con gráficos interactivos
            y análisis detallado por periodo.
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
      requiresNavigation: '/grades',
    },

    // PASO 9: Procedures - Navegación requerida
    {
      target: '[data-tour="procedures-form"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-utec-text">Gestión de Trámites</h3>
          <p className="text-sm text-gray-700">
            Solicita certificados, retiros de curso, reconsideraciones y otros
            trámites académicos de forma digital.
          </p>
        </div>
      ),
      placement: 'right',
      disableBeacon: true,
      requiresNavigation: '/procedures',
    },

    // PASO 10: Matrícula IA - Navegación requerida
    {
      target: '[data-tour="ai-predictor"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-utec-text">Predictor de Notas con IA 🤖</h3>
          <p className="text-sm text-gray-700">
            Usa nuestros modelos de Machine Learning para predecir tu rendimiento
            en diferentes cursos antes de matricularte.
          </p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
      requiresNavigation: '/enrollment',
    },

    // PASO 11: Recomendador de Horarios
    {
      target: '[data-tour="schedule-recommender"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-utec-text">Recomendador de Horarios Óptimos</h3>
          <p className="text-sm text-gray-700">
            Recibe recomendaciones inteligentes de combinaciones de cursos y horarios
            optimizados según 9 criterios académicos.
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },

    // PASO 12: Academic Resources - Navegación requerida
    {
      target: '[data-tour="resources"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-utec-text">Recursos Académicos Personalizados</h3>
          <p className="text-sm text-gray-700">
            Una vez que te matricules en tus cursos, aquí encontrarás materiales
            de estudio, libros, videos y recursos recomendados específicamente
            para cada una de tus asignaturas.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            💡 Los recursos se cargarán automáticamente después de confirmar tu matrícula.
          </p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
      requiresNavigation: '/resources',
    },

    // PASO 13: Final
    {
      target: 'body',
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-utec-text">
            ¡Tour Completado! 🎉
          </h2>
          <p className="text-base text-gray-700">
            Ya conoces las principales funcionalidades de Uni-Track.
            Comienza a explorar y optimiza tu experiencia académica.
          </p>
          <p className="text-sm text-gray-500">
            Puedes volver a ver este tour desde Configuración en cualquier momento.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
      locale: { last: 'Comenzar a Usar Uni-Track' },
    },
  ];

  // Verificar si el usuario ya completó el tour
  useEffect(() => {
    if (!codPersona) return;

    const tourKey = `tourCompleted_${codPersona}`;
    const completed = localStorage.getItem(tourKey) === 'true';

    if (!completed) {
      // Dar un pequeño delay para que la UI cargue completamente
      const timer = setTimeout(() => {
        setRun(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [codPersona]);

  // Callback para manejar eventos del tour
  const handleJoyrideCallback = useCallback((data) => {
    const { action, index, status, type, lifecycle } = data;

    // Cuando termina o se omite el tour
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      if (codPersona) {
        localStorage.setItem(`tourCompleted_${codPersona}`, 'true');
      }
      setRun(false);
      setIsNavigating(false);
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
      // Volver al home si está en otra página
      if (location.pathname !== '/home') {
        navigate('/home');
      }
      return;
    }

    // Solo procesar cuando el usuario hace click en siguiente/atrás
    if (type === EVENTS.STEP_AFTER) {
      // Si estamos en el último paso y hacen click, finalizar el tour
      if (index === steps.length - 1 && action === ACTIONS.NEXT) {
        if (codPersona) {
          localStorage.setItem(`tourCompleted_${codPersona}`, 'true');
        }
        setRun(false);
        setIsNavigating(false);
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
        }
        // Volver al home
        if (location.pathname !== '/home') {
          navigate('/home');
        }
        return;
      }

      const nextIndex = action === ACTIONS.PREV ? index - 1 : index + 1;
      const nextStep = steps[nextIndex];

      if (!nextStep) return;

      // Verificar si necesitamos navegar a otra página
      const needsNavigation = nextStep.requiresNavigation &&
                              location.pathname !== nextStep.requiresNavigation;

      if (needsNavigation) {
        // Marcar que estamos navegando
        setIsNavigating(true);

        // Navegar a la nueva página
        navigate(nextStep.requiresNavigation);

        // Esperar a que la página cargue y luego actualizar el índice
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
        }

        navigationTimeoutRef.current = setTimeout(() => {
          setStepIndex(nextIndex);
          setIsNavigating(false);
        }, 500);
      } else {
        // No necesita navegación, avanzar directamente
        setStepIndex(nextIndex);
      }
    }
  }, [codPersona, location.pathname, navigate, steps]);

  // Cleanup del timeout cuando se desmonta el componente
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Estilos personalizados con colores UTEC
  const styles = {
    options: {
      primaryColor: '#0066cc',
      textColor: '#1f2937',
      backgroundColor: '#ffffff',
      overlayColor: 'rgba(0, 0, 0, 0.65)',
      spotlightShadow: '0 0 20px rgba(0, 0, 0, 0.6)',
      arrowColor: '#ffffff',
      zIndex: 10000,
    },
    tooltip: {
      borderRadius: '1rem',
      padding: 0,
    },
    tooltipContainer: {
      textAlign: 'left',
    },
    tooltipContent: {
      padding: '1.5rem',
    },
    buttonNext: {
      backgroundColor: '#0066cc',
      borderRadius: '0.5rem',
      padding: '0.625rem 1.25rem',
      fontSize: '0.875rem',
      fontWeight: '600',
    },
    buttonBack: {
      color: '#6b7280',
      marginRight: '0.75rem',
      fontSize: '0.875rem',
    },
    buttonSkip: {
      color: '#6b7280',
      fontSize: '0.875rem',
    },
    spotlight: {
      borderRadius: '0.75rem',
    },
  };

  // Textos en español
  const locale = {
    back: 'Atrás',
    close: 'Cerrar',
    last: 'Finalizar',
    next: 'Siguiente',
    skip: 'Omitir',
  };

  return (
    <Joyride
      steps={steps}
      run={run && !isNavigating}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      spotlightClicks={false}
      disableOverlayClose
      disableCloseOnEsc={false}
      callback={handleJoyrideCallback}
      styles={styles}
      locale={locale}
      scrollToFirstStep
      scrollOffset={100}
      disableScrolling={isNavigating}
    />
  );
};

export default OnboardingTour;
