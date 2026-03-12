import { useCallback } from 'react';
import { DollarSign, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import ToggleButton from './ToggleButton';
import { StochasticConfig } from './AdvancedParameterComponent';

const CURRENT_YEAR = new Date().getFullYear();

const CostCard = ({ costData, index, onUpdate, onDelete, canDelete, isExpanded, onToggleExpand }) => {
  const handleChange = useCallback((e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    onUpdate(index, { ...costData, [e.target.name]: value });
  }, [onUpdate, index, costData]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(index);
  }, [onDelete, index]);

  return (
    <div className="bg-slate-50 backdrop-blur-sm rounded-2xl border-2 border-slate-200 overflow-hidden transition-all hover:border-slate-300 hover:shadow-md">
      {/* Header colapsable */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer bg-linear-to-r from-slate-200/50 to-white"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3 flex-1">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-slate-600" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-600" />
          )}
          <div className="p-2 bg-slate-100 rounded-lg">
            <DollarSign className="w-4 h-4 text-slate-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-800">
              {costData.name || `Coste ${index + 1}`}
            </h3>
            <p className="text-xs text-slate-500">
              {costData.value ? `${costData.value} €` : 'Sin definir'} • {costData.parameterType === 'Stochastic' ? 'Estocástico' : 'Determinístico'}
            </p>
          </div>
        </div>
        {canDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
          >
            <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
          </button>
        )}
      </div>

      {/* Contenido colapsable */}
      {isExpanded && (
        <div className="p-6 pt-4 space-y-4 border-t border-slate-100 bg-white/40">
          {/* Nombre identificativo */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre del Coste</label>
            <input
              type="text"
              name="name"
              value={costData.name || ''}
              onChange={handleChange}
              placeholder="ej: Coste medicamento, Coste hospitalización..."
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
            />
          </div>

          {/* TOGGLE: Simple vs Avanzado */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Modo de Configuración</label>
            <ToggleButton
              value={costData.parameterType === 'Stochastic'}
              onChange={(e) => handleChange({
                target: { name: 'parameterType', value: e.target.value ? 'Stochastic' : 'Deterministic' }
              })}
              option1="Simple (Determinístico)"
              option2="Avanzado (Estocástico)"
              name="parameterType"
            />
          </div>

          {/* Campos específicos por modo */}
          {costData.parameterType === 'Deterministic' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Coste</label>
                <input
                  type="number"
                  step="0.01"
                  name="value"
                  value={costData.value || ''}
                  onChange={handleChange}
                  placeholder="150.50"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Moneda</label>
                <select
                  name="currency"
                  value={costData.currency || 'Currency_Euro'}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                >
                  <option value="Currency_Euro">Euro (€)</option>
                  <option value="Currency_Dollar">Dólar ($)</option>
                  <option value="Currency_Pound">Libra (£)</option>
                </select>
              </div>
            </div>
          )}

          {costData.parameterType === 'Stochastic' && (
            <>
              <StochasticConfig data={costData} onChange={handleChange} />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valor Esperado</label>
                  <input
                    type="number"
                    step="0.01"
                    name="value"
                    value={costData.value || ''}
                    onChange={handleChange}
                    placeholder="150.50"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Moneda</label>
                  <select
                    name="currency"
                    value={costData.currency || 'Currency_Euro'}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                  >
                    <option value="Currency_Euro">Euro (€)</option>
                    <option value="Currency_Dollar">Dólar ($)</option>
                    <option value="Currency_Pound">Libra (£)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Campos compartidos entre ambos modos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Año</label>
              <input
                type="number"
                name="year"
                value={costData.year || CURRENT_YEAR}
                onChange={handleChange}
                placeholder="2024"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tipo de Pago</label>
              <ToggleButton
                value={costData.appliesOneTime || false}
                onChange={handleChange}
                option1="Pago anual"
                option2="Pago único"
                name="appliesOneTime"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fuente</label>
            <input
              type="text"
              name="source"
              value={costData.source || ''}
              onChange={handleChange}
              placeholder="ej: Base de datos de costes SNS 2024"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CostCard;
