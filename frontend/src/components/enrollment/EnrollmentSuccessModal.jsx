import React from 'react';

export default function EnrollmentSuccessModal({
    isOpen,
    onClose,
    coursesCount,
    totalCredits
}) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
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
                        Has sido matriculado en <span className="font-semibold">{coursesCount}</span> curso(s) con un total de <span className="font-semibold">{totalCredits}</span> créditos.
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
                    onClick={onClose}
                    className="w-full rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 transition"
                >
                    Entendido
                </button>
            </div>
        </div>
    );
}
