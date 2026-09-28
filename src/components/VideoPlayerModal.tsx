import React, { useState, useEffect } from 'react';
import { MathResource } from '../data/mathResources';
import { YouTubeIcon, FacebookIcon } from './SocialIcons';
import { downloadResourceToSystem } from '../services/fileDownloader';

interface VideoPlayerModalProps {
  resource: MathResource | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenProPass: () => void;
  onShare?: (title: string, resource: MathResource) => void;
  onDownloadNotes?: (title: string, size: string) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  resource,
  isOpen,
  onClose,
  onOpenProPass,
  onShare,
  onDownloadNotes,
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

  // Determine Video Provider & Embed URL
  const getVideoEmbedInfo = () => {
    // 1. Raw iframe embedHtml
    if (resource.embedHtml) {
      const srcMatch = resource.embedHtml.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        return {
          type: 'iframe',
          url: srcMatch[1],
          platform: 'custom',
        };
      }
    }

    // 2. Facebook Video Embed
    const fbCandidate = resource.facebookVideoUrl || (resource.videoUrl?.includes('facebook.com') || resource.videoUrl?.includes('fb.watch') ? resource.videoUrl : null);
    if (fbCandidate) {
      const cleanFbUrl = fbCandidate.trim();
      return {
        type: 'facebook',
        url: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(cleanFbUrl)}&show_text=false&autoplay=true`,
        platform: 'facebook',
      };
    }

    // 3. YouTube Video Embed
    const ytCandidate = resource.youtubeId || (resource.videoUrl?.includes('youtu') ? resource.videoUrl : null);
    if (ytCandidate) {
      let videoId = ytCandidate.trim();
      if (videoId.includes('v=')) {
        videoId = videoId.split('v=')[1]?.split('&')[0] || videoId;
      } else if (videoId.includes('youtu.be/')) {
        videoId = videoId.split('youtu.be/')[1]?.split('?')[0] || videoId;
      } else if (videoId.includes('/shorts/')) {
        videoId = videoId.split('/shorts/')[1]?.split('?')[0] || videoId;
      } else if (videoId.includes('/embed/')) {
        videoId = videoId.split('/embed/')[1]?.split('?')[0] || videoId;
      }
      return {
        type: 'youtube',
        url: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
        platform: 'youtube',
      };
    }

    return null;
  };

  const embedInfo = getVideoEmbedInfo();

  const handleDownloadWorksheet = () => {
    downloadResourceToSystem({
      title: `${resource.title} - Video Lecture Worksheet`,
      grade: resource.grade,
      topic: resource.topic,
      format: 'Formula Sheets (1-Pager)',
      downloadUrl: resource.downloadUrl,
      description: resource.description,
      keyFormulas: resource.keyFormulas,
      examTraps: resource.examTraps,
    });
    if (onDownloadNotes) {
      onDownloadNotes(resource.title, resource.sizeOrDuration);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-900/80 backdrop-blur-md animate-fadeIn font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-[#111c2d] text-white w-full max-w-5xl max-h-[94vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {embedInfo?.platform === 'facebook' ? (
              <span className="text-[10px] sm:text-[11px] font-bold bg-[#1877f2] text-white px-2 sm:px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                <FacebookIcon size={13} />
                <span>FACEBOOK EMBED</span>
              </span>
            ) : embedInfo?.platform === 'youtube' ? (
              <span className="text-[10px] sm:text-[11px] font-bold bg-[#dc2626] text-white px-2 sm:px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                <YouTubeIcon size={13} />
                <span>YOUTUBE HD</span>
              </span>
            ) : (
              <span className="text-[10px] sm:text-[11px] font-bold bg-[#fea619] text-[#2a1700] px-2 sm:px-2.5 py-0.5 rounded-full shrink-0">
                EMBEDDED VIDEO
              </span>
            )}
            <span className="text-xs sm:text-sm font-bold text-slate-200 truncate">
              {resource.title}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onShare && (
              <button
                type="button"
                onClick={() => onShare(resource.title, resource)}
                className="py-1 px-2.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Share video with Chrome direct link"
              >
                <span className="material-symbols-outlined text-[16px]">share</span>
                <span className="hidden sm:inline">Share</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadWorksheet}
              className="py-1 px-2.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Download accompanying revision sheet to system"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span className="hidden sm:inline">Download Notes</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Main Video Screen Area */}
          <div className="flex-1 flex flex-col bg-black justify-between relative overflow-hidden">
            {embedInfo ? (
              <div className="flex-1 w-full h-full min-h-[340px] sm:min-h-[480px] bg-black flex items-center justify-center">
                <iframe
                  src={embedInfo.url}
                  title={resource.title}
                  className="w-full h-full aspect-video border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              /* Visual Canvas Representation of Math Animation */
              <div className="flex-1 relative flex items-center justify-center p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
                <div className="relative w-full max-w-lg aspect-video bg-slate-900/90 rounded-2xl border border-blue-500/30 p-4 flex flex-col items-center justify-center shadow-2xl">
                  <div className="absolute top-3 left-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-[11px] font-mono font-bold text-blue-400">
                      LIVE MATHEMATICAL THEOREM PROOF
                    </span>
                  </div>

                  <svg
                    className="w-56 h-36 text-blue-400 fill-none stroke-current"
                    strokeWidth="2.5"
                    viewBox="0 0 200 130"
                  >
                    <polygon
                      fill="#3b82f6"
                      fillOpacity="0.1"
                      points="100,20 30,110 170,110"
                      stroke="#60a5fa"
                    />
                    <line
                      stroke="#f59e0b"
                      strokeDasharray="4 2"
                      strokeWidth="2"
                      x1="100"
                      x2="100"
                      y1="20"
                      y2="110"
                    />
                    <text className="fill-white text-[11px] font-bold" stroke="none" x="95" y="14">A</text>
                    <text className="fill-white text-[11px] font-bold" stroke="none" x="16" y="118">B</text>
                    <text className="fill-white text-[11px] font-bold" stroke="none" x="175" y="118">C</text>
                    <text className="fill-amber-400 text-[11px] font-bold" stroke="none" x="97" y="125">D</text>
                    <line stroke="#ec4899" strokeWidth="2.5" x1="58" x2="68" y1="62" y2="67" />
                    <line stroke="#ec4899" strokeWidth="2.5" x1="132" x2="142" y1="67" y2="62" />
                  </svg>

                  <div className="mt-2 text-center">
                    <span className="text-xs font-bold text-white bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                      "Angles opposite to equal sides of an isosceles triangle are equal (∠B = ∠C)"
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-4 text-[10px] text-slate-500 font-mono">
                    MathsAtYourFingertips • 1080p 60fps
                  </div>
                </div>
              </div>
            )}

            {/* Video Controls Bar */}
            <div className="bg-slate-900/95 px-3 sm:px-5 py-2.5 sm:py-3 border-t border-slate-800 space-y-2">
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

            {/* Accompanying Sheet Download Block */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-400 block">
                  ⚡ Printable Lecture Sheet:
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                  Free PDF
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Includes all 50 solved theorems, standard formulas, and board trap warnings.
              </p>
              <button
                type="button"
                onClick={handleDownloadWorksheet}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span>
                <span>Download Study Sheet to Device</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

