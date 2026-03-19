/**
 * @file PopulationPage.jsx
 * @brief Page for defining the affected population in the OSDi model.
 *
 * Allows the user to create and edit `Population` individuals in the OSDi
 * ontology, together with all their associated parameters, and user-defined custom attributes.
 *
 * @module pages/PopulationPage
 */

import React, { useState, useEffect } from 'react';
import { Book, Save, AlertCircle, CheckCircle, Users, ShieldCheck, Table as TableIcon, Plus, Trash2, Pencil } from 'lucide-react';
import ToggleButton from '../components/ToggleButton';
import { StochasticConfig } from '../components/AdvancedParameterComponent';
import useEpiParameter from '../hooks/useEpiParameter';
import useSaveStatus from '../hooks/useSaveStatus';
import useCustomAttributes from '../hooks/useCustomAttributes';
import { createIndividual, createStochasticParameter } from '../api/ontology';
import EpidemiologicalParameterCard from '../components/EpidemiologicalParameterCard';

/**
 * @brief Initial empty state for the general population form.
 * @property {string} label             - Local IRI name of the ontology individual.
 * @property {string} comment           - Free-text description of the population.
 * @property {string} associatedDisease - Label of the associated disease (only used when there is more than one disease).
 */
const EMPTY_FORM = { label: '', comment: '', associatedDisease: '' };

/**
 * @brief Initial empty state for the demographics section.
 * @property {string} age                 - Mean age of the population (years).
 * @property {string} minAge              - Minimum age bound (years).
 * @property {string} maxAge              - Maximum age bound (years).
 * @property {string} geographicLocation  - Geographic context (e.g. "Spain @wikidata").
 * @property {string} populationSize      - Total size of the population.
 */
const EMPTY_DEMOGRAPHICS = {
  age: '', minAge: '', maxAge: '', geographicLocation: '', populationSize: ''
};

/**
 * @brief Initial empty state for the female proportion parameter.
 *
 * Supports both deterministic and second-order stochastic modes.
 * Distribution parameters are only used when `isStochastic` is true.
 *
 * @property {boolean} isStochastic       - Whether a probability distribution is used.
 * @property {string}  femaleProportion   - Point estimate of the female proportion [0-1].
 * @property {string}  source             - Bibliographic source of the data.
 * @property {string}  comment            - Additional notes.
 * @property {string}  distributionType   - Distribution family (default: 'Beta').
 * @property {string}  mean               - Distribution mean.
 * @property {string}  standardDeviation  - Distribution standard deviation.
 * @property {string}  lowerBound         - Lower bound of the distribution.
 * @property {string}  upperBound         - Upper bound of the distribution.
 * @property {string}  alpha              - Alpha shape parameter (Beta / Gamma).
 * @property {string}  beta               - Beta shape parameter (Beta / Gamma).
 * @property {string}  lambda             - Rate parameter (Poisson / Exponential).
 * @property {string}  confidenceInterval - Confidence interval width (default: '95').
 * @property {string}  sampleSize         - Sample size used to estimate the parameter.
 */
const EMPTY_SEX = {
  isStochastic: false, femaleProportion: '', source: '', comment: '',
  distributionType: 'Beta', mean: '', standardDeviation: '',
  lowerBound: '', upperBound: '', alpha: '', beta: '', lambda: '',
  confidenceInterval: '95', sampleSize: ''
};

/**
 * @brief Initial empty state for the life expectancy parameter.
 *
 * Mirrors the structure of EMPTY_SEX but uses a Normal distribution by
 * default and exposes a generic `value` field instead of `femaleProportion`.
 *
 * @property {boolean} isStochastic       - Whether a probability distribution is used.
 * @property {string}  value              - Point estimate of life expectancy (years).
 * @property {string}  source             - Bibliographic source of the data.
 * @property {string}  distributionType   - Distribution family (default: 'Normal').
 * @property {string}  mean               - Distribution mean.
 * @property {string}  standardDeviation  - Distribution standard deviation.
 * @property {string}  lowerBound         - Lower bound of the distribution.
 * @property {string}  upperBound         - Upper bound of the distribution.
 * @property {string}  alpha              - Alpha shape parameter.
 * @property {string}  beta               - Beta shape parameter.
 * @property {string}  lambda             - Rate parameter.
 * @property {string}  confidenceInterval - Confidence interval width (default: '95').
 * @property {string}  sampleSize         - Sample size used to estimate the parameter.
 */
