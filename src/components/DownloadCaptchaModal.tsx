import React, { useState, useEffect, useRef } from 'react';
import { MathResource } from '../data/mathResources';

interface DownloadCaptchaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  itemTitle: string;
  itemSize?: string;
  resource?: MathResource | null;
}

interface MathPuzzle {
  question: string;
  answer: number;
  hint: string;
  badge: string;
}

// Generate randomized math challenges suited for school learners
function generateMathPuzzle(): MathPuzzle {
  const types = ['add', 'sub', 'mult', 'algebra', 'power'] as const;
  const selectedType = types[Math.floor(Math.random() * types.length)];

  switch (selectedType) {
    case 'add': {
      const a = Math.floor(Math.random() * 25) + 6;
      const b = Math.floor(Math.random() * 25) + 5;
      return {
        question: `${a} + ${b}`,
        answer: a + b,
        hint: `Calculate the sum of ${a} and ${b}`,
        badge: 'Mental Addition',
      };
    }
    case 'sub': {
      const a = Math.floor(Math.random() * 30) + 20;
      const b = Math.floor(Math.random() * 15) + 4;
      return {
        question: `${a} − ${b}`,
        answer: a - b,
        hint: `Subtract ${b} from ${a}`,
        badge: 'Mental Subtraction',
      };
    }
    case 'mult': {
      const a = Math.floor(Math.random() * 10) + 3;
      const b = Math.floor(Math.random() * 9) + 3;
      return {
        question: `${a} × ${b}`,
        answer: a * b,
        hint: `Multiply ${a} by ${b}`,
        badge: 'Multiplication Table',
      };
    }
    case 'algebra': {
      const x = Math.floor(Math.random() * 10) + 2;
      const m = Math.floor(Math.random() * 5) + 2;
      const product = m * x;
      return {
        question: `Solve for x: ${m}x = ${product}`,
        answer: x,
        hint: `Divide ${product} by ${m}`,
        badge: '1-Step Algebra',
      };
    }
    case 'power': {
      const bases = [3, 4, 5, 6, 7, 8, 9, 10];
      const base = bases[Math.floor(Math.random() * bases.length)];
      return {
        question: `${base}² = ?`,
        answer: base * base,
        hint: `Find square of ${base} (${base} × ${base})`,
        badge: 'Square Numbers',
      };
    }
    default: {
      return {
        question: '7 + 8',
        answer: 15,
        hint: 'Calculate sum of 7 and 8',
        badge: 'Basic Arithmetic',
      };
    }
  }
}

