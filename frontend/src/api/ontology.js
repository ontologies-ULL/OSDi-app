/**
 * @file ontology.js
 * @brief API client functions for interacting with the OSDi FastAPI ontology backend.
 *
 * Provides three functions that cover the two most common write operations
 * against the ontology REST API:
 * - `createIndividual`         — generic OWL individual creation.
 * - `buildDistribution`        — creates a distribution expression individual and returns its label.
 * - `createStochasticParameter` — creates a full parameter individual (stochastic or deterministic),
 *   calling `buildDistribution` internally when needed.
 *
 * @module api/ontology
 */

/** 
 * @brief Base URL of the OSDi FastAPI backend. 
 */
const API_BASE_URL = 'http://localhost:8000';

/**
 * @brief Creates a new OWL individual via `POST /ontology/individual`.
 *
 * @param {Object}   individualData                          - Payload describing the individual.
 * @param {string}   individualData.label                    - IRI label for the new individual.
 * @param {string}   [individualData.comment]                - Optional free-text description (`hasDescription`).
 * @param {string[]} [individualData.selectedClasses=[]]     - OWL class names the individual belongs to.
 * @param {Array<{property: string, value: *}>}  [individualData.datatypeProperties=[]]
 *   Datatype property assertions (e.g. `hasExpectedValue`, `hasSource`).
 * @param {Array<{property: string, value: string}>} [individualData.objectProperties=[]]
 *   Object property assertions referencing other individual labels.
 *
 * @returns {Promise<Object>} Parsed JSON response from the backend on success.
 * @throws {Error} When the response status is not OK; the error message is taken from
 *   `response.detail` or falls back to `'Error creating individual'`.
 */
