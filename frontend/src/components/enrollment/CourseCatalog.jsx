import React from 'react';

const daysOfWeek = [
    { key: 'monday', label: 'Lunes', shortLabel: 'Lun' },
    { key: 'tuesday', label: 'Martes', shortLabel: 'Mar' },
    { key: 'wednesday', label: 'Miercoles', shortLabel: 'Mie' },
    { key: 'thursday', label: 'Jueves', shortLabel: 'Jue' },
    { key: 'friday', label: 'Viernes', shortLabel: 'Vie' },
    { key: 'saturday', label: 'Sábado', shortLabel: 'Sab' },
];

const formatEventRange = (start, end) => {
    const toReadable = (time) => {
        const [h, m] = time.split(':').map(Number);
        const suffix = h >= 12 ? 'pm' : 'am';
        const hour = h % 12 === 0 ? 12 : h % 12;
        return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`;
    };
    return `${toReadable(start)} - ${toReadable(end)}`;
};

export default function CourseCatalog({
    courses,
    selectedCodes,
    onToggleCourse,
    onSectionChange,
    loadingPredictions,
    onEnroll,
    isEnrolling,
    totalCredits,
    selectedCoursesCount
}) {
    return (
        <div
            id="tutorial-course-catalog"
            className="flex w-full flex-col rounded-2xl border border-utec-border bg-white shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden lg:flex-[0.35]"
            style={{ height: 'calc(100vh - 140px)' }}
        >
            <div className="flex items-center justify-between p-6 pb-4">
                <div>
                    <h2 className="text-lg font-semibold text-utec-text">Cursos disponibles</h2>
                    <p className="text-sm text-utec-muted">
                        {selectedCoursesCount} en plan - {totalCredits} creditos seleccionados
                    </p>
                </div>
                <span className="text-sm text-utec-muted">
                    {courses.length} opciones
                </span>
            </div>
            {loadingPredictions && (
                <div className="mx-6 rounded-lg bg-blue-50 p-3 text-sm text-utec-blue">
                    <span className="material-symbols-outlined text-base mr-2 inline-block">info</span>
                    Calculando notas estimadas con IA...
                </div>
            )}
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                {courses.map((course, index) => {
                    const isSelected = selectedCodes.has(course.code);
                    return (
                        <div
                            key={course.code}
                            className={`space-y-3 rounded-xl border p-4 transition ${isSelected ? 'border-utec-blue shadow-[0_8px_30px_rgba(37,99,235,0.25)]' : 'border-utec-border shadow-[0_4px_15px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.12)]'
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
                                        <span
                                            id={index === 0 ? 'tutorial-risk-category' : undefined}
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${course.riskCategory === 'Riesgo' ? 'bg-red-100 text-red-700' :
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
                                        onChange={(e) => onSectionChange(course.code, parseInt(e.target.value))}
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
                                    onClick={() => onToggleCourse(course)}
                                    className={`text-sm font-semibold transition ${isSelected
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
            {selectedCoursesCount > 0 && (
                <div className="px-6 pb-6 pt-4 border-t border-utec-border">
                    <button
                        type="button"
                        onClick={onEnroll}
                        disabled={isEnrolling}
                        className={`w-full rounded-lg px-6 py-3 text-center font-semibold text-white transition ${isEnrolling
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-utec-blue hover:bg-blue-700'
                            }`}
                    >
                        {isEnrolling ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></span>
                                Procesando matrícula...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-xl">check_circle</span>
                                Confirmar matrícula ({selectedCoursesCount} curso{selectedCoursesCount !== 1 ? 's' : ''} - {totalCredits} créditos)
                            </span>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
