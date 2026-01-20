import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, TrendingUp, ArrowLeft, Database, ShieldCheck, Share2 } from 'lucide-react';
import OntologyGraph from '../components/OntologyGraph';
import Navbar from '../components/Navbar';

const API_BASE_URL = 'http://localhost:8000';

function DevelopmentPage({ onNavigate, currentPage, diseaseData, developmentData, setDevelopmentData }) {
  const [formData, setFormData] = useState({
    label: developmentData.label || '',
    comment: developmentData.comment || '',
  });

  const [devProps, setDevProps] = useState({
    hasAge: developmentData.developmentProperties?.hasAge || '',
    hasOnset: developmentData.developmentProperties?.hasOnset || '',
    hasStage: developmentData.developmentProperties?.hasStage || '',
    hasSeverity: developmentData.developmentProperties?.hasSeverity || '',
    hasProgression: developmentData.developmentProperties?.hasProgression || '',
    hasRiskFactor: developmentData.developmentProperties?.hasRiskFactor || ''
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Actualizar el estado compartido cuando cambian los datos del formulario
  useEffect(() => {
    setDevelopmentData({
      label: formData.label,
      comment: formData.comment,
      selectedClasses: ['Development'],
      datatypeProperties: [],
      objectProperties: [],
      developmentProperties: devProps
    });
  }, [formData, devProps, setDevelopmentData]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDevPropsChange = (e) => {
    setDevProps({
      ...devProps,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    if (!formData.label) {
      setError('El nombre del desarrollo es obligatorio');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const allProperties = [
        ...(devProps.hasAge ? [{ property: 'hasAge', value: devProps.hasAge }] : []),
        ...(devProps.hasOnset ? [{ property: 'hasOnset', value: devProps.hasOnset }] : []),
        ...(devProps.hasStage ? [{ property: 'hasStage', value: devProps.hasStage }] : []),
        ...(devProps.hasSeverity ? [{ property: 'hasSeverity', value: devProps.hasSeverity }] : []),
        ...(devProps.hasProgression ? [{ property: 'hasProgression', value: devProps.hasProgression }] : []),
        ...(devProps.hasRiskFactor ? [{ property: 'hasRiskFactor', value: devProps.hasRiskFactor }] : []),
      ];

      const dataToSend = {
        label: formData.label,
        comment: formData.comment,
        selectedClasses: ['Development'],
        datatypeProperties: allProperties,
        objectProperties: []
      };

      const response = await fetch(`${API_BASE_URL}/ontology/individual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Error al crear el desarrollo');
      }
    } catch (err) {
      setError('Error conectando con el servidor. Asegúrate de que la API esté corriendo en http://localhost:8000');
    } finally {
      setSaving(false);
    }
  };

  // Comprobar si Disease está completa
  const isDiseaseComplete = diseaseData && diseaseData.label && diseaseData.label.trim() !== '';

  return (
    <div className="h-screen flex flex-col">
      {/* Navbar */}
      <Navbar currentPage={currentPage} onNavigate={onNavigate} />

      {/* Mensajes */}
      {(error || success) && (
        <div className="shrink-0 z-50">
          {error && (
            <div className="max-w-full mx-auto px-6 py-3">
              <div className="bg-rose-50 border-l-4 border-rose-500 rounded-r-lg p-3 flex items-start shadow-sm">
                <AlertCircle className="w-5 h-5 text-rose-600 mr-2 mt-0.5 shrink-0" />
                <p className="text-rose-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="max-w-full mx-auto px-6 py-3">
              <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg p-3 flex items-start shadow-sm">
                <CheckCircle className="w-5 h-5 text-emerald-600 mr-2 mt-0.5 shrink-0" />
                <p className="text-emerald-800 text-sm font-medium">¡Desarrollo guardado exitosamente!</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contenido Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel Izquierdo - Formulario */}
        <div className="w-1/2 flex flex-col bg-slate-200">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Header */}
              <div className="bg-slate-900 rounded-2xl shadow-xl p-7 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-2">
                    <TrendingUp className="w-7 h-7 text-emerald-400" />
                    <h1 className="text-2xl font-bold">Desarrollo</h1>
                  </div>
                  <p className="text-slate-300 text-sm">
                    Define las características del desarrollo y progresión de la enfermedad
                  </p>
                </div>
              </div>

              {/* Mostrar info de Disease */}
              {isDiseaseComplete && (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Database className="w-5 h-5 text-slate-600" />
                    <h3 className="text-md font-bold text-slate-800">Enfermedad Base</h3>
                  </div>
                  <div className="pl-7">
                    <p className="text-lg font-bold text-emerald-600">{diseaseData.label}</p>
                    {diseaseData.comment && (
                      <p className="text-sm text-slate-600 mt-1">{diseaseData.comment}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Información Básica */}
              <div className="space-y-5">
                <div className="grid gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Nombre del Desarrollo
                    </label>
                    <input
                      type="text"
                      name="label"
                      value={formData.label}
                      onChange={handleInputChange}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      placeholder="ej: Diabetes Mellitus Tipo 2"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl ..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Descripción / Comentarios
                    </label>
                    <textarea
                      name="comment"
                      value={formData.comment}
                      onChange={handleInputChange}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      rows="3"
                      placeholder="Breve resumen de la enfermedad..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl ..."
                    />
                  </div>
                </div>
              </div>

              {/* Nota técnica */}
              <div className="flex items-start space-x-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-800 leading-relaxed">
                  <strong>Validación Clínica:</strong> La información sobre el desarrollo ayuda a entender la evolución natural de la enfermedad y sus factores de riesgo para un modelado HEOR preciso.
                </p>
              </div>

              {/* Botón Guardar */}
              <div className="pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.label}
                  className="w-full bg-emerald-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:grayscale"
                >
                  <Save className="w-5 h-5" />
                  <span>{saving ? 'Procesando...' : 'Guardar Parámetros'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho - Grafo */}
        <div className="w-3/4 flex flex-col bg-slate-200 p-10 h-full">
          <div className="flex flex-col h-full bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">

            {/* Header del Grafo - Estilo Instrumento de Medición */}
            <div className="bg-slate-900 px-6 py-5 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> {/* Indicador "Live" */}
                <div>
                  <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                    Mapa interactivo de la enfermedad
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium italic">
                    Visualiza las diferentes relaciones entre los componentes clínicos.
                  </p>
                </div>
              </div>

              {/* Badge de estado del Grafo */}
              <div className="flex items-center space-x-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <Share2 className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  En vivo
                </span>
              </div>
            </div>

            {/* Área del Grafo con efecto de profundidad */}
            <div className="flex-1 relative bg-slate-50 bg-size-[20px_20px]">
              <div className="absolute inset-0 overflow-hidden">
                <OntologyGraph
                  diseaseData={diseaseData}
                  developmentData={developmentData}
                />
              </div>

              {/* Overlay de viñeta para centrar la atención en el centro del grafo */}
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.3)]" />
            </div>

            {/* Footer del Grafo - Resumen de datos */}
            <div className="bg-slate-900/50 px-6 py-3 border-t border-slate-800 flex justify-between items-center">
              <div className="flex space-x-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-sm mr-2" /> Nodos completados
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-slate-600 rounded-sm mr-2" /> Nodos pendientes
                </span>
              </div>
              <button className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase">
                Reiniciar mapa
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DevelopmentPage;