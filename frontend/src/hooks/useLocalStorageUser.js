/**
 * @file useLocalStorageUser.js
 * @brief Custom hook for persisting and retrieving the authenticated user via `localStorage`.
 *
 * On mount the hook attempts to parse the `'user'` key from `localStorage`. If
 * the stored value is malformed JSON the entry is removed and the user state
 * stays `null`. The `login` and `logout` helpers keep the in-memory state and
 * `localStorage` in sync.
 *
 * @module hooks/useLocalStorageUser
 */

import { useState, useEffect } from 'react';

/**
 * @brief Manages the current user session backed by `localStorage`.
 *
 * @returns {{ user: Object|null, login: Function, logout: Function }} An object with:
 *   - `user`    — the current user object, or `null` when not authenticated.
 *   - `login(userData)` — stores `userData` in memory (does **not** write to
 *                         `localStorage`; the caller is responsible for persisting).
 *   - `logout()` — removes the `'user'` entry from `localStorage` and sets `user` to `null`.
 */
function useLocalStorageUser() {
  const [user, setUser] = useState(null);

  /**
   * @brief On mount: reads and parses the `'user'` key from `localStorage`.
   * Silently removes the key if the stored value is not valid JSON.
   */
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('user');
      }
    }
  }, []);

  /**
   * @brief Sets the authenticated user in memory.
   * @param {Object} userData - User object returned by the authentication endpoint.
   */
  const login = (userData) => {
    setUser(userData);
  };

  /**
   * @brief Clears the user session from both memory and `localStorage`.
   */
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return { user, login, logout };
}

export default useLocalStorageUser;
