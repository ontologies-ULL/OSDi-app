/**
 * @file InterventionsPage.jsx
 * @brief Page for defining interventions and their HEOR parameters in the OSDi model.
 *
 * Allows the user to create and edit individuals of type `TherapeuticIntervention`,
 * `ScreeningIntervention`, or `DiagnosisIntervention` in the OSDi ontology,
 * together with all their associated sub-parameters: costs, utilities, effects, and,
 * for screening / diagnosis only, sensitivity and specificity values.
 *
 * @module pages/InterventionsPage
 */

import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Pill, Book, ShieldCheck, Target, Table as TableIcon, DollarSign, Zap, Sparkles, Pencil } from 'lucide-react';
import ToggleButton from '../components/ToggleButton';
import CostCard from '../components/CostCard';
import UtilityCard from '../components/UtilityCard';
import DetectionParameterCard from '../components/DetectionParameterCard';
import SectionCard from '../components/SectionCard';
import EffectCard from '../components/EffectCard';
import useExpandableList from '../hooks/useExpandableList';
import useSaveStatus from '../hooks/useSaveStatus';
import { createIndividual, buildDistribution } from '../api/ontology';

/**
 * @brief Initial empty state for a cost entry.
 * @property {string}  name               - Display name of the cost item.
 * @property {string}  value              - Numeric cost amount.
 * @property {string}  currency           - OSDi currency individual (default: 'Currency_Euro').
 * @property {boolean} appliesOneTime     - true for a one-time payment, false for annual.
 * @property {string}  source             - Bibliographic source.
 * @property {string}  year               - Reference year for the cost value.
 * @property {string}  parameterType      - 'Deterministic' or 'Stochastic'.
 * @property {string}  distributionType   - Probability distribution family (default: 'Normal').
 * @property {string}  lowerBound         - Lower bound of the distribution.
 * @property {string}  upperBound         - Upper bound of the distribution.
 * @property {string}  standardDeviation  - Standard deviation of the distribution.
 * @property {string}  alpha              - Alpha shape parameter.
 * @property {string}  beta               - Beta shape parameter.
 * @property {string}  lambda             - Rate parameter.
 * @property {string}  mean               - Distribution mean.
 * @property {string}  confidenceInterval - Confidence interval width (default: '95').
 * @property {string}  sampleSize         - Sample size used to estimate the parameter.
 */
const EMPTY_COST = {
  name: '', value: '', currency: 'Currency_Euro', appliesOneTime: false,
  source: '', year: new Date().getFullYear().toString(),
  parameterType: 'Deterministic', distributionType: 'Normal',
  lowerBound: '', upperBound: '', standardDeviation: '',
  alpha: '', beta: '', lambda: '', mean: '',
  confidenceInterval: '95', sampleSize: ''
};

/**
 * @brief Initial empty state for a utility/disutility entry.
 * @property {string}  name               - Display name of the utility item.
 * @property {string}  value              - Numeric utility value.
 * @property {boolean} isDisutility       - true if this value represents a disutility.
 * @property {boolean} appliesOneTime     - true for a one-time application.
 * @property {string}  calculationMethod  - Method used to calculate the utility.
 * @property {string}  source             - Bibliographic source.
 * @property {string}  parameterType      - 'Deterministic' or 'Stochastic'.
 * @property {string}  distributionType   - Probability distribution family (default: 'Beta').
 * @property {string}  lowerBound         - Lower bound of the distribution.
 * @property {string}  upperBound         - Upper bound of the distribution.
 * @property {string}  standardDeviation  - Standard deviation of the distribution.
 * @property {string}  alpha              - Alpha shape parameter.
 * @property {string}  beta               - Beta shape parameter.
 * @property {string}  lambda             - Rate parameter.
 * @property {string}  mean               - Distribution mean.
 * @property {string}  confidenceInterval - Confidence interval width (default: '95').
 * @property {string}  sampleSize         - Sample size used to estimate the parameter.
 */
const EMPTY_UTILITY = {
  name: '', value: '', isDisutility: false, appliesOneTime: false,
  calculationMethod: '', source: '',
  parameterType: 'Deterministic', distributionType: 'Beta',
  lowerBound: '', upperBound: '', standardDeviation: '',
  alpha: '', beta: '', lambda: '', mean: '',
  confidenceInterval: '95', sampleSize: ''
};

