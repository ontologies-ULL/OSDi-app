import { useState } from 'react';

const EMPTY_ATTRIBUTE = {
  name: '', description: '', isStochastic: false, value: '', source: '',
  distributionType: 'Normal', mean: '', standardDeviation: '',
  lowerBound: '', upperBound: '', alpha: '', beta: '', lambda: '',
  confidenceInterval: '95', sampleSize: ''
};

/**
 * Manages a list of custom attributes with id-based add / update / remove.
 * Returns [attributes, handlers] where handlers = { add, update(id, field, value), remove(id) }
 */
function useCustomAttributes(initial = []) {
  const [attributes, setAttributes] = useState(initial);

  const handlers = {
    add: () =>
      setAttributes(prev => [...prev, { ...EMPTY_ATTRIBUTE, id: Date.now() }]),

    update: (id, field, value) =>
      setAttributes(prev =>
        prev.map(attr => attr.id === id ? { ...attr, [field]: value } : attr)
      ),

    remove: (id) =>
      setAttributes(prev => prev.filter(attr => attr.id !== id)),
  };

  return [attributes, handlers];
}

export default useCustomAttributes;
