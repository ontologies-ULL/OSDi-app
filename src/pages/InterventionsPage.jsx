import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Pill, Share2 } from 'lucide-react';
import OntologyGraph from '../components/OntologyGraph';
import { Database, ShieldCheck, Activity } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

function InterventionsPage({ onNavigate, currentPage, diseaseData, populationData, interventionsData, setInterventionsData, developmentData }) {
  const [formData, setFormData] = useState({
    label: interventionsData.label || '',
    comment: interventionsData.comment || '',
  });

  const [interventionDetails, setInterventionDetails] = useState({
    hasInterventionType: interventionsData.interventionDetails?.hasInterventionType || '',
    hasDosage: interventionsData.interventionDetails?.hasDosage || '',
    hasFrequency: interventionsData.interventionDetails?.hasFrequency || '',
    hasDuration: interventionsData.interventionDetails?.hasDuration || ''
  });

  const [outcomes, setOutcomes] = useState({
    hasEfficacy: interventionsData.outcomes?.hasEfficacy || '',
    hasSafetyProfile: interventionsData.outcomes?.hasSafetyProfile || '',
    hasAdverseEvents: interventionsData.outcomes?.hasAdverseEvents || '',
    hasQualityOfLife: interventionsData.outcomes?.hasQualityOfLife || ''
  });

  const [economicData, setEconomicData] = useState({
    hasCostPerUnit: interventionsData.economicData?.hasCostPerUnit || '',
    hasTotalCost: interventionsData.economicData?.hasTotalCost || '',
    hasCostEffectiveness: interventionsData.economicData?.hasCostEffectiveness || '',
    hasReimbursementStatus: interventionsData.economicData?.hasReimbursementStatus || ''
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Actualizar el estado compartido cuando cambian los datos del formulario
  useEffect(() => {
    setInterventionsData({
      label: formData.label,
      comment: formData.comment,
      selectedClasses: ['Intervention'],
      datatypeProperties: [],
      objectProperties: [],
      interventionDetails: interventionDetails,
      outcomes: outcomes,
      economicData: economicData
    });
  }, [formData, interventionDetails, outcomes, economicData, setInterventionsData]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleInterventionDetailsChange = (e) => {
    setInterventionDetails({
      ...interventionDetails,
      [e.target.name]: e.target.value
    });
  };

  const handleOutcomesChange = (e) => {
    setOutcomes({
      ...outcomes,
      [e.target.name]: e.target.value
    });
  };

  const handleEconomicDataChange = (e) => {
    setEconomicData({
      ...economicData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    if (!formData.label) {
      setError('El nombre de la intervención es obligatorio');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const allProperties = [
        ...(interventionDetails.hasInterventionType ? [{ property: 'hasInterventionType', value: interventionDetails.hasInterventionType }] : []),
        ...(interventionDetails.hasDosage ? [{ property: 'hasDosage', value: interventionDetails.hasDosage }] : []),
        ...(interventionDetails.hasFrequency ? [{ property: 'hasFrequency', value: interventionDetails.hasFrequency }] : []),
        ...(interventionDetails.hasDuration ? [{ property: 'hasDuration', value: interventionDetails.hasDuration }] : []),
        ...(outcomes.hasEfficacy ? [{ property: 'hasEfficacy', value: outcomes.hasEfficacy }] : []),
        ...(outcomes.hasSafetyProfile ? [{ property: 'hasSafetyProfile', value: outcomes.hasSafetyProfile }] : []),
        ...(outcomes.hasAdverseEvents ? [{ property: 'hasAdverseEvents', value: outcomes.hasAdverseEvents }] : []),
        ...(outcomes.hasQualityOfLife ? [{ property: 'hasQualityOfLife', value: outcomes.hasQualityOfLife }] : []),
        ...(economicData.hasCostPerUnit ? [{ property: 'hasCostPerUnit', value: economicData.hasCostPerUnit }] : []),
        ...(economicData.hasTotalCost ? [{ property: 'hasTotalCost', value: economicData.hasTotalCost }] : []),
        ...(economicData.hasCostEffectiveness ? [{ property: 'hasCostEffectiveness', value: economicData.hasCostEffectiveness }] : []),
        ...(economicData.hasReimbursementStatus ? [{ property: 'hasReimbursementStatus', value: economicData.hasReimbursementStatus }] : []),
      ];

      const dataToSend = {
        label: formData.label,
        comment: formData.comment,
        selectedClasses: ['Intervention'],
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
        setError(data.detail || 'Error al crear la intervención');
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
                <p className="text-emerald-800 text-sm font-medium">¡Intervención guardada exitosamente!</p>
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
                    <Pill className="w-7 h-7 text-emerald-400" />
                    <h1 className="text-2xl font-bold">Intervenciones y Efectos</h1>
                  </div>
                  <p className="text-slate-300 text-sm">
                    Define las intervenciones terapéuticas y sus resultados clínicos y económicos
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Nombre de la Intervención
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
                      placeholder="ej: Metformina 850mg"
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
                      placeholder="Breve resumen de la intervención..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque: Detalles de la Intervención */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">
                <div className="flex items-center space-x-2">
                  <Pill className="w-5 h-5 text-slate-600" />
                  <h2 className="text-md font-bold text-slate-800">Detalles de la Intervención</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Tipo de Intervención</label>
                    <input
                      type="text"
                      name="hasInterventionType"
                      value={interventionDetails.hasInterventionType}
                      onChange={handleInterventionDetailsChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                      placeholder="ej: Farmacológica, Quirúrgica"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Dosificación</label>
                    <input
                      type="text"
                      name="hasDosage"
                      value={interventionDetails.hasDosage}
                      onChange={handleInterventionDetailsChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                      placeholder="ej: 850mg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Frecuencia</label>
                    <input
                      type="text"
                      name="hasFrequency"
                      value={interventionDetails.hasFrequency}
                      onChange={handleInterventionDetailsChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                      placeholder="ej: 2 veces al día"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Duración</label>
                    <input
                      type="text"
                      name="hasDuration"
                      value={interventionDetails.hasDuration}
                      onChange={handleInterventionDetailsChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                      placeholder="ej: Tratamiento crónico"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque: Resultados Clínicos */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-slate-600" />
                  <h2 className="text-md font-bold text-slate-800">Resultados Clínicos</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Eficacia</label>
                    <input
                      type="text"
                      name="hasEfficacy"
                      value={outcomes.hasEfficacy}
                      onChange={handleOutcomesChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                      placeholder="ej: Reducción HbA1c 1.5%"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Perfil de Seguridad</label>
                    <input
                      type="text"
                      name="hasSafetyProfile"
                      value={outcomes.hasSafetyProfile}
                      onChange={handleOutcomesChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                      placeholder="ej: Bien tolerado"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Eventos Adversos</label>
                    <input
                      type="text"
                      name="hasAdverseEvents"
                      value={outcomes.hasAdverseEvents}
                      onChange={handleOutcomesChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                      placeholder="ej: Náuseas 5-10%"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Calidad de Vida</label>
                    <input
                      type="text"
                      name="hasQualityOfLife"
                      value={outcomes.hasQualityOfLife}
                      onChange={handleOutcomesChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                      placeholder="ej: Mejora moderada EQ-5D"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque: Datos Económicos */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-slate-600" />
                  <h2 className="text-md font-bold text-slate-800">Datos Económicos</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Coste por Unidad</label>
                    <input
                      type="text"
                      name="hasCostPerUnit"
                      value={economicData.hasCostPerUnit}
                      onChange={handleEconomicDataChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                      placeholder="ej: 0.15€ por comprimido"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Coste Total</label>
                    <input
                      type="text"
                      name="hasTotalCost"
                      value={economicData.hasTotalCost}
                      onChange={handleEconomicDataChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                      placeholder="ej: 109€ anuales"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Coste-Efectividad</label>
                    <input
                      type="text"
                      name="hasCostEffectiveness"
                      value={economicData.hasCostEffectiveness}
                      onChange={handleEconomicDataChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                      placeholder="ej: 15,000€/QALY"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Estado Reembolso</label>
                    <input
                      type="text"
                      name="hasReimbursementStatus"
                      value={economicData.hasReimbursementStatus}
                      onChange={handleEconomicDataChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                      placeholder="ej: Financiado SNS"
                    />
                  </div>
                </div>
              </div>

              {/* Nota técnica */}
              <div className="flex items-start space-x-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-800 leading-relaxed">
                  <strong>Validación HEOR:</strong> Los datos de eficacia y coste-efectividad deben provenir de estudios clínicos controlados y análisis económicos validados según guías locales.
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
                  interventionsData={interventionsData}
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

export default InterventionsPage;