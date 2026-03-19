/**
 * @file EffectCard.jsx
 * @brief Expandable card component for a single intervention effect (ModifierParameter).
 *
 * Renders a collapsible row showing the effect name, value, and mode in its
 * collapsed header. When expanded, it shows fields for:
 * - Name, configuration mode (deterministic / stochastic), expected value, OSDi type.
 * - Distribution parameters (when stochastic).
 * - Free-text description.
 * - Target progression element picker — a checkbox list built from `progressionElements`
 *   when available, or a manual text-input fallback otherwise.
 *
 * @module components/EffectCard
 */

import React, { useCallback } from 'react';
import { ChevronDown, ChevronRight, Zap, Trash2, Plus } from 'lucide-react';
import ToggleButton from './ToggleButton';
import { StochasticConfig } from './AdvancedParameterComponent';

/**
 * @brief Expandable card for a single intervention effect (ModifierParameter).
 *
 * @param {Object}   props.effectData          - Current state of the effect entry.
 * @param {number}   props.index               - Position index within the effects list.
 * @param {Function} props.onUpdate            - Callback `(index, updatedEffect)` called on any field change.
 * @param {Function} props.onDelete            - Callback `(index)` called when the delete button is clicked.
 * @param {boolean}  props.canDelete           - Whether the delete button should be rendered.
 * @param {boolean}  props.isExpanded          - Whether the card body is currently expanded.
 * @param {Function} props.onToggleExpand      - Callback to toggle the expanded state.
 * @param {Array}    props.progressionElements - Array of `{label, type}` objects used to populate the target picker.
 *
 * @returns {JSX.Element} The rendered effect card.
 */
