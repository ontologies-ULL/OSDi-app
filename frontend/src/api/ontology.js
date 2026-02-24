const API_BASE_URL = 'http://localhost:8000';

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
 * Creates a distribution individual in the ontology.
 * Returns the distribution label, or null if no distribution data is present.
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
 * Creates a stochastic or deterministic parameter individual.
 * additionalDataProps / additionalObjectProps are merged into the final individual.
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
