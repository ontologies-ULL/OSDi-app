import React from 'react';

const ToggleButton = ({ value, onChange, option1, option2, name, color = 'rose' }) => {
  const colorClasses = {
    rose: 'text-rose-700',
    blue: 'text-blue-700',
    purple: 'text-purple-700',
    emerald: 'text-emerald-700'
  };

  const activeColorClass = colorClasses[color] || colorClasses.rose;

  return (
    <div className="flex bg-slate-100 rounded-xl p-1 w-full border border-slate-300">
      <button
        type="button"
        onClick={() => onChange({ target: { name, value: false } })}
        className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${!value
            ? `bg-white ${activeColorClass} shadow-md`
            : 'text-slate-500 hover:text-slate-700'
          }`}
      >
        {option1}
      </button>
      <button
        type="button"
        onClick={() => onChange({ target: { name, value: true } })}
        className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${value
            ? `bg-white ${activeColorClass} shadow-md`
            : 'text-slate-500 hover:text-slate-700'
          }`}
      >
        {option2}
      </button>
    </div>
  );
};

export default ToggleButton;