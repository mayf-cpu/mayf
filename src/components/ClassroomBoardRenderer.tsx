import React, { useMemo, useState } from 'react';
import katex from 'katex';

interface ClassroomBoardRendererProps {
  solutionText?: string;
  content?: string;
  grade?: string;
  topic?: string;
  onCopy?: () => void;
  onPrint?: () => void;
}

// Helper to strip \boxed{...}, \fbox{...}, \framebox{...}, \bbox{...}, \enclose{...}
// which in KaTeX produces collapsed stretchy box artifacts (vertical line across text)
function stripBoxed(str: string): string {
  if (!str) return '';
  const commands = ['boxed', 'fbox', 'framebox', 'bbox', 'enclose'];
  let out = str;
  for (const cmd of commands) {
    const pattern = new RegExp('\\\\' + cmd + '\\s*\\{');
    let safety = 0;
    while (pattern.test(out) && safety < 12) {
      safety++;
      const match = out.match(pattern);
      if (!match || match.index === undefined) break;
      const startIdx = match.index;
      const braceStart = startIdx + match[0].length - 1;
      let depth = 1;
      let endIdx = braceStart + 1;
      while (endIdx < out.length && depth > 0) {
        if (out[endIdx] === '{' && out[endIdx - 1] !== '\\') depth++;
        else if (out[endIdx] === '}' && out[endIdx - 1] !== '\\') depth--;
        endIdx++;
      }
      if (depth === 0) {
        const inner = out.substring(braceStart + 1, endIdx - 1);
        out = out.substring(0, startIdx) + inner + out.substring(endIdx);
      } else {
        out = out.substring(0, startIdx) + out.substring(braceStart + 1);
      }
    }
  }
  // Strip any vertical pipe | overlaid or directly adjacent to the word Answer
  out = out.replace(/(?:^|(?<=\s))\|(?=\s*(?:Answer|Result|\\text\{Answer))/gi, '');
  out = out.replace(/(?<=(?:Answer|Result|\\text\{Answer\})[^\n\|]*?)\|(?=\s|$)/gi, '');
  return out;
}

// Helper to safely render LaTeX string with KaTeX
function renderMathToHtml(latex: string, displayMode: boolean = false): string {
  if (!latex) return '';
  // If the input already contains HTML tags (like <div or <span), it was already rendered - return it directly
  if (/<[a-z][\s\S]*>/i.test(latex)) {
    return latex;
  }
  try {
    const cleanLatex = stripBoxed(latex.trim());
    return katex.renderToString(cleanLatex, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
    });
  } catch (err) {
    return `<span class="font-mono text-amber-300">${latex}</span>`;
  }
}

