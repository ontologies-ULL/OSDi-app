import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Layers, Plus, Trash2, ChevronDown, ChevronUp, Save, GitBranch } from 'lucide-react';
import DiseaseTabs from '../components/DiseaseTabs';
import useSaveStatus from '../hooks/useSaveStatus';
import { createIndividual } from '../api/ontology';
import OntologyFlowGraph from '../components/OntologyFlowGraph';

// A Stage can optionally be an OrderedModelItem (for use in SequentialCombinationRule)
const EMPTY_STAGE = {
  label: '',
  description: '',
  isOrdered: false,    // whether to also class it as OrderedModelItem
  hasNext: '',         // next stage in the linked list (only if isOrdered)
  subProgressions: [], // manifestations that belong specifically to this stage (hasSubProgression)
};

// Props: stages and setStages come from App.jsx (persisted across navigation)
function StagePage({ onNavigate, currentPage = 'stage', diseaseData, progressionElements = [], stages, setStages, graphNodes = [], graphEdges = [], onSaveDiseaseSnapshot }) {
  const [form, setForm] = useState({ ...EMPTY_STAGE });
  const [expandedStages, setExpandedStages] = useState([]);

  const { saving, success, error, withSave } = useSaveStatus();
  const { saving: savingDisease, success: successDisease, error: errorDisease, withSave: withSaveDisease } = useSaveStatus();

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [e.target.name]: value }));
  };

  const toggleSubProgression = (label) => {
    setForm(prev => ({
      ...prev,
      subProgressions: prev.subProgressions.includes(label)
        ? prev.subProgressions.filter(l => l !== label)
        : [...prev.subProgressions, label]
    }));
  };

  const handleSave = () => {
    if (!form.label) return;
    withSave(async () => {
      const classes = ['Stage'];
      if (form.isOrdered) classes.push('OrderedModelItem');

      const objectProps = form.subProgressions.map(p => ({
        property: 'hasSubProgression',
        value: p
      }));

      if (form.isOrdered && form.hasNext) {
        objectProps.push({ property: 'hasNext', value: form.hasNext });
      }

      await createIndividual({
        label: form.label,
        comment: form.description,
        selectedClasses: classes,
        datatypeProperties: form.description ? [{ property: 'hasDescription', value: form.description }] : [],
        objectProperties: objectProps
      });

      setStages(prev => [...prev, { ...form }]);
      setForm({ ...EMPTY_STAGE });
    });
  };

  const handleDelete = (index) => {
    setStages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDisease = () => {
    if (!diseaseData?.label) return;
    withSaveDisease(async () => {
      const datatypeProps = [
        ...(diseaseData.comment ? [{ property: 'hasDescription', value: diseaseData.comment }] : []),
        ...(diseaseData.references?.hasRefToDO ? [{ property: 'hasRefToDO', value: diseaseData.references.hasRefToDO }] : []),
        ...(diseaseData.references?.hasRefToICD ? [{ property: 'hasRefToICD', value: diseaseData.references.hasRefToICD }] : []),
        ...(diseaseData.references?.hasRefToOMIM ? [{ property: 'hasRefToOMIM', value: diseaseData.references.hasRefToOMIM }] : []),
        ...(diseaseData.references?.hasRefToSNOMED ? [{ property: 'hasRefToSNOMED', value: diseaseData.references.hasRefToSNOMED }] : []),
      ];
      const progressionObjectProps = progressionElements.map(elem => ({
        property: 'hasDiseaseProgression',
        value: elem.label
      }));
      await createIndividual({
        label: diseaseData.label,
        comment: diseaseData.comment,
        selectedClasses: ['Disease', ...(diseaseData.selectedSubtypes || [])],
        datatypeProperties: datatypeProps,
        objectProperties: progressionObjectProps
      });

      if (onSaveDiseaseSnapshot) onSaveDiseaseSnapshot(diseaseData);
    });
  };

  const typeLabel = (type) => {
    if (type === 'AcuteManifestation') return { text: 'Manifestación Aguda', cls: 'bg-yellow-100 text-yellow-800' };
    if (type === 'ChronicManifestation') return { text: 'Manifestación Crónica', cls: 'bg-amber-100 text-amber-800' };
    if (type === 'CoexistentDiseaseProgressionSet') return { text: 'Regla Coexistente', cls: 'bg-teal-100 text-teal-700' };
    if (type === 'AlternativeDiseaseProgressionSet') return { text: 'Regla Alternativa', cls: 'bg-teal-100 text-teal-700' };
    if (type === 'SequentialDiseaseProgressionSet') return { text: 'Regla Secuencial', cls: 'bg-teal-100 text-teal-700' };
    if (type === 'Development') return { text: 'Desarrollo', cls: 'bg-indigo-100 text-indigo-700' };
    if (type === 'Stage') return { text: 'Etapa', cls: 'bg-fuchsia-100 text-fuchsia-700' };
    return { text: type, cls: 'bg-gray-100 text-gray-700' };
  };

  // Stages already created are available as "next" candidates
  const availableAsNext = stages.filter(s => s.label !== form.label);

  return (
    <div className="flex h-[calc(100vh-5.1rem)] bg-slate-200 overflow-hidden font-sans">

      {/* Floating messages — stage */}
      {(error || success) && (
        <div className="fixed top-24 right-8 z-50 animate-in fade-in slide-in-from-top-4">
          <div className={`flex items-center space-x-3 p-4 rounded-2xl shadow-xl border-l-4 ${error ? 'bg-white border-rose-500 text-rose-800' : 'bg-white border-emerald-500 text-emerald-800'}`}>
            {error ? <AlertCircle className="w-5 h-5 text-rose-500" /> : <CheckCircle className="w-5 h-5 text-emerald-500" />}
            <p className="text-sm font-bold">{error || 'Etapa guardada con éxito'}</p>
          </div>
        </div>
      )}
      {/* Floating messages — disease */}
      {(errorDisease || successDisease) && (
        <div className="fixed top-36 right-8 z-50 animate-in fade-in slide-in-from-top-4">
          <div className={`flex items-center space-x-3 p-4 rounded-2xl shadow-xl border-l-4 ${errorDisease ? 'bg-white border-rose-500 text-rose-800' : 'bg-white border-teal-500 text-teal-800'}`}>
            {errorDisease ? <AlertCircle className="w-5 h-5 text-rose-500" /> : <CheckCircle className="w-5 h-5 text-teal-500" />}
            <p className="text-sm font-bold">{errorDisease || '¡Enfermedad guardada en la ontología!'}</p>
          </div>
        </div>
      )}

      <div className="flex w-full p-8 gap-8 overflow-hidden">

        {/* ══ LEFT PANEL ══════════════════════════════════════════════════════ */}
        <div className="w-1/2 overflow-y-auto pr-2 custom-scrollbar">
          <div className="max-w-3xl space-y-6 pb-12">

            {/* Header */}
            <div className="bg-linear-to-br from-emerald-500 to-emerald-900 rounded-3xl p-8 text-white">
              <div className="flex items-center space-x-3 mb-2">
                <Layers className="w-7 h-7 text-emerald-100" strokeWidth={2.5} />
                <h1 className="text-3xl font-bold tracking-tight">Etapas</h1>
              </div>
              <p className="text-emerald-100/80 text-sm font-medium">
                Define las fases de progresión de la enfermedad (ej: estadios oncológicos, grados de severidad)
              </p>
            </div>
              
            <DiseaseTabs currentPage={currentPage} onNavigate={onNavigate} />

            {/* Info note */}
            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <Layers className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-800 leading-relaxed">
                <strong>¿Qué es una Etapa?</strong> Un <em>Stage</em> representa una fase en la progresión de la enfermedad,
                como los estadios de una enfermedad oncológica. Puede contener sub-progresiones específicas de esa fase (<em>hasSubProgression</em>).
                Si la enfermedad sigue una secuencia ordenada, activa <strong>OrderedModelItem</strong> para encadenar las etapas con <em>hasNext</em>.
              </div>
            </div>

            {/* Form */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-300 p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-emerald-100 rounded-lg"><Layers className="w-4 h-4 text-emerald-600" /></div>
                <h2 className="text-lg font-bold text-slate-800">Nueva Etapa</h2>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre</label>
                <input
                  type="text" name="label" value={form.label} onChange={handleInputChange}
                  placeholder="ej: Etapa 1 - Síntomas leves"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/5 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Descripción</label>
                <textarea
                  name="description" value={form.description} onChange={handleInputChange}
                  placeholder="Descripción clínica de esta etapa..."
                  rows="2"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/5 outline-none transition-all resize-none"
                />
              </div>

              {/* Sub-progressions (hasSubProgression) */}
              {progressionElements.length > 0 && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-2 block">
                    Sub-progresiones de esta etapa
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {progressionElements.map((elem, i) => {
                      const checked = form.subProgressions.includes(elem.label);
                      const tl = typeLabel(elem.type);
                      return (
                        <label key={i} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checked ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300'}`}>
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${checked ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}
                            onClick={() => toggleSubProgression(elem.label)}
                          >
                            {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <input type="checkbox" className="hidden" checked={checked} onChange={() => toggleSubProgression(elem.label)} />
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${tl.cls}`}>{tl.text}</span>
                          <span className="text-sm text-slate-700 font-medium">{elem.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* OrderedModelItem toggle */}
              <div className={`p-4 rounded-xl border-2 transition-all ${form.isOrdered ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${form.isOrdered ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}
                    onClick={() => setForm(p => ({ ...p, isOrdered: !p.isOrdered, hasNext: '' }))}
                  >
                    {form.isOrdered && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${form.isOrdered ? 'text-emerald-700' : 'text-slate-700'}`}>
                      Incluir como OrderedModelItem (para reglas secuenciales)
                    </p>
                    <p className="text-[10px] text-slate-500 leading-snug">
                      Actívalo si esta etapa forma parte de una <em>SequentialCombinationRule</em>.
                      Permite encadenarla con la siguiente etapa mediante <em>hasNext</em>.
                    </p>
                  </div>
                </label>

                {/* hasNext selector */}
                {form.isOrdered && (
                  <div className="mt-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-1 block">
                      Siguiente etapa en la secuencia (hasNext)
                    </label>
                    {availableAsNext.length > 0 ? (
                      <select
                        name="hasNext" value={form.hasNext}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/5 outline-none transition-all"
                      >
                        <option value="">-- Sin siguiente etapa (es la última) --</option>
                        {availableAsNext.map(s => (
                          <option key={s.label} value={s.label}>{s.label}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-xs text-slate-400 italic px-1">
                        Guarda más etapas para poder enlazarlas. La primera etapa que guardes será la "cabeza" de la secuencia.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !form.label}
                className="w-full flex items-center justify-center gap-2 py-3 bg-linear-to-r from-emerald-600 to-emerald-800 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Añadir Etapa'}
              </button>
            </div>

            {/* Stages list */}
            {stages.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Etapas creadas ({stages.length})</h3>
                {stages.map((s, i) => {
                  const expanded = expandedStages.includes(i);
                  return (
                    <div key={i} className="bg-white/70 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-fuchsia-100 text-fuchsia-700">
                            {s.isOrdered ? 'Etapa ord.' : 'Etapa'}
                          </span>
                          <span className="text-sm font-bold text-slate-700">{s.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setExpandedStages(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])}
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleDelete(i)}
                            className="p-1.5 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-colors text-slate-300">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {expanded && (
                        <div className="px-5 pb-4 border-t border-slate-100 pt-3 space-y-2">
                          {s.description && <p className="text-xs text-slate-500">{s.description}</p>}
                          {s.subProgressions.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">hasSubProgression:</p>
                              <div className="flex flex-wrap gap-1">
                                {s.subProgressions.map(l => (
                                  <span key={l} className="px-2 py-0.5 bg-fuchsia-100 text-fuchsia-700 rounded-full text-[10px] font-bold">{l}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {s.isOrdered && (
                            <div className="flex items-center gap-2 text-[10px] text-fuchsia-600 font-medium">
                              <ArrowRight className="w-3 h-3" />
                              hasNext: {s.hasNext || '(última etapa)'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {stages.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm italic bg-white/30 rounded-2xl border border-dashed border-slate-300">
                Aún no has añadido ninguna etapa
              </div>
            )}

            {/* ── Save Disease ────────────────────────────────────────────────── */}
            <div className="pt-4 border-t-2 border-dashed border-emerald-300 space-y-3">
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest text-center">
                Paso final — Guardar la enfermedad completa
              </p>
              <p className="text-xs text-slate-500 text-center leading-relaxed">
                Esto creará el individuo <strong>{diseaseData?.label || 'enfermedad'}</strong> en la ontología vinculando todos los elementos definidos.
              </p>
              <button
                onClick={handleSaveDisease}
                disabled={savingDisease || !diseaseData?.label}
                className="w-full bg-linear-to-r from-teal-600 to-teal-900 text-white py-5 rounded-2xl font-bold hover:shadow-xl hover:shadow-teal-500/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-3 shadow-lg"
              >
                <Save className="w-5 h-5" />
                <span className="text-lg">{savingDisease ? 'Guardando...' : 'Guardar Enfermedad con Progresión'}</span>
              </button>
            </div>
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
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Enfermedad y etapas</p>
                  </div>
                </div>
                <div className="bg-emerald-100 px-4 py-1.5 rounded-full border border-emerald-200 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                    {stages.length} etapa{stages.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1" style={{ position: 'relative' }}>
              <OntologyFlowGraph
                nodes={graphNodes}
                edges={graphEdges}
                emptyMessage="Define la enfermedad y añade etapas para ver el grafo completo"
              />
            </div>

            <div className="px-8 py-4 bg-linear-to-r from-white to-emerald-50 shrink-0 border-t border-emerald-200">
              <p className="text-[10px] text-emerald-600 font-medium text-center tracking-widest italic">
                hasSubProgression → etapa agrupa manifestaciones · hasNext → secuencia ordenada
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

export default StagePage;
