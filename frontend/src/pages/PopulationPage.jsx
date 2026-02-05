import React, { useState, useEffect } from 'react';
import { Book, Save, AlertCircle, CheckCircle, Users, Hospital, ShieldCheck, Table as TableIcon } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

function PopulationPage({ onNavigate, currentPage, diseaseData, populationData, setPopulationData, developmentData }) {
  const [formData, setFormData] = useState({
    label: populationData.label || '',
    comment: populationData.comment || '',
  });

  const [demographics, setDemographics] = useState({
    age: populationData.demographics?.age || '',
    minAge: populationData.demographics?.minAge || '',
    femaleProportion: populationData.demographics?.femaleProportion || '',
    geographicLocation: populationData.demographics?.geographicLocation || '',
    populationSize: populationData.demographics?.populationSize || ''
  });

  const [epidemiology, setEpidemiology] = useState({
    prevalence: populationData.epidemiology?.prevalence || '',
    prevalenceSource: populationData.epidemiology?.prevalenceSource || '',
    incidence: populationData.epidemiology?.incidence || '',
    incidenceSource: populationData.epidemiology?.incidenceSource || '',
    mortality: populationData.epidemiology?.mortality || '',
    mortalitySource: populationData.epidemiology?.mortalitySource || ''
  });

  const [lifeExpectancy, setLifeExpectancy] = useState({
    value: populationData.lifeExpectancy?.value || '',
    source: populationData.lifeExpectancy?.source || ''
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setPopulationData({
      label: formData.label,
      comment: formData.comment,
      demographics: demographics,
      epidemiology: epidemiology,
      lifeExpectancy: lifeExpectancy
    });
  }, [formData, demographics, epidemiology, lifeExpectancy, setPopulationData]);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleDemographicsChange = (e) => setDemographics({ ...demographics, [e.target.name]: e.target.value });
  const handleEpidemiologyChange = (e) => setEpidemiology({ ...epidemiology, [e.target.name]: e.target.value });
  const handleLifeExpectancyChange = (e) => setLifeExpectancy({ ...lifeExpectancy, [e.target.name]: e.target.value });

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
      setError('El nombre de la población es obligatorio');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const createdIndividuals = [];

      // 1. Crear parámetro de Edad (Age)
      if (demographics.age) {
        const ageParam = await createIndividual({
          label: `${formData.label}_Age`,
          comment: `Age of the ${formData.label} population`,
          selectedClasses: ['Parameter', 'DeterministicParameter'],
          datatypeProperties: [
            { property: 'hasExpectedValue', value: parseFloat(demographics.age) }
          ],
          objectProperties: [
            { property: 'isValueOfAttribute', value: 'Attribute_Age' }
          ]
        });
        createdIndividuals.push({ type: 'Age Parameter', name: ageParam.individual.label });
      }

      // 2. Crear parámetro de Sexo (Female Proportion)
      if (demographics.femaleProportion) {
        const sexParam = await createIndividual({
          label: `${formData.label}_FemaleProportion`,
          comment: `Female proportion in ${formData.label} population`,
          selectedClasses: ['Parameter', 'DeterministicParameter'],
          datatypeProperties: [
            { property: 'hasExpectedValue', value: parseFloat(demographics.femaleProportion) }
          ],
          objectProperties: [
            { property: 'isValueOfAttribute', value: 'Attribute_Sex' }
          ]
        });
        createdIndividuals.push({ type: 'Sex Parameter', name: sexParam.individual.label });
      }

      // 3. Crear parámetro de Esperanza de Vida
      if (lifeExpectancy.value) {
        const lifeExpParam = await createIndividual({
          label: `${formData.label}_LifeExpectancy`,
          comment: `Life expectancy for ${formData.label} population`,
          selectedClasses: ['Parameter', 'DeterministicParameter'],
          datatypeProperties: [
            { property: 'hasExpectedValue', value: parseFloat(lifeExpectancy.value) },
            ...(lifeExpectancy.source ? [{ property: 'hasSource', value: lifeExpectancy.source }] : [])
          ],
          objectProperties: []
        });
        createdIndividuals.push({ type: 'Life Expectancy Parameter', name: lifeExpParam.individual.label });
      }

      // 4. Crear parámetros epidemiológicos
      const epidemioParams = [];

      if (epidemiology.prevalence) {
        const prevParam = await createIndividual({
          label: `${formData.label}_Prevalence`,
          comment: `Prevalence for ${formData.label}`,
          selectedClasses: ['Parameter', 'DeterministicParameter', 'EpidemiologicalParameter'],
          datatypeProperties: [
            { property: 'hasExpectedValue', value: parseFloat(epidemiology.prevalence) },
            { property: 'hasDataItemType', value: 'DI_Prevalence' },
            ...(epidemiology.prevalenceSource ? [{ property: 'hasSource', value: epidemiology.prevalenceSource }] : [])
          ],
          objectProperties: []
        });
        epidemioParams.push(`${formData.label}_Prevalence`);
        createdIndividuals.push({ type: 'Prevalence Parameter', name: prevParam.individual.label });
      }

      if (epidemiology.incidence) {
        const incParam = await createIndividual({
          label: `${formData.label}_Incidence`,
          comment: `Incidence for ${formData.label}`,
          selectedClasses: ['Parameter', 'DeterministicParameter', 'EpidemiologicalParameter'],
          datatypeProperties: [
            { property: 'hasExpectedValue', value: parseFloat(epidemiology.incidence) },
            { property: 'hasDataItemType', value: 'DI_Incidence' },
            ...(epidemiology.incidenceSource ? [{ property: 'hasSource', value: epidemiology.incidenceSource }] : [])
          ],
          objectProperties: []
        });
        epidemioParams.push(`${formData.label}_Incidence`);
        createdIndividuals.push({ type: 'Incidence Parameter', name: incParam.individual.label });
      }

      if (epidemiology.mortality) {
        const mortParam = await createIndividual({
          label: `${formData.label}_Mortality`,
          comment: `Mortality for ${formData.label}`,
          selectedClasses: ['Parameter', 'DeterministicParameter', 'EpidemiologicalParameter'],
          datatypeProperties: [
            { property: 'hasExpectedValue', value: parseFloat(epidemiology.mortality) },
            ...(epidemiology.mortalitySource ? [{ property: 'hasSource', value: epidemiology.mortalitySource }] : [])
          ],
          objectProperties: []
        });
        epidemioParams.push(`${formData.label}_Mortality`);
        createdIndividuals.push({ type: 'Mortality Parameter', name: mortParam.individual.label });
      }

      // 5. Crear el individuo Population
      const populationObjectProps = [];

      if (demographics.age) {
        populationObjectProps.push({ property: 'hasAge', value: `${formData.label}_Age` });
      }

      if (demographics.femaleProportion) {
        populationObjectProps.push({ property: 'hasSex', value: `${formData.label}_FemaleProportion` });
      }

      if (lifeExpectancy.value) {
        populationObjectProps.push({ property: 'hasLifeExpectancy', value: `${formData.label}_LifeExpectancy` });
      }

      // Agregar parámetros epidemiológicos
      epidemioParams.forEach(paramName => {
        populationObjectProps.push({ property: 'hasEpidemiologicalParameter', value: paramName });
      });

      const populationDataProps = [
        ...(formData.comment ? [{ property: 'hasDescription', value: formData.comment }] : []),
        ...(demographics.geographicLocation ? [{ property: 'hasGeographicalContext', value: demographics.geographicLocation }] : []),
        ...(demographics.minAge ? [{ property: 'hasMinAge', value: parseFloat(demographics.minAge) }] : []),
        ...(demographics.populationSize ? [{ property: 'hasSize', value: parseInt(demographics.populationSize) }] : [])
      ];

      const populationResult = await createIndividual({
        label: formData.label,
        comment: formData.comment,
        selectedClasses: ['Population'],
        datatypeProperties: populationDataProps,
        objectProperties: populationObjectProps
      });

      createdIndividuals.push({ type: 'Population', name: populationResult.individual.label });

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
    { category: 'General', property: 'Descripción', value: formData.comment || '-' },
    { category: 'General', property: 'Tamaño', value: demographics.populationSize || '-' },
    { category: 'Demografía', property: 'Edad', value: demographics.age || '-' },
    { category: 'Demografía', property: 'Edad Mínima', value: demographics.minAge || '-' },
    { category: 'Demografía', property: 'Proporción Femenina', value: demographics.femaleProportion || '-' },
    { category: 'Demografía', property: 'Ubicación', value: demographics.geographicLocation || '-' },
    { category: 'Expectativa', property: 'Esperanza de Vida', value: lifeExpectancy.value || '-' },
    { category: 'Expectativa', property: 'Fuente', value: lifeExpectancy.source || '-' },
    { category: 'Epidemiología', property: 'Prevalencia', value: epidemiology.prevalence || '-' },
    { category: 'Epidemiología', property: 'Fuente Prevalencia', value: epidemiology.prevalenceSource || '-' },
    { category: 'Epidemiología', property: 'Incidencia', value: epidemiology.incidence || '-' },
    { category: 'Epidemiología', property: 'Fuente Incidencia', value: epidemiology.incidenceSource || '-' },
    { category: 'Epidemiología', property: 'Mortalidad', value: epidemiology.mortality || '-' },
    { category: 'Epidemiología', property: 'Fuente Mortalidad', value: epidemiology.mortalitySource || '-' },
  ];

  return (
    <div className="flex h-[calc(100vh-5.1rem)] bg-slate-200 overflow-hidden font-sans">

      {/* Mensajes */}
      {(error || success) && (
        <div className="fixed top-24 right-8 z-50 animate-in fade-in slide-in-from-top-4">
          <div className={`flex items-center space-x-3 p-4 rounded-2xl shadow-xl border-l-4 ${error ? 'bg-white border-rose-500 text-rose-800' : 'bg-white border-blue-500 text-blue-800'
            }`}>
            {error ? <AlertCircle className="w-5 h-5 text-rose-500" /> : <CheckCircle className="w-5 h-5 text-blue-500" />}
            <p className="text-sm font-bold">{error || '¡Población y parámetros creados!'}</p>
          </div>
        </div>
      )}

      <div className="flex h-full w-full p-8 gap-8 overflow-hidden">

        {/* PANEL IZQUIERDO: Formulario */}
        <div className="w-1/2 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl space-y-6">

            <div className="bg-linear-to-br from-blue-700 via-blue-800 to-blue-900 rounded-3xl p-8 text-white">
              <div className="flex items-center space-x-3 mb-2">
                <Users className="w-7 h-7" strokeWidth={2.5} />
                <h1 className="text-3xl font-bold">Población afectada</h1>
              </div>
              <p className="text-blue-50/80 text-sm font-medium">Define la población y sus parámetros</p>
            </div>

            {/* Información General */}
            <div className="bg-white/60 rounded-3xl border border-slate-300 p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Book className="w-4 h-4 text-blue-600" />                </div>
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
                    placeholder="ej: Población con riesgo de enfermedad X"
                    className="w-full px-5 py-4 bg-white/80 border border-slate-300 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Descripción <strong>*</strong></label>
                  <textarea
                    name="comment"
                    value={formData.comment}
                    onChange={handleInputChange}
                    placeholder="ej: Población en España con riesgo de contraer la enfermedad X debido a factores Y y Z."
                    rows="2"
                    className="w-full px-5 py-4 bg-white/80 border border-slate-300 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Demografía */}
            <div className="bg-white/60 rounded-3xl border border-slate-300 p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Demografía</h2>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Edad (años)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="age"
                    value={demographics.age}
                    onChange={handleDemographicsChange}
                    placeholder="0"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Edad Mínima</label>
                  <input
                    type="number"
                    step="0.1"
                    name="minAge"
                    value={demographics.minAge}
                    onChange={handleDemographicsChange}
                    placeholder="0"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Proporción Femenina (0-1)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="femaleProportion"
                    value={demographics.femaleProportion}
                    onChange={handleDemographicsChange}
                    placeholder="0.5"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tamaño Poblacional</label>
                  <input
                    type="number"
                    name="populationSize"
                    value={demographics.populationSize}
                    onChange={handleDemographicsChange}
                    placeholder="540963"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Ubicación</label>
                  <input
                    type="text"
                    name="geographicLocation"
                    value={demographics.geographicLocation}
                    onChange={handleDemographicsChange}
                    placeholder="Spain @https://www.wikidata.org/wiki/q29"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Esperanza de Vida */}
            <div className="bg-white/60 rounded-3xl border border-slate-300 p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Esperanza de Vida</h2>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valor (años)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="value"
                    value={lifeExpectancy.value}
                    onChange={handleLifeExpectancyChange}
                    placeholder="80.5"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fuente</label>
                  <input
                    type="text"
                    name="source"
                    value={lifeExpectancy.source}
                    onChange={handleLifeExpectancyChange}
                    placeholder="INE 2023"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Epidemiología */}
            <div className="bg-white/60 rounded-3xl border border-slate-300 p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Hospital className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Epidemiología</h2>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Prevalencia</label>
                    <input
                      type="number"
                      step="0.0000001"
                      name="prevalence"
                      value={epidemiology.prevalence}
                      onChange={handleEpidemiologyChange}
                      placeholder="0.0000147885"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fuente</label>
                    <input
                      type="text"
                      name="prevalenceSource"
                      value={epidemiology.prevalenceSource}
                      onChange={handleEpidemiologyChange}
                      placeholder="Galicia NBS"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Incidencia</label>
                    <input
                      type="number"
                      step="0.0001"
                      name="incidence"
                      value={epidemiology.incidence}
                      onChange={handleEpidemiologyChange}
                      placeholder="0.0116"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fuente</label>
                    <input
                      type="text"
                      name="incidenceSource"
                      value={epidemiology.incidenceSource}
                      onChange={handleEpidemiologyChange}
                      placeholder="Study 2023"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Mortalidad</label>
                    <input
                      type="number"
                      step="0.001"
                      name="mortality"
                      value={epidemiology.mortality}
                      onChange={handleEpidemiologyChange}
                      placeholder="0.052"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fuente</label>
                    <input
                      type="text"
                      name="mortalitySource"
                      value={epidemiology.mortalitySource}
                      onChange={handleEpidemiologyChange}
                      placeholder="WHO 2023"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800 leading-relaxed">
                Los parámetros con <strong>*</strong> son obligatorios para crear la población afectada en el modelo. Asegúrate de completarlos antes de guardar.
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !formData.label}
              className="w-full bg-linear-to-r from-blue-700 via-blue-800 to-blue-900 text-white py-5 rounded-2xl font-bold hover:shadow-xl hover:shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-3 shadow-lg"
            >
              <Save className="w-5 h-5" />
              <span className="text-lg">{saving ? 'Creando...' : 'Guardar parámetros'}</span>
            </button>
          </div>
        </div>

        {/* PANEL DERECHO: Tabla */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] flex flex-col h-full border-2 border-blue-500 overflow-hidden">

            <div className="p-8 bg-linear-to-r from-blue-100 to-white shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                    <TableIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Tabla de Población afectada</h2>
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Vista previa de la población creada</p>
                  </div>
                </div>
                <div className="bg-blue-100 px-4 py-1.5 rounded-full border border-blue-200 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">En vivo</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pt-6 custom-scrollbar">
              <div className="space-y-2 pb-4">
                <div className="grid grid-cols-12 px-4 mb-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <div className="col-span-3">Categoría</div>
                  <div className="col-span-4">Atributo</div>
                  <div className="col-span-5">Valor Capturado</div>
                </div>

                {tableData.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 items-center bg-slate-50/50 hover:bg-white hover:shadow-md hover:scale-[1.01] transition-all duration-200 p-4 rounded-2xl border border-slate-200/50">
                    <div className="col-span-3">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${row.category === 'General' ? 'bg-slate-200 text-slate-600' :
                        row.category === 'Demografía' ? 'bg-emerald-100 text-emerald-700' :
                          row.category === 'Expectativa' ? 'bg-blue-100 text-blue-500' :
                            'bg-rose-100 text-rose-600'
                        }`}>
                        {row.category}
                      </span>
                    </div>
                    <div className="col-span-4 text-sm font-bold text-slate-400 tracking-tight">
                      {row.property}
                    </div>
                    <div className={`col-span-5 text-sm font-semibold truncate pr-4 ${row.value === '-' ? 'text-slate-300 italic font-normal' : 'text-slate-800'
                      }`}>
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-8 py-4 bg-linear-to-r from-white to-blue-100 shrink-0">
              <p className="text-[10px] text-blue-600 font-medium text-center tracking-widest italic">
                Esta tabla muestra una vista previa de los campos acerca de la población afectada.
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
          background: rgba(29, 78, 216, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(29, 78, 216, 0.5);
        }
      `}</style>
    </div>
  );
}

export default PopulationPage;