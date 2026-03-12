import React, { useEffect, useState } from 'react';
import { Settings, AlertTriangle, Sigma, FlaskConical, BarChart3, Book } from 'lucide-react';

// ── Constantes (fuera del componente para no recrearlas en cada render) ────────

const COLOR_SCHEMES = {
  rose: {
    bg50: 'bg-rose-50/50',
    bg100: 'bg-rose-100',
    bg200: 'bg-rose-200',
    border200: 'border-rose-200',
    border400: 'border-rose-400',
    text600: 'text-rose-600',
    text700: 'text-rose-700',
    text800: 'text-rose-800',
    text900: 'text-rose-900',
    border500: 'border-rose-500',
    ring500: 'ring-rose-500/10',
    focus500: 'focus:border-rose-500',
    focusRing: 'focus:ring-rose-500/10',
    hover300: 'group-hover:border-rose-300',
    fillRGB: 'rgb(251, 113, 133)',
    strokeRGB: 'rgb(225, 29, 72)',
    strokeDarkRGB: 'rgb(190, 18, 60)',
    text500: 'text-rose-500',
    text400: 'text-rose-400',
    gradient: 'from-rose-50 via-white to-rose-50',
    gradientTo: 'from-rose-50 to-white',
  },
  blue: {
    bg50: 'bg-blue-50/50',
    bg100: 'bg-blue-100',
    bg200: 'bg-blue-200',
    border200: 'border-blue-200',
    border400: 'border-blue-400',
    text600: 'text-blue-600',
    text700: 'text-blue-700',
    text800: 'text-blue-800',
    text900: 'text-blue-900',
    border500: 'border-blue-500',
    ring500: 'ring-blue-500/10',
    focus500: 'focus:border-blue-500',
    focusRing: 'focus:ring-blue-500/10',
    hover300: 'group-hover:border-blue-300',
    fillRGB: 'rgb(147, 197, 253)',
    strokeRGB: 'rgb(59, 130, 246)',
    strokeDarkRGB: 'rgb(29, 78, 216)',
    text500: 'text-blue-500',
    text400: 'text-blue-400',
    gradient: 'from-blue-50 via-white to-blue-50',
    gradientTo: 'from-blue-50 to-white',
  },
  emerald: {
    bg50: 'bg-emerald-50/50',
    bg100: 'bg-emerald-100',
    bg200: 'bg-emerald-200',
    border200: 'border-emerald-200',
    border400: 'border-emerald-400',
    text600: 'text-emerald-600',
    text700: 'text-emerald-700',
    text800: 'text-emerald-800',
    text900: 'text-emerald-900',
    border500: 'border-emerald-500',
    ring500: 'ring-emerald-500/10',
    focus500: 'focus:border-emerald-500',
    focusRing: 'focus:ring-emerald-500/10',
    hover300: 'group-hover:border-emerald-300',
    fillRGB: 'rgb(110, 231, 183)',
    strokeRGB: 'rgb(16, 185, 129)',
    strokeDarkRGB: 'rgb(4, 120, 87)',
    text500: 'text-emerald-500',
    text400: 'text-emerald-400',
    gradient: 'from-emerald-50 via-white to-emerald-50',
    gradientTo: 'from-emerald-50 to-white',
  }
};

const CHAR_PARAMS = [
  { key: 'average',       label: 'Media (μ)',                symbol: 'μ',  hint: 'hasAverageParameter — valor central de la distribución',                               type: 'number' },
  { key: 'stdDev',        label: 'Desviación estándar (σ)',  symbol: 'σ',  hint: 'hasStandardDeviationParameter — dispersión alrededor de la media',                    type: 'number' },
  { key: 'variance',      label: 'Varianza (σ²)',            symbol: 'σ²', hint: 'Cuadrado de la desviación estándar',                                                   type: 'number' },
  { key: 'lower95CI',     label: 'IC Inferior 95%',          symbol: '▼',  hint: 'DI_Lower95ConfidenceLimit — límite inferior del intervalo de confianza al 95%',       type: 'number' },
  { key: 'upper95CI',     label: 'IC Superior 95%',          symbol: '▲',  hint: 'DI_Upper95ConfidenceLimit — límite superior del intervalo de confianza al 95%',       type: 'number' },
  { key: 'lowerLimit',    label: 'Límite inferior',          symbol: '≥',  hint: 'hasLowerLimitParameter — límite mínimo (ej. Uniforme)',                                type: 'number' },
  { key: 'upperLimit',    label: 'Límite superior',          symbol: '≤',  hint: 'hasUpperLimitParameter — límite máximo (ej. Uniforme)',                                type: 'number' },
  { key: 'alpha',         label: 'Alpha (α)',                symbol: 'α',  hint: 'hasAlfaParameter — parámetro de forma (Beta, Gamma)',                                  type: 'number' },
  { key: 'beta',          label: 'Beta (β)',                 symbol: 'β',  hint: 'hasBetaParameter — segundo parámetro de forma (Beta)',                                 type: 'number' },
  { key: 'lambda',        label: 'Lambda (λ)',               symbol: 'λ',  hint: 'hasLambdaParameter — tasa (Gamma, Exponencial, Poisson)',                              type: 'number' },
  { key: 'probability',   label: 'Probabilidad (p)',         symbol: 'p',  hint: 'hasProbabilityParameter — probabilidad de un evento (Bernoulli)',                      type: 'number' },
  { key: 'expectedValue', label: 'Valor esperado',           symbol: 'E',  hint: 'hasExpectedValue — valor central del parámetro determinista',                         type: 'number' },
  { key: 'scale',         label: 'Escala',                   symbol: 's',  hint: 'hasScaleParameter — parámetro de escala genérico',                                    type: 'number' },
  { key: 'offset',        label: 'Offset / Desplazamiento',  symbol: 'd',  hint: 'hasOffsetParameter — desplazamiento del origen de la distribución',                   type: 'number' },
];

