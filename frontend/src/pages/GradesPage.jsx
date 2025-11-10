
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getStoredLogin } from "../api/api";

const formatNumber = (value, digits = 2) =>
  typeof value === "number" ? value.toFixed(digits) : "--";

export default function GradesPage() {
  const storedLogin = getStoredLogin();
  const academicInfo = storedLogin?.academic_info ?? {};
  const matriculaInfo = storedLogin?.matricula_info ?? {};

  const periods = useMemo(() => {
    if (!matriculaInfo || typeof matriculaInfo !== "object") {
      return [];
    }
    return Object.entries(matriculaInfo)
      .map(([period, data]) => ({
        period,
        cant_creditos: data?.cant_creditos ?? 0,
        cursos_aprobados: data?.cursos_aprobados ?? 0,
        promedio_periodo:
          typeof data?.promedio_periodo === "number"
            ? data.promedio_periodo
            : null,
        cursos: Array.isArray(data?.cursos) ? data.cursos : [],
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [matriculaInfo]);

  const chartData = useMemo(
    () =>
      periods.map((item) => ({
        period: item.period,
        promedio: item.promedio_periodo,
      })),
    [periods]
  );

  const approvedCredits =
    typeof academicInfo?.creditos_aprobados === "number"
      ? academicInfo.creditos_aprobados
      : 0;
  const promedioGeneral =
    typeof academicInfo?.promedio_general === "number"
      ? academicInfo.promedio_general
      : null;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
      <h1 className="text-3xl font-bold text-utec-text">My Grades</h1>
      <p className="text-sm text-utec-muted">
        Revisa tus calificaciones por ciclo, tu promedio ponderado y el detalle
        de cada curso matriculado.
      </p>
      </header>

      <section className="rounded-2xl border border-utec-border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
        <h2 className="text-lg font-semibold text-utec-text">
          Evolucion de promedio por periodo
        </h2>
        <p className="text-sm text-utec-muted">
          Sigue la tendencia de tu rendimiento historico.
        </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-utec-border px-4 py-3">
          <p className="text-utec-muted">Creditos aprobados</p>
          <p className="text-xl font-semibold text-utec-text">
          {approvedCredits}
          </p>
        </div>
        <div className="rounded-xl border border-utec-border px-4 py-3">
          <p className="text-utec-muted">Promedio ponderado</p>
          <p className="text-xl font-semibold text-utec-text">
          {formatNumber(promedioGeneral)}
          </p>
        </div>
        </div>
      </div>
      <div className="mt-6 h-72 w-full">
        {chartData.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
          <defs>
            <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.7} />
            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="period" stroke="#6B7280" />
          <YAxis
            stroke="#6B7280"
            domain={[0, 20]}
            tickFormatter={(value) => value.toFixed(0)}
          />
          <Tooltip
            formatter={(value) =>
            typeof value === "number" ? value.toFixed(2) : "--"
            }
            labelFormatter={(label) => `Periodo ${label}`}
            contentStyle={{
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 8px 16px rgba(15, 23, 42, 0.08)",
            }}
          />
          <Area
            type="monotone"
            dataKey="promedio"
            stroke="#2563EB"
            fill="url(#avgGradient)"
            strokeWidth={2}
            isAnimationActive={false}
          />
          </AreaChart>
        </ResponsiveContainer>
        ) : (
        <div className="flex h-full items-center justify-center text-sm text-utec-muted">
          No hay datos de promedio por periodo.
        </div>
        )}
      </div>
      </section>

      <section className="rounded-2xl border border-utec-border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-utec-text">
        Calificaciones por periodo
        </h2>
        <span className="text-sm text-utec-muted">
        {periods.length} periodos registrados
        </span>
      </div>
      <div className="mt-6 space-y-6">
        {periods.length === 0 ? (
        <div className="rounded-xl border border-dashed border-utec-border p-6 text-center text-sm text-utec-muted">
          Aun no existen registros de matricula para mostrar.
        </div>
        ) : (
        periods.map((periodData) => (
          <div
          key={periodData.period}
          className="rounded-xl border border-utec-border p-5"
          >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
            <h3 className="text-lg font-semibold text-utec-text">
              Periodo {periodData.period}
            </h3>
            <p className="text-sm text-utec-muted">
              Resumen de cursos y creditos cursados.
            </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-utec-muted">Creditos cursados</p>
              <p className="text-base font-semibold text-utec-text">
              {periodData.cant_creditos}
              </p>
            </div>
            <div>
              <p className="text-utec-muted">Cursos aprobados</p>
              <p className="text-base font-semibold text-utec-text">
              {periodData.cursos_aprobados}
              </p>
            </div>
            <div>
              <p className="text-utec-muted">Promedio del periodo</p>
              <p className="text-base font-semibold text-utec-text">
              {formatNumber(periodData.promedio_periodo)}
              </p>
            </div>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-utec-border text-left text-sm">
            <thead>
              <tr className="text-utec-muted">
              <th className="px-4 py-3 font-semibold">Codigo</th>
              <th className="px-4 py-3 font-semibold">Curso</th>
              <th className="px-4 py-3 font-semibold">Nota</th>
              <th className="px-4 py-3 font-semibold">
                Inasistencia
              </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-utec-border text-utec-text">
              {periodData.cursos.length === 0 ? (
              <tr>
                <td
                colSpan={4}
                className="px-4 py-4 text-center text-utec-muted"
                >
                Sin cursos registrados en este periodo.
                </td>
              </tr>
              ) : (
              periodData.cursos.map((course) => (
                <tr key={`${periodData.period}-${course.cod_curso}`}>
                <td className="px-4 py-3 font-semibold">
                  {course.cod_curso}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">
                  {course.curso ?? "Curso sin nombre"}
                  </div>
                </td>
                <td
                  className={`px-4 py-3 font-semibold ${
                  typeof course.nota === "number" &&
                  course.nota < 10.5
                    ? "text-red-600"
                    : "text-utec-text"
                  }`}
                >
                  {typeof course.nota === "number"
                  ? course.nota.toFixed(1)
                  : "--"}
                </td>
                <td className="px-4 py-3 text-utec-muted">
                  {typeof course.hrs_inasistencia === "number"
                  ? `${course.hrs_inasistencia}%`
                  : "--"}
                </td>
                </tr>
              ))
              )}
            </tbody>
            </table>
          </div>
          </div>
        ))
        )}
      </div>
      </section>
    </div>
    );
}
