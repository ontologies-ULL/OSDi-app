/**
 * @file EpidemiologicalParameterCard.jsx
 * @brief Memoised card component for a single epidemiological parameter
 * (e.g. incidence, prevalence, or mortality rate).
 *
 * Renders a section card containing:
 * - A mode toggle (deterministic / stochastic).
 * - A numeric value input (deterministic mode) or `StochasticConfig` panel
 *   followed by an expected-value input (stochastic mode).
 * - A bibliographic source input shared by both modes.
 *
 * The component is wrapped in `React.memo` to avoid unnecessary re-renders
 * when sibling state changes.
 *
 * @module components/EpidemiologicalParameterCard
 */

import { memo } from 'react';
import { Hospital } from 'lucide-react';
import ToggleButton from './ToggleButton';
import { StochasticConfig } from './AdvancedParameterComponent';

/**
 * @brief Memoised card for a single epidemiological parameter form.
 *
 * @param {string}   props.title             - Section title and value-field label.
 * @param {Object}   props.data              - Current parameter state (from `useEpiParameter`).
 * @param {Function} props.onChange          - Generic change handler forwarded to all inputs.
 * @param {string}   props.valuePlaceholder  - Placeholder text for the numeric value input.
 * @param {string}   [props.valueStep='0.0001'] - `step` attribute for the numeric value input.
 * @param {string}   [props.color='blue']    - Accent colour theme for focus rings and the icon badge.
 *   Accepts `'blue'` or `'emerald'`.
 *
 * @returns {JSX.Element} The rendered epidemiological parameter card.
 */
const EpidemiologicalParameterCard = memo(function EpidemiologicalParameterCard({
  title,
  data,
  onChange,
  valuePlaceholder,
  valueStep = '0.0001',
  color = 'blue',
}) {
  /** 
   * @brief Tailwind focus-ring classes derived from `color`. 
   */
  const focusColor  = color === 'blue' ? 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10' : 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10';
  /** 
   * @brief Tailwind icon badge classes derived from `color`. 
   */
  const iconColor   = color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600';

  return (
    <div className="bg-white/60 rounded-3xl border border-slate-300 p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <div className={`p-2 rounded-lg ${iconColor}`}>
          <Hospital className="w-4 h-4" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      </div>

      <div className="space-y-4">
        {/* Mode toggle */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Modo de Configuración</label>
          <ToggleButton
            value={data.isStochastic}
            onChange={onChange}
            option1="Simple (Determinístico)"
            option2="Avanzado (Estocástico)"
            name="isStochastic"
            color={color}
          />
        </div>

        {/* Deterministic: single value input */}
        {!data.isStochastic && (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{title}</label>
            <input
              type="number"
              step={valueStep}
              name="value"
              value={data.value}
              onChange={onChange}
              placeholder={valuePlaceholder}
              className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all ${focusColor}`}
            />
          </div>
        )}

        {/* Stochastic: distribution config panel */}
        {data.isStochastic && (
          <StochasticConfig
            data={data}
            onChange={onChange}
            color={color}
          />
        )}

        {/* Stochastic: expected value input */}
        {data.isStochastic && (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valor Esperado</label>
            <input
              type="number"
              step={valueStep}
              name="value"
              value={data.value}
              onChange={onChange}
              placeholder={valuePlaceholder}
              className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all ${focusColor}`}
            />
          </div>
        )}

        {/* Source (both modes) */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fuente</label>
          <input
            type="text"
            name="source"
            value={data.source}
            onChange={onChange}
            placeholder="ej: WHO 2023"
            className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all ${focusColor}`}
          />
        </div>
      </div>
    </div>
  );
});

export default EpidemiologicalParameterCard;
