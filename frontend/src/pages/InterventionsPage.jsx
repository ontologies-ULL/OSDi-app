import React, { useState, useEffect, useCallback } from 'react';
import { Save, AlertCircle, CheckCircle, Pill, Book, ShieldCheck, Target, Table as TableIcon, DollarSign, Zap, Sparkles, Plus, Pencil, X, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import ToggleButton from '../components/ToggleButton';
import CostCard from '../components/CostCard';
import UtilityCard from '../components/UtilityCard';
import DetectionParameterCard from '../components/DetectionParameterCard';
import { StochasticConfig } from '../components/AdvancedParameterComponent';
import useExpandableList from '../hooks/useExpandableList';
import useSaveStatus from '../hooks/useSaveStatus';
import { createIndividual, buildDistribution } from '../api/ontology';

// ── Empty templates ───────────────────────────────────────────────────────────
const EMPTY_COST = {
  name: '', value: '', currency: 'Currency_Euro', appliesOneTime: false,
  source: '', year: new Date().getFullYear().toString(),
  parameterType: 'Deterministic', distributionType: 'Normal',
  lowerBound: '', upperBound: '', standardDeviation: '',
  alpha: '', beta: '', lambda: '', mean: '',
  confidenceInterval: '95', sampleSize: ''
};

const EMPTY_UTILITY = {
  name: '', value: '', isDisutility: false, appliesOneTime: false,
  calculationMethod: '', source: '',
  parameterType: 'Deterministic', distributionType: 'Beta',
  lowerBound: '', upperBound: '', standardDeviation: '',
  alpha: '', beta: '', lambda: '', mean: '',
  confidenceInterval: '95', sampleSize: ''
};

const EMPTY_DETECTION_PARAM = {
  name: '', value: '', source: '',
  parameterType: 'Deterministic', distributionType: 'Beta',
  lowerBound: '', upperBound: '', standardDeviation: '',
  alpha: '', beta: '', lambda: '', mean: '',
  confidenceInterval: '95', sampleSize: ''
};

const EMPTY_EFFECT = {
  name: '',
  description: '',
  effectType: 'DI_Continuous_Variable',
  value: '',
  modifiesTargets: [],
  _modifiesInput: '',
  parameterType: 'Deterministic',
  distributionType: 'Normal',
  lowerBound: '', upperBound: '', standardDeviation: '',
  alpha: '', beta: '', mean: '',
  confidenceInterval: '95', sampleSize: ''
};

const EMPTY_FORM = {
  label: '', comment: '',
  interventionType: 'TherapeuticIntervention',
  isAssessed: true
};

function InterventionsPage({ onNavigate, currentPage, diseaseData, populationData, interventions, setInterventions, interventionToEdit, onInterventionToEditHandled }) {
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [costsData, expandedCosts, costHandlers] = useExpandableList([], EMPTY_COST);
  const [utilitiesData, expandedUtilities, utilityHandlers] = useExpandableList([], EMPTY_UTILITY);
  const [sensitivitiesData, expandedSensitivities, sensitivityHandlers] = useExpandableList([], EMPTY_DETECTION_PARAM);
  const [specificitiesData, expandedSpecificities, specificityHandlers] = useExpandableList([], EMPTY_DETECTION_PARAM);
  const [effectsData, expandedEffects, effectHandlers] = useExpandableList([], EMPTY_EFFECT);
  const [editingIndex, setEditingIndex] = useState(null);
  const { saving, success, error, withSave } = useSaveStatus();

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  // ── Load a saved intervention into the form ───────────────────────────────
  const loadIntervention = (index) => {
    const inv = interventions[index];
    setFormData({ ...inv.formData });
    costHandlers.reset(inv.costsData);
    utilityHandlers.reset(inv.utilitiesData);
    sensitivityHandlers.reset(inv.sensitivitiesData);
    specificityHandlers.reset(inv.specificitiesData);
    effectHandlers.reset(inv.effectsData || []);
    setEditingIndex(index);
  };

  // ── Auto-load (or reset) intervention selected from Navbar dropdown ───────
  useEffect(() => {
    if (interventionToEdit !== null) {
      if (interventionToEdit === -1) {
        cancelEdit();
      } else {
        loadIntervention(interventionToEdit);
      }
      onInterventionToEditHandled();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interventionToEdit]);

  const cancelEdit = () => {
    setFormData({ ...EMPTY_FORM });
    costHandlers.reset();
    utilityHandlers.reset();
    sensitivityHandlers.reset();
    specificityHandlers.reset();
    effectHandlers.reset();
    setEditingIndex(null);
  };

  // ── Create deterministic or stochastic parameter ──────────────────────────
  const createParameter = async (baseLabel, comment, classes, dataItemType, paramData, additionalDataProps = [], additionalObjectProps = []) => {
    const baseDataProps = [
      { property: 'hasExpectedValue', value: parseFloat(paramData.value) },
      ...(paramData.appliesOneTime !== undefined ? [{ property: 'appliesOneTime', value: paramData.appliesOneTime }] : []),
      ...(paramData.year ? [{ property: 'hasYear', value: parseInt(paramData.year) }] : []),
      ...(paramData.source ? [{ property: 'hasSource', value: paramData.source }] : []),
      ...(paramData.isDisutility !== undefined ? [{ property: 'isDisutility', value: paramData.isDisutility }] : []),
      ...additionalDataProps
    ];

    if (paramData.parameterType === 'Deterministic') {
      return await createIndividual({
        label: baseLabel, comment,
        selectedClasses: [...classes, 'DeterministicParameter'],
        datatypeProperties: baseDataProps,
        objectProperties: [{ property: 'hasDataItemType', value: dataItemType }, ...additionalObjectProps]
      });
    }

    const distributionLabel = await buildDistribution(baseLabel, paramData);

    return await createIndividual({
      label: baseLabel, comment,
      selectedClasses: [...classes, 'SecondOrderUncertaintyParameter'],
      datatypeProperties: baseDataProps,
      objectProperties: [
        { property: 'hasDataItemType', value: dataItemType },
        { property: 'hasUncertaintyCharacterization', value: distributionLabel },
        ...additionalObjectProps
      ]
    });
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!formData.label) return;

    withSave(async () => {
      const interventionObjectProps = [];

      // 1. Costs
      for (let i = 0; i < costsData.length; i++) {
        const cost = costsData[i];
        if (!cost.value) continue;
        const suffix = cost.name ? `_${cost.name.replace(/\s+/g, '_')}` : `_Cost${i + 1}`;
        const label = `${formData.label}${suffix}`;
        await createParameter(label, `${cost.name || `Cost ${i + 1}`} of ${formData.label}`, ['Cost'], cost.currency, cost);
        interventionObjectProps.push({ property: 'hasCost', value: label });
      }

      // 2. Utilities
      for (let i = 0; i < utilitiesData.length; i++) {
        const utility = utilitiesData[i];
        if (!utility.value) continue;
        const suffix = utility.name ? `_${utility.name.replace(/\s+/g, '_')}` : `_Utility${i + 1}`;
        const label = `${formData.label}${suffix}`;
        await createParameter(label, `${utility.name || `Utility ${i + 1}`} of ${formData.label}`, ['Utility'], 'DI_Generic_Utility', utility);
        interventionObjectProps.push({ property: 'hasUtility', value: label });
      }

      // 3. Effects (ModifierParameter — each can modify multiple targets)
      for (let i = 0; i < effectsData.length; i++) {
        const effect = effectsData[i];
        if (!effect.value) continue;
        const suffix = effect.name ? `_${effect.name.replace(/\s+/g, '_')}` : `_Effect${effectsData.length > 1 ? i + 1 : ''}`;
        const effectLabel = `${formData.label}${suffix}`;
        const modifiesProps = (effect.modifiesTargets || []).map(t => ({ property: 'modifies', value: t }));
        const extraDataProps = effect.description ? [{ property: 'hasDescription', value: effect.description }] : [];
        await createParameter(
          effectLabel,
          effect.description || `Effect of ${formData.label}`,
          ['ModifierParameter'],
          effect.effectType,
          effect,
          extraDataProps,
          modifiesProps
        );
        interventionObjectProps.push({ property: 'involvesModification', value: effectLabel });
      }

      // 4. Sensitivities
      for (let i = 0; i < sensitivitiesData.length; i++) {
        const sens = sensitivitiesData[i];
        if (!sens.value) continue;
        const suffix = sens.name ? `_${sens.name.replace(/\s+/g, '_')}` : `_Sensitivity${sensitivitiesData.length > 1 ? i + 1 : ''}`;
        const label = `${formData.label}${suffix}`;
        await createParameter(label, `${sens.name || `Sensitivity ${i + 1}`} of ${formData.label}`, ['Parameter'], 'DI_Sensitivity', sens);
        interventionObjectProps.push({ property: 'hasSensitivity', value: label });
      }

      // 5. Specificities
      for (let i = 0; i < specificitiesData.length; i++) {
        const spec = specificitiesData[i];
        if (!spec.value) continue;
        const suffix = spec.name ? `_${spec.name.replace(/\s+/g, '_')}` : `_Specificity${specificitiesData.length > 1 ? i + 1 : ''}`;
        const label = `${formData.label}${suffix}`;
        await createParameter(label, `${spec.name || `Specificity ${i + 1}`} of ${formData.label}`, ['Parameter'], 'DI_Specificity', spec);
        interventionObjectProps.push({ property: 'hasSpecificity', value: label });
      }

      // 6. Intervention individual
      await createIndividual({
        label: formData.label,
        comment: formData.comment,
        selectedClasses: [formData.interventionType],
        datatypeProperties: [
          { property: 'isAssessedIntervention', value: formData.isAssessed },
          ...(formData.comment ? [{ property: 'hasDescription', value: formData.comment }] : [])
        ],
        objectProperties: interventionObjectProps
      });

      // 7. Save snapshot to list
      const snapshot = {
        formData: { ...formData },
        costsData: costsData.map(c => ({ ...c })),
        utilitiesData: utilitiesData.map(u => ({ ...u })),
        sensitivitiesData: sensitivitiesData.map(s => ({ ...s })),
        specificitiesData: specificitiesData.map(s => ({ ...s })),
        effectsData: effectsData.map(e => ({ ...e })),
      };

      if (editingIndex !== null) {
        setInterventions(prev => prev.map((item, i) => i === editingIndex ? snapshot : item));
        setEditingIndex(null);
      } else {
        setInterventions(prev => [...prev, snapshot]);
      }

      // Reset form
      setFormData({ ...EMPTY_FORM });
      costHandlers.reset();
      utilityHandlers.reset();
      sensitivityHandlers.reset();
      specificityHandlers.reset();
      effectHandlers.reset();
    });
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const typeLabel = (type) => {
    switch (type) {
      case 'TherapeuticIntervention': return 'Terapéutica';
      case 'ScreeningIntervention': return 'Cribado';
      case 'DiagnosisIntervention': return 'Diagnóstico';
      default: return type;
    }
  };

  // ── Table data for right panel preview ────────────────────────────────────
  const MAX_CHARS = 21;
  const truncate = (text, max = MAX_CHARS) => text.length > max ? `${text.slice(0, max)}…` : text;

  const tableData = [
    { category: 'General', property: 'Nombre', value: formData.label || '-' },
    { category: 'General', property: 'Tipo', value: typeLabel(formData.interventionType) },
    { category: 'General', property: 'Estado', value: formData.isAssessed ? 'Evaluada' : 'No evaluada' },
  ];
  costsData.forEach((cost, i) => tableData.push(
    { category: 'Costes', property: cost.name ? truncate(cost.name) : `Coste ${i + 1}`, value: cost.value ? `${cost.value} €` : '-' },
    { category: 'Costes', property: 'Tipo pago', value: cost.appliesOneTime ? 'Pago único' : 'Pago anual' },
    { category: 'Costes', property: 'Parámetro', value: cost.parameterType === 'Stochastic' ? `Estocástico (${cost.distributionType})` : 'Determinístico' },
    { category: 'Costes', property: 'Fuente', value: cost.source || '-' },
  ));
  utilitiesData.forEach((utility, i) => tableData.push(
    { category: 'Utilidades', property: utility.name ? truncate(utility.name) : `Utilidad ${i + 1}`, value: utility.value || '-' },
    { category: 'Utilidades', property: 'Tipo', value: utility.isDisutility ? 'Desutilidad' : 'Utilidad' },
    { category: 'Utilidades', property: 'Parámetro', value: utility.parameterType === 'Stochastic' ? `Estocástico (${utility.distributionType})` : 'Determinístico' },
    { category: 'Utilidades', property: 'Fuente', value: utility.source || '-' },
  ));
  sensitivitiesData.forEach((sens, i) => tableData.push(
    { category: 'Sensibilidad', property: sens.name ? truncate(sens.name) : `Sensibilidad ${i + 1}`, value: sens.value || '-' },
    { category: 'Sensibilidad', property: 'Parámetro', value: sens.parameterType === 'Stochastic' ? `Estocástico (${sens.distributionType})` : 'Determinístico' },
    { category: 'Sensibilidad', property: 'Fuente', value: sens.source || '-' },
  ));
  specificitiesData.forEach((spec, i) => tableData.push(
    { category: 'Especificidad', property: spec.name ? truncate(spec.name) : `Especificidad ${i + 1}`, value: spec.value || '-' },
    { category: 'Especificidad', property: 'Parámetro', value: spec.parameterType === 'Stochastic' ? `Estocástico (${spec.distributionType})` : 'Determinístico' },
    { category: 'Especificidad', property: 'Fuente', value: spec.source || '-' },
  ));
  effectsData.forEach((effect, i) => {
    if (!effect.value && !effect.name) return;
    tableData.push(
      { category: 'Efectos', property: effect.name ? truncate(effect.name) : `Efecto ${i + 1}`, value: effect.value || '-' },
      { category: 'Efectos', property: 'Tipo OSDi', value: effect.effectType || '-' },
      { category: 'Efectos', property: 'Parámetro', value: effect.parameterType === 'Stochastic' ? `Estocástico (${effect.distributionType})` : 'Determinístico' },
      { category: 'Efectos', property: 'Modifica', value: effect.modifiesTargets?.length ? effect.modifiesTargets.join(', ') : '-' },
    );
  });

  const categoryColor = (cat) => {
    switch (cat) {
      case 'General':     return 'bg-slate-200 text-slate-600';
      case 'Costes':      return 'bg-blue-100 text-blue-700';
      case 'Utilidades':  return 'bg-green-100 text-green-700';
      case 'Sensibilidad':return 'bg-yellow-100 text-yellow-700';
      case 'Efectos':     return 'bg-rose-100 text-rose-700';
      default:            return 'bg-purple-100 text-purple-700';
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-5.1rem)] bg-slate-200 overflow-hidden font-sans">

      {/* Floating messages */}
      {(error || success) && (
        <div className="fixed top-24 right-8 z-50 animate-in fade-in slide-in-from-top-4">
          <div className={`flex items-center space-x-3 p-4 rounded-2xl shadow-xl border-l-4 ${error ? 'bg-white border-rose-500 text-rose-800' : 'bg-white border-emerald-500 text-emerald-800'}`}>
            {error ? <AlertCircle className="w-5 h-5 text-rose-500" /> : <CheckCircle className="w-5 h-5 text-emerald-500" />}
            <p className="text-sm font-bold">{error || (editingIndex !== null ? '¡Intervención actualizada!' : '¡Intervención creada!')}</p>
          </div>
        </div>
      )}

      <div className="flex w-full p-8 gap-8 overflow-hidden">

        {/* ══ LEFT PANEL ══════════════════════════════════════════════════════ */}
        <div className="w-1/2 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl space-y-6 pb-12">

            {/* Header */}
            <div className="bg-linear-to-br from-rose-600 via-rose-700 to-rose-900 rounded-3xl p-8 text-white">
              <div className="flex items-center space-x-3 mb-2">
                <Pill className="w-7 h-7" strokeWidth={2.5} />
                <h1 className="text-3xl font-bold">Intervenciones y sus efectos</h1>
              </div>
              <p className="text-rose-50/80 text-sm font-medium">Define los tratamientos y analiza sus resultados HEOR</p>
            </div>

            {/* Edit mode banner */}
            {editingIndex !== null && (
              <div className="flex items-center justify-between px-5 py-3 bg-amber-50 border-2 border-amber-300 rounded-2xl">
                <div className="flex items-center gap-2 text-amber-800">
                  <Pencil className="w-4 h-4" />
                  <span className="text-sm font-bold">Editando: <span className="text-amber-900">{interventions[editingIndex]?.formData.label}</span></span>
                </div>
              </div>
            )}

            {/* General Info */}
            <div className="bg-white/60 rounded-3xl border border-slate-300 p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-rose-100 rounded-lg"><Book className="w-4 h-4 text-rose-600" /></div>
                <h2 className="text-lg font-bold text-slate-800">Información General</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre <strong>*</strong></label>
                  <input type="text" name="label" value={formData.label} onChange={handleInputChange}
                    placeholder="ej: Cribado Neonatal"
                    className="w-full px-5 py-4 bg-white/80 border border-slate-300 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all shadow-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Descripción</label>
                  <textarea name="comment" value={formData.comment} onChange={handleInputChange}
                    placeholder="ej: Intervención de cribado neonatal para detectar enfermedad X" rows="2"
                    className="w-full px-5 py-4 bg-white/80 border border-slate-300 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all shadow-sm resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tipo de Intervención</label>
                    <select name="interventionType" value={formData.interventionType} onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all">
                      <option value="TherapeuticIntervention">Terapéutica</option>
                      <option value="ScreeningIntervention">Cribado</option>
                      <option value="DiagnosisIntervention">Diagnóstico</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Estado de Evaluación</label>
                    <ToggleButton value={formData.isAssessed} onChange={handleInputChange}
                      option1="No evaluada" option2="Evaluada" name="isAssessed" />
                  </div>
                </div>
              </div>
            </div>

            {/* Costs */}
            <SectionCard icon={<DollarSign className="w-4 h-4 text-rose-700" />}
              title="Costes de la Intervención"
              badge={`${costsData.length} coste${costsData.length !== 1 ? 's' : ''}`}
              onAdd={costHandlers.add} addLabel="Añadir nuevo coste">
              {costsData.map((cost, i) => (
                <CostCard key={i} costData={cost} index={i}
                  onUpdate={costHandlers.update} onDelete={costHandlers.delete}
                  canDelete={costsData.length > 1}
                  isExpanded={expandedCosts.includes(i)} onToggleExpand={() => costHandlers.toggle(i)} />
              ))}
            </SectionCard>

            {/* Utilities */}
            <SectionCard icon={<Sparkles className="w-4 h-4 text-rose-700" />}
              title="Utilidad"
              badge={`${utilitiesData.length} utilidad${utilitiesData.length !== 1 ? 'es' : ''}`}
              onAdd={utilityHandlers.add} addLabel="Añadir nueva utilidad">
              {utilitiesData.map((utility, i) => (
                <UtilityCard key={i} utilityData={utility} index={i}
                  onUpdate={utilityHandlers.update} onDelete={utilityHandlers.delete}
                  canDelete={utilitiesData.length > 1}
                  isExpanded={expandedUtilities.includes(i)} onToggleExpand={() => utilityHandlers.toggle(i)} />
              ))}
            </SectionCard>

            {/* Sensitivities — solo para cribado/diagnóstico */}
            {(formData.interventionType === 'ScreeningIntervention' || formData.interventionType === 'DiagnosisIntervention') && (
              <>
                <SectionCard icon={<ShieldCheck className="w-4 h-4 text-rose-700" />}
                  title="Sensibilidad"
                  badge={`${sensitivitiesData.length} parámetro${sensitivitiesData.length !== 1 ? 's' : ''}`}
                  onAdd={sensitivityHandlers.add} addLabel="Añadir nueva sensibilidad">
                  {sensitivitiesData.map((sens, i) => (
                    <DetectionParameterCard key={i} type="sensitivity" paramData={sens} index={i}
                      onUpdate={sensitivityHandlers.update} onDelete={sensitivityHandlers.delete}
                      canDelete={sensitivitiesData.length > 1}
                      isExpanded={expandedSensitivities.includes(i)} onToggleExpand={() => sensitivityHandlers.toggle(i)} />
                  ))}
                </SectionCard>

                <SectionCard icon={<Target className="w-4 h-4 text-rose-700" />}
                  title="Especificidad"
                  badge={`${specificitiesData.length} parámetro${specificitiesData.length !== 1 ? 's' : ''}`}
                  onAdd={specificityHandlers.add} addLabel="Añadir nueva especificidad">
                  {specificitiesData.map((spec, i) => (
                    <DetectionParameterCard key={i} type="specificity" paramData={spec} index={i}
                      onUpdate={specificityHandlers.update} onDelete={specificityHandlers.delete}
                      canDelete={specificitiesData.length > 1}
                      isExpanded={expandedSpecificities.includes(i)} onToggleExpand={() => specificityHandlers.toggle(i)} />
                  ))}
                </SectionCard>
              </>
            )}

            {/* Effects */}
            <SectionCard icon={<Zap className="w-4 h-4 text-rose-700" />}
              title="Efectos de la Intervención"
              badge={`${effectsData.length} efecto${effectsData.length !== 1 ? 's' : ''}`}
              onAdd={effectHandlers.add} addLabel="Añadir nuevo efecto">
              {effectsData.map((effect, i) => (
                <EffectCard key={i} effectData={effect} index={i}
                  onUpdate={effectHandlers.update} onDelete={effectHandlers.delete}
                  canDelete={effectsData.length > 1}
                  isExpanded={expandedEffects.includes(i)} onToggleExpand={() => effectHandlers.toggle(i)} />
              ))}
            </SectionCard>

            {/* Save button */}
            <button onClick={handleSave} disabled={saving || !formData.label}
              className="w-full bg-linear-to-r from-rose-600 via-rose-700 to-rose-900 text-white py-5 rounded-2xl font-bold hover:shadow-xl hover:shadow-rose-500/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-3">
              <Save className="w-5 h-5" />
              <span className="text-lg">
                {saving ? 'Guardando...' : editingIndex !== null ? 'Actualizar Intervención' : 'Guardar Intervención'}
              </span>
            </button>
          </div>
        </div>

        {/* ══ RIGHT PANEL: Preview table ══════════════════════════════════════ */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] flex flex-col h-full border-2 border-rose-500 overflow-hidden">

            <div className="p-8 bg-linear-to-r from-rose-50 to-white shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-rose-600 rounded-2xl shadow-lg shadow-rose-200">
                    <TableIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Tabla de Intervención</h2>
                    <p className="text-[10px] text-rose-600 font-bold uppercase tracking-widest">Vista previa de los detalles</p>
                  </div>
                </div>
                <div className="bg-rose-100 px-4 py-1.5 rounded-full border border-rose-200 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-rose-700 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-widest">En vivo</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pt-6 custom-scrollbar">
              <div className="space-y-2 pb-4">
                <div className="grid grid-cols-12 px-4 mb-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <div className="col-span-3">Categoría</div>
                  <div className="col-span-4">Atributo</div>
                  <div className="col-span-5">Valor</div>
                </div>
                {tableData.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 items-center bg-slate-50/50 hover:bg-white hover:shadow-md hover:scale-[1.01] transition-all duration-200 p-4 rounded-2xl border border-slate-200/50">
                    <div className="col-span-3">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${categoryColor(row.category)}`}>
                        {row.category}
                      </span>
                    </div>
                    <div className="col-span-4 text-sm font-bold text-slate-400 tracking-tight">{row.property}</div>
                    <div className={`col-span-5 text-sm font-semibold truncate pr-4 ${row.value === '-' ? 'text-slate-300 italic' : 'text-slate-800'}`}>
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-8 py-4 bg-linear-to-r from-white to-rose-50 shrink-0">
              <p className="text-[10px] text-rose-600 font-medium text-center tracking-widest italic">
                Esta tabla muestra una vista previa de los campos de la intervención y sus efectos asociados.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(226, 232, 240, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(225, 29, 72, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(190, 18, 60, 0.5); }
      `}</style>
    </div>
  );
}


// ── Section wrapper ───────────────────────────────────────────────────────────
function SectionCard({ icon, title, badge, onAdd, addLabel, children }) {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-300 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-rose-100 rounded-lg">{icon}</div>
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-100 rounded-full border border-rose-200">
          <div className="w-2 h-2 bg-rose-600 rounded-full" />
          <span className="text-xs font-bold text-rose-700">{badge}</span>
        </div>
      </div>
      <div className="space-y-3">
        {children}
        <button type="button" onClick={onAdd}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-linear-to-r from-rose-50 to-white hover:from-rose-100 hover:to-rose-50 border-2 border-dashed border-rose-300 hover:border-rose-400 rounded-2xl transition-all group">
          <div className="p-2 bg-rose-100 group-hover:bg-rose-200 rounded-lg transition-colors">
            <Plus className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-sm font-bold text-rose-700">{addLabel}</span>
        </button>
      </div>
    </div>
  );
}


