/**
 * @file useSaveStatus.js
 * @brief Custom hook for tracking the lifecycle of an async save operation.
 *
 * Wraps any async function with a consistent saving / success / error state
 * pattern. On success the `success` flag is automatically cleared after 2 s so
 * that toast notifications dismiss themselves without extra logic in the caller.
 *
 * @module hooks/useSaveStatus
 */

import { useState } from 'react';

/**
 * @brief Provides saving, success, and error state for async save operations.
 *
 * @returns {{ saving: boolean, success: boolean, error: string, withSave: Function }}
 *   An object with:
 *   - `saving`    — `true` while the async operation is running.
 *   - `success`   — `true` for 2 s after the operation resolves successfully.
 *   - `error`     — error message string; empty when no error has occurred.
 *   - `withSave(fn)` — executes `fn` (an async function) and manages all state
 *                      transitions automatically.
 */
function useSaveStatus() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  /**
   * @brief Executes an async save function and manages the full status lifecycle.
   *
   * Sets `saving` to `true` before calling `fn`, clears any previous error,
   * and on completion either marks success (auto-cleared after 2 s) or stores
   * the error message.
   *
   * @param {() => Promise<void>} fn - The async operation to execute (e.g. a
   *   sequence of `createIndividual` API calls).
   * @returns {Promise<void>}
   */
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
