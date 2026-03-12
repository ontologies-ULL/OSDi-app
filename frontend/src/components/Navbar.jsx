import { useState, useEffect, useRef, useCallback } from 'react';
import { Home, Activity, TrendingUp, AlertTriangle, X, Stethoscope, Save, Pill, ChevronDown, LogOut } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const navItems = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'disease', label: 'Enfermedad', icon: Stethoscope, hasDiseasesDropdown: true },
  { id: 'population', label: 'Población', icon: TrendingUp, hasPopulationsDropdown: true },
  { id: 'interventions', label: 'Intervenciones', icon: Pill, hasInterventionsDropdown: true }
];

function Navbar({ currentPage, onNavigate, diseaseName = null, onLogout, diseases = [], onSelectDisease, populations = [], onSelectPopulation, interventions = [], onSelectIntervention }) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showDiseasesDropdown, setShowDiseasesDropdown] = useState(false);
  const [showPopulationsDropdown, setShowPopulationsDropdown] = useState(false);
  const [showInterventionsDropdown, setShowInterventionsDropdown] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const diseasesDropdownRef = useRef(null);
  const populationsDropdownRef = useRef(null);
  const interventionsDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (diseasesDropdownRef.current && !diseasesDropdownRef.current.contains(event.target)) {
        setShowDiseasesDropdown(false);
      }
    };
    if (showDiseasesDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDiseasesDropdown]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (populationsDropdownRef.current && !populationsDropdownRef.current.contains(event.target)) {
        setShowPopulationsDropdown(false);
      }
    };
    if (showPopulationsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPopulationsDropdown]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (interventionsDropdownRef.current && !interventionsDropdownRef.current.contains(event.target)) {
        setShowInterventionsDropdown(false);
      }
    };
    if (showInterventionsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showInterventionsDropdown]);

  // Inicializar el nombre del proyecto con el nombre de la enfermedad
  useEffect(() => {
    if (diseaseName && diseaseName.trim() !== '') {
      setProjectName(diseaseName);
    }
  }, [diseaseName]);

  const handleClearOntology = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ontology/clear`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  const handleSaveProject = useCallback(async () => {
    try {
      setSaveStatus('loading');
      let filename;
      if (projectName && projectName.trim() !== '') {
        filename = projectName
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
        setShowSaveModal(false);
        // Redirigir al home inmediatamente
        onNavigate('home');
        // Limpiar el estado después de navegar
        setTimeout(() => setSaveStatus(null), 2000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  }, [projectName, onNavigate]);

  const handleNavClick = useCallback((pageId) => {
    if (pageId === 'home' && currentPage !== 'home') {
      setPendingAction(() => () => onNavigate(pageId));
      setShowConfirmModal(true);
    } else {
      onNavigate(pageId);
    }
  }, [currentPage, onNavigate]);

  const handleFinalizarSesion = useCallback(() => {
    setPendingAction('logout');
    setShowConfirmModal(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    await handleClearOntology();
    if (pendingAction === 'logout') {
      if (onLogout) onLogout();
    } else if (typeof pendingAction === 'function') {
      pendingAction();
    }
    setShowConfirmModal(false);
    setPendingAction(null);
  }, [handleClearOntology, pendingAction, onLogout]);

  const handleOpenSaveModal = useCallback(() => {
    // Si no hay nombre, usar el nombre de la enfermedad o vacío
    if (!projectName && diseaseName) {
      setProjectName(diseaseName);
    }
    setShowSaveModal(true);
  }, [projectName, diseaseName]);

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
                const diseasePages = ['disease', 'progression', 'development', 'stage'];
                const isActive = item.hasDiseasesDropdown
                  ? diseasePages.includes(currentPage)
                  : currentPage === item.id;

                // ── Enfermedades dropdown ────────────────────────────────────
                if (item.hasDiseasesDropdown) {
                  const hasItems = diseases.length > 0;
                  return (
                    <div key={item.id} className="relative" ref={diseasesDropdownRef}>
                      <button
                        onClick={(e) => {
                          if (hasItems) {
                            e.stopPropagation();
                            setShowDiseasesDropdown(!showDiseasesDropdown);
                          } else {
                            handleNavClick(item.id);
                          }
                        }}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                          ${isActive
                            ? 'bg-slate-800 text-white border border-slate-400'
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                        {hasItems && (
                          <>
                            <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">{diseases.length}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${showDiseasesDropdown ? 'rotate-180' : ''}`} />
                          </>
                        )}
                      </button>

                      {hasItems && showDiseasesDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden z-50">
                          <button
                            onClick={() => { onSelectDisease(-1); setShowDiseasesDropdown(false); }}
                            className="w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 text-slate-200 hover:bg-slate-700"
                          >
                            <Icon className="w-3.5 h-3.5 text-emerald-400" />
                            Nueva enfermedad
                          </button>
                          <div className="border-t border-slate-700 mx-3 my-1" />
                          <p className="px-4 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Guardadas</p>
                          <div className="max-h-60 overflow-y-auto">
                            {diseases.map((dis, index) => (
                              <button
                                key={index}
                                onClick={() => { onSelectDisease(index); setShowDiseasesDropdown(false); }}
                                className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-slate-700 flex items-center gap-2 group"
                              >
                                <span className="text-slate-200 font-medium truncate flex-1">{dis.diseaseData.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // ── Poblaciones dropdown ─────────────────────────────────────
                if (item.hasPopulationsDropdown) {
                  const hasItems = populations.length > 0;
                  return (
                    <div key={item.id} className="relative" ref={populationsDropdownRef}>
                      <button
                        onClick={(e) => {
                          if (hasItems) {
                            e.stopPropagation();
                            setShowPopulationsDropdown(!showPopulationsDropdown);
                          } else {
                            handleNavClick(item.id);
                          }
                        }}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                          ${currentPage === item.id
                            ? 'bg-slate-800 text-white border border-slate-400'
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                        {hasItems && (
                          <>
                            <span className="bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">{populations.length}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${showPopulationsDropdown ? 'rotate-180' : ''}`} />
                          </>
                        )}
                      </button>

                      {hasItems && showPopulationsDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden z-50">
                          {/* Nueva población */}
                          <button
                            onClick={() => {
                              onSelectPopulation(-1);
                              setShowPopulationsDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 text-slate-200 hover:bg-slate-700"
                          >
                            <Icon className="w-3.5 h-3.5 text-blue-400" />
                            Nueva población
                          </button>
                          {/* Divider + list */}
                          <div className="border-t border-slate-700 mx-3 my-1" />
                          <p className="px-4 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Guardadas</p>
                          <div className="max-h-60 overflow-y-auto">
                            {populations.map((pop, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  onSelectPopulation(index);
                                  setShowPopulationsDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-slate-700 flex items-center justify-between gap-2 group"
                              >
                                <span className="text-slate-200 font-medium truncate flex-1">{pop.formData.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // ── Intervenciones dropdown ──────────────────────────────────
                if (item.hasInterventionsDropdown) {
                  const hasItems = interventions.length > 0;
                  return (
                    <div key={item.id} className="relative" ref={interventionsDropdownRef}>
                      <button
                        onClick={(e) => {
                          if (hasItems) {
                            e.stopPropagation();
                            setShowInterventionsDropdown(!showInterventionsDropdown);
                          } else {
                            handleNavClick(item.id);
                          }
                        }}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                          ${currentPage === item.id
                            ? 'bg-slate-800 text-white border border-slate-400'
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                        {hasItems && (
                          <>
                            <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">{interventions.length}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${showInterventionsDropdown ? 'rotate-180' : ''}`} />
                          </>
                        )}
                      </button>

                      {hasItems && showInterventionsDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden z-50">
                          {/* Nueva intervención */}
                          <button
                            onClick={() => {
                              onSelectIntervention(-1);
                              setShowInterventionsDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2
                              text-slate-200 hover:bg-slate-700`}
                          >
                            <Icon className="w-3.5 h-3.5 text-rose-400" />
                            Nueva intervención
                          </button>
                          {/* Divider + list */}
                          <div className="border-t border-slate-700 mx-3 my-1" />
                          <p className="px-4 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Guardadas</p>
                          <div className="max-h-60 overflow-y-auto">
                            {interventions.map((inv, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  onSelectIntervention(index);
                                  setShowInterventionsDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-slate-700 flex items-center justify-between gap-2 group"
                              >
                                <span className="text-slate-200 font-medium truncate flex-1">{inv.formData.label}</span>
                                <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                  inv.formData.interventionType === 'TherapeuticIntervention' ? 'bg-violet-500/30 text-violet-300' :
                                  inv.formData.interventionType === 'ScreeningIntervention'   ? 'bg-blue-500/30 text-blue-300' :
                                                                                                'bg-teal-500/30 text-teal-300'
                                }`}>
                                  {inv.formData.interventionType === 'TherapeuticIntervention' ? 'Ter.' :
                                   inv.formData.interventionType === 'ScreeningIntervention'   ? 'Crib.' : 'Diag.'}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // ── Generic items (e.g. Inicio) ──────────────────────────────
                return (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => handleNavClick(item.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                        ${isActive
                          ? 'bg-slate-800 text-white border border-slate-400'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* LADO DERECHO */}
            <div className="flex-1 flex items-center justify-end space-x-4">
              {/* Botón Guardar - Estilo Integrado */}
              <button
                onClick={handleOpenSaveModal}
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

      {/* Modal de Guardar Proyecto */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-500/10 rounded-full">
                  <Save className="w-5 h-5 text-slate-200" />
                </div>
                <h3 className="text-lg font-bold text-white">Guardar Proyecto</h3>
              </div>
              <button
                onClick={() => setShowSaveModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Introduce un nombre para tu proyecto. Se guardará en formato OWL.
            </p>

            <div className="mb-6">
              <label htmlFor="projectName" className="block text-sm font-medium text-slate-300 mb-2">
                Nombre del proyecto
              </label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Ej: diabetes_tipo_2"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && projectName.trim()) {
                    handleSaveProject();
                  }
                }}
              />
              <p className="mt-2 text-xs text-slate-500">
                Los caracteres especiales y espacios se convertirán automáticamente
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProject}
                disabled={!projectName.trim() || saveStatus === 'loading'}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all
                  ${!projectName.trim() || saveStatus === 'loading'
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20'
                  }`}
              >
                {saveStatus === 'loading' ? 'Guardando...' : 'Guardar'}
              </button>
            </div>

            {saveStatus === 'error' && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/50 rounded-lg">
                <p className="text-rose-400 text-sm">
                  Error al guardar el proyecto. Inténtalo de nuevo.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

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