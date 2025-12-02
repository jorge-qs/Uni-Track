import React from 'react';
import { formatCourseName } from '../../utils/courseNameFormatter';

export default function EnrollmentConfirmModal({
    isOpen,
    onClose,
    courses,
    totalCredits,
    onConfirm,
    isEnrolling
}) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
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
                    {courses.map((course) => (
                        <div key={course.code} className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                            <div>
                                <p className="font-semibold text-utec-text">{course.code}</p>
                                <p className="text-xs text-utec-muted">{formatCourseName(course.name)}</p>
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
                        onClick={onClose}
                        className="flex-1 rounded-lg border border-utec-border px-4 py-2 font-semibold text-utec-text hover:bg-gray-50 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isEnrolling}
                        className="flex-1 rounded-lg bg-utec-blue px-4 py-2 font-semibold text-white hover:bg-blue-700 transition disabled:bg-gray-400"
                    >
                        {isEnrolling ? 'Procesando...' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
