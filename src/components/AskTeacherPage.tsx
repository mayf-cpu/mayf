import React, { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  UserProfile,
  saveAiQueryRecord,
  fetchStudentAiQueries,
  AiQueryRecord,
} from '../firebase';
import { ClassroomBoardRenderer } from './ClassroomBoardRenderer';
import { BrandingConfig } from '../services/branding';
import { PageTextConfig } from '../services/pageText';
import {
  isInAppBrowser,
  isAndroidDevice,
  getChromeIntentUrl,
  getAskTeacherShareUrl,
  attemptAutoLaunchExternalBrowser,
} from '../services/externalBrowser';
import { InAppBrowserBanner } from './InAppBrowserBanner';
import { ChromeIcon, WhatsAppIcon, TelegramIcon, FacebookIcon } from './SocialIcons';
import { AdPlacement } from './AdPlacement';

interface AskTeacherPageProps {
  onNavigateHome: () => void;
  currentUser: User | null;
  userProfile: UserProfile | null;
  onGoogleSignIn: () => void;
  onQuickDemoSignIn?: (email: string, name: string) => void;
  onToast: (msg: string) => void;
  branding?: BrandingConfig;
  pageText?: PageTextConfig;
  initialQuery?: string;
}

const SAMPLE_QUESTIONS = [
  {
    label: 'Quadratic Equation',
    grade: 'Class 10',
    topic: 'Quadratic Equations',
    query: 'Solve the quadratic equation 2x² - 7x + 3 = 0 using the quadratic formula, showing all steps and the discriminant calculation.',
  },
  {
    label: 'Pythagorean Theorem',
    grade: 'Class 10',
    topic: 'Triangles',
    query: 'In a right triangle ABC with right angle at B, AB = 6 cm and BC = 8 cm. Find the hypotenuse AC and prove using Pythagoras theorem.',
  },
  {
    label: 'Sector of a Circle',
    grade: 'Class 10',
    topic: 'Areas Related to Circles',
    query: 'A sector of a circle with radius 14 cm has a central angle of 90 degrees. Calculate the area of the sector and the length of the arc. (Use π = 22/7)',
  },
  {
    label: 'Arithmetic Progression',
    grade: 'Class 10',
    topic: 'Arithmetic Progressions',
    query: 'Find the 20th term and the sum of first 20 terms of the AP: 3, 7, 11, 15, ...',
  },
  {
    label: 'Polynomial Factorization',
    grade: 'Class 9',
    topic: 'Polynomials',
    query: 'Factorize the polynomial 6x² + 17x + 5 by splitting the middle term.',
  },
];

