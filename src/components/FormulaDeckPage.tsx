import React, { useState } from 'react';
import { FormulaDeckSandbox } from './FormulaDeckSandbox';
import { BrandingConfig } from '../services/branding';
import { AdPlacement } from './AdPlacement';

interface FormulaDeckPageProps {
  onNavigateHome: () => void;
  onOpenAiTeacher: (presetQuery?: string) => void;
  onDownloadSheet: (title: string, size: string) => void;
  onToast: (msg: string) => void;
  branding?: BrandingConfig;
}

interface FormulaCard {
  id: string;
  topic: string;
  grade: string;
  title: string;
  formula: string;
  explanation: string;
  sandboxModule?: 'pythagoras' | 'quadratic' | 'algebraic' | 'circle' | 'mensuration' | 'progressions';
  category: 'algebra' | 'geometry' | 'trigonometry' | 'mensuration' | 'statistics';
}

const FORMULA_COLLECTION: FormulaCard[] = [
  {
    id: 'f-pyth',
    topic: 'Trigonometry & Triangles',
    grade: 'Class 10',
    title: 'Pythagorean Theorem & Trigonometric Identities',
    formula: 'sin²θ + cos²θ = 1, 1 + tan²θ = sec²θ, 1 + cot²θ = csc²θ',
    explanation: 'Fundamental relationships connecting right-angled triangle sides to angular ratios.',
    sandboxModule: 'pythagoras',
    category: 'trigonometry',
  },
  {
    id: 'f-quad',
    topic: 'Quadratic Equations',
    grade: 'Class 10',
    title: 'Quadratic Formula & Nature of Roots',
    formula: 'x = (-b ± √(b² - 4ac)) / 2a, D = b² - 4ac',
    explanation: 'Finds real or complex roots of any quadratic equation; D determines the nature of roots.',
    sandboxModule: 'quadratic',
    category: 'algebra',
  },
  {
    id: 'f-alg-sq',
    topic: 'Polynomials & Identities',
    grade: 'Class 8-9',
    title: 'Square of Binomial & Difference of Squares',
    formula: '(a + b)² = a² + 2ab + b², a² - b² = (a + b)(a - b)',
    explanation: 'Core algebraic expansions that partition polynomial areas into geometric rectangles.',
    sandboxModule: 'algebraic',
    category: 'algebra',
  },
  {
    id: 'f-circle',
    topic: 'Areas Related to Circles',
    grade: 'Class 10',
    title: 'Circle Perimeter, Sector Area & Arc Length',
    formula: 'Arc Length = (θ/360) × 2πr, Sector Area = (θ/360) × πr²',
    explanation: 'Measures sector wedges and boundary arcs in circular geometries.',
    sandboxModule: 'circle',
    category: 'geometry',
  },
  {
    id: 'f-mens-cyl',
    topic: 'Surface Areas & Volumes',
    grade: 'Class 9-10',
    title: 'Cylinder, Cone & Sphere Solid Mensuration',
    formula: 'Cylinder: 2πrh, Cone: πrl (l=√(r²+h²)), Sphere: 4πr²',
    explanation: 'Unfolds 3D curved surfaces into flat 2D nets to calculate exact wrapping surface area.',
    sandboxModule: 'mensuration',
    category: 'mensuration',
  },
  {
    id: 'f-ap',
    topic: 'Arithmetic Progressions',
    grade: 'Class 10',
    title: 'Arithmetic Progression N-th Term & Sum',
    formula: 'aₙ = a + (n - 1)d, Sₙ = (n/2)[2a + (n - 1)d]',
    explanation: 'Calculates any term and total accumulated sum in constant-difference sequences.',
    sandboxModule: 'progressions',
    category: 'algebra',
  },
  {
    id: 'f-coord',
    topic: 'Coordinate Geometry',
    grade: 'Class 10',
    title: 'Distance & Section Formulas',
    formula: 'd = √((x₂ - x₁)² + (y₂ - y₁)²), P(x,y) = ((mx₂ + nx₁)/(m+n), (my₂ + ny₁)/(m+n))',
    explanation: 'Measures exact Cartesian distance between two points and internal section division coordinates.',
    category: 'geometry',
  },
  {
    id: 'f-stats',
    topic: 'Statistics & Probability',
    grade: 'Class 9-10',
    title: 'Empirical Relationship of Central Tendency',
    formula: '3 Median = Mode + 2 Mean, P(E) + P(not E) = 1',
    explanation: 'Connects Mean, Median, and Mode in moderately skewed distributions, plus complementary probabilities.',
    category: 'statistics',
  },
];

