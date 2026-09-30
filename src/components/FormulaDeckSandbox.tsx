import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ModuleKey, StandardGrade } from './formulaTransitions/types';
import { ALL_TRANSITION_TOPICS } from './formulaTransitions/transitionList';
import { GeometricTransitions } from './formulaTransitions/GeometricTransitions';
import { AlgebraicTransitions } from './formulaTransitions/AlgebraicTransitions';
import { AdvancedTransitions } from './formulaTransitions/AdvancedTransitions';

interface FormulaDeckSandboxProps {
  onAskAiAboutFormula?: (formulaName: string, formulaEquation: string) => void;
  onDownloadSheet?: (title: string, size: string) => void;
  initialModule?: string;
  isStandalonePage?: boolean;
}

export const FormulaDeckSandbox: React.FC<FormulaDeckSandboxProps> = ({
  onAskAiAboutFormula,
  onDownloadSheet,
  initialModule = 'pythagoras',
  isStandalonePage = false,
}) => {
  const [activeModule, setActiveModule] = useState<ModuleKey>(
    (ALL_TRANSITION_TOPICS.some((t) => t.key === initialModule)
      ? initialModule
      : 'pythagoras') as ModuleKey
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState<StandardGrade | 'All'>('All');
  const [searchFilter, setSearchFilter] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const activeTopic = ALL_TRANSITION_TOPICS.find((t) => t.key === activeModule) || ALL_TRANSITION_TOPICS[0];

  // Filter topics for dropdown
  const filteredTopics = ALL_TRANSITION_TOPICS.filter((t) => {
    const matchesStd = selectedStandard === 'All' || t.standardGroup === selectedStandard;
    const matchesSearch =
      searchFilter.trim() === '' ||
      t.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.shortDesc.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.grade.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesStd && matchesSearch;
  });

  const currentIndex = ALL_TRANSITION_TOPICS.findIndex((t) => t.key === activeModule);
  const handlePrev = () => {
    const nextIdx = (currentIndex - 1 + ALL_TRANSITION_TOPICS.length) % ALL_TRANSITION_TOPICS.length;
    setActiveModule(ALL_TRANSITION_TOPICS[nextIdx].key);
  };
  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % ALL_TRANSITION_TOPICS.length;
    setActiveModule(ALL_TRANSITION_TOPICS[nextIdx].key);
  };

  const isGeometric = ['pythagoras', 'circle', 'similar_triangles', 'lines_angles', 'mensuration'].includes(activeModule);
  const isAlgebraic = ['quadratic', 'algebraic', 'linear_systems', 'progressions', 'geom_progression'].includes(activeModule);

  return (
    <div className={`w-full bg-[#f9f9ff] text-[#111c2d] rounded-2xl sm:rounded-3xl border border-blue-100 shadow-xl overflow-hidden ${isStandalonePage ? 'max-w-6xl mx-auto' : ''}`}>
      {/* Header Bar with Dropdown Topic Selector */}
      <div className="bg-gradient-to-r from-[#003b9e] via-[#004ac6] to-[#1e58d8] text-white p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold tracking-wide uppercase text-blue-100 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Mathematical Playground • 16 Topics Across All Classes
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
              Interactive Formula Deck &amp; Mathematical Transitions
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl">
              Select any mathematical concept from the dropdown below. Drag parameters, watch geometric and algebraic proofs morph in real-time, and build intuitive mastery with zero formula confusion.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onDownloadSheet && (
              <button
                onClick={() => onDownloadSheet(`${activeTopic.label} Formula Sheet`, '2.4 MB')}
                className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-md transition-all cursor-pointer"
                title="Download Printable Formula Sheet"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Print Cheatsheet</span>
              </button>
            )}
            {onAskAiAboutFormula && (
              <button
                onClick={() => onAskAiAboutFormula(activeTopic.label, activeTopic.shortDesc)}
                className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-md transition-all cursor-pointer"
                title="Ask AI Teacher about this topic"
              >
                <span className="material-symbols-outlined text-[18px]">psychology</span>
                <span>Ask AI Teacher</span>
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Menu Control Bar */}
        <div className="mt-4 pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Main Dropdown Topic Selector */}
          <div className="relative flex-1 max-w-xl" ref={dropdownRef}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex-1 bg-white text-slate-900 px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between gap-3 hover:bg-blue-50 transition-all cursor-pointer border-2 border-white/60 text-left"
                aria-expanded={isDropdownOpen}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#004ac6] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">{activeTopic.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                        {activeTopic.label}
                      </span>
                      <span className="text-[10px] font-bold bg-blue-100 text-[#004ac6] px-1.5 py-0.5 rounded shrink-0">
                        {activeTopic.grade}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 truncate block">
                      {activeTopic.category} • {activeTopic.shortDesc}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-400 shrink-0">
                  <span className="material-symbols-outlined text-[22px]">
                    {isDropdownOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </div>
              </button>

              {/* Prev / Next Topic Quick Stepper */}
              <div className="flex items-center gap-1 shrink-0 bg-white/10 p-1 rounded-xl">
                <button
                  onClick={handlePrev}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Previous Transition"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <span className="text-xs font-bold text-blue-100 px-1">
                  {currentIndex + 1} / {ALL_TRANSITION_TOPICS.length}
                </span>
                <button
                  onClick={handleNext}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Next Transition"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Dropdown Popover */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-2 z-50 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[460px] flex flex-col"
                >
                  {/* Dropdown Header with Search & Standard Tabs */}
                  <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2 shrink-0">
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-slate-400 text-[18px]">
                        search
                      </span>
                      <input
                        type="text"
                        placeholder="Search all topics (e.g., triangle, parabola, circle, derivative)..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 shadow-inner"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {(['All', 'Class 5-8', 'Class 9-10', 'Class 11-12 & Olympiad'] as const).map((std) => (
                        <button
                          key={std}
                          onClick={() => setSelectedStandard(std)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                            selectedStandard === std
                              ? 'bg-[#004ac6] text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {std}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dropdown Items List */}
                  <div className="overflow-y-auto p-2 space-y-1 divide-y divide-slate-100">
                    {filteredTopics.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No mathematical transitions found matching your search.
                      </div>
                    ) : (
                      filteredTopics.map((topic) => {
                        const isSelected = topic.key === activeModule;
                        return (
                          <button
                            key={topic.key}
                            onClick={() => {
                              setActiveModule(topic.key);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-left flex items-start gap-3 transition-colors cursor-pointer pt-2 ${
                              isSelected
                                ? 'bg-blue-50 text-[#004ac6]'
                                : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              <span className="material-symbols-outlined text-[18px]">{topic.icon}</span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold truncate">
                                  {topic.label}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                  isSelected ? 'bg-blue-200 text-blue-900' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {topic.grade}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {topic.shortDesc}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Active Standard Badge & Quick Category */}
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-white/15 text-blue-100 font-bold backdrop-blur-sm">
              Standard: <strong>{activeTopic.standardGroup}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/15 text-blue-100 font-bold backdrop-blur-sm">
              Domain: <strong>{activeTopic.category}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Sandbox Body */}
      <div className="p-4 sm:p-6 lg:p-8 bg-white min-h-[460px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {isGeometric && (
              <GeometricTransitions
                moduleKey={activeModule as any}
                onCopyText={copyToClipboard}
                copiedKey={copiedKey}
              />
            )}
            {isAlgebraic && (
              <AlgebraicTransitions
                moduleKey={activeModule as any}
                onCopyText={copyToClipboard}
                copiedKey={copiedKey}
              />
            )}
            {!isGeometric && !isAlgebraic && (
              <AdvancedTransitions
                moduleKey={activeModule as any}
                onCopyText={copyToClipboard}
                copiedKey={copiedKey}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