// ── Effect card ───────────────────────────────────────────────────────────────
function EffectCard({ effectData, index, onUpdate, onDelete, canDelete, isExpanded, onToggleExpand }) {
  const handleChange = useCallback((e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    onUpdate(index, { ...effectData, [e.target.name]: value });
  }, [onUpdate, index, effectData]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(index);
  }, [onDelete, index]);

  const addTarget = () => {
    const val = effectData._modifiesInput?.trim();
    if (!val || effectData.modifiesTargets.includes(val)) {
      onUpdate(index, { ...effectData, _modifiesInput: '' });
      return;
    }
    onUpdate(index, { ...effectData, modifiesTargets: [...effectData.modifiesTargets, val], _modifiesInput: '' });
  };

  const removeTarget = (t) => {
    onUpdate(index, { ...effectData, modifiesTargets: effectData.modifiesTargets.filter(x => x !== t) });
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); addTarget(); } };

  const isStochastic = effectData.parameterType === 'Stochastic';

  return (
    <div className="bg-slate-50 backdrop-blur-sm rounded-2xl border-2 border-slate-200 overflow-hidden transition-all hover:border-slate-300 hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between p-4 cursor-pointer bg-linear-to-r from-slate-200/50 to-white" onClick={onToggleExpand}>
        <div className="flex items-center gap-3 flex-1">
          {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-600" /> : <ChevronRight className="w-5 h-5 text-slate-600" />}
          <div className="p-2 bg-slate-100 rounded-lg">
            <Zap className="w-4 h-4 text-slate-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-800">{effectData.name || `Efecto ${index + 1}`}</h3>
            <p className="text-xs text-slate-500">
              {effectData.value ? effectData.value : 'Sin definir'} • {isStochastic ? 'Estocástico' : 'Determinístico'}
              {effectData.modifiesTargets?.length > 0 && ` • modifica ${effectData.modifiesTargets.length} parámetro${effectData.modifiesTargets.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        {canDelete && (
          <button type="button" onClick={handleDelete} className="p-2 hover:bg-slate-100 rounded-lg transition-colors group">
            <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
          </button>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-6 pt-4 space-y-4 border-t border-slate-100 bg-white/40">

          {/* Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre del Efecto</label>
            <input type="text" name="name" value={effectData.name} onChange={handleChange}
              placeholder="ej: Reducción de mortalidad a 5 años"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all" />
          </div>

          {/* Mode toggle */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Modo de Configuración</label>
            <ToggleButton
              value={isStochastic}
              onChange={(e) => handleChange({ target: { name: 'parameterType', value: e.target.value ? 'Stochastic' : 'Deterministic' } })}
              option1="Simple (Determinístico)" option2="Avanzado (Estocástico)" name="parameterType" />
          </div>

          {/* Deterministic fields */}
          {!isStochastic && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valor Esperado</label>
                <input type="number" step="0.0001" name="value" value={effectData.value} onChange={handleChange}
                  placeholder="0.0"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tipo OSDi</label>
                <select name="effectType" value={effectData.effectType} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all">
                  <option value="DI_Continuous_Variable">Variable Continua</option>
                  <option value="DI_Probability">Probabilidad</option>
                  <option value="DI_RelativeRisk">Riesgo Relativo</option>
                  <option value="DI_MeanDifference">Diferencia de Medias</option>
                  <option value="DI_Factor">Factor</option>
                </select>
              </div>
            </div>
          )}

          {/* Stochastic fields */}
          {isStochastic && (
            <>
              <StochasticConfig data={effectData} onChange={handleChange} />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valor Esperado</label>
                  <input type="number" step="0.0001" name="value" value={effectData.value} onChange={handleChange}
                    placeholder="0.0"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tipo OSDi</label>
                  <select name="effectType" value={effectData.effectType} onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all">
                    <option value="DI_Continuous_Variable">Variable Continua</option>
                    <option value="DI_Probability">Probabilidad</option>
                    <option value="DI_RelativeRisk">Riesgo Relativo</option>
                    <option value="DI_MeanDifference">Diferencia de Medias</option>
                    <option value="DI_Factor">Factor</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Descripción</label>
            <textarea name="description" value={effectData.description} onChange={handleChange}
              placeholder="ej: Reduce a 0 la probabilidad de manifestaciones agudas" rows="2"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all resize-none" />
          </div>

          {/* modifies targets */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Parámetros que modifica</label>
            {effectData.modifiesTargets?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {effectData.modifiesTargets.map((t) => (
                  <span key={t} className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full border border-slate-200">
                    {t}
                    <button type="button" onClick={() => removeTarget(t)} className="hover:text-slate-900 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input type="text" name="_modifiesInput" value={effectData._modifiesInput} onChange={handleChange} onKeyDown={handleKeyDown}
                placeholder="ej: Pérdida de visibilidad"
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all" />
              <button type="button" onClick={addTarget}
                className="px-3 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 ml-1">Escribe el nombre exacto del parámetro y pulsa Enter o +</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default InterventionsPage;
