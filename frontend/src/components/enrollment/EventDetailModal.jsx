import React from 'react';
import { formatCourseName } from '../../utils/courseNameFormatter';

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

const formatGrade = (grade) => {
    if (grade == null) return '-';
    return Number.isInteger(grade) ? grade : Number(grade).toFixed(1);
};

export default function EventDetailModal({
    event,
    onClose,
    matriculaPredictions,
    loadingPredictions
}) {
    if (!event) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-2xl border border-utec-border bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-utec-text">
                            {event.code}
                        </h3>
                        <p className="text-sm text-utec-muted">{formatCourseName(event.name)}</p>
                    </div>
                    <button
                        onClick={onClose}
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
                            {daysOfWeek.find(d => d.key === event.day)?.label} - {formatEventRange(event.start, event.end)}
                        </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="material-symbols-outlined text-utec-blue">location_on</span>
                            <span className="font-semibold">Ubicación:</span>
                        </div>
                        <p className="mt-1 text-sm text-utec-muted ml-7">{event.location}</p>
                    </div>

                    {event.docente && (
                        <div className="rounded-lg bg-gray-50 p-3">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="material-symbols-outlined text-utec-blue">person</span>
                                <span className="font-semibold">Docente:</span>
                            </div>
                            <p className="mt-1 text-sm text-utec-muted ml-7">{event.docente}</p>
                        </div>
                    )}

                    {event.sectionName && (
                        <div className="rounded-lg bg-gray-50 p-3">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="material-symbols-outlined text-utec-blue">group</span>
                                <span className="font-semibold">Sección:</span>
                            </div>
                            <p className="mt-1 text-sm text-utec-muted ml-7">{event.sectionName}</p>
                        </div>
                    )}

                    {event.grade !== null && (
                        <div className="rounded-lg bg-emerald-50 p-3">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="material-symbols-outlined text-emerald-600">grade</span>
                                <span className="font-semibold text-emerald-700">Nota estimada (individual):</span>
                            </div>
                            <p className="mt-1 text-lg font-bold text-emerald-700 ml-7">
                                {formatGrade(event.grade)}/20
                            </p>
                        </div>
                    )}

                    {matriculaPredictions[event.code] && (
                        <div className="rounded-lg bg-purple-50 p-3 border-2 border-purple-200">
                            <div className="flex items-center gap-2 text-sm mb-1">
                                <span className="material-symbols-outlined text-purple-600">psychology</span>
                                <span className="font-semibold text-purple-700">Nota predicha (con matrícula):</span>
                            </div>
                            <p className="text-lg font-bold text-purple-700 ml-7">
                                {formatGrade(matriculaPredictions[event.code])}/20
                            </p>
                            <p className="text-xs text-purple-600 mt-2 ml-7">
                                {loadingPredictions ? (
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
                    onClick={onClose}
                    className="mt-6 w-full rounded-lg bg-utec-blue px-4 py-2 text-white font-semibold hover:bg-blue-700 transition"
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
}
