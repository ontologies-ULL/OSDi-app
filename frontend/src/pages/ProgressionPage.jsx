/**
 * @file ProgressionPage.jsx
 * @brief Disease progression editor: manifestations and combination rules.
 *
 * Allows the user to model how a disease progresses clinically by defining:
 * - **Manifestations**
 * - **Combination rules**
 *
 * Each item is saved to the backend via {@link createIndividual} and appended to
 * the shared arrays in `App.jsx`.
 *
 * The right panel renders a live {@link OntologyFlowGraph} showing the full
 * disease graph.
 *
 * @module ProgressionPage
 */

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Activity, Plus, Trash2, ChevronDown, ChevronUp, GitBranch, ArrowRight } from 'lucide-react';
import DiseaseTabs from '../components/DiseaseTabs';
import useSaveStatus from '../hooks/useSaveStatus';
import { createIndividual } from '../api/ontology';
import OntologyFlowGraph from '../components/OntologyFlowGraph';

/**
 * Available OWL manifestation types selectable in the manifestation form.
 * @constant {{ id: string, label: string, desc: string }[]}
 */
const MANIFESTATION_TYPES = [
  { id: 'AcuteManifestation',   label: 'Aguda',   desc: 'Síntomas de aparición rápida y corta duración (ej: crisis, erupciones)' },
  { id: 'ChronicManifestation', label: 'Crónica', desc: 'Secuelas o complicaciones a largo plazo (ej: pérdida auditiva)' },
];

/**
 * Available OWL combination rule types selectable in the rule form.
 * @constant {{ id: string, label: string, desc: string }[]}
 */
const RULE_TYPES = [
  { id: 'CoexistentDiseaseProgressionSet',   label: 'Coexistente', desc: 'Las manifestaciones pueden ocurrir simultáneamente' },
  { id: 'AlternativeDiseaseProgressionSet',  label: 'Alternativa', desc: 'Las manifestaciones son mutuamente excluyentes (solo una puede ocurrir)' },
  { id: 'SequentialDiseaseProgressionSet',   label: 'Secuencial',  desc: 'Las manifestaciones se suceden en orden' },
];

/**
 * Default state for the manifestation creation form.
 * @constant {{ label: string, description: string, type: string }}
 */
const EMPTY_MANIFESTATION = { label: '', description: '', type: 'AcuteManifestation' };

/**
 * Default state for the combination rule creation form.
 * @constant {{ label: string, description: string, ruleType: string, affectedProgressions: string[], hasNullProgression: boolean, hasFirst: string }}
 */
const EMPTY_RULE = { label: '', description: '', ruleType: 'CoexistentDiseaseProgressionSet', affectedProgressions: [], hasNullProgression: false, hasFirst: '' };

/**
 * @component ProgressionPage
 * @description Two-column editor for disease progression elements.
 *
 * **Left panel**
 * - *Manifestaciones*
 * - *Reglas de Combinación*
 *
 * **Right panel** 
 * - *Ontology Graph*.
 *
 * @param {Function}           props.onNavigate                           - Top-level navigation callback.
 * @param {string}             [props.currentPage='progression']          - Active page key.
 * @param {import('../App').Manifestation[]}    props.manifestations      - Shared manifestations array from App.
 * @param {Function}           props.setManifestations                    - Setter for the shared manifestations array.
 * @param {import('../App').CombinationRule[]}  props.combinationRules    - Shared combination rules array from App.
 * @param {Function}           props.setCombinationRules                  - Setter for the shared combination rules array.
 * @param {Object[]}           [props.graphNodes=[]]                      - React Flow nodes.
 * @param {Object[]}           [props.graphEdges=[]]                      - React Flow edges.
 * @returns {JSX.Element}
 */
