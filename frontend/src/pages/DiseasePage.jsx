import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Stethoscope, Database, ShieldCheck, Share2, Info } from 'lucide-react';
import OntologyGraph from '../components/OntologyGraph';

const API_BASE_URL = 'http://localhost:8000';

function DiseasePage({ onNavigate, currentPage, diseaseData, setDiseaseData, setDiseaseName, developmentData }) {
  const [formData, setFormData] = useState({
    label: diseaseData.label || '',
    comment: diseaseData.comment || '',
  });

  const [references, setReferences] = useState({
    hasRefToDO: diseaseData.references?.hasRefToDO || '',
    hasRefToICD: diseaseData.references?.hasRefToICD || '',
    hasRefToOMIM: diseaseData.references?.hasRefToOMIM || '',
    hasRefToSNOMED: diseaseData.references?.hasRefToSNOMED || ''
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setDiseaseData({
      label: formData.label,
      comment: formData.comment,
      selectedClasses: ['Disease'],
      datatypeProperties: [],
      objectProperties: [],
      references: references
    });
    if (setDiseaseName) {
      setDiseaseName(formData.label);
    }
  }, [formData, references, setDiseaseData]);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleReferenceChange = (e) => setReferences({ ...references, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!formData.label) {
      setError('El nombre de la enfermedad es obligatorio');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const allProperties = [
        ...(references.hasRefToDO ? [{ property: 'hasRefToDO', value: references.hasRefToDO }] : []),
        ...(references.hasRefToICD ? [{ property: 'hasRefToICD', value: references.hasRefToICD }] : []),
        ...(references.hasRefToOMIM ? [{ property: 'hasRefToOMIM', value: references.hasRefToOMIM }] : []),
        ...(references.hasRefToSNOMED ? [{ property: 'hasRefToSNOMED', value: references.hasRefToSNOMED }] : []),
      ];

      const dataToSend = {
        label: formData.label,
        comment: formData.comment,
        selectedClasses: ['Disease'],
        datatypeProperties: allProperties,
        objectProperties: []
      };

      const response = await fetch(`${API_BASE_URL}/ontology/individual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Error al guardar la entidad clínica');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-5.1rem)] bg-slate-200 overflow-hidden font-sans">
      
      {/* Mensajes Flotantes */}
      {(error || success) && (
        <div className="fixed top-24 right-8 z-50 animate-in fade-in slide-in-from-top-4">
          <div className={`flex items-center space-x-3 p-4 rounded-2xl shadow-xl border-l-4 ${
            error ? 'bg-white border-rose-500 text-rose-800' : 'bg-white border-emerald-500 text-emerald-800'
          }`}>
            {error ? <AlertCircle className="w-5 h-5 text-rose-500" /> : <CheckCircle className="w-5 h-5 text-emerald-500" />}
            <p className="text-sm font-bold">{error || 'Entidad clínica guardada con éxito'}</p>
          </div>
        </div>
      )}

      <div className="flex w-full p-8 gap-8 overflow-hidden">
        
        {/* PANEL IZQUIERDO: Formulario (Azul Clínico) */}
        <div className="w-1/2 overflow-y-auto pr-2 custom-scrollbar">
          <div className="max-w-3xl space-y-6">
            
            {/* Header con gradiente azul */}
            <div className="bg-linear-to-br from-emerald-500 to-emerald-900 rounded-3xl p-8 text-white">
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-2">
                  <Stethoscope className="w-7 h-7 text-emerald-100" strokeWidth={2.5} />
                  <h1 className="text-3xl font-bold tracking-tight">Enfermedad</h1>
                </div>
                <p className="text-emerald-100/80 text-sm font-medium">Define la identidad y codificación internacional de la patología</p>
              </div>
            </div>

            {/* Datos Principales */}
            <div className="space-y-4">
              <div className="group">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nombre de la Enfermedad</label>
                <input
                  type="text"
                  name="label"
                  value={formData.label}
                  onChange={handleInputChange}
                  placeholder="ej: Esclerosis Múltiple Recurrente"
                  className="w-full px-5 py-4 bg-white/80 backdrop-blur-sm border border-slate-300 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm text-slate-600"
                />
              </div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Descripción Clínica</label>
              <textarea
                name="comment"
                value={formData.comment}
                onChange={handleInputChange}
                placeholder="Descripción clínica o criterios de diagnóstico..."
                rows="3"
                className="w-full px-5 py-4 bg-white/80 backdrop-blur-sm border border-slate-300 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm text-slate-600"
              />
            </div>

            {/* Bloque: Codificación y Referencias */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-300 p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Database className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Sistemas de Referencia</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {[
                  { name: 'hasRefToICD', label: 'CIE-10 (ICD)', ph: 'Cód. Diagnóstico' },
                  { name: 'hasRefToSNOMED', label: 'SNOMED CT', ph: 'ID Concepto' },
                  { name: 'hasRefToOMIM', label: 'OMIM', ph: 'Ref. Genética' },
                  { name: 'hasRefToDO', label: 'Disease Ontology', ph: 'DOID:XXXX' }
                ].map(field => (
                  <div key={field.name} className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{field.label}</label>
                    <input
                      type="text"
                      name={field.name}
                      value={references[field.name]}
                      onChange={handleReferenceChange}
                      placeholder={field.ph}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/5 outline-none transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Nota técnica azul */}
            <div className="flex items-start space-x-3 p-5 bg-emerald-500/5 rounded-2xl border border-emerald-200 shadow-inner">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-700 leading-relaxed font-medium italic">
                <strong>Validación HEOR:</strong> Vincular códigos internacionales permite la interoperabilidad de datos y la estimación de costes basada en evidencia real (RWE).
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !formData.label}
              className="w-full bg-linear-to-r from-emerald-600 to-emerald-900 text-white py-5 rounded-2xl font-bold hover:shadow-xl hover:shadow-emerald-500/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-3 shadow-lg shadow-emerald-200"
            >
              <Save className="w-5 h-5" />
              <span className="text-lg">{saving ? 'Guardando...' : 'Finalizar Registro Clínico'}</span>
            </button>
          </div>
        </div>

        {/* PANEL DERECHO: Grafo (Estilo Dark Glass) */}
        <div className="w-3/4 flex flex-col h-full">
          <div className="flex flex-col h-full rounded-[2.5rem] shadow-2xl border-2 border-emerald-500 overflow-hidden">
            
            {/* Header del Grafo */}
            <div className="bg-linear-to-br from-emerald-50 to-white backdrop-blur-md px-8 py-6 border-b border-emerald-500 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">Mapa Ontológico</h2>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Visualización interactiva de relaciones clínicas</p>
                </div>
              </div>

              <div className="bg-emerald-100 px-4 py-1.5 rounded-full border border-emerald-200 flex items-center space-x-2">
                <Share2 className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">En Vivo</span>
              </div>
            </div>

            {/* Área del Grafo */}
            <div className="flex-1 relative bg-emerald-100 backdrop-blur-sm">
              <div className="absolute inset-0 overflow-hidden">
                <OntologyGraph
                  diseaseData={diseaseData}
                  developmentData={developmentData}
                />
              </div>
              {/* Sombra interna para dar profundidad */}
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.15)]" />
            </div>

            {/* Legend / Footer del Grafo */}
            <div className="bg-linear-to-r from-white to-emerald-50 px-8 py-4 border-t border-emerald-500 flex justify-between items-center">
              <div className="flex space-x-8">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Nodo Principal</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 border-2 border-slate-800 rounded-full" />
                  <span className="text-[10px] font-bold text-slate-800 uppercase">Dependencias</span>
                </div>
              </div>
              <button className="flex items-center space-x-2 text-[10px] font-black text-emerald-600 hover:text-emerald-300 transition-colors uppercase tracking-widest">
                <span>Centrar Vista</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
              
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 10px;
        }
              
        .custom-scrollbar::-webkit-scrollbar-thumb {
          /* Emerald-500 con opacidad */
          background: rgba(16, 185, 129, 0.4); 
          border-radius: 10px;
        }
              
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          /* Emerald-600 (más oscuro) con más opacidad */
          background: rgba(5, 150, 105, 0.6); 
        }
      `}</style>
    </div>
  );
}

export default DiseasePage;