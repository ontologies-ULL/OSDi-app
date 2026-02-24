import { memo, useCallback } from 'react';
import { Sparkles, ChevronDown, ChevronRight, Trash2, AlertCircle } from 'lucide-react';
import ToggleButton from './ToggleButton';
import { StochasticConfig } from './AdvancedParameterComponent';

const UtilityCard = memo(function UtilityCard({ utilityData, index, onUpdate, onDelete, canDelete, isExpanded, onToggleExpand }) {
  const handleChange = useCallback((e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    onUpdate(index, { ...utilityData, [e.target.name]: value });
  }, [utilityData, index, onUpdate]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(index);
  }, [onDelete, index]);

  const handleParameterTypeChange = useCallback((e) => {
    handleChange({
      target: {
        name: 'parameterType',
        value: e.target.value ? 'Stochastic' : 'Deterministic'
      }
    });
  }, [handleChange]);

  return (
    <div className="bg-slate-50 backdrop-blur-sm rounded-2xl border-2 border-slate-200 overflow-hidden transition-all hover:border-slate-300 hover:shadow-md">

      {/* ── Header colapsable ── */}
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

      {/* ── Contenido colapsable ── */}
      {isExpanded && (
        <div className="p-6 pt-4 space-y-4 border-t border-slate-100 bg-white/40">

          {/* Nombre identificativo */}
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

          {/* TOGGLE: Simple vs Avanzado */}
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

          {/* ══════════ SIMPLE (Determinístico) ══════════ */}
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

          {/* ══════════ AVANZADO (Estocástico) ══════════ */}
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