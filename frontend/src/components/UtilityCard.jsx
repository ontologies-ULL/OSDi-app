/**
 * @file UtilityCard.jsx
 * @brief Memoised expandable card component for a single utility / disutility parameter.
 *
 * Renders a collapsible row showing the utility name, value, and mode. When
 * expanded it shows:
 * - A [0, 1] range hint box.
 * - Name field.
 * - Configuration mode toggle (deterministic / stochastic).
 * - Deterministic mode: value, calculation method, utility/disutility type, application type.
 * - Stochastic mode: `StochasticConfig` panel followed by the same fields.
 * - Out-of-range warning when the value is outside [0, 1].
 * - Disutility sign reminder (value must be entered as a positive number).
 * - Bibliographic source field.
 *
 * Wrapped in `React.memo` to skip re-renders when siblings change.
 *
 * @module components/UtilityCard
 */

import { memo, useCallback } from 'react';
import { Sparkles, ChevronDown, ChevronRight, Trash2, AlertCircle } from 'lucide-react';
import ToggleButton from './ToggleButton';
import { StochasticConfig } from './AdvancedParameterComponent';

/**
 * @brief Memoised expandable card for a single utility or disutility entry.
 *
 * @param {Object}   props.utilityData      - Current state of the utility entry.
 * @param {number}   props.index            - Position index within the utilities list.
 * @param {Function} props.onUpdate         - Callback `(index, updatedUtility)` called on any field change.
 * @param {Function} props.onDelete         - Callback `(index)` called when the delete button is clicked.
 * @param {boolean}  props.canDelete        - Whether the delete button should be rendered.
 * @param {boolean}  props.isExpanded       - Whether the card body is currently expanded.
 * @param {Function} props.onToggleExpand   - Callback to toggle the expanded state.
 *
 * @returns {JSX.Element} The rendered utility card.
 */