function EffectCard({ effectData, index, onUpdate, onDelete, canDelete, isExpanded, onToggleExpand, progressionElements = [] }) {
  /** 
   * @brief Memoized field change handler that normalises checkbox values. 
   */
  const handleChange = useCallback((e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    onUpdate(index, { ...effectData, [e.target.name]: value });
  }, [onUpdate, index, effectData]);

  /** 
   * @brief Memoized delete handler that stops event propagation to avoid toggling the card. 
   */
  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(index);
  }, [onDelete, index]);

  /**
   * @brief Toggles a progression element label in the `modifiesTargets` array.
   * @param {string} label - Label of the progression element to toggle.
   */
  const toggleTarget = (label) => {
    const targets = effectData.modifiesTargets || [];
    const next = targets.includes(label)
      ? targets.filter(x => x !== label)
      : [...targets, label];
    onUpdate(index, { ...effectData, modifiesTargets: next });
  };

  /**
   * @brief Adds the value from `_modifiesInput` to `modifiesTargets` if not already present.
   * Clears the input field after the addition.
   */
  const addManualTarget = () => {
    const val = effectData._modifiesInput?.trim();
    if (!val || (effectData.modifiesTargets || []).includes(val)) {
      onUpdate(index, { ...effectData, _modifiesInput: '' });
      return;
    }
    onUpdate(index, { ...effectData, modifiesTargets: [...(effectData.modifiesTargets || []), val], _modifiesInput: '' });
  };

  /**
   * @brief Removes a specific target label from `modifiesTargets`.
   * @param {string} t - Label to remove.
   */
  const removeTarget = (t) => {
    onUpdate(index, { ...effectData, modifiesTargets: effectData.modifiesTargets.filter(x => x !== t) });
  };

  /** 
   * @brief Submits the manual target input when the Enter key is pressed. 
   */
  const handleKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); addManualTarget(); } };

  const isStochastic = effectData.parameterType === 'Stochastic';

  return (
    <div className="bg-slate-50 backdrop-blur-sm rounded-2xl border-2 border-slate-200 overflow-hidden transition-all hover:border-slate-300 hover:shadow-md">
      {/* Collapsed header */}
      <div className="flex items-center justify-between p-4 cursor-pointer bg-linear-to-r from-slate-200/50 to-white" onClick={onToggleExpand}>
        <div className="flex items-center gap-3 flex-1">
          {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-600" /> : <ChevronRight className="w-5 h-5 text-slate-600" />}
          <div className="p-2 bg-slate-100 rounded-lg">
            <Zap className="w-4 h-4 text-slate-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-800">{effectData.name || `Efecto ${index + 1}`}</h3>
            <p className="text-xs text-slate-500">
              {effectData.value ? effectData.value : 'Sin definir'} • {isStochastic ? 'Estocástico' : 'Determinístico'}
              {effectData.modifiesTargets?.length > 0 && ` • modifica ${effectData.modifiesTargets.length} parámetro${effectData.modifiesTargets.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        {canDelete && (
          <button type="button" onClick={handleDelete} className="p-2 hover:bg-slate-100 rounded-lg transition-colors group">
            <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
          </button>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-6 pt-4 space-y-4 border-t border-slate-100 bg-white/40">

          {/* Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre del Efecto</label>
            <input type="text" name="name" value={effectData.name} onChange={handleChange}
              placeholder="ej: Reducción de mortalidad a 5 años"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all" />
          </div>

          {/* Mode toggle */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Modo de Configuración</label>
            <ToggleButton
              value={isStochastic}
              onChange={(e) => handleChange({ target: { name: 'parameterType', value: e.target.value ? 'Stochastic' : 'Deterministic' } })}
              option1="Simple (Determinístico)" option2="Avanzado (Estocástico)" name="parameterType" />
          </div>

          {/* Deterministic fields */}
          {!isStochastic && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valor Esperado</label>
                <input type="number" step="0.0001" name="value" value={effectData.value} onChange={handleChange}
                  placeholder="0.0"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tipo OSDi</label>
                <select name="effectType" value={effectData.effectType} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all">
                  <option value="DI_Continuous_Variable">Variable Continua</option>
                  <option value="DI_Probability">Probabilidad</option>
                  <option value="DI_RelativeRisk">Riesgo Relativo</option>
                  <option value="DI_MeanDifference">Diferencia de Medias</option>
                  <option value="DI_Factor">Factor</option>
                </select>
              </div>
            </div>
          )}

          {/* Stochastic fields */}
          {isStochastic && (
            <>
              <StochasticConfig data={effectData} onChange={handleChange} />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valor Esperado</label>
                  <input type="number" step="0.0001" name="value" value={effectData.value} onChange={handleChange}
                    placeholder="0.0"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tipo OSDi</label>
                  <select name="effectType" value={effectData.effectType} onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all">
                    <option value="DI_Continuous_Variable">Variable Continua</option>
                    <option value="DI_Probability">Probabilidad</option>
                    <option value="DI_RelativeRisk">Riesgo Relativo</option>
                    <option value="DI_MeanDifference">Diferencia de Medias</option>
                    <option value="DI_Factor">Factor</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Descripción</label>
            <textarea name="description" value={effectData.description} onChange={handleChange}
              placeholder="ej: Reduce a 0 la probabilidad de manifestaciones agudas" rows="2"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all resize-none" />
          </div>

          {/* Modifies targets */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Manifestaciones que modifica</label>

            {/* Picker from progression elements — shown when elements exist */}
            {progressionElements.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {progressionElements.map(({ label, type }) => {
                    const selected = (effectData.modifiesTargets || []).includes(label);
                    const typeColor = {
                      AcuteManifestation:   'bg-orange-100 text-orange-700',
                      ChronicManifestation: 'bg-blue-100 text-blue-700',
                      Development:          'bg-indigo-100 text-indigo-700',
                      Stage:                'bg-violet-100 text-violet-700',
                    }[type] || 'bg-slate-100 text-slate-600';
                    return (
                      <button key={label} type="button" onClick={() => toggleTarget(label)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all text-left border ${
                          selected
                            ? 'bg-rose-50 border-rose-400 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}>
                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                          selected ? 'bg-rose-500 border-rose-500' : 'border-slate-300'
                        }`}>
                          {selected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <span className={`flex-1 font-medium truncate ${selected ? 'text-rose-800' : 'text-slate-700'}`}>{label}</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${typeColor}`}>{type.replace('Manifestation', '')}</span>
                      </button>
                    );
                  })}
                </div>
                {effectData.modifiesTargets?.length > 0 && (
                  <p className="text-[10px] text-rose-600 font-bold ml-1">
                    {effectData.modifiesTargets.length} seleccionada{effectData.modifiesTargets.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            ) : (
              /* Manual text-input fallback — shown when no progression elements exist */
              <>
                <div className="flex gap-2">
                  <input type="text" name="_modifiesInput" value={effectData._modifiesInput} onChange={handleChange} onKeyDown={handleKeyDown}
                    placeholder="ej: Pérdida de visibilidad"
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/5 outline-none transition-all" />
                  <button type="button" onClick={addManualTarget}
                    className="px-3 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 ml-1">Crea manifestaciones en la página de Progresión para poder seleccionarlas aquí.</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EffectCard;
