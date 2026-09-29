import React, { useMemo, useState } from 'react';
import katex from 'katex';

interface ClassroomBoardRendererProps {
  solutionText: string;
  grade?: string;
  topic?: string;
  onCopy?: () => void;
  onPrint?: () => void;
}

// Helper to safely render LaTeX string with KaTeX
function renderMathToHtml(latex: string, displayMode: boolean = false): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
    });
  } catch (err) {
    return `<span class="font-mono text-amber-300">${latex}</span>`;
  }
}

// Convert mixed markdown and LaTeX text to styled HTML
function formatMathMarkdown(text: string): string {
  if (!text) return '';

  // 1. Process display math blocks: $$ ... $$ or \[ ... \]
  let processed = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    return `<div class="my-3 overflow-x-auto text-center py-2 px-3 bg-black/20 rounded-xl border border-white/10 math-display-block">${renderMathToHtml(
      math.trim(),
      true
    )}</div>`;
  });

  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    return `<div class="my-3 overflow-x-auto text-center py-2 px-3 bg-black/20 rounded-xl border border-white/10 math-display-block">${renderMathToHtml(
      math.trim(),
      true
    )}</div>`;
  });

  // 2. Process inline math: $ ... $ or \( ... \)
  // Ensure we don't match currency like $5 by requiring non-whitespace or equation characters
  processed = processed.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    return `<span class="inline-math px-1">${renderMathToHtml(math.trim(), false)}</span>`;
  });

  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    return `<span class="inline-math px-1">${renderMathToHtml(math.trim(), false)}</span>`;
  });

  // 3. Highlight mathematical justifications like [∵ Reason] or [Reason]
  processed = processed.replace(
    /\[([∵\:\s\w\d\+\-\*\/\=\(\)\,\.\'\"]+?)\]/g,
    '<span class="inline-block text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 ml-1.5 opacity-95">[$1]</span>'
  );

  return processed;
}

export const ClassroomBoardRenderer: React.FC<ClassroomBoardRendererProps> = ({
  solutionText,
  grade = 'Class 10',
  topic = 'Mathematics',
  onCopy,
  onPrint,
}) => {
  const [boardTheme, setBoardTheme] = useState<'chalkboard' | 'whiteboard'>('chalkboard');
  const [isCopied, setIsCopied] = useState(false);

  // Parse structured sections from the teacher solution
  const parsedSections = useMemo(() => {
    const rawLines = solutionText.split('\n');
    const sections: {
      type: 'header' | 'given' | 'formula' | 'solution' | 'rough' | 'answer' | 'tip' | 'general';
      title: string;
      content: string;
    }[] = [];

    let currentSection: {
      type: 'header' | 'given' | 'formula' | 'solution' | 'rough' | 'answer' | 'tip' | 'general';
      title: string;
      lines: string[];
    } = {
      type: 'general',
      title: '',
      lines: [],
    };

    const flushCurrent = () => {
      if (currentSection.lines.length > 0 || currentSection.title) {
        sections.push({
          type: currentSection.type,
          title: currentSection.title,
          content: currentSection.lines.join('\n').trim(),
        });
      }
    };

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('###')) {
        flushCurrent();

        const lower = trimmed.toLowerCase();
        let sType: 'header' | 'given' | 'formula' | 'solution' | 'rough' | 'answer' | 'tip' | 'general' = 'general';

        if (lower.includes('classroom board work') || lower.includes('board work')) {
          sType = 'header';
        } else if (lower.includes('given') || lower.includes('to find') || lower.includes('to prove')) {
          sType = 'given';
        } else if (lower.includes('formula') || lower.includes('theorem')) {
          sType = 'formula';
        } else if (lower.includes('step-by-step') || lower.includes('solution') || lower.includes('derivation')) {
          sType = 'solution';
        } else if (lower.includes('rough') || lower.includes('margin') || lower.includes('calculation')) {
          sType = 'rough';
        } else if (lower.includes('answer') || lower.includes('result')) {
          sType = 'answer';
        } else if (lower.includes('tip') || lower.includes('caution') || lower.includes('trap')) {
          sType = 'tip';
        }

        currentSection = {
          type: sType,
          title: trimmed.replace(/^###\s*/, ''),
          lines: [],
        };
      } else if (trimmed === '---' || trimmed === '***') {
        // Divider line, skip or separator
      } else {
        currentSection.lines.push(line);
      }
    }

    flushCurrent();
    return sections;
  }, [solutionText]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(solutionText);
    setIsCopied(true);
    if (onCopy) onCopy();
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const isChalkboard = boardTheme === 'chalkboard';

  return (
    <div className="flex flex-col w-full my-2">
      {/* Board Controls Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-900 text-white rounded-t-2xl border-t border-x border-slate-700 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setBoardTheme('chalkboard')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                isChalkboard
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Green Blackboard with white & colored chalk"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-emerald-200"></span>
              <span>Classroom Blackboard</span>
            </button>

            <button
              type="button"
              onClick={() => setBoardTheme('whiteboard')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                !isChalkboard
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Clean Whiteboard with dry-erase marker"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-blue-200 border border-blue-400"></span>
              <span>Whiteboard</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer font-semibold"
            title="Copy board solution"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isCopied ? 'check' : 'content_copy'}
            </span>
            <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Copy Board'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer font-semibold"
            title="Print or save as PDF"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span className="hidden sm:inline">Print Board</span>
          </button>
        </div>
      </div>

      {/* Main Board Surface */}
      <div
        className={`w-full relative rounded-b-2xl border-x-8 border-b-8 p-4 sm:p-7 shadow-2xl overflow-hidden transition-colors duration-300 font-['Plus_Jakarta_Sans',sans-serif] ${
          isChalkboard
            ? 'bg-[#0b2217] text-[#f8fafc] border-[#5c3a21] shadow-emerald-950/50'
            : 'bg-[#fafafa] text-[#0f172a] border-slate-300 shadow-slate-300/50'
        }`}
        style={{
          backgroundImage: isChalkboard
            ? 'radial-gradient(ellipse at top left, rgba(20, 80, 50, 0.4), transparent 70%), radial-gradient(ellipse at bottom right, rgba(0, 0, 0, 0.5), transparent 70%)'
            : 'linear-gradient(to bottom, #ffffff, #f8fafc)',
        }}
      >
        {/* Subtle Blackboard Grid Texture (Chalkboard Only) */}
        {isChalkboard && (
          <div
            className="absolute inset-0 pointer-events-none opacity-5"
            style={{
              backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
        )}

        {/* Board Top Header Banner: Date, Class, Teacher, Subject */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b-2 ${
            isChalkboard ? 'border-emerald-600/30 text-emerald-200' : 'border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shadow-sm ${
                isChalkboard
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-blue-600 text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">co_present</span>
            </div>
            <div>
              <div
                className={`text-xs font-black tracking-wider uppercase ${
                  isChalkboard ? 'text-amber-300' : 'text-blue-700'
                }`}
              >
                CLASSROOM BLACKBOARD • PROF. RAMAN
              </div>
              <div className="text-[11px] opacity-80">
                {grade} • {topic}
              </div>
            </div>
          </div>

          <div
            className={`text-right text-[11px] font-mono px-2.5 py-1 rounded-md border ${
              isChalkboard
                ? 'bg-black/30 border-white/10 text-emerald-300/90'
                : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </div>
        </div>

        {/* Board Content Grid */}
        <div className="space-y-6 relative z-10">
          {parsedSections.map((sec, idx) => {
            // 1. GIVEN & TO FIND
            if (sec.type === 'given') {
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border-2 ${
                    isChalkboard
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100 shadow-sm'
                      : 'bg-blue-50/70 border-blue-200 text-slate-800'
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider mb-2.5 ${
                      isChalkboard ? 'text-emerald-300' : 'text-blue-800'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">push_pin</span>
                    <span>{sec.title || '1. Given & To Find'}</span>
                  </div>
                  <div
                    className="text-xs sm:text-[13px] leading-relaxed space-y-1.5"
                    dangerouslySetInnerHTML={{ __html: formatMathMarkdown(sec.content) }}
                  />
                </div>
              );
            }

            // 2. FORMULA BOX / THEOREM
            if (sec.type === 'formula') {
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border-2 relative overflow-hidden ${
                    isChalkboard
                      ? 'bg-black/40 border-amber-400/60 text-amber-100 shadow-md'
                      : 'bg-amber-50/80 border-amber-300 text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div
                      className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider ${
                        isChalkboard ? 'text-amber-300' : 'text-amber-800'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[17px]">functions</span>
                      <span>{sec.title || '2. Key Formula Box'}</span>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        isChalkboard ? 'bg-amber-400 text-slate-950' : 'bg-amber-200 text-amber-900'
                      }`}
                    >
                      Standard Identity
                    </span>
                  </div>
                  <div
                    className="text-xs sm:text-sm font-medium leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatMathMarkdown(sec.content) }}
                  />
                </div>
              );
            }

            // 3. STEP-BY-STEP BOARD DERIVATION
            if (sec.type === 'solution') {
              return (
                <div
                  key={idx}
                  className={`p-4 sm:p-5 rounded-xl border-2 ${
                    isChalkboard
                      ? 'bg-black/25 border-emerald-400/30'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider mb-4 pb-2 border-b ${
                      isChalkboard
                        ? 'text-cyan-300 border-cyan-500/20'
                        : 'text-slate-800 border-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">draw</span>
                    <span>{sec.title || '3. Step-by-Step Board Solution'}</span>
                  </div>

                  <div
                    className="space-y-4 text-xs sm:text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatMathMarkdown(sec.content) }}
                  />
                </div>
              );
            }

            // 4. ROUGH WORK & MARGIN CALCULATIONS
            if (sec.type === 'rough') {
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border-2 border-dashed ${
                    isChalkboard
                      ? 'bg-slate-950/70 border-yellow-500/40 text-yellow-100 font-mono text-[11px] sm:text-xs'
                      : 'bg-yellow-50/60 border-yellow-300 text-slate-700 font-mono text-[11px] sm:text-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1 border-b border-current opacity-70">
                    <span className="font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px]">edit_note</span>
                      <span>{sec.title || 'Rough Work / Side Margin Calculations'}</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">
                      Margin Scratchpad
                    </span>
                  </div>
                  <div
                    className="whitespace-pre-wrap leading-relaxed overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: formatMathMarkdown(sec.content) }}
                  />
                </div>
              );
            }

            // 5. FINAL ANSWER BOX
            if (sec.type === 'answer') {
              return (
                <div
                  key={idx}
                  className={`p-4 sm:p-5 rounded-2xl border-3 shadow-lg ${
                    isChalkboard
                      ? 'bg-emerald-950/60 border-amber-400 text-amber-200'
                      : 'bg-emerald-50 border-emerald-500 text-emerald-950'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span>
                    <span
                      className={`text-xs font-black uppercase tracking-wider ${
                        isChalkboard ? 'text-amber-300' : 'text-emerald-800'
                      }`}
                    >
                      {sec.title || '5. Final Answer & Verification'}
                    </span>
                  </div>
                  <div
                    className="text-xs sm:text-base font-bold leading-relaxed space-y-2"
                    dangerouslySetInnerHTML={{ __html: formatMathMarkdown(sec.content) }}
                  />
                </div>
              );
            }

            // 6. TEACHER'S BOARD TIP & COMMON EXAM TRAP
            if (sec.type === 'tip') {
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border-2 ${
                    isChalkboard
                      ? 'bg-amber-950/40 border-amber-500/50 text-amber-100'
                      : 'bg-orange-50/80 border-orange-200 text-slate-800'
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider mb-2 ${
                      isChalkboard ? 'text-amber-300' : 'text-orange-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">lightbulb</span>
                    <span>{sec.title || "6. Teacher's Board Tip & Exam Caution"}</span>
                  </div>
                  <div
                    className="text-xs sm:text-[13px] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatMathMarkdown(sec.content) }}
                  />
                </div>
              );
            }

            // Fallback general section
            return (
              <div
                key={idx}
                className="text-xs sm:text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatMathMarkdown(sec.content) }}
              />
            );
          })}
        </div>

        {/* Chalkboard Ledge & Chalk Pieces (Visual Authenticity) */}
        {isChalkboard && (
          <div className="mt-8 pt-4 border-t-4 border-[#3c2514] flex items-center justify-between text-xs opacity-75">
            <div className="flex items-center gap-3">
              {/* White Chalk */}
              <div className="w-8 h-2.5 bg-slate-100 rounded-sm shadow-xs border border-white/40 transform -rotate-3" title="White chalk"></div>
              {/* Yellow Chalk */}
              <div className="w-7 h-2 bg-yellow-300 rounded-sm shadow-xs transform rotate-2" title="Yellow formula chalk"></div>
              {/* Cyan Chalk */}
              <div className="w-6 h-2 bg-cyan-300 rounded-sm shadow-xs transform -rotate-1" title="Blue step chalk"></div>
              {/* Chalkboard Eraser */}
              <div className="w-14 h-4 bg-amber-950 border border-amber-900 rounded-xs flex items-center justify-center text-[9px] text-amber-200/80 font-mono shadow-sm" title="Felt chalk eraser">
                ERASER
              </div>
            </div>
            <div className="text-[10px] font-mono text-emerald-300/70">
              Q.E.D. • Step-by-Step Proof Complete
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