/**
 * @brief Initial empty state for a sensitivity or specificity detection parameter.
 * @property {string} name                - Display name of the parameter.
 * @property {string} value               - Numeric value [0-1].
 * @property {string} source              - Bibliographic source.
 * @property {string} parameterType       - 'Deterministic' or 'Stochastic'.
 * @property {string} distributionType    - Probability distribution family (default: 'Beta').
 * @property {string} lowerBound          - Lower bound of the distribution.
 * @property {string} upperBound          - Upper bound of the distribution.
 * @property {string} standardDeviation   - Standard deviation of the distribution.
 * @property {string} alpha              - Alpha shape parameter.
 * @property {string} beta               - Beta shape parameter.
 * @property {string} lambda             - Rate parameter.
 * @property {string} mean               - Distribution mean.
 * @property {string} confidenceInterval - Confidence interval width (default: '95').
 * @property {string} sampleSize         - Sample size used to estimate the parameter.
 */
const EMPTY_DETECTION_PARAM = {
  name: '', value: '', source: '',
  parameterType: 'Deterministic', distributionType: 'Beta',
  lowerBound: '', upperBound: '', standardDeviation: '',
  alpha: '', beta: '', lambda: '', mean: '',
  confidenceInterval: '95', sampleSize: ''
};

/**
 * @brief Initial empty state for an intervention effect (ModifierParameter).
 * @property {string}   name                - Display name of the effect.
 * @property {string}   description         - Free-text description of the effect.
 * @property {string}   effectType          - OSDi data item type (default: 'DI_Continuous_Variable').
 * @property {string}   value               - Numeric value of the effect.
 * @property {string[]} modifiesTargets     - Array of progression element labels this effect modifies.
 * @property {string}   _modifiesInput      - Transient input buffer for manual target entry (not persisted to ontology).
 * @property {string}   parameterType       - 'Deterministic' or 'Stochastic'.
 * @property {string}   distributionType    - Probability distribution family (default: 'Normal').
 * @property {string}   lowerBound          - Lower bound of the distribution.
 * @property {string}   upperBound          - Upper bound of the distribution.
 * @property {string}   standardDeviation   - Standard deviation of the distribution.
 * @property {string}   alpha              - Alpha shape parameter.
 * @property {string}   beta               - Beta shape parameter.
 * @property {string}   mean               - Distribution mean.
 * @property {string}   confidenceInterval - Confidence interval width (default: '95').
 * @property {string}   sampleSize         - Sample size used to estimate the parameter.
 */
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

/**
 * @brief Initial empty state for the general intervention form.
 * @property {string}  label              - Local IRI name of the ontology individual.
 * @property {string}  comment            - Free-text description.
 * @property {string}  interventionType   - OSDi class: 'TherapeuticIntervention', 'ScreeningIntervention', or 'DiagnosisIntervention'.
 * @property {boolean} isAssessed         - Whether this intervention is assessed in the model.
 * @property {string}  associatedDisease  - Label of the associated disease (only when there is more than one disease).
 */
const EMPTY_FORM = {
  label: '', comment: '',
  interventionType: 'TherapeuticIntervention',
  isAssessed: true,
  associatedDisease: ''
};

/**
 * @brief React page component for creating and editing Intervention individuals.
 *
 * Renders a two-column layout:
 * - **Left panel**: form with sections for general info, costs, utilities,
 *   sensitivity/specificity (screening/diagnosis only), and effects.
 * - **Right panel**: live preview table that reflects the current form values.
 *
 * On save the component sequentially calls the ontology API to persist each
 * sub-parameter, then creates the main intervention individual linking all of
 * them via object properties.
 *
 * @param {Function}   props.onNavigate                  - Callback to navigate to another page.
 * @param {string}     props.currentPage                 - Identifier of the active page.
 * @param {Object}     props.diseaseData                 - Global disease data (fallback when no disease list).
 * @param {Array}      props.diseases                    - Array of all saved disease snapshots.
 * @param {Object}     props.populationData              - Current population data (passed for context).
 * @param {Array}      props.progressionElements         - Array of `{label, type}` objects from the progression page, used to populate the effect target picker.
 * @param {Array}      props.interventions               - Array of all saved intervention snapshots.
 * @param {Function}   props.setInterventions            - State setter for the interventions array.
 * @param {number|null} props.interventionToEdit         - Index of the intervention to load for editing,
 *                                                        or -1 to reset the form, or null for no-op.
 * @param {Function}   props.onInterventionToEditHandled - Callback to acknowledge the edit request.
 *
 * @returns {JSX.Element} The rendered interventions page.
 */
