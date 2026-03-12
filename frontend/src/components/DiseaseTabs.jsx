import React from 'react';
import { Stethoscope, Activity, GitMerge, Layers } from 'lucide-react';

const TABS = [
  { id: 'disease',     label: 'Enfermedad', icon: Stethoscope },
  { id: 'progression', label: 'Progresión',  icon: Activity    },
  { id: 'development', label: 'Desarrollo',  icon: GitMerge    },
  { id: 'stage',       label: 'Etapa',       icon: Layers      },
];

function DiseaseTabs({ currentPage, onNavigate }) {
  return (
    <div className="flex gap-1 p-1 bg-linear-to-br from-emerald-500 to-emerald-900 rounded-xl mt-4">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-bold transition-all ${
            currentPage === id
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-white/95 hover:text-white hover:bg-white/10'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

export default DiseaseTabs;
