import React, { useState } from 'react';

interface InteractiveFormulaDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadSheet: (title: string, size: string) => void;
}

export const InteractiveFormulaDeckModal: React.FC<InteractiveFormulaDeckModalProps> = ({
  isOpen,
  onClose,
  onDownloadSheet,
}) => {
  const [activeSheet, setActiveSheet] = useState<number>(42);
  const [triangleBase, setTriangleBase] = useState<number>(4);
  const [triangleHeight, setTriangleHeight] = useState<number>(3);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const hypotenuse = Math.sqrt(triangleBase * triangleBase + triangleHeight * triangleHeight);

  const handleCopyFormula = (formula: string, key: string) => {
    navigator.clipboard?.writeText(formula);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#f9f9ff] w-full max-w-4xl max-h-[94vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-blue-100 flex flex-col overflow-hidden">
        {/* Header bar */}
        <div className="bg-[#ffffff] px-3.5 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-[#ba1a1a]"></span>
              <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-[#fea619]"></span>
              <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-[#006242]"></span>
            </div>
            <div className="h-4 sm:h-5 w-[1px] bg-gray-200 shrink-0"></div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#006242] uppercase tracking-wider block truncate">
                Formula Deck • Sandbox
              </span>
              <h2 className="text-xs sm:text-[18px] font-bold text-[#111c2d] leading-none truncate">
                Exam Cheat Sheets
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => onDownloadSheet('Cheat Sheet #42: Pythagorean & Coordinate Tricks', '1.6 MB')}
              className="inline-flex items-center gap-1 sm:gap-1.5 bg-[#2563eb] text-white text-xs sm:text-[13px] font-bold px-2.5 sm:px-3.5 py-1.5 rounded-xl hover:bg-blue-700 tactile-btn-primary cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">download</span>
              <span className="hidden sm:inline">Download A4 Printable</span>
              <span className="sm:hidden">Print</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Cheat Sheet Selectors */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 bg-[#f0f3ff] border-b border-blue-50 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSheet(42)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSheet === 42
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-blue-100'
            }`}
          >
            #42 Pythagorean & Coordinate Tricks
          </button>
          <button
            onClick={() => setActiveSheet(18)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSheet === 18
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-blue-100'
            }`}
          >
            #18 Polynomials & Special Products
          </button>
          <button
            onClick={() => setActiveSheet(27)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSheet === 27
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-blue-100'
            }`}
          >
            #27 Mensuration 3D Surface Areas
          </button>
          <button
            onClick={() => setActiveSheet(35)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSheet === 35
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-blue-100'
            }`}
          >
            #35 Super Hexagon Trigonometry
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(92vh-140px)] space-y-6">
          {activeSheet === 42 && (
            <div className="space-y-6">
              {/* Sheet Banner */}
              <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 flex-1">
                  <div className="inline-flex items-center gap-1.5 bg-[#d1fae5] text-[#006242] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    <span>10-Sec Mastery</span>
                    <span>• Verified by IIT Mentors</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-[#111c2d]">
                    Pythagorean Theorem & Coordinate Circle Equations
                  </h3>
                  <p className="text-sm text-[#434655]">
                    Interactive demonstration for Class 9 & 10. Adjust base and height below to test Pythagorean triplets in real time!
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => handleCopyFormula('c = \\sqrt{a^2 + b^2}', 'pyth')}
                      className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-mono font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>c = √(a² + b²)</span>
                      <span className="material-symbols-outlined text-[14px]">
                        {copiedKey === 'pyth' ? 'check' : 'content_copy'}
                      </span>
                    </button>
                    <button
                      onClick={() => handleCopyFormula('\\sin^2\\theta + \\cos^2\\theta = 1', 'trig1')}
                      className="text-xs bg-amber-50 text-amber-800 hover:bg-amber-100 px-3 py-1.5 rounded-lg font-mono font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>sin²θ + cos²θ = 1</span>
                      <span className="material-symbols-outlined text-[14px]">
                        {copiedKey === 'trig1' ? 'check' : 'content_copy'}
                      </span>
                    </button>
                    <button
                      onClick={() => handleCopyFormula('(x - h)^2 + (y - k)^2 = r^2', 'circ')}
                      className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-1.5 rounded-lg font-mono font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>(x - h)² + (y - k)² = r²</span>
                      <span className="material-symbols-outlined text-[14px]">
                        {copiedKey === 'circ' ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Interactive Dynamic SVG Visualizer */}
                <div className="w-full md:w-64 bg-[#f0f3ff] rounded-2xl p-4 flex flex-col items-center justify-center border border-blue-100 shadow-inner">
                  <span className="text-[11px] font-bold text-blue-700 mb-1">Visual Right-Angled Triangle</span>
                  <svg
                    className="text-[#2563eb] fill-none stroke-current"
                    height="120"
                    strokeWidth="2.5"
                    viewBox="0 0 160 120"
                    width="180"
                  >
                    {/* Triangle polygon */}
                    <polygon
                      fill="currentColor"
                      fillOpacity="0.12"
                      points="20,100 140,100 140,25"
                    />
                    {/* Right angle marker */}
                    <rect height="12" width="12" x="128" y="88" strokeWidth="1.5" />
                    {/* Labels */}
                    <text className="text-[11px] fill-[#111c2d] font-bold" stroke="none" x="65" y="115">
                      b = {triangleBase}
                    </text>
                    <text className="text-[11px] fill-[#111c2d] font-bold" stroke="none" x="145" y="65">
                      a = {triangleHeight}
                    </text>
                    <text className="text-[11px] fill-[#2563eb] font-extrabold" stroke="none" x="50" y="55">
                      c = {hypotenuse.toFixed(2)}
                    </text>
                  </svg>

                  {/* Interactive sliders for base and height */}
                  <div className="w-full space-y-2 mt-2 pt-2 border-t border-blue-200">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                      <span>Height (a): {triangleHeight}</span>
                      <input
                        type="range"
                        min="1"
                        max="8"
                        value={triangleHeight}
                        onChange={(e) => setTriangleHeight(Number(e.target.value))}
                        className="w-24 accent-blue-600"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                      <span>Base (b): {triangleBase}</span>
                      <input
                        type="range"
                        min="1"
                        max="8"
                        value={triangleBase}
                        onChange={(e) => setTriangleBase(Number(e.target.value))}
                        className="w-24 accent-blue-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* High-Yield Pythagorean Triplets Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase">Core Triplet #1</span>
                  <div className="text-lg font-extrabold text-gray-900 mt-1">3 : 4 : 5</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Multipliers: (6, 8, 10), (9, 12, 15), (12, 16, 20). Guaranteed in 80% of board questions.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-[11px] font-bold text-blue-700 uppercase">Core Triplet #2</span>
                  <div className="text-lg font-extrabold text-gray-900 mt-1">5 : 12 : 13</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Multipliers: (10, 24, 26). Appears often in circle tangent length and cone slant-height problems.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-[11px] font-bold text-amber-700 uppercase">Core Triplet #3</span>
                  <div className="text-lg font-extrabold text-gray-900 mt-1">8 : 15 : 17 & 7 : 24 : 25</div>
                  <p className="text-xs text-gray-500 mt-1">
                    High-level exemplar exam specials that save 3 minutes of square root arithmetic!
                  </p>
                </div>
              </div>

              {/* Coordinate Geometry Distance & Section Formula */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <h4 className="font-bold text-[15px] text-[#111c2d] flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">navigation</span>
                  Coordinate Geometry Speed Shortcuts
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#f0f3ff] p-3.5 rounded-xl font-mono text-xs text-blue-900 space-y-1">
                    <span className="font-bold text-blue-700 block font-sans">Distance Formula:</span>
                    <p>d = √[(x₂ - x₁)² + (y₂ - y₁)²]</p>
                    <span className="text-[11px] font-sans text-gray-600 block">
                      Distance from origin (0,0): d = √(x² + y²)
                    </span>
                  </div>
                  <div className="bg-[#f0f3ff] p-3.5 rounded-xl font-mono text-xs text-blue-900 space-y-1">
                    <span className="font-bold text-blue-700 block font-sans">Section Formula (Internal):</span>
                    <p>P(x, y) = [ (m₁x₂ + m₂x₁)/(m₁ + m₂), (m₁y₂ + m₂y₁)/(m₁ + m₂) ]</p>
                    <span className="text-[11px] font-sans text-gray-600 block">
                      Midpoint shortcut: M = ((x₁+x₂)/2, (y₁+y₂)/2)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSheet === 18 && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm space-y-4">
                <span className="text-xs font-bold text-blue-700 uppercase">Algebraic Master Identities</span>
                <div className="space-y-3">
                  {[
                    { formula: '(a + b + c)² = a² + b² + c² + 2ab + 2bc + 2ca', desc: 'Square of a Trinomial' },
                    { formula: 'a³ + b³ + c³ - 3abc = (a + b + c)(a² + b² + c² - ab - bc - ca)', desc: 'Master Cubic Identity' },
                    { formula: 'If a + b + c = 0, then a³ + b³ + c³ = 3abc', desc: 'Frequent Board Trap Corollary' },
                    { formula: 'x³ + y³ = (x + y)(x² - xy + y²)', desc: 'Sum of Cubes Factorization' },
                    { formula: 'x³ - y³ = (x - y)(x² + xy + y²)', desc: 'Difference of Cubes Factorization' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-blue-50/50 transition-colors">
                      <div>
                        <span className="text-[11px] text-gray-500 font-semibold block">{item.desc}</span>
                        <span className="font-mono text-sm font-bold text-gray-900">{item.formula}</span>
                      </div>
                      <button
                        onClick={() => handleCopyFormula(item.formula, `id-${idx}`)}
                        className="p-1.5 text-gray-400 hover:text-blue-600"
                        title="Copy formula"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {copiedKey === `id-${idx}` ? 'check' : 'content_copy'}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSheet === 27 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-blue-600 font-bold">
                    <span className="material-symbols-outlined">cylinder</span>
                    Right Circular Cylinder
                  </div>
                  <ul className="text-xs space-y-2 text-gray-700">
                    <li><strong>Curved Surface Area (CSA):</strong> 2πrh</li>
                    <li><strong>Total Surface Area (TSA):</strong> 2πr(r + h)</li>
                    <li><strong>Volume (V):</strong> πr²h</li>
                    <li><strong>Open Top Cylinder:</strong> 2πrh + πr²</li>
                  </ul>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 font-bold">
                    <span className="material-symbols-outlined">change_history</span>
                    Right Circular Cone
                  </div>
                  <ul className="text-xs space-y-2 text-gray-700">
                    <li><strong>Slant Height (l):</strong> √(r² + h²)</li>
                    <li><strong>Curved Surface Area (CSA):</strong> πrl</li>
                    <li><strong>Total Surface Area (TSA):</strong> πr(l + r)</li>
                    <li><strong>Volume (V):</strong> 1/3 πr²h</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeSheet === 35 && (
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h4 className="font-bold text-base text-gray-900">The Famous Trigonometric Hexagon Mnemonic</h4>
              <p className="text-xs text-gray-600">
                Clockwise direction gives quotient relations: tan = sin / cos, sin = cos / cot, cos = cot / cosec.
                Opposite diagonals multiply to 1: sin × cosec = 1, cos × sec = 1, tan × cot = 1!
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50 rounded-xl text-center">
                  <span className="text-xs font-bold text-blue-800">sin 30° = 1/2</span>
                  <div className="text-[11px] text-gray-500">cos 60° = 1/2</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl text-center">
                  <span className="text-xs font-bold text-blue-800">sin 45° = 1/√2</span>
                  <div className="text-[11px] text-gray-500">cos 45° = 1/√2</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl text-center">
                  <span className="text-xs font-bold text-blue-800">sin 60° = √3/2</span>
                  <div className="text-[11px] text-gray-500">cos 30° = √3/2</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
