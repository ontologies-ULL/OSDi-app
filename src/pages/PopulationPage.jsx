import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Users, Share2 } from 'lucide-react';
import OntologyGraph from '../components/OntologyGraph';
import { Database, ShieldCheck } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

function PopulationPage({ onNavigate, currentPage, diseaseData, populationData, setPopulationData, developmentData }) {
  const [formData, setFormData] = useState({
    label: populationData.label || '',
    comment: populationData.comment || '',
  });

  const [demographics, setDemographics] = useState({
    hasAgeRange: populationData.demographics?.hasAgeRange || '',
    hasGender: populationData.demographics?.hasGender || '',
    hasEthnicity: populationData.demographics?.hasEthnicity || '',
    hasGeographicLocation: populationData.demographics?.hasGeographicLocation || ''
  });

  const [epidemiology, setEpidemiology] = useState({
    hasPrevalence: populationData.epidemiology?.hasPrevalence || '',
    hasIncidence: populationData.epidemiology?.hasIncidence || '',
    hasMortality: populationData.epidemiology?.hasMortality || '',
    hasMorbidity: populationData.epidemiology?.hasMorbidity || ''
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Actualizar el estado compartido cuando cambian los datos del formulario
  useEffect(() => {
    setPopulationData({
      label: formData.label,
      comment: formData.comment,
      selectedClasses: ['PopulationAffected'],
      datatypeProperties: [],
      objectProperties: [],
      demographics: demographics,
      epidemiology: epidemiology
    });
  }, [formData, demographics, epidemiology, setPopulationData]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDemographicsChange = (e) => {
    setDemographics({
      ...demographics,
      [e.target.name]: e.target.value
    });
  };

  const handleEpidemiologyChange = (e) => {
    setEpidemiology({
      ...epidemiology,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    if (!formData.label) {
      setError('El nombre de la población es obligatorio');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const allProperties = [
        ...(demographics.hasAgeRange ? [{ property: 'hasAgeRange', value: demographics.hasAgeRange }] : []),
        ...(demographics.hasGender ? [{ property: 'hasGender', value: demographics.hasGender }] : []),
        ...(demographics.hasEthnicity ? [{ property: 'hasEthnicity', value: demographics.hasEthnicity }] : []),
        ...(demographics.hasGeographicLocation ? [{ property: 'hasGeographicLocation', value: demographics.hasGeographicLocation }] : []),
        ...(epidemiology.hasPrevalence ? [{ property: 'hasPrevalence', value: epidemiology.hasPrevalence }] : []),
        ...(epidemiology.hasIncidence ? [{ property: 'hasIncidence', value: epidemiology.hasIncidence }] : []),
        ...(epidemiology.hasMortality ? [{ property: 'hasMortality', value: epidemiology.hasMortality }] : []),
        ...(epidemiology.hasMorbidity ? [{ property: 'hasMorbidity', value: epidemiology.hasMorbidity }] : []),
      ];

      const dataToSend = {
        label: formData.label,
        comment: formData.comment,
        selectedClasses: ['PopulationAffected'],
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
        setError(data.detail || 'Error al crear la población afectada');
      }
    } catch (err) {
      setError('Error conectando con el servidor. Asegúrate de que la API esté corriendo en http://localhost:8000');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">

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
                <p className="text-emerald-800 text-sm font-medium">¡Población guardada exitosamente!</p>
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
                    <Users className="w-7 h-7 text-emerald-400" />
                    <h1 className="text-2xl font-bold">Población Afectada</h1>
                  </div>
                  <p className="text-slate-300 text-sm">
                    Define las características demográficas y epidemiológicas de la población
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Nombre de la Población
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
                      placeholder="ej: Adultos con Diabetes Tipo 2 en España"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
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
                      placeholder="Breve resumen de la población afectada..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque: Datos Demográficos */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-slate-600" />
                  <h2 className="text-md font-bold text-slate-800">Datos Demográficos</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Rango de Edad</label>
                    <input
                      type="text"
                      name="hasAgeRange"
                      value={demographics.hasAgeRange}
                      onChange={handleDemographicsChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                      placeholder="ej: 40-65 años"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Género</label>
                    <input
                      type="text"
                      name="hasGender"
                      value={demographics.hasGender}
                      onChange={handleDemographicsChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                      placeholder="ej: Todos, Masculino, Femenino"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Etnia</label>
                    <input
                      type="text"
                      name="hasEthnicity"
                      value={demographics.hasEthnicity}
                      onChange={handleDemographicsChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                      placeholder="ej: Caucásica, Hispana"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Ubicación Geográfica</label>
                    <input
                      type="text"
                      name="hasGeographicLocation"
                      value={demographics.hasGeographicLocation}
                      onChange={handleDemographicsChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                      placeholder="ej: España, Europa"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque: Datos Epidemiológicos */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-slate-600" />
                  <h2 className="text-md font-bold text-slate-800">Datos Epidemiológicos</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Prevalencia</label>
                    <input
                      type="text"
                      name="hasPrevalence"
                      value={epidemiology.hasPrevalence}
                      onChange={handleEpidemiologyChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                      placeholder="ej: 13.8% en adultos"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Incidencia</label>
                    <input
                      type="text"
                      name="hasIncidence"
                      value={epidemiology.hasIncidence}
                      onChange={handleEpidemiologyChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                      placeholder="ej: 11.6 casos/1000 personas-año"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Mortalidad</label>
                    <input
                      type="text"
                      name="hasMortality"
                      value={epidemiology.hasMortality}
                      onChange={handleEpidemiologyChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                      placeholder="ej: 5.2% anual"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Morbilidad</label>
                    <input
                      type="text"
                      name="hasMorbidity"
                      value={epidemiology.hasMorbidity}
                      onChange={handleEpidemiologyChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                      placeholder="ej: Alto riesgo cardiovascular"
                    />
                  </div>
                </div>
              </div>

              {/* Nota técnica */}
              <div className="flex items-start space-x-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-800 leading-relaxed">
                  <strong>Validación HEOR:</strong> Los datos epidemiológicos deben basarse en estudios poblacionales recientes y validados para garantizar estimaciones precisas de carga de enfermedad.
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
            <div className="bg-slate-900 px-6 py-5 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <div>
                  <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                    Mapa interactivo de la enfermedad
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium italic">
                    Visualiza las diferentes relaciones entre los componentes clínicos.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <Share2 className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  En vivo
                </span>
              </div>
            </div>

            <div className="flex-1 relative bg-slate-50 bg-size-[20px_20px]">
              <div className="absolute inset-0 overflow-hidden">
                <OntologyGraph
                  diseaseData={diseaseData}
                  populationData={populationData}
                  developmentData={developmentData}
                />
              </div>
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.3)]" />
            </div>

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

export default PopulationPage;