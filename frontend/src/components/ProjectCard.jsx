/**
 * @file ProjectCard.jsx
 * @brief Square card button used on the home page to navigate to a disease-model section,
 * plus a set of themed SVG disease icons.
 *
 * `ProjectCard` renders a coloured, hover-animated square button with an icon and a title.
 * The five named SVG components (`DiabetesIcon`, `HeartDiseaseIcon`, `CancerIcon`,
 * `RespiratoryIcon`, `AlzheimerIcon`) are ready-made illustrations that can be passed
 * as the `icon` prop.
 *
 * @module components/ProjectCard
 */

import React from 'react';

/**
 * @brief Navigable square card representing a disease-model section or project shortcut.
 *
 * Applies a colour theme from a predefined palette and renders the provided icon
 * component scaled up on hover.
 *
 * @param {string}      props.title        - Label displayed below the icon.
 * @param {React.ElementType} props.icon   - Icon component (e.g. `DiabetesIcon`) rendered at 64 × 64 px.
 * @param {string}      [props.color='emerald'] - Colour theme key. One of `'emerald'`, `'blue'`,
 *   `'purple'`, `'rose'`, `'amber'`.
 * @param {Function}    props.onClick      - Callback fired when the card button is clicked.
 *
 * @returns {JSX.Element} The rendered project card button.
 */
const ProjectCard = ({ title, icon: Icon, color = 'emerald', onClick }) => {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20 hover:border-emerald-300',
    blue: 'bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20 hover:border-blue-300',
    purple: 'bg-purple-500/10 text-purple-600 border-purple-200 hover:bg-purple-500/20 hover:border-purple-300',
    rose: 'bg-rose-500/10 text-rose-600 border-rose-200 hover:bg-rose-500/20 hover:border-rose-300',
    amber: 'bg-amber-500/10 text-amber-600 border-amber-200 hover:bg-amber-500/20 hover:border-amber-300',
  };

  return (
    <button
      onClick={onClick}
      className={`
        group relative w-full aspect-square rounded-2xl border-2
        ${colorClasses[color]}
        transition-all duration-300 hover:scale-105 hover:shadow-xl
        flex flex-col items-center justify-center p-6
      `}
    >
      {/* Icon/SVG Container */}
      <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-16 h-16" />
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-slate-800 text-center leading-tight">
        {title}
      </h3>

      {/* Hover indicator */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
      </div>
    </button>
  );
};

// ── Disease SVG icons ─────────────────────────────────────────────────────────

/**
 * @brief Circular SVG icon representing diabetes (glucose ring motif).
 * @param {Object} props
 * @param {string} [props.className] - Tailwind / CSS class forwarded to the `<svg>` element.
 * @returns {JSX.Element}
 */
export const DiabetesIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="28" fill="currentColor" opacity="0.2"/>
    <path d="M32 12C20.954 12 12 20.954 12 32s8.954 20 20 20 20-8.954 20-20S43.046 12 32 12zm0 36c-8.837 0-16-7.163-16-16s7.163-16 16-16 16 7.163 16 16-7.163 16-16 16z" fill="currentColor"/>
    <circle cx="32" cy="32" r="4" fill="currentColor"/>
    <path d="M32 24v-4m0 24v-4m8-8h4m-24 0h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

/**
 * @brief Heart-shaped SVG icon representing cardiovascular / heart disease.
 * @param {Object} props
 * @param {string} [props.className] - Tailwind / CSS class forwarded to the `<svg>` element.
 * @returns {JSX.Element}
 */
export const HeartDiseaseIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 52L12 32C8 28 8 20 14 14s14-4 18 2c4-6 12-8 18-2s6 14 2 18L32 52z" fill="currentColor" opacity="0.2"/>
    <path d="M32 48L15 31c-3-3-3-9 1-13s10-3 14 1c4-4 10-5 14-1s4 10 1 13L32 48z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M26 22l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/**
 * @brief Cell-cluster SVG icon representing oncological / cancer diseases.
 * @param {Object} props
 * @param {string} [props.className] - Tailwind / CSS class forwarded to the `<svg>` element.
 * @returns {JSX.Element}
 */
export const CancerIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="20" fill="currentColor" opacity="0.2"/>
    <circle cx="32" cy="32" r="16" stroke="currentColor" strokeWidth="2.5"/>
    <circle cx="24" cy="24" r="3" fill="currentColor"/>
    <circle cx="40" cy="24" r="3" fill="currentColor"/>
    <circle cx="32" cy="40" r="3" fill="currentColor"/>
    <circle cx="24" cy="40" r="2" fill="currentColor"/>
    <circle cx="40" cy="40" r="2" fill="currentColor"/>
    <path d="M20 32h24M32 20v24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

/**
 * @brief Lung-shaped SVG icon representing respiratory diseases.
 * @param {Object} props
 * @param {string} [props.className] - Tailwind / CSS class forwarded to the `<svg>` element.
 * @returns {JSX.Element}
 */
export const RespiratoryIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 12v40M20 20c-6 0-8 4-8 8s2 8 8 8M44 20c6 0 8 4 8 8s-2 8-8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <ellipse cx="20" cy="28" rx="6" ry="8" fill="currentColor" opacity="0.2"/>
    <ellipse cx="44" cy="28" rx="6" ry="8" fill="currentColor" opacity="0.2"/>
    <path d="M26 36c2 4 4 8 6 12M38 36c-2 4-4 8-6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

/**
 * @brief Brain-outline SVG icon representing neurodegenerative (Alzheimer) diseases.
 * @param {Object} props
 * @param {string} [props.className] - Tailwind / CSS class forwarded to the `<svg>` element.
 * @returns {JSX.Element}
 */
export const AlzheimerIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="28" r="16" fill="currentColor" opacity="0.2"/>
    <path d="M32 12c-8.837 0-16 7.163-16 16 0 4 1.5 7.5 4 10.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M48 28c0-8.837-7.163-16-16-16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 4"/>
    <circle cx="28" cy="26" r="2" fill="currentColor"/>
    <circle cx="36" cy="26" r="2" fill="currentColor"/>
    <path d="M28 34c1.5-1 3.5-1 5 0M20 46h24M24 52h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export default ProjectCard;
