
import { useMemo, useState } from "react";
import { getStoredLogin } from "../api/api";

const statusLabels = {
  approved: { text: "Approved", color: "bg-green-100 text-green-700" },
  failed: { text: "Failed", color: "bg-red-100 text-red-700" },
  missing: { text: "Missing", color: "bg-amber-100 text-amber-700" },
};

const typeLabels = {
  O: "Obligatorio",
  EH: "Electivo de humanidades",
  EP: "Electivo de carrera",
};

const normalizePrereqs = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    return value
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
      .filter(Boolean);
  }
  return [];
};

export default function CurriculumPage() {
  const [viewMode, setViewMode] = useState("cycle");
  const storedLogin = getStoredLogin();
  const cursosInfo = storedLogin?.cursos_info ?? [];
  const matriculaInfo = storedLogin?.matricula_info ?? {};
  const academicInfo = storedLogin?.academic_info ?? {};

  const statusByCourse = useMemo(() => {
    const map = {};
    if (matriculaInfo && typeof matriculaInfo === "object") {
      Object.values(matriculaInfo).forEach((periodo) => {
        const cursosPeriodo = periodo?.cursos ?? [];
        cursosPeriodo.forEach((curso) => {
          const code = curso?.cod_curso;
          if (!code) return;
          const nota = Number(curso?.nota);
          if (!Number.isNaN(nota) && nota >= 11) {
            map[code] = "approved";
          } else if (map[code] !== "approved") {
            map[code] = "failed";
          }
        });
      });
    }
    return map;
  }, [matriculaInfo]);

  const normalizedCourses = useMemo(() => {
    return cursosInfo.map((course) => {
      const level = course?.nivel_curso ?? "Sin ciclo";
      const levelNumber = Number(level);
      const cycleLabel = Number.isFinite(levelNumber)
        ? `Ciclo ${levelNumber}`
        : `Ciclo ${level}`;

      return {
        code: course?.cod_curso ?? "SIN-COD",
        name: course?.curso ?? "Curso sin nombre",
        credits: course?.creditos ?? 0,
        family: course?.familia ?? "N/D",
        type: course?.tipo ?? "O",
        typeLabel: typeLabels[course?.tipo] ?? "Curso",
        hours: course?.horas ?? null,
        prerequisites: normalizePrereqs(course?.prerequisitos),
        description: course?.descripcion,
        levelNumber: Number.isFinite(levelNumber) ? levelNumber : level,
        cycleLabel,
        status: statusByCourse[course?.cod_curso] ?? "missing",
      };
    });
  }, [cursosInfo, statusByCourse]);

  const coursesByCycle = useMemo(() => {
    const grouped = normalizedCourses.reduce((acc, course) => {
      const key =
        typeof course.levelNumber === "number"
          ? course.levelNumber
          : course.levelNumber ?? "Sin ciclo";
      if (!acc[key]) {
        acc[key] = {
          cycle: course.cycleLabel,
          order: typeof course.levelNumber === "number" ? course.levelNumber : 999,
          courses: [],
        };
      }
      acc[key].courses.push(course);
      return acc;
    }, {});

    return Object.values(grouped)
      .sort((a, b) => a.order - b.order)
      .map((group) => ({
        cycle: group.cycle,
        courses: group.courses.sort((a, b) => a.code.localeCompare(b.code)),
      }));
  }, [normalizedCourses]);

  const coursesByStatus = useMemo(() => {
    const grouped = normalizedCourses.reduce((acc, course) => {
      const status = course.status ?? "missing";
      acc[status] = acc[status] || [];
      acc[status].push(course);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([status, courses]) => ({
        cycle: statusLabels[status]?.text ?? status,
        statusKey: status,
        courses,
      }))
      .filter((group) => group.courses.length > 0);
  }, [normalizedCourses]);

  const filteredCourses =
    viewMode === "status" ? coursesByStatus : coursesByCycle;

  const approvedCredits =
    typeof academicInfo?.creditos_aprobados === "number"
      ? academicInfo.creditos_aprobados
      : 0;
  const totalCoursesApproved =
    typeof academicInfo?.cursos_aprobados === "number"
      ? academicInfo.cursos_aprobados
      : 0;
  const progress = Math.min(
    100,
    Math.round(((approvedCredits || 0) / 200) * 100) || 0
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-utec-text">Curriculum</h1>
        <p className="mt-1 text-sm text-utec-muted">
        Consulta tu avance academico y los cursos pendientes por ciclo.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-utec-border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-utec-muted">
          Progreso General
        </p>
        <p className="mt-2 text-2xl font-bold text-utec-text">{progress}%</p>
        <p className="text-xs text-utec-muted">
          {approvedCredits} creditos aprobados de 200.
        </p>
        </div>
        <div className="rounded-2xl border border-utec-border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-utec-muted">
          Aprobado / Total
        </p>
        <p className="mt-2 text-2xl font-bold text-utec-text">
          {totalCoursesApproved} / {" "}
          {normalizedCourses.length}
        </p>
        <p className="text-xs text-utec-muted">
          Cursos completados vs por completar.
        </p>
        </div>
      </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-utec-border bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-medium text-utec-text">
        Vista del plan de estudios
        </p>
        <p className="text-sm text-utec-muted">
        Cambia la visualizacion para analizar por ciclo o estado.
        </p>
      </div>
      <div className="flex gap-3">
        <button
        type="button"
        onClick={() => setViewMode("cycle")}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
          viewMode === "cycle"
          ? "bg-utec-blue text-white"
          : "border border-utec-border bg-white text-utec-muted hover:bg-gray-50"
        }`}
        >
        Por ciclo
        </button>
        <button
        type="button"
        onClick={() => setViewMode("status")}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
          viewMode === "status"
          ? "bg-utec-blue text-white"
          : "border border-utec-border bg-white text-utec-muted hover:bg-gray-50"
        }`}
        >
        Por estado
        </button>
      </div>
      </div>

      <div className="space-y-6">
      {filteredCourses.map((group) => (
        <div key={group.cycle} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-utec-text">{group.cycle}</h2>
          <span className="text-sm font-medium text-utec-muted">
          {group.courses.length} cursos
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {group.courses.map((course) => (
          <div
            key={`${group.cycle}-${course.code}`}
            className="flex flex-col gap-3 rounded-2xl border border-utec-border bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-utec-text">{course.code}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
              statusLabels[course.status]?.color ?? "bg-gray-100 text-gray-700"
              }`}
            >
              {statusLabels[course.status]?.text ?? course.status}
            </span>
            </div>
            <p className="text-base font-semibold text-utec-text">
            {course.name}
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-utec-muted">
            <span>Creditos: {course.credits}</span>
            <span>Horas: {course.hours ?? "N/D"}</span>
            <span>{course.typeLabel}</span>
            </div>
            {course.description ? (
            <p className="text-sm text-utec-muted">{course.description}</p>
            ) : null}
            <div className="text-xs text-utec-muted">
            <p className="font-semibold text-utec-secondary">Prerequisitos</p>
            {course.prerequisites.length > 0 ? (
              <ul className="mt-1 list-none pl-0">
              {course.prerequisites.map((prereq) => (
                <li key={`${course.code}-${prereq}`} className="mt-1">
                {prereq}
                </li>
              ))}
              </ul>
            ) : (
              <p className="mt-1">Sin prerequisitos</p>
            )}
            </div>
          </div>
          ))}
        </div>
        </div>
      ))}
      </div>
    </div>
    );
}