const EMPTY_LIFE_EXPECTANCY = {
  isStochastic: false, value: '', source: '', distributionType: 'Normal',
  mean: '', standardDeviation: '', lowerBound: '', upperBound: '',
  alpha: '', beta: '', lambda: '', confidenceInterval: '95', sampleSize: ''
};

/**
 * @brief React page component for creating and editing Population individuals.
 *
 * Renders a two-column layout:
 * - **Left panel** — form with sections for general info, demographics, sex,
 *   life expectancy, epidemiological parameters, and custom attributes.
 * - **Right panel** — live preview table that reflects the current form values.
 *
 * On save, the component sequentially calls the ontology API to persist each
 * sub-parameter as a separate individual, then creates the main `Population`
 * individual linking all of them via object properties.
 *
 * @param {Function}  props.onNavigate                - Callback to navigate to another page.
 * @param {string}    props.currentPage               - Identifier of the active page.
 * @param {Object}    props.diseaseData               - Global disease data (fallback when no disease list).
 * @param {Array}     props.diseases                  - Array of all saved disease snapshots.
 * @param {Array}     props.populations               - Array of all saved population snapshots.
 * @param {Function}  props.setPopulations            - State setter for the populations array.
 * @param {number|null} props.populationToEdit        - Index of the population to load for editing, or -1 to reset the form, or null for no-op.
 * @param {Function}  props.onPopulationToEditHandled - Callback to acknowledge the edit request.
 *
 * @returns {JSX.Element} The rendered population page.
 */
