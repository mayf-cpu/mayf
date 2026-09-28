import React, { useState } from 'react';
import { MathResource } from '../data/mathResources';
import { formatPrice } from '../services/currency';
import { downloadResourceToSystem } from '../services/fileDownloader';

interface ResourceModalProps {
  resource: MathResource | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (title: string, size: string) => void;
  onOpenProPass: () => void;
  onShare?: (title: string, resource: MathResource) => void;
}

export const ResourceModal: React.FC<ResourceModalProps> = ({
  resource,
  isOpen,
  onClose,
  onDownload,
  onOpenProPass,
  onShare,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'sheet' | 'traps' | 'solutions'>('sheet');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  if (!isOpen || !resource) return null;

  const handleStartDownload = () => {
    if (resource.tier === 'pro') {
      onOpenProPass();
      return;
    }

    setDownloading(true);
    try {
      downloadResourceToSystem({
        title: resource.title,
        grade: resource.grade,
        topic: resource.topic,
        format: resource.format,
        downloadUrl: resource.downloadUrl,
        description: resource.description,
        keyFormulas: resource.keyFormulas,
        examTraps: resource.examTraps,
      });
    } catch (e) {
      console.warn('System download failed:', e);
    }

    setTimeout(() => {
      setDownloading(false);
      onDownload(resource.title, resource.sizeOrDuration);
    }, 400);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-4xl max-h-[94vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-3.5 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span
              className={`text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full truncate ${
                resource.tier === 'free'
                  ? 'bg-[#d1fae5] text-[#006242]'
                  : 'bg-[#ffddb8] text-[#653e00]'
              }`}
            >
              {resource.badgeLabel || (resource.tier === 'free' ? 'FREE' : 'PRO')}
            </span>
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-semibold shrink-0">
              {resource.grade}
            </span>
            <span className="hidden sm:inline-block text-xs text-gray-400">•</span>
            <span className="hidden sm:inline-block text-xs text-gray-500 font-medium truncate">
              {resource.sizeOrDuration}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {onShare && (
              <button
                type="button"
                onClick={() => onShare(resource.title, resource)}
                className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg font-bold border border-blue-200 transition-colors cursor-pointer"
                title="Share externally via Chrome direct link"
              >
                <span className="material-symbols-outlined text-[16px]">share</span>
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="Print standard A4 format"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Print A4</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Modal Sub-Bar with Tabs */}
        <div className="px-3 sm:px-6 py-2 bg-[#f0f3ff] border-b border-blue-50 flex items-center justify-between gap-2 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setActiveTab('sheet')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'sheet'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Formula Overview
            </button>
            <button
              onClick={() => setActiveTab('traps')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'traps'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Exam Traps ({resource.examTraps?.length || 2})
            </button>
            <button
              onClick={() => setActiveTab('solutions')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'solutions'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Step-by-Step Logic
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 shrink-0">
            <span>Zoom:</span>
            <button
              onClick={() => setZoomLevel((z) => Math.max(80, z - 10))}
              className="p-1 hover:bg-white rounded"
            >
              <span className="material-symbols-outlined text-[14px]">remove</span>
            </button>
            <span className="font-mono w-10 text-center">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
              className="p-1 hover:bg-white rounded"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
            </button>
          </div>
        </div>

        {/* Scrollable Document Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-[#f8fafc] max-w-full overflow-x-hidden">
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            className="max-w-2xl mx-auto bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200 transition-transform"
          >
            {/* Header branding in document */}
            <div className="flex items-center justify-between pb-4 border-b border-blue-100 mb-6">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest block">
                  Maths at Your Fingertips • Revision Deck
                </span>
                <h1 className="text-xl font-extrabold text-gray-900 mt-0.5">{resource.title}</h1>
                <p className="text-xs text-gray-500 mt-1">{resource.description}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold bg-blue-50 text-blue-800 px-2 py-1 rounded-md block">
                  {resource.grade}
                </span>
                <span className="text-[10px] text-gray-400 mt-1 block">Curriculum 2025</span>
              </div>
            </div>

            {activeTab === 'sheet' && (
              <div className="space-y-6">
                {/* Key Formulas Section */}
                <div>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-blue-600 text-[18px]">functions</span>
                    Key Formulas & Algebraic Relations
                  </h3>
                  <div className="space-y-2.5">
                    {resource.keyFormulas?.map((formula, idx) => (
                      <div
                        key={idx}
                        className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 flex items-center justify-between"
                      >
                        <span className="font-mono text-sm font-bold text-blue-950">{formula}</span>
                        <span className="text-[11px] font-bold text-blue-600 bg-white px-2 py-0.5 rounded shadow-2xs">
                          Ident. #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Practical Notes & Proof Method */}
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wide">
                    <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                    Quick Proof & Concept Mnemonic
                  </div>
                  <p className="text-xs text-amber-950 leading-relaxed">
                    Always balance terms symmetrically. When substituting negative values, use explicit
                    parentheses around negative arguments to avoid arithmetic sign drops.
                  </p>
                </div>

                {/* Curriculum Tags */}
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {resource.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="bg-gray-100 text-gray-600 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'traps' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  Typical Board Examination Trap Questions
                </h3>
                <div className="space-y-3">
                  {(resource.examTraps || [
                    'Sign error in negative expansions',
                    'Omitting cross-multiplication denominators',
                    'Unit mismatches between cm and m'
                  ]).map((trap, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-red-50/70 border border-red-200 rounded-xl text-xs space-y-1"
                    >
                      <div className="font-bold text-red-900 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-red-600">error</span>
                        Exam Trap #{idx + 1}
                      </div>
                      <p className="text-red-950 font-medium">{trap}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'solutions' && (
              <div className="space-y-4 text-xs text-gray-700">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Step-by-Step Problem Solving Methodology
                </h3>
                <ol className="list-decimal list-inside space-y-2 bg-gray-50 p-4 rounded-xl">
                  <li><strong>Identify Given Values:</strong> Write down all given variables with standard SI units.</li>
                  <li><strong>Select Governing Equation:</strong> Choose formula with minimal unknown parameters.</li>
                  <li><strong>Algebraic Rearrangement:</strong> Isolate the target variable before entering digits.</li>
                  <li><strong>Final Dimensional Check:</strong> Ensure units match (e.g. cm² for area, cm³ for volume).</li>
                </ol>
              </div>
            )}

            {/* Document Watermark */}
            <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-medium">
              <span>© Maths at Your Fingertips • Official Study Deck</span>
              <span>Class {resource.grade} • Verified Curriculum</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center text-[#fea619]">
              <span className="material-symbols-outlined text-[18px]">star</span>
              <span className="text-sm font-bold text-gray-900 ml-1">{resource.rating}</span>
            </div>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">{resource.downloadsCount} learners</span>
          </div>

          <div className="flex items-center gap-3">
            {resource.tier === 'pro' ? (
              <button
                onClick={onOpenProPass}
                className="inline-flex items-center gap-2 bg-[#fea619] text-[#2a1700] text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-amber-400 tactile-btn-secondary cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">lock</span>
                <span>Unlock for {formatPrice(resource.price || 199)}</span>
              </button>
            ) : (
              <button
                onClick={handleStartDownload}
                disabled={downloading}
                className="inline-flex items-center gap-2 bg-[#2563eb] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-blue-700 tactile-btn-primary cursor-pointer disabled:opacity-75"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {downloading ? 'sync' : 'download'}
                </span>
                <span>{downloading ? 'Generating PDF...' : 'Download Free PDF'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
