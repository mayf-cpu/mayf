import React, { useState, useEffect } from 'react';
import { MathResource } from '../data/mathResources';

interface VideoPlayerModalProps {
  resource: MathResource | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenProPass: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  resource,
  isOpen,
  onClose,
  onOpenProPass,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<'1x' | '1.25x' | '1.5x'>('1x');
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [currentTimeSec, setCurrentTimeSec] = useState(74);

  const chapters = [
    { title: '01. Lines & Parallel Intersecting Angles', duration: '28:10', time: 0 },
    { title: '02. Triangles Congruency (SAS, ASA, RHS Proofs)', duration: '44:20', time: 1690 },
    { title: '03. Quadrilaterals & Midpoint Theorem Logic', duration: '36:15', time: 4350 },
    { title: '04. Circles: Angles Subtended at Centre vs Arc', duration: '42:50', time: 6525 },
    { title: '05. High-Yield 10-Year NCERT Exemplar Sums', duration: '58:25', time: 9100 },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && isPlaying) {
      interval = setInterval(() => {
        setCurrentTimeSec((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, isPlaying]);

  if (!isOpen || !resource) return null;

  const getEmbedUrl = (raw?: string) => {
    if (!raw) return null;
    let videoId = raw.trim();
    if (videoId.includes('v=')) {
      videoId = videoId.split('v=')[1]?.split('&')[0] || videoId;
    } else if (videoId.includes('youtu.be/')) {
      videoId = videoId.split('youtu.be/')[1]?.split('?')[0] || videoId;
    }
    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  };

  const embedUrl = getEmbedUrl(resource.youtubeId);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#111c2d] text-white w-full max-w-5xl max-h-[94vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold bg-[#fea619] text-[#2a1700] px-2 sm:px-2.5 py-0.5 rounded-full shrink-0">
              4K VIDEO
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-200 truncate">
              {resource.title}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 cursor-pointer transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Main Video Screen Area */}
          <div className="flex-1 flex flex-col bg-black justify-between relative overflow-hidden">
            {embedUrl ? (
              <div className="flex-1 w-full h-full min-h-[320px] sm:min-h-[460px] bg-black flex items-center justify-center">
                <iframe
                  src={embedUrl}
                  title={resource.title}
                  className="w-full h-full aspect-video border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              /* Visual Canvas Representation of Math Animation */
              <div className="flex-1 relative flex items-center justify-center p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
                {/* Dynamic Interactive Geometric Animation Preview */}
                <div className="relative w-full max-w-lg aspect-video bg-slate-900/90 rounded-2xl border border-blue-500/30 p-4 flex flex-col items-center justify-center shadow-2xl">
                  <div className="absolute top-3 left-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-[11px] font-mono font-bold text-blue-400">
                      THEOREM 7.2 PROOF CANVAS
                    </span>
                  </div>

                  {/* Animated Geometric Diagram */}
                  <svg
                    className="w-56 h-36 text-blue-400 fill-none stroke-current"
                    strokeWidth="2.5"
                    viewBox="0 0 200 130"
                  >
                    {/* Isosceles triangle */}
                    <polygon
                      fill="#3b82f6"
                      fillOpacity="0.1"
                      points="100,20 30,110 170,110"
                      stroke="#60a5fa"
                    />
                    {/* Median / Angle bisector */}
                    <line
                      stroke="#f59e0b"
                      strokeDasharray="4 2"
                      strokeWidth="2"
                      x1="100"
                      x2="100"
                      y1="20"
                      y2="110"
                    />
                    {/* Vertices text */}
                    <text className="fill-white text-[11px] font-bold" stroke="none" x="95" y="14">A</text>
                    <text className="fill-white text-[11px] font-bold" stroke="none" x="16" y="118">B</text>
                    <text className="fill-white text-[11px] font-bold" stroke="none" x="175" y="118">C</text>
                    <text className="fill-amber-400 text-[11px] font-bold" stroke="none" x="97" y="125">D</text>

                    {/* Equal sides tick marks */}
                    <line stroke="#ec4899" strokeWidth="2.5" x1="58" x2="68" y1="62" y2="67" />
                    <line stroke="#ec4899" strokeWidth="2.5" x1="132" x2="142" y1="67" y2="62" />
                  </svg>

                  <div className="mt-2 text-center">
                    <span className="text-xs font-bold text-white bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                      "Angles opposite to equal sides of an isosceles triangle are equal (∠B = ∠C)"
                    </span>
                  </div>

                  {/* Watermark in video */}
                  <div className="absolute bottom-3 right-4 text-[10px] text-slate-500 font-mono">
                    MathsAtYourFingertips • 1080p 60fps
                  </div>
                </div>
              </div>
            )}

            {/* Video Controls Bar */}
            <div className="bg-slate-900/95 px-3 sm:px-5 py-2.5 sm:py-3 border-t border-slate-800 space-y-2">
              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden cursor-pointer group">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all group-hover:bg-blue-400"
                  style={{ width: `${Math.min(100, (currentTimeSec / 1800) * 100)}%` }}
                ></div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center cursor-pointer transition-transform active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                      {isPlaying ? 'pause' : 'play_arrow'}
                    </span>
                  </button>

                  <div className="text-xs font-mono text-slate-300">
                    <span>{formatTime(currentTimeSec)}</span>
                    <span className="text-slate-500"> / {chapters[activeChapterIndex].duration}</span>
                  </div>

                  <span className="text-xs text-blue-400 font-semibold truncate hidden md:inline-block max-w-[200px]">
                    {chapters[activeChapterIndex].title}
                  </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-800 rounded-lg p-0.5 text-xs font-bold text-slate-300">
                    {(['1x', '1.25x', '1.5x'] as const).map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setPlaybackSpeed(spd)}
                        className={`px-1.5 sm:px-2 py-0.5 rounded cursor-pointer ${
                          playbackSpeed === spd ? 'bg-blue-600 text-white' : 'hover:text-white'
                        }`}
                      >
                        {spd}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={onOpenProPass}
                    className="inline-flex items-center gap-1 bg-[#fea619] text-[#2a1700] text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-amber-400 cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[15px] sm:text-[16px]">workspace_premium</span>
                    <span className="hidden sm:inline">Pro Pass</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Chapter Index Sidebar */}
          <div className="w-full lg:w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-72 lg:h-auto overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Video Course Chapters (5)
              </span>
              <span className="text-[11px] text-blue-400 font-mono font-bold">3.5 Hrs Total</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chapters.map((ch, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveChapterIndex(idx);
                    setCurrentTimeSec(0);
                    setIsPlaying(true);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                    activeChapterIndex === idx
                      ? 'bg-blue-600/20 border border-blue-500/50 text-white'
                      : 'hover:bg-slate-800/80 text-slate-400'
                  }`}
                >
                  <div className="space-y-1 pr-2">
                    <span className={`text-xs font-semibold block ${activeChapterIndex === idx ? 'text-blue-300' : ''}`}>
                      {ch.title}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      Duration: {ch.duration}
                    </span>
                  </div>
                  {activeChapterIndex === idx ? (
                    <span className="material-symbols-outlined text-blue-400 text-[18px]">volume_up</span>
                  ) : (
                    <span className="material-symbols-outlined text-slate-600 text-[18px]">play_circle</span>
                  )}
                </button>
              ))}
            </div>

            {/* Quick Proof Checklist */}
            <div className="p-4 bg-slate-950 border-t border-slate-800">
              <span className="text-[11px] font-bold text-amber-400 block mb-1">
                ⚡ Included in this Course:
              </span>
              <ul className="text-[11px] text-slate-300 space-y-1">
                <li>✓ 50 Solved Theorems with step-by-step proofs</li>
                <li>✓ Downloadable 1-page summary PDF</li>
                <li>✓ Certificate of geometry mastery upon completion</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
