import React, { useState } from 'react';
import { Home, Activity, TrendingUp, AlertTriangle, X, Stethoscope } from 'lucide-react';

function Navbar({ currentPage, onNavigate }) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const API_BASE_URL = 'http://localhost:8000';

  const navItems = [
    { id: 'home', label: 'Inicio', icon: Home, color: '#6366F1' },
    { id: 'disease', label: 'Enfermedad', icon: Stethoscope, color: '#3B82F6' },
    { id: 'development', label: 'Desarrollo', icon: TrendingUp, color: '#10B981' }
  ];

  const handleClearOntology = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ontology/clear`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
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

  const handleNavClick = (pageId) => {
    // Si es home y no estamos ya en home, mostrar confirmación
    if (pageId === 'home' && currentPage !== 'home') {
      setPendingAction(() => () => onNavigate(pageId));
      setShowConfirmModal(true);
    } else {
      onNavigate(pageId);
    }
  };

  const handleFinalizarSesion = () => {
    setPendingAction(() => () => onNavigate('home'));
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    try {
      // Llamar al clear de la API
      await handleClearOntology();
      
      // Ejecutar la acción pendiente (navegar al home)
      if (pendingAction) {
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

  return (
    <>
      <nav className="bg-slate-900 border-b border-slate-800 shadow-xl sticky top-0 z-50">
        <div className="max-w-full mx-auto px-6">
          <div className="flex items-center justify-between h-18 py-3">

            {/* Logo/Title */}
            <div className="flex items-center space-x-2">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-none">
                  OSDI
                </h1>
                <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-tighter mt-1">
                  Crea tu propio modelo de enfermedad
                </p>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex items-center space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`
                      flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-sm
                      transition-all duration-300
                      ${isActive
                        ? 'bg-slate-800 text-white shadow-inner border border-slate-700'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }
                    `}
                  >
                    <Icon
                      className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Botón Finalizar Sesión */}
            <div className="flex items-center space-x-4 border-l border-slate-800 ml-4 pl-4">
              <button 
                onClick={handleFinalizarSesion}
                className="flex items-center space-x-2 px-4 py-2 bg-rose-500/20 text-rose-400 text-sm font-bold rounded-xl hover:bg-rose-500/30 transition-colors border border-rose-500/20 cursor-pointer"
              >
                <span>Finalizar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-100 animate-in fade-in duration-200">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-slate-700 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Confirmar acción
                </h3>
              </div>
              <button
                onClick={handleCancel}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5 cursor-pointer" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-slate-300 text-base leading-relaxed">
                ¿Estás seguro de que deseas continuar? Los datos actuales no se guardarán y volverás al inicio.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 bg-slate-900/50 rounded-b-2xl">
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-rose-500 text-white hover:bg-rose-500/60 transition-all shadow-lg shadow-rose-500/20 cursor-pointer"
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