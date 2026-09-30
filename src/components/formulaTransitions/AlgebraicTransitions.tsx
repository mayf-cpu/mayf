import React, { useState } from 'react';

interface AlgebraicTransitionsProps {
  moduleKey: 'quadratic' | 'algebraic' | 'linear_systems' | 'progressions' | 'geom_progression';
  onCopyText: (text: string, key: string) => void;
  copiedKey: string | null;
}

export const AlgebraicTransitions: React.FC<AlgebraicTransitionsProps> = ({
  moduleKey,
  onCopyText,
  copiedKey,
}) => {
  // Quadratic state
  const [quadA, setQuadA] = useState<number>(1);
  const [quadB, setQuadB] = useState<number>(-5);
  const [quadC, setQuadC] = useState<number>(6);

  // Algebraic Identity state
  const [algA, setAlgA] = useState<number>(5);
  const [algB, setAlgB] = useState<number>(3);
  const [activeIdentity, setActiveIdentity] = useState<'sumSq' | 'diffSq' | 'diffOfSq'>('sumSq');

  // Linear Systems state
  const [m1, setM1] = useState<number>(1);
  const [c1, setC1] = useState<number>(1);
  const [m2, setM2] = useState<number>(-1);
  const [c2, setC2] = useState<number>(5);

  // Arithmetic Progression (AP) state
  const [apA, setApA] = useState<number>(3);
  const [apD, setApD] = useState<number>(4);
  const [apN, setApN] = useState<number>(6);

  // Geometric Progression (GP) state
  const [gpA, setGpA] = useState<number>(2);
  const [gpR, setGpR] = useState<number>(2); // 0.5, 1.5, 2, 3
  const [gpN, setGpN] = useState<number>(5);

  // Computations - Quadratic
  const discriminant = quadB * quadB - 4 * quadA * quadC;
  const vertexX = -quadB / (2 * quadA);
  const vertexY = -discriminant / (4 * quadA);
  let rootsDisplay = '';
  if (discriminant > 0) {
    const r1 = (-quadB + Math.sqrt(discriminant)) / (2 * quadA);
    const r2 = (-quadB - Math.sqrt(discriminant)) / (2 * quadA);
    rootsDisplay = `x₁ = ${r1.toFixed(2)}, x₂ = ${r2.toFixed(2)}`;
  } else if (discriminant === 0) {
    const r = -quadB / (2 * quadA);
    rootsDisplay = `Equal Roots: x = ${r.toFixed(2)}`;
  } else {
    const realPart = (-quadB / (2 * quadA)).toFixed(2);
    const imagPart = (Math.sqrt(-discriminant) / (2 * Math.abs(quadA))).toFixed(2);
    rootsDisplay = `Complex: ${realPart} ± ${imagPart}i`;
  }

  // Computations - Linear Systems
  const isParallel = m1 === m2 && c1 !== c2;
  const isCoincident = m1 === m2 && c1 === c2;
  const intersectX = !isParallel && !isCoincident ? (c2 - c1) / (m1 - m2) : null;
  const intersectY = intersectX !== null ? m1 * intersectX + c1 : null;

  // Computations - AP
  const apTerms = Array.from({ length: apN }, (_, i) => apA + i * apD);
  const apSum = (apN / 2) * (2 * apA + (apN - 1) * apD);

  // Computations - GP
  const gpTerms = Array.from({ length: gpN }, (_, i) => gpA * Math.pow(gpR, i));
  const gpSum = gpR === 1 ? gpA * gpN : gpA * (1 - Math.pow(gpR, gpN)) / (1 - gpR);
  const gpInfSum = Math.abs(gpR) < 1 ? (gpA / (1 - gpR)).toFixed(2) : 'Diverges (|r| ≥ 1)';

  // 1. QUADRATIC & PARABOLA
  if (moduleKey === 'quadratic') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-[#f0f4ff] rounded-2xl p-4 sm:p-5 border border-blue-100 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs font-bold text-[#004ac6] mb-2">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">ssid_chart</span>
              <span>Parabola: y = {quadA}x² {quadB >= 0 ? `+ ${quadB}` : quadB}x {quadC >= 0 ? `+ ${quadC}` : quadC}</span>
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              discriminant > 0 ? 'bg-emerald-100 text-emerald-800' : discriminant === 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
            }`}>
              D = {discriminant.toFixed(0)}
            </span>
          </div>

          <div className="w-full max-w-[340px] aspect-square flex items-center justify-center relative">
            <svg viewBox="-100 -100 200 200" className="w-full h-full overflow-visible">
              <line x1="-95" y1="0" x2="95" y2="0" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="0" y1="-95" x2="0" y2="95" stroke="#94a3b8" strokeWidth="1.5" />
              <text x="88" y="-4" fontSize="9" fill="#64748b" fontWeight="bold">X</text>
              <text x="5" y="-88" fontSize="9" fill="#64748b" fontWeight="bold">Y</text>

              {/* Parabola curve */}
              {(() => {
                const points: string[] = [];
                const scaleX = 14;
                const scaleY = 4;
                for (let x = -8; x <= 8; x += 0.2) {
                  const y = quadA * x * x + quadB * x + quadC;
                  const svgX = x * scaleX;
                  const svgY = -y * scaleY;
                  if (Math.abs(svgY) < 110) {
                    points.push(`${svgX.toFixed(1)},${svgY.toFixed(1)}`);
                  }
                }
                return (
                  <polyline
                    points={points.join(' ')}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                );
              })()}

              {/* Vertex Point with non-overlapping white pill badge */}
              {(() => {
                const scaleX = 14;
                const scaleY = 4;
                const vx = vertexX * scaleX;
                const vy = -vertexY * scaleY;
                if (Math.abs(vx) <= 80 && Math.abs(vy) <= 80) {
                  return (
                    <g transform={`translate(${vx}, ${vy})`}>
                      <circle r="4.5" fill="#dc2626" stroke="white" strokeWidth="1.5" />
                      <g transform="translate(0, -14)">
                        <rect x="-38" y="-7" width="76" height="15" rx="3" fill="white" stroke="#dc2626" strokeWidth="0.8" />
                        <text textAnchor="middle" y="4" fontSize="8.5" fontWeight="bold" fill="#dc2626">
                          ({vertexX.toFixed(1)}, {vertexY.toFixed(1)})
                        </text>
                      </g>
                    </g>
                  );
                }
                return null;
              })()}
            </svg>
          </div>

          <div className="mt-3 w-full bg-white p-3 rounded-xl border border-blue-200 text-xs text-center font-mono">
            <span className="text-slate-600">Nature of Roots: </span>
            <strong className={`font-bold ${
              discriminant > 0 ? 'text-emerald-700' : discriminant === 0 ? 'text-amber-700' : 'text-rose-700'
            }`}>
              {rootsDisplay}
            </strong>
          </div>
        </div>

        {/* Sliders */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Coefficients (ax² + bx + c)
            </h4>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Coefficient of x² (a):</span>
                <span className="font-bold text-blue-700">{quadA}</span>
              </div>
              <input
                type="range"
                min="-3"
                max="3"
                value={quadA}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setQuadA(val === 0 ? 1 : val);
                }}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Coefficient of x (b):</span>
                <span className="font-bold text-emerald-700">{quadB}</span>
              </div>
              <input
                type="range"
                min="-8"
                max="8"
                value={quadB}
                onChange={(e) => setQuadB(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Constant term (c):</span>
                <span className="font-bold text-amber-700">{quadC}</span>
              </div>
              <input
                type="range"
                min="-8"
                max="8"
                value={quadC}
                onChange={(e) => setQuadC(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-2xl border border-blue-100 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-indigo-900 uppercase tracking-wider">Shreedharacharya Formula</span>
              <button
                onClick={() => onCopyText('x = (-b ± √(b² - 4ac)) / (2a)', 'quad_formula')}
                className="text-indigo-700 font-bold hover:underline cursor-pointer"
              >
                {copiedKey === 'quad_formula' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-indigo-100 text-center font-serif text-sm font-bold text-indigo-950">
              x = (-b ± √(b² - 4ac)) / 2a
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. ALGEBRAIC IDENTITIES AREA BOX
  if (moduleKey === 'algebraic') {
    const total = algA + algB;
    const pctA = (algA / total) * 100;
    const pctB = (algB / total) * 100;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-[#f0f4ff] rounded-2xl p-4 sm:p-5 border border-blue-100 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs font-bold text-[#004ac6] mb-2">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">view_quilt</span>
              <span>Geometric Area Proof: (a + b)² = a² + 2ab + b²</span>
            </span>
            <span className="text-[11px] bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full font-bold">
              Area = {total * total}
            </span>
          </div>

          <div className="w-full max-w-[320px] aspect-square flex items-center justify-center my-2">
            <div
              className="w-full h-full border-2 border-slate-700 rounded-xl overflow-hidden grid shadow-md"
              style={{
                gridTemplateColumns: `${pctA}% ${pctB}%`,
                gridTemplateRows: `${pctA}% ${pctB}%`,
              }}
            >
              <div className="bg-blue-500 text-white font-bold text-xs flex flex-col items-center justify-center border-r border-b border-white/40 p-1">
                <span>a²</span>
                <span className="text-[10px] opacity-90">{algA}×{algA}={algA * algA}</span>
              </div>
              <div className="bg-emerald-500 text-white font-bold text-xs flex flex-col items-center justify-center border-b border-white/40 p-1">
                <span>ab</span>
                <span className="text-[10px] opacity-90">{algA}×{algB}={algA * algB}</span>
              </div>
              <div className="bg-emerald-500 text-white font-bold text-xs flex flex-col items-center justify-center border-r border-white/40 p-1">
                <span>ab</span>
                <span className="text-[10px] opacity-90">{algB}×{algA}={algB * algA}</span>
              </div>
              <div className="bg-amber-500 text-white font-bold text-xs flex flex-col items-center justify-center p-1">
                <span>b²</span>
                <span className="text-[10px] opacity-90">{algB}×{algB}={algB * algB}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 w-full bg-white p-3 rounded-xl border border-blue-200 text-xs font-mono text-center">
            ({algA} + {algB})² = {algA * algA} + 2({algA * algB}) + {algB * algB} ={' '}
            <strong className="text-blue-700">{total * total}</strong>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Lengths a and b
            </h4>
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Length a:</span>
                <span className="font-bold text-blue-700">{algA} units</span>
              </div>
              <input
                type="range"
                min="2"
                max="9"
                value={algA}
                onChange={(e) => setAlgA(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Length b:</span>
                <span className="font-bold text-amber-700">{algB} units</span>
              </div>
              <input
                type="range"
                min="1"
                max="7"
                value={algB}
                onChange={(e) => setAlgB(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. LINEAR SYSTEMS & INTERSECTION
  if (moduleKey === 'linear_systems') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-[#f0f4ff] rounded-2xl p-4 sm:p-5 border border-blue-100 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs font-bold text-[#004ac6] mb-2">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">stacked_line_chart</span>
              <span>Intersection of Two Lines</span>
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              isParallel ? 'bg-amber-100 text-amber-900' : isCoincident ? 'bg-purple-100 text-purple-900' : 'bg-emerald-100 text-emerald-900'
            }`}>
              {isParallel ? 'Parallel (No Solution)' : isCoincident ? 'Coincident (Infinite)' : `Intersection (${intersectX?.toFixed(1)}, ${intersectY?.toFixed(1)})`}
            </span>
          </div>

          <div className="w-full max-w-[340px] aspect-square flex items-center justify-center relative">
            <svg viewBox="-100 -100 200 200" className="w-full h-full overflow-visible">
              <line x1="-95" y1="0" x2="95" y2="0" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="0" y1="-95" x2="0" y2="95" stroke="#94a3b8" strokeWidth="1.5" />

              {/* Line 1: y = m1*x + c1 */}
              {(() => {
                const scale = 12;
                const xA = -8, yA = m1 * xA + c1;
                const xB = 8, yB = m1 * xB + c1;
                return (
                  <line
                    x1={xA * scale}
                    y1={-yA * scale}
                    x2={xB * scale}
                    y2={-yB * scale}
                    stroke="#2563eb"
                    strokeWidth="2.5"
                  />
                );
              })()}

              {/* Line 2: y = m2*x + c2 */}
              {(() => {
                const scale = 12;
                const xA = -8, yA = m2 * xA + c2;
                const xB = 8, yB = m2 * xB + c2;
                return (
                  <line
                    x1={xA * scale}
                    y1={-yA * scale}
                    x2={xB * scale}
                    y2={-yB * scale}
                    stroke="#d97706"
                    strokeWidth="2.5"
                    strokeDasharray={isParallel ? '4 2' : undefined}
                  />
                );
              })()}

              {/* Intersection Point badge */}
              {intersectX !== null && intersectY !== null && Math.abs(intersectX) <= 7 && Math.abs(intersectY) <= 7 && (
                <g transform={`translate(${intersectX * 12}, ${-intersectY * 12})`}>
                  <circle r="5" fill="#16a34a" stroke="white" strokeWidth="1.5" />
                  <g transform="translate(0, -12)">
                    <rect x="-35" y="-6" width="70" height="14" rx="3" fill="white" stroke="#16a34a" strokeWidth="0.8" />
                    <text textAnchor="middle" y="4" fontSize="8" fontWeight="bold" fill="#15803d">
                      P({intersectX.toFixed(1)}, {intersectY.toFixed(1)})
                    </text>
                  </g>
                </g>
              )}
            </svg>
          </div>

          <div className="mt-3 w-full bg-white p-3 rounded-xl border border-blue-200 text-xs font-mono text-center">
            <span className="text-blue-700 font-bold">L₁: y = {m1}x {c1 >= 0 ? `+ ${c1}` : c1}</span>
            <span className="mx-2 text-slate-400">|</span>
            <span className="text-amber-700 font-bold">L₂: y = {m2}x {c2 >= 0 ? `+ ${c2}` : c2}</span>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Adjust Slopes &amp; Intercepts
            </h4>
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Slope L₁ (m₁):</span>
                <span className="font-bold text-blue-700">{m1}</span>
              </div>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.5"
                value={m1}
                onChange={(e) => setM1(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Slope L₂ (m₂):</span>
                <span className="font-bold text-amber-700">{m2}</span>
              </div>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.5"
                value={m2}
                onChange={(e) => setM2(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. ARITHMETIC PROGRESSION (AP)
  if (moduleKey === 'progressions') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-[#f0f4ff] rounded-2xl p-4 sm:p-5 border border-blue-100 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs font-bold text-[#004ac6] mb-2">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">stairs</span>
              <span>Arithmetic Progression (aₙ = a + (n-1)d)</span>
            </span>
            <span className="text-[11px] bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full font-bold">
              Sum Sₙ = {apSum}
            </span>
          </div>

          <div className="w-full max-w-[340px] h-44 flex items-end justify-center gap-2 my-2 px-3 border-b-2 border-slate-700">
            {apTerms.map((term, i) => {
              const maxVal = Math.max(...apTerms, 1);
              const heightPct = Math.max(12, (term / maxVal) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-700">{term}</span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-indigo-400 border border-blue-700 shadow-xs"
                  ></div>
                  <span className="text-[9px] font-semibold text-slate-500">n={i + 1}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 w-full bg-white p-3 rounded-xl border border-blue-200 text-xs font-mono text-center">
            First Term a={apA} • Difference d=+{apD} • Total Sₙ = <strong className="text-blue-700">{apSum}</strong>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              AP Parameters
            </h4>
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>First Term (a):</span>
                <span className="font-bold text-blue-700">{apA}</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                value={apA}
                onChange={(e) => setApA(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Common Difference (d):</span>
                <span className="font-bold text-emerald-700">{apD}</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                value={apD}
                onChange={(e) => setApD(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. GEOMETRIC PROGRESSION (GP)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-7 bg-[#f0f4ff] rounded-2xl p-4 sm:p-5 border border-blue-100 flex flex-col items-center">
        <div className="w-full flex items-center justify-between text-xs font-bold text-[#004ac6] mb-2">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>Geometric Progression (aₙ = a × rⁿ⁻¹)</span>
          </span>
          <span className="text-[11px] bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full font-bold">
            Ratio r = {gpR}
          </span>
        </div>

        <div className="w-full max-w-[340px] h-44 flex items-end justify-center gap-2 my-2 px-3 border-b-2 border-slate-700">
          {gpTerms.map((term, i) => {
            const maxVal = Math.max(...gpTerms, 1);
            const heightPct = Math.max(10, Math.min(100, (term / maxVal) * 100));
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-purple-800">{term.toFixed(1)}</span>
                <div
                  style={{ height: `${heightPct}%` }}
                  className="w-full rounded-t-lg bg-gradient-to-t from-purple-600 to-pink-400 border border-purple-700 shadow-xs"
                ></div>
                <span className="text-[9px] font-semibold text-slate-500">n={i + 1}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 w-full bg-white p-3 rounded-xl border border-blue-200 text-xs font-mono text-center">
          Finite Sum Sₙ = <strong className="text-purple-700">{gpSum.toFixed(2)}</strong> | Infinite S_∞ = <strong className="text-pink-700">{gpInfSum}</strong>
        </div>
      </div>

      <div className="lg:col-span-5 flex flex-col gap-3">
        <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
            GP Parameters
          </h4>
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
              <span>First Term (a):</span>
              <span className="font-bold text-purple-700">{gpA}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={gpA}
              onChange={(e) => setGpA(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
              <span>Common Ratio (r):</span>
              <span className="font-bold text-pink-700">{gpR}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.5"
              value={gpR}
              onChange={(e) => setGpR(Number(e.target.value))}
              className="w-full accent-pink-600 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