// Generate distorted 4-character visual security code
function generateVisualCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const DownloadCaptchaModal: React.FC<DownloadCaptchaModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  itemTitle,
  itemSize = '2.4 MB',
  resource,
}) => {
  const [mode, setMode] = useState<'math' | 'visual'>('math');
  const [puzzle, setPuzzle] = useState<MathPuzzle>(generateMathPuzzle);
  const [visualCode, setVisualCode] = useState<string>(generateVisualCode);
  const [userInput, setUserInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset challenge on open
  useEffect(() => {
    if (isOpen) {
      setPuzzle(generateMathPuzzle());
      setVisualCode(generateVisualCode());
      setUserInput('');
      setErrorMsg('');
      setIsVerifying(false);
      setIsSuccess(false);
      setAttempts(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const refreshCaptcha = () => {
    setPuzzle(generateMathPuzzle());
    setVisualCode(generateVisualCode());
    setUserInput('');
    setErrorMsg('');
    inputRef.current?.focus();
  };

  const handleAudioSpeak = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak =
        mode === 'math'
          ? `Maths verification puzzle: ${puzzle.question.replace('×', 'times').replace('−', 'minus')}`
          : `Security code is: ${visualCode.split('').join(' ')}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim()) {
      setErrorMsg('Please enter the verification answer below.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');

    setTimeout(() => {
      let isCorrect = false;
      if (mode === 'math') {
        const parsed = parseInt(userInput.trim(), 10);
        isCorrect = !isNaN(parsed) && parsed === puzzle.answer;
      } else {
        isCorrect = userInput.trim().toUpperCase() === visualCode.toUpperCase();
      }

      if (isCorrect) {
        setIsVerifying(false);
        setIsSuccess(true);
        setTimeout(() => {
          onVerified();
          onClose();
        }, 600);
      } else {
        setIsVerifying(false);
        setAttempts((prev) => prev + 1);
        setErrorMsg('Incorrect answer. A new challenge has been generated. Please try again.');
        refreshCaptcha();
      }
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-blue-100 overflow-hidden transform transition-all animate-scaleUp">
        {/* Header with Security Shield */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
            title="Cancel"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-white text-[24px]">verified_user</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-blue-100">
                  Security Check
                </span>
                <span className="text-[10px] text-blue-200 font-semibold">• Bot Protection</span>
              </div>
              <h3 className="font-extrabold text-lg text-white leading-tight mt-0.5">
                Verify Before Downloading
              </h3>
            </div>
          </div>
        </div>

        {/* Target Resource Summary */}
        <div className="bg-blue-50/70 border-b border-blue-100/80 px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs">
              <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate" title={itemTitle}>
                {itemTitle}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                <span>{resource?.grade || 'Class Syllabus'}</span>
                <span>•</span>
                <span>{itemSize}</span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold">High-Speed PDF</span>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
            Verified Safe
          </span>
        </div>

        {/* Captcha Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Solve this challenge to verify you are a human learner:
            </span>
            {/* Mode switch */}
            <div className="flex items-center gap-1 text-[11px] bg-slate-100 p-0.5 rounded-lg font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode('math');
                  setUserInput('');
                  setErrorMsg('');
                }}
                className={`px-2 py-0.8 rounded-md transition-colors cursor-pointer ${
                  mode === 'math' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Math Puzzle
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('visual');
                  setUserInput('');
                  setErrorMsg('');
                }}
                className={`px-2 py-0.8 rounded-md transition-colors cursor-pointer ${
                  mode === 'visual' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Code
              </button>
            </div>
          </div>

          {/* Captcha Challenge Canvas Box */}
          <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-4 text-white shadow-inner flex flex-col items-center justify-center border border-indigo-900/50 min-h-[110px] overflow-hidden select-none">
            {/* Background noise grid & decorative lines */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, transparent 1px)',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 8px 8px',
              }}
            />
            {/* Decorative wavy lines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-20 stroke-blue-400"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line x1="0" y1="20" x2="380" y2="90" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="20" y1="100" x2="360" y2="15" strokeWidth="1" strokeDasharray="3 3" />
            </svg>

            {mode === 'math' ? (
              <div className="relative z-10 text-center space-y-1">
                <div className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  <span className="material-symbols-outlined text-[13px]">calculate</span>
                  <span>{puzzle.badge}</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black tracking-wider text-white font-mono drop-shadow-md">
                  {puzzle.question} = <span className="text-amber-300">?</span>
                </div>
                <p className="text-[11px] text-blue-200/90">{puzzle.hint}</p>
              </div>
            ) : (
              <div className="relative z-10 text-center space-y-1">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-sky-300 bg-sky-400/20 px-2.5 py-0.5 rounded-full border border-sky-400/30 inline-block mb-1">
                  Type the 4 letters/digits
                </div>
                <div className="flex items-center justify-center gap-3">
                  {visualCode.split('').map((char, idx) => {
                    const rotations = [-8, 6, -4, 9];
                    const rot = rotations[idx % rotations.length];
                    const colors = ['text-emerald-300', 'text-amber-300', 'text-sky-300', 'text-pink-300'];
                    const colorClass = colors[idx % colors.length];
                    return (
                      <span
                        key={idx}
                        style={{ transform: `rotate(${rot}deg)` }}
                        className={`text-3xl font-black font-mono tracking-widest ${colorClass} drop-shadow-lg inline-block`}
                      >
                        {char}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions (Audio / Refresh) */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1 z-10">
              <button
                type="button"
                onClick={handleAudioSpeak}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Read aloud"
              >
                <span className="material-symbols-outlined text-[15px]">volume_up</span>
              </button>
              <button
                type="button"
                onClick={refreshCaptcha}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Get another puzzle"
              >
                <span className="material-symbols-outlined text-[15px]">refresh</span>
              </button>
            </div>
          </div>

          {/* Form Input */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {mode === 'math' ? 'Enter your calculated answer:' : 'Enter the 4 characters shown above:'}
              </label>
              <div className="relative flex items-center">
                <input
                  ref={inputRef}
                  type={mode === 'math' ? 'number' : 'text'}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={mode === 'math' ? 'Type the number (e.g. 15)' : 'Type the 4 letters/numbers'}
                  disabled={isVerifying || isSuccess}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 text-base font-bold px-3.5 py-2.5 rounded-xl outline-none transition-all placeholder:text-slate-400"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="absolute right-2 text-slate-400 hover:text-blue-600 p-1 cursor-pointer"
                  title="New question"
                >
                  <span className="material-symbols-outlined text-[18px]">cached</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-1.5 animate-fadeIn">
                <span className="material-symbols-outlined text-[16px] text-red-500 shrink-0">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success state */}
            {isSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0">check_circle</span>
                <span>Captcha verified! Starting your download now...</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={isVerifying || isSuccess}
                className="w-1/3 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVerifying || isSuccess || !userInput.trim()}
                className="w-2/3 py-2.5 px-4 bg-[#004ac6] hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Verifying...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    <span>Download Ready!</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>Verify &amp; Download</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Trust footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-emerald-600">lock</span>
              Safe &amp; Clean PDF
            </span>
            <span>Maths at Your Fingertips</span>
          </div>
        </div>
      </div>
    </div>
  );
};