// ── Utilidades matemáticas ────────────────────────────────────────────────────

const normalPDF = (x, mu, sigma) =>
  Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));

const buildNormalCurve = (mu, sigma) => {
  const numPoints = 120;
  const range = 4 * sigma;
  const minX = mu - range;
  const maxX = mu + range;
  let maxY = 0;
  const raw = [];

  for (let i = 0; i <= numPoints; i++) {
    const x = minX + (i / numPoints) * (maxX - minX);
    const y = normalPDF(x, mu, sigma);
    raw.push({ x, y });
    if (y > maxY) maxY = y;
  }

  const toSVG = ({ x, y }) => ({
    sx: 20 + ((x - minX) / (maxX - minX)) * 260,
    sy: 95 - (y / maxY) * 75,
  });

  const muSVGx   = 20 + ((mu - minX)            / (maxX - minX)) * 260;
  const mu1pSVGx = 20 + ((mu + sigma - minX)    / (maxX - minX)) * 260;
  const mu1mSVGx = 20 + ((mu - sigma - minX)    / (maxX - minX)) * 260;
  const mu2pSVGx = 20 + ((mu + 2 * sigma - minX)/ (maxX - minX)) * 260;
  const mu2mSVGx = 20 + ((mu - 2 * sigma - minX)/ (maxX - minX)) * 260;

  const svgPts = raw.map(toSVG);
  const linePath = svgPts.reduce(
    (acc, { sx, sy }, i) => acc + (i === 0 ? `M ${sx},${sy}` : ` L ${sx},${sy}`),
    ''
  );
  const fillPath = `${linePath} L 280,95 L 20,95 Z`;

  return { linePath, fillPath, muSVGx, mu1pSVGx, mu1mSVGx, mu2pSVGx, mu2mSVGx };
};

// Función logGamma (Stirling/Lanczos) — usada por betaPDF y gammaPDF
const logGamma = (z) => {
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = 0.99999999999980993;
  const c = [676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012,
    9.9843695780195716e-6, 1.5056327351493116e-7];
  for (let i = 0; i < 8; i++) x += c[i] / (z + i + 1);
  const t = z + 7.5;
  return Math.log(Math.sqrt(2 * Math.PI)) + Math.log(t) * (z + 0.5) - t + Math.log(x);
};

const logBeta = (a, b) => logGamma(a) + logGamma(b) - logGamma(a + b);

const betaPDF = (x, a, b) => {
  if (x <= 0 || x >= 1) return 0;
  return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - logBeta(a, b));
};

const gammaPDF = (x, a, l) => {
  if (x <= 0) return 0;
  return Math.exp(a * Math.log(l) + (a - 1) * Math.log(x) - l * x - logGamma(a));
};

// ── Custom hook ───────────────────────────────────────────────────────────────

const useCharacterizationParams = (prefix, onChange) => {
  const [activeParams, setActiveParams] = useState({});

  const toggleParam = (key) => {
    setActiveParams(prev => {
      const next = { ...prev };
      if (next[key] !== undefined) {
        delete next[key];
      } else {
        next[key] = '';
      }
      return next;
    });
  };

  const setParamValue = (key, val) => {
    setActiveParams(prev => ({ ...prev, [key]: val }));
    onChange({ target: { name: `${prefix}char_${key}`, value: val } });
  };

  return { activeParams, toggleParam, setParamValue };
};

// ── Sub-componentes ───────────────────────────────────────────────────────────

const InfoBox = ({ colors, iconEl, title, children, align = 'center' }) => (
  <div className={`relative overflow-hidden p-4 bg-linear-to-br ${colors.gradient} rounded-xl border-2 ${colors.border200} shadow-sm`}>
    <div className={`absolute top-0 right-0 w-32 h-32 ${colors.bg100} rounded-full blur-3xl opacity-30`} />
    <div className={`relative flex items-${align} gap-3`}>
      <div className={`p-2 ${colors.bg100} rounded-lg shrink-0`}>
        {iconEl}
      </div>
      <div>
        <p className={`text-xs font-bold ${colors.text900} mb-1`}>{title}</p>
        <p className={`text-xs ${colors.text700} leading-relaxed`}>{children}</p>
      </div>
    </div>
  </div>
);