export const FormulaDeckPage: React.FC<FormulaDeckPageProps> = ({
  onNavigateHome,
  onOpenAiTeacher,
  onDownloadSheet,
  onToast,
  branding,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSandboxModule, setActiveSandboxModule] = useState<string>('pythagoras');

  const copyShareableLink = () => {
    const url = `${window.location.origin}/#formula-deck`;
    navigator.clipboard?.writeText(url);
    onToast('Unique page link copied to clipboard! Share it with your classmates.');
  };

  const copyFormulaText = (formula: string, title: string) => {
    navigator.clipboard?.writeText(formula);
    onToast(`Copied formula: ${title}`);
  };

  const filteredFormulas = FORMULA_COLLECTION.filter((f) => {
    const matchesCat = selectedCategory === 'all' || f.category === selectedCategory;
    const matchesGrade = selectedGrade === 'all' || f.grade.includes(selectedGrade);
    const matchesSearch =
      searchQuery.trim() === '' ||
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.formula.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesGrade && matchesSearch;
  });

  return (
    <div className="w-full min-h-screen bg-[#f9f9ff] text-[#111c2d] pb-16 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sticky Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-blue-100 shadow-xs px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#004ac6] bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">arrow_back</span>
            <span>Return to Learning Hub</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
            <span className="text-xs font-bold text-slate-600 hidden md:inline">
              Unique URL: <code className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">/#formula-deck</code>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyShareableLink}
            className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-[#004ac6] text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-200 transition-colors cursor-pointer"
            title="Share this dedicated formula deck page URL"
          >
            <span className="material-symbols-outlined text-[16px]">share</span>
            <span className="hidden sm:inline">Share Page URL</span>
          </button>

          <button
            onClick={() => onOpenAiTeacher('Explain the derivation and applications of standard Class 10 Math formulas')}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">psychology</span>
            <span>Ask AI Teacher</span>
          </button>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Top Formula Deck Ad Banner */}
        <AdPlacement location="formula_deck_top" className="mb-6" />

        {/* Page Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#004ac6] text-xs font-extrabold uppercase tracking-wide mb-3">
            <span className="material-symbols-outlined text-[16px]">functions</span>
            <span>Class 5 to 10 Visual Mathematics</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#111c2d] tracking-tight">
            Interactive Formula Deck & Mathematical Transitions
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Demystifying algebra, geometry, trigonometry, and mensuration through animated visual proofs and real-time interactive sliders.
          </p>
        </div>

        {/* Live Interactive Sandbox Container */}
        <div className="mb-12">
          <FormulaDeckSandbox
            initialModule={activeSandboxModule}
            onAskAiAboutFormula={(name, eq) => onOpenAiTeacher(`Can you teach me the full derivation, proof, and solved examples for ${name}?`)}
            onDownloadSheet={onDownloadSheet}
            isStandalonePage={true}
          />
        </div>

        {/* Filter Bar & Search */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-100 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Topics' },
              { id: 'trigonometry', label: 'Trigonometry' },
              { id: 'algebra', label: 'Algebra' },
              { id: 'geometry', label: 'Geometry' },
              { id: 'mensuration', label: 'Mensuration' },
              { id: 'statistics', label: 'Statistics' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-[#004ac6] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Grade Filter */}
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Classes</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 8">Class 8</option>
            </select>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search formula..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Formula Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredFormulas.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-[#004ac6] uppercase tracking-wider">
                    {item.topic}
                  </span>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {item.grade}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {item.title}
                </h3>

                <div className="my-3 p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs sm:text-[13px] font-bold text-slate-800 break-words leading-relaxed">
                  {item.formula}
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {item.explanation}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => copyFormulaText(item.formula, item.title)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                    title="Copy Formula"
                  >
                    <span className="material-symbols-outlined text-[17px]">content_copy</span>
                  </button>
                  <button
                    onClick={() => onOpenAiTeacher(`Please explain ${item.title}: "${item.formula}" with derivation and typical CBSE/ICSE exam problems.`)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                    title="Ask AI Teacher to explain this formula"
                  >
                    <span className="material-symbols-outlined text-[17px]">psychology</span>
                  </button>
                </div>

                {item.sandboxModule && (
                  <button
                    onClick={() => {
                      setActiveSandboxModule(item.sandboxModule!);
                      window.scrollTo({ top: 180, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#004ac6] hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <span>Play in Sandbox</span>
                    <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Formula Deck Bottom Ad Unit */}
        <AdPlacement location="formula_deck_sidebar" className="mt-8" />

        {/* Universal Footer Top Ad Banner */}
        <div className="mt-10 mb-4">
          <AdPlacement location="footer_top" />
        </div>
      </main>
    </div>
  );
};
