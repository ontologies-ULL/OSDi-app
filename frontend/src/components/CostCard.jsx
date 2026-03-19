/**
 * @file CostCard.jsx
 * @brief Expandable card component for a single intervention cost parameter.
 *
 * Renders a collapsible row showing the cost name, value, and mode in its
 * collapsed header. When expanded it shows fields for:
 * - Name, configuration mode (deterministic / stochastic).
 * - Cost value and currency (both modes).
 * - Year of reference and payment type (annual vs. one-time).
 * - Bibliographic source.
 *
 * @module components/CostCard
 */

import { useCallback } from 'react';
import { DollarSign, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import ToggleButton from './ToggleButton';
import { StochasticConfig } from './AdvancedParameterComponent';

/** @brief Current calendar year used as the default value for the year field. */
const CURRENT_YEAR = new Date().getFullYear();

/**
 * @brief Expandable card for a single intervention cost entry.
 *
 * @param {Object}   props.costData        - Current state of the cost entry.
 * @param {number}   props.index           - Position index within the costs list.
 * @param {Function} props.onUpdate        - Callback `(index, updatedCost)` called on any field change.
 * @param {Function} props.onDelete        - Callback `(index)` called when the delete button is clicked.
 * @param {boolean}  props.canDelete       - Whether the delete button should be rendered.
 * @param {boolean}  props.isExpanded      - Whether the card body is currently expanded.
 * @param {Function} props.onToggleExpand  - Callback to toggle the expanded state.
 *
 * @returns {JSX.Element} The rendered cost card.
 */
const CostCard = ({ costData, index, onUpdate, onDelete, canDelete, isExpanded, onToggleExpand }) => {
  /** 
   * @brief Memoized field change handler that normalises checkbox values. 
   */
  const handleChange = useCallback((e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    onUpdate(index, { ...costData, [e.target.name]: value });
  }, [onUpdate, index, costData]);

  /** 
   * @brief Memoized delete handler that stops event propagation to avoid toggling the card. 
   */
  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(index);
  }, [onDelete, index]);

  return (
    <div className="bg-slate-50 backdrop-blur-sm rounded-2xl border-2 border-slate-200 overflow-hidden transition-all hover:border-slate-300 hover:shadow-md">
      {/* Collapsible header */}
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

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-6 pt-4 space-y-4 border-t border-slate-100 bg-white/40">
          {/* Name */}
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

          {/* Mode toggle */}
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

          {/* Deterministic fields */}
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

          {/* Stochastic fields */}
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

          {/* Shared fields: year and payment type */}
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

          {/* Source */}
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
