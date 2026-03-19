/**
 * @file useEpiParameter.js
 * @brief Custom hook for managing a single epidemiological parameter form state.
 *
 * Provides a unified state object covering both deterministic (single value)
 * and stochastic (distribution-based) configuration of an OSDi parameter, along
 * with a generic `handleChange` compatible with standard DOM input elements.
 *
 * @module hooks/useEpiParameter
 */

import { useState } from 'react';

/**
 * @brief Default state shape for an epidemiological parameter.
 *
 * @property {boolean} isStochastic      - Whether stochastic distribution fields are active.
 * @property {string}  value             - Deterministic expected value (as string).
 * @property {string}  source            - Bibliographic or data source reference.
 * @property {string}  distributionType  - Selected distribution family (default `'Beta'`).
 * @property {string}  mean              - Distribution mean parameter.
 * @property {string}  standardDeviation - Standard deviation (Normal distribution).
 * @property {string}  lowerBound        - Lower bound (Uniform distribution).
 * @property {string}  upperBound        - Upper bound (Uniform distribution).
 * @property {string}  alpha             - Alpha shape parameter (Beta / Gamma distributions).
 * @property {string}  beta              - Beta shape parameter (Beta distribution).
 * @property {string}  lambda            - Rate parameter (Gamma distribution).
 * @property {string}  confidenceInterval - Confidence interval percentage (default `'95'`).
 * @property {string}  sampleSize        - Sample size used to derive the distribution.
 */
const INITIAL_STATE = {
  isStochastic: false,
  value: '',
  source: '',
  distributionType: 'Beta',
  mean: '',
  standardDeviation: '',
  lowerBound: '',
  upperBound: '',
  alpha: '',
  beta: '',
  lambda: '',
  confidenceInterval: '95',
  sampleSize: ''
};

/**
 * @brief Hook for a single epidemiological parameter form.
 *
 * Merges `initial` over the default state so callers can pre-populate specific
 * fields (e.g. when editing an existing individual) while keeping sensible
 * defaults for all other fields.
 *
 * @param {Partial<typeof INITIAL_STATE>} [initial={}] - Partial object of field
 *   values to override the defaults on first render.
 *
 * @returns {[Object, Function, Function]} A three-element tuple:
 *   - `data`         — the current form state object.
 *   - `handleChange` — event handler `(e: React.ChangeEvent) => void` that updates
 *                      `data[e.target.name]` with `e.target.value`.
 *   - `setData`      — raw state setter for bulk updates (e.g. loading saved data).
 */
function useEpiParameter(initial = {}) {
  const [data, setData] = useState({ ...INITIAL_STATE, ...initial });

  /**
   * @brief Generic change handler for controlled inputs.
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>} e
   *   The DOM change event; `e.target.name` and `e.target.value` are used.
   */
  const handleChange = (e) =>
    setData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  return [data, handleChange, setData];
}

export default useEpiParameter;
