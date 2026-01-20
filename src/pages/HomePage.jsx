import React, { useState } from 'react';
import { Plus, AlertCircle, FileText, Loader } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

function HomePage({ onNavigate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateProject = async () => {
    setLoading(true);
    setError('');

    try {
      // Cargar ontología desde /public/ontology.owl
      const response = await fetch('/ontology.owl');
      
      if (!response.ok) {
        throw new Error('No se pudo encontrar el archivo ontology.owl en /public');
      }

      const blob = await response.blob();
      const file = new File([blob], 'ontology.owl', { type: 'application/rdf+xml' });

      // Enviar a la API
      const formData = new FormData();
      formData.append('file', file);

      const apiResponse = await fetch(`${API_BASE_URL}/ontology/load`, {
        method: 'POST',
        body: formData,
      });

      if (apiResponse.ok) {
        // Navegar a la página de crear enfermedad
        setTimeout(() => {
          onNavigate('disease');
        }, 500);
      } else {
        const data = await apiResponse.json();
        setError(data.detail || 'Error cargando ontología');
        setLoading(false);
      }
    } catch (err) {
      setError(
        err.message || 
        'Error al cargar la ontología. Asegúrate de tener ontology.owl en /public y la API corriendo en http://localhost:8000'
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-600 rounded-2xl mb-6 shadow-lg shadow-emerald-200">
            <FileText className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-3 tracking-tight">
            Construye tu Modelo de Enfermedad
          </h1>
          <p className="text-xl text-slate-500">
            Esta herramienta interactiva te permitirá crear modelos de evaluación de tecnologías sanitarias de forma clara y flexible.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl flex items-start shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 mr-3 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-rose-900 text-sm font-bold">Error</p>
              <p className="text-rose-700 text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Tarjeta Principal */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-300 border border-slate-100 p-10">
          <button
            onClick={handleCreateProject}
            disabled={loading}
            className="w-full bg-slate-900 text-white py-5 rounded-xl font-semibold text-lg hover:bg-emerald-700 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin text-emerald-400" />
                <span>Cargando ...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>Crear Nuevo Proyecto</span>
              </>
            )}
          </button>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="grid gap-4">
              <div className="flex items-center rounded-lg transition-colors">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold text-sm mr-4 shrink-0">
                  <span className="text-sm text-slate-600">1</span>
                </div>
                <p>Completa los formularios de cada aspecto clave de la enfermedad.</p>
              </div>
              <div className="flex items-center rounded-lg transition-colors">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold text-sm mr-4 shrink-0">
                  <span className="text-sm text-slate-600">2</span>
                </div>
                <p>Se rellenará automáticamente un grafo interactivo que te permite ver tu enfermedad y las relaciones entre sus componentes.</p>
              </div>
              <div className="flex items-center rounded-lg transition-colors">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold text-sm mr-4 shrink-0">
                  <span className="text-sm text-slate-600">3</span>
                </div>
                <p>Accede a la fase de evaluación, donde podrás analizar el impacto económico.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center items-center space-x-2 text-slate-400">
          <p className="text-sm text-slate-500">
            💡 Asegúrate de tener{' '}
            <code className="bg-slate-200 px-2 py-1 rounded text-xs">ontology.owl</code>
            {' '}en la carpeta{' '}
            <code className="bg-slate-200 px-2 py-1 rounded text-xs">/public</code>
          </p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;