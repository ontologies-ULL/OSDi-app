import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Pill, Book, ShieldCheck, Table as TableIcon, DollarSign, Zap, Sparkles } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

function InterventionsPage({ onNavigate, currentPage, diseaseData, populationData, interventionsData, setInterventionsData, developmentData }) {
  const [formData, setFormData] = useState({
    label: interventionsData.label || '',
    comment: interventionsData.comment || '',
    interventionType: interventionsData.interventionType || 'TherapeuticIntervention',
    isAssessed: interventionsData.isAssessed !== undefined ? interventionsData.isAssessed : true
  });

  const [costData, setCostData] = useState({
    value: interventionsData.costData?.value || '',
    currency: interventionsData.costData?.currency || 'Currency_Euro',
    appliesOneTime: interventionsData.costData?.appliesOneTime !== undefined ? interventionsData.costData.appliesOneTime : false,
    source: interventionsData.costData?.source || '',
    year: interventionsData.costData?.year || new Date().getFullYear().toString()
  });

  const [utilityData, setUtilityData] = useState({
    value: interventionsData.utilityData?.value || '',
    isDisutility: interventionsData.utilityData?.isDisutility !== undefined ? interventionsData.utilityData.isDisutility : false,
    appliesOneTime: interventionsData.utilityData?.appliesOneTime !== undefined ? interventionsData.utilityData.appliesOneTime : false,
    calculationMethod: interventionsData.utilityData?.calculationMethod || '',
    source: interventionsData.utilityData?.source || ''
  });

  const [effectData, setEffectData] = useState({
    effectType: interventionsData.effectData?.effectType || 'DI_Probability',
    value: interventionsData.effectData?.value || '',
    modifiesWhat: interventionsData.effectData?.modifiesWhat || '',
    description: interventionsData.effectData?.description || ''
  });

  const [detectionData, setDetectionData] = useState({
    sensitivity: interventionsData.detectionData?.sensitivity || '',
    sensitivitySource: interventionsData.detectionData?.sensitivitySource || '',
    specificity: interventionsData.detectionData?.specificity || '',
    specificitySource: interventionsData.detectionData?.specificitySource || ''
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setInterventionsData({
      label: formData.label,
      comment: formData.comment,
      interventionType: formData.interventionType,
      isAssessed: formData.isAssessed,
      costData: costData,
      utilityData: utilityData,
      effectData: effectData,
      detectionData: detectionData
    });
  }, [formData, costData, utilityData, effectData, detectionData, setInterventionsData]);

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleCostChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setCostData({ ...costData, [e.target.name]: value });
  };

  const handleUtilityChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setUtilityData({ ...utilityData, [e.target.name]: value });
  };

  const handleEffectChange = (e) => setEffectData({ ...effectData, [e.target.name]: e.target.value });

  const handleDetectionChange = (e) => setDetectionData({ ...detectionData, [e.target.name]: e.target.value });

  const createIndividual = async (individualData) => {
    const response = await fetch(`${API_BASE_URL}/ontology/individual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(individualData),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || 'Error creating individual');
    }

    return await response.json();
  };

  const handleSave = async () => {
    if (!formData.label) {
      setError('El nombre de la intervención es obligatorio');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const createdIndividuals = [];
      const interventionObjectProps = [];

      // 1. Crear parámetro de Coste (si existe)
      if (costData.value) {
        const costParam = await createIndividual({
          label: `${formData.label}_Cost`,
          comment: `Cost of ${formData.label}`,
          selectedClasses: ['Cost', 'DeterministicParameter'],
          datatypeProperties: [
            { property: 'hasExpectedValue', value: parseFloat(costData.value) },
            { property: 'appliesOneTime', value: costData.appliesOneTime },
            ...(costData.year ? [{ property: 'hasYear', value: parseInt(costData.year) }] : []),
            ...(costData.source ? [{ property: 'hasSource', value: costData.source }] : [])
          ],
          objectProperties: [
            { property: 'hasDataItemType', value: costData.currency }
          ]
        });
        interventionObjectProps.push({ property: 'hasCost', value: `${formData.label}_Cost` });
        createdIndividuals.push({ type: 'Cost Parameter', name: costParam.individual.label });
      }

      // 2. Crear parámetro de Utilidad (si existe)
      if (utilityData.value) {
        const utilityParam = await createIndividual({
          label: `${formData.label}_Utility`,
          comment: `Utility of ${formData.label}`,
          selectedClasses: ['Utility', 'DeterministicParameter'],
          datatypeProperties: [
            { property: 'hasExpectedValue', value: parseFloat(utilityData.value) },
            { property: 'isDisutility', value: utilityData.isDisutility },
            { property: 'appliesOneTime', value: utilityData.appliesOneTime },
            ...(utilityData.source ? [{ property: 'hasSource', value: utilityData.source }] : [])
          ],
          objectProperties: [
            { property: 'hasDataItemType', value: 'DI_Generic_Utility' }
          ]
        });
        interventionObjectProps.push({ property: 'hasUtility', value: `${formData.label}_Utility` });
        createdIndividuals.push({ type: 'Utility Parameter', name: utilityParam.individual.label });
      }

      // 3. Crear parámetro Modificador (efecto de la intervención)
      if (effectData.value && effectData.modifiesWhat) {
        const effectParam = await createIndividual({
          label: `${formData.label}_Effect`,
          comment: effectData.description || `Effect of ${formData.label}`,
          selectedClasses: ['ModifierParameter', 'DeterministicParameter'],
          datatypeProperties: [
            { property: 'hasExpectedValue', value: parseFloat(effectData.value) },
            ...(effectData.description ? [{ property: 'hasDescription', value: effectData.description }] : [])
          ],
          objectProperties: [
            { property: 'hasDataItemType', value: effectData.effectType },
            { property: 'modifies', value: effectData.modifiesWhat }
          ]
        });
        interventionObjectProps.push({ property: 'involvesModification', value: `${formData.label}_Effect` });
        createdIndividuals.push({ type: 'Effect Parameter', name: effectParam.individual.label });
      }

      // 4. Crear parámetros de Sensitivity y Specificity (solo para intervenciones de detección)
      const isDetectionIntervention = formData.interventionType === 'ScreeningIntervention' || 
                                       formData.interventionType === 'DiagnosisIntervention';

      if (isDetectionIntervention) {
        // 4a. Crear parámetro de Sensibilidad
        if (detectionData.sensitivity) {
          const sensitivityParam = await createIndividual({
            label: `${formData.label}_Sensitivity`,
            comment: `Sensitivity of ${formData.label}`,
            selectedClasses: ['Parameter', 'DeterministicParameter'],
            datatypeProperties: [
              { property: 'hasExpectedValue', value: parseFloat(detectionData.sensitivity) },
              ...(detectionData.sensitivitySource ? [{ property: 'hasSource', value: detectionData.sensitivitySource }] : [])
            ],
            objectProperties: [
              { property: 'hasDataItemType', value: 'DI_Sensitivity' }
            ]
          });
          interventionObjectProps.push({ property: 'hasSensitivity', value: `${formData.label}_Sensitivity` });
          createdIndividuals.push({ type: 'Sensitivity Parameter', name: sensitivityParam.individual.label });
        }

        // 4b. Crear parámetro de Especificidad
        if (detectionData.specificity) {
          const specificityParam = await createIndividual({
            label: `${formData.label}_Specificity`,
            comment: `Specificity of ${formData.label}`,
            selectedClasses: ['Parameter', 'DeterministicParameter'],
            datatypeProperties: [
              { property: 'hasExpectedValue', value: parseFloat(detectionData.specificity) },
              ...(detectionData.specificitySource ? [{ property: 'hasSource', value: detectionData.specificitySource }] : [])
            ],
            objectProperties: [
              { property: 'hasDataItemType', value: 'DI_Specificity' }
            ]
          });
          interventionObjectProps.push({ property: 'hasSpecificity', value: `${formData.label}_Specificity` });
          createdIndividuals.push({ type: 'Specificity Parameter', name: specificityParam.individual.label });
        }
      }

      // 5. Crear el individuo Intervention
      const interventionDataProps = [
        { property: 'isAssessedIntervention', value: formData.isAssessed },
        ...(formData.comment ? [{ property: 'hasDescription', value: formData.comment }] : [])
      ];

      const interventionResult = await createIndividual({
        label: formData.label,
        comment: formData.comment,
        selectedClasses: [formData.interventionType],
        datatypeProperties: interventionDataProps,
        objectProperties: interventionObjectProps
      });

      createdIndividuals.push({ type: 'Intervention', name: interventionResult.individual.label });

      console.log('✅ Individuos creados:', createdIndividuals);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message || 'Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const tableData = [
    { category: 'General', property: 'Nombre', value: formData.label || '-' },
    { category: 'General', property: 'Tipo', value: formData.interventionType || '-' },
    { category: 'General', property: '¿Evaluada?', value: formData.isAssessed ? 'Sí' : 'No' },
    { category: 'Económico', property: 'Coste', value: costData.value ? `${costData.value} €` : '-' },
    { category: 'Económico', property: 'Aplicación única', value: costData.appliesOneTime ? 'Sí' : 'No' },
    { category: 'Económico', property: 'Fuente coste', value: costData.source || '-' },
    { category: 'Calidad Vida', property: 'Utilidad', value: utilityData.value || '-' },
    { category: 'Calidad Vida', property: 'Tipo', value: utilityData.isDisutility ? 'Disutilidad' : 'Utilidad' },
    { category: 'Calidad Vida', property: 'Método', value: utilityData.calculationMethod || '-' },
    { category: 'Efectos', property: 'Tipo efecto', value: effectData.effectType || '-' },
    { category: 'Efectos', property: 'Valor', value: effectData.value || '-' },
    { category: 'Efectos', property: 'Modifica', value: effectData.modifiesWhat || '-' },
  ];

  // Añadir sensibilidad y especificidad solo si es intervención de detección
  const isDetectionIntervention = formData.interventionType === 'ScreeningIntervention' || 
                                   formData.interventionType === 'DiagnosisIntervention';
  
  if (isDetectionIntervention) {
    tableData.push(
      { category: 'Detección', property: 'Sensibilidad', value: detectionData.sensitivity || '-' },
      { category: 'Detección', property: 'Fuente Sensibilidad', value: detectionData.sensitivitySource || '-' },
      { category: 'Detección', property: 'Especificidad', value: detectionData.specificity || '-' },
      { category: 'Detección', property: 'Fuente Especificidad', value: detectionData.specificitySource || '-' }
    );
  }

  return (
    <div className="flex h-[calc(100vh-5.1rem)] bg-slate-200 overflow-hidden font-sans">

      {/* Mensajes Flotantes */}
      {(error || success) && (
        <div className="fixed top-24 right-8 z-50 animate-in fade-in slide-in-from-top-4">
          <div className={`flex items-center space-x-3 p-4 rounded-2xl shadow-xl border-l-4 ${error ? 'bg-white border-rose-500 text-rose-800' : 'bg-white border-emerald-500 text-emerald-800'
            }`}>
            {error ? <AlertCircle className="w-5 h-5 text-rose-500" /> : <CheckCircle className="w-5 h-5 text-emerald-500" />}
            <p className="text-sm font-bold">{error || '¡Intervención y efectos creados!'}</p>
          </div>
        </div>
      )}

      <div className="flex w-full p-8 gap-8 overflow-hidden">

        {/* PANEL IZQUIERDO: Formulario (Paleta Rose) */}
        <div className="w-1/2 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl space-y-6 pb-12">

            <div className="bg-gradient-to-br from-rose-600 via-rose-700 to-rose-900 rounded-3xl p-8 text-white">
              <div className="flex items-center space-x-3 mb-2">
                <Pill className="w-7 h-7" strokeWidth={2.5} />
                <h1 className="text-3xl font-bold">Intervenciones y sus efectos</h1>
              </div>
              <p className="text-rose-50/80 text-sm font-medium">Define los tratamientos y analiza sus resultados HEOR</p>
            </div>

            {/* Información General */}
            <div className="bg-white/60 rounded-3xl border border-slate-300 p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <Book className="w-4 h-4 text-rose-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Información General</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre <strong>*</strong></label>
                  <input
                    type="text"
                    name="label"
                    value={formData.label}
                    onChange={handleInputChange}
                    placeholder="ej: Cribado Neonatal"
                    className="w-full px-5 py-4 bg-white/80 border border-slate-300 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Descripción</label>
                  <textarea
                    name="comment"
                    value={formData.comment}
                    onChange={handleInputChange}
                    placeholder="ej: Intervención de cribado neonatal para detectar enfermedad X"
                    rows="2"
                    className="w-full px-5 py-4 bg-white/80 border border-slate-300 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all shadow-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tipo de Intervención</label>
                    <select
                      name="interventionType"
                      value={formData.interventionType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                    >
                      <option value="TherapeuticIntervention">Terapéutica</option>
                      <option value="ScreeningIntervention">Cribado</option>
                      <option value="DiagnosisIntervention">Diagnóstico</option>
                    </select>
                  </div>

                  <div className="space-y-2 flex items-end">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isAssessed"
                        checked={formData.isAssessed}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500"
                      />
                      <span className="text-sm font-bold text-slate-700">¿Es la intervención evaluada?</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Datos Económicos */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-300 p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <DollarSign className="w-4 h-4 text-rose-700" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Datos Económicos</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Coste</label>
                    <input
                      type="number"
                      step="0.01"
                      name="value"
                      value={costData.value}
                      onChange={handleCostChange}
                      placeholder="150.50"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Moneda</label>
                    <select
                      name="currency"
                      value={costData.currency}
                      onChange={handleCostChange}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                    >
                      <option value="Currency_Euro">Euro (€)</option>
                      <option value="Currency_Dollar">Dólar ($)</option>
                      <option value="Currency_Pound">Libra (£)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Año</label>
                    <input
                      type="number"
                      name="year"
                      value={costData.year}
                      onChange={handleCostChange}
                      placeholder="2024"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2 flex items-end">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="appliesOneTime"
                        checked={costData.appliesOneTime}
                        onChange={handleCostChange}
                        className="w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500"
                      />
                      <span className="text-xs font-bold text-slate-700">Aplicar una sola vez</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fuente</label>
                  <input
                    type="text"
                    name="source"
                    value={costData.source}
                    onChange={handleCostChange}
                    placeholder="ej: Base de datos de costes SNS 2024"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Sensibilidad y Especificidad (solo para intervenciones de detección) */}
            {(formData.interventionType === 'ScreeningIntervention' || formData.interventionType === 'DiagnosisIntervention') && (
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-300 p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-rose-100 rounded-lg">
                    <ShieldCheck className="w-4 h-4 text-rose-700" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">Sensibilidad y Especificidad</h2>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Sensibilidad (0-1)</label>
                      <input
                        type="number"
                        step="0.0001"
                        name="sensitivity"
                        value={detectionData.sensitivity}
                        onChange={handleDetectionChange}
                        placeholder="0.95"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fuente Sensibilidad</label>
                      <input
                        type="text"
                        name="sensitivitySource"
                        value={detectionData.sensitivitySource}
                        onChange={handleDetectionChange}
                        placeholder="ej: Estudio validación 2023"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Especificidad (0-1)</label>
                      <input
                        type="number"
                        step="0.0001"
                        name="specificity"
                        value={detectionData.specificity}
                        onChange={handleDetectionChange}
                        placeholder="0.98"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fuente Especificidad</label>
                      <input
                        type="text"
                        name="specificitySource"
                        value={detectionData.specificitySource}
                        onChange={handleDetectionChange}
                        placeholder="ej: Estudio validación 2023"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Utilidad/Calidad de Vida */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-300 p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <Sparkles className="w-4 h-4 text-rose-700" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Utilidad / Calidad de Vida</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valor</label>
                    <input
                      type="number"
                      step="0.001"
                      name="value"
                      value={utilityData.value}
                      onChange={handleUtilityChange}
                      placeholder="0.85"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Método de Cálculo</label>
                    <input
                      type="text"
                      name="calculationMethod"
                      value={utilityData.calculationMethod}
                      onChange={handleUtilityChange}
                      placeholder="EQ-5D"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 flex items-center">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isDisutility"
                        checked={utilityData.isDisutility}
                        onChange={handleUtilityChange}
                        className="w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500"
                      />
                      <span className="text-xs font-bold text-slate-700">Es una disutilidad</span>
                    </label>
                  </div>
                  <div className="space-y-2 flex items-center">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="appliesOneTime"
                        checked={utilityData.appliesOneTime}
                        onChange={handleUtilityChange}
                        className="w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500"
                      />
                      <span className="text-xs font-bold text-slate-700">Aplicar una sola vez</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fuente</label>
                  <input
                    type="text"
                    name="source"
                    value={utilityData.source}
                    onChange={handleUtilityChange}
                    placeholder="ej: Estudio de calidad de vida 2023"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Efectos/Modificaciones */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-300 p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <Zap className="w-4 h-4 text-rose-700" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Efectos de la Intervención</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tipo de Efecto</label>
                    <select
                      name="effectType"
                      value={effectData.effectType}
                      onChange={handleEffectChange}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                    >
                      <option value="DI_Probability">Probabilidad</option>
                      <option value="DI_RelativeRisk">Riesgo Relativo</option>
                      <option value="DI_MeanDifference">Diferencia de Medias</option>
                      <option value="DI_Factor">Factor</option>
                      <option value="DI_Continuous_Variable">Variable Continua</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valor del Efecto</label>
                    <input
                      type="number"
                      step="0.0001"
                      name="value"
                      value={effectData.value}
                      onChange={handleEffectChange}
                      placeholder="0.0"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Qué Modifica (Nombre del parámetro)</label>
                  <input
                    type="text"
                    name="modifiesWhat"
                    value={effectData.modifiesWhat}
                    onChange={handleEffectChange}
                    placeholder="ej: BD_Proportion_Seizures_PBD"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Descripción del Efecto</label>
                  <textarea
                    name="description"
                    value={effectData.description}
                    onChange={handleEffectChange}
                    placeholder="ej: Reduce a 0 la probabilidad de manifestaciones"
                    rows="2"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-rose-50/50 rounded-xl border border-rose-100">
              <ShieldCheck className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 leading-relaxed">
                <strong>Importante:</strong> El campo "Qué Modifica" debe contener el nombre exacto del parámetro que será modificado por esta intervención.
                Por ejemplo, si reduces la probabilidad de convulsiones, debes indicar el nombre del parámetro correspondiente en la ontología.
                {(formData.interventionType === 'ScreeningIntervention' || formData.interventionType === 'DiagnosisIntervention') && (
                  <span className="block mt-2">
                    <strong>Para intervenciones de detección:</strong> Los campos de Sensibilidad y Especificidad son importantes para caracterizar 
                    la capacidad diagnóstica de la intervención.
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !formData.label}
              className="w-full bg-gradient-to-r from-rose-600 via-rose-700 to-rose-900 text-white py-5 rounded-2xl font-bold hover:shadow-xl hover:shadow-rose-500/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-3"
            >
              <Save className="w-5 h-5" />
              <span className="text-lg">{saving ? 'Registrando...' : 'Guardar Intervención'}</span>
            </button>
          </div>
        </div>

        {/* PANEL DERECHO: Tabla (Rose / White Style) */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] flex flex-col h-full border-2 border-rose-500 overflow-hidden">

            <div className="p-8 bg-gradient-to-r from-rose-50 to-white shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-rose-600 rounded-2xl shadow-lg shadow-rose-200">
                    <TableIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Tabla de Intervención</h2>
                    <p className="text-[10px] text-rose-600 font-bold uppercase tracking-widest">Vista previa de los detalles de la intervención</p>
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
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${row.category === 'General' ? 'bg-rose-100 text-rose-700' :
                        row.category === 'Económico' ? 'bg-emerald-100 text-emerald-700' :
                          row.category === 'Calidad Vida' ? 'bg-blue-100 text-blue-700' :
                            row.category === 'Detección' ? 'bg-amber-100 text-amber-700' :
                              'bg-purple-100 text-purple-700'
                        }`}>
                        {row.category}
                      </span>
                    </div>
                    <div className="col-span-4 text-sm font-bold text-slate-400 tracking-tight">
                      {row.property}
                    </div>
                    <div className={`col-span-5 text-sm font-semibold truncate pr-4 ${row.value === '-' ? 'text-slate-300 italic' : 'text-slate-800'
                      }`}>
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          /* Color Rose-600 con opacidad */
          background: rgba(225, 29, 72, 0.3); 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          /* Color Rose-700 con más opacidad */
          background: rgba(190, 18, 60, 0.5); 
        }
      `}</style>
    </div>
  );
}

export default InterventionsPage;