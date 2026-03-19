/**
 * @file DevelopmentPage.jsx
 * @brief Development editor.
 *
 * Allows the user to define `Development` OWL individuals.
 * Each development can be linked to existing manifestations
 * via the `hasDiseaseProgression` object property.
 *
 * Items are persisted to the backend via {@link createIndividual} and appended to
 * the shared `developments` array in `App.jsx`.
 *
 * The right panel renders a live {@link OntologyFlowGraph} showing the full
 * disease graph.
 *
 * @module DevelopmentPage
 */

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, GitMerge, Plus, Trash2, ChevronDown, ChevronUp, GitBranch, Layers, ArrowRight } from 'lucide-react';
import DiseaseTabs from '../components/DiseaseTabs';
import useSaveStatus from '../hooks/useSaveStatus';
import { createIndividual } from '../api/ontology';
import OntologyFlowGraph from '../components/OntologyFlowGraph';

/**
 * Default (empty) state for the development creation form.
 * @constant {{ label: string, description: string, linkedProgressions: string[] }}
 */
const EMPTY_DEVELOPMENT = { label: '', description: '', linkedProgressions: [] };

/**
 * @component DevelopmentPage
 * @description Two-column editor for `Development` individuals of the OSDi ontology.
 *
 * **Left panel**:
 * - Label and description fields.
 * - A multi-select checklist of available progression elements to link via
 *   `hasDiseaseProgression`.
 * - A scrollable list of already-created developments with expand/delete controls.
 *
 * **Right panel**: Ontology Graph.
 *
 * @param {Function} props.onNavigate                             - Top-level navigation callback.
 * @param {string}   [props.currentPage='development']            - Active page key (used by DiseaseTabs).
 * @param {import('../App').ProgressionElement[]} [props.progressionElements=[]]
 *   - Combined list of manifestations and combination rules available for linking.
 * @param {import('../App').Development[]} props.developments     - Shared developments array from App.
 * @param {Function} props.setDevelopments                        - Setter for the shared developments array.
 * @param {Object[]} [props.graphNodes=[]]                        - React Flow nodes for the right-panel graph.
 * @param {Object[]} [props.graphEdges=[]]                        - React Flow edges for the right-panel graph.
 * @returns {JSX.Element}
 */