export const createIndividual = async (individualData) => {
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

/**
 * @brief Creates a distribution expression individual in the ontology.
 *
 * Inspects `paramData` to determine the distribution family and maps the
 * relevant parameters to the corresponding OSDi datatype properties.
 *
 * The individual is labelled `<baseLabel>_Distribution`.
 *
 * @param {string} baseLabel  - Label of the parent parameter individual; used to derive the
 *   distribution label and the auto-generated comment.
 * @param {Object} paramData  - Parameter form state (from `useEpiParameter` or equivalent).
 * @param {string} paramData.distributionType - One of `'Normal'`, `'Uniform'`, `'Beta'`, `'Gamma'`.
 * @param {string} [paramData.mean]               - Mean (Normal distribution).
 * @param {string} [paramData.standardDeviation]  - Standard deviation (Normal distribution).
 * @param {string} [paramData.lowerBound]         - Lower bound (Uniform distribution).
 * @param {string} [paramData.upperBound]         - Upper bound (Uniform distribution).
 * @param {string} [paramData.alpha]              - Alpha shape parameter (Beta / Gamma distributions).
 * @param {string} [paramData.beta]               - Beta shape parameter (Beta distribution).
 * @param {string} [paramData.lambda]             - Rate parameter (Gamma distribution).
 *
 * @returns {Promise<string|null>} The distribution individual label on success,
 *   or `null` when `paramData` contains no distribution parameters.
 */
export const buildDistribution = async (baseLabel, paramData) => {
  const hasData = paramData.distributionType && (
    paramData.mean || paramData.standardDeviation ||
    paramData.lowerBound || paramData.upperBound ||
    paramData.alpha || paramData.beta || paramData.lambda
  );
  if (!hasData) return null;

  const distributionLabel = `${baseLabel}_Distribution`;
  let classes = [];
  let props = [];

  switch (paramData.distributionType) {
    case 'Normal':
      classes = ['NormalDistributionExpression'];
      props = [
        ...(paramData.mean              ? [{ property: 'hasAverageParameter',            value: parseFloat(paramData.mean) }]             : []),
        ...(paramData.standardDeviation ? [{ property: 'hasStandardDeviationParameter', value: parseFloat(paramData.standardDeviation) }] : [])
      ];
      break;
    case 'Uniform':
      classes = ['UniformDistributionExpression'];
      props = [
        ...(paramData.lowerBound ? [{ property: 'hasLowerLimitParameter', value: parseFloat(paramData.lowerBound) }] : []),
        ...(paramData.upperBound ? [{ property: 'hasUpperLimitParameter', value: parseFloat(paramData.upperBound) }] : [])
      ];
      break;
    case 'Beta':
      classes = ['BetaDistributionExpression'];
      props = [
        ...(paramData.alpha ? [{ property: 'hasAlfaParameter', value: parseFloat(paramData.alpha) }] : []),
        ...(paramData.beta  ? [{ property: 'hasBetaParameter', value: parseFloat(paramData.beta) }]  : [])
      ];
      break;
    case 'Gamma':
      classes = ['GammaDistributionExpression'];
      props = [
        ...(paramData.alpha  ? [{ property: 'hasAlfaParameter',   value: parseFloat(paramData.alpha) }]  : []),
        ...(paramData.lambda ? [{ property: 'hasLambdaParameter', value: parseFloat(paramData.lambda) }] : [])
      ];
      break;
  }

  await createIndividual({
    label: distributionLabel,
    comment: `${paramData.distributionType} distribution for ${baseLabel}`,
    selectedClasses: classes,
    datatypeProperties: props,
    objectProperties: []
  });

  return distributionLabel;
};

/**
 * @brief Creates a complete stochastic or deterministic parameter individual.
 *
 * Calls `buildDistribution` first to obtain a distribution label (if applicable),
 * then assembles and persists the parameter individual with the appropriate OWL
 * classes and properties.
 *
 * OWL classes applied:
 * - Stochastic: `Parameter`, `SecondOrderUncertaintyParameter`, …`additionalClasses`
 * - Deterministic: `Parameter`, `DeterministicParameter`, …`additionalClasses`
 *
 * When a distribution is created its label is linked via the
 * `hasUncertaintyCharacterization` object property.
 *
 * @param {Object}   paramData                - Parameter form state (from `useEpiParameter` or equivalent).
 * @param {boolean}  paramData.isStochastic   - Selects stochastic vs. deterministic OWL classes.
 * @param {string}   paramData.value          - Expected value (converted to `float`).
 * @param {string}   [paramData.source]       - Bibliographic source (omitted when empty).
 * @param {string}   label                    - IRI label for the new parameter individual.
 * @param {string}   comment                  - Free-text description stored as `hasDescription`.
 * @param {string[]} [additionalClasses=[]]   - Extra OWL class names merged into `selectedClasses`.
 * @param {Array<{property: string, value: *}>}    [additionalDataProps=[]]
 *   Extra datatype property assertions merged into the individual payload.
 * @param {Array<{property: string, value: string}>} [additionalObjectProps=[]]
 *   Extra object property assertions merged into the individual payload.
 *
 * @returns {Promise<Object>} Parsed JSON response from `createIndividual`.
 */
export const createStochasticParameter = async (
  paramData,
  label,
  comment,
  additionalClasses = [],
  additionalDataProps = [],
  additionalObjectProps = []
) => {
  const distributionLabel = await buildDistribution(label, paramData);

  const paramClasses = paramData.isStochastic
    ? ['Parameter', 'SecondOrderUncertaintyParameter', ...additionalClasses]
    : ['Parameter', 'DeterministicParameter', ...additionalClasses];

  return await createIndividual({
    label,
    comment,
    selectedClasses: paramClasses,
    datatypeProperties: [
      { property: 'hasExpectedValue', value: parseFloat(paramData.value) },
      ...(paramData.source ? [{ property: 'hasSource', value: paramData.source }] : []),
      ...additionalDataProps
    ],
    objectProperties: [
      ...(distributionLabel ? [{ property: 'hasUncertaintyCharacterization', value: distributionLabel }] : []),
      ...additionalObjectProps
    ]
  });
};
