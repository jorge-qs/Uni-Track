import React from 'react';

const HOUR_HEIGHT = 60;
const START_HOUR = 7;
const END_HOUR = 22;

const hourLabels = Array.from({ length: END_HOUR - START_HOUR }, (_, idx) => START_HOUR + idx);
const gridLines = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, idx) => idx);

const daysOfWeek = [
    { key: 'monday', label: 'Lunes', shortLabel: 'Lun' },
    { key: 'tuesday', label: 'Martes', shortLabel: 'Mar' },
    { key: 'wednesday', label: 'Miercoles', shortLabel: 'Mie' },
    { key: 'thursday', label: 'Jueves', shortLabel: 'Jue' },
    { key: 'friday', label: 'Viernes', shortLabel: 'Vie' },
    { key: 'saturday', label: 'Sábado', shortLabel: 'Sab' },
];

const parseTimeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const formatHourLabel = (hour) => {
    const suffix = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:00 ${suffix}`;
};

const computeEventPosition = (start, end) => {
    const startMinutes = parseTimeToMinutes(start);
    const endMinutes = parseTimeToMinutes(end);
    const startOffset = Math.max(startMinutes - START_HOUR * 60, 0);
    const eventDuration = Math.max(endMinutes - startMinutes, 30);

    const top = (startOffset / 60) * HOUR_HEIGHT;
    const height = Math.max((eventDuration / 60) * HOUR_HEIGHT - 6, 44);

    return { top, height };
};

const formatGrade = (grade) => {
    if (grade == null) return '-';
    return Number.isInteger(grade) ? grade : Number(grade).toFixed(1);
};

export default function ScheduleCalendar({
    events,
    onEventClick,
    matriculaPredictions,
    loadingPredictions
}) {
    if (events.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-utec-border bg-gray-50 p-6 text-center text-sm text-utec-muted">
                Aun no hay cursos en el plan. Agrega cursos desde la columna izquierda para
                llenar el calendario.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <div className="flex min-w-[900px] rounded-xl border border-utec-border">
                <div className="w-20 border-r border-utec-border bg-gray-50">
                    <div className="h-12 border-b border-utec-border" />
                    {hourLabels.map((hour) => (
                        <div
                            key={`label-${hour}`}
                            className="flex h-[60px] items-start justify-end pr-2 text-[11px] font-semibold uppercase text-utec-muted"
                        >
                            {formatHourLabel(hour)}
                        </div>
                    ))}
                </div>
                {daysOfWeek.map((day) => {
                    const dayEvents = events.filter(
                        (event) => event.day === day.key,
                    );
                    return (
                        <div key={day.key} className="flex-1 border-l border-utec-border">
                            <div className="flex h-12 items-center justify-center border-b border-utec-border bg-gray-50 text-xs font-semibold uppercase text-utec-muted">
                                {day.label}
                            </div>
                            <div
                                className="relative"
                                style={{ height: `${(END_HOUR - START_HOUR) * HOUR_HEIGHT}px` }}
                            >
                                <div className="absolute inset-0">
                                    {gridLines.map((line) => (
                                        <div
                                            key={`${day.key}-line-${line}`}
                                            className="absolute left-0 right-0 border-t border-dashed border-utec-border/70"
                                            style={{ top: `${line * HOUR_HEIGHT}px` }}
                                        />
                                    ))}
                                </div>
                                {dayEvents.map((event, eventIdx) => {
                                    const { top, height } = computeEventPosition(
                                        event.start,
                                        event.end,
                                    );
                                    const predictedGrade = matriculaPredictions[event.code];
                                    const gradeLabel = loadingPredictions
                                        ? ''
                                        : predictedGrade != null
                                            ? `${formatGrade(predictedGrade)}`
                                            : '';
                                    return (
                                        <button
                                            key={`${event.code}-${event.start}-${event.end}-${eventIdx}`}
                                            onClick={() => onEventClick(event)}
                                            className="absolute left-[8%] right-[8%] rounded-xl p-2 text-xs text-white shadow-lg hover:shadow-xl transition cursor-pointer"
                                            style={{ top, height, backgroundColor: event.color }}
                                        >
                                            <p className="text-sm font-bold truncate">
                                                {event.code}
                                            </p>
                                            <p className="font-mono text-[10px] opacity-90">
                                                {gradeLabel}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