function DevelopmentPage({ onNavigate, currentPage = 'development', progressionElements = [], developments, setDevelopments, graphNodes = [], graphEdges = [] }) {

  /**
   * Form state for the development being created.
   * @type {[{label: string, description: string, linkedProgressions: string[]}, Function]}
   */
  const [form, setForm] = useState({ ...EMPTY_DEVELOPMENT });

  /** @type {[number[], Function]} Indices of expanded development list items. */
  const [expandedDevs, setExpandedDevs] = useState([]);

  const { saving, success, error, withSave } = useSaveStatus();

  /**
   * Generic change handler for the development form text inputs.
   * @param {React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>} e
   */
  const handleInputChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  /**
   * Toggles a progression element label in `form.linkedProgressions`.
   * @param {string} label - Label of the progression element to toggle.
   */
  const toggleLinked = (label) => {
    setForm(prev => ({
      ...prev,
      linkedProgressions: prev.linkedProgressions.includes(label)
        ? prev.linkedProgressions.filter(l => l !== label)
        : [...prev.linkedProgressions, label]
    }));
  };

  /**
   * Persists the current `form` as a `Development` OWL individual and appends
   * it to the shared `developments` array. Resets the form on success.
   *
   * Object properties assembled:
   * - `hasDiseaseProgression` for each linked progression element.
   *
   * Guards against empty label.
   */
  const handleSave = () => {
    if (!form.label) return;
    withSave(async () => {
      const objectProps = form.linkedProgressions.map(p => ({
        property: 'hasDiseaseProgression',
        value: p
      }));

      await createIndividual({
        label: form.label,
        comment: form.description,
        selectedClasses: ['Development'],
        datatypeProperties: form.description ? [{ property: 'hasDescription', value: form.description }] : [],
        objectProperties: objectProps
      });

      setDevelopments(prev => [...prev, { ...form }]);
      setForm({ ...EMPTY_DEVELOPMENT });
    });
  };

  /**
   * Removes a development from the shared array by index.
   * @param {number} index - Position in the `developments` array to remove.
   */
  const handleDelete = (index) => {
    setDevelopments(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Returns a display label and Tailwind colour classes for a given OWL class name.
   * Used to render type badges in the progression element checklist.
   * @param {string} type - OWL class identifier.
   * @returns {{ text: string, cls: string }}
   */
  const typeLabel = (type) => {
    if (type === 'AcuteManifestation')               return { text: 'Manifestación Aguda',  cls: 'bg-yellow-100 text-yellow-800' };
    if (type === 'ChronicManifestation')             return { text: 'Manifestación Crónica', cls: 'bg-amber-100 text-amber-800' };
    if (type === 'CoexistentDiseaseProgressionSet')  return { text: 'Regla Coexistente',     cls: 'bg-teal-100 text-teal-700' };
    if (type === 'AlternativeDiseaseProgressionSet') return { text: 'Regla Alternativa',     cls: 'bg-teal-100 text-teal-700' };
    if (type === 'SequentialDiseaseProgressionSet')  return { text: 'Regla Secuencial',      cls: 'bg-teal-100 text-teal-700' };
    if (type === 'Development')                      return { text: 'Desarrollo',            cls: 'bg-indigo-100 text-indigo-700' };
    return { text: type, cls: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div className="flex h-[calc(100vh-5.1rem)] bg-slate-200 overflow-hidden font-sans">

      {/* Save result toast */}
      {(error || success) && (
        <div className="fixed top-24 right-8 z-50 animate-in fade-in slide-in-from-top-4">
          <div className={`flex items-center space-x-3 p-4 rounded-2xl shadow-xl border-l-4 ${error ? 'bg-white border-rose-500 text-rose-800' : 'bg-white border-emerald-500 text-emerald-800'}`}>
            {error ? <AlertCircle className="w-5 h-5 text-rose-500" /> : <CheckCircle className="w-5 h-5 text-emerald-500" />}
            <p className="text-sm font-bold">{error || 'Desarrollo guardado con éxito'}</p>
          </div>
        </div>
      )}

      <div className="flex w-full p-8 gap-8 overflow-hidden">

        {/* Left panel */}
        <div className="w-1/2 overflow-y-auto pr-2 custom-scrollbar">
          <div className="max-w-3xl space-y-6 pb-12">

            {/* Header */}
            <div className="bg-linear-to-br from-emerald-500 to-emerald-900 rounded-3xl p-8 text-white">
              <div className="flex items-center space-x-3 mb-2">
                <GitMerge className="w-7 h-7 text-emerald-100" strokeWidth={2.5} />
                <h1 className="text-3xl font-bold tracking-tight">Desarrollos</h1>
              </div>
              <p className="text-emerald-100/80 text-sm font-medium">
                Define las vías de progresión de la enfermedad (ej: historia natural sin cribado, forma profunda vs parcial)
              </p>
            </div>

            <DiseaseTabs currentPage={currentPage} onNavigate={onNavigate} />

            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <Layers className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-800 leading-relaxed">
                <strong>¿Qué es un Desarrollo?</strong> Un <em>Development</em> representa una trayectoria o forma específica de la enfermedad (ej: "Historia natural de la DB profunda sin cribado").
                Agrupa las manifestaciones y reglas de combinación que corresponden a esa trayectoria.
                Puede usarse cuando hay distintas formas de la enfermedad o distintos escenarios de comparación.
              </div>
            </div>

            {progressionElements.length === 0 && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Sin elementos de progresión disponibles.</strong> Ve primero a la página de <strong>Progresión</strong> para crear manifestaciones y reglas de combinación.
                  Podrás vincularlas aquí una vez creadas.
                </p>
              </div>
            )}

            {/* Development creation form */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-300 p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-emerald-100 rounded-lg"><GitMerge className="w-4 h-4 text-emerald-600" /></div>
                <h2 className="text-lg font-bold text-slate-800">Nuevo Desarrollo</h2>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre / Identificador <span className="text-rose-500">*</span></label>
                <input
                  type="text" name="label" value={form.label} onChange={handleInputChange}
                  placeholder="ej: Historia natural sin cribado"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/5 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Descripción</label>
                <textarea
                  name="description" value={form.description} onChange={handleInputChange}
                  placeholder="Descripción de este desarrollo o vía de progresión..."
                  rows="3"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/5 outline-none transition-all resize-none"
                />
              </div>

              {/* Progression element checklist */}
              {progressionElements.length > 0 && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-2 block">
                    Elementos de progresión vinculados
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {progressionElements.map((elem, i) => {
                      const checked = form.linkedProgressions.includes(elem.label);
                      const tl = typeLabel(elem.type);
                      return (
                        <label key={i} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checked ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300'}`}>
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${checked ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}
                            onClick={() => toggleLinked(elem.label)}>
                            {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <input type="checkbox" className="hidden" checked={checked} onChange={() => toggleLinked(elem.label)} />
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${tl.cls}`}>{tl.text}</span>
                          <span className="text-sm text-slate-700 font-medium">{elem.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  {form.linkedProgressions.length > 0 && (
                    <p className="text-[10px] text-emerald-600 font-medium mt-2 ml-1">
                      {form.linkedProgressions.length} elemento{form.linkedProgressions.length !== 1 ? 's' : ''} seleccionado{form.linkedProgressions.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving || !form.label}
                className="w-full flex items-center justify-center gap-2 py-3 bg-linear-to-r from-emerald-600 to-emerald-800 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Añadir Desarrollo'}
              </button>
            </div>

            {/* Developments list */}
            {developments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Desarrollos creados ({developments.length})</h3>
                {developments.map((d, i) => {
                  const expanded = expandedDevs.includes(i);
                  return (
                    <div key={i} className="bg-white/70 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-indigo-100 text-indigo-700">Desarrollo</span>
                          <span className="text-sm font-bold text-slate-700">{d.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setExpandedDevs(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])}
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
                          {d.description && <p className="text-xs text-slate-500">{d.description}</p>}
                          {d.linkedProgressions.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Elementos vinculados:</p>
                              <div className="flex flex-wrap gap-1">
                                {d.linkedProgressions.map(l => (
                                  <span key={l} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold">{l}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {developments.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm italic bg-white/30 rounded-2xl border border-dashed border-slate-300">
                Aún no has añadido ningún desarrollo
              </div>
            )}

            {/* Proceed to StagePage */}
            <button
              onClick={() => onNavigate('stage')}
              className="w-full bg-linear-to-r from-emerald-600 to-emerald-900 text-white py-5 rounded-2xl font-bold hover:shadow-xl hover:shadow-emerald-500/30 transition-all active:scale-[0.98] flex items-center justify-center space-x-3 shadow-lg shadow-emerald-200"
            >
              <ArrowRight className="w-5 h-5" />
              <span className="text-lg">Ir a Etapas</span>
            </button>
          </div>
        </div>

        {/* Right panel: Ontology graph */}
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
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Enfermedad y desarrollos</p>
                  </div>
                </div>
                <div className="bg-emerald-100 px-4 py-1.5 rounded-full border border-emerald-200 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                    {developments.length} desarrollo{developments.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1" style={{ position: 'relative' }}>
              <OntologyFlowGraph
                nodes={graphNodes}
                edges={graphEdges}
                emptyMessage="Añade desarrollos para ver el grafo de vías de progresión"
              />
            </div>

            <div className="px-8 py-4 bg-linear-to-r from-white to-emerald-50 shrink-0 border-t border-emerald-200">
              <p className="text-[10px] text-emerald-600 font-medium text-center tracking-widest italic">
                hasDiseaseProgression → vincula cada Development con sus manifestaciones y reglas
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(226, 232, 240, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.4); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(5, 150, 105, 0.6); }
      `}</style>
    </div>
  );
}

export default DevelopmentPage;