function InterventionsPage({ onNavigate, currentPage, diseaseData, diseases = [], progressionElements = [], interventions, setInterventions, interventionToEdit, onInterventionToEditHandled }) {
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [costsData, expandedCosts, costHandlers] = useExpandableList([], EMPTY_COST);
  const [utilitiesData, expandedUtilities, utilityHandlers] = useExpandableList([], EMPTY_UTILITY);
  const [sensitivitiesData, expandedSensitivities, sensitivityHandlers] = useExpandableList([], EMPTY_DETECTION_PARAM);
  const [specificitiesData, expandedSpecificities, specificityHandlers] = useExpandableList([], EMPTY_DETECTION_PARAM);
  const [effectsData, expandedEffects, effectHandlers] = useExpandableList([], EMPTY_EFFECT);
  const [editingIndex, setEditingIndex] = useState(null);
  const { saving, success, error, withSave } = useSaveStatus();

  /** @brief Generic change handler for the general form fields, supporting both input and checkbox elements. */
  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  /**
   * @brief Resolves which disease label to associate with this intervention.
   *
   * - Single disease: uses the only available disease label automatically.
   * - Multiple diseases: uses the value selected in the form dropdown.
   * - No disease list: falls back to the global `diseaseData.label` prop.
   */
  const effectiveDiseaseLabel =
    diseases.length === 1 ? diseases[0].diseaseData.label :
    diseases.length > 1  ? formData.associatedDisease :
    diseaseData.label;

  /**
   * @brief Loads a previously saved intervention snapshot into the form for editing.
   * @param {number} index - Index of the intervention in the `interventions` array.
   */
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

  /**
   * @brief Effect that reacts to external edit requests coming from the Navbar dropdown.
   *
   * When `interventionToEdit` is set to a valid index the corresponding intervention
   * is loaded into the form. When set to -1 the form is reset. After handling,
   * `onInterventionToEditHandled` is called to clear the request.
   */
  useEffect(() => {
    if (interventionToEdit !== null) {
      if (interventionToEdit === -1) {
        cancelEdit();
      } else {
        loadIntervention(interventionToEdit);
      }
      onInterventionToEditHandled();
    }
  }, [interventionToEdit]);

  /**
   * @brief Resets all form sections to their empty initial state and clears edit mode.
   */
  const cancelEdit = () => {
    setFormData({ ...EMPTY_FORM });
    costHandlers.reset();
    utilityHandlers.reset();
    sensitivityHandlers.reset();
    specificityHandlers.reset();
    effectHandlers.reset();
    setEditingIndex(null);
  };

  /**
   * @brief Creates a single deterministic or stochastic parameter individual via the ontology API.
   *
   * When `paramData.parameterType` is `'Deterministic'`, a `DeterministicParameter` individual
   * is created directly. When stochastic, a distribution individual is first built via
   * `buildDistribution`, then a `SecondOrderUncertaintyParameter` individual is created
   * referencing it through `hasUncertaintyCharacterization`.
   *
   * @param {string}   baseLabel                  - IRI label for the new parameter individual.
   * @param {string}   comment                    - Description used as the ontology comment.
   * @param {string[]} classes                    - Additional OSDi classes to assign (e.g. ['Cost']).
   * @param {string}   dataItemType               - Value for the `hasDataItemType` object property.
   * @param {Object}   paramData                  - Form data object containing value, distribution fields, etc.
   * @param {Array}    [additionalDataProps=[]]   - Extra datatype properties to include.
   * @param {Array}    [additionalObjectProps=[]] - Extra object properties to include.
   * @returns {Promise<void>}
   */
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

  /**
   * @brief Persists the current form data to the OSDi ontology via the API.
   *
   * The save sequence is:
   * 1. Costs — each cost entry creates a `Cost` + `DeterministicParameter` or
   *    `SecondOrderUncertaintyParameter` individual.
   * 2. Utilities — each entry creates a `Utility` parameter individual.
   * 3. Effects — each entry creates a `ModifierParameter` individual with
   *    `modifies` links to the selected progression elements.
   * 4. Sensitivities — each entry creates a `Parameter` with `DI_Sensitivity` type.
   * 5. Specificities — each entry creates a `Parameter` with `DI_Specificity` type.
   * 6. Intervention individual — the main intervention individual that aggregates
   *    all previously created individuals via object properties.
   * 7. Local snapshot — stores a deep copy in the `interventions` state array.
   *
   * Entries with an empty `value` field are silently skipped.
   * Does nothing if `formData.label` is empty.
   */
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

      // 3. Effects
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
        objectProperties: [
          ...interventionObjectProps,
          ...(effectiveDiseaseLabel ? [{ property: 'isInterventionOf', value: effectiveDiseaseLabel }] : [])
        ]
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

  /**
   * @brief Maps an OSDi intervention type identifier to a human-readable label.
   * @param {string} type - OSDi class name ('TherapeuticIntervention', 'ScreeningIntervention', 'DiagnosisIntervention').
   * @returns {string} Localised display label.
   */
  const typeLabel = (type) => {
    switch (type) {
      case 'TherapeuticIntervention': return 'Terapéutica';
      case 'ScreeningIntervention': return 'Cribado';
      case 'DiagnosisIntervention': return 'Diagnóstico';
      default: return type;
    }
  };

  /**
   * @brief Maximum number of characters before truncation in the preview table cells.
   * @type {number}
   */
  const MAX_CHARS = 21;

  /**
   * @brief Truncates a string to `max` characters, appending an ellipsis if needed.
   * @param {string} text - Input string.
   * @param {number} [max=MAX_CHARS] - Maximum allowed length.
   * @returns {string} Truncated string.
   */
  const truncate = (text, max = MAX_CHARS) => text.length > max ? `${text.slice(0, max)}…` : text;

  /**
   * @brief Builds the flat row array used by the live preview table.
   *
   * Starts with the four general rows then appends rows for each cost, utility, 
   * sensitivity, specificity, and effect entry.
   *
   * @type {Array<{category: string, property: string, value: string}>}
   */
  const tableData = [
    { category: 'General', property: 'Nombre', value: formData.label || '-' },
    { category: 'General', property: 'Tipo', value: typeLabel(formData.interventionType) },
    { category: 'General', property: 'Estado', value: formData.isAssessed ? 'Evaluada' : 'No evaluada' },
    { category: 'General', property: 'Enfermedad', value: effectiveDiseaseLabel || '-' },
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

  /**
   * @brief Returns a Tailwind CSS class string for the category badge in the preview table.
   * @param {string} cat - Category name ('General', 'Costes', 'Utilidades', 'Sensibilidad', 'Efectos', or custom).
   * @returns {string} Tailwind background and text color classes.
   */
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

        {/* Left Panel: Intervention Form */}
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
                {diseases.length > 1 && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Enfermedad asociada</label>
                    <select name="associatedDisease" value={formData.associatedDisease} onChange={handleInputChange}
                      className="w-full px-5 py-4 bg-white/80 border border-slate-300 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all shadow-sm text-sm">
                      <option value="">Selecciona una enfermedad</option>
                      {diseases.map((d, i) => (
                        <option key={i} value={d.diseaseData.label}>{d.diseaseData.label}</option>
                      ))}
                    </select>
                  </div>
                )}

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

            {/* Sensitivities and Specificities, only for screening/diagnosis interventions */}
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
                  isExpanded={expandedEffects.includes(i)} onToggleExpand={() => effectHandlers.toggle(i)}
                  progressionElements={progressionElements} />
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

        {/* Right Panel: Preview Table */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] flex flex-col h-full border-2 border-rose-500 overflow-hidden">

            {/* Header */}
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

            {/* Content */}
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

            {/* Footer note */}
            <div className="px-8 py-4 bg-linear-to-r from-white to-rose-50 shrink-0">
              <p className="text-[10px] text-rose-600 font-medium text-center tracking-widest italic">
                Esta tabla muestra una vista previa de los campos de la intervención y sus efectos asociados.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(226, 232, 240, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(225, 29, 72, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(190, 18, 60, 0.5); }
      `}</style>
    </div>
  );
}

export default InterventionsPage;