// Convert mixed markdown and LaTeX text to styled HTML safely without re-scanning generated HTML
function formatMathMarkdown(text: string): string {
  if (!text) return '';

  // Clean all raw markdown double asterisks ** everywhere
  let processed = text.replace(/\*\*/g, '');

  // Strip any vertical bar placed directly over or before/after Answer
  processed = processed.replace(/(?:^|\b)\|\s*(Answer\b|\\text\{Answer\})/gi, '$1');
  processed = processed.replace(/(Answer\b|\\text\{Answer\}[^\$]*?)\s*\|(?=\b|$)/gi, '$1');

  // Strip boxed/fbox artifacts from mathematical formulas
  processed = stripBoxed(processed);

  const placeholders: { key: string; html: string }[] = [];
  const createPlaceholder = (html: string) => {
    const key = `@@MATH_BLOCK_${placeholders.length}_${Math.random().toString(36).substring(2, 6)}@@`;
    placeholders.push({ key, html });
    return key;
  };

  // 1. Process display math blocks: $$ ... $$ or \[ ... \]
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    const html = `<div class="my-1 sm:my-1.5 overflow-x-auto text-center py-2 px-3 bg-black/20 rounded-xl border border-white/10 math-display-block">${renderMathToHtml(
      math.trim(),
      true
    )}</div>`;
    return createPlaceholder(html);
  });

  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    const html = `<div class="my-1 sm:my-1.5 overflow-x-auto text-center py-2 px-3 bg-black/20 rounded-xl border border-white/10 math-display-block">${renderMathToHtml(
      math.trim(),
      true
    )}</div>`;
    return createPlaceholder(html);
  });

  // 2. Process inline math: $ ... $ or \( ... \)
  // Ensure we don't match currency like $5 by requiring non-whitespace or equation characters
  processed = processed.replace(/\$([^\$\n]+?)\$/g, (orig, math) => {
    if (math.includes('@@MATH_BLOCK_')) return orig;
    const html = `<span class="inline-math px-1">${renderMathToHtml(math.trim(), false)}</span>`;
    return createPlaceholder(html);
  });

  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (orig, math) => {
    if (math.includes('@@MATH_BLOCK_')) return orig;
    const html = `<span class="inline-math px-1">${renderMathToHtml(math.trim(), false)}</span>`;
    return createPlaceholder(html);
  });

  // 3. Highlight mathematical justifications like [∵ Reason] or [Reason] in generic text
  processed = processed.replace(
    /\[([∵\:\s\w\d\+\-\*\/\=\(\)\,\.\'\"\\\$]+?)\]/g,
    '<span class="inline-block text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 ml-1.5 opacity-95">[$1]</span>'
  );

  // 4. Clean any remaining stray un-paired dollar signs
  processed = processed.replace(/(?:^|\s)\$+(?=\s|$)/g, ' ');

  // 5. Restore all placeholders
  for (const item of placeholders) {
    processed = processed.replace(item.key, item.html);
  }

  return processed;
}

// Clean and format mathematical justification strings (converts LaTeX commands like \because, \text{}, etc. into visible math)
function formatJustificationHtml(rawJustification: string): string {
  if (!rawJustification) return '';
  let str = rawJustification.trim();

  // Strip outer [ and ]
  if (str.startsWith('[') && str.endsWith(']')) {
    str = str.substring(1, str.length - 1).trim();
  }

  // Replace \because with clean mathematical symbol ∵
  str = str.replace(/\\because\b/g, '∵');

  // Strip \text{...} wrappers so plain explanations are visible without LaTeX command wrappers
  for (let i = 0; i < 6; i++) {
    if (!/\\text\{/.test(str)) break;
    str = str.replace(/\\text\{([^{}]*)\}/g, '$1');
  }

  // Replace common LaTeX mathematical symbols with visible mathematical characters
  str = str.replace(/\\times\b/g, '×');
  str = str.replace(/\\div\b/g, '÷');
  str = str.replace(/\\pm\b/g, '±');
  str = str.replace(/\\le\b/g, '≤');
  str = str.replace(/\\ge\b/g, '≥');
  str = str.replace(/\\ne\b/g, '≠');
  str = str.replace(/\\triangle\b/g, '△');
  str = str.replace(/\\angle\b/g, '∠');
  str = str.replace(/\\circ\b/g, '°');

  // Ensure clean spacing after ∵
  if (str.startsWith('∵')) {
    str = '∵ ' + str.substring(1).trim();
  } else if (
    !str.startsWith('Since') &&
    !str.startsWith('Given') &&
    !str.startsWith('By') &&
    !str.startsWith('Applying')
  ) {
    str = '∵ ' + str;
  }

  // If inline math $...$ is inside the justification, render via formatMathMarkdown first
  str = formatMathMarkdown(str);

  // If there are raw LaTeX fractions like \frac{10}{2} without $, render them with KaTeX
  if (/\\frac\{[^{}]+\}\{[^{}]+\}/.test(str)) {
    str = str.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (_, num, den) => {
      return renderMathToHtml(`\\frac{${num}}{${den}}`, false);
    });
  }

  // Clean any remaining double spaces
  str = str.replace(/\s{2,}/g, ' ');

  return `[${str.trim()}]`;
}

export const ClassroomBoardRenderer: React.FC<ClassroomBoardRendererProps> = ({
  solutionText,
  content,
  grade = 'Class 10',
  topic = 'Mathematics',
}) => {
  // Always use authentic Classroom Blackboard
  const isChalkboard = true;
  const actualText = solutionText || content || '';

  // Parse structured sections from the teacher solution
  const parsedSections = useMemo(() => {
    const rawLines = actualText.split('\n');
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
      // Exclude rough work sections from being rendered entirely
      if ((currentSection.lines.length > 0 || currentSection.title) && currentSection.type !== 'rough') {
        sections.push({
          type: currentSection.type,
          title: currentSection.title.replace(/\*\*/g, '').trim(),
          content: currentSection.lines.join('\n').replace(/\*\*/g, '').trim(),
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
          title: trimmed.replace(/^###\s*/, '').replace(/\*\*/g, ''),
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

  return (
    <div className="flex flex-col w-full my-2">
      {/* Board Controls Toolbar - Classroom Blackboard only */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-t-2xl border-t border-x border-slate-700 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-emerald-200"></span>
          <span className="font-bold text-emerald-300 tracking-wide text-xs">
            Classroom Blackboard
          </span>
        </div>
      </div>

      {/* Main Board Surface */}
      <div
        className="w-full relative rounded-b-2xl border-x-8 border-b-8 p-4 sm:p-7 shadow-2xl overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] bg-[#0b2217] text-[#f8fafc] border-[#5c3a21] shadow-emerald-950/50"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at top left, rgba(20, 80, 50, 0.4), transparent 70%), radial-gradient(ellipse at bottom right, rgba(0, 0, 0, 0.5), transparent 70%)',
        }}
      >
        {/* Subtle Blackboard Grid Texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Board Top Header Banner: Date, Class, Teacher, Subject */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b-2 border-emerald-600/30 text-emerald-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shadow-sm bg-amber-400 text-slate-950">
              <span className="material-symbols-outlined text-[18px]">co_present</span>
            </div>
            <div>
              <div className="text-xs font-black tracking-wider uppercase text-amber-300">
                CLASSROOM BLACKBOARD • PROF. RAMAN
              </div>
              <div className="text-[11px] opacity-80">
                {grade} • {topic}
              </div>
            </div>
          </div>

          <div className="text-right text-[11px] font-mono px-2.5 py-1 rounded-md border bg-black/30 border-white/10 text-emerald-300/90">
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
                  className="p-4 rounded-xl border-2 bg-emerald-950/40 border-emerald-500/40 text-emerald-100 shadow-sm"
                >
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider mb-2.5 text-emerald-300">
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
                  className="p-4 rounded-xl border-2 relative overflow-hidden bg-black/40 border-amber-400/60 text-amber-100 shadow-md"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-300">
                      <span className="material-symbols-outlined text-[17px]">functions</span>
                      <span>{sec.title || '2. Key Formula Box'}</span>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950">
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
              // 1. Clean asterisks
              let rawSolution = sec.content.replace(/\*\*/g, '');

              // 2. Normalize multiline display math blocks into cohesive single-line blocks ($$\n...\n$$ -> $$ ... $$)
              // This prevents display math delimiters from being split onto orphan lines ($)
              rawSolution = rawSolution.replace(/\$\$\s*\n+([\s\S]*?)\n+\s*\$\$/g, (_, inner) => {
                return `$$ ${inner.trim()} $$`;
              });
              rawSolution = rawSolution.replace(/\\\[\s*\n+([\s\S]*?)\n+\s*\\\]/g, (_, inner) => {
                return `$$ ${inner.trim()} $$`;
              });

              // 3. If a justification follows a display math block on the very next line, join it onto the same step row
              rawSolution = rawSolution.replace(
                /(\$\$[^\$\n]+?\$\$)\s*\n+\s*(\[[^\]\n]*?(?:∵|because|Reason|Since|Theorem|Property)[^\]\n]*?\])/gi,
                '$1 $2'
              );

              // 4. Ensure "Next Step" or subsequent transformations start on a brand-new row
              rawSolution = rawSolution
                .replace(/(\[[^\]\n]*?(?:∵|because|Reason|Since|Theorem|Property)[^\]\n]*?\])\s*([A-Za-z0-9\$\\\(])/gi, '$1\n$2')
                .replace(/([^\n])\s*(Next\s*Step(?:[\s\:\-])?)/gi, '$1\n$2')
                .replace(/([^\n])\s*(\bStep\s*\d+(?:[\s\:\-])?)/gi, '$1\n$2')
                .replace(/([^\n])\s*(\b\d+\.\s+[A-Za-z\$\\\(])/gi, '$1\n$2');

              // 5. Split into lines and strictly discard any lines that consist solely of dollar signs or delimiters
              const stepLines = rawSolution
                .split('\n')
                .map((l) => l.trim())
                .filter((line) => {
                  if (!line) return false;
                  // Discard any line that contains only $ or $$ or backslashed delimiters or markdown dashes
                  if (/^\s*(?:\$+|\\\[|\\\]|\\\(|\\\)|[\-\*\_]{2,})\s*$/.test(line)) return false;
                  return true;
                });

              const parsedSteps = stepLines.map((line) => {
                const match = line.match(/\s*(\[[^\]\n]*?(?:∵|because|Reason|Since|Theorem|Property)[^\]\n]*?\])[\s\.\;]*$/i);
                if (match) {
                  const justification = match[1];
                  const equation = line.substring(0, line.lastIndexOf(match[0])).trim();
                  return { equation: equation || line, justification };
                }
                return { equation: line, justification: null };
              });

              return (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-xl border-2 bg-black/25 border-emerald-400/30 space-y-3"
                >
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider pb-2 border-b text-cyan-300 border-cyan-500/20">
                    <span className="material-symbols-outlined text-[18px]">draw</span>
                    <span>{sec.title || '3. Step-by-Step Board Solution'}</span>
                  </div>

                  <div className="space-y-2.5">
                    {parsedSteps.map((stepItem, sIdx) => {
                      const isNextStepHeader = /^(?:Next\s*Step|Step\s*\d+|\d+\.)/i.test(stepItem.equation);
                      return (
                        <div
                          key={sIdx}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-xl transition-all ${
                            isNextStepHeader
                              ? 'bg-black/35 border border-cyan-500/25 shadow-xs'
                              : 'bg-black/20 hover:bg-black/30 border border-white/5 hover:border-emerald-500/30'
                          }`}
                        >
                          <div
                            className={`flex-1 min-w-0 text-xs sm:text-sm leading-relaxed ${
                              isNextStepHeader ? 'text-cyan-100 font-semibold' : 'text-slate-100'
                            }`}
                            dangerouslySetInnerHTML={{ __html: formatMathMarkdown(stepItem.equation) }}
                          />
                          {stepItem.justification && (
                            <div className="sm:ml-auto shrink-0 self-center flex items-center">
                              <span
                                className="inline-flex items-center text-[11px] sm:text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 shadow-xs"
                                dangerouslySetInnerHTML={{ __html: formatJustificationHtml(stepItem.justification) }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // 4. ROUGH WORK & MARGIN CALCULATIONS - REMOVED per user request
            if (sec.type === 'rough') {
              return null;
            }

            // 4. FINAL ANSWER BOX - Verification / Quick Check removed per user request
            // Strips any \boxed{} or vertical lines placed over/around Answer
            if (sec.type === 'answer') {
              const rawClean = sec.content
                .replace(/(?:[-*•]\s*)?\*{0,2}(?:Verification(?:\s*\/\s*Quick\s*Check)?|Quick\s*Check)[\s\S]*/i, '')
                .replace(/\|\s*(?:Answer|Result)\s*[:=]?/gi, 'Answer: ')
                .replace(/(?:^|\n)\s*\|\s*/g, '$1')
                .replace(/\s*\|\s*(?=\n|$)/g, '')
                .trim();
              const cleanAnswerContent = stripBoxed(rawClean);

              const displayTitle = (sec.title || '4. Final Answer Box')
                .replace(/\s*&\s*Verification/i, '')
                .replace(/\s*\/\s*Verification/i, '')
                .replace(/\*\*/g, '')
                .replace(/5\.\s*/i, '4. ');

              return (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-2xl border-3 shadow-lg bg-emerald-950/60 border-amber-400 text-amber-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span>
                    <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                      {displayTitle}
                    </span>
                  </div>
                  <div
                    className="text-xs sm:text-base font-bold leading-relaxed space-y-2"
                    dangerouslySetInnerHTML={{ __html: formatMathMarkdown(cleanAnswerContent) }}
                  />
                </div>
              );
            }

            // 5. TEACHER'S BOARD TIP & COMMON EXAM TRAP
            if (sec.type === 'tip') {
              const displayTipTitle = (sec.title || "5. Teacher's Board Tip & Exam Caution")
                .replace(/\*\*/g, '')
                .replace(/6\.\s*/i, '5. ');
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border-2 bg-amber-950/40 border-amber-500/50 text-amber-100"
                >
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider mb-2 text-amber-300">
                    <span className="material-symbols-outlined text-[17px]">lightbulb</span>
                    <span>{displayTipTitle}</span>
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
