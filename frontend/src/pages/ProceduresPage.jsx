import { useState } from 'react';

const procedureTypes = [
  { value: 'certificate', label: 'Solicitud de certificado' },
  { value: 'withdrawal', label: 'Retiro de curso' },
  { value: 'reconsideration', label: 'Reconsideración de nota' },
  { value: 'other', label: 'Otro trámite' },
];

const priorityOptions = [
  { value: 'normal', label: 'Normal (5 - 7 días hábiles)' },
  { value: 'high', label: 'Alta (2 - 3 días hábiles)' },
  { value: 'urgent', label: 'Urgente (requiere sustento)' },
];

const activeRequests = [
  {
    id: '#TRM-00124',
    type: 'Certificado de estudios',
    date: '2025-10-26',
    status: 'Approved',
    statusColor: 'bg-green-100 text-green-700',
  },
  {
    id: '#TRM-00123',
    type: 'Retiro de curso',
    date: '2025-10-22',
    status: 'In Review',
    statusColor: 'bg-amber-100 text-amber-700',
  },
  {
    id: '#TRM-00121',
    type: 'Constancia de matrícula',
    date: '2025-09-15',
    status: 'Rejected',
    statusColor: 'bg-red-100 text-red-700',
  },
];

export default function ProceduresPage() {
  const [form, setForm] = useState({
    procedure: 'certificate',
    priority: 'normal',
    description: '',
    attachments: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    alert('Tu solicitud ha sido registrada. Pronto recibirás una confirmación.');
    setForm((prev) => ({ ...prev, description: '', attachments: '' }));
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-utec-text">Procedures</h1>
        <p className="text-sm text-utec-muted">
          Gestiona tus trámites académicos y administrativos desde un único
          formulario. Adjunta la documentación necesaria y realiza seguimiento en
          tiempo real.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-utec-border bg-white p-6 shadow-sm lg:col-span-2"
        >
          <div>
            <h2 className="text-lg font-semibold text-utec-text">
              Nueva solicitud de trámite
            </h2>
            <p className="text-sm text-utec-muted">
              Completa la información requerida. Recibirás una confirmación al
              correo institucional.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="procedure"
                className="text-sm font-semibold text-utec-text"
              >
                Tipo de trámite
              </label>
              <select
                id="procedure"
                name="procedure"
                value={form.procedure}
                onChange={handleChange}
                className="w-full rounded-lg border border-utec-border bg-white px-3 py-3 text-sm text-utec-text shadow-sm focus:border-utec-blue focus:outline-none focus:ring-2 focus:ring-utec-blue/30"
              >
                {procedureTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="priority"
                className="text-sm font-semibold text-utec-text"
              >
                Prioridad
              </label>
              <select
                id="priority"
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full rounded-lg border border-utec-border bg-white px-3 py-3 text-sm text-utec-text shadow-sm focus:border-utec-blue focus:outline-none focus:ring-2 focus:ring-utec-blue/30"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="description"
              className="text-sm font-semibold text-utec-text"
            >
              Descripción y sustento
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe tu solicitud e incluye fechas, cursos o cualquier información que ayude a agilizar el proceso."
              className="w-full rounded-lg border border-utec-border bg-white px-3 py-3 text-sm text-utec-text shadow-sm focus:border-utec-blue focus:outline-none focus:ring-2 focus:ring-utec-blue/30"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="attachments"
              className="text-sm font-semibold text-utec-text"
            >
              Adjuntos (enlaces o referencias)
            </label>
            <input
              id="attachments"
              name="attachments"
              value={form.attachments}
              onChange={handleChange}
              placeholder="Ej. https://drive.google.com/..."
              className="w-full rounded-lg border border-utec-border bg-white px-3 py-3 text-sm text-utec-text shadow-sm focus:border-utec-blue focus:outline-none focus:ring-2 focus:ring-utec-blue/30"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-utec-red px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-utec-red/40"
            >
              Enviar solicitud
            </button>
            <span className="text-sm text-utec-muted">
              Tiempo estimado de respuesta: 3 - 5 días hábiles.
            </span>
          </div>
        </form>

        <aside className="space-y-6 rounded-2xl border border-utec-border bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-utec-text">
              Trámites en curso
            </h2>
            <p className="text-sm text-utec-muted">
              Revisa el estado de las solicitudes que se encuentran activas.
            </p>
          </div>
          <div className="space-y-4">
            {activeRequests.map((request) => (
              <div key={request.id} className="rounded-xl border border-utec-border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-utec-text">
                    {request.id}
                  </p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${request.statusColor}`}
                  >
                    {request.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-utec-text">{request.type}</p>
                <p className="text-xs text-utec-muted">
                  Registrado el {new Date(request.date).toLocaleDateString()}
                </p>
                <button
                  type="button"
                  className="mt-3 text-sm font-semibold text-utec-blue hover:underline"
                >
                  Ver detalle
                </button>
              </div>
            ))}
          </div>
          <div className="space-y-2 rounded-xl bg-blue-50 p-4 text-sm text-utec-secondary">
            <p className="font-semibold text-utec-blue">Recomendaciones:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Adjunta documentación en formato PDF para acelerar la evaluación.
              </li>
              <li>Los trámites urgentes requieren sustento de coordinación.</li>
              <li>
                Para consultas adicionales escribe a{' '}
                <a
                  href="mailto:tramites@utec.edu.pe"
                  className="font-semibold text-utec-blue underline"
                >
                  tramites@utec.edu.pe
                </a>
                .
              </li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
