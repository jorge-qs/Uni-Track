import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTutorial } from '../context/TutorialContext';

export default function TutorialOverlay() {
    const { isActive, currentStep, nextStep, skipTutorial, currentStepIndex, totalSteps } = useTutorial();
    const [targetRect, setTargetRect] = useState(null);
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!isActive || !currentStep) return;

        if (!currentStep.targetId) {
            setTargetRect(null); // Center modal
            return;
        }

        const updateRect = () => {
            const element = document.getElementById(currentStep.targetId);
            if (element) {
                const rect = element.getBoundingClientRect();
                setTargetRect({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                    bottom: rect.bottom,
                    right: rect.right,
                });
            } else {
                // Retry if element not found immediately (e.g., during navigation)
                setTimeout(updateRect, 500);
            }
        };

        updateRect();
        // Also retry a bit later to catch animations
        const timer = setTimeout(updateRect, 300);
        return () => clearTimeout(timer);

    }, [isActive, currentStep, windowSize]);

    if (!isActive) return null;

    // Render Portal
    return createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden">
            {/* Backdrop with hole */}
            {targetRect ? (
                <>
                    {/* Top */}
                    <div
                        className="absolute bg-black/60 transition-all duration-300 ease-in-out"
                        style={{ top: 0, left: 0, right: 0, height: targetRect.top }}
                    />
                    {/* Bottom */}
                    <div
                        className="absolute bg-black/60 transition-all duration-300 ease-in-out"
                        style={{ top: targetRect.bottom, left: 0, right: 0, bottom: 0 }}
                    />
                    {/* Left */}
                    <div
                        className="absolute bg-black/60 transition-all duration-300 ease-in-out"
                        style={{ top: targetRect.top, left: 0, width: targetRect.left, height: targetRect.height }}
                    />
                    {/* Right */}
                    <div
                        className="absolute bg-black/60 transition-all duration-300 ease-in-out"
                        style={{ top: targetRect.top, left: targetRect.right, right: 0, height: targetRect.height }}
                    />
                    {/* Highlight Border */}
                    <div
                        className="absolute border-2 border-utec-blue shadow-[0_0_0_4px_rgba(37,99,235,0.3)] transition-all duration-300 ease-in-out pointer-events-none"
                        style={{
                            top: targetRect.top,
                            left: targetRect.left,
                            width: targetRect.width,
                            height: targetRect.height,
                            borderRadius: '8px',
                        }}
                    />
                </>
            ) : (
                // Full backdrop for center modal
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            )}

            {/* Tooltip Card */}
            <div
                className="absolute flex flex-col gap-3 rounded-xl bg-white p-6 shadow-2xl transition-all duration-300 ease-in-out"
                style={{
                    ...(targetRect
                        ? getTooltipPosition(targetRect, currentStep.placement, currentStep.width)
                        : {
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            maxWidth: currentStep.width ? `${currentStep.width}px` : '400px',
                            width: '90%',
                        }),
                }}
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">{currentStep.title}</h3>
                    <span className="text-xs font-medium text-gray-400">
                        {currentStepIndex + 1} / {totalSteps}
                    </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                    {currentStep.content}
                </p>
                <div className="mt-2 flex items-center justify-between gap-4">
                    <button
                        onClick={skipTutorial}
                        className="text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                        {currentStep.hasSkip ? 'Omitir' : 'Salir'}
                    </button>
                    <button
                        onClick={nextStep}
                        className="rounded-lg bg-utec-blue px-4 py-2 text-sm font-semibold text-white shadow-md transition-transform hover:scale-105 hover:bg-blue-700 active:scale-95"
                    >
                        {currentStep.nextLabel || (currentStep.isLast ? 'Finalizar' : 'Siguiente')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

function getTooltipPosition(rect, placement, customWidth) {
    const gap = 16;
    const width = customWidth || 320; // Default width

    switch (placement) {
        case 'right':
            return {
                top: rect.top + rect.height / 2 - 100, // Vertically centered-ish
                left: rect.right + gap,
                width: width,
            };
        case 'left':
            return {
                top: rect.top + rect.height / 2 - 100,
                left: rect.left - width - gap,
                width: width,
            };
        case 'bottom':
            return {
                top: rect.bottom + gap,
                left: rect.left + rect.width / 2 - width / 2,
                width: width,
            };
        case 'top':
            return {
                top: rect.top - gap - 200, // Estimated height
                left: rect.left + rect.width / 2 - width / 2,
                width: width,
            };
        default:
            return {
                top: rect.bottom + gap,
                left: rect.left,
                width: width,
            };
    }
}
