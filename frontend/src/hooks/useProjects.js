import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8000';

function useProjects(user) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

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
