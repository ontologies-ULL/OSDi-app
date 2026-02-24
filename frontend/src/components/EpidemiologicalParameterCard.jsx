import { memo } from 'react';
import { Hospital } from 'lucide-react';
import ToggleButton from './ToggleButton';
import { StochasticConfig } from './AdvancedParameterComponent';

const EpidemiologicalParameterCard = memo(function EpidemiologicalParameterCard({
  title,
  data,
  onChange,
  valuePlaceholder,
  valueStep = '0.0001',
}) {
  return (
    <div className="bg-white/60 rounded-3xl border border-slate-300 p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <Hospital className="w-4 h-4 text-emerald-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Modo de Configuración</label>
          <ToggleButton
            value={data.isStochastic}
            onChange={onChange}
            option1="Simple (Determinístico)"
            option2="Avanzado (Estocástico)"
            name="isStochastic"
            color="emerald"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
            {data.isStochastic ? 'Valor Esperado' : title}
          </label>
          <input
            type="number"
            step={valueStep}
            name="value"
            value={data.value}
            onChange={onChange}
            placeholder={valuePlaceholder}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
          />
        </div>

        {data.isStochastic && (
          <StochasticConfig
            data={data}
            onChange={onChange}
            color="emerald"
          />
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fuente</label>
          <input
            type="text"
            name="source"
            value={data.source}
            onChange={onChange}
            placeholder="ej: WHO 2023"
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
          />
        </div>
      </div>
    </div>
  );
});

export default EpidemiologicalParameterCard;
