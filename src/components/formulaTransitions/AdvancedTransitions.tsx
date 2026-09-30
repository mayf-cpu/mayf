import React, { useState } from 'react';

interface AdvancedTransitionsProps {
  moduleKey: 'unit_circle' | 'coordinate_geom' | 'fractions' | 'statistics' | 'probability' | 'calculus';
  onCopyText: (text: string, key: string) => void;
  copiedKey: string | null;
}

export const AdvancedTransitions: React.FC<AdvancedTransitionsProps> = ({
  moduleKey,
  onCopyText,
  copiedKey,
}) => {
  // Unit Circle state
  const [unitAngleDeg, setUnitAngleDeg] = useState<number>(45);

  // Coordinate Geometry state
  const [ptAX, setPtAX] = useState<number>(1);
  const [ptAY, setPtAY] = useState<number>(2);
  const [ptBX, setPtBX] = useState<number>(7);
  const [ptBY, setPtBY] = useState<number>(6);
  const [secRatioM, setSecRatioM] = useState<number>(2);
  const [secRatioN, setSecRatioN] = useState<number>(1);

  // Fractions state
  const [fracNum, setFracNum] = useState<number>(3);
  const [fracDen, setFracDen] = useState<number>(4);

  // Statistics state
  const [statMeanDelta, setStatMeanDelta] = useState<number>(4);

  // Probability state
  const [probTrials, setProbTrials] = useState<number>(6);
  const [probP, setProbP] = useState<number>(0.5);

  // Calculus state
  const [calcX, setCalcX] = useState<number>(2);
  const [calcDeltaX, setCalcDeltaX] = useState<number>(1); // approaches 0

  // Computations - Unit circle
  const unitAngleRad = (unitAngleDeg * Math.PI) / 180;
  const cosVal = Math.cos(unitAngleRad);
  const sinVal = Math.sin(unitAngleRad);
  const tanVal = Math.abs(cosVal) > 0.001 ? sinVal / cosVal : Infinity;
  let quadrant = 'Q1 (+, +)';
  if (unitAngleDeg > 90 && unitAngleDeg <= 180) quadrant = 'Q2 (-, +) [Sin+]';
  else if (unitAngleDeg > 180 && unitAngleDeg <= 270) quadrant = 'Q3 (-, -) [Tan+]';
  else if (unitAngleDeg > 270) quadrant = 'Q4 (+, -) [Cos+]';

  // Computations - Coordinate Geom
  const coordDist = Math.sqrt(Math.pow(ptBX - ptAX, 2) + Math.pow(ptBY - ptAY, 2));
  const midX = (ptAX + ptBX) / 2;
  const midY = (ptAY + ptBY) / 2;
  const secX = (secRatioM * ptBX + secRatioN * ptAX) / (secRatioM + secRatioN);
  const secY = (secRatioM * ptBY + secRatioN * ptAY) / (secRatioM + secRatioN);

  // Computations - Fractions
  const fracDecimal = fracNum / fracDen;
  const fracPct = (fracDecimal * 100).toFixed(1);

  // Computations - Calculus
  const fX = calcX * calcX;
  const fXDelta = (calcX + calcDeltaX) * (calcX + calcDeltaX);
  const secantSlope = (fXDelta - fX) / calcDeltaX;
  const tangentSlope = 2 * calcX; // derivative of x^2

  // 1. UNIT CIRCLE & TRIGONOMETRIC WAVES
  if (moduleKey === 'unit_circle') {
    const rScaled = 70;
    const ptX = rScaled * cosVal;
    const ptY = -rScaled * sinVal;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-[#f0f4ff] rounded-2xl p-4 sm:p-5 border border-blue-100 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs font-bold text-[#004ac6] mb-2">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">rotate_right</span>
              <span>Unit Circle &amp; Wave Coordinates</span>
            </span>
            <span className="text-[11px] bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full font-bold">
              {quadrant}
            </span>
          </div>

          <div className="w-full max-w-[340px] aspect-square flex items-center justify-center relative">
            <svg viewBox="-100 -100 200 200" className="w-full h-full overflow-visible">
              <circle cx="0" cy="0" r={rScaled} fill="#e0e7ff" stroke="#3b82f6" strokeWidth="2" />
              <line x1="-95" y1="0" x2="95" y2="0" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="0" y1="-95" x2="0" y2="95" stroke="#94a3b8" strokeWidth="1.5" />

              {/* Triangle projections */}
              <line x1="0" y1="0" x2={ptX} y2={ptY} stroke="#1d4ed8" strokeWidth="2.5" />
              <line x1={ptX} y1="0" x2={ptX} y2={ptY} stroke="#dc2626" strokeWidth="2" strokeDasharray="3 2" />
              <line x1="0" y1={ptY} x2={ptX} y2={ptY} stroke="#16a34a" strokeWidth="2" strokeDasharray="3 2" />

              {/* Angle arc */}
              <circle cx="0" cy="0" r="22" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="35" strokeDashoffset="10" />

              {/* Point P(cos θ, sin θ) with white pill badge */}
              <circle cx={ptX} cy={ptY} r="4.5" fill="#dc2626" stroke="white" strokeWidth="1.5" />
              <g transform={`translate(${ptX > 0 ? ptX + 38 : ptX - 38}, ${ptY > 0 ? ptY + 12 : ptY - 12})`}>
                <rect x="-35" y="-7" width="70" height="15" rx="3" fill="white" stroke="#dc2626" strokeWidth="0.8" />
                <text textAnchor="middle" y="4" fontSize="8.5" fontWeight="bold" fill="#dc2626">
                  P({cosVal.toFixed(2)}, {sinVal.toFixed(2)})
                </text>
              </g>
            </svg>
          </div>

          <div className="mt-3 w-full grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="bg-white p-2 rounded-xl border border-blue-100">
              <span className="text-[10px] text-slate-500 block">cos({unitAngleDeg}°)</span>
              <strong className="text-blue-700">{cosVal.toFixed(3)}</strong>
            </div>
            <div className="bg-white p-2 rounded-xl border border-rose-100">
              <span className="text-[10px] text-slate-500 block">sin({unitAngleDeg}°)</span>
              <strong className="text-rose-700">{sinVal.toFixed(3)}</strong>
            </div>
            <div className="bg-white p-2 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-slate-500 block">tan({unitAngleDeg}°)</span>
              <strong className="text-emerald-700">{Math.abs(tanVal) < 50 ? tanVal.toFixed(3) : '∞'}</strong>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Rotation Angle θ (0° to 360°)
            </h4>
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Angle θ:</span>
                <span className="font-bold text-blue-700">{unitAngleDeg}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={unitAngleDeg}
                onChange={(e) => setUnitAngleDeg(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-200">
              <span className="text-[11px] text-slate-500 font-bold">Standard Angles:</span>
              {[0, 30, 45, 60, 90, 180, 270, 360].map((deg) => (
                <button
                  key={deg}
                  onClick={() => setUnitAngleDeg(deg)}
                  className="px-2 py-0.5 bg-white border border-slate-200 hover:border-blue-400 rounded-md text-[11px] font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-2xl border border-indigo-100 text-xs">
            <span className="font-bold text-indigo-900 uppercase tracking-wider block mb-1">
              Pythagorean Identity Verification
            </span>
            <div className="p-2 bg-white rounded-lg border border-indigo-100 text-center font-mono font-bold text-indigo-950">
              sin²({unitAngleDeg}°) + cos²({unitAngleDeg}°) = {(sinVal * sinVal + cosVal * cosVal).toFixed(2)} = 1.0
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. COORDINATE GEOMETRY & SECTION FORMULA
  if (moduleKey === 'coordinate_geom') {
    const scale = 14;
    const ax = ptAX * scale, ay = -ptAY * scale;
    const bx = ptBX * scale, by = -ptBY * scale;
    const px = secX * scale, py = -secY * scale;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-[#f0f4ff] rounded-2xl p-4 sm:p-5 border border-blue-100 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs font-bold text-[#004ac6] mb-2">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">location_searching</span>
              <span>Distance &amp; Section Formula</span>
            </span>
            <span className="text-[11px] bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full font-bold">
              Dist = {coordDist.toFixed(2)} units
            </span>
          </div>

          <div className="w-full max-w-[340px] aspect-square flex items-center justify-center relative">
            <svg viewBox="-10 -110 130 130" className="w-full h-full overflow-visible">
              <line x1="0" y1="0" x2="120" y2="0" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="0" y1="0" x2="0" y2="-110" stroke="#94a3b8" strokeWidth="1.5" />

              {/* Segment AB */}
              <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#2563eb" strokeWidth="2.5" />

              {/* Points A, B, and Divider Point P */}
              <circle cx={ax} cy={ay} r="4.5" fill="#1e3a8a" />
              <g transform={`translate(${ax}, ${ay - 10})`}>
                <rect x="-24" y="-6" width="48" height="13" rx="3" fill="white" stroke="#1e3a8a" strokeWidth="0.8" />
                <text textAnchor="middle" y="4" fontSize="8" fontWeight="bold" fill="#1e3a8a">
                  A({ptAX},{ptAY})
                </text>
              </g>

              <circle cx={bx} cy={by} r="4.5" fill="#1e3a8a" />
              <g transform={`translate(${bx}, ${by - 10})`}>
                <rect x="-24" y="-6" width="48" height="13" rx="3" fill="white" stroke="#1e3a8a" strokeWidth="0.8" />
                <text textAnchor="middle" y="4" fontSize="8" fontWeight="bold" fill="#1e3a8a">
                  B({ptBX},{ptBY})
                </text>
              </g>

              <circle cx={px} cy={py} r="5" fill="#dc2626" stroke="white" strokeWidth="1.5" />
              <g transform={`translate(${px}, ${py + 12})`}>
                <rect x="-32" y="-6" width="64" height="13" rx="3" fill="#fee2e2" stroke="#dc2626" strokeWidth="0.8" />
                <text textAnchor="middle" y="4" fontSize="8" fontWeight="bold" fill="#991b1b">
                  P({secX.toFixed(1)},{secY.toFixed(1)})
                </text>
              </g>
            </svg>
          </div>

          <div className="mt-3 w-full bg-white p-3 rounded-xl border border-blue-200 text-xs font-mono text-center">
            Section Ratio m:n = {secRatioM}:{secRatioN} → <strong className="text-red-700">P = ({secX.toFixed(2)}, {secY.toFixed(2)})</strong>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Coordinates &amp; Ratio
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-600 block mb-0.5">Ratio m:</span>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={secRatioM}
                  onChange={(e) => setSecRatioM(Number(e.target.value))}
                  className="w-full p-1.5 border rounded-lg"
                />
              </div>
              <div>
                <span className="text-slate-600 block mb-0.5">Ratio n:</span>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={secRatioN}
                  onChange={(e) => setSecRatioN(Number(e.target.value))}
                  className="w-full p-1.5 border rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. FRACTIONS, DECIMALS & PERCENTAGES
  if (moduleKey === 'fractions') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-[#f0f4ff] rounded-2xl p-4 sm:p-5 border border-blue-100 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs font-bold text-[#004ac6] mb-2">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">percent</span>
              <span>Fraction • Decimal • Percentage Morph</span>
            </span>
            <span className="text-[11px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
              {fracPct}%
            </span>
          </div>

          <div className="w-full max-w-[340px] flex flex-col items-center gap-4 my-3">
            {/* Percentage Fill Bar */}
            <div className="w-full h-8 bg-slate-200 rounded-xl overflow-hidden border border-slate-300 relative shadow-inner">
              <div
                style={{ width: `${Math.min(100, Number(fracPct))}%` }}
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 flex items-center justify-end pr-2"
              >
                <span className="text-[10px] font-bold text-white">{fracPct}%</span>
              </div>
            </div>

            {/* Slices Grid */}
            <div className="flex items-center gap-1 flex-wrap justify-center p-2 bg-white rounded-xl border border-blue-100">
              {Array.from({ length: fracDen }).map((_, i) => (
                <div
                  key={i}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs border transition-all ${
                    i < fracNum
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}
                >
                  1/{fracDen}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 w-full grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="bg-white p-2 rounded-xl border border-blue-100">
              <span className="text-[10px] text-slate-500 block">Fraction</span>
              <strong className="text-blue-700">{fracNum} / {fracDen}</strong>
            </div>
            <div className="bg-white p-2 rounded-xl border border-purple-100">
              <span className="text-[10px] text-slate-500 block">Decimal</span>
              <strong className="text-purple-700">{fracDecimal.toFixed(3)}</strong>
            </div>
            <div className="bg-white p-2 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-slate-500 block">Percentage</span>
              <strong className="text-emerald-700">{fracPct}%</strong>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Numerator &amp; Denominator
            </h4>
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Numerator (parts selected):</span>
                <span className="font-bold text-blue-700">{fracNum}</span>
              </div>
              <input
                type="range"
                min="1"
                max={fracDen}
                value={fracNum}
                onChange={(e) => setFracNum(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Denominator (total equal parts):</span>
                <span className="font-bold text-indigo-700">{fracDen}</span>
              </div>
              <input
                type="range"
                min="2"
                max="12"
                value={fracDen}
                onChange={(e) => {
                  const d = Number(e.target.value);
                  setFracDen(d);
                  if (fracNum > d) setFracNum(d);
                }}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. STATISTICS: MEAN, MEDIAN, MODE
  if (moduleKey === 'statistics') {
    const mean = 5.2 + statMeanDelta * 0.4;
    const median = 5.0;
    const mode = 3 * median - 2 * mean;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-[#f0f4ff] rounded-2xl p-4 sm:p-5 border border-blue-100 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs font-bold text-[#004ac6] mb-2">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">bar_chart</span>
              <span>Central Tendency &amp; Empirical Formula</span>
            </span>
            <span className="text-[11px] bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full font-bold">
              3 Median = Mode + 2 Mean
            </span>
          </div>

          <div className="w-full max-w-[340px] h-40 flex items-end justify-center gap-3 my-2 px-3 border-b-2 border-slate-700">
            <div className="flex-1 flex flex-col items-center">
              <span className="text-[10px] font-bold text-blue-700">{mean.toFixed(1)}</span>
              <div className="w-full h-24 bg-blue-500 rounded-t-lg"></div>
              <span className="text-[10px] font-bold text-slate-600 mt-1">Mean (x̄)</span>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <span className="text-[10px] font-bold text-emerald-700">{median.toFixed(1)}</span>
              <div className="w-full h-20 bg-emerald-500 rounded-t-lg"></div>
              <span className="text-[10px] font-bold text-slate-600 mt-1">Median</span>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <span className="text-[10px] font-bold text-amber-700">{mode.toFixed(1)}</span>
              <div className="w-full h-16 bg-amber-500 rounded-t-lg"></div>
              <span className="text-[10px] font-bold text-slate-600 mt-1">Mode (Z)</span>
            </div>
          </div>

          <div className="mt-3 w-full bg-white p-3 rounded-xl border border-blue-200 text-xs font-mono text-center">
            Empirical Relationship: Mode = 3({median}) - 2({mean.toFixed(1)}) = <strong className="text-amber-700">{mode.toFixed(1)}</strong>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Shift Distribution Skewness
            </h4>
            <input
              type="range"
              min="-3"
              max="5"
              value={statMeanDelta}
              onChange={(e) => setStatMeanDelta(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
        </div>
      </div>
    );
  }

  // 5. PROBABILITY & BINOMIAL
  if (moduleKey === 'probability') {
    const ev = probTrials * probP;
    const variance = probTrials * probP * (1 - probP);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-[#f0f4ff] rounded-2xl p-4 sm:p-5 border border-blue-100 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs font-bold text-[#004ac6] mb-2">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">casino</span>
              <span>Binomial Distribution B(n={probTrials}, p={probP})</span>
            </span>
            <span className="text-[11px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
              E(X) = np = {ev.toFixed(1)}
            </span>
          </div>

          <div className="w-full max-w-[340px] h-40 flex items-end justify-center gap-2 my-2 px-3 border-b-2 border-slate-700">
            {Array.from({ length: probTrials + 1 }).map((_, k) => {
              // Binomial formula nCk * p^k * (1-p)^(n-k)
              const coeff = k === 0 || k === probTrials ? 1 : k === 1 || k === probTrials - 1 ? probTrials : (probTrials * (probTrials - 1)) / 2;
              const probK = coeff * Math.pow(probP, k) * Math.pow(1 - probP, probTrials - k);
              const heightPct = Math.max(8, probK * 180);

              return (
                <div key={k} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold text-slate-700">{(probK * 100).toFixed(0)}%</span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-sm"
                  ></div>
                  <span className="text-[9px] text-slate-500">k={k}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 w-full bg-white p-3 rounded-xl border border-blue-200 text-xs font-mono text-center">
            Expected Value E(X) = <strong className="text-emerald-700">{ev.toFixed(1)}</strong> | Variance = <strong className="text-teal-700">{variance.toFixed(2)}</strong>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Trials (n) &amp; Probability (p)
            </h4>
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Trials (n):</span>
                <span className="font-bold text-emerald-700">{probTrials}</span>
              </div>
              <input
                type="range"
                min="3"
                max="8"
                value={probTrials}
                onChange={(e) => setProbTrials(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Success Probability (p):</span>
                <span className="font-bold text-teal-700">{probP}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.1"
                value={probP}
                onChange={(e) => setProbP(Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6. CALCULUS: TANGENT & DERIVATIVE TRANSITION
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-7 bg-[#f0f4ff] rounded-2xl p-4 sm:p-5 border border-blue-100 flex flex-col items-center">
        <div className="w-full flex items-center justify-between text-xs font-bold text-[#004ac6] mb-2">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">show_chart</span>
            <span>Derivative: Secant Slope → Tangent Slope as Δx → 0</span>
          </span>
          <span className="text-[11px] bg-rose-100 text-rose-900 px-2 py-0.5 rounded-full font-bold">
            f'(x) = 2x = {tangentSlope.toFixed(1)}
          </span>
        </div>

        <div className="w-full max-w-[340px] aspect-square flex items-center justify-center relative">
          <svg viewBox="-20 -100 120 120" className="w-full h-full overflow-visible">
            <line x1="-15" y1="0" x2="95" y2="0" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="0" y1="5" x2="0" y2="-95" stroke="#94a3b8" strokeWidth="1.5" />

            {/* Parabola Curve y = x^2 */}
            {(() => {
              const pts: string[] = [];
              for (let x = 0; x <= 6; x += 0.2) {
                const y = x * x;
                pts.push(`${x * 14},${-y * 2.2}`);
              }
              return <polyline points={pts.join(' ')} fill="none" stroke="#2563eb" strokeWidth="2.5" />;
            })()}

            {/* Point P(x, x^2) */}
            <circle cx={calcX * 14} cy={-fX * 2.2} r="4.5" fill="#1e3a8a" />

            {/* Point Q(x+Δx, (x+Δx)^2) */}
            <circle cx={(calcX + calcDeltaX) * 14} cy={-fXDelta * 2.2} r="4.5" fill="#dc2626" />

            {/* Secant line */}
            <line
              x1={(calcX - 1) * 14}
              y1={-(fX - secantSlope) * 2.2}
              x2={(calcX + calcDeltaX + 1) * 14}
              y2={-(fXDelta + secantSlope) * 2.2}
              stroke="#dc2626"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
          </svg>
        </div>

        <div className="mt-3 w-full bg-white p-3 rounded-xl border border-blue-200 text-xs font-mono text-center">
          Secant Slope [Δy/Δx] = <strong className="text-rose-700">{secantSlope.toFixed(2)}</strong> → Instantaneous Tangent = <strong className="text-blue-700">{tangentSlope.toFixed(2)}</strong>
        </div>
      </div>

      <div className="lg:col-span-5 flex flex-col gap-3">
        <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
            Base Point x &amp; Increment Δx
          </h4>
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
              <span>Point x:</span>
              <span className="font-bold text-blue-700">{calcX}</span>
            </div>
            <input
              type="range"
              min="1"
              max="4"
              step="0.5"
              value={calcX}
              onChange={(e) => setCalcX(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
              <span>Secant Δx (drag toward 0 to morph):</span>
              <span className="font-bold text-rose-700">{calcDeltaX.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="2"
              step="0.05"
              value={calcDeltaX}
              onChange={(e) => setCalcDeltaX(Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