function PopulationPage({ onNavigate, currentPage, diseaseData, diseases = [], populations, setPopulations, populationToEdit, onPopulationToEditHandled }) {
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [demographics, setDemographics] = useState({ ...EMPTY_DEMOGRAPHICS });
  const [sexData, setSexData] = useState({ ...EMPTY_SEX });
  const [lifeExpectancy, handleLifeExpectancyChange, setLifeExpectancy] = useEpiParameter({ ...EMPTY_LIFE_EXPECTANCY });
  const [prevalenceData, handlePrevalenceChange, setPrevalenceData] = useEpiParameter();
  const [incidenceData, handleIncidenceChange, setIncidenceData] = useEpiParameter();
  const [mortalityData, handleMortalityChange, setMortalityData] = useEpiParameter();
  const [customAttributes, attrHandlers] = useCustomAttributes([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const { saving, success, error, withSave } = useSaveStatus();

  /** @brief Generic change handler for the general form fields. */
  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  /** @brief Generic change handler for the demographics fields. */
  const handleDemographicsChange = (e) => setDemographics({ ...demographics, [e.target.name]: e.target.value });

  /**
   * @brief Resolves which disease label to associate with the population.
   *
   * - Single disease: uses the only available disease label automatically.
   * - Multiple diseases: uses the value selected in the form dropdown.
   * - No disease list: falls back to the global `diseaseData.label` prop.
   */
  const effectiveDiseaseLabel =
    diseases.length === 1 ? diseases[0].diseaseData.label :
      diseases.length > 1 ? formData.associatedDisease :
        diseaseData.label;

  /**
   * @brief Loads a previously saved population snapshot into the form for editing.
   * @param {number} index - Index of the population in the `populations` array.
   */
  const loadPopulation = (index) => {
    const pop = populations[index];
    setFormData({ ...pop.formData });
    setDemographics({ ...pop.demographics });
    setSexData({ ...pop.sexData });
    setLifeExpectancy({ ...pop.lifeExpectancy });
    if (pop.prevalenceData) setPrevalenceData({ ...pop.prevalenceData });
    if (pop.incidenceData) setIncidenceData({ ...pop.incidenceData });
    if (pop.mortalityData) setMortalityData({ ...pop.mortalityData });
    attrHandlers.reset(pop.customAttributes.map(a => ({ ...a })));
    setEditingIndex(index);
  };

  /**
   * @brief Effect that reacts to external edit requests coming from the Navbar dropdown.
   *
   * When `populationToEdit` is set to a valid index, the corresponding population
   * is loaded into the form. When set to -1, the form is reset to its empty state.
   * After handling, `onPopulationToEditHandled` is called to clear the request.
   */
  useEffect(() => {
    if (populationToEdit !== null) {
      if (populationToEdit === -1) {
        cancelEdit();
      } else {
        loadPopulation(populationToEdit);
      }
      onPopulationToEditHandled();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [populationToEdit]);

  /**
   * @brief Resets all form sections to their empty initial state and clears edit mode.
   */
  const cancelEdit = () => {
    setFormData({ ...EMPTY_FORM });
    setDemographics({ ...EMPTY_DEMOGRAPHICS });
    setSexData({ ...EMPTY_SEX });
    setLifeExpectancy({ ...EMPTY_LIFE_EXPECTANCY });
    setPrevalenceData({});
    setIncidenceData({});
    setMortalityData({});
    attrHandlers.reset([]);
    setEditingIndex(null);
  };

  /**
   * @brief Persists the current form data to the OSDi ontology via the API.
   *
   * The save sequence is:
   * 1. Age — creates a `DeterministicParameter` linked to `Attribute_Age`.
   * 2. Sex — creates a stochastic/deterministic parameter linked to `Attribute_Sex`.
   * 3. Life expectancy — creates a stochastic/deterministic parameter.
   * 4. Epidemiological parameters (prevalence, incidence, mortality) — each
   *    created as an `EpidemiologicalParameter` linked to the effective disease.
   * 5. Custom attributes — for each attribute, creates an `Attribute` individual
   *    and a linked parameter individual.
   * 6. Population individual — the main `Population` individual that aggregates
   *    all previously created individuals via object properties.
   * 7. Local snapshot — stores a deep copy in the `populations` state array.
   *
   * After a successful save the form is reset to its empty state.
   * Does nothing if `formData.label` is empty.
   */
  const handleSave = () => {
    if (!formData.label) return;

    withSave(async () => {
      const populationObjectProps = [];
      const populationDataProps = [];

      // 1. Age
      if (demographics.age) {
        await createIndividual({
          label: `${formData.label}_Age`,
          comment: `Age of the ${formData.label} population`,
          selectedClasses: ['Parameter', 'DeterministicParameter'],
          datatypeProperties: [{ property: 'hasExpectedValue', value: parseFloat(demographics.age) }],
          objectProperties: [{ property: 'isValueOfAttribute', value: 'Attribute_Age' }]
        });
        populationObjectProps.push({ property: 'hasAge', value: `${formData.label}_Age` });
      }

      // 2. Sex (female proportion)
      if (sexData.femaleProportion) {
        const sexLabel = `${formData.label}_FemaleProportion`;
        await createStochasticParameter(
          { ...sexData, value: sexData.femaleProportion },
          sexLabel,
          sexData.comment || `Female proportion for ${formData.label} population`,
          [],
          [],
          [{ property: 'isValueOfAttribute', value: 'Attribute_Sex' }]
        );
        populationObjectProps.push({ property: 'hasSex', value: sexLabel });
      }

      // 3. Life expectancy
      if (lifeExpectancy.value) {
        await createStochasticParameter(
          lifeExpectancy,
          `${formData.label}_LifeExpectancy`,
          `Life expectancy for ${formData.label} population`
        );
        populationObjectProps.push({ property: 'hasLifeExpectancy', value: `${formData.label}_LifeExpectancy` });
      }

      // 4. Epidemiological parameters
      if (effectiveDiseaseLabel) {
        const diseaseObjProp = [{ property: 'isParameterOf', value: effectiveDiseaseLabel }];
        if (prevalenceData.value) {
          await createStochasticParameter(
            prevalenceData,
            `${effectiveDiseaseLabel}_Prevalence`,
            `Prevalence for ${effectiveDiseaseLabel}`,
            ['EpidemiologicalParameter'],
            [{ property: 'hasDataItemType', value: 'DI_Prevalence' }],
            diseaseObjProp
          );
          populationObjectProps.push({ property: 'hasEpidemiologicalParameter', value: `${effectiveDiseaseLabel}_Prevalence` });
        }
        if (incidenceData.value) {
          await createStochasticParameter(
            incidenceData,
            `${effectiveDiseaseLabel}_Incidence`,
            `Incidence for ${effectiveDiseaseLabel}`,
            ['EpidemiologicalParameter'],
            [{ property: 'hasDataItemType', value: 'DI_Incidence' }],
            diseaseObjProp
          );
          populationObjectProps.push({ property: 'hasEpidemiologicalParameter', value: `${effectiveDiseaseLabel}_Incidence` });
        }
        if (mortalityData.value) {
          await createStochasticParameter(
            mortalityData,
            `${effectiveDiseaseLabel}_Mortality`,
            `Mortality for ${effectiveDiseaseLabel}`,
            ['EpidemiologicalParameter'],
            [],
            diseaseObjProp
          );
          populationObjectProps.push({ property: 'hasEpidemiologicalParameter', value: `${effectiveDiseaseLabel}_Mortality` });
        }
      }

      // 5. Custom attributes
      for (const attr of customAttributes) {
        if (!attr.name || !attr.value) continue;
        const sanitizedName = attr.name.replace(/\s+/g, '_');
        const attributeLabel = `Attribute_${sanitizedName}`;
        const paramLabel = `${formData.label}_${sanitizedName}_Parameter`;

        await createIndividual({
          label: attributeLabel,
          comment: attr.description || `Custom attribute: ${attr.name}`,
          selectedClasses: ['Attribute'],
          datatypeProperties: attr.description ? [{ property: 'hasDescription', value: attr.description }] : [],
          objectProperties: []
        });

        await createStochasticParameter(
          attr, paramLabel,
          `${attr.name} parameter for ${formData.label} population`,
          [], [],
          [{ property: 'isValueOfAttribute', value: attributeLabel }]
        );

        populationObjectProps.push({ property: 'usesAttributeValue', value: paramLabel });
      }

      // 6. Population individual
      if (formData.comment) populationDataProps.push({ property: 'hasDescription', value: formData.comment });
      if (demographics.geographicLocation) populationDataProps.push({ property: 'hasGeographicalContext', value: demographics.geographicLocation });
      if (demographics.minAge) populationDataProps.push({ property: 'hasMinAge', value: parseFloat(demographics.minAge) });
      if (demographics.maxAge) populationDataProps.push({ property: 'hasMaxAge', value: parseFloat(demographics.maxAge) });
      if (demographics.populationSize) populationDataProps.push({ property: 'hasSize', value: parseInt(demographics.populationSize) });

      await createIndividual({
        label: formData.label,
        comment: formData.comment,
        selectedClasses: ['Population'],
        datatypeProperties: populationDataProps,
        objectProperties: populationObjectProps
      });

      // 7. Save snapshot to list
      const snapshot = {
        formData: { ...formData },
        demographics: { ...demographics },
        sexData: { ...sexData },
        lifeExpectancy: { ...lifeExpectancy },
        prevalenceData: { ...prevalenceData },
        incidenceData: { ...incidenceData },
        mortalityData: { ...mortalityData },
        customAttributes: customAttributes.map(a => ({ ...a })),
      };

      if (editingIndex !== null) {
        setPopulations(prev => prev.map((item, i) => i === editingIndex ? snapshot : item));
        setEditingIndex(null);
      } else {
        setPopulations(prev => [...prev, snapshot]);
      }

      // Reset form
      setFormData({ ...EMPTY_FORM });
      setDemographics({ ...EMPTY_DEMOGRAPHICS });
      setSexData({ ...EMPTY_SEX });
      setLifeExpectancy({ ...EMPTY_LIFE_EXPECTANCY });
      setPrevalenceData({});
      setIncidenceData({});
      setMortalityData({});
      attrHandlers.reset([]);
    });
  };

  /**
   * @brief Builds the flat row array used by the live preview table.
   *
   * Each row has the shape `{ category, property, value }`. Custom attributes
   * contribute three rows each (value, mode, source).
   *
   * @type {Array<{category: string, property: string, value: string}>}
   */
  const tableData = [
    { category: 'General', property: 'Nombre', value: formData.label || '-' },
    { category: 'General', property: 'Descripción', value: formData.comment || '-' },
    { category: 'General', property: 'Enfermedad', value: effectiveDiseaseLabel || '-' },
    { category: 'Demografía', property: 'Tamaño', value: demographics.populationSize || '-' },
    { category: 'Demografía', property: 'Edad Media', value: demographics.age || '-' },
    { category: 'Demografía', property: 'Edad Mínima', value: demographics.minAge || '0' },
    { category: 'Demografía', property: 'Edad Máxima', value: demographics.maxAge || '-' },
    { category: 'Demografía', property: 'Ubicación', value: demographics.geographicLocation || '-' },
    { category: 'Demografía', property: 'Proporción Femenina', value: sexData.femaleProportion || '-' },
    { category: 'Demografía', property: 'Modo Sexo', value: sexData.isStochastic ? 'Estocástico' : 'Determinístico' },
    { category: 'Demografía', property: 'Fuente Sexo', value: sexData.source || '-' },
    { category: 'Expectativa', property: 'Esperanza de Vida', value: lifeExpectancy.value || '-' },
    { category: 'Expectativa', property: 'Modo', value: lifeExpectancy.isStochastic ? 'Estocástico' : 'Determinístico' },
    { category: 'Expectativa', property: 'Fuente', value: lifeExpectancy.source || '-' },
    { category: 'Epidemiología', property: 'Prevalencia', value: prevalenceData.value || '-' },
    { category: 'Epidemiología', property: 'Modo Prevalencia', value: prevalenceData.isStochastic ? 'Estocástico' : 'Determinístico' },
    { category: 'Epidemiología', property: 'Fuente Prevalencia', value: prevalenceData.source || '-' },
    { category: 'Epidemiología', property: 'Incidencia', value: incidenceData.value || '-' },
    { category: 'Epidemiología', property: 'Modo Incidencia', value: incidenceData.isStochastic ? 'Estocástico' : 'Determinístico' },
    { category: 'Epidemiología', property: 'Fuente Incidencia', value: incidenceData.source || '-' },
    { category: 'Epidemiología', property: 'Mortalidad', value: mortalityData.value || '-' },
    { category: 'Epidemiología', property: 'Modo Mortalidad', value: mortalityData.isStochastic ? 'Estocástico' : 'Determinístico' },
    { category: 'Epidemiología', property: 'Fuente Mortalidad', value: mortalityData.source || '-' },
    ...customAttributes.filter(a => a.name).flatMap(a => ([
      { category: 'Personalizado', property: a.name, value: a.value || '-' },
      { category: 'Personalizado', property: `Modo ${a.name}`, value: a.isStochastic ? 'Estocástico' : 'Determinístico' },
      { category: 'Personalizado', property: `Fuente ${a.name}`, value: a.source || '-' },
    ]))
  ];

  /**
   * @brief Returns a Tailwind CSS class string for the category badge in the preview table.
   * @param {string} cat - Category name ('General', 'Demografía', 'Expectativa', 'Epidemiología', or custom).
   * @returns {string} Tailwind background and text color classes.
   */
  const categoryColor = (cat) => {
    switch (cat) {
      case 'General': return 'bg-slate-200 text-slate-600';
      case 'Demografía': return 'bg-emerald-100 text-emerald-700';
      case 'Expectativa': return 'bg-blue-100 text-blue-700';
      case 'Epidemiología': return 'bg-rose-100 text-rose-700';
      default: return 'bg-purple-100 text-purple-600';
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-5.1rem)] bg-slate-200 overflow-hidden font-sans">

      {/* Floating messages */}
      {(error || success) && (
        <div className="fixed top-24 right-8 z-50 animate-in fade-in slide-in-from-top-4">
          <div className={`flex items-center space-x-3 p-4 rounded-2xl shadow-xl border-l-4 ${error ? 'bg-white border-rose-500 text-rose-800' : 'bg-white border-blue-500 text-blue-800'
            }`}>
            {error ? <AlertCircle className="w-5 h-5 text-rose-500" /> : <CheckCircle className="w-5 h-5 text-blue-500" />}
            <p className="text-sm font-bold">{error || (editingIndex !== null ? '¡Población actualizada!' : '¡Población y parámetros creados!')}</p>
          </div>
        </div>
      )}

      <div className="flex h-full w-full p-8 gap-8 overflow-hidden">

        {/* Left Panel: Population Form */}
        <div className="w-1/2 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl space-y-6 pb-12">

            {/* Header */}
            <div className="bg-linear-to-br from-blue-700 via-blue-800 to-blue-900 rounded-3xl p-8 text-white">
              <div className="flex items-center space-x-3 mb-2">
                <Users className="w-7 h-7" strokeWidth={2.5} />
                <h1 className="text-3xl font-bold">Población afectada</h1>
              </div>
              <p className="text-blue-50/80 text-sm font-medium">Define la población y sus parámetros</p>
            </div>

            {/* Edit mode banner */}
            {editingIndex !== null && (
              <div className="flex items-center justify-between px-5 py-3 bg-amber-50 border-2 border-amber-300 rounded-2xl">
                <div className="flex items-center gap-2 text-amber-800">
                  <Pencil className="w-4 h-4" />
                  <span className="text-sm font-bold">Editando: <span className="text-amber-900">{populations[editingIndex]?.formData.label}</span></span>
                </div>
              </div>
            )}

            {/* General */}
            <div className="bg-white/60 rounded-3xl border border-slate-300 p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg"><Book className="w-4 h-4 text-blue-600" /></div>
                <h2 className="text-lg font-bold text-slate-800">General</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre <strong>*</strong></label>
                  <input type="text" name="label" value={formData.label} onChange={handleInputChange}
                    placeholder="ej: Población con riesgo de enfermedad X"
                    className="w-full px-5 py-4 bg-white/80 border border-slate-300 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Descripción <strong>*</strong></label>
                  <textarea name="comment" value={formData.comment} onChange={handleInputChange}
                    placeholder="ej: Población en España con riesgo de contraer la enfermedad X debido a factores Y y Z."
                    rows="2"
                    className="w-full px-5 py-4 bg-white/80 border border-slate-300 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm resize-none" />
                </div>
                {diseases.length > 1 && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Enfermedad asociada</label>
                    <select name="associatedDisease" value={formData.associatedDisease} onChange={handleInputChange}
                      className="w-full px-5 py-4 bg-white/80 border border-slate-300 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm text-sm">
                      <option value="">Selecciona una enfermedad</option>
                      {diseases.map((d, i) => (
                        <option key={i} value={d.diseaseData.label}>{d.diseaseData.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Demography */}
            <div className="bg-white/60 rounded-3xl border border-slate-300 p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg"><Users className="w-4 h-4 text-blue-600" /></div>
                <h2 className="text-lg font-bold text-slate-800">Demografía</h2>
              </div>
              <div className="space-y-6">

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tamaño Poblacional</label>
                    <input type="number" name="populationSize" value={demographics.populationSize} onChange={handleDemographicsChange}
                      placeholder="540963"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Ubicación</label>
                    <input type="text" name="geographicLocation" value={demographics.geographicLocation} onChange={handleDemographicsChange}
                      placeholder="Spain @https://www.wikidata.org/wiki/q29"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Edad Media (años)</label>
                  <input type="number" step="0.1" name="age" value={demographics.age} onChange={handleDemographicsChange}
                    placeholder="45"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none" />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Rango de Edad</label>
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between px-1 text-[10px] font-bold text-slate-400">
                      <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                    </div>
                    <div className="dual-range-wrapper">
                      <div className="dual-range-track">
                        <div className="dual-range-fill" style={{
                          left: `${parseInt(demographics.minAge) || 0}%`,
                          right: `${100 - (parseInt(demographics.maxAge) || 100)}%`
                        }} />
                      </div>
                      <input type="range" min="0" max="100" step="1"
                        value={demographics.minAge !== '' ? parseInt(demographics.minAge) : 0}
                        onChange={(e) => {
                          const val = Math.min(parseInt(e.target.value), (parseInt(demographics.maxAge) || 100) - 1);
                          setDemographics({ ...demographics, minAge: String(val) });
                        }}
                        style={{ zIndex: (parseInt(demographics.minAge) || 0) > 95 ? 5 : 3 }}
                      />
                      <input type="range" min="0" max="100" step="1"
                        value={demographics.maxAge !== '' ? parseInt(demographics.maxAge) : 100}
                        onChange={(e) => {
                          const val = Math.max(parseInt(e.target.value), (parseInt(demographics.minAge) || 0) + 1);
                          setDemographics({ ...demographics, maxAge: String(val) });
                        }}
                        style={{ zIndex: 4 }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-xl font-bold text-blue-700">{demographics.minAge !== '' ? demographics.minAge : '0'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Mín</p>
                      </div>
                      <div className="flex-1 mx-4 border-t border-dashed border-slate-200" />
                      <div className="text-center">
                        <p className="text-xl font-bold text-blue-700">{demographics.maxAge !== '' ? demographics.maxAge : '100'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Máx</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Edad Mínima</label>
                      <input type="number" min="0" max="99" step="0.1" value={demographics.minAge}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '') { setDemographics({ ...demographics, minAge: '' }); return; }
                          setDemographics({ ...demographics, minAge: raw });
                        }}
                        placeholder="0"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Edad Máxima</label>
                      <input type="number" min="1" max="100" step="0.1" value={demographics.maxAge}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '') { setDemographics({ ...demographics, maxAge: '' }); return; }
                          setDemographics({ ...demographics, maxAge: raw });
                        }}
                        placeholder="100"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sex */}
            <div className="bg-white/60 rounded-3xl border border-slate-300 p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg"><Users className="w-4 h-4 text-blue-600" /></div>
                <h2 className="text-lg font-bold text-slate-800">Sexo (Proporción Femenina)</h2>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Modo de Configuración</label>
                  <ToggleButton value={sexData.isStochastic}
                    onChange={(e) => setSexData({ ...sexData, isStochastic: e.target.value })}
                    option1="Simple (Determinístico)" option2="Avanzado (Segundo Orden)"
                    name="isStochastic" color="blue" />
                </div>
                {!sexData.isStochastic && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Proporción Femenina (0-1)</label>
                    <input type="number" step="0.01" min="0" max="1" name="femaleProportion"
                      value={sexData.femaleProportion}
                      onChange={(e) => setSexData({ ...sexData, femaleProportion: e.target.value })}
                      placeholder="0.5"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" />
                  </div>
                )}
                {sexData.isStochastic && (
                  <StochasticConfig
                    data={sexData}
                    onChange={(e) => {
                      const field = e.target.name === 'value' ? 'femaleProportion' : e.target.name;
                      setSexData(prev => ({ ...prev, [field]: e.target.value }));
                    }}
                    color="blue" />
                )}
                {sexData.isStochastic && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valor Esperado (0-1)</label>
                    <input type="number" step="0.01" min="0" max="1" name="femaleProportion"
                      value={sexData.femaleProportion}
                      onChange={(e) => setSexData({ ...sexData, femaleProportion: e.target.value })}
                      placeholder="0.5"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fuente</label>
                  <input type="text" name="source" value={sexData.source}
                    onChange={(e) => setSexData({ ...sexData, source: e.target.value })}
                    placeholder="INE 2023"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Comentario</label>
                  <textarea name="comment" value={sexData.comment}
                    onChange={(e) => setSexData({ ...sexData, comment: e.target.value })}
                    rows="2" placeholder="Notas adicionales..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none resize-none" />
                </div>
              </div>
            </div>

            {/* Life Expectancy */}
            <div className="bg-white/60 rounded-3xl border border-slate-300 p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg"><ShieldCheck className="w-4 h-4 text-blue-600" /></div>
                <h2 className="text-lg font-bold text-slate-800">Esperanza de Vida</h2>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Modo de Configuración</label>
                  <ToggleButton value={lifeExpectancy.isStochastic}
                    onChange={(e) => setLifeExpectancy({ ...lifeExpectancy, isStochastic: e.target.value })}
                    option1="Simple (Determinístico)" option2="Avanzado (Estocástico)"
                    name="isStochastic" color="blue" />
                </div>
                {!lifeExpectancy.isStochastic && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Esperanza de Vida (años)</label>
                    <input type="number" step="0.1" name="value" value={lifeExpectancy.value}
                      onChange={handleLifeExpectancyChange}
                      placeholder="80.5"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" />
                  </div>
                )}
                {lifeExpectancy.isStochastic && (
                  <StochasticConfig
                    data={lifeExpectancy}
                    onChange={handleLifeExpectancyChange}
                    color="blue" />
                )}
                {lifeExpectancy.isStochastic && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valor Esperado (años)</label>
                    <input type="number" step="0.1" name="value" value={lifeExpectancy.value}
                      onChange={handleLifeExpectancyChange}
                      placeholder="80.5"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fuente</label>
                  <input type="text" name="source" value={lifeExpectancy.source}
                    onChange={handleLifeExpectancyChange}
                    placeholder="INE 2023"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" />
                </div>
              </div>
            </div>

            {/* Epidemiological Parameters */}
            <EpidemiologicalParameterCard title="Prevalencia" data={prevalenceData} onChange={handlePrevalenceChange} valuePlaceholder="0.0000147885" valueStep="0.0000001" />
            <EpidemiologicalParameterCard title="Incidencia" data={incidenceData} onChange={handleIncidenceChange} valuePlaceholder="0.0116" valueStep="0.0001" />
            <EpidemiologicalParameterCard title="Mortalidad" data={mortalityData} onChange={handleMortalityChange} valuePlaceholder="0.052" valueStep="0.001" />

            {/* Custom Attributes */}
            <div className="bg-white/60 rounded-3xl border border-slate-300 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg"><Plus className="w-4 h-4 text-blue-600" /></div>
                  <h2 className="text-lg font-bold text-slate-800">Atributos Personalizados</h2>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-full border border-blue-200">
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  <span className="text-xs font-bold text-blue-700">
                    {customAttributes.length} atributo{customAttributes.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                {customAttributes.map((attr) => (
                  <div key={attr.id} className="bg-slate-50 rounded-2xl border border-blue-100 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Atributo</span>
                      <button type="button" onClick={() => attrHandlers.remove(attr.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre *</label>
                        <input type="text" value={attr.name}
                          onChange={(e) => attrHandlers.update(attr.id, 'name', e.target.value)}
                          placeholder="ej: comorbilidad"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Descripción</label>
                        <input type="text" value={attr.description}
                          onChange={(e) => attrHandlers.update(attr.id, 'description', e.target.value)}
                          placeholder="ej: Proporción con comorbilidad"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Modo</label>
                      <ToggleButton value={attr.isStochastic}
                        onChange={(e) => attrHandlers.update(attr.id, 'isStochastic', e.target.value)}
                        option1="Simple (Determinístico)" option2="Avanzado (Estocástico)"
                        name="isStochastic" color="blue" />
                    </div>
                    {!attr.isStochastic && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valor *</label>
                        <input type="number" step="any" value={attr.value}
                          onChange={(e) => attrHandlers.update(attr.id, 'value', e.target.value)}
                          placeholder="0.0"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none" />
                      </div>
                    )}
                    {attr.isStochastic && (
                      <StochasticConfig
                        data={attr}
                        onChange={(e) => attrHandlers.update(attr.id, e.target.name, e.target.value)}
                        color="blue" />
                    )}
                    {attr.isStochastic && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valor Esperado *</label>
                        <input type="number" step="any" value={attr.value}
                          onChange={(e) => attrHandlers.update(attr.id, 'value', e.target.value)}
                          placeholder="0.0"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none" />
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fuente</label>
                      <input type="text" value={attr.source}
                        onChange={(e) => attrHandlers.update(attr.id, 'source', e.target.value)}
                        placeholder="ej: PubMed 2023"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none" />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={attrHandlers.add}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-linear-to-r from-blue-50 to-white hover:from-blue-100 hover:to-blue-50 border-2 border-dashed border-blue-300 hover:border-blue-400 rounded-2xl transition-all group">
                  <div className="p-2 bg-blue-100 group-hover:bg-blue-200 rounded-lg transition-colors">
                    <Plus className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-bold text-blue-700">Añadir nuevo atributo</span>
                </button>
              </div>
            </div>

            {/* Info note */}
            <div className="flex items-start space-x-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800 leading-relaxed">
                Los parámetros con <strong>*</strong> son obligatorios para crear la población afectada en el modelo. Asegúrate de completarlos antes de guardar.
              </div>
            </div>

            <button onClick={handleSave} disabled={saving || !formData.label}
              className="w-full bg-linear-to-r from-blue-700 via-blue-800 to-blue-900 text-white py-5 rounded-2xl font-bold hover:shadow-xl hover:shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-3 shadow-lg">
              <Save className="w-5 h-5" />
              <span className="text-lg">{saving ? 'Guardando...' : editingIndex !== null ? 'Actualizar Población' : 'Guardar Población'}</span>
            </button>
          </div>
        </div>

        {/* Right Panel: Table */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] flex flex-col h-full border-2 border-blue-500 overflow-hidden">

            {/* Header */}
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

            {/* Content */}
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
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${categoryColor(row.category)}`}>
                        {row.category}
                      </span>
                    </div>
                    <div className="col-span-4 text-sm font-bold text-slate-400 tracking-tight">{row.property}</div>
                    <div className={`col-span-5 text-sm font-semibold truncate pr-4 ${row.value === '-' ? 'text-slate-300 italic font-normal' : 'text-slate-800'}`}>
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer note */}
            <div className="px-8 py-4 bg-linear-to-r from-white to-blue-100 shrink-0">
              <p className="text-[10px] text-blue-600 font-medium text-center tracking-widest italic">
                Esta tabla muestra una vista previa de los campos acerca de la población afectada.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(226, 232, 240, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(29, 78, 216, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(29, 78, 216, 0.5); }

        /* ── Dual Range Slider ── */
        .dual-range-wrapper { position: relative; height: 44px; display: flex; align-items: center; }
        .dual-range-track { position: absolute; left: 0; right: 0; height: 6px; background: #e2e8f0; border-radius: 999px; pointer-events: none; }
        .dual-range-fill { position: absolute; height: 100%; background: rgb(59, 130, 246); border-radius: 999px; }
        .dual-range-wrapper input[type="range"] { position: absolute; width: 100%; height: 6px; background: transparent; -webkit-appearance: none; appearance: none; pointer-events: none; margin: 0; padding: 0; }
        .dual-range-wrapper input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; pointer-events: all; width: 22px; height: 22px; border-radius: 50%; background: white; border: 2.5px solid rgb(59, 130, 246); cursor: grab; box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3), 0 1px 3px rgba(0,0,0,0.1); transition: transform 0.15s, box-shadow 0.15s; }
        .dual-range-wrapper input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.2); box-shadow: 0 3px 10px rgba(59, 130, 246, 0.45); }
        .dual-range-wrapper input[type="range"]::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.25); }
        .dual-range-wrapper input[type="range"]::-moz-range-thumb { pointer-events: all; width: 20px; height: 20px; border-radius: 50%; background: white; border: 2.5px solid rgb(59, 130, 246); cursor: grab; box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3); }
      `}</style>
    </div>
  );
}

export default PopulationPage;
