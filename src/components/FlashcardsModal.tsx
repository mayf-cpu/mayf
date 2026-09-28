import React, { useState } from 'react';
import { FLASHCARDS_LIST } from '../data/mathResources';

interface FlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadSheet: (title: string, size: string) => void;
}

export const FlashcardsModal: React.FC<FlashcardsModalProps> = ({
  isOpen,
  onClose,
  onDownloadSheet,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<number[]>([]);

  if (!isOpen) return null;

  const currentCard = FLASHCARDS_LIST[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % FLASHCARDS_LIST.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + FLASHCARDS_LIST.length) % FLASHCARDS_LIST.length);
  };

  const toggleMastered = (id: number) => {
    if (masteredIds.includes(id)) {
      setMasteredIds(masteredIds.filter((m) => m !== id));
    } else {
      setMasteredIds([...masteredIds, id]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#f9f9ff] w-full max-w-xl max-h-[94vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-emerald-100 flex flex-col overflow-hidden">
        {/* Top header */}
        <div className="px-3.5 sm:px-6 py-3 sm:py-4 bg-white border-b border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold bg-[#d1fae5] text-[#006242] px-2 sm:px-2.5 py-0.5 rounded-full shrink-0">
              FLASHCARDS
            </span>
            <span className="text-xs font-bold text-gray-700 truncate">Class 7 Fractions</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => onDownloadSheet('Fractions & Decimals Printable Flashcard Deck (36 Cards)', '1.4 MB')}
              className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 sm:px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span className="hidden sm:inline">Download Printable A4</span>
              <span className="sm:hidden">Print</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Progress & Card Count */}
        <div className="px-6 py-2 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between text-xs text-gray-600 font-semibold">
          <span>Card {currentIndex + 1} of {FLASHCARDS_LIST.length}</span>
          <span className="text-emerald-700 font-bold">
            Mastered: {masteredIds.length}/{FLASHCARDS_LIST.length}
          </span>
        </div>

        {/* Interactive 3D Flip Card Container */}
        <div className="p-6 flex-1 flex flex-col items-center justify-center">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full max-w-md aspect-[4/3] bg-white rounded-3xl p-6 sm:p-8 shadow-lg border-2 border-emerald-100 flex flex-col justify-between cursor-pointer transition-all hover:shadow-xl hover:border-emerald-300 relative select-none"
          >
            {/* Top card pill */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full">
                {currentCard.category}
              </span>
              <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">touch_app</span>
                Tap to {isFlipped ? 'see question' : 'flip answer'}
              </span>
            </div>

            {/* Main Content Area */}
            <div className="my-auto text-center py-4">
              {!isFlipped ? (
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">
                    Question
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 leading-snug">
                    {currentCard.question}
                  </h3>
                  <div className="inline-block bg-gray-50 text-gray-600 text-xs px-3 py-1 rounded-full mt-2">
                    💡 Click card to reveal mental trick
                  </div>
                </div>
              ) : (
                <div className="space-y-3 animate-fadeIn">
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest block">
                    Solution & Memory Trick
                  </span>
                  <div className="text-lg font-mono font-bold text-emerald-900 bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200">
                    {currentCard.answer}
                  </div>
                  <p className="text-xs text-emerald-800 font-medium leading-relaxed bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    ⚡ {currentCard.tip}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Card Footer */}
            <div className="pt-2 flex items-center justify-between border-t border-gray-100 text-xs text-gray-400 font-medium">
              <span>Double-Sided Study Deck</span>
              <span>Class 7 Maths</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-6 flex items-center gap-3 w-full max-w-md justify-between">
            <button
              onClick={handlePrev}
              className="flex-1 py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Previous</span>
            </button>

            <button
              onClick={() => toggleMastered(currentCard.id)}
              className={`py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                masteredIds.includes(currentCard.id)
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {masteredIds.includes(currentCard.id) ? 'check_circle' : 'circle'}
              </span>
              <span>{masteredIds.includes(currentCard.id) ? 'Mastered!' : 'Mark Mastered'}</span>
            </button>

            <button
              onClick={handleNext}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer flex items-center justify-center gap-1 tactile-btn-primary"
            >
              <span>Next</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
