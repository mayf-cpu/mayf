import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface FormulaDeckSandboxProps {
  onAskAiAboutFormula?: (formulaName: string, formulaEquation: string) => void;
  onDownloadSheet?: (title: string, size: string) => void;
  initialModule?: string;
  isStandalonePage?: boolean;
}

type ModuleKey = 'pythagoras' | 'quadratic' | 'algebraic' | 'circle' | 'mensuration' | 'progressions';

export const FormulaDeckSandbox: React.FC<FormulaDeckSandboxProps> = ({
  onAskAiAboutFormula,
  onDownloadSheet,
  initialModule = 'pythagoras',
  isStandalonePage = false,
}) => {
  const [activeModule, setActiveModule] = useState<ModuleKey>(initialModule as ModuleKey);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Module 1: Pythagoras & Trig
  const [base, setBase] = useState<number>(4);
  const [height, setHeight] = useState<number>(3);
  const [showSquaresProof, setShowSquaresProof] = useState<boolean>(true);

  // Module 2: Quadratic
  const [quadA, setQuadA] = useState<number>(1);
  const [quadB, setQuadB] = useState<number>(-5);
  const [quadC, setQuadC] = useState<number>(6);

  // Module 3: Algebraic Identity
  const [algA, setAlgA] = useState<number>(5);
  const [algB, setAlgB] = useState<number>(3);
  const [activeIdentity, setActiveIdentity] = useState<'sumSq' | 'diffSq' | 'diffOfSq'>('sumSq');

  // Module 4: Circle & Pi
  const [radius, setRadius] = useState<number>(7);
  const [sectorAngle, setSectorAngle] = useState<number>(60);
  const [unrollPerimeter, setUnrollPerimeter] = useState<boolean>(false);

  // Module 5: 3D Mensuration
  const [solidType, setSolidType] = useState<'cylinder' | 'cone' | 'sphere'>('cylinder');
  const [solidR, setSolidR] = useState<number>(5);
  const [solidH, setSolidH] = useState<number>(8);
  const [isUnfoldedNet, setIsUnfoldedNet] = useState<boolean>(false);

  // Module 6: Progressions
  const [apA, setApA] = useState<number>(3);
  const [apD, setApD] = useState<number>(4);
  const [apN, setApN] = useState<number>(6);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Computations
  const hypotenuse = Math.sqrt(base * base + height * height);
  const angleThetaRad = Math.atan2(height, base);
  const angleThetaDeg = (angleThetaRad * 180) / Math.PI;
  const sinTheta = height / hypotenuse;
  const cosTheta = base / hypotenuse;
  const tanTheta = height / base;

  // Quadratic computations
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
    rootsDisplay = `Double root: x = ${r.toFixed(2)}`;
  } else {
    const realPart = (-quadB / (2 * quadA)).toFixed(2);
    const imagPart = (Math.sqrt(-discriminant) / (2 * Math.abs(quadA))).toFixed(2);
    rootsDisplay = `Complex: ${realPart} ± ${imagPart}i`;
  }

  // Circle computations
  const circumference = 2 * Math.PI * radius;
  const circleArea = Math.PI * radius * radius;
  const arcLength = (sectorAngle / 360) * circumference;
  const sectorArea = (sectorAngle / 360) * circleArea;

  // AP computations
  const apTerms = Array.from({ length: apN }, (_, i) => apA + i * apD);
  const apSum = (apN / 2) * (2 * apA + (apN - 1) * apD);

  const modulesList: { key: ModuleKey; label: string; icon: string; grade: string }[] = [
    { key: 'pythagoras', label: 'Pythagorean & Trig', icon: 'square_foot', grade: 'Class 7-10' },
    { key: 'quadratic', label: 'Quadratic & Parabola', icon: 'ssid_chart', grade: 'Class 9-10' },
    { key: 'algebraic', label: 'Algebraic Area Box', icon: 'view_quilt', grade: 'Class 7-9' },
    { key: 'circle', label: 'Circle & Pi Unroller', icon: 'pie_chart', grade: 'Class 6-10' },
    { key: 'mensuration', label: '3D Solid Net Unfolding', icon: 'deployed_code', grade: 'Class 8-10' },
    { key: 'progressions', label: 'Arithmetic Progression', icon: 'bar_chart', grade: 'Class 10' },
  ];

  return (
    <div className={`w-full bg-[#f9f9ff] text-[#111c2d] rounded-2xl sm:rounded-3xl border border-blue-100 shadow-xl overflow-hidden ${isStandalonePage ? 'max-w-6xl mx-auto' : ''}`}>
      {/* Top Banner & Module Selector */}
      <div className="bg-gradient-to-r from-[#003b9e] via-[#004ac6] to-[#1e58d8] text-white p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold tracking-wide uppercase text-blue-100 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Mathematical Playground
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
              Interactive Formula Deck & Sandbox
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl">
              Interact with mathematical formulas dynamically. Drag the sliders, see geometric proofs morph in real-time, and build intuitive mastery.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onDownloadSheet && (
              <button
                onClick={() => onDownloadSheet('Formula Deck Complete Handbook', '3.8 MB')}
                className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-md transition-all cursor-pointer"
                title="Download Printable Formula Cheatsheet"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Print Cheatsheet</span>
              </button>
            )}
            {onAskAiAboutFormula && (
              <button
                onClick={() => onAskAiAboutFormula(modulesList.find(m => m.key === activeModule)?.label || 'Formula', '')}
                className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-md transition-all cursor-pointer"
                title="Ask AI Teacher about this topic"
              >
                <span className="material-symbols-outlined text-[18px]">psychology</span>
                <span>Ask AI Teacher</span>
              </button>
            )}
          </div>
        </div>

        {/* Modules navigation pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-4 mt-2 border-t border-white/10">
          {modulesList.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveModule(m.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeModule === m.key
                  ? 'bg-white text-[#004ac6] shadow-lg scale-102 font-extrabold'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">{m.icon}</span>
              <span>{m.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${activeModule === m.key ? 'bg-blue-100 text-[#004ac6]' : 'bg-black/20 text-blue-200'}`}>
                {m.grade}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Sandbox Body */}
      <div className="p-4 sm:p-6 lg:p-8 bg-white min-h-[460px]">
        <AnimatePresence mode="wait">
          {/* MODULE 1: PYTHAGORAS & TRIG */}
          {activeModule === 'pythagoras' && (
            <motion.div
              key="pythagoras"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
              {/* Interactive Canvas */}
              <div className="lg:col-span-7 bg-[#f0f4ff] rounded-2xl p-4 sm:p-6 border border-blue-100 flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden">
                <div className="absolute top-3 left-4 text-xs font-bold text-[#004ac6] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">draw</span>
                  Dynamic SVG Geometry Canvas
                </div>

                {/* SVG Visualizer */}
                <div className="w-full max-w-[340px] aspect-square flex items-center justify-center my-4">
                  <svg viewBox="-40 -40 260 260" className="w-full h-full overflow-visible">
                    {/* Grid background */}
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#dbeafe" strokeWidth="0.8" />
                      </pattern>
                    </defs>
                    <rect x="-40" y="-40" width="260" height="260" fill="url(#grid)" />

                    {/* Scale factor for rendering */}
                    {(() => {
                      const scale = 14;
                      const originX = 20;
                      const originY = 160;
                      const pA = { x: originX, y: originY }; // Right angle vertex
                      const pB = { x: originX + base * scale, y: originY }; // Base endpoint
                      const pC = { x: originX, y: originY - height * scale }; // Top vertex

                      return (
                        <g>
                          {/* Proof squares if enabled */}
                          {showSquaresProof && (
                            <>
                              {/* Square on base (a²) */}
                              <rect
                                x={originX}
                                y={originY}
                                width={base * scale}
                                height={base * scale}
                                fill="#3b82f6"
                                fillOpacity="0.18"
                                stroke="#2563eb"
                                strokeWidth="1.5"
                                strokeDasharray="3 3"
                              />
                              <text
                                x={originX + (base * scale) / 2}
                                y={originY + (base * scale) / 2 + 5}
                                textAnchor="middle"
                                fill="#1d4ed8"
                                fontSize="12"
                                fontWeight="bold"
                              >
                                a² = {(base * base).toFixed(0)}
                              </text>

                              {/* Square on height (b²) */}
                              <rect
                                x={originX - height * scale}
                                y={originY - height * scale}
                                width={height * scale}
                                height={height * scale}
                                fill="#10b981"
                                fillOpacity="0.18"
                                stroke="#059669"
                                strokeWidth="1.5"
                                strokeDasharray="3 3"
                              />
                              <text
                                x={originX - (height * scale) / 2}
                                y={originY - (height * scale) / 2 + 5}
                                textAnchor="middle"
                                fill="#047857"
                                fontSize="12"
                                fontWeight="bold"
                              >
                                b² = {(height * height).toFixed(0)}
                              </text>
                            </>
                          )}

                          {/* Right angle indicator */}
                          <path
                            d={`M ${originX} ${originY - 14} L ${originX + 14} ${originY - 14} L ${originX + 14} ${originY}`}
                            fill="none"
                            stroke="#64748b"
                            strokeWidth="1.5"
                          />

                          {/* Right-angled triangle fill & stroke */}
                          <polygon
                            points={`${pA.x},${pA.y} ${pB.x},${pB.y} ${pC.x},${pC.y}`}
                            fill="#60a5fa"
                            fillOpacity="0.3"
                            stroke="#004ac6"
                            strokeWidth="2.5"
                          />

                          {/* Base line label */}
                          <text
                            x={(pA.x + pB.x) / 2}
                            y={pA.y + 16}
                            textAnchor="middle"
                            fill="#004ac6"
                            fontSize="12"
                            fontWeight="bold"
                          >
                            Base a = {base}
                          </text>

                          {/* Height line label */}
                          <text
                            x={pA.x - 10}
                            y={(pA.y + pC.y) / 2}
                            textAnchor="end"
                            fill="#059669"
                            fontSize="12"
                            fontWeight="bold"
                          >
                            Height b = {height}
                          </text>

                          {/* Hypotenuse line label */}
                          <text
                            x={(pB.x + pC.x) / 2 + 10}
                            y={(pB.y + pC.y) / 2 - 10}
                            textAnchor="start"
                            fill="#b45309"
                            fontSize="12"
                            fontWeight="bold"
                          >
                            Hypotenuse c = {hypotenuse.toFixed(2)}
                          </text>

                          {/* Angle theta indicator arc */}
                          <circle cx={pB.x} cy={pB.y} r="20" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="30" strokeDashoffset="15" />
                          <text x={pB.x - 24} y={pB.y - 8} fontSize="11" fill="#b45309" fontWeight="bold">
                            θ = {angleThetaDeg.toFixed(1)}°
                          </text>
                        </g>
                      );
                    })()}
                  </svg>
                </div>

                {/* Proof confirmation badge */}
                <div className="bg-white px-4 py-2 rounded-xl border border-blue-200 shadow-sm text-xs font-mono text-center">
                  <span className="text-blue-700 font-bold">a² ({base * base})</span> +{' '}
                  <span className="text-emerald-700 font-bold">b² ({height * height})</span> ={' '}
                  <span className="text-amber-700 font-bold">c² ({(base * base + height * height).toFixed(1)})</span>
                  <span className="text-emerald-600 font-bold ml-2">✓ Verified</span>
                </div>
              </div>

              {/* Sliders & Trig Ratios Inspector */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
                    <span>Adjust Triangle Dimensions</span>
                    <button
                      onClick={() => setShowSquaresProof(!showSquaresProof)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
                    >
                      {showSquaresProof ? 'Hide a²+b² Squares' : 'Show Geometric Proof'}
                    </button>
                  </h3>

                  {/* Base Slider */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>Base (a):</span>
                      <span className="font-bold text-blue-700">{base} units</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="10"
                      step="1"
                      value={base}
                      onChange={(e) => setBase(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  {/* Height Slider */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>Height (b):</span>
                      <span className="font-bold text-emerald-700">{height} units</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="10"
                      step="1"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  {/* Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-200">
                    <span className="text-[11px] text-slate-500 font-bold mr-1">Pythagorean Triples:</span>
                    {[
                      { b: 4, h: 3, label: '3-4-5' },
                      { b: 12, h: 5, label: '5-12-13' },
                      { b: 8, h: 6, label: '6-8-10' },
                      { b: 7, h: 7, label: 'Isosceles (45°)' },
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setBase(p.b > 10 ? 10 : p.b);
                          setHeight(p.h > 10 ? 10 : p.h);
                        }}
                        className="px-2 py-0.8 bg-white border border-slate-200 hover:border-blue-400 rounded-lg text-[11px] font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Trigonometric Ratios */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Trigonometric Values for θ ({angleThetaDeg.toFixed(1)}°)</span>
                    <button
                      onClick={() => copyToClipboard(`sin(θ)=${sinTheta.toFixed(3)}, cos(θ)=${cosTheta.toFixed(3)}, tan(θ)=${tanTheta.toFixed(3)}`, 'trig')}
                      className="text-[10px] text-blue-700 hover:underline cursor-pointer"
                    >
                      {copiedKey === 'trig' ? 'Copied!' : 'Copy Values'}
                    </button>
                  </h4>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2 rounded-xl shadow-xs border border-blue-100">
                      <div className="text-[11px] text-slate-500 font-bold">sin θ = b/c</div>
                      <div className="text-base font-extrabold text-blue-700">{sinTheta.toFixed(3)}</div>
                      <div className="text-[10px] text-slate-400">Opposite / Hypotenuse</div>
                    </div>
                    <div className="bg-white p-2 rounded-xl shadow-xs border border-blue-100">
                      <div className="text-[11px] text-slate-500 font-bold">cos θ = a/c</div>
                      <div className="text-base font-extrabold text-indigo-700">{cosTheta.toFixed(3)}</div>
                      <div className="text-[10px] text-slate-400">Adjacent / Hypotenuse</div>
                    </div>
                    <div className="bg-white p-2 rounded-xl shadow-xs border border-blue-100">
                      <div className="text-[11px] text-slate-500 font-bold">tan θ = b/a</div>
                      <div className="text-base font-extrabold text-amber-700">{tanTheta.toFixed(3)}</div>
                      <div className="text-[10px] text-slate-400">Opposite / Adjacent</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* MODULE 2: QUADRATIC EQUATION & PARABOLA */}
          {activeModule === 'quadratic' && (
            <motion.div
              key="quadratic"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
              {/* Parabola SVG Graph */}
              <div className="lg:col-span-7 bg-[#f0f4ff] rounded-2xl p-4 sm:p-6 border border-blue-100 flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden">
                <div className="absolute top-3 left-4 text-xs font-bold text-[#004ac6] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">query_stats</span>
                  Parabola Graph: y = {quadA}x² {quadB >= 0 ? `+ ${quadB}` : quadB}x {quadC >= 0 ? `+ ${quadC}` : quadC}
                </div>

                <div className="w-full max-w-[340px] aspect-square flex items-center justify-center my-4">
                  <svg viewBox="-100 -100 200 200" className="w-full h-full overflow-visible">
                    {/* Axes */}
                    <line x1="-100" y1="0" x2="100" y2="0" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="0" y1="-100" x2="0" y2="100" stroke="#94a3b8" strokeWidth="1.5" />
                    <text x="90" y="-5" fontSize="9" fill="#64748b" fontWeight="bold">X</text>
                    <text x="5" y="-90" fontSize="9" fill="#64748b" fontWeight="bold">Y</text>

                    {/* Plot Parabola Curve */}
                    {(() => {
                      const points: string[] = [];
                      const scaleX = 14;
                      const scaleY = 4;
                      for (let x = -8; x <= 8; x += 0.2) {
                        const y = quadA * x * x + quadB * x + quadC;
                        const svgX = x * scaleX;
                        const svgY = -y * scaleY;
                        points.push(`${svgX.toFixed(1)},${svgY.toFixed(1)}`);
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

                    {/* Vertex point */}
                    {(() => {
                      const scaleX = 14;
                      const scaleY = 4;
                      const vx = vertexX * scaleX;
                      const vy = -vertexY * scaleY;
                      if (Math.abs(vx) <= 90 && Math.abs(vy) <= 90) {
                        return (
                          <g>
                            <circle cx={vx} cy={vy} r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                            <text x={vx + 6} y={vy - 6} fontSize="9" fontWeight="bold" fill="#dc2626">
                              Vertex ({vertexX.toFixed(1)}, {vertexY.toFixed(1)})
                            </text>
                          </g>
                        );
                      }
                      return null;
                    })()}

                    {/* Discriminant Indicator Watermark */}
                    <text x="-90" y="85" fontSize="10" fontWeight="bold" fill={discriminant > 0 ? '#16a34a' : discriminant === 0 ? '#ca8a04' : '#dc2626'}>
                      D = {discriminant.toFixed(0)} ({discriminant > 0 ? '2 Real Roots' : discriminant === 0 ? '1 Real Equal Root' : 'No Real Roots'})
                    </text>
                  </svg>
                </div>

                <div className="bg-white px-4 py-2 rounded-xl border border-blue-200 shadow-sm text-xs font-mono text-center">
                  <span className="font-bold text-slate-700">Nature of Roots: </span>
                  <span className={`font-bold ${discriminant > 0 ? 'text-emerald-600' : discriminant === 0 ? 'text-amber-600' : 'text-red-600'}`}>
                    {rootsDisplay}
                  </span>
                </div>
              </div>

              {/* Sliders for a, b, c */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 mb-3">Adjust Coefficients in ax² + bx + c = 0</h3>

                  {/* a Slider */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>Coefficient of x² (a):</span>
                      <span className="font-bold text-blue-700">{quadA}</span>
                    </div>
                    <input
                      type="range"
                      min="-3"
                      max="3"
                      step="1"
                      value={quadA}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setQuadA(val === 0 ? 1 : val);
                      }}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  {/* b Slider */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>Coefficient of x (b):</span>
                      <span className="font-bold text-emerald-700">{quadB}</span>
                    </div>
                    <input
                      type="range"
                      min="-8"
                      max="8"
                      step="1"
                      value={quadB}
                      onChange={(e) => setQuadB(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  {/* c Slider */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>Constant term (c):</span>
                      <span className="font-bold text-amber-700">{quadC}</span>
                    </div>
                    <input
                      type="range"
                      min="-10"
                      max="10"
                      step="1"
                      value={quadC}
                      onChange={(e) => setQuadC(Number(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>

                  {/* Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-200">
                    <span className="text-[11px] text-slate-500 font-bold mr-1">Presets:</span>
                    {[
                      { a: 1, b: -5, c: 6, label: 'x² - 5x + 6 (D > 0)' },
                      { a: 1, b: -4, c: 4, label: 'x² - 4x + 4 (D = 0)' },
                      { a: 1, b: 2, c: 5, label: 'x² + 2x + 5 (D < 0)' },
                      { a: -1, b: 0, c: 4, label: 'Inverted -x² + 4' },
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setQuadA(p.a);
                          setQuadB(p.b);
                          setQuadC(p.c);
                        }}
                        className="px-2 py-0.8 bg-white border border-slate-200 hover:border-blue-400 rounded-lg text-[11px] font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Master Formula Box */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-2xl border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Shreedharacharya Formula</span>
                    <button
                      onClick={() => copyToClipboard('x = (-b ± √(b² - 4ac)) / (2a)', 'quadFormula')}
                      className="text-[10px] text-indigo-700 hover:underline cursor-pointer"
                    >
                      {copiedKey === 'quadFormula' ? 'Copied!' : 'Copy Formula'}
                    </button>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 text-center font-serif text-base sm:text-lg font-bold text-indigo-950">
                    x = <span className="inline-block border-b border-indigo-900 pb-0.5">-b ± √(b² - 4ac)</span> / 2a
                  </div>
                  <div className="mt-2 text-[11px] text-slate-600">
                    Discriminant D = ({quadB})² - 4({quadA})({quadC}) = <strong className="text-indigo-800">{discriminant}</strong>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* MODULE 3: ALGEBRAIC IDENTITY AREA BOX */}
          {activeModule === 'algebraic' && (
            <motion.div
              key="algebraic"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
              {/* Dynamic 2D Area Tile Partition */}
              <div className="lg:col-span-7 bg-[#f0f4ff] rounded-2xl p-4 sm:p-6 border border-blue-100 flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden">
                <div className="absolute top-3 left-4 text-xs font-bold text-[#004ac6] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">view_quilt</span>
                  Visual Area Partition: (a + b)² = a² + 2ab + b²
                </div>

                {/* Area Visualizer Box */}
                <div className="w-full max-w-[320px] aspect-square flex items-center justify-center my-4">
                  {(() => {
                    const total = algA + algB;
                    const pctA = (algA / total) * 100;
                    const pctB = (algB / total) * 100;

                    return (
                      <div className="w-full h-full border-2 border-slate-700 rounded-xl overflow-hidden grid grid-cols-2 shadow-lg" style={{
                        gridTemplateColumns: `${pctA}% ${pctB}%`,
                        gridTemplateRows: `${pctA}% ${pctB}%`,
                      }}>
                        {/* Tile 1: a² */}
                        <div className="bg-blue-500 text-white font-bold text-xs sm:text-sm flex flex-col items-center justify-center border-r border-b border-white/40 p-2 transition-all hover:bg-blue-600">
                          <span>a²</span>
                          <span className="text-[10px] opacity-85">{algA}×{algA} = {algA * algA}</span>
                        </div>

                        {/* Tile 2: ab */}
                        <div className="bg-emerald-500 text-white font-bold text-xs sm:text-sm flex flex-col items-center justify-center border-b border-white/40 p-2 transition-all hover:bg-emerald-600">
                          <span>ab</span>
                          <span className="text-[10px] opacity-85">{algA}×{algB} = {algA * algB}</span>
                        </div>

                        {/* Tile 3: ba */}
                        <div className="bg-emerald-500 text-white font-bold text-xs sm:text-sm flex flex-col items-center justify-center border-r border-white/40 p-2 transition-all hover:bg-emerald-600">
                          <span>ab</span>
                          <span className="text-[10px] opacity-85">{algB}×{algA} = {algB * algA}</span>
                        </div>

                        {/* Tile 4: b² */}
                        <div className="bg-amber-500 text-white font-bold text-xs sm:text-sm flex flex-col items-center justify-center p-2 transition-all hover:bg-amber-600">
                          <span>b²</span>
                          <span className="text-[10px] opacity-85">{algB}×{algB} = {algB * algB}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="bg-white px-4 py-2 rounded-xl border border-blue-200 shadow-sm text-xs font-mono text-center">
                  Total Area ({algA + algB})² = {algA * algA} + 2({algA * algB}) + {algB * algB} ={' '}
                  <strong className="text-blue-700">{(algA + algB) * (algA + algB)}</strong>
                </div>
              </div>

              {/* Controls & Identities */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 mb-3">Adjust Lengths a and b</h3>

                  {/* a Slider */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>Length (a):</span>
                      <span className="font-bold text-blue-700">{algA} units</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="10"
                      step="1"
                      value={algA}
                      onChange={(e) => setAlgA(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  {/* b Slider */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>Length (b):</span>
                      <span className="font-bold text-amber-700">{algB} units</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="1"
                      value={algB}
                      onChange={(e) => setAlgB(Number(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Standard Identities Cheat Sheet */}
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Class 8-10 Essential Identities</h4>
                  {[
                    { id: '(a + b)²', exp: 'a² + 2ab + b²', text: '(a+b)^2 = a^2 + 2ab + b^2' },
                    { id: '(a - b)²', exp: 'a² - 2ab + b²', text: '(a-b)^2 = a^2 - 2ab + b^2' },
                    { id: 'a² - b²', exp: '(a + b)(a - b)', text: 'a^2 - b^2 = (a+b)(a-b)' },
                    { id: '(a + b)³', exp: 'a³ + b³ + 3ab(a + b)', text: '(a+b)^3 = a^3 + b^3 + 3ab(a+b)' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="font-bold text-blue-700 mr-2">{item.id}</span>
                        <span className="text-slate-600 font-mono">= {item.exp}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(item.text, `id_${idx}`)}
                        className="text-slate-400 hover:text-blue-600 cursor-pointer p-1"
                        title="Copy formula"
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {copiedKey === `id_${idx}` ? 'check' : 'content_copy'}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* MODULE 4: CIRCLE & PI UNROLLER */}
          {activeModule === 'circle' && (
            <motion.div
              key="circle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
              <div className="lg:col-span-7 bg-[#f0f4ff] rounded-2xl p-4 sm:p-6 border border-blue-100 flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden">
                <div className="absolute top-3 left-4 text-xs font-bold text-[#004ac6] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">pie_chart</span>
                  Interactive Circle & Sector Geometry
                </div>

                <div className="w-full max-w-[320px] aspect-square flex items-center justify-center my-4">
                  <svg viewBox="-120 -120 240 240" className="w-full h-full overflow-visible">
                    {/* Full circle outline */}
                    <circle cx="0" cy="0" r="80" fill="#e0e7ff" stroke="#3b82f6" strokeWidth="2.5" />

                    {/* Sector Pie Wedge */}
                    {(() => {
                      const rad = (sectorAngle * Math.PI) / 180;
                      const x = 80 * Math.cos(rad);
                      const y = 80 * Math.sin(rad);
                      const largeArcFlag = sectorAngle > 180 ? 1 : 0;
                      return (
                        <path
                          d={`M 0 0 L 80 0 A 80 80 0 ${largeArcFlag} 1 ${x} ${y} Z`}
                          fill="#f59e0b"
                          fillOpacity="0.45"
                          stroke="#d97706"
                          strokeWidth="2"
                        />
                      );
                    })()}

                    {/* Center point */}
                    <circle cx="0" cy="0" r="3.5" fill="#1e293b" />
                    <line x1="0" y1="0" x2="80" y2="0" stroke="#1e293b" strokeWidth="2" strokeDasharray="3 3" />
                    <text x="40" y="-8" fontSize="10" fontWeight="bold" fill="#1e293b">r = {radius} cm</text>

                    {/* Sector Angle Label */}
                    <text x="18" y="18" fontSize="11" fontWeight="bold" fill="#b45309">θ = {sectorAngle}°</text>
                  </svg>
                </div>

                <div className="bg-white px-4 py-2 rounded-xl border border-blue-200 shadow-sm text-xs font-mono text-center flex items-center gap-4">
                  <div>
                    <span className="text-slate-500">Arc Length l: </span>
                    <strong className="text-amber-700">{arcLength.toFixed(2)} cm</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Sector Area: </span>
                    <strong className="text-blue-700">{sectorArea.toFixed(2)} cm²</strong>
                  </div>
                </div>
              </div>

              {/* Sliders */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 mb-3">Adjust Radius & Sector Angle</h3>

                  {/* Radius Slider */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>Radius (r):</span>
                      <span className="font-bold text-blue-700">{radius} cm</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="14"
                      step="1"
                      value={radius}
                      onChange={(e) => setRadius(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  {/* Sector Angle Slider */}
                  <div className="mb-3">
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

                  {/* Quick Angle Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-200">
                    <span className="text-[11px] text-slate-500 font-bold mr-1">Angles:</span>
                    {[
                      { deg: 60, label: '60° (Sixth)' },
                      { deg: 90, label: '90° (Quadrant)' },
                      { deg: 180, label: '180° (Semicircle)' },
                      { deg: 360, label: '360° (Full)' },
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSectorAngle(p.deg)}
                        className="px-2 py-0.8 bg-white border border-slate-200 hover:border-blue-400 rounded-lg text-[11px] font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Complete Circle Metrics */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-200">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">Full Circle Properties</h4>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                      <div className="text-[10px] text-slate-500 font-bold">Circumference (2πr)</div>
                      <div className="text-sm sm:text-base font-extrabold text-amber-800">{circumference.toFixed(2)} cm</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                      <div className="text-[10px] text-slate-500 font-bold">Total Area (πr²)</div>
                      <div className="text-sm sm:text-base font-extrabold text-orange-800">{circleArea.toFixed(2)} cm²</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* MODULE 5: 3D SOLID NET UNFOLDING */}
          {activeModule === 'mensuration' && (
            <motion.div
              key="mensuration"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
              <div className="lg:col-span-7 bg-[#f0f4ff] rounded-2xl p-4 sm:p-6 border border-blue-100 flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden">
                <div className="absolute top-3 left-4 text-xs font-bold text-[#004ac6] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">view_in_ar</span>
                  {isUnfoldedNet ? 'Unfolded 2D Surface Net' : `3D ${solidType.toUpperCase()} View`}
                </div>

                {/* 3D / Net Visual Representation */}
                <div className="w-full max-w-[340px] aspect-square flex items-center justify-center my-4">
                  {solidType === 'cylinder' && (
                    <div className="flex flex-col items-center justify-center">
                      {!isUnfoldedNet ? (
                        /* 3D Cylinder representation */
                        <div className="relative flex flex-col items-center">
                          <div className="w-28 h-10 rounded-full bg-blue-300 border-2 border-blue-600 shadow-sm z-10"></div>
                          <div className="w-28 h-32 bg-gradient-to-r from-blue-400 via-blue-200 to-blue-500 border-x-2 border-blue-600 -mt-5 -mb-5 flex items-center justify-center text-xs font-bold text-blue-900">
                            CSA = 2πrh
                          </div>
                          <div className="w-28 h-10 rounded-full bg-blue-400 border-2 border-blue-600 shadow-md"></div>
                        </div>
                      ) : (
                        /* Unfolded Net of Cylinder */
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-12 h-12 rounded-full bg-emerald-300 border border-emerald-600 flex items-center justify-center text-[10px] font-bold">
                            Top πr²
                          </div>
                          <div className="w-48 h-24 bg-gradient-to-r from-blue-300 via-blue-200 to-blue-300 border-2 border-dashed border-blue-600 rounded flex flex-col items-center justify-center text-xs font-bold text-blue-900">
                            <span>Curved Surface Rectangle</span>
                            <span className="text-[10px] font-mono">Length: 2πr • Width: h</span>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-emerald-300 border border-emerald-600 flex items-center justify-center text-[10px] font-bold">
                            Base πr²
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {solidType === 'cone' && (
                    <div className="flex flex-col items-center justify-center">
                      {!isUnfoldedNet ? (
                        <div className="flex flex-col items-center">
                          <div className="w-0 h-0 border-l-[50px] border-l-transparent border-r-[50px] border-r-transparent border-b-[100px] border-b-amber-400"></div>
                          <div className="w-24 h-8 rounded-full bg-amber-500 border border-amber-700 -mt-4"></div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-36 h-28 bg-amber-300 border-2 border-amber-600 rounded-t-full flex items-center justify-center text-xs font-bold text-amber-900">
                            Sector (Slant l = √(r²+h²))
                          </div>
                          <div className="w-14 h-14 rounded-full bg-amber-500 border border-amber-700 flex items-center justify-center text-[10px] font-bold text-white">
                            Base πr²
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {solidType === 'sphere' && (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-300 via-indigo-500 to-indigo-800 shadow-xl border border-indigo-400 flex items-center justify-center text-white text-xs font-extrabold">
                      4πr²
                    </div>
                  )}
                </div>

                <div className="bg-white px-4 py-2 rounded-xl border border-blue-200 shadow-sm text-xs font-mono text-center">
                  {solidType === 'cylinder' && (
                    <span>
                      CSA = 2π({solidR})({solidH}) = <strong className="text-blue-700">{(2 * Math.PI * solidR * solidH).toFixed(1)} cm²</strong> | TSA = <strong className="text-emerald-700">{(2 * Math.PI * solidR * (solidH + solidR)).toFixed(1)} cm²</strong>
                    </span>
                  )}
                  {solidType === 'cone' && (
                    <span>
                      Slant Height l = <strong className="text-amber-700">{Math.sqrt(solidR * solidR + solidH * solidH).toFixed(1)} cm</strong> | Volume = <strong className="text-blue-700">{((1/3) * Math.PI * solidR * solidR * solidH).toFixed(1)} cm³</strong>
                    </span>
                  )}
                  {solidType === 'sphere' && (
                    <span>
                      Surface Area = 4πr² = <strong className="text-indigo-700">{(4 * Math.PI * solidR * solidR).toFixed(1)} cm²</strong> | Volume = 4/3 πr³ = <strong className="text-purple-700">{((4/3) * Math.PI * Math.pow(solidR, 3)).toFixed(1)} cm³</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Sliders & Unfold Toggle */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-800">Select 3D Solid</h3>
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                      {(['cylinder', 'cone', 'sphere'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setSolidType(s)}
                          className={`px-2 py-1 rounded-lg font-bold capitalize transition-colors cursor-pointer ${
                            solidType === s ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Radius Slider */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>Radius (r):</span>
                      <span className="font-bold text-blue-700">{solidR} cm</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="10"
                      step="1"
                      value={solidR}
                      onChange={(e) => setSolidR(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  {/* Height Slider (if not sphere) */}
                  {solidType !== 'sphere' && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                        <span>Height (h):</span>
                        <span className="font-bold text-emerald-700">{solidH} cm</span>
                      </div>
                      <input
                        type="range"
                        min="3"
                        max="15"
                        step="1"
                        value={solidH}
                        onChange={(e) => setSolidH(Number(e.target.value))}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Unfold Net Action */}
                  {solidType !== 'sphere' && (
                    <button
                      onClick={() => setIsUnfoldedNet(!isUnfoldedNet)}
                      className="w-full mt-2 py-2 px-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-indigo-100 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[17px]">
                        {isUnfoldedNet ? 'view_in_ar' : 'unfold_more'}
                      </span>
                      <span>{isUnfoldedNet ? 'Switch to 3D Solid View' : 'Unfold into 2D Surface Net'}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* MODULE 6: ARITHMETIC PROGRESSIONS */}
          {activeModule === 'progressions' && (
            <motion.div
              key="progressions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
              {/* Visual Staircase Bar Chart */}
              <div className="lg:col-span-7 bg-[#f0f4ff] rounded-2xl p-4 sm:p-6 border border-blue-100 flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden">
                <div className="absolute top-3 left-4 text-xs font-bold text-[#004ac6] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">stairs</span>
                  Arithmetic Progression Staircase (aₙ = a + (n-1)d)
                </div>

                {/* Staircase Bars */}
                <div className="w-full max-w-[340px] h-48 flex items-end justify-center gap-2 my-4 px-4 border-b-2 border-slate-700">
                  {apTerms.map((term, i) => {
                    const maxVal = Math.max(...apTerms, 1);
                    const heightPct = Math.max(10, (term / maxVal) * 100);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-600">{term}</span>
                        <div
                          style={{ height: `${heightPct}%` }}
                          className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-indigo-400 border border-blue-700 shadow-sm transition-all duration-300"
                        ></div>
                        <span className="text-[10px] font-semibold text-slate-500">n={i + 1}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-white px-4 py-2 rounded-xl border border-blue-200 shadow-sm text-xs font-mono text-center">
                  First Term a = {apA} • Difference d = +{apD} • Total Sum Sₙ ={' '}
                  <strong className="text-blue-700">{apSum}</strong>
                </div>
              </div>

              {/* Sliders for a, d, n */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 mb-3">Adjust AP Parameters</h3>

                  {/* a Slider */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>First Term (a):</span>
                      <span className="font-bold text-blue-700">{apA}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      step="1"
                      value={apA}
                      onChange={(e) => setApA(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  {/* d Slider */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>Common Difference (d):</span>
                      <span className="font-bold text-emerald-700">{apD}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={apD}
                      onChange={(e) => setApD(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  {/* n Slider */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>Number of Terms (n):</span>
                      <span className="font-bold text-amber-700">{apN}</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="8"
                      step="1"
                      value={apN}
                      onChange={(e) => setApN(Number(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Formula Box */}
                <div className="bg-gradient-to-br from-blue-50 to-emerald-50 p-4 rounded-2xl border border-blue-100">
                  <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Class 10 AP Formulas</div>
                  <div className="space-y-1.5 text-xs">
                    <div className="p-2 bg-white rounded-lg border border-blue-100 font-mono">
                      n-th term: <strong>aₙ = a + (n - 1)d</strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-blue-100 font-mono">
                      Sum of n terms: <strong>Sₙ = (n/2)[2a + (n - 1)d]</strong>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
