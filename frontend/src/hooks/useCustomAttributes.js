/**
 * @file useCustomAttributes.js
 * @brief Custom hook for managing a list of user-defined stochastic/deterministic attributes.
 *
 * Each attribute is identified by a numeric `id` generated at insertion time via
 * `Date.now()`. The hook exposes four handler operations (add, update, remove, reset)
 * alongside the current attribute array.
 *
 * @module hooks/useCustomAttributes
 */

import { useState } from 'react';

/**
 * @brief Default shape of a new attribute entry.
 *
 * @property {string} name               - Human-readable name of the attribute.
 * @property {string} description        - Free-text description.
 * @property {boolean} isStochastic      - Whether stochastic distribution fields are active.
 * @property {string} value              - Deterministic expected value (as string).
 * @property {string} source             - Bibliographic or data source reference.
 * @property {string} distributionType   - Selected distribution family (`'Normal'`, `'Uniform'`, `'Beta'`, `'Gamma'`).
 * @property {string} mean               - Distribution mean parameter.
 * @property {string} standardDeviation  - Standard deviation (Normal distribution).
 * @property {string} lowerBound         - Lower bound (Uniform distribution).
 * @property {string} upperBound         - Upper bound (Uniform distribution).
 * @property {string} alpha              - Alpha shape parameter (Beta / Gamma distributions).
 * @property {string} beta               - Beta shape parameter (Beta distribution).
 * @property {string} lambda             - Rate parameter (Gamma distribution).
 * @property {string} confidenceInterval - Confidence interval percentage (default `'95'`).
 * @property {string} sampleSize         - Sample size used to derive the distribution.
 */
const EMPTY_ATTRIBUTE = {
  name: '', description: '', isStochastic: false, value: '', source: '',
  distributionType: 'Normal', mean: '', standardDeviation: '',
  lowerBound: '', upperBound: '', alpha: '', beta: '', lambda: '',
  confidenceInterval: '95', sampleSize: ''
};

/**
 * @brief Manages a list of custom attributes with id-based add / update / remove operations.
 *
 * @param {Array<Object>} [initial=[]] - Optional pre-populated list of attribute objects.
 *   Each object must already contain an `id` field when provided.
 *
 * @returns {[Array<Object>, Object]} A tuple of:
 *   - `attributes` — the current array of attribute objects.
 *   - `handlers` — an object with four mutation functions:
 *     - `add()` — appends a blank attribute with a unique `Date.now()` id.
 *     - `update(id, field, value)` — updates a single field on the attribute matching `id`.
 *     - `remove(id)` — removes the attribute with the given `id`.
 *     - `reset(newList)` — replaces the entire list with `newList` (defaults to `[]`).
 */
function useCustomAttributes(initial = []) {
  const [attributes, setAttributes] = useState(initial);

  const handlers = {
    /**
     * @brief Appends a blank attribute entry with a unique timestamp-based id.
     */
    add: () =>
      setAttributes(prev => [...prev, { ...EMPTY_ATTRIBUTE, id: Date.now() }]),

    /**
     * @brief Updates a single field on the attribute identified by `id`.
     * @param {number} id    - Unique identifier of the attribute to update.
     * @param {string} field - Name of the field to change.
     * @param {*}      value - New value for the field.
     */
    update: (id, field, value) =>
      setAttributes(prev =>
        prev.map(attr => attr.id === id ? { ...attr, [field]: value } : attr)
      ),

    /**
     * @brief Removes the attribute with the given `id` from the list.
     * @param {number} id - Unique identifier of the attribute to remove.
     */
    remove: (id) =>
      setAttributes(prev => prev.filter(attr => attr.id !== id)),

    /**
     * @brief Replaces the entire attribute list with a new array.
     * @param {Array<Object>} [newList=[]] - Replacement list. Pass an empty array to clear.
     */
    reset: (newList = []) =>
      setAttributes(newList),
  };

  return [attributes, handlers];
}

export default useCustomAttributes;