const UtilityCard = memo(function UtilityCard({ utilityData, index, onUpdate, onDelete, canDelete, isExpanded, onToggleExpand }) {
  /** 
   * @brief Memoized field change handler that normalises checkbox values. 
   */
  const handleChange = useCallback((e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    onUpdate(index, { ...utilityData, [e.target.name]: value });
  }, [utilityData, index, onUpdate]);

  /** 
   * @brief Memoized delete handler that stops event propagation to avoid toggling the card. 
   */
  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(index);
  }, [onDelete, index]);

  /**
   * @brief Converts the boolean toggle value from `ToggleButton` into the
   * `'Stochastic'` / `'Deterministic'` string expected by the data model.
   */
  const handleParameterTypeChange = useCallback((e) => {
    handleChange({
      target: {
        name: 'parameterType',
        value: e.target.value ? 'Stochastic' : 'Deterministic'
      }
    });
  }, [handleChange]);

  /**
   * @brief True when the entered value exists but falls outside the valid [0, 1] range.
   * @type {boolean}
   */
  const isOutOfRange = utilityData.value !== '' &&
    utilityData.value !== undefined &&
    (parseFloat(utilityData.value) < 0 || parseFloat(utilityData.value) > 1);

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
            <Sparkles className="w-4 h-4 text-slate-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-800">
              {utilityData.name || `Utilidad ${index + 1}`}
            </h3>
            <p className="text-xs text-slate-500">
              {utilityData.value ? utilityData.value : 'Sin definir'}
              {utilityData.value ? (utilityData.isDisutility ? ' · Desutilidad' : ' · Utilidad') : ''}
              {' • '}
              {utilityData.parameterType === 'Stochastic' ? 'Estocástico' : 'Determinístico'}
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

          {/* Range hint box */}
          <div className="flex items-start gap-3 p-3 bg-rose-50 rounded-xl border border-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700 leading-relaxed">
              <strong>Utilidad / Desutilidad:</strong> El valor debe estar entre <strong>0</strong> y <strong>1</strong>.
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre de la Utilidad</label>
            <input
              type="text"
              name="name"
              value={utilityData.name || ''}
              onChange={handleChange}
              placeholder="ej: Utilidad estado sano, Desutilidad recaída..."
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
            />
          </div>

          {/* Mode toggle */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Modo de Configuración</label>
            <ToggleButton
              value={utilityData.parameterType === 'Stochastic'}
              onChange={handleParameterTypeChange}
              option1="Simple (Determinístico)"
              option2="Avanzado (Estocástico)"
              name="parameterType"
            />
          </div>

          {/* Deterministic fields */}
          {utilityData.parameterType === 'Deterministic' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valor</label>
                  <input
                    type="number"
                    step="0.001"
                    name="value"
                    value={utilityData.value || ''}
                    onChange={handleChange}
                    placeholder="0.85"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Método de Cálculo</label>
                  <input
                    type="text"
                    name="calculationMethod"
                    value={utilityData.calculationMethod || ''}
                    onChange={handleChange}
                    placeholder="EQ-5D"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tipo de Utilidad</label>
                  <ToggleButton
                    value={utilityData.isDisutility || false}
                    onChange={handleChange}
                    option1="Utilidad"
                    option2="Desutilidad"
                    name="isDisutility"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tipo de Aplicación</label>
                  <ToggleButton
                    value={utilityData.appliesOneTime || false}
                    onChange={handleChange}
                    option1="Recurrente"
                    option2="Única"
                    name="appliesOneTime"
                  />
                </div>
              </div>

              {isOutOfRange && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">El valor debe estar entre <strong>0</strong> y <strong>1</strong>.</p>
                </div>
              )}

              {utilityData.isDisutility && (
                <div className="flex items-start space-x-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 leading-relaxed">
                    <strong>⚠️ Importante:</strong> Introduce el valor en <strong>positivo</strong>.
                    La aplicación aplicará el signo correcto automáticamente.
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fuente</label>
                <input
                  type="text"
                  name="source"
                  value={utilityData.source || ''}
                  onChange={handleChange}
                  placeholder="ej: Estudio de calidad de vida 2023"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                />
              </div>
            </>
          )}

          {/* Stochastic fields */}
          {utilityData.parameterType === 'Stochastic' && (
            <>
              <StochasticConfig
                data={utilityData}
                onChange={handleChange}
                color="rose"
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valor Esperado</label>
                  <input
                    type="number"
                    step="0.001"
                    name="value"
                    value={utilityData.value || ''}
                    onChange={handleChange}
                    placeholder="0.85"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Método de Cálculo</label>
                  <input
                    type="text"
                    name="calculationMethod"
                    value={utilityData.calculationMethod || ''}
                    onChange={handleChange}
                    placeholder="EQ-5D"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tipo de Utilidad</label>
                  <ToggleButton
                    value={utilityData.isDisutility || false}
                    onChange={handleChange}
                    option1="Utilidad"
                    option2="Desutilidad"
                    name="isDisutility"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tipo de Aplicación</label>
                  <ToggleButton
                    value={utilityData.appliesOneTime || false}
                    onChange={handleChange}
                    option1="Recurrente"
                    option2="Única"
                    name="appliesOneTime"
                  />
                </div>
              </div>

              {isOutOfRange && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">El valor debe estar entre <strong>0</strong> y <strong>1</strong>.</p>
                </div>
              )}

              {utilityData.isDisutility && (
                <div className="flex items-start space-x-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 leading-relaxed">
                    <strong>⚠️ Importante:</strong> Introduce el valor en <strong>positivo</strong>.
                    La aplicación aplicará el signo correcto automáticamente.
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fuente</label>
                <input
                  type="text"
                  name="source"
                  value={utilityData.source || ''}
                  onChange={handleChange}
                  placeholder="ej: Estudio de calidad de vida 2023"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all"
                />
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
});

export default UtilityCard;
