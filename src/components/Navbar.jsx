import React, { useState, useEffect, useRef } from 'react';
import { Home, Activity, TrendingUp, AlertTriangle, X, Stethoscope, Save, Pill, ChevronDown } from 'lucide-react';

function Navbar({ currentPage, onNavigate, diseaseName = null, onLogout }) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showDiseaseDropdown, setShowDiseaseDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const API_BASE_URL = 'http://localhost:8000';

  const navItems = [
    { id: 'home', label: 'Inicio', icon: Home, color: '#6366F1' },
    { id: 'disease', label: 'Enfermedad', icon: Stethoscope, color: '#3B82F6', hasDropdown: true },
    { id: 'population', label: 'Población', icon: TrendingUp, color: '#10B981' },
    { id: 'interventions', label: 'Intervenciones', icon: Pill, color: '#EF4444' }
  ];

  const diseaseDropdownOptions = [
    { id: 'disease', label: 'Enfermedad', clickable: true },
    { id: 'progression', label: 'Progresión', clickable: false },
    { id: 'development', label: 'Desarrollo', clickable: false },
    { id: 'stage', label: 'Etapa', clickable: false }
  ];

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDiseaseDropdown(false);
      }
    };

    if (showDiseaseDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDiseaseDropdown]);

  const handleClearOntology = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ontology/clear`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();

      if (response.ok) {
        console.log('✓ Ontology cleared:', data.message);
        return true;
      } else {
        console.error('Error clearing ontology:', data);
        return false;
      }
    } catch (error) {
      console.error('Connection error:', error);
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
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_-]/g, '');
      }

      const url = filename
        ? `${API_BASE_URL}/ontology/save?format=owl&filename=${filename}`
        : `${API_BASE_URL}/ontology/save?format=owl`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✓ Proyecto guardado:', data);
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        const data = await response.json();
        console.error('Error al guardar proyecto:', data);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
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
    try {
      await handleClearOntology();
      
      if (pendingAction === 'logout') {
        if (onLogout) {
          onLogout();
        }
      } else if (typeof pendingAction === 'function') {
        pendingAction();
      }
    } catch (error) {
      console.error('Error al limpiar los datos:', error);
    } finally {
      setShowConfirmModal(false);
      setPendingAction(null);
    }
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setPendingAction(null);
  };

  const handleDiseaseButtonClick = (e) => {
    e.stopPropagation();
    setShowDiseaseDropdown(!showDiseaseDropdown);
  };

  const handleDropdownOptionClick = (option) => {
    if (option.clickable) {
      handleNavClick('disease');
      setShowDiseaseDropdown(false);
    }
  };

  return (
    <>
      <nav className="bg-linear-to-r from-slate-900 to-slate-800 border-b border-slate-700 shadow-2xl">
        <div className="w-full">
          <div className="flex items-center justify-between h-20 w-full">
            {/* 1. LADO IZQUIERDO: Logo */}
            <div className="flex-1 flex items-center justify-start">
              <div className="flex items-center space-x-3 p-8">
                <Activity className="w-8 h-8 text-emerald-400" strokeWidth={2.5} />
                <div>
                  <h1 className="text-2xl font-bold bg-linear-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent">
                    OSDI
                  </h1>
                  <p className="text-xs text-slate-100 font-medium">
                    Crea tu propio modelo de enfermedad
                  </p>
                </div>
              </div>
            </div>

            {/* 2. CENTRO: Enlaces de navegación */}
            <div className="flex items-center justify-center space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                if (item.hasDropdown) {
                  return (
                    <div
                      key={item.id}
                      className="relative"
                      ref={dropdownRef}
                    >
                      <button
                        onClick={handleDiseaseButtonClick}
                        className={`
                          flex items-center space-x-2 px-4 py-2.5 rounded-xl 
                          font-semibold text-sm transition-all duration-300
                          ${isActive
                            ? 'bg-slate-800 text-white shadow-inner border border-slate-700'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                          }
                        `}
                      >
                        <Icon className="w-4 h-4" strokeWidth={2.5} />
                        <span>{item.label}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showDiseaseDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown Menu */}
                      {showDiseaseDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden z-50">
                          {diseaseDropdownOptions.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => handleDropdownOptionClick(option)}
                              className={`
                                w-full text-left px-4 py-3 text-sm font-medium
                                transition-all duration-200
                                ${option.clickable
                                  ? 'text-slate-200 hover:bg-slate-700 hover:text-white cursor-pointer'
                                  : 'text-slate-500 cursor-not-allowed'
                                }
                              `}
                              disabled={!option.clickable}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`
                      flex items-center space-x-2 px-4 py-2.5 rounded-xl 
                      font-semibold text-sm transition-all duration-300
                      ${isActive
                        ? 'bg-slate-800 text-white shadow-inner border border-slate-700'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2.5} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 3. LADO DERECHO: Botones de acción */}
            <div className="flex-1 flex items-center justify-end space-x-3 p-8">
              {/* Botón Guardar Proyecto */}
              <button
                onClick={handleSaveProject}
                disabled={saveStatus === 'loading'}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl
                  text-sm font-semibold
                  border transition-all duration-300
                  ${saveStatus === 'loading'
                    ? 'bg-slate-700/40 text-slate-400 border-slate-600 cursor-not-allowed'
                    : saveStatus === 'success'
                      ? 'bg-emerald-500/90 text-white border-emerald-400 shadow-sm shadow-emerald-500/40'
                      : saveStatus === 'error'
                        ? 'bg-rose-500/90 text-white border-rose-400 shadow-sm shadow-rose-500/40'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/80 hover:text-white hover:shadow-emerald-500/40'
                  }
                `}
              >
                <Save className="w-4 h-4" strokeWidth={2.5} />
                <span className="hidden xl:inline">
                  {saveStatus === 'loading' ? 'Guardando...' :
                    saveStatus === 'success' ? '¡Guardado!' :
                      saveStatus === 'error' ? 'Error' : 'Guardar Proyecto'}
                </span>
                <span className="xl:hidden">Guardar</span>
              </button>

              {/* Botón Finalizar Sesión */}
              <button
                onClick={handleFinalizarSesion}
                className="flex items-center gap-2 px-4 py-2.5
                          text-rose-400 hover:text-white
                          bg-rose-500/30 hover:bg-rose-500/80
                          border border-rose-500/40
                          rounded-xl text-sm font-semibold
                          transition-all duration-300
                          shadow-sm hover:shadow-rose-500/40"
              >
                <AlertTriangle className="w-4 h-4" strokeWidth={2.5} />
                <span className="hidden xl:inline">Cerrar Sesión</span>
                <span className="xl:hidden">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
                <h3 className="text-xl font-bold text-white">Confirmar acción</h3>
              </div>
              <button
                onClick={handleCancel}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-slate-300 leading-relaxed">
                {pendingAction === 'logout' 
                  ? '¿Estás seguro de que deseas cerrar sesión? Los datos actuales no se guardarán.'
                  : '¿Estás seguro de que deseas continuar? Los datos actuales no se guardarán y volverás al inicio.'}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-700">
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl 
                          font-semibold text-sm transition-all duration-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl 
                          font-semibold text-sm transition-all duration-300 shadow-lg"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;