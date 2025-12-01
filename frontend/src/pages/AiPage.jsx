import React from 'react';

const HorarioModal = ({ showExplanation, setShowExplanation, data }) => {
  if (!showExplanation) return null;

  // Evitamos renderizar si no hay datos aún
  if (!data) return null;

  // Desestructuramos para facilitar el acceso, con fallbacks seguros
  const { title, sections, tips } = data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity">
      {/* Caja del Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Encabezado */}
        <div className="bg-utec-blue px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined">analytics</span>
            {title || "Análisis de Horario"}
          </h3>
          <button 
            onClick={() => setShowExplanation(false)}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1 transition"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="p-6 max-h-[70vh] overflow-y-auto text-gray-700 space-y-6">
          
          {/* 1. SECCIÓN: BALANCE (Carga Cognitiva) */}
          {sections?.balance && (
            <div className="space-y-2">
              <h4 className="font-bold text-utec-blue flex items-center gap-2">
                {sections.balance.title}
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-sm leading-relaxed text-gray-800">
                  {sections.balance.content}
                </p>
                {sections.balance.note && (
                  <div className="mt-2 flex items-start gap-2 text-sm text-gray-500 italic">
                    <span className="material-symbols-outlined text-base">info</span>
                    <span>{sections.balance.note}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. SECCIÓN: DÍA DESTACADO (Highlight Day) */}
          {sections?.highlightDay && (
            <div 
              className={`p-4 rounded-lg border flex items-start gap-3 ${
                sections.highlightDay.style === 'warning' 
                  ? 'bg-red-50 border-red-100 text-red-900' 
                  : 'bg-blue-50 border-blue-100 text-blue-900'
              }`}
            >
              <span className={`material-symbols-outlined ${
                 sections.highlightDay.style === 'warning' ? 'text-red-500' : 'text-blue-500'
              }`}>
                {sections.highlightDay.style === 'warning' ? 'warning' : 'event_available'}
              </span>
              <div>
                <h4 className="font-bold text-sm mb-1">{sections.highlightDay.title}</h4>
                <p className="text-sm opacity-90">
                  {sections.highlightDay.content}
                </p>
              </div>
            </div>
          )}

          {/* 3. SECCIÓN: HUECOS (Gaps) */}
          {sections?.gaps && (
            <div>
              <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                {sections.gaps.title}
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                {sections.gaps.mainText}
              </p>
              
              <div className="pl-4 border-l-4 border-utec-blue bg-gray-50/50 py-2 pr-2 rounded-r">
                <p className="text-sm text-gray-700">
                  <span className="font-bold text-utec-blue block mb-1">
                    {sections.gaps.reasonTitle}
                  </span> 
                  {sections.gaps.reasonText}
                </p>
              </div>
            </div>
          )}

          <hr className="border-gray-100" />

          {/* 4. SECCIÓN: TIPS / RECOMENDACIONES */}
          {tips && tips.items?.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {tips.title}
              </h4>
              
              <div className="grid gap-3">
                {tips.items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className={`p-2 rounded-full bg-white shadow-sm border border-gray-100 shrink-0`}>
                      <span className={`material-symbols-outlined text-xl ${item.color}`}>
                        {item.icon}
                      </span>
                    </div>
                    <div className="text-sm pt-1">
                      <span className="font-bold text-gray-900 mr-1">
                        {item.boldText}
                      </span>
                      <span className="text-gray-600">
                        {item.text}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
          <button 
            onClick={() => setShowExplanation(false)}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-semibold transition transform active:scale-95"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
}

export default HorarioModal;