const DistributionInput = ({
  label, symbol, name, value, onChange, colors,
  step = '0.0001', placeholder, hasError = false,
  onRemove, compact = false, labelTitle,
}) => (
  <div className={compact ? 'space-y-1' : 'space-y-2'}>
    <label
      className={`text-[10px] font-bold text-slate-500 ml-1 flex items-center ${compact ? 'gap-1' : 'gap-2'}`}
      title={labelTitle}
    >
      <span className={`w-2.5 h-2.5 ${colors.bg200} rounded-full shadow-sm`} />
      {label}
    </label>
    <div className={`relative ${compact ? '' : 'group'}`}>
      <input
        type="number"
        step={step}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 ${compact ? 'py-2.5 pl-9' : 'py-3 pl-10'} bg-white border-2 rounded-xl text-sm font-medium focus:ring-4 outline-none transition-all ${
          hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
            : `${colors.border200} ${colors.focus500} ${colors.focusRing}${compact ? '' : ` ${colors.hover300}`}`
        }`}
      />
      <div className="absolute left-3 top-1/2 -translate-y-1/2">
        <span className={`text-sm font-bold ${hasError ? 'text-red-500' : colors.text500}`}>{symbol}</span>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors text-lg leading-none"
          title="Eliminar parámetro"
        >×</button>
      )}
    </div>
  </div>
);

// ── Componente principal ──────────────────────────────────────────────────────

const StochasticConfig = ({ data, onChange, prefix = '', color = 'rose' }) => {
  const colors = COLOR_SCHEMES[color] || COLOR_SCHEMES.rose;

  const [configMode, setConfigMode] = useState('distribuciones');
  const { activeParams, toggleParam, setParamValue } = useCharacterizationParams(prefix, onChange);

  const hasUniformError = data.distributionType === 'Uniform' &&
    data.lowerBound && data.upperBound &&
    parseFloat(data.lowerBound) >= parseFloat(data.upperBound);

  const hasNormalData = data.mean && data.standardDeviation && parseFloat(data.standardDeviation) > 0;
  const hasBetaData   = data.alpha && data.beta   && parseFloat(data.alpha) > 0 && parseFloat(data.beta) > 0;
  const hasGammaData  = data.alpha && data.lambda && parseFloat(data.alpha) > 0 && parseFloat(data.lambda) > 0;

  // Auto-fill valor esperado con la media teórica
  useEffect(() => {
    let computedMean = null;

    if (data.distributionType === 'Normal' && hasNormalData) {
      computedMean = parseFloat(data.mean);
    } else if (data.distributionType === 'Uniform') {
      const lo = parseFloat(data.lowerBound);
      const hi = parseFloat(data.upperBound);
      if (!isNaN(lo) && !isNaN(hi) && lo < hi) computedMean = (lo + hi) / 2;
    } else if (data.distributionType === 'Beta' && hasBetaData) {
      const a = parseFloat(data.alpha);
      const b = parseFloat(data.beta);
      computedMean = a / (a + b);
    } else if (data.distributionType === 'Gamma' && hasGammaData) {
      const a = parseFloat(data.alpha);
      const l = parseFloat(data.lambda);
      computedMean = a / l;
    }

    if (computedMean !== null && !isNaN(computedMean)) {
      onChange({ target: { name: `${prefix}value`, value: parseFloat(computedMean.toFixed(4)) } });
    }
  }, [
    data.distributionType,
    data.mean, data.standardDeviation,
    data.lowerBound, data.upperBound,
    data.alpha, data.beta, data.lambda,
  ]);

  return (
    <div className={`space-y-4 p-4 ${colors.bg50} border ${colors.border200} rounded-xl`}>
      <div className="flex items-center gap-2 mb-2">
        <Settings className={`w-4 h-4 ${colors.text600}`} />
        <h3 className="text-md font-bold text-slate-900">Configuración Avanzada</h3>
      </div>

      {/* Toggle Distribuciones / Caracterización */}
      <div className={`flex bg-slate-50 border ${colors.border200} rounded-xl p-1 gap-1`}>
        {[
          { id: 'distribuciones', icon: BarChart3,    label: 'Distribuciones' },
          { id: 'caracterizacion', icon: FlaskConical, label: 'Caracterización' },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setConfigMode(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              configMode === id
                ? `bg-white shadow-sm ${colors.text700}`
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ══════════ MODO: DISTRIBUCIONES ══════════ */}
      {configMode === 'distribuciones' && (<>

        {/* Tipo de Distribución */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tipo de Distribución</label>
          <select
            name="distributionType"
            value={data.distributionType}
            onChange={onChange}
            className={`w-full px-4 py-2.5 bg-white border ${colors.border200} rounded-xl text-sm ${colors.focus500} focus:ring-2 ${colors.focusRing} outline-none transition-all`}
          >
            <option value="Normal">Normal</option>
            <option value="Uniform">Uniforme</option>
            <option value="Beta">Beta</option>
            <option value="Gamma">Gamma</option>
          </select>
        </div>

        {/* ═══════════════════ DISTRIBUCIÓN NORMAL ═══════════════════ */}
        {data.distributionType === 'Normal' && (
          <div className="space-y-5">
            <hr className={colors.border400} />

            <InfoBox colors={colors} iconEl={<Sigma className={`w-6 h-6 ${colors.text600}`} />} title="Distribución Normal">
              Los valores se distribuyen de forma{' '}
              <strong className={`font-bold ${colors.text900}`}>simétrica alrededor de la media</strong>,
              siendo más probables los cercanos a ella y menos frecuentes los extremos.
            </InfoBox>

            {/* Visualización Campana de Gauss DINÁMICA */}
            <div className={`relative p-6 bg-linear-to-br rounded-2xl border-2 transition-all ${hasNormalData ? `${colors.gradientTo} ${colors.border200}` : 'from-slate-50 to-white border-slate-200'}`}>
              <div className="relative h-40 mb-4">
                <svg viewBox="0 0 300 100" className="w-full h-full">
                  <defs>
                    <linearGradient id={`gaussGradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{
                        stopColor: hasNormalData ? colors.fillRGB : 'rgb(148, 163, 184)',
                        stopOpacity: hasNormalData ? 0.35 : 0.2,
                      }} />
                      <stop offset="100%" style={{
                        stopColor: hasNormalData ? colors.fillRGB : 'rgb(148, 163, 184)',
                        stopOpacity: 0.04,
                      }} />
                    </linearGradient>

                    {hasNormalData && (() => {
                      const mu = parseFloat(data.mean);
                      const sigma = parseFloat(data.standardDeviation);
                      const { mu1mSVGx, mu1pSVGx } = buildNormalCurve(mu, sigma);
                      return (
                        <clipPath id={`sigma1clip-${color}`}>
                          <rect x={mu1mSVGx} y="0" width={mu1pSVGx - mu1mSVGx} height="100" />
                        </clipPath>
                      );
                    })()}
                  </defs>

                  {(() => {
                    if (!hasNormalData) {
                      return (
                        <>
                          <path
                            d="M 20,95 C 60,95 80,30 150,15 C 220,30 240,95 280,95"
                            fill="url(#gaussGradient-rose)"
                            stroke="none"
                          />
                          <path
                            d="M 20,95 C 60,95 80,30 150,15 C 220,30 240,95 280,95"
                            fill="none"
                            stroke="rgb(148, 163, 184)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                          <line x1="150" y1="15" x2="150" y2="95"
                            stroke="rgb(100, 116, 139)"
                            strokeWidth="1.5" strokeDasharray="4,3" opacity="0.5" />
                        </>
                      );
                    }

                    const mu    = parseFloat(data.mean);
                    const sigma = parseFloat(data.standardDeviation);
                    const curve = buildNormalCurve(mu, sigma);

                    return (
                      <>
                        <path d={curve.fillPath} fill={`url(#gaussGradient-${color})`} stroke="none"
                          clipPath={`url(#sigma1clip-${color})`} opacity="0.85" />
                        <path d={curve.fillPath} fill={`url(#gaussGradient-${color})`} stroke="none" opacity="0.35" />
                        <path d={curve.linePath} fill="none" stroke={colors.strokeRGB}
                          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1={curve.muSVGx} y1="8" x2={curve.muSVGx} y2="95"
                          stroke={colors.strokeDarkRGB} strokeWidth="2" strokeDasharray="4,3" />
                        <line x1={curve.mu1mSVGx} y1="95" x2={curve.mu1mSVGx} y2="55"
                          stroke={colors.strokeRGB} strokeWidth="1.2" strokeDasharray="3,3" opacity="0.7" />
                        <line x1={curve.mu1pSVGx} y1="95" x2={curve.mu1pSVGx} y2="55"
                          stroke={colors.strokeRGB} strokeWidth="1.2" strokeDasharray="3,3" opacity="0.7" />
                        <line x1={curve.mu2mSVGx} y1="95" x2={curve.mu2mSVGx} y2="82"
                          stroke={colors.strokeRGB} strokeWidth="1" strokeDasharray="2,3" opacity="0.45" />
                        <line x1={curve.mu2pSVGx} y1="95" x2={curve.mu2pSVGx} y2="82"
                          stroke={colors.strokeRGB} strokeWidth="1" strokeDasharray="2,3" opacity="0.45" />
                        <line x1={curve.mu1mSVGx} y1="52" x2={curve.mu1pSVGx} y2="52"
                          stroke={colors.strokeDarkRGB} strokeWidth="1" opacity="0.6" />
                      </>
                    );
                  })()}

                  <line x1="20" y1="95" x2="280" y2="95"
                    stroke={hasNormalData ? colors.strokeRGB : 'rgb(148, 163, 184)'}
                    strokeWidth="1.5" opacity="0.5" />
                </svg>
              </div>

              {/* Tabla σ-bands */}
              <div className="relative h-8 text-[10px]">
                {[
                  { label: 'μ−2σ', pct: 28.33, value: hasNormalData ? (parseFloat(data.mean) - 2 * parseFloat(data.standardDeviation)).toFixed(2) : '—', dim: true },
                  { label: 'μ−1σ', pct: 39.17, value: hasNormalData ? (parseFloat(data.mean) - parseFloat(data.standardDeviation)).toFixed(2) : '—', dim: false },
                  { label: 'μ',    pct: 50,     value: hasNormalData ? parseFloat(data.mean).toFixed(2) : '—', center: true },
                  { label: 'μ+1σ', pct: 60.83, value: hasNormalData ? (parseFloat(data.mean) + parseFloat(data.standardDeviation)).toFixed(2) : '—', dim: false },
                  { label: 'μ+2σ', pct: 71.67, value: hasNormalData ? (parseFloat(data.mean) + 2 * parseFloat(data.standardDeviation)).toFixed(2) : '—', dim: true },
                ].map(({ label, pct, value, dim, center }) => (
                  <div key={label} className="absolute flex flex-col items-center -translate-x-1/2" style={{ left: `${pct}%` }}>
                    <div className={`font-bold leading-tight ${hasNormalData ? (center ? colors.text700 : dim ? 'text-slate-400' : 'text-slate-500') : 'text-slate-300'}`}>{label}</div>
                    <div className={`font-semibold leading-tight ${hasNormalData ? (center ? colors.text900 : dim ? 'text-slate-500' : 'text-slate-700') : 'text-slate-400'}`}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Regla empírica */}
              <div className={`relative overflow-hidden p-4 bg-linear-to-br rounded-xl border-2 shadow-sm mt-3 ${hasNormalData ? `${colors.gradient} ${colors.border200}` : 'from-slate-50 via-white to-slate-50 border-slate-200'}`}>
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-30 ${hasNormalData ? colors.bg100 : 'bg-slate-100'}`} />
                <div className="relative flex items-center gap-3">
                  <div>
                    <p className={`text-xs leading-relaxed ${hasNormalData ? colors.text700 : 'text-slate-500'}`}>
                      En una distribución normal, aproximadamente el{' '}
                      <strong>68%</strong> de los valores se encuentran dentro de ±1σ,
                      el <strong>95%</strong> dentro de ±2σ y el <strong>99.7%</strong> dentro de ±3σ.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DistributionInput label="MEDIA (μ)"              symbol="μ" name="mean"              value={data.mean}              onChange={onChange} colors={colors} placeholder="150"  />
              <DistributionInput label="DESVIACIÓN ESTÁNDAR (σ)" symbol="σ" name="standardDeviation" value={data.standardDeviation} onChange={onChange} colors={colors} placeholder="15.5" />
            </div>
          </div>
        )}

        {/* ═══════════════════ DISTRIBUCIÓN UNIFORME ═══════════════════ */}
        {data.distributionType === 'Uniform' && (
          <div className="space-y-5">
            <hr className={colors.border400} />

            <InfoBox colors={colors} iconEl={<span className="text-lg">📊</span>} title="Distribución Uniforme" align="start">
              Todos los valores entre{' '}
              <strong className={`font-bold ${colors.text900}`}>ambos límites</strong>{' '}
              tienen exactamente la misma probabilidad de ocurrir.
            </InfoBox>

            <div className={`relative p-6 bg-linear-to-br ${colors.gradientTo} rounded-2xl border-2 transition-all ${hasUniformError ? 'border-red-400 bg-red-50' : colors.border200}`}>
              <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                {data.lowerBound && data.upperBound && parseFloat(data.lowerBound) < parseFloat(data.upperBound) && (
                  <>
                    <div className={`absolute h-full ${colors.bg200} shadow-md`} style={{ left: '0%', right: '0%' }} />
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-full shadow-lg border-2 ${colors.border400}`}
                      style={{ left: '50%', transform: 'translate(-50%, -50%)' }}
                    />
                  </>
                )}
              </div>

              <div className="flex justify-between mt-3 px-1">
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Mínimo</span>
                  <span className="text-xs font-bold text-slate-800">{data.lowerBound || '—'}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Esperado</span>
                  <span className="text-xs font-bold text-slate-800">
                    {data.lowerBound && data.upperBound && !hasUniformError
                      ? ((parseFloat(data.lowerBound) + parseFloat(data.upperBound)) / 2).toFixed(2)
                      : '—'}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Máximo</span>
                  <span className="text-xs font-bold text-slate-800">{data.upperBound || '—'}</span>
                </div>
              </div>
            </div>

            {hasUniformError && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-xl animate-in fade-in slide-in-from-top-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-2" />
                <div>
                  <p className="text-xs font-bold text-yellow-900 mb-1">Error en los límites</p>
                  <p className="text-xs text-yellow-700 leading-relaxed">
                    El límite inferior <strong>({data.lowerBound})</strong> debe ser estrictamente menor que el límite superior <strong>({data.upperBound})</strong>.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <DistributionInput label="Límite Inferior" symbol="≥" name="lowerBound" value={data.lowerBound} onChange={onChange} colors={colors} placeholder="100" hasError={hasUniformError} />
              <DistributionInput label="Límite Superior" symbol="≤" name="upperBound" value={data.upperBound} onChange={onChange} colors={colors} placeholder="200" hasError={hasUniformError} />
            </div>
          </div>
        )}

        {/* ═══════════════════ DISTRIBUCIÓN BETA ═══════════════════ */}
        {data.distributionType === 'Beta' && (
          <div className="space-y-5">
            <hr className={colors.border400} />

            <InfoBox colors={colors} iconEl={<span className="text-lg">📊</span>} title="Distribución Beta">
              Ideal para modelar{' '}
              <strong className={`font-bold ${colors.text900}`}>valores entre 0 y 1</strong>,
              como probabilidades, proporciones o utilidades.
            </InfoBox>

            <div className={`relative p-6 bg-linear-to-br rounded-2xl border-2 transition-all ${hasBetaData ? `${colors.gradientTo} ${colors.border200}` : 'from-slate-50 to-white border-slate-200'}`}>
              <div className="relative h-32 mb-4">
                <svg viewBox="0 0 300 100" className="w-full h-full">
                  <defs>
                    <linearGradient id={`betaGradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: hasBetaData ? colors.fillRGB : 'rgb(148, 163, 184)', stopOpacity: hasBetaData ? 0.3 : 0.2 }} />
                      <stop offset="100%" style={{ stopColor: hasBetaData ? colors.fillRGB : 'rgb(148, 163, 184)', stopOpacity: 0.05 }} />
                    </linearGradient>
                  </defs>

                  {(() => {
                    if (!hasBetaData) {
                      return (
                        <>
                          <path d="M 20,95 Q 50,85 80,60 T 120,35 T 150,25 T 180,30 T 220,55 Q 250,75 280,95"
                            fill={`url(#betaGradient-${color})`} stroke="none" />
                          <path d="M 20,95 Q 50,85 80,60 T 120,35 T 150,25 T 180,30 T 220,55 Q 250,75 280,95"
                            fill="none" stroke="rgb(148, 163, 184)" strokeWidth="2.5" strokeLinecap="round" />
                        </>
                      );
                    }

                    const alpha = parseFloat(data.alpha);
                    const beta  = parseFloat(data.beta);
                    const numPoints = 100;
                    const points = [];
                    let maxPDF = 0;

                    for (let i = 0; i <= numPoints; i++) {
                      const x = i / numPoints;
                      const y = betaPDF(x, alpha, beta);
                      points.push({ x, y });
                      maxPDF = Math.max(maxPDF, y);
                    }

                    const svgPts = points.map(p => ({ sx: 20 + p.x * 260, sy: 95 - (p.y / maxPDF) * 75 }));
                    const pathData = svgPts.reduce((acc, { sx, sy }, i) => acc + (i === 0 ? `M ${sx},${sy}` : ` L ${sx},${sy}`), '');
                    const fillPathData = `${pathData} L 280,95 L 20,95 Z`;
                    const mode = alpha > 1 && beta > 1 ? (alpha - 1) / (alpha + beta - 2) : 0.5;
                    const modeX = 20 + mode * 260;

                    return (
                      <>
                        <path d={fillPathData} fill={`url(#betaGradient-${color})`} stroke="none" />
                        <path d={pathData} fill="none" stroke={colors.strokeRGB} strokeWidth="2.5" strokeLinecap="round" />
                        {alpha > 1 && beta > 1 && (
                          <line x1={modeX} y1="20" x2={modeX} y2="95" stroke={colors.strokeDarkRGB} strokeWidth="2" strokeDasharray="4,4" />
                        )}
                      </>
                    );
                  })()}

                  <line x1="20" y1="95" x2="280" y2="95" stroke={hasBetaData ? colors.strokeRGB : 'rgb(148, 163, 184)'} strokeWidth="2" />
                </svg>
              </div>

              <div className="flex justify-between items-center px-2 text-[10px]">
                <div className="text-center">
                  <div className={`font-bold ${hasBetaData ? 'text-slate-500' : 'text-slate-300'}`}>0.0</div>
                  <div className={`text-xs ${hasBetaData ? 'text-slate-600' : 'text-slate-400'}`}>Mínimo</div>
                </div>
                <div className="text-center">
                  <div className={`font-bold ${hasBetaData ? colors.text700 : 'text-slate-500'}`}>
                    {hasBetaData && parseFloat(data.alpha) > 1 && parseFloat(data.beta) > 1
                      ? ((parseFloat(data.alpha) - 1) / (parseFloat(data.alpha) + parseFloat(data.beta) - 2)).toFixed(3) : '—'}
                  </div>
                  <div className={`text-xs ${hasBetaData ? colors.text800 : 'text-slate-400'}`}>Moda</div>
                </div>
                <div className="text-center">
                  <div className={`font-bold ${hasBetaData ? colors.text700 : 'text-slate-500'}`}>
                    {hasBetaData ? (parseFloat(data.alpha) / (parseFloat(data.alpha) + parseFloat(data.beta))).toFixed(3) : '—'}
                  </div>
                  <div className={`text-xs ${hasBetaData ? colors.text800 : 'text-slate-400'}`}>Media</div>
                </div>
                <div className="text-center">
                  <div className={`font-bold ${hasBetaData ? 'text-slate-500' : 'text-slate-300'}`}>1.0</div>
                  <div className={`text-xs ${hasBetaData ? 'text-slate-600' : 'text-slate-400'}`}>Máximo</div>
                </div>
              </div>

              <div className={`relative overflow-hidden p-4 bg-linear-to-br rounded-xl border-2 shadow-sm mt-3 ${hasBetaData ? `${colors.gradient} ${colors.border200}` : 'from-slate-50 via-white to-slate-50 border-slate-200'}`}>
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-30 ${hasBetaData ? colors.bg100 : 'bg-slate-100'}`} />
                <div className="relative">
                  <p className={`text-xs leading-relaxed ${hasBetaData ? colors.text700 : 'text-slate-500'}`}>
                    La distribución Beta es perfecta para modelar tasas de éxito, probabilidades de que algo ocurra y proporciones. Con α y β &gt; 1, la distribución tiene forma de campana dentro del intervalo [0, 1].
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DistributionInput label="ALPHA (α)" symbol="α" name="alpha" value={data.alpha} onChange={onChange} colors={colors} step="0.01" placeholder="8" />
              <DistributionInput label="BETA (β)"  symbol="β" name="beta"  value={data.beta}  onChange={onChange} colors={colors} step="0.01" placeholder="2" />
            </div>
            <div className="p-3 bg-yellow-50 border-2 border-yellow-500/40 rounded-lg">
              <p className="text-xs text-yellow-800"><strong>💡 Tip:</strong> α y β &gt; 1 crean una curva con forma de campana.</p>
            </div>
          </div>
        )}

        {/* ═══════════════════ DISTRIBUCIÓN GAMMA ═══════════════════ */}
        {data.distributionType === 'Gamma' && (
          <div className="space-y-5">
            <hr className={colors.border400} />

            <InfoBox colors={colors} iconEl={<span className="text-lg">⏱️</span>} title="Distribución Gamma">
              Ideal para modelar{' '}
              <strong className={`font-bold ${colors.text900}`}>tiempos de espera</strong> y{' '}
              <strong className={`font-bold ${colors.text900}`}>costes</strong>.
            </InfoBox>

            <div className={`relative p-6 bg-linear-to-br rounded-2xl border-2 transition-all ${hasGammaData ? `${colors.gradientTo} ${colors.border200}` : 'from-slate-50 to-white border-slate-200'}`}>
              <div className="relative h-32 mb-4">
                <svg viewBox="0 0 300 100" className="w-full h-full">
                  <defs>
                    <linearGradient id={`gammaGradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: hasGammaData ? colors.fillRGB : 'rgb(148, 163, 184)', stopOpacity: hasGammaData ? 0.3 : 0.2 }} />
                      <stop offset="100%" style={{ stopColor: hasGammaData ? colors.fillRGB : 'rgb(148, 163, 184)', stopOpacity: 0.05 }} />
                    </linearGradient>
                  </defs>

                  {(() => {
                    if (!hasGammaData) {
                      return (
                        <>
                          <path d="M 20,95 Q 40,70 60,45 T 90,25 T 120,20 T 150,25 T 180,40 T 210,60 T 240,75 Q 260,85 280,92"
                            fill={`url(#gammaGradient-${color})`} stroke="none" />
                          <path d="M 20,95 Q 40,70 60,45 T 90,25 T 120,20 T 150,25 T 180,40 T 210,60 T 240,75 Q 260,85 280,92"
                            fill="none" stroke="rgb(148, 163, 184)" strokeWidth="2.5" strokeLinecap="round" />
                        </>
                      );
                    }

                    const alpha  = parseFloat(data.alpha);
                    const lambda = parseFloat(data.lambda);
                    const numPoints = 100;
                    const points = [];
                    const mean   = alpha / lambda;
                    const stdDev = Math.sqrt(alpha) / lambda;
                    const maxX   = mean + 4 * stdDev;
                    let maxPDF = 0;

                    for (let i = 0; i <= numPoints; i++) {
                      const x = (i / numPoints) * maxX;
                      const y = gammaPDF(x, alpha, lambda);
                      points.push({ x, y });
                      maxPDF = Math.max(maxPDF, y);
                    }

                    const svgPts = points.map(p => ({ sx: 20 + (p.x / maxX) * 260, sy: 95 - (p.y / maxPDF) * 75 }));
                    const pathData = svgPts.reduce((acc, { sx, sy }, i) => acc + (i === 0 ? `M ${sx},${sy}` : ` L ${sx},${sy}`), '');
                    const fillPathData = `M 20,95 ${pathData} L 280,95 Z`;
                    const mode  = alpha > 1 ? (alpha - 1) / lambda : 0;
                    const modeX = 20 + (mode / maxX) * 260;

                    return (
                      <>
                        <path d={fillPathData} fill={`url(#gammaGradient-${color})`} stroke="none" />
                        <path d={pathData} fill="none" stroke={colors.strokeRGB} strokeWidth="2.5" strokeLinecap="round" />
                        {alpha > 1 && (
                          <line x1={modeX} y1="20" x2={modeX} y2="95" stroke={colors.strokeDarkRGB} strokeWidth="2" strokeDasharray="4,4" />
                        )}
                      </>
                    );
                  })()}

                  <line x1="20" y1="95" x2="280" y2="95" stroke={hasGammaData ? colors.strokeRGB : 'rgb(148, 163, 184)'} strokeWidth="2" />
                </svg>
              </div>

              <div className="flex justify-between items-center px-2 text-[10px]">
                <div className="text-center">
                  <div className={`font-bold ${hasGammaData ? 'text-slate-500' : 'text-slate-300'}`}>0</div>
                  <div className={`text-xs ${hasGammaData ? 'text-slate-600' : 'text-slate-400'}`}>Inicio</div>
                </div>
                <div className="text-center">
                  <div className={`font-bold ${hasGammaData ? colors.text700 : 'text-slate-500'}`}>
                    {hasGammaData && parseFloat(data.alpha) > 1
                      ? ((parseFloat(data.alpha) - 1) / parseFloat(data.lambda)).toFixed(2) : '—'}
                  </div>
                  <div className={`text-xs ${hasGammaData ? colors.text800 : 'text-slate-400'}`}>Moda</div>
                </div>
                <div className="text-center">
                  <div className={`font-bold ${hasGammaData ? colors.text700 : 'text-slate-500'}`}>
                    {hasGammaData ? (parseFloat(data.alpha) / parseFloat(data.lambda)).toFixed(2) : '—'}
                  </div>
                  <div className={`text-xs ${hasGammaData ? colors.text800 : 'text-slate-400'}`}>Media</div>
                </div>
                <div className="text-center">
                  <div className={`font-bold ${hasGammaData ? 'text-slate-500' : 'text-slate-300'}`}>+∞</div>
                  <div className={`text-xs ${hasGammaData ? 'text-slate-600' : 'text-slate-400'}`}>Cola larga</div>
                </div>
              </div>

              <div className={`relative overflow-hidden p-4 bg-linear-to-br rounded-xl border-2 shadow-sm mt-3 ${hasGammaData ? `${colors.gradient} ${colors.border200}` : 'from-slate-50 via-white to-slate-50 border-slate-200'}`}>
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-30 ${hasGammaData ? colors.bg100 : 'bg-slate-100'}`} />
                <div className="relative">
                  <p className={`text-xs leading-relaxed ${hasGammaData ? colors.text700 : 'text-slate-500'}`}>
                    La distribución Gamma es una distribución continua definida en el intervalo (0, ∞), es decir,{' '}
                    <strong>solo toma valores positivos</strong>. Es útil para modelar tiempos de espera, duraciones o variables que no pueden ser negativas, como costes.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DistributionInput label="ALPHA (α) - FORMA" symbol="α" name="alpha"  value={data.alpha}  onChange={onChange} colors={colors} step="0.01" placeholder="2"   />
              <DistributionInput label="LAMBDA (λ) - TASA" symbol="λ" name="lambda" value={data.lambda} onChange={onChange} colors={colors} step="0.01" placeholder="0.5" />
            </div>
            <div className="p-3 bg-yellow-50 border-2 border-yellow-500/40 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>💡 Tip:</strong> α (forma) controla la asimetría, λ (tasa) controla la escala. Media = α/λ
              </p>
            </div>
          </div>
        )}

      </>)}

      {/* ══════════ MODO: CARACTERIZACIÓN ══════════ */}
      {configMode === 'caracterizacion' && (
        <div className="space-y-4">
          <InfoBox
            colors={colors}
            iconEl={<FlaskConical className={`w-6 h-6 ${colors.text600}`} />}
            title="Caracterización estadística"
          >
            Indica los parámetros que conoces. El modelo{' '}
            <strong className={`font-bold ${colors.text900}`}>inferirá la distribución</strong>{' '}
            automáticamente a partir de los valores proporcionados.
          </InfoBox>

          {/* Grid de chips para activar parámetros */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 ml-1">Selecciona los parámetros que conoces</p>
            <div className="flex flex-wrap gap-1.5">
              {CHAR_PARAMS.map(({ key, label, symbol, hint }) => {
                const active = key in activeParams;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleParam(key)}
                    title={hint}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                      active
                        ? `${colors.bg100} ${colors.border200} ${colors.text800} shadow-sm`
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span className={`font-bold ${active ? colors.text600 : 'text-slate-400'}`}>{symbol}</span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campos activos */}
          {Object.keys(activeParams).length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase ml-1">Introduce los valores</p>
              <div className="grid grid-cols-2 gap-3">
                {CHAR_PARAMS.filter(p => p.key in activeParams).map(({ key, label, symbol, hint }) => (
                  <DistributionInput
                    key={key}
                    label={label.toUpperCase()}
                    symbol={symbol}
                    value={activeParams[key]}
                    onChange={e => setParamValue(key, e.target.value)}
                    colors={colors}
                    step="any"
                    placeholder="0"
                    compact
                    labelTitle={hint}
                    onRemove={() => toggleParam(key)}
                  />
                ))}
              </div>
            </div>
          )}

          {Object.keys(activeParams).length === 0 && (
            <div className="flex flex-col items-center bg-white border-slate-200 text-slate-500 border-2 rounded-xl justify-center py-6 text-center">
              <Book className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">Selecciona al menos un parámetro de la lista superior para comenzar.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export { StochasticConfig };
