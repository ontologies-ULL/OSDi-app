/**
 * @file DiseaseTabs.jsx
 * @brief Tab bar for navigating between the four disease-model sub-pages.
 *
 * Renders four pill-style buttons (Disease, Progression, Development, Stage)
 * inside a green gradient container. The active tab is highlighted with a white
 * background and emerald text.
 *
 * @module components/DiseaseTabs
 */

import React from 'react';
import { Stethoscope, Activity, GitMerge, Layers } from 'lucide-react';

/**
 * @brief Static tab descriptor list.
 * @type {Array<{id: string, label: string, icon: React.ElementType}>}
 */
const TABS = [
  { id: 'disease',     label: 'Enfermedad', icon: Stethoscope },
  { id: 'progression', label: 'Progresión',  icon: Activity    },
  { id: 'development', label: 'Desarrollo',  icon: GitMerge    },
  { id: 'stage',       label: 'Etapa',       icon: Layers      },
];

/**
 * @brief Tab bar for the disease-model section (Disease / Progression / Development / Stage).
 *
 * @param {string}   props.currentPage  - Id of the currently active page (one of `'disease'`,
 *   `'progression'`, `'development'`, `'stage'`).
 * @param {Function} props.onNavigate   - Callback `(pageId: string) => void` fired when a tab is clicked.
 *
 * @returns {JSX.Element} The rendered tab bar.
 */
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
