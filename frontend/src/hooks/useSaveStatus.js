import { useState } from 'react';

function useSaveStatus() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const withSave = async (fn) => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await fn();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setSaving(false);
    }
  };

  return { saving, success, error, withSave };
}

export default useSaveStatus;
