import React, { useState, useEffect, useRef } from 'react';
import { Home, Activity, TrendingUp, AlertTriangle, X, Stethoscope, Save, Pill, ChevronDown, LogOut } from 'lucide-react';

function Navbar({ currentPage, onNavigate, diseaseName = null, onLogout }) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showDiseaseDropdown, setShowDiseaseDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const API_BASE_URL = 'http://localhost:8000';

  const navItems = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'disease', label: 'Enfermedad', icon: Stethoscope, hasDropdown: true },
    { id: 'population', label: 'Población', icon: TrendingUp },
    { id: 'interventions', label: 'Intervenciones', icon: Pill }
  ];

  const diseaseDropdownOptions = [
    { id: 'disease', label: 'Enfermedad', clickable: true },
    { id: 'progression', label: 'Progresión', clickable: false },
    { id: 'development', label: 'Desarrollo', clickable: false },
    { id: 'stage', label: 'Etapa', clickable: false }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDiseaseDropdown(false);
      }
    };
    if (showDiseaseDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDiseaseDropdown]);

  const handleClearOntology = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ontology/clear`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const handleSaveProject = async () => {
    try {
      setSaveStatus('loading');
      let filename;
      if (diseaseName && diseaseName.trim() !== '') {
        filename = diseaseName
          .trim()
          .toLowerCase()
          .normalize('NFD')                      // ✅ Descompone caracteres con tildes
          .replace(/[\u0300-\u036f]/g, '')       // ✅ Elimina los diacríticos (tildes)
          .replace(/\s+/g, '_')                  // Espacios → guiones bajos
          .replace(/[^a-z0-9_-]/g, '');          // Elimina otros caracteres especiales
      }
      const url = filename
        ? `${API_BASE_URL}/ontology/save?format=owl&filename=${filename}`
        : `${API_BASE_URL}/ontology/save?format=owl`;

      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });

      if (response.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleNavClick = (pageId) => {
    if (pageId === 'home' && currentPage !== 'home') {
      setPendingAction(() => () => onNavigate(pageId));
      setShowConfirmModal(true);
    } else {
      onNavigate(pageId);
    }
  };

  const handleFinalizarSesion = () => {
    setPendingAction('logout');
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    await handleClearOntology();
    if (pendingAction === 'logout') {
      if (onLogout) onLogout();
    } else if (typeof pendingAction === 'function') {
      pendingAction();
    }
    setShowConfirmModal(false);
    setPendingAction(null);
  };

  return (
    <>
      <nav className="bg-slate-800 border-b border-slate-800 shadow-xl">
        <div className="w-full px-6">
          <div className="flex items-center justify-between h-20">
            {/* LADO IZQUIERDO */}
            <div className="flex-1 flex items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-500/10 rounded-lg">
                  <Activity className="w-6 h-6 text-slate-400" strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">OSDI app</h1>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Creación de Modelos de Evaluación de Tecnologías Sanitarias</p>
                </div>
              </div>
            </div>

            {/* CENTRO */}
            <div className="flex items-center justify-center space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;

                return (
                  <div key={item.id} className="relative" ref={item.hasDropdown ? dropdownRef : null}>
                    <button
                      onClick={item.hasDropdown ? (e) => { e.stopPropagation(); setShowDiseaseDropdown(!showDiseaseDropdown); } : () => handleNavClick(item.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                        ${isActive
                          ? 'bg-slate-800 text-white border border-slate-700'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {item.hasDropdown && <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showDiseaseDropdown ? 'rotate-180' : ''}`} />}
                    </button>

                    {item.hasDropdown && showDiseaseDropdown && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden z-50">
                        {diseaseDropdownOptions.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => { if (option.clickable) { handleNavClick('disease'); setShowDiseaseDropdown(false); } }}
                            className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors
                              ${option.clickable ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-600 cursor-not-allowed'}`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* LADO DERECHO */}
            <div className="flex-1 flex items-center justify-end space-x-4">
              {/* Botón Guardar - Estilo Integrado */}
              <button
                onClick={handleSaveProject}
                disabled={saveStatus === 'loading'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all
                  ${saveStatus === 'success'
                    ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-700/50 hover:border-slate-600 active:scale-95'}
                `}
              >
                <Save className={`w-4 h-4 ${saveStatus === 'loading' ? 'animate-pulse' : ''}`} />
                <span>{saveStatus === 'loading' ? 'Procesando...' : saveStatus === 'success' ? 'Guardado' : 'Guardar Proyecto'}</span>
              </button>

              {/* Botón Cerrar Sesión - Disimulado */}
              <button
                onClick={handleFinalizarSesion}
                className="flex items-center gap-2 px-3 py-2 border border-slate-700 text-slate-300 hover:text-rose-400 hover:bg-rose-500/5 hover:border-rose-500/50 rounded-lg text-sm font-medium transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full mx-4 border border-slate-800 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-rose-500/10 rounded-full">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold text-white">¿Estás seguro?</h3>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Los cambios que no hayas guardado se perderán permanentemente al realizar esta acción.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => { setShowConfirmModal(false); setPendingAction(null); }}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold text-sm transition-colors"
              >
                Volver
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-sm transition-colors shadow-lg shadow-rose-900/20"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;