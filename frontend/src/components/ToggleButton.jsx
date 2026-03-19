/**
 * @file ToggleButton.jsx
 * @brief Two-option toggle button that mimics a binary radio group.
 *
 * Renders two adjacent pill buttons inside a shared container. The active
 * option is elevated with a white background and coloured text; the inactive
 * option shows muted text. Clicking either option fires `onChange` with a
 * synthetic event shaped as `{ target: { name, value: boolean } }`.
 *
 * @module components/ToggleButton
 */

import React from 'react';

/**
 * @brief Two-option toggle (binary switch) styled as a segmented control.
 *
 * @param {boolean}  props.value    - `true` selects `option2`; `false` selects `option1`.
 * @param {Function} props.onChange - Called with `{ target: { name, value: boolean } }` on selection change.
 * @param {string}   props.option1  - Label for the first (false) option.
 * @param {string}   props.option2  - Label for the second (true) option.
 * @param {string}   props.name     - Field name included in the synthetic event's `target`.
 * @param {string}   [props.color='rose'] - Active text colour theme. One of `'rose'`, `'blue'`,
 *   `'purple'`, `'emerald'`.
 *
 * @returns {JSX.Element} The rendered toggle button.
 */
const ToggleButton = ({ value, onChange, option1, option2, name, color = 'rose' }) => {
  const colorClasses = {
    rose:    'text-rose-700',
    blue:    'text-blue-700',
    purple:  'text-purple-700',
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
