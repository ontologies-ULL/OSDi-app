/**
 * @file useProjects.js
 * @brief Custom hook for fetching the list of OSDi ontology projects from the backend.
 *
 * Issues a GET request to `GET /ontology/projects` whenever `user` becomes
 * truthy. While the request is in flight `loading` is `true`. The hook does
 * nothing when `user` is `null` or `undefined`.
 *
 * @module hooks/useProjects
 */

import { useState, useEffect } from 'react';

/** @brief Base URL of the OSDi FastAPI backend. */
const API_BASE_URL = 'http://localhost:8000';

/**
 * @brief Fetches and exposes the list of available ontology projects.
 *
 * @param {Object|null} user - The currently authenticated user object (from
 *   `useLocalStorageUser`). The fetch is skipped when this is `null`.
 *
 * @returns {{ projects: string[], loading: boolean }} An object with:
 *   - `projects` — array of project name strings returned by the API
 *                  (empty until the request completes successfully).
 *   - `loading`  — `true` while the network request is in progress.
 */
function useProjects(user) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * @brief Re-fetches the project list whenever `user` changes.
   * Errors are logged to the console but do not surface to the caller.
   */
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    fetch(`${API_BASE_URL}/ontology/projects`)
      .then(res => res.ok ? res.json() : Promise.reject(new Error('Error cargando proyectos')))
      .then(data => setProjects(data.projects || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  return { projects, loading };
}

export default useProjects;
