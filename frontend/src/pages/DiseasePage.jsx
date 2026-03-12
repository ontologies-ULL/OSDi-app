import React, { useState, useEffect } from 'react';
import { ArrowRight, Pencil, Stethoscope, Database, ShieldCheck, GitBranch } from 'lucide-react';
import OntologyFlowGraph from '../components/OntologyFlowGraph';
import DiseaseTabs from '../components/DiseaseTabs';

const DISEASE_SUBTYPES = [
  { id: 'InheritedDisease', label: 'Hereditaria', desc: 'Causada por variantes genéticas heredadas' },
  { id: 'RareDisease', label: 'Rara', desc: 'Prevalencia < 5 por 10.000 habitantes' },
  { id: 'InfectiousDisease', label: 'Infecciosa', desc: 'Causada por agentes patógenos externos (virus, bacterias, parásitos)' },
];

function DiseasePage({ onNavigate, currentPage, diseaseData, setDiseaseData, setDiseaseName, graphNodes = [], graphEdges = [], diseases = [], editingDiseaseIndex = null }) {
  const [formData, setFormData] = useState({
    label: diseaseData.label || '',
    comment: diseaseData.comment || '',
    selectedSubtypes: diseaseData.selectedSubtypes || [],
  });

  const [references, setReferences] = useState({
    hasRefToDO: diseaseData.references?.hasRefToDO || '',
    hasRefToICD: diseaseData.references?.hasRefToICD || '',
    hasRefToOMIM: diseaseData.references?.hasRefToOMIM || '',
    hasRefToSNOMED: diseaseData.references?.hasRefToSNOMED || ''
  });

  useEffect(() => {
    setDiseaseData({
      label: formData.label,
      comment: formData.comment,
      selectedSubtypes: formData.selectedSubtypes,
      selectedClasses: ['Disease', ...formData.selectedSubtypes],
      datatypeProperties: [],
      objectProperties: [],
      references,
    });
    if (setDiseaseName) setDiseaseName(formData.label);
  }, [formData, references, setDiseaseData]);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleReferenceChange = (e) => setReferences({ ...references, [e.target.name]: e.target.value });

  const handleSubtypeToggle = (id) => {
    setFormData(prev => ({
      ...prev,
      selectedSubtypes: prev.selectedSubtypes.includes(id)
        ? prev.selectedSubtypes.filter(s => s !== id)
        : [...prev.selectedSubtypes, id]
    }));
  };

  return (
    <div className="flex h-[calc(100vh-5.1rem)] bg-slate-200 overflow-hidden font-sans">

      <div className="flex w-full p-8 gap-8 overflow-hidden">

        {/* ══ LEFT PANEL ══════════════════════════════════════════════════════ */}
        <div className="w-1/2 overflow-y-auto pr-2 custom-scrollbar">
          <div className="max-w-3xl space-y-6 pb-12">

            {/* Header */}
            <div className="bg-linear-to-br from-emerald-500 to-emerald-900 rounded-3xl p-8 text-white">
              <div className="flex items-center space-x-3 mb-2">
                <Stethoscope className="w-7 h-7 text-emerald-100" strokeWidth={2.5} />
                <h1 className="text-3xl font-bold tracking-tight">Enfermedad</h1>
              </div>
              <p className="text-emerald-100/80 text-sm font-medium">Define la identidad, clasificación y codificación internacional de la patología</p>
            </div>
            
            <DiseaseTabs currentPage="disease" onNavigate={onNavigate} />

            {/* Edit banner */}
            {editingDiseaseIndex !== null && (
              <div className="flex items-center gap-2 px-5 py-3 bg-amber-50 border-2 border-amber-300 rounded-2xl">
                <Pencil className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-bold text-amber-800">Editando: <span className="text-amber-900">{diseases[editingDiseaseIndex]?.diseaseData.label}</span></span>
              </div>
            )}

            {/* Datos Principales */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-300 p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Información General</h2>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre de la Enfermedad</label>
                <input
                  type="text" name="label" value={formData.label} onChange={handleInputChange}
                  placeholder="ej: Deficiencia de vitamina B6"
                  className="w-full px-5 py-4 bg-white/80 border border-slate-300 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm text-slate-600"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Descripción Clínica</label>
                <textarea
                  name="comment" value={formData.comment} onChange={handleInputChange}
                  placeholder="Descripción clínica completa de la enfermedad..."
                  rows="3"
                  className="w-full px-5 py-4 bg-white/80 border border-slate-300 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm text-slate-600 resize-none"
                />
              </div>
            </div>

            {/* Clasificación / Subtipos */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-300 p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-5">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Clasificación Ontológica</h2>
                  <p className="text-xs text-slate-500">Selecciona todos los subtipos que apliquen</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {DISEASE_SUBTYPES.map(subtype => {
                  const active = formData.selectedSubtypes.includes(subtype.id);
                  return (
                    <button
                      key={subtype.id}
                      type="button"
                      onClick={() => handleSubtypeToggle(subtype.id)}
                      className={`text-left p-4 rounded-2xl border-2 transition-all ${
                        active
                          ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100'
                          : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                          active ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                        }`}>
                          {active && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className={`text-sm font-bold ${active ? 'text-emerald-700' : 'text-slate-700'}`}>{subtype.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed ml-6">{subtype.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sistemas de Referencia */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-300 p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Database className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Sistemas de Referencia</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'hasRefToICD', label: 'CIE-10 (ICD)', ph: 'ej: E53.8' },
                  { name: 'hasRefToSNOMED', label: 'SNOMED CT', ph: 'ej: 190602008' },
                  { name: 'hasRefToOMIM', label: 'OMIM', ph: 'ej: 253260' },
                  { name: 'hasRefToDO', label: 'Disease Ontology', ph: 'ej: DOID:0060728' }
                ].map(field => (
                  <div key={field.name} className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{field.label}</label>
                    <input
                      type="text" name={field.name} value={references[field.name]} onChange={handleReferenceChange}
                      placeholder={field.ph}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/5 outline-none transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => onNavigate('progression')}
              disabled={!formData.label}
              className="w-full bg-linear-to-r from-emerald-600 to-emerald-900 text-white py-5 rounded-2xl font-bold hover:shadow-xl hover:shadow-emerald-500/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-3 shadow-lg shadow-emerald-200"
            >
              <span className="text-lg">Ir a Progresión</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ══ RIGHT PANEL: Ontology graph ═════════════════════════════════════ */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] flex flex-col h-full border-2 border-emerald-500 overflow-hidden">

            <div className="p-6 bg-linear-to-r from-emerald-50 to-white shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-200">
                    <GitBranch className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Visualización de la Enfermedad</h2>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Enfermedad y elementos de progresión</p>
                  </div>
                </div>
                <div className="bg-emerald-100 px-4 py-1.5 rounded-full border border-emerald-200 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">En vivo</span>
                </div>
              </div>
            </div>

            <div className="flex-1" style={{ position: 'relative' }}>
              <OntologyFlowGraph
                nodes={graphNodes}
                edges={graphEdges}
                emptyMessage="Escribe el nombre de la enfermedad para ver el grafo"
              />
            </div>

            <div className="px-8 py-4 bg-linear-to-r from-white to-emerald-50 shrink-0 border-t border-emerald-200">
              <p className="text-[10px] text-emerald-600 font-medium text-center tracking-widest italic">
                hasDiseaseProgression → vincula la enfermedad con sus elementos de progresión
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(226, 232, 240, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.4); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(5, 150, 105, 0.6); }
      `}</style>
    </div>
  );
}

export default DiseasePage;