export const AskTeacherPage: React.FC<AskTeacherPageProps> = ({
  onNavigateHome,
  currentUser,
  userProfile,
  onGoogleSignIn,
  onQuickDemoSignIn,
  onToast,
  branding,
  pageText,
  initialQuery = '',
}) => {
  const [grade, setGrade] = useState<string>(userProfile?.grade || 'Class 10');
  const [topic, setTopic] = useState<string>('General Mathematics');
  const [queryText, setQueryText] = useState<string>(initialQuery);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentSolution, setCurrentSolution] = useState<string | null>(null);
  const [recentQueries, setRecentQueries] = useState<AiQueryRecord[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [copiedSolution, setCopiedSolution] = useState<boolean>(false);
  const [inApp, setInApp] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const solutionEndRef = useRef<HTMLDivElement | null>(null);
  const questionInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Attempt external browser auto-launch if arrived via in-app browser or openExternal
  useEffect(() => {
    attemptAutoLaunchExternalBrowser();
    if (isInAppBrowser()) {
      setInApp(true);
    }
  }, []);

  // Sync initial query
  useEffect(() => {
    if (initialQuery) {
      setQueryText(initialQuery);
    }
  }, [initialQuery]);

  // Sync user profile grade
  useEffect(() => {
    if (userProfile?.grade) {
      setGrade(userProfile.grade);
    }
  }, [userProfile?.grade]);

  // Load student query history if signed in
  useEffect(() => {
    if (currentUser?.uid) {
      fetchStudentAiQueries(currentUser.uid).then((items) => {
        setRecentQueries(items);
      });
    }
  }, [currentUser?.uid]);

  // Handle Image File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedImage(file);
    }
  };

  const processSelectedImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      onToast('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      onToast('Image size exceeds 10MB limit. Please upload a smaller image.');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Clipboard Paste of Images
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            processSelectedImage(file);
            onToast('Pasted image attached successfully!');
            break;
          }
        }
      }
    }
  };

  const removeAttachedImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit Query to Server AI endpoint
  const handleAskTeacher = async () => {
    if (!currentUser) {
      onToast('Please sign in or use demo student access to ask Teacher.');
      return;
    }

    if (!queryText.trim() && !imagePreview) {
      onToast('Please type a math problem or attach a textbook picture.');
      return;
    }

    setIsLoading(true);
    setCurrentSolution(null);
    setCopiedSolution(false);

    try {
      const response = await fetch('/api/ai/solve-math', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: queryText.trim(),
          grade,
          topic,
          imageBase64: imagePreview,
          imageMimeType: imageFile?.type || 'image/jpeg',
          userId: currentUser.uid,
          userEmail: currentUser.email || 'student@domain.com',
          userName: currentUser.displayName || userProfile?.displayName || 'Student',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to solve question');
      }

      const solution = data.solution || 'No solution generated.';
      setCurrentSolution(solution);

      // Save Query Record to Firestore & Local Storage for Admin and Student
      const queryId = `query_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const queryRecord: AiQueryRecord = {
        id: queryId,
        userId: currentUser.uid,
        userEmail: currentUser.email || 'student@domain.com',
        userName: currentUser.displayName || userProfile?.displayName || 'Student',
        grade,
        topic,
        queryText: queryText.trim() || 'Attached image math question',
        hasImage: Boolean(imagePreview),
        imagePreview: imagePreview ? imagePreview.substring(0, 500) + '...' : undefined,
        solution,
        modelUsed: data.model || 'gemini-flash-lite-latest',
        createdAt: new Date().toISOString(),
      };

      await saveAiQueryRecord(queryRecord);

      // Update student history list
      setRecentQueries((prev) => [queryRecord, ...prev]);

      onToast('Classroom board solution prepared by Teacher!');
      setTimeout(() => {
        solutionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } catch (err: any) {
      console.error('Error getting AI solution:', err);
      onToast(err?.message || 'Error communicating with Teacher. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copySolutionToClipboard = () => {
    if (!currentSolution) return;
    navigator.clipboard?.writeText(currentSolution);
    setCopiedSolution(true);
    onToast('Complete blackboard solution copied to clipboard!');
    setTimeout(() => setCopiedSolution(false), 2500);
  };

  const handleOpenExternalChrome = () => {
    const directShareUrl = getAskTeacherShareUrl(window.location.origin);
    if (isAndroidDevice()) {
      window.location.href = getChromeIntentUrl(directShareUrl);
    } else {
      navigator.clipboard?.writeText(directShareUrl);
      onToast('Direct link copied! Paste in Chrome / Safari.');
    }
  };

  const shareDirectLink = () => {
    const directShareUrl = getAskTeacherShareUrl(window.location.origin);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(directShareUrl);
      onToast('Direct Ask Teacher link copied (opens in Chrome/External browser)!');
    }
  };

  const shareViaWhatsApp = () => {
    const directShareUrl = getAskTeacherShareUrl(window.location.origin);
    const text = encodeURIComponent(
      `Solve any Class 5-10 or Olympiad math problem step-by-step with Prof. Raman on the Classroom Board!\n\nOpen directly here: ${directShareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const shareViaTelegram = () => {
    const directShareUrl = getAskTeacherShareUrl(window.location.origin);
    const text = encodeURIComponent('Ask Teacher - Classroom Blackboard Math Solver');
    window.open(`https://t.me/share/url?url=${encodeURIComponent(directShareUrl)}&text=${text}`, '_blank');
  };

  const shareViaFacebook = () => {
    const directShareUrl = getAskTeacherShareUrl(window.location.origin);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(directShareUrl)}`, '_blank');
  };

  const handleSelectSample = (sample: typeof SAMPLE_QUESTIONS[0]) => {
    setGrade(sample.grade);
    setTopic(sample.topic);
    setQueryText(sample.query);
    removeAttachedImage();
    questionInputRef.current?.focus();
    onToast(`Loaded example: ${sample.label}`);
  };

  return (
    <div
      onPaste={handlePaste}
      className="w-full min-h-screen bg-[#f9f9ff] text-[#111c2d] pb-20 font-['Plus_Jakarta_Sans',sans-serif]"
    >
      {/* Social in-app browser detection banner */}
      <InAppBrowserBanner />

      {/* Persistent Chrome advisory banner if inside in-app browser */}
      {inApp && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">open_in_browser</span>
            <span>You are viewing in a social app browser. For direct camera upload &amp; full LaTeX math symbols, open in Chrome.</span>
          </div>
          <button
            onClick={handleOpenExternalChrome}
            className="bg-slate-950 hover:bg-black text-amber-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-extrabold cursor-pointer shrink-0"
          >
            <ChromeIcon size={14} />
            <span>Open in Chrome</span>
          </button>
        </div>
      )}

      {/* Top Navigation & Branding Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-xs px-3 sm:px-8 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#004ac6] bg-slate-100 hover:bg-blue-50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
            title="Return to Learning Hub"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span className="hidden sm:inline">Learning Hub</span>
          </button>

          <div className="h-5 w-[1px] bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold shadow-xs">
              <span className="material-symbols-outlined text-[20px]">co_present</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 leading-none">
                  Ask Teacher
                </h1>
                <span className="hidden md:inline-block bg-emerald-500/15 text-emerald-700 border border-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Classroom Board Solver
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block mt-0.5">
                {branding?.siteTitle || 'Maths at Your Fingertips'} • Dedicated Standalone Solver
              </p>
            </div>
          </div>
        </div>

        {/* Right Action Header Buttons */}
        <div className="flex items-center gap-2">
          {/* Direct Chrome / External Browser Launch Button */}
          <button
            onClick={handleOpenExternalChrome}
            className="hidden sm:inline-flex items-center gap-1.5 bg-slate-100 hover:bg-amber-50 text-slate-800 hover:text-amber-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
            title="Open in Chrome or External Browser"
          >
            <ChromeIcon size={14} />
            <span>Open in Chrome</span>
          </button>

          {/* Share Direct Webpage Link Button */}
          <button
            onClick={shareDirectLink}
            className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-[#004ac6] text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-200 transition-all cursor-pointer"
            title="Copy direct shareable URL (auto-opens in Chrome on social media)"
          >
            <span className="material-symbols-outlined text-[16px]">share</span>
            <span className="hidden md:inline">Share Page Link</span>
          </button>

          {/* User Sign-In or Profile Status */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  showHistory ? 'bg-[#004ac6] text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title="View your past questions"
              >
                <span className="material-symbols-outlined text-[16px]">history</span>
                <span className="hidden sm:inline">History ({recentQueries.length})</span>
              </button>
              <div
                className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs"
                title={currentUser.displayName || currentUser.email || 'Student'}
              >
                {(currentUser.displayName || currentUser.email || 'S')[0].toUpperCase()}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onGoogleSignIn}
                className="inline-flex items-center gap-1.5 bg-[#004ac6] hover:bg-blue-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">login</span>
                <span>Sign In</span>
              </button>
              {onQuickDemoSignIn && (
                <button
                  onClick={() => onQuickDemoSignIn('demo.student@mathsatyourfingertips.com', 'Demo Student')}
                  className="hidden sm:inline-flex items-center gap-1 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-extrabold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                  title="Quick Demo Student Access"
                >
                  <span>Demo</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Spotlight Hero Banner */}
        <div className="bg-gradient-to-r from-[#002a78] via-[#004ac6] to-[#1e58d8] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-6 sm:mb-8 border border-blue-400/30">
          <div className="max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-extrabold uppercase tracking-wider mb-3">
              <span className="material-symbols-outlined text-[16px]">psychology</span>
              <span>24/7 AI Classroom Mathematics Teacher • Classes 5 - 10 &amp; Olympiad</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              {pageText?.aiTeacher?.title || 'Stuck on a Tricky Math Problem?'}
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-2.5 leading-relaxed max-w-2xl">
              {pageText?.aiTeacher?.description ||
                'Meet Prof. Raman, your personal mathematics faculty! Simply type your problem or upload a textbook photo to generate authentic chalkboard solutions with formulas, line-by-line justifications, and teacher tips.'}
            </p>

            <div className="flex items-center gap-3 sm:gap-4 mt-4 text-xs font-semibold text-blue-200 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
                <span>Authentic Blackboard Work</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
                <span>Formula Box &amp; Reasons [∵]</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
                <span>Direct Shareable Link (Forces External Browser)</span>
              </span>
            </div>
          </div>

          {/* Social Media Sharing Strip inside Hero */}
          <div className="mt-6 pt-5 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-blue-100 font-semibold">
              <span className="material-symbols-outlined text-[18px] text-amber-300">share</span>
              <span>Share this dedicated page with classmates (Opens directly in Chrome):</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={shareViaWhatsApp}
                className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold px-3 py-1.5 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                title="Share to WhatsApp"
              >
                <WhatsAppIcon size={16} />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={shareViaTelegram}
                className="inline-flex items-center gap-1.5 bg-[#229ED9] hover:bg-[#1f8ec4] text-white font-bold px-3 py-1.5 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                title="Share to Telegram"
              >
                <TelegramIcon size={16} />
                <span>Telegram</span>
              </button>
              <button
                onClick={shareViaFacebook}
                className="inline-flex items-center gap-1.5 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold px-3 py-1.5 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                title="Share to Facebook"
              >
                <FacebookIcon size={16} />
                <span>Facebook</span>
              </button>
              <button
                onClick={shareDirectLink}
                className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                title="Copy Direct Share URL"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                <span>Copy Link</span>
              </button>
            </div>
          </div>
        </div>

        {/* History Drawer if activated */}
        {showHistory && currentUser && (
          <div className="mb-6 bg-blue-50/70 border border-blue-200 rounded-2xl p-4 sm:p-5 animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-700 text-[20px]">history</span>
                <h3 className="text-sm font-extrabold text-blue-950">Your Past Asked Questions</h3>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Close History
              </button>
            </div>
            {recentQueries.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No past questions recorded yet in your profile.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {recentQueries.slice(0, 8).map((q) => (
                  <div
                    key={q.id}
                    onClick={() => {
                      setQueryText(q.queryText);
                      setGrade(q.grade);
                      setTopic(q.topic || 'General Mathematics');
                      setCurrentSolution(q.solution);
                      setShowHistory(false);
                      onToast('Loaded question from history');
                    }}
                    className="p-3 bg-white rounded-xl border border-blue-100 hover:border-blue-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer text-left"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-blue-600 mb-1">
                      <span>{q.grade} • {q.topic}</span>
                      <span className="text-slate-400">{new Date(q.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 line-clamp-2">{q.queryText}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Question Submission Card */}
        <div className="bg-white rounded-3xl border border-blue-100 shadow-xl p-5 sm:p-7 mb-8">
          {/* Target Grade and Topic Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Grade / Syllabus
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="Class 5">Class 5 (Foundations &amp; Mental Maths)</option>
                <option value="Class 6">Class 6 (Fractions &amp; Pre-Algebra)</option>
                <option value="Class 7">Class 7 (Equations &amp; Geometry)</option>
                <option value="Class 8">Class 8 (Linear Equations &amp; Mensuration)</option>
                <option value="Class 9">Class 9 (Polynomials &amp; Coordinate Geometry)</option>
                <option value="Class 10">Class 10 (Trigonometry, Quadratics &amp; Boards)</option>
                <option value="Olympiad">Junior Math Olympiad &amp; NTSE / IMO</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Math Subject Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Quadratic Equations, Trigonometry, Triangles, Mensuration"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Quick Example Chips */}
          <div className="mb-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-2">
              <span className="material-symbols-outlined text-[16px] text-amber-500">lightbulb</span>
              <span>Try a Sample Classroom Question:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {SAMPLE_QUESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSample(s)}
                  className="text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer font-semibold"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question Text Input */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Type Your Math Question or Paste Text:
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                Supports LaTeX: $x^2$, \sqrt&#123;a&#125;, or plain English
              </span>
            </div>
            <textarea
              ref={questionInputRef}
              rows={4}
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="e.g. Find the roots of 3x² - 5x + 2 = 0 using the quadratic formula and state the discriminant. (Or paste textbook screenshot below)"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none shadow-inner"
            ></textarea>
          </div>

          {/* Attached Image Preview if any */}
          {imagePreview && (
            <div className="mb-4 p-3 bg-blue-50/60 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={imagePreview}
                  alt="Textbook question"
                  className="w-16 h-16 object-cover rounded-xl border border-blue-200 shadow-2xs shrink-0"
                />
                <div className="truncate">
                  <p className="text-xs font-bold text-blue-900">
                    {imageFile?.name || 'Attached Textbook Photo / Screenshot'}
                  </p>
                  <p className="text-[10px] text-blue-600">
                    Ready for Prof. Raman's vision analysis
                  </p>
                </div>
              </div>
              <button
                onClick={removeAttachedImage}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="Remove attached image"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          )}

          {/* Action Bar & Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="ask-teacher-standalone-file"
              />
              <label
                htmlFor="ask-teacher-standalone-file"
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                title="Upload photo from textbook or camera"
              >
                <span className="material-symbols-outlined text-[18px] text-blue-600">add_photo_alternate</span>
                <span>{imagePreview ? 'Replace Photo' : 'Upload / Snap Photo'}</span>
              </label>

              <span className="text-[11px] text-slate-400 hidden sm:inline">
                or press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px]">Ctrl+V</kbd> to paste
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!currentUser && (
                <button
                  onClick={onGoogleSignIn}
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-3 rounded-2xl cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                  <span>Sign In to Ask</span>
                </button>
              )}

              <button
                onClick={handleAskTeacher}
                disabled={isLoading}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-extrabold text-xs sm:text-sm shadow-lg transition-all cursor-pointer ${
                  isLoading
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 hover:shadow-xl transform hover:-translate-y-0.5'
                }`}
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></span>
                    <span>Teacher is Writing on Blackboard...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">draw</span>
                    <span>Solve on Classroom Board</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Blackboard Output Display */}
        {currentSolution && (
          <div ref={solutionEndRef} className="mb-10 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 text-[24px]">school</span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Prof. Raman's Classroom Blackboard Derivation
                </h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={copySolutionToClipboard}
                  className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedSolution ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedSolution ? 'Copied!' : 'Copy Blackboard Work'}</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  <span>Print Board</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSolution(null);
                    setQueryText('');
                    removeAttachedImage();
                    questionInputRef.current?.focus();
                  }}
                  className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  <span>Ask Another</span>
                </button>
              </div>
            </div>

            {/* Render authentic chalkboard solution */}
            <ClassroomBoardRenderer
              solutionText={currentSolution}
              grade={grade}
              topic={topic}
              onCopy={copySolutionToClipboard}
            />
          </div>
        )}

        {/* Ad placement if needed */}
        <div className="my-8">
          <AdPlacement location="catalog_bottom" />
        </div>

        {/* Classroom Methodology Info Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-600 mt-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-3">
              <span className="material-symbols-outlined text-[20px]">history_edu</span>
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 mb-1">Authentic Chalkboard Layout</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Step-by-step mathematical reasoning formatted as a teacher's real blackboard: GIVEN values, FORMULA BOX, numbered line-by-line derivation, and highlighted FINAL ANSWER.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3">
              <span className="material-symbols-outlined text-[20px]">share</span>
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 mb-1">Direct Shareable Link</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Share the Ask Teacher page directly on Instagram, WhatsApp, or Telegram. The link automatically redirects out of restricted in-app webviews into Google Chrome.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 mb-1">Teacher's Exam Caution</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Each solution concludes with Prof. Raman's exam trap cautions, highlighting common student sign errors, unit slips, and board marking guidelines.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
