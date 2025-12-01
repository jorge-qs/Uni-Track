import React from 'react';

const scheduleDaysOrder = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

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

const getScheduleDayLabel = (dayKey) => {
    if (!dayKey) return 'Dia';
    const normalized = dayKey.replace('.', '');
    return dayNameMap[dayKey] || dayNameMap[normalized] || dayKey;
};

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

export default function RecommendationModal({
    isOpen,
    onClose,
    recommendationData,
    onApply,
    courseCatalog
}) {
    if (!isOpen || !recommendationData) return null;

    const bestRecommendedSchedule =
        recommendationData?.mejor_recomendacion ??
        recommendationData?.todos_los_resultados?.[0] ??
        null;

    const otherRecommendedSchedules = recommendationData?.todos_los_resultados
        ? recommendationData.todos_los_resultados.filter(
            (plan) =>
                !bestRecommendedSchedule || plan.id !== bestRecommendedSchedule.id
        )
        : [];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
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
                            Analizamos {recommendationData.meta?.total_evaluados ?? 0} opciones usando IA
                        </p>
                    </div>
                    <button
                        onClick={onClose}
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
                                onClick={() => onApply(bestRecommendedSchedule)}
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
                                    onClick={() => onApply(plan)}
                                    className="mt-4 w-full rounded-lg border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50 transition"
                                >
                                    Aplicar este horario
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Mensaje del sistema */}
                {recommendationData.mensaje && (
                    <div className="mb-4 rounded-lg bg-blue-50 p-3">
                        <p className="text-sm text-utec-text">{recommendationData.mensaje}</p>
                    </div>
                )}

                <button
                    onClick={onClose}
                    className="w-full rounded-lg border border-utec-border px-4 py-2 font-semibold text-utec-text hover:bg-gray-50 transition"
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
}
