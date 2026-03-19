/**
 * @file DetectionParameterCard.jsx
 * @brief Expandable card component for a single diagnostic detection parameter
 * (sensitivity or specificity).
 *
 * Renders a collapsible row with the parameter name, value, and mode. When
 * expanded it shows:
 * - A contextual hint box describing the parameter.
 * - An optional identifying name.
 * - Configuration mode toggle (deterministic / stochastic).
 * - Stochastic distribution config (when stochastic) with a Beta-distribution hint.
 * - Value field (must be in [0, 1]) and bibliographic source.
 * - An out-of-range warning when the entered value falls outside [0, 1].
 *
 * @module components/DetectionParameterCard
 */

import { useCallback } from 'react';
import { ShieldCheck, Target, ChevronDown, ChevronRight, Trash2, AlertCircle } from 'lucide-react';
import ToggleButton from './ToggleButton';
import { StochasticConfig } from './AdvancedParameterComponent';

/**
 * @brief Shared accent colour tokens for both sensitivity and specificity cards.
 * @type {Object}
 */
const ACCENT = {
  color: 'rose',
  accentBg: 'bg-rose-100',
  accentText: 'text-rose-700',
  accentBorder: 'border-rose-200',
  accentFocus: 'focus:border-rose-500 focus:ring-rose-500/5',
};

/**
 * @brief Display configuration keyed by detection parameter type.
 *
 * @type {Object.<string, {label: string, icon: React.ElementType, placeholder: string, hint: string}>}
 */
const TYPE_CONFIG = {
  sensitivity: {
    label: 'Sensibilidad',
    icon: ShieldCheck,
    placeholder: '0.95',
    hint: 'Proporción de verdaderos positivos correctamente identificados.',
  },
  specificity: {
    label: 'Especificidad',
    icon: Target,
    placeholder: '0.98',
    hint: 'Proporción de verdaderos negativos correctamente identificados.',
  },
};

/**
 * @brief Expandable card for a single sensitivity or specificity parameter.
 *
 * @param {string}   [props.type='sensitivity'] - Parameter type: `'sensitivity'` or `'specificity'`.
 * @param {Object}   props.paramData            - Current state of the detection parameter entry.
 * @param {number}   props.index                - Position index within the parameter list.
 * @param {Function} props.onUpdate             - Callback `(index, updatedParam)` called on any field change.
 * @param {Function} props.onDelete             - Callback `(index)` called when the delete button is clicked.
 * @param {boolean}  props.canDelete            - Whether the delete button should be rendered.
 * @param {boolean}  props.isExpanded           - Whether the card body is currently expanded.
 * @param {Function} props.onToggleExpand       - Callback to toggle the expanded state.
 *
 * @returns {JSX.Element} The rendered detection parameter card.
 */
const DetectionParameterCard = ({
  type = 'sensitivity',
  paramData,
  index,
  onUpdate,
  onDelete,
  canDelete,
  isExpanded,
  onToggleExpand,
}) => {
  const config = { ...ACCENT, ...TYPE_CONFIG[type] };
  const Icon = config.icon;

  /** 
   * @brief Memoized field change handler that normalises checkbox values. 
   */
  const handleChange = useCallback((e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    onUpdate(index, { ...paramData, [e.target.name]: value });
  }, [onUpdate, index, paramData]);

  /** 
   * @brief Memoized delete handler that stops event propagation to avoid toggling the card. */
  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(index);
  }, [onDelete, index]);

  const isStochastic = paramData.parameterType === 'Stochastic';

  /**
   * @brief True when the entered value exists but falls outside the valid [0, 1] range.
   * @type {boolean}
   */
  const isOutOfRange = paramData.value !== '' &&
    paramData.value !== undefined &&
    (parseFloat(paramData.value) < 0 || parseFloat(paramData.value) > 1);

  return (
    <div className="bg-slate-50 backdrop-blur-sm rounded-2xl border-2 border-slate-200 overflow-hidden transition-all hover:border-slate-300 hover:shadow-md">

      {/* Collapsible header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer bg-linear-to-r from-slate-200/50 to-white"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3 flex-1">
          {isExpanded
            ? <ChevronDown className="w-5 h-5 text-slate-600" />
            : <ChevronRight className="w-5 h-5 text-slate-600" />
          }
          <div className="p-2 bg-slate-100 rounded-lg">
            <Icon className="w-4 h-4 text-slate-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-800">
              {paramData.name || `${config.label} ${index + 1}`}
            </h3>
            <p className="text-xs text-slate-500">
              {paramData.value ? `${paramData.value} (0–1)` : 'Sin definir'} • {isStochastic ? 'Estocástico' : 'Determinístico'}
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

          {/* Hint box */}
          <div className={`flex items-start gap-3 p-3 ${config.accentBg} rounded-xl border ${config.accentBorder}`}>
            <AlertCircle className={`w-4 h-4 ${config.accentText} shrink-0 mt-0.5`} />
            <p className={`text-xs ${config.accentText} leading-relaxed`}>
              <strong>{config.label}:</strong> {config.hint} Valor entre 0 y 1.
            </p>
          </div>

          {/* Optional name */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
              Nombre identificativo (opcional)
            </label>
            <input
              type="text"
              name="name"
              value={paramData.name || ''}
              onChange={handleChange}
              placeholder={`ej: ${config.label} prueba X...`}
              className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm ${config.accentFocus} outline-none transition-all`}
            />
          </div>

          {/* Mode toggle */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Modo de Configuración</label>
            <ToggleButton
              value={isStochastic}
              onChange={(e) => handleChange({
                target: { name: 'parameterType', value: e.target.value ? 'Stochastic' : 'Deterministic' }
              })}
              option1="Simple (Determinístico)"
              option2="Avanzado (Estocástico)"
              name="parameterType"
            />
          </div>

          {/* Stochastic distribution config + Beta recommendation */}
          {isStochastic && (
            <>
              <StochasticConfig
                data={paramData}
                onChange={handleChange}
                color={config.color}
              />
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <p className="text-xs text-rose-800">
                  <strong>💡 Recomendación:</strong> Para parámetros de detección entre 0 y 1, la distribución{' '}
                  <strong>Beta</strong> es la más adecuada ya que está naturalmente acotada en ese intervalo.
                </p>
              </div>
            </>
          )}

          {/* Value + Source */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                {isStochastic ? 'Valor Esperado (0–1)' : 'Valor (0–1)'}
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                max="1"
                name="value"
                value={paramData.value || ''}
                onChange={handleChange}
                placeholder={config.placeholder}
                className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm ${config.accentFocus} outline-none transition-all`}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fuente</label>
              <input
                type="text"
                name="source"
                value={paramData.source || ''}
                onChange={handleChange}
                placeholder="ej: Estudio validación 2023"
                className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm ${config.accentFocus} outline-none transition-all`}
              />
            </div>
          </div>

          {/* Out-of-range warning */}
          {isOutOfRange && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                El valor debe estar entre <strong>0</strong> y <strong>1</strong>.
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default DetectionParameterCard;
