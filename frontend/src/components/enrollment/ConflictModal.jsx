import React from 'react';

export default function ConflictModal({
    conflictData,
    onClose,
    onConfirm
}) {
    if (!conflictData) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
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
                            El curso <span className="font-semibold">{conflictData.course.code} - {conflictData.course.name}</span> tiene horarios que se solapan con:
                        </p>
                    </div>
                </div>

                <div className="mb-6 space-y-2 rounded-lg bg-red-50 p-4">
                    {conflictData.conflicts.map((conflict, idx) => (
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
                        onClick={onClose}
                        className="flex-1 rounded-lg border border-utec-border px-4 py-2 font-semibold text-utec-text hover:bg-gray-50 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 transition"
                    >
                        Agregar de todos modos
                    </button>
                </div>
            </div>
        </div>
    );
}
