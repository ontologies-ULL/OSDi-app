/**
 * @file SectionCard.jsx
 * @brief Generic section wrapper card used in form pages of the OSDi application.
 *
 * Renders a white card with a header (icon + title + badge counter) and an
 * "add" button at the bottom. The card's content (`children`) is typically a
 * list of expandable parameter cards (CostCard, UtilityCard, EffectCard, etc.).
 *
 * @module components/SectionCard
 */

import React from 'react';
import { Plus } from 'lucide-react';

/**
 * @brief Reusable section wrapper card.
 *
 * @param {JSX.Element}     props.icon     - Icon element shown in the section header.
 * @param {string}          props.title    - Section title text.
 * @param {string}          props.badge    - Badge text showing the current item count.
 * @param {Function}        props.onAdd    - Callback triggered when the "add" button is clicked.
 * @param {string}          props.addLabel - Text label for the "add" button.
 * @param {React.ReactNode} props.children - Parameter card elements rendered inside the section.
 *
 * @returns {JSX.Element} The rendered section card.
 */
function SectionCard({ icon, title, badge, onAdd, addLabel, children }) {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-300 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-rose-100 rounded-lg">{icon}</div>
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-100 rounded-full border border-rose-200">
          <div className="w-2 h-2 bg-rose-600 rounded-full" />
          <span className="text-xs font-bold text-rose-700">{badge}</span>
        </div>
      </div>
      <div className="space-y-3">
        {children}
        <button type="button" onClick={onAdd}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-linear-to-r from-rose-50 to-white hover:from-rose-100 hover:to-rose-50 border-2 border-dashed border-rose-300 hover:border-rose-400 rounded-2xl transition-all group">
          <div className="p-2 bg-rose-100 group-hover:bg-rose-200 rounded-lg transition-colors">
            <Plus className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-sm font-bold text-rose-700">{addLabel}</span>
        </button>
      </div>
    </div>
  );
}

export default SectionCard;
