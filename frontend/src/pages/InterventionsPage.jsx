import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Pill, Book, ShieldCheck, Target, Table as TableIcon, DollarSign, Zap, Sparkles, Settings, Plus } from 'lucide-react';
import ToggleButton from '../components/ToggleButton';
import CostCard from '../components/CostCard';
import UtilityCard from '../components/UtilityCard';
import DetectionParameterCard from '../components/DetectionParameterCard';
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
  effectType: 'DI_Probability', value: '', modifiesWhat: '', description: '',
  parameterType: 'Deterministic', distributionType: 'Normal',
  lowerBound: '', upperBound: '', standardDeviation: '',
  alpha: '', beta: '', mean: '', confidenceInterval: '95', sampleSize: ''
};

function InterventionsPage({ onNavigate, currentPage, diseaseData, populationData, interventionsData, setInterventionsData, developmentData }) {
  const [formData, setFormData] = useState({
    label: interventionsData.label || '',
    comment: interventionsData.comment || '',
    interventionType: interventionsData.interventionType || 'TherapeuticIntervention',
    isAssessed: interventionsData.isAssessed !== undefined ? interventionsData.isAssessed : true
  });

  const [costsData,         expandedCosts,         costHandlers]        = useExpandableList(interventionsData.costsData,         EMPTY_COST);
  const [utilitiesData,     expandedUtilities,     utilityHandlers]     = useExpandableList(interventionsData.utilitiesData,     EMPTY_UTILITY);
  const [sensitivitiesData, expandedSensitivities, sensitivityHandlers] = useExpandableList(interventionsData.sensitivitiesData, EMPTY_DETECTION_PARAM);
  const [specificitiesData, expandedSpecificities, specificityHandlers] = useExpandableList(interventionsData.specificitiesData, EMPTY_DETECTION_PARAM);

  const [effectData, setEffectData] = useState({ ...EMPTY_EFFECT, ...interventionsData.effectData });
  const [showAdvancedEffect, setShowAdvancedEffect] = useState(false);

  const { saving, success, error, withSave } = useSaveStatus();

  // ── Sync to parent ────────────────────────────────────────────────────────
  useEffect(() => {
    setInterventionsData({
      label: formData.label,
      comment: formData.comment,
      interventionType: formData.interventionType,
      isAssessed: formData.isAssessed,
      costsData, utilitiesData, sensitivitiesData, specificitiesData, effectData,
    });
  }, [formData, costsData, utilitiesData, sensitivitiesData, specificitiesData, effectData, setInterventionsData]);

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleEffectChange = (e) => setEffectData({ ...effectData, [e.target.name]: e.target.value });

  // ── Create deterministic or stochastic parameter ──────────────────────────
  const createParameter = async (baseLabel, comment, classes, dataItemType, paramData, additionalDataProps = [], additionalObjectProps = []) => {
    const baseDataProps = [
      { property: 'hasExpectedValue', value: parseFloat(paramData.value) },
      ...(paramData.appliesOneTime !== undefined ? [{ property: 'appliesOneTime', value: paramData.appliesOneTime }] : []),
      ...(paramData.year        ? [{ property: 'hasYear',     value: parseInt(paramData.year) }] : []),
      ...(paramData.source      ? [{ property: 'hasSource',   value: paramData.source }]         : []),
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
        { property: 'hasDataItemType',                value: dataItemType },
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
        const label  = `${formData.label}${suffix}`;
        await createParameter(label, `${cost.name || `Cost ${i + 1}`} of ${formData.label}`, ['Cost'], cost.currency, cost);
        interventionObjectProps.push({ property: 'hasCost', value: label });
      }

      // 2. Utilities
      for (let i = 0; i < utilitiesData.length; i++) {
        const utility = utilitiesData[i];
        if (!utility.value) continue;
        const suffix = utility.name ? `_${utility.name.replace(/\s+/g, '_')}` : `_Utility${i + 1}`;
        const label  = `${formData.label}${suffix}`;
        await createParameter(label, `${utility.name || `Utility ${i + 1}`} of ${formData.label}`, ['Utility'], 'DI_Generic_Utility', utility);
        interventionObjectProps.push({ property: 'hasUtility', value: label });
      }

      // 3. Effect
      if (effectData.value && effectData.modifiesWhat) {
        const effectLabel = `${formData.label}_Effect`;
        await createParameter(
          effectLabel,
          effectData.description || `Effect of ${formData.label}`,
          ['ModifierParameter'],
          effectData.effectType,
          effectData,
          effectData.description ? [{ property: 'hasDescription', value: effectData.description }] : [],
          [{ property: 'modifies', value: effectData.modifiesWhat }]
        );
        interventionObjectProps.push({ property: 'involvesModification', value: effectLabel });
      }

      // 4. Sensitivities
      for (let i = 0; i < sensitivitiesData.length; i++) {
        const sens = sensitivitiesData[i];
        if (!sens.value) continue;
        const suffix = sens.name ? `_${sens.name.replace(/\s+/g, '_')}` : `_Sensitivity${sensitivitiesData.length > 1 ? i + 1 : ''}`;
        const label  = `${formData.label}${suffix}`;
        await createParameter(label, `${sens.name || `Sensitivity ${i + 1}`} of ${formData.label}`, ['Parameter'], 'DI_Sensitivity', sens);
        interventionObjectProps.push({ property: 'hasSensitivity', value: label });
      }

      // 5. Specificities
      for (let i = 0; i < specificitiesData.length; i++) {
        const spec = specificitiesData[i];
        if (!spec.value) continue;
        const suffix = spec.name ? `_${spec.name.replace(/\s+/g, '_')}` : `_Specificity${specificitiesData.length > 1 ? i + 1 : ''}`;
        const label  = `${formData.label}${suffix}`;
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
    });
  };

  // ── Table data ────────────────────────────────────────────────────────────
  const MAX_CHARS = 21;
  const truncate = (text, max = MAX_CHARS) => text.length > max ? `${text.slice(0, max)}…` : text;

  const tableData = [
    { category: 'General', property: 'Nombre', value: formData.label || '-' },
    { category: 'General', property: 'Tipo',   value: formData.interventionType || '-' },
    { category: 'General', property: 'Estado', value: formData.isAssessed ? 'Evaluada' : 'No evaluada' },
  ];

  costsData.forEach((cost, i) => tableData.push(
    { category: 'Costes', property: cost.name ? truncate(cost.name) : `Coste ${i + 1}`, value: cost.value ? `${cost.value} €` : '-' },
    { category: 'Costes', property: 'Tipo pago',  value: cost.appliesOneTime ? 'Pago único' : 'Pago anual' },
    { category: 'Costes', property: 'Parámetro',  value: cost.parameterType === 'Stochastic' ? `Estocástico (${cost.distributionType})` : 'Determinístico' },
    { category: 'Costes', property: 'Fuente',     value: cost.source || '-' },
  ));

  utilitiesData.forEach((utility, i) => tableData.push(
    { category: 'Utilidades', property: utility.name ? truncate(utility.name) : `Utilidad ${i + 1}`, value: utility.value || '-' },
    { category: 'Utilidades', property: 'Tipo',      value: utility.isDisutility ? 'Desutilidad' : 'Utilidad' },
    { category: 'Utilidades', property: 'Parámetro', value: utility.parameterType === 'Stochastic' ? `Estocástico (${utility.distributionType})` : 'Determinístico' },
    { category: 'Utilidades', property: 'Fuente',    value: utility.source || '-' },
  ));

  sensitivitiesData.forEach((sens, i) => tableData.push(
    { category: 'Sensibilidad', property: sens.name ? truncate(sens.name) : `Sensibilidad ${i + 1}`, value: sens.value || '-' },
    { category: 'Sensibilidad', property: 'Parámetro', value: sens.parameterType === 'Stochastic' ? `Estocástico (${sens.distributionType})` : 'Determinístico' },
    { category: 'Sensibilidad', property: 'Fuente',    value: sens.source || '-' },
  ));

  specificitiesData.forEach((spec, i) => tableData.push(
    { category: 'Especificidad', property: spec.name ? truncate(spec.name) : `Especificidad ${i + 1}`, value: spec.value || '-' },
    { category: 'Especificidad', property: 'Parámetro', value: spec.parameterType === 'Stochastic' ? `Estocástico (${spec.distributionType})` : 'Determinístico' },
    { category: 'Especificidad', property: 'Fuente',    value: spec.source || '-' },
  ));

  tableData.push(
    { category: 'Efectos', property: 'Tipo efecto', value: effectData.effectType || '-' },
    { category: 'Efectos', property: 'Valor',       value: effectData.value || '-' },
    { category: 'Efectos', property: 'Parámetro',   value: effectData.parameterType === 'Stochastic' ? `Estocástico (${effectData.distributionType})` : 'Determinístico' },
    { category: 'Efectos', property: 'Modifica',    value: effectData.modifiesWhat || '-' },
  );

  const categoryColor = (cat) => {
    switch (cat) {
      case 'General':       return 'bg-slate-200 text-slate-600';
      case 'Costes':        return 'bg-blue-100 text-blue-700';
      case 'Utilidades':    return 'bg-green-100 text-green-700';
      case 'Sensibilidad':  return 'bg-yellow-100 text-yellow-700';
      case 'Efectos':       return 'bg-rose-100 text-rose-700';
      default:              return 'bg-purple-100 text-purple-700';
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
            <p className="text-sm font-bold">{error || '¡Intervención y efectos creados!'}</p>
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

            {/* Sensitivities */}
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

            {/* Specificities */}
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

            {/* Effects */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-300 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-rose-100 rounded-lg"><Zap className="w-4 h-4 text-rose-700" /></div>
                  <h2 className="text-lg font-bold text-slate-800">Efectos de la Intervención</h2>
                </div>
                <button type="button" onClick={() => setShowAdvancedEffect(true)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-linear-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 rounded-lg transition-all shadow-md hover:shadow-lg">
                  <Settings className="w-4 h-4" /><span>Opciones avanzadas</span>
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tipo de Efecto</label>
                    <select name="effectType" value={effectData.effectType} onChange={handleEffectChange}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all">
                      <option value="Probabilidad">Probabilidad</option>
                      <option value="Riesgo Relativo">Riesgo Relativo</option>
                      <option value="Diferencia de Medias">Diferencia de Medias</option>
                      <option value="Factor">Factor</option>
                      <option value="Variable Continua">Variable Continua</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valor del Efecto</label>
                    <input type="number" step="0.0001" name="value" value={effectData.value} onChange={handleEffectChange}
                      placeholder="0.0"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Qué Modifica (Nombre del parámetro)</label>
                  <input type="text" name="modifiesWhat" value={effectData.modifiesWhat} onChange={handleEffectChange}
                    placeholder="ej: BD_Proportion_Seizures_PBD"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Descripción del Efecto</label>
                  <textarea name="description" value={effectData.description} onChange={handleEffectChange}
                    placeholder="ej: Reduce a 0 la probabilidad de manifestaciones" rows="2"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all resize-none" />
                </div>
              </div>
            </div>

            {/* Info note */}
            <div className="flex items-start space-x-3 p-4 bg-rose-50/50 rounded-xl border border-rose-100">
              <ShieldCheck className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 leading-relaxed">
                <strong>Importante:</strong> El campo "Qué Modifica" debe contener el nombre exacto del parámetro que será modificado. Para sensibilidad y especificidad se recomienda la distribución <strong>Beta</strong> al estar acotada entre 0 y 1.
              </div>
            </div>

            {/* Save button */}
            <button onClick={handleSave} disabled={saving || !formData.label}
              className="w-full bg-linear-to-r from-rose-600 via-rose-700 to-rose-900 text-white py-5 rounded-2xl font-bold hover:shadow-xl hover:shadow-rose-500/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-3">
              <Save className="w-5 h-5" />
              <span className="text-lg">{saving ? 'Registrando...' : 'Guardar Intervención'}</span>
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

      {/* ══ MODAL: Advanced Effect Options ══════════════════════════════════ */}
      {showAdvancedEffect && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border-2 border-rose-200">
            <div className="bg-linear-to-r from-rose-600 to-rose-700 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl"><Zap className="w-6 h-6 text-white" /></div>
                <h2 className="text-2xl font-bold text-white">Opciones Avanzadas - Efectos</h2>
              </div>
              <button onClick={() => setShowAdvancedEffect(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white text-2xl leading-none font-bold">
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] custom-scrollbar">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700">Tipo de Parámetro</label>
                  <ToggleButton
                    value={effectData.parameterType === 'Stochastic'}
                    onChange={(e) => handleEffectChange({ target: { name: 'parameterType', value: e.target.value ? 'Stochastic' : 'Deterministic' } })}
                    option1="Determinístico" option2="Estocástico" name="parameterType" />
                  <p className="text-xs text-slate-500">
                    <strong>Determinístico:</strong> Valor fijo. <strong>Estocástico:</strong> Incluye incertidumbre mediante distribución probabilística.
                  </p>
                </div>

                {effectData.parameterType === 'Stochastic' && (
                  <>
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700">Tipo de Distribución</label>
                      <select name="distributionType" value={effectData.distributionType} onChange={handleEffectChange}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 outline-none transition-all">
                        <option value="Normal">Normal</option>
                        <option value="Uniform">Uniforme</option>
                        <option value="Gamma">Gamma</option>
                      </select>
                    </div>
                    {(effectData.distributionType === 'Normal' || effectData.distributionType === 'LogNormal') && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-600 uppercase">Media</label>
                          <input type="number" step="0.0001" name="mean" value={effectData.mean} onChange={handleEffectChange} placeholder="0.75"
                            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-rose-500 outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-600 uppercase">Desviación Estándar</label>
                          <input type="number" step="0.0001" name="standardDeviation" value={effectData.standardDeviation} onChange={handleEffectChange} placeholder="0.05"
                            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-rose-500 outline-none transition-all" />
                        </div>
                      </div>
                    )}
                    {effectData.distributionType === 'Uniform' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-600 uppercase">Límite Inferior</label>
                          <input type="number" step="0.0001" name="lowerBound" value={effectData.lowerBound} onChange={handleEffectChange} placeholder="0.5"
                            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-rose-500 outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-600 uppercase">Límite Superior</label>
                          <input type="number" step="0.0001" name="upperBound" value={effectData.upperBound} onChange={handleEffectChange} placeholder="1.0"
                            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-rose-500 outline-none transition-all" />
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase">Intervalo de Confianza (%)</label>
                        <select name="confidenceInterval" value={effectData.confidenceInterval} onChange={handleEffectChange}
                          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-rose-500 outline-none transition-all">
                          <option value="90">90%</option>
                          <option value="95">95%</option>
                          <option value="99">99%</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase">Tamaño de Muestra</label>
                        <input type="number" name="sampleSize" value={effectData.sampleSize} onChange={handleEffectChange} placeholder="500"
                          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-rose-500 outline-none transition-all" />
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-xs text-blue-800">
                        <strong>Recomendación:</strong> Para RR u OR usa Log-Normal. Para probabilidades (0-1) usa Beta. Para diferencias de medias usa Normal.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => setShowAdvancedEffect(false)}
                className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(226, 232, 240, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(225, 29, 72, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(190, 18, 60, 0.5); }
      `}</style>
    </div>
  );
}

// ── Section wrapper: header + badge + list + add button ──────────────────────
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

export default InterventionsPage;