function ProgressionPage({ onNavigate, currentPage = 'progression', manifestations, setManifestations, combinationRules, setCombinationRules, graphNodes = [], graphEdges = [] }) {

  /**
   * Form state for the manifestation being created.
   * @type {[{label: string, description: string, type: string}, Function]}
   */
  const [manifForm, setManifForm] = useState({ ...EMPTY_MANIFESTATION });

  /**
   * Form state for the combination rule being created.
   * @type {[{label: string, description: string, ruleType: string, affectedProgressions: string[], hasNullProgression: boolean, hasFirst: string}, Function]}
   */
  const [ruleForm, setRuleForm] = useState({ ...EMPTY_RULE });

  /** @type {[string, Function]} 
   * Which tab is currently active: 'manifestations' | 'rules'. 
   */
  const [activeTab, setActiveTab] = useState('manifestations');

  /** @type {[number[], Function]} 
   * Indices of expanded manifestation list items. 
   */
  const [expandedManifs, setExpandedManifs] = useState([]);

  /** @type {[number[], Function]} 
   * Indices of expanded combination rule list items. 
   */
  const [expandedRules, setExpandedRules] = useState([]);

  const { saving: savingManif, success: successManif, error: errorManif, withSave: withSaveManif } = useSaveStatus();
  const { saving: savingRule,  success: successRule,  error: errorRule,  withSave: withSaveRule  } = useSaveStatus();

  /**
   * Generic change handler for the manifestation form inputs.
   * @param {React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>} e
   */
  const handleManifChange = (e) => setManifForm(p => ({ ...p, [e.target.name]: e.target.value }));

  /**
   * Persists the current `manifForm` as an OWL individual and appends it to
   * the shared `manifestations` array.
   */
  const handleSaveManifestation = () => {
    if (!manifForm.label) return;
    withSaveManif(async () => {
      await createIndividual({
        label: manifForm.label,
        comment: manifForm.description,
        selectedClasses: [manifForm.type],
        datatypeProperties: manifForm.description ? [{ property: 'hasDescription', value: manifForm.description }] : [],
        objectProperties: []
      });
      setManifestations(prev => [...prev, { ...manifForm }]);
      setManifForm({ ...EMPTY_MANIFESTATION });
    });
  };

  /**
   * Removes a manifestation from the shared array by index.
   * @param {number} index - Position in the `manifestations` array to remove.
   */
  const handleDeleteManifestation = (index) => {
    setManifestations(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Toggles a manifestation label in `ruleForm.affectedProgressions`.
   * Used to build the `hasDiseaseProgression` object properties of the rule.
   * @param {string} label - Label of the manifestation to toggle.
   */
  const toggleAffected = (label) => {
    setRuleForm(prev => ({
      ...prev,
      affectedProgressions: prev.affectedProgressions.includes(label)
        ? prev.affectedProgressions.filter(l => l !== label)
        : [...prev.affectedProgressions, label]
    }));
  };

  /**
   * Persists the current `ruleForm` as an OWL combination rule individual and
   * appends it to the shared `combinationRules` array. Resets the form on success.
   *
   * Object properties assembled:
   * - `hasDiseaseProgression` for each affected manifestation.
   * - `hasFirst` (Sequential rules only, when set).
   *
   * Datatype properties assembled:
   * - `hasDescription` (when present).
   * - `hasNullProgression` (Alternative rules only).
   *
   * Guards against empty label.
   */
  const handleSaveRule = () => {
    if (!ruleForm.label) return;
    withSaveRule(async () => {
      const objectProps = ruleForm.affectedProgressions.map(p => ({
        property: 'hasDiseaseProgression',
        value: p
      }));
      if (ruleForm.ruleType === 'SequentialDiseaseProgressionSet' && ruleForm.hasFirst) {
        objectProps.push({ property: 'hasFirst', value: ruleForm.hasFirst });
      }
      const dataProps = [
        ...(ruleForm.description ? [{ property: 'hasDescription', value: ruleForm.description }] : []),
        ...(ruleForm.ruleType === 'AlternativeDiseaseProgressionSet'
          ? [{ property: 'hasNullProgression', value: ruleForm.hasNullProgression }]
          : [])
      ];
      await createIndividual({
        label: ruleForm.label,
        comment: ruleForm.description,
        selectedClasses: [ruleForm.ruleType],
        datatypeProperties: dataProps,
        objectProperties: objectProps
      });
      setCombinationRules(prev => [...prev, { ...ruleForm }]);
      setRuleForm({ ...EMPTY_RULE });
    });
  };

  /**
   * Removes a combination rule from the shared array by index.
   * @param {number} index - Position in the `combinationRules` array to remove.
   */
  const handleDeleteRule = (index) => {
    setCombinationRules(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Returns a display label and Tailwind colour classes for a given OWL class name.
   * Used to render type badges in the manifestation and rule lists.
   * @param {string} type - OWL class identifier.
   * @returns {{ text: string, cls: string }}
   */
  const typeLabel = (type) => {
    if (type === 'AcuteManifestation')                return { text: 'Manifestación Aguda',   cls: 'bg-yellow-100 text-yellow-800' };
    if (type === 'ChronicManifestation')              return { text: 'Manifestación Crónica',  cls: 'bg-amber-100 text-amber-800' };
    if (type === 'CoexistentDiseaseProgressionSet')   return { text: 'Regla Coexistente',      cls: 'bg-teal-100 text-teal-700' };
    if (type === 'AlternativeDiseaseProgressionSet')  return { text: 'Regla Alternativa',      cls: 'bg-teal-100 text-teal-700' };
    if (type === 'SequentialDiseaseProgressionSet')   return { text: 'Regla Secuencial',       cls: 'bg-teal-100 text-teal-700' };
    return { text: type, cls: 'bg-gray-100 text-gray-700' };
  };

  // Total number of progression elements shown in the graph badge.
  const totalElements = manifestations.length + combinationRules.length;

  return (
    <div className="flex h-[calc(100vh-5.1rem)] bg-slate-200 overflow-hidden font-sans">

      {/* Manifestation save result toast */}
      {(errorManif || successManif) && (
        <div className="fixed top-24 right-8 z-50 animate-in fade-in slide-in-from-top-4">
          <div className={`flex items-center space-x-3 p-4 rounded-2xl shadow-xl border-l-4 ${errorManif ? 'bg-white border-rose-500 text-rose-800' : 'bg-white border-emerald-500 text-emerald-800'}`}>
            {errorManif ? <AlertCircle className="w-5 h-5 text-rose-500" /> : <CheckCircle className="w-5 h-5 text-emerald-500" />}
            <p className="text-sm font-bold">{errorManif || 'Manifestación guardada con éxito'}</p>
          </div>
        </div>
      )}

      {/* Rule save result toast */}
      {(errorRule || successRule) && (
        <div className="fixed top-36 right-8 z-50 animate-in fade-in slide-in-from-top-4">
          <div className={`flex items-center space-x-3 p-4 rounded-2xl shadow-xl border-l-4 ${errorRule ? 'bg-white border-rose-500 text-rose-800' : 'bg-white border-emerald-500 text-emerald-800'}`}>
            {errorRule ? <AlertCircle className="w-5 h-5 text-rose-500" /> : <CheckCircle className="w-5 h-5 text-emerald-500" />}
            <p className="text-sm font-bold">{errorRule || 'Regla guardada con éxito'}</p>
          </div>
        </div>
      )}

      <div className="flex w-full p-8 gap-8 overflow-hidden">

        {/* Left panel: Manifestation and combination rule editor */}
        <div className="w-1/2 overflow-y-auto pr-2 custom-scrollbar">
          <div className="max-w-3xl space-y-6 pb-12">

            {/* Header */}
            <div className="bg-linear-to-br from-emerald-500 to-emerald-900 rounded-3xl p-8 text-white">
              <div className="flex items-center space-x-3 mb-2">
                <Activity className="w-7 h-7 text-emerald-100" strokeWidth={2.5} />
                <h1 className="text-3xl font-bold tracking-tight">Progresión de la Enfermedad</h1>
              </div>
              <p className="text-emerald-100/80 text-sm font-medium">Define las manifestaciones clínicas y las reglas que gobiernan su aparición</p>
            </div>

            <DiseaseTabs currentPage={currentPage} onNavigate={onNavigate} />

            {/* Tab switcher: Manifestations / Combination Rules */}
            <div className="flex bg-white/60 rounded-2xl border border-slate-300 p-1 shadow-sm">
              <button
                onClick={() => setActiveTab('manifestations')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'manifestations' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-emerald-600'}`}
              >
                <Activity className="w-4 h-4" />
                Manifestaciones
                <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'manifestations' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-600'}`}>{manifestations.length}</span>
              </button>
              <button
                onClick={() => setActiveTab('rules')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'rules' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-emerald-600'}`}
              >
                <GitBranch className="w-4 h-4" />
                Reglas de Combinación
                <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'rules' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-600'}`}>{combinationRules.length}</span>
              </button>
            </div>

            {/* Manifestations content */}
            {activeTab === 'manifestations' && (
              <div className="space-y-5">
                <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-300 p-6 shadow-sm space-y-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-emerald-100 rounded-lg"><Activity className="w-4 h-4 text-emerald-600" /></div>
                    <h2 className="text-lg font-bold text-slate-800">Nueva Manifestación</h2>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre / Identificador <span className="text-rose-500">*</span></label>
                    <input
                      type="text" name="label" value={manifForm.label} onChange={handleManifChange}
                      placeholder="ej: Pérdida auditiva neurosensorial"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/5 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Descripción Clínica</label>
                    <textarea
                      name="description" value={manifForm.description} onChange={handleManifChange}
                      placeholder="Descripción de la manifestación clínica..."
                      rows="2"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/5 outline-none transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-2 block">Tipo de Manifestación</label>
                    <div className="grid grid-cols-2 gap-3">
                      {MANIFESTATION_TYPES.map(t => {
                        const active = manifForm.type === t.id;
                        return (
                          <button key={t.id} type="button" onClick={() => setManifForm(p => ({ ...p, type: t.id }))}
                            className={`text-left p-3 rounded-xl border-2 transition-all ${active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300'}`}>
                            <p className={`text-sm font-bold mb-1 ${active ? 'text-emerald-700' : 'text-slate-700'}`}>{t.label}</p>
                            <p className="text-[10px] text-slate-500 leading-snug">{t.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveManifestation}
                    disabled={savingManif || !manifForm.label}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-linear-to-r from-emerald-600 to-emerald-800 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    {savingManif ? 'Guardando...' : 'Añadir Manifestación'}
                  </button>
                </div>

                {/* Manifestations list */}
                {manifestations.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Manifestaciones creadas ({manifestations.length})</h3>
                    {manifestations.map((m, i) => {
                      const tl = typeLabel(m.type);
                      const expanded = expandedManifs.includes(i);
                      return (
                        <div key={i} className="bg-white/70 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                          <div className="flex items-center justify-between px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${tl.cls}`}>{tl.text}</span>
                              <span className="text-sm font-bold text-slate-700">{m.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setExpandedManifs(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <button onClick={() => handleDeleteManifestation(i)}
                                className="p-1.5 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-colors text-slate-300">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {expanded && m.description && (
                            <div className="px-5 pb-4 border-t border-slate-100 pt-3">
                              <p className="text-xs text-slate-500 leading-relaxed">{m.description}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {manifestations.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm italic bg-white/30 rounded-2xl border border-dashed border-slate-300">
                    Aún no has añadido ninguna manifestación
                  </div>
                )}
              </div>
            )}

            {/* Rules content */}
            {activeTab === 'rules' && (
              <div className="space-y-5">

                {/* Warning shown when no manifestations exist yet */}
                {manifestations.length === 0 && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      <strong>Recomendación:</strong> Primero añade las manifestaciones clínicas en la pestaña anterior. Las reglas hacen referencia a ellas.
                    </p>
                  </div>
                )}

                <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-300 p-6 shadow-sm space-y-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-emerald-100 rounded-lg"><GitBranch className="w-4 h-4 text-emerald-600" /></div>
                    <h2 className="text-lg font-bold text-slate-800">Nueva Regla de Combinación</h2>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre / Identificador <span className="text-rose-500">*</span></label>
                    <input
                      type="text" name="label" value={ruleForm.label}
                      onChange={e => setRuleForm(p => ({ ...p, label: e.target.value }))}
                      placeholder="ej: BD_ManifestationRule"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/5 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Descripción</label>
                    <textarea
                      value={ruleForm.description}
                      onChange={e => setRuleForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Descripción de la regla de combinación..."
                      rows="2"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/5 outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Rule type selector */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-2 block">Tipo de Regla</label>
                    <div className="space-y-2">
                      {RULE_TYPES.map(t => {
                        const active = ruleForm.ruleType === t.id;
                        return (
                          <button key={t.id} type="button" onClick={() => setRuleForm(p => ({ ...p, ruleType: t.id }))}
                            className={`w-full text-left p-3 rounded-xl border-2 transition-all ${active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300'}`}>
                            <p className={`text-sm font-bold ${active ? 'text-emerald-700' : 'text-slate-700'}`}>{t.label}</p>
                            <p className="text-[10px] text-slate-500 leading-snug">{t.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Affected manifestations */}
                  {manifestations.length > 0 && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-2 block">
                        Manifestaciones afectadas por esta regla
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {manifestations.map((m, i) => {
                          const checked = ruleForm.affectedProgressions.includes(m.label);
                          const tl = typeLabel(m.type);
                          return (
                            <label key={i} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checked ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300'}`}>
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${checked ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}
                                onClick={() => toggleAffected(m.label)}>
                                {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                              </div>
                              <input type="checkbox" className="hidden" checked={checked} onChange={() => toggleAffected(m.label)} />
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${tl.cls}`}>{tl.text}</span>
                              <span className="text-sm text-slate-700 font-medium">{m.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* hasNullProgression, only for Alternative progression sets */}
                  {ruleForm.ruleType === 'AlternativeDiseaseProgressionSet' && (
                    <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-xl border border-rose-200">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${ruleForm.hasNullProgression ? 'border-rose-500 bg-rose-500' : 'border-slate-300 bg-white'}`}
                          onClick={() => setRuleForm(p => ({ ...p, hasNullProgression: !p.hasNullProgression }))}>
                          {ruleForm.hasNullProgression && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-rose-700">hasNullProgression</p>
                          <p className="text-[10px] text-rose-600">Incluye rama "ninguna de las anteriores" como opción válida</p>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* hasFirst, only for Sequential progression sets */}
                  {ruleForm.ruleType === 'SequentialDiseaseProgressionSet' && ruleForm.affectedProgressions.length > 0 && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-2 block">Primer elemento de la secuencia (hasFirst)</label>
                      <select
                        value={ruleForm.hasFirst}
                        onChange={e => setRuleForm(p => ({ ...p, hasFirst: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/5 outline-none transition-all"
                      >
                        <option value="">-- Seleccionar primer elemento --</option>
                        {ruleForm.affectedProgressions.map(l => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    onClick={handleSaveRule}
                    disabled={savingRule || !ruleForm.label}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-linear-to-r from-emerald-600 to-emerald-800 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    {savingRule ? 'Guardando...' : 'Añadir Regla de Combinación'}
                  </button>
                </div>

                {/* Combination rules list */}
                {combinationRules.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Reglas creadas ({combinationRules.length})</h3>
                    {combinationRules.map((r, i) => {
                      const tl = typeLabel(r.ruleType);
                      const expanded = expandedRules.includes(i);
                      return (
                        <div key={i} className="bg-white/70 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                          <div className="flex items-center justify-between px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${tl.cls}`}>{tl.text}</span>
                              <span className="text-sm font-bold text-slate-700">{r.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setExpandedRules(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <button onClick={() => handleDeleteRule(i)}
                                className="p-1.5 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-colors text-slate-300">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {expanded && (
                            <div className="px-5 pb-4 border-t border-slate-100 pt-3 space-y-2">
                              {r.description && <p className="text-xs text-slate-500">{r.description}</p>}
                              {r.affectedProgressions.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Afecta a:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {r.affectedProgressions.map(l => (
                                      <span key={l} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">{l}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {r.ruleType === 'AlternativeDiseaseProgressionSet' && (
                                <p className="text-[10px] text-rose-600 font-medium">hasNullProgression: {r.hasNullProgression ? 'Sí' : 'No'}</p>
                              )}
                              {r.ruleType === 'SequentialDiseaseProgressionSet' && r.hasFirst && (
                                <p className="text-[10px] text-emerald-600 font-medium">hasFirst: {r.hasFirst}</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {combinationRules.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm italic bg-white/30 rounded-2xl border border-dashed border-slate-300">
                    Aún no has añadido ninguna regla de combinación
                  </div>
                )}
              </div>
            )}

            {/* Proceed to DevelopmentPage */}
            <button
              onClick={() => onNavigate('development')}
              className="w-full bg-linear-to-r from-emerald-600 to-emerald-900 text-white py-5 rounded-2xl font-bold hover:shadow-xl hover:shadow-emerald-500/30 transition-all active:scale-[0.98] flex items-center justify-center space-x-3 shadow-lg shadow-emerald-200"
            >
              <ArrowRight className="w-5 h-5" />
              <span className="text-lg">Continuar a Desarrollo</span>
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
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Enfermedad y elementos de progresión</p>
                  </div>
                </div>
                <div className="bg-emerald-100 px-4 py-1.5 rounded-full border border-emerald-200 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">{totalElements} elemento{totalElements !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            <div className="flex-1" style={{ position: 'relative' }}>
              <OntologyFlowGraph
                nodes={graphNodes}
                edges={graphEdges}
                emptyMessage="Añade manifestaciones y reglas para ver el grafo de progresión"
              />
            </div>

            <div className="px-8 py-4 bg-linear-to-r from-white to-emerald-50 shrink-0 border-t border-emerald-200">
              <p className="text-[10px] text-emerald-600 font-medium text-center tracking-widest italic">
                affectsProgressionElement → regla afecta a elemento · hasFirst → inicio de secuencia
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

export default ProgressionPage;
