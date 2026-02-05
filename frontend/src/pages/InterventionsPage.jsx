import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Pill, Book, ShieldCheck, Table as TableIcon, Activity, TrendingDown } from 'lucide-react';

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

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleDetailsChange = (e) => setInterventionDetails({ ...interventionDetails, [e.target.name]: e.target.value });
  const handleOutcomesChange = (e) => setOutcomes({ ...outcomes, [e.target.name]: e.target.value });
  const handleEconomicChange = (e) => setEconomicData({ ...economicData, [e.target.name]: e.target.value });

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Error al guardar la intervención');
      }
    } catch (err) {
      setError('Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  const tableData = [
    { category: 'General', property: 'Nombre', value: formData.label || '-' },
    { category: 'Técnico', property: 'Tipo', value: interventionDetails.hasInterventionType || '-' },
    { category: 'Técnico', property: 'Dosis', value: interventionDetails.hasDosage || '-' },
    { category: 'Clínico', property: 'Eficacia', value: outcomes.hasEfficacy || '-' },
    { category: 'Clínico', property: 'Seguridad', value: outcomes.hasSafetyProfile || '-' },
    { category: 'Economía', property: 'C-Efectividad', value: economicData.hasCostEffectiveness || '-' },
    { category: 'Economía', property: 'Reembolso', value: economicData.hasReimbursementStatus || '-' },
  ];

  return (
    <div className="flex h-[calc(100vh-5.1rem)] bg-slate-200 overflow-hidden font-sans">

      {/* Mensajes Flotantes */}
      {(error || success) && (
        <div className="fixed top-24 right-8 z-50 animate-in fade-in slide-in-from-top-4">
          <div className={`flex items-center space-x-3 p-4 rounded-2xl shadow-xl border-l-4 ${error ? 'bg-white border-rose-500 text-rose-800' : 'bg-white border-rose-500 text-rose-800'
            }`}>
            {error ? <AlertCircle className="w-5 h-5 text-rose-500" /> : <CheckCircle className="w-5 h-5 text-emerald-500" />}
            <p className="text-sm font-bold">{error || 'Intervención registrada correctamente'}</p>
          </div>
        </div>
      )}

      <div className="flex w-full p-8 gap-8 overflow-hidden">

        {/* PANEL IZQUIERDO: Formulario (Paleta Rose) */}
        <div className="w-1/2 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl space-y-6 pb-12">

            <div className="bg-linear-to-br from-rose-600 via-rose-700 to-rose-900 rounded-3xl p-8 text-white">
              <div className="flex items-center space-x-3 mb-2">
                <Pill className="w-7 h-7" strokeWidth={2.5} />
                <h1 className="text-3xl font-bold">Intervenciones y sus efectos</h1>
              </div>
              <p className="text-rose-50/80 text-sm font-medium">Define los tratamientos y analiza sus resultados HEOR</p>
            </div>

            {/* Información General */}
            <div className="bg-white/60 rounded-3xl border border-slate-300 p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <Book className="w-4 h-4 text-rose-600" />                </div>
                <h2 className="text-lg font-bold text-slate-800">General</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre <strong>*</strong></label>
                  <input
                    type="text"
                    name="label"
                    value={formData.label}
                    onChange={handleInputChange}
                    placeholder="ej: Población con riesgo de enfermedad X"
                    className="w-full px-5 py-4 bg-white/80 border border-slate-300 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Descripción <strong>*</strong></label>
                  <textarea
                    name="comment"
                    value={formData.comment}
                    onChange={handleInputChange}
                    placeholder="ej: Población en España con riesgo de contraer la enfermedad X debido a factores Y y Z."
                    rows="2"
                    className="w-full px-5 py-4 bg-white/80 border border-slate-300 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all shadow-sm resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Secciones del Formulario */}
            {[
              {
                title: 'Detalles Técnicos', icon: Pill, state: interventionDetails, handler: handleDetailsChange, fields: [
                  { name: 'hasInterventionType', label: 'Tipo', ph: 'Farmacológica...' },
                  { name: 'hasDosage', label: 'Dosis', ph: '850mg' },
                  { name: 'hasFrequency', label: 'Frecuencia', ph: '2/día' },
                  { name: 'hasDuration', label: 'Duración', ph: 'Crónico' }
                ]
              },
              {
                title: 'Resultados Clínicos', icon: Activity, state: outcomes, handler: handleOutcomesChange, fields: [
                  { name: 'hasEfficacy', label: 'Eficacia', ph: 'HbA1c -1.5%' },
                  { name: 'hasSafetyProfile', label: 'Seguridad', ph: 'Favorable' },
                  { name: 'hasAdverseEvents', label: 'Efectos Adv.', ph: 'Náuseas' },
                  { name: 'hasQualityOfLife', label: 'Calidad Vida', ph: 'Mejora EQ-5D' }
                ]
              },
              {
                title: 'Análisis Económico', icon: TrendingDown, state: economicData, handler: handleEconomicChange, fields: [
                  { name: 'hasCostPerUnit', label: 'Coste Ud.', ph: '0.15€' },
                  { name: 'hasTotalCost', label: 'Coste Total', ph: '109€/año' },
                  { name: 'hasCostEffectiveness', label: 'C-Efectividad', ph: '15k/QALY' },
                  { name: 'hasReimbursementStatus', label: 'Reembolso', ph: 'SNS Financiado' }
                ]
              }
            ].map((section, idx) => (
              <div key={idx} className="bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-300 p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-rose-100 rounded-lg">
                    <section.icon className="w-4 h-4 text-rose-700" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">{section.title}</h2>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {section.fields.map(field => (
                    <div key={field.name} className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{field.label}</label>
                      <input
                        type="text"
                        name={field.name}
                        value={section.state[field.name]}
                        onChange={section.handler}
                        placeholder={field.ph}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={handleSave}
              disabled={saving || !formData.label}
              className="w-full bg-linear-to-r from-rose-600 via-rose-700 to-rose-900 text-white py-5 rounded-2xl font-bold hover:shadow-xl hover:shadow-rose-500/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-3"
            >
              <Save className="w-5 h-5" />
              <span className="text-lg">{saving ? 'Registrando...' : 'Guardar Parámetros'}</span>
            </button>
          </div>
        </div>

        {/* PANEL DERECHO: Tabla (Rose / White Style) */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] flex flex-col h-full border-2 border-rose-500 overflow-hidden">

            <div className="p-8 bg-linear-to-r from-rose-50 to-white shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-rose-600 rounded-2xl shadow-lg shadow-rose-200">
                    <TableIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Tabla de la Interveción y sus efectos</h2>
                    <p className="text-[10px] text-rose-600 font-bold uppercase tracking-widest">Vista previa de los detalles de la intervención y sus efectos asociados.</p>
                  </div>
                </div>
                <div className="bg-rose-100 px-4 py-1.5 rounded-full border border-rose-200 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-rose-700 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-widest">En vivo</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pt-6 custom-scrollbar">
              <div className="space-y-2">
                <div className="grid grid-cols-12 px-4 mb-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <div className="col-span-3">Categoría</div>
                  <div className="col-span-4">Atributo</div>
                  <div className="col-span-5">Valor</div>
                </div>

                {tableData.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 items-center bg-slate-50/50 hover:bg-white hover:shadow-md hover:scale-[1.01] transition-all duration-200 p-4 rounded-2xl border border-slate-200/50">
                    <div className="col-span-3">
                      <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-rose-100 text-rose-700">
                        {row.category}
                      </span>
                    </div>
                    <div className="col-span-4 text-sm font-bold text-slate-400 tracking-tight">
                      {row.property}
                    </div>
                    <div className={`col-span-5 text-sm font-semibold ${row.value === '-' ? 'text-slate-300 italic' : 'text-slate-800'
                      }`}>
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-8 py-4 bg-linear-to-r from-white to-rose-50 shrink-0">
              <p className="text-[10px] text-rose-600 font-medium text-center tracking-widest italic">
                Esta tabla muestra una vista previa de los campos acerca de la intervención y sus efectos.
              </p>
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
          /* Color Rose-600 con opacidad */
          background: rgba(225, 29, 72, 0.3); 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          /* Color Rose-700 con más opacidad */
          background: rgba(190, 18, 60, 0.5); 
        }
      `}</style>
    </div>
  );
}

export default InterventionsPage;