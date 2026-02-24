import { useState } from 'react';

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

function useEpiParameter(initial = {}) {
  const [data, setData] = useState({ ...INITIAL_STATE, ...initial });

  const handleChange = (e) =>
    setData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  return [data, handleChange, setData];
}

export default useEpiParameter;
