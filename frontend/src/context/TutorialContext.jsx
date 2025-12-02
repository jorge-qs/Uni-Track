import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TutorialContext = createContext();

export const useTutorial = () => useContext(TutorialContext);

export const TutorialProvider = ({ children }) => {
    const [isActive, setIsActive] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();

    const steps = [
        {
            id: 'welcome',
            targetId: null, // Modal centered
            title: '¡Bienvenido a EduTrack!',
            content: '¿Te gustaría ver un tutorial rápido sobre cómo usar la plataforma?',
            placement: 'center',
            hasSkip: true,
            nextLabel: 'Comenzar',
        },
        {
            id: 'sidebar',
            targetId: 'tutorial-sidebar',
            title: 'Navegación',
            content: 'En la barra lateral tienes un menú desplegable que te permite acceder a todas las secciones.',
            placement: 'right',
        },
        {
            id: 'go-enrollment',
            targetId: 'tutorial-sidebar',
            title: 'Matrícula IA',
            content: 'Vamos a la sección de Matrícula IA, donde puedes elegir a que cursos matricularte el próximo ciclo.',
            placement: 'right',
            action: () => navigate('/enrollment'),
        },
        {
            id: 'catalog',
            targetId: 'tutorial-course-catalog',
            title: 'Cursos Disponibles',
            content: 'Aquí puedes ver todos los cursos disponibles para tu matrícula. Aquí puedes elegir tu seccion, evaluar la factibilidad y añadirlo a tu plan.',
            placement: 'right',
        },
        {
            id: 'calendar',
            targetId: 'tutorial-calendar',
            title: 'Calendario Tentativo',
            content: 'En esta zona se irá armando tu horario a medida que selecciones cursos.',
            placement: 'left',
        },
        {
            id: 'recommend',
            targetId: 'tutorial-recommend-btn',
            title: 'Recomendación IA',
            content: 'Si quieres sugerencias de horarios posibles, presiona este botón y la IA generará alternativas hechas para ti.',
            placement: 'bottom',
        },
        {
            id: 'why',
            targetId: 'tutorial-why-btn',
            title: 'Explicación',
            content: 'Una vez armado tu horario, puedes presionar este botón para ver por qué se recomienda ese horario y consejos específicos creados por nuestro agente AI.',
            placement: 'bottom',
            isLast: true,
        },
    ];

    useEffect(() => {
        const completed = localStorage.getItem('unitrack_tutorial_completed');
        if (!completed && location.pathname === '/home') {
            setIsActive(true);
        }
    }, [location.pathname]);

    const nextStep = () => {
        const currentStep = steps[currentStepIndex];
        if (currentStep.action) {
            currentStep.action();
        }

        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex((prev) => prev + 1);
        } else {
            finishTutorial();
        }
    };

    const skipTutorial = () => {
        finishTutorial();
    };

    const finishTutorial = () => {
        setIsActive(false);
        localStorage.setItem('unitrack_tutorial_completed', 'true');
        setCurrentStepIndex(0);
    };

    const value = {
        isActive,
        currentStepIndex,
        currentStep: steps[currentStepIndex],
        nextStep,
        skipTutorial,
        totalSteps: steps.length,
    };

    return (
        <TutorialContext.Provider value={value}>
            {children}
        </TutorialContext.Provider>
    );
};
