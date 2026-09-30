import React, { useState } from 'react';
import { motion } from 'motion/react';

interface GeometricTransitionsProps {
  moduleKey: 'pythagoras' | 'circle' | 'similar_triangles' | 'lines_angles' | 'mensuration';
  onCopyText: (text: string, key: string) => void;
  copiedKey: string | null;
}

export const GeometricTransitions: React.FC<GeometricTransitionsProps> = ({
  moduleKey,
  onCopyText,
  copiedKey,
}) => {
  // Pythagoras state
  const [base, setBase] = useState<number>(4);
  const [height, setHeight] = useState<number>(3);
  const [showSquaresProof, setShowSquaresProof] = useState<boolean>(true);

  // Circle state
  const [radius, setRadius] = useState<number>(7);
  const [sectorAngle, setSectorAngle] = useState<number>(60);

  // Similar Triangles (Thales BPT) state
  const [bptRatio, setBptRatio] = useState<number>(0.5); // position of line DE along AB (0.2 to 0.8)

  // Lines & Angles state
  const [transversalAngle, setTransversalAngle] = useState<number>(55); // 30 to 80 deg

  // Mensuration state
  const [solidType, setSolidType] = useState<'cylinder' | 'cone' | 'cube' | 'sphere'>('cylinder');
  const [solidR, setSolidR] = useState<number>(5);
  const [solidH, setSolidH] = useState<number>(8);
  const [isUnfoldedNet, setIsUnfoldedNet] = useState<boolean>(false);

  // Computations - Pythagoras
  const hypotenuse = Math.sqrt(base * base + height * height);
  const angleThetaRad = Math.atan2(height, base);
  const angleThetaDeg = (angleThetaRad * 180) / Math.PI;
  const sinTheta = height / hypotenuse;
  const cosTheta = base / hypotenuse;
  const tanTheta = height / base;

  // Computations - Circle
  const circumference = 2 * Math.PI * radius;
  const circleArea = Math.PI * radius * radius;
  const arcLength = (sectorAngle / 360) * circumference;
  const sectorArea = (sectorAngle / 360) * circleArea;

  // Computations - Similar Triangles
  const abTotal = 10;
  const adVal = Number((abTotal * bptRatio).toFixed(1));
  const dbVal = Number((abTotal - adVal).toFixed(1));
  const ratioAD_DB = (adVal / dbVal).toFixed(2);
  const areaRatio = (bptRatio * bptRatio).toFixed(2);

  // 1. PYTHAGORAS
  if (moduleKey === 'pythagoras') {
    const scale = 14;
    const originX = 60;
    const originY = 160;
    const pA = { x: originX, y: originY };
    const pB = { x: originX + base * scale, y: originY };
    const pC = { x: originX, y: originY - height * scale };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Dynamic SVG Visualizer with ZERO overlapping */}
        <div className="lg:col-span-7 bg-[#f0f4ff] rounded-2xl p-4 sm:p-5 border border-blue-100 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs font-bold text-[#004ac6] mb-2">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">square_foot</span>
              <span>Geometric Vector Proof</span>
            </span>
            <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              a² + b² = c²
            </span>
          </div>

          <div className="w-full max-w-[360px] aspect-square flex items-center justify-center relative">
            <svg viewBox="-60 -60 280 280" className="w-full h-full overflow-visible">
              <defs>
                <pattern id="grid-pyth" width="16" height="16" patternUnits="userSpaceOnUse">
                  <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#dbeafe" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect x="-60" y="-60" width="280" height="280" fill="url(#grid-pyth)" rx="8" />

              {/* Side Proof Squares with non-overlapping centered badge */}
              {showSquaresProof && (
                <g>
                  {/* Square on base (a²) */}
                  <rect
                    x={originX}
                    y={originY}
                    width={base * scale}
                    height={base * scale}
                    fill="#3b82f6"
                    fillOpacity="0.16"
                    stroke="#2563eb"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <g transform={`translate(${originX + (base * scale) / 2}, ${originY + (base * scale) / 2})`}>
                    <rect x="-32" y="-10" width="64" height="20" rx="4" fill="white" stroke="#3b82f6" strokeWidth="1" />
                    <text x="0" y="4" textAnchor="middle" fill="#1d4ed8" fontSize="11" fontWeight="bold">
                      a² = {(base * base).toFixed(0)}
                    </text>
                  </g>

                  {/* Square on height (b²) */}
                  <rect
                    x={originX - height * scale}
                    y={originY - height * scale}
                    width={height * scale}
                    height={height * scale}
                    fill="#10b981"
                    fillOpacity="0.16"
                    stroke="#059669"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <g transform={`translate(${originX - (height * scale) / 2}, ${originY - (height * scale) / 2})`}>
                    <rect x="-32" y="-10" width="64" height="20" rx="4" fill="white" stroke="#059669" strokeWidth="1" />
                    <text x="0" y="4" textAnchor="middle" fill="#047857" fontSize="11" fontWeight="bold">
                      b² = {(height * height).toFixed(0)}
                    </text>
                  </g>
                </g>
              )}

              {/* Right-angled triangle */}
              <polygon
                points={`${pA.x},${pA.y} ${pB.x},${pB.y} ${pC.x},${pC.y}`}
                fill="#60a5fa"
                fillOpacity="0.32"
                stroke="#004ac6"
                strokeWidth="2.5"
              />

              {/* Right angle corner symbol */}
              <path
                d={`M ${originX} ${originY - 12} L ${originX + 12} ${originY - 12} L ${originX + 12} ${originY}`}
                fill="none"
                stroke="#475569"
                strokeWidth="1.5"
              />

              {/* Base dimension label badge below base - safely offset */}
              <g transform={`translate(${(pA.x + pB.x) / 2}, ${pA.y - 12})`}>
                <rect x="-30" y="-8" width="60" height="16" rx="4" fill="white" fillOpacity="0.95" stroke="#93c5fd" strokeWidth="1" />
                <text x="0" y="4" textAnchor="middle" fill="#004ac6" fontSize="10" fontWeight="bold">
                  Base a={base}
                </text>
              </g>

              {/* Height dimension label badge to the right of height line */}
              <g transform={`translate(${pA.x + 14}, ${(pA.y + pC.y) / 2})`}>
                <rect x="0" y="-8" width="58" height="16" rx="4" fill="white" fillOpacity="0.95" stroke="#86efac" strokeWidth="1" />
                <text x="29" y="4" textAnchor="middle" fill="#059669" fontSize="10" fontWeight="bold">
                  Height b={height}
                </text>
              </g>

              {/* Hypotenuse dimension label badge with clean offset */}
              <g transform={`translate(${(pB.x + pC.x) / 2 + 14}, ${(pB.y + pC.y) / 2 - 14})`}>
                <rect x="-38" y="-9" width="76" height="18" rx="4" fill="white" stroke="#f59e0b" strokeWidth="1" />
                <text x="0" y="4" textAnchor="middle" fill="#b45309" fontSize="10" fontWeight="bold">
                  c = {hypotenuse.toFixed(2)}
                </text>
              </g>

              {/* Angle arc */}
              <circle cx={pB.x} cy={pB.y} r="16" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="25" strokeDashoffset="12" />
            </svg>
          </div>

          <div className="mt-3 w-full bg-white px-3.5 py-2.5 rounded-xl border border-blue-200 shadow-xs flex items-center justify-between text-xs font-mono">
            <span className="text-slate-600">Verification:</span>
            <span className="font-bold text-blue-700">{base}² ({base * base})</span>
            <span>+</span>
            <span className="font-bold text-emerald-700">{height}² ({height * height})</span>
            <span>=</span>
            <span className="font-bold text-amber-700">{(hypotenuse * hypotenuse).toFixed(0)} (c²)</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
              ✓ Exact
            </span>
          </div>
        </div>

        {/* Controls & Inspector Column */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                Adjust Dimensions
              </h4>
              <button
                onClick={() => setShowSquaresProof(!showSquaresProof)}
                className={`text-[11px] font-bold px-2 py-0.8 rounded-md transition-colors cursor-pointer ${
                  showSquaresProof ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {showSquaresProof ? 'Hide Squares' : 'Show a² & b² Proof'}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Base (a):</span>
                  <span className="font-bold text-blue-700">{base} units</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="8"
                  value={base}
                  onChange={(e) => setBase(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Height (b):</span>
                  <span className="font-bold text-emerald-700">{height} units</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="8"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-200">
                <span className="text-[11px] text-slate-500 font-bold">Standard Triples:</span>
                {[
                  { b: 4, h: 3, label: '3-4-5' },
                  { b: 6, h: 8, label: '6-8-10' },
                  { b: 5, h: 5, label: 'Isosceles 45°' },
                ].map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setBase(p.b);
                      setHeight(p.h);
                    }}
                    className="px-2 py-0.5 bg-white border border-slate-200 hover:border-blue-400 rounded-md text-[11px] font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Trigonometric Ratios */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Trig Ratios for θ ({angleThetaDeg.toFixed(1)}°)
              </span>
              <button
                onClick={() =>
                  onCopyText(
                    `sin(θ)=${sinTheta.toFixed(3)}, cos(θ)=${cosTheta.toFixed(3)}, tan(θ)=${tanTheta.toFixed(3)}`,
                    'pyth_trig'
                  )
                }
                className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
              >
                {copiedKey === 'pyth_trig' ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2 rounded-xl border border-blue-100">
                <span className="text-[10px] text-slate-500 font-bold block">sin θ (b/c)</span>
                <span className="text-sm font-black text-blue-700">{sinTheta.toFixed(3)}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-blue-100">
                <span className="text-[10px] text-slate-500 font-bold block">cos θ (a/c)</span>
                <span className="text-sm font-black text-indigo-700">{cosTheta.toFixed(3)}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-blue-100">
                <span className="text-[10px] text-slate-500 font-bold block">tan θ (b/a)</span>
                <span className="text-sm font-black text-amber-700">{tanTheta.toFixed(3)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. CIRCLE GEOMETRY & SECTORS
  if (moduleKey === 'circle') {
    const rad = (sectorAngle * Math.PI) / 180;
    const rScaled = 75;
    const targetX = rScaled * Math.cos(rad);
    const targetY = rScaled * Math.sin(rad);
    const largeArcFlag = sectorAngle > 180 ? 1 : 0;
    // Midpoint for sector angle badge
    const midAngleRad = rad / 2;
    const labelBadgeR = 40;
    const labelX = labelBadgeR * Math.cos(midAngleRad);
    const labelY = labelBadgeR * Math.sin(midAngleRad);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-[#f0f4ff] rounded-2xl p-4 sm:p-5 border border-blue-100 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs font-bold text-[#004ac6] mb-2">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">pie_chart</span>
              <span>Circle Geometry &amp; Sector Unrolling</span>
            </span>
            <span className="text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
              θ = {sectorAngle}°
            </span>
          </div>

          <div className="w-full max-w-[340px] aspect-square flex items-center justify-center relative">
            <svg viewBox="-120 -120 240 240" className="w-full h-full overflow-visible">
              {/* Full Circle Base */}
              <circle cx="0" cy="0" r={rScaled} fill="#e0e7ff" stroke="#3b82f6" strokeWidth="2" />

              {/* Sector Pie Wedge */}
              <path
                d={`M 0 0 L ${rScaled} 0 A ${rScaled} ${rScaled} 0 ${largeArcFlag} 1 ${targetX} ${targetY} Z`}
                fill="#f59e0b"
                fillOpacity="0.45"
                stroke="#d97706"
                strokeWidth="2.5"
              />

              {/* Center point */}
              <circle cx="0" cy="0" r="4" fill="#1e293b" />

              {/* Base radius line with non-overlapping pill */}
              <line x1="0" y1="0" x2={rScaled} y2="0" stroke="#1e293b" strokeWidth="2" strokeDasharray="3 3" />
              <g transform="translate(38, -12)">
                <rect x="-24" y="-7" width="48" height="15" rx="3" fill="white" stroke="#94a3b8" strokeWidth="0.8" />
                <text x="0" y="4" textAnchor="middle" fill="#1e293b" fontSize="9" fontWeight="bold">
                  r = {radius} cm
                </text>
              </g>

              {/* Sector Angle Label placed cleanly in middle of sector */}
              <g transform={`translate(${labelX}, ${labelY})`}>
                <rect x="-18" y="-7" width="36" height="15" rx="3" fill="white" stroke="#f59e0b" strokeWidth="1" />
                <text x="0" y="4" textAnchor="middle" fill="#b45309" fontSize="9" fontWeight="bold">
                  {sectorAngle}°
                </text>
              </g>
            </svg>
          </div>

          <div className="mt-3 w-full grid grid-cols-2 gap-2 text-xs text-center font-mono">
            <div className="bg-white p-2.5 rounded-xl border border-amber-200">
              <span className="text-slate-500 block text-[10px]">Arc Length l = (θ/360)2πr</span>
              <strong className="text-amber-800 text-sm">{arcLength.toFixed(2)} cm</strong>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-blue-200">
              <span className="text-slate-500 block text-[10px]">Sector Area = (θ/360)πr²</span>
              <strong className="text-blue-800 text-sm">{sectorArea.toFixed(2)} cm²</strong>
            </div>
          </div>
        </div>

        {/* Sliders */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Adjust Radius &amp; Sector Angle
            </h4>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Radius (r):</span>
                <span className="font-bold text-blue-700">{radius} cm</span>
              </div>
              <input
                type="range"
                min="3"
                max="14"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Central Angle (θ):</span>
                <span className="font-bold text-amber-700">{sectorAngle}°</span>
              </div>
              <input
                type="range"
                min="15"
                max="360"
                step="15"
                value={sectorAngle}
                onChange={(e) => setSectorAngle(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-200">
              <span className="text-[11px] text-slate-500 font-bold">Standard Angles:</span>
              {[60, 90, 180, 270, 360].map((deg) => (
                <button
                  key={deg}
                  onClick={() => setSectorAngle(deg)}
                  className="px-2 py-0.5 bg-white border border-slate-200 hover:border-blue-400 rounded-md text-[11px] font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-200">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block mb-2">
              Full Circle Metrics
            </span>
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-xl border border-amber-100">
                <span className="text-[10px] text-slate-500 block">Circumference (2πr)</span>
                <span className="font-bold text-amber-800">{circumference.toFixed(2)} cm</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-amber-100">
                <span className="text-[10px] text-slate-500 block">Total Area (πr²)</span>
                <span className="font-bold text-orange-800">{circleArea.toFixed(2)} cm²</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. SIMILAR TRIANGLES & THALES BPT
  if (moduleKey === 'similar_triangles') {
    const scale = 22;
    const ax = 140, ay = 20;
    const bx = 30, by = 210;
    const cx = 250, cy = 210;
    // D on AB, E on AC
    const dx = ax + (bx - ax) * bptRatio;
    const dy = ay + (by - ay) * bptRatio;
    const ex = ax + (cx - ax) * bptRatio;
    const ey = ay + (cy - ay) * bptRatio;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-[#f0f4ff] rounded-2xl p-4 sm:p-5 border border-blue-100 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs font-bold text-[#004ac6] mb-2">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">change_history</span>
              <span>Thales Theorem (BPT): DE || BC</span>
            </span>
            <span className="text-[11px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
              AD/DB = AE/EC = {ratioAD_DB}
            </span>
          </div>

          <div className="w-full max-w-[340px] aspect-square flex items-center justify-center relative">
            <svg viewBox="0 0 280 240" className="w-full h-full overflow-visible">
              {/* Outer triangle ABC */}
              <polygon points={`${ax},${ay} ${bx},${by} ${cx},${cy}`} fill="#dbeafe" stroke="#1d4ed8" strokeWidth="2.5" />

              {/* Smaller similar triangle ADE */}
              <polygon points={`${ax},${ay} ${dx},${dy} ${ex},${ey}`} fill="#93c5fd" fillOpacity="0.5" stroke="#2563eb" strokeWidth="2" />

              {/* Parallel line DE */}
              <line x1={dx} y1={dy} x2={ex} y2={ey} stroke="#dc2626" strokeWidth="2.5" strokeDasharray="4 2" />

              {/* Non-overlapping Vertex Badges */}
              <g transform={`translate(${ax}, ${ay - 10})`}>
                <circle r="9" fill="#1e3a8a" />
                <text textAnchor="middle" y="3.5" fill="white" fontSize="10" fontWeight="bold">A</text>
              </g>
              <g transform={`translate(${bx - 12}, ${by + 8})`}>
                <circle r="9" fill="#1e3a8a" />
                <text textAnchor="middle" y="3.5" fill="white" fontSize="10" fontWeight="bold">B</text>
              </g>
              <g transform={`translate(${cx + 12}, ${cy + 8})`}>
                <circle r="9" fill="#1e3a8a" />
                <text textAnchor="middle" y="3.5" fill="white" fontSize="10" fontWeight="bold">C</text>
              </g>
              <g transform={`translate(${dx - 12}, ${dy})`}>
                <circle r="8" fill="#dc2626" />
                <text textAnchor="middle" y="3" fill="white" fontSize="9" fontWeight="bold">D</text>
              </g>
              <g transform={`translate(${ex + 12}, ${ey})`}>
                <circle r="8" fill="#dc2626" />
                <text textAnchor="middle" y="3" fill="white" fontSize="9" fontWeight="bold">E</text>
              </g>
            </svg>
          </div>

          <div className="mt-3 w-full bg-white p-3 rounded-xl border border-blue-200 text-xs font-mono text-center">
            <span className="text-slate-600">Proportionality: </span>
            <strong className="text-blue-700">AD/DB ({adVal}/{dbVal}) = {ratioAD_DB}</strong>
            <span className="mx-2 text-slate-400">|</span>
            <span className="text-slate-600">Area Ratio: </span>
            <strong className="text-emerald-700">Area(ADE)/Area(ABC) = {areaRatio}</strong>
          </div>
        </div>

        {/* Sliders */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Slide Parallel Line DE
            </h4>
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Ratio AD/AB:</span>
                <span className="font-bold text-blue-700">{(bptRatio * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.8"
                step="0.05"
                value={bptRatio}
                onChange={(e) => setBptRatio(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-2xl border border-indigo-100 text-xs space-y-2">
            <span className="font-bold text-indigo-900 uppercase tracking-wider block">
              Thales BPT Axioms
            </span>
            <p className="text-slate-600 leading-relaxed">
              If a line is drawn parallel to one side of a triangle to intersect the other two sides in distinct points, the other two sides are divided in the same ratio.
            </p>
            <div className="p-2 bg-white rounded-lg border border-indigo-100 font-mono text-indigo-950 font-bold text-center">
              AD / DB = AE / EC
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. LINES, TRANSVERSAL & ANGLE PAIRS
  if (moduleKey === 'lines_angles') {
    const acute = transversalAngle;
    const obtuse = 180 - transversalAngle;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-[#f0f4ff] rounded-2xl p-4 sm:p-5 border border-blue-100 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs font-bold text-[#004ac6] mb-2">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">linear_scale</span>
              <span>Parallel Lines &amp; Transversal Angle Pairs</span>
            </span>
            <span className="text-[11px] bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full font-bold">
              Acute = {acute}° • Obtuse = {obtuse}°
            </span>
          </div>

          <div className="w-full max-w-[340px] aspect-square flex items-center justify-center relative">
            <svg viewBox="0 0 280 220" className="w-full h-full overflow-visible">
              {/* Parallel Line 1 */}
              <line x1="20" y1="70" x2="260" y2="70" stroke="#1e293b" strokeWidth="2.5" />
              <text x="264" y="74" fill="#64748b" fontSize="10" fontWeight="bold">L₁</text>

              {/* Parallel Line 2 */}
              <line x1="20" y1="150" x2="260" y2="150" stroke="#1e293b" strokeWidth="2.5" />
              <text x="264" y="154" fill="#64748b" fontSize="10" fontWeight="bold">L₂</text>

              {/* Transversal Line */}
              {(() => {
                const rad = (transversalAngle * Math.PI) / 180;
                const dx = 100 / Math.tan(rad);
                const xMid = 140;
                return (
                  <line
                    x1={xMid - dx}
                    y1="20"
                    x2={xMid + dx}
                    y2="200"
                    stroke="#dc2626"
                    strokeWidth="2.5"
                  />
                );
              })()}

              {/* Intersection 1 badge */}
              <g transform="translate(115, 52)">
                <rect x="-16" y="-7" width="32" height="15" rx="3" fill="#fee2e2" stroke="#dc2626" strokeWidth="0.8" />
                <text textAnchor="middle" y="4" fill="#991b1b" fontSize="9" fontWeight="bold">∠1={acute}°</text>
              </g>

              {/* Alternate Interior Angle 2 badge */}
              <g transform="translate(165, 132)">
                <rect x="-16" y="-7" width="32" height="15" rx="3" fill="#fee2e2" stroke="#dc2626" strokeWidth="0.8" />
                <text textAnchor="middle" y="4" fill="#991b1b" fontSize="9" fontWeight="bold">∠4={acute}°</text>
              </g>
            </svg>
          </div>

          <div className="mt-3 w-full bg-white p-3 rounded-xl border border-blue-200 text-xs text-center font-mono">
            <span className="text-emerald-700 font-bold">Alternate Interior Angles: ∠1 = ∠4 = {acute}°</span>
            <span className="mx-2 text-slate-400">|</span>
            <span className="text-amber-700 font-bold">Co-Interior Sum = {acute}° + {obtuse}° = 180°</span>
          </div>
        </div>

        {/* Sliders */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Transversal Angle
            </h4>
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Angle (θ):</span>
                <span className="font-bold text-red-600">{transversalAngle}°</span>
              </div>
              <input
                type="range"
                min="35"
                max="75"
                value={transversalAngle}
                onChange={(e) => setTransversalAngle(Number(e.target.value))}
                className="w-full accent-red-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. 3D MENSURATION & NET UNFOLDING
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-7 bg-[#f0f4ff] rounded-2xl p-4 sm:p-5 border border-blue-100 flex flex-col items-center">
        <div className="w-full flex items-center justify-between text-xs font-bold text-[#004ac6] mb-2">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">view_in_ar</span>
            <span>{isUnfoldedNet ? 'Unfolded 2D Flat Net' : `3D ${solidType.toUpperCase()} View`}</span>
          </span>
          <button
            onClick={() => setIsUnfoldedNet(!isUnfoldedNet)}
            className="text-[11px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            {isUnfoldedNet ? 'Fold to 3D' : 'Unfold Net'}
          </button>
        </div>

        <div className="w-full max-w-[340px] aspect-square flex items-center justify-center relative">
          {solidType === 'cylinder' && (
            <div className="flex flex-col items-center justify-center">
              {!isUnfoldedNet ? (
                <div className="relative flex flex-col items-center">
                  <div className="w-28 h-9 rounded-full bg-blue-300 border-2 border-blue-600 shadow-sm z-10"></div>
                  <div className="w-28 h-28 bg-gradient-to-r from-blue-400 via-blue-200 to-blue-500 border-x-2 border-blue-600 -mt-4 -mb-4 flex items-center justify-center text-xs font-bold text-blue-900">
                    CSA = 2πrh
                  </div>
                  <div className="w-28 h-9 rounded-full bg-blue-400 border-2 border-blue-600 shadow-md"></div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 rounded-full bg-emerald-200 border-2 border-emerald-600 flex items-center justify-center text-[10px] font-bold text-emerald-900">
                    πr²
                  </div>
                  <div className="w-48 h-20 bg-blue-200 border-2 border-dashed border-blue-600 rounded flex flex-col items-center justify-center text-xs font-bold text-blue-900">
                    <span>Curved Rectangle</span>
                    <span className="text-[10px] font-mono">2πr × h</span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-emerald-200 border-2 border-emerald-600 flex items-center justify-center text-[10px] font-bold text-emerald-900">
                    πr²
                  </div>
                </div>
              )}
            </div>
          )}

          {solidType === 'cone' && (
            <div className="flex flex-col items-center justify-center">
              {!isUnfoldedNet ? (
                <div className="flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[45px] border-l-transparent border-r-[45px] border-r-transparent border-b-[90px] border-b-amber-400"></div>
                  <div className="w-24 h-7 rounded-full bg-amber-500 border border-amber-700 -mt-3.5"></div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-36 h-24 bg-amber-200 border-2 border-amber-600 rounded-t-full flex items-center justify-center text-xs font-bold text-amber-900">
                    Sector (πrl)
                  </div>
                  <div className="w-12 h-12 rounded-full bg-amber-400 border-2 border-amber-700 flex items-center justify-center text-[10px] font-bold text-white">
                    Base πr²
                  </div>
                </div>
              )}
            </div>
          )}

          {solidType === 'cube' && (
            <div className="flex flex-col items-center justify-center">
              {!isUnfoldedNet ? (
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-300 to-indigo-500 border-2 border-indigo-700 shadow-xl rounded flex items-center justify-center text-white font-bold text-xs">
                  Side s = {solidR}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1 p-2 bg-indigo-50 border border-indigo-200 rounded-xl">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="w-10 h-10 bg-indigo-300 border border-indigo-600 rounded flex items-center justify-center text-[9px] font-bold text-indigo-950">
                      s²
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {solidType === 'sphere' && (
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-300 via-purple-500 to-purple-800 shadow-xl border-2 border-purple-400 flex items-center justify-center text-white text-xs font-extrabold">
              4πr²
            </div>
          )}
        </div>

        <div className="mt-3 w-full bg-white p-3 rounded-xl border border-blue-200 text-xs font-mono text-center">
          {solidType === 'cylinder' && (
            <span>
              CSA = 2π({solidR})({solidH}) = <strong className="text-blue-700">{(2 * Math.PI * solidR * solidH).toFixed(1)} cm²</strong> | TSA = <strong className="text-emerald-700">{(2 * Math.PI * solidR * (solidH + solidR)).toFixed(1)} cm²</strong>
            </span>
          )}
          {solidType === 'cone' && (
            <span>
              Slant l = <strong className="text-amber-700">{Math.sqrt(solidR * solidR + solidH * solidH).toFixed(1)} cm</strong> | Volume = <strong className="text-blue-700">{((1/3) * Math.PI * solidR * solidR * solidH).toFixed(1)} cm³</strong>
            </span>
          )}
          {solidType === 'cube' && (
            <span>
              TSA = 6s² = <strong className="text-indigo-700">{6 * solidR * solidR} cm²</strong> | Volume = s³ = <strong className="text-purple-700">{solidR * solidR * solidR} cm³</strong>
            </span>
          )}
          {solidType === 'sphere' && (
            <span>
              Surface = 4πr² = <strong className="text-purple-700">{(4 * Math.PI * solidR * solidR).toFixed(1)} cm²</strong> | Volume = 4/3 πr³ = <strong className="text-indigo-700">{((4/3) * Math.PI * Math.pow(solidR, 3)).toFixed(1)} cm³</strong>
            </span>
          )}
        </div>
      </div>

      <div className="lg:col-span-5 flex flex-col gap-3">
        <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Select 3D Solid
            </h4>
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
              {(['cylinder', 'cone', 'cube', 'sphere'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSolidType(s)}
                  className={`px-2 py-0.5 rounded-md font-bold capitalize transition-colors cursor-pointer ${
                    solidType === s ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
              <span>Radius / Side (r):</span>
              <span className="font-bold text-blue-700">{solidR} cm</span>
            </div>
            <input
              type="range"
              min="2"
              max="10"
              value={solidR}
              onChange={(e) => setSolidR(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {solidType !== 'sphere' && solidType !== 'cube' && (
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Height (h):</span>
                <span className="font-bold text-emerald-700">{solidH} cm</span>
              </div>
              <input
                type="range"
                min="3"
                max="12"
                value={solidH}
                onChange={(e) => setSolidH(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
