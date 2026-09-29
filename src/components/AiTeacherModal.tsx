import React, { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  UserProfile,
  saveAiQueryRecord,
  fetchStudentAiQueries,
  AiQueryRecord,
} from '../firebase';
import { ClassroomBoardRenderer } from './ClassroomBoardRenderer';

interface AiTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  userProfile: UserProfile | null;
  onGoogleSignIn: () => void;
  onToast: (msg: string) => void;
  initialQuery?: string;
}

export const AiTeacherModal: React.FC<AiTeacherModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userProfile,
  onGoogleSignIn,
  onToast,
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const solutionEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialQuery) {
      setQueryText(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    if (userProfile?.grade) {
      setGrade(userProfile.grade);
    }
  }, [userProfile?.grade]);

  // Load student query history
  useEffect(() => {
    if (currentUser?.uid && isOpen) {
      fetchStudentAiQueries(currentUser.uid).then((items) => {
        setRecentQueries(items);
      });
    }
  }, [currentUser?.uid, isOpen]);

  if (!isOpen) return null;

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
      onToast('Please sign in before asking Teacher.');
      return;
    }

    if (!queryText.trim() && !imagePreview) {
      onToast('Please type a math problem or attach an image.');
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

  const samplePrompts = [
    { label: 'Quadratic Roots', query: 'Find the roots of the quadratic equation 3x² - 5x + 2 = 0 using the quadratic formula with verification.' },
    { label: 'Irrationality Proof', query: 'Prove by contradiction that √5 is an irrational number.' },
    { label: 'Trig Identity', query: 'Prove the identity: (sin θ - 2sin³θ) / (2cos³θ - cos θ) = tan θ' },
    { label: 'Surface Areas & Volumes', query: 'A solid metallic sphere of radius 6 cm is melted and recast into the shape of a cylinder of radius 10 cm. Find the height of the cylinder.' },
    { label: 'AP Sum', query: 'Find the sum of all two-digit numbers which are divisible by 3.' },
  ];

  return (
    <div
      onPaste={handlePaste}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
    >
      <div className="bg-[#ffffff] w-full max-w-4xl max-h-[95vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-blue-100 flex flex-col overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#003b9e] via-[#004ac6] to-[#1e58d8] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md font-extrabold text-xl shrink-0">
              <span className="material-symbols-outlined text-[24px]">co_present</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold tracking-tight">
                  Ask Teacher
                </h2>
                <span className="bg-emerald-400 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Classroom Board Solver
                </span>
              </div>
              <p className="text-[11px] text-blue-100">
                Live Blackboard & Chalk derivations with formulas for Classes 5 - 10 & Olympiad
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  showHistory ? 'bg-white text-blue-700 shadow-sm' : 'bg-white/15 text-white hover:bg-white/25'
                }`}
                title="View your past asked questions"
              >
                <span className="material-symbols-outlined text-[16px]">history</span>
                <span className="hidden sm:inline">My Queries ({recentQueries.length})</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f9f9ff] flex flex-col gap-4">
          {/* USER NOT SIGNED IN: Enforce Login Gate */}
          {!currentUser ? (
            <div className="bg-white rounded-2xl p-6 sm:p-10 border border-blue-100 shadow-sm text-center flex flex-col items-center justify-center max-w-xl mx-auto my-auto">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-[#004ac6] flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[36px]">lock</span>
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                Student Login Required
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
                To ask math problems to Teacher (via text or photos), view detailed blackboard derivations, and maintain your learning log in your student notebook, please sign in with Google.
              </p>

              <button
                onClick={onGoogleSignIn}
                className="inline-flex items-center gap-2.5 bg-[#004ac6] hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-md transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google to Continue</span>
              </button>
            </div>
          ) : showHistory ? (
            /* PAST QUERIES HISTORY VIEW */
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-blue-600">history</span>
                  <span>My Solved Math Inquiries</span>
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  ← Back to Teacher Board
                </button>
              </div>

              {recentQueries.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  You haven't asked any questions yet. Try asking your first question!
                </div>
              ) : (
                <div className="space-y-3">
                  {recentQueries.map((q) => (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50 hover:bg-white transition-all cursor-pointer"
                      onClick={() => {
                        setQueryText(q.queryText);
                        setCurrentSolution(q.solution);
                        setShowHistory(false);
                      }}
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span className="font-bold text-blue-700">{q.grade} • {q.topic}</span>
                        <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 line-clamp-2 mb-1">
                        {q.queryText}
                      </p>
                      <div className="text-[11px] text-slate-500 line-clamp-2">
                        {q.solution.substring(0, 140)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ACTIVE QUERY INPUT & SOLUTION VIEW */
            <>
              {/* Question Input Card */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-100 shadow-sm">
                {/* Grade and Topic Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                      Target Grade Syllabus
                    </label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                    >
                      <option value="Class 10">Class 10 (Board Exam Focus)</option>
                      <option value="Class 9">Class 9 (Foundations)</option>
                      <option value="Class 8">Class 8 (Middle School)</option>
                      <option value="Class 7">Class 7 (Pre-Algebra)</option>
                      <option value="Class 6">Class 6 (Basics)</option>
                      <option value="Class 5">Class 5 (Primary Math)</option>
                      <option value="Olympiad">Olympiad & Advanced IMO</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                      Math Subject Topic
                    </label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                    >
                      <option value="General Mathematics">General School Math</option>
                      <option value="Quadratic Equations">Quadratic Equations</option>
                      <option value="Trigonometry">Trigonometry & Heights</option>
                      <option value="Coordinate Geometry">Coordinate Geometry</option>
                      <option value="Arithmetic Progressions">Arithmetic Progressions</option>
                      <option value="Triangles & Circles">Triangles & Geometry</option>
                      <option value="Surface Areas & Volumes">Surface Areas & Volumes</option>
                      <option value="Statistics & Probability">Statistics & Probability</option>
                      <option value="Real Numbers & Polynomials">Real Numbers & Polynomials</option>
                    </select>
                  </div>
                </div>

                {/* Question Textarea */}
                <div className="relative mb-3">
                  <textarea
                    rows={3}
                    placeholder="Type your math problem here or paste equation/word problem... (You can also attach a photo from your textbook or worksheet below!)"
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                  />
                </div>

                {/* Attached Image Preview */}
                {imagePreview && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={imagePreview}
                        alt="Question Thumbnail"
                        className="w-14 h-14 object-cover rounded-lg border border-blue-300 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-blue-900 block truncate">
                          {imageFile?.name || 'Attached Problem Photo'}
                        </span>
                        <span className="text-[11px] text-blue-700">
                          Ready for visual OCR & equation analysis
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={removeAttachedImage}
                      className="text-xs font-bold text-red-600 hover:text-red-800 bg-white px-2.5 py-1.5 rounded-lg border border-red-200 transition-colors cursor-pointer shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Upload Image and Action Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[17px] text-blue-600">add_a_photo</span>
                      <span>Attach Photo / Screenshot</span>
                    </button>
                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                      (Supports JPG, PNG, Paste)
                    </span>
                  </div>

                  <button
                    onClick={handleAskTeacher}
                    disabled={isLoading || (!queryText.trim() && !imagePreview)}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#004ac6] to-[#2563eb] hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Writing on Blackboard...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">co_present</span>
                        <span>Solve on Classroom Board</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Sample Prompts */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">Try Sample:</span>
                  {samplePrompts.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQueryText(s.query)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-semibold text-slate-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Solution Display Area */}
              {isLoading && (
                <div className="bg-[#0b2217] rounded-2xl p-8 border-4 border-[#5c3a21] text-center shadow-xl text-emerald-100 relative overflow-hidden">
                  <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center mx-auto mb-3 animate-bounce shadow-md">
                    <span className="material-symbols-outlined text-[32px]">co_present</span>
                  </div>
                  <h4 className="text-sm sm:text-base font-extrabold text-amber-300 mb-1 tracking-wide">
                    Prof. Raman is Solving on the Classroom Blackboard...
                  </h4>
                  <p className="text-xs text-emerald-200/80 max-w-md mx-auto">
                    Writing given parameters, identifying formula theorems, formulating step-by-step proofs, and organizing margin scratchpad calculations.
                  </p>
                </div>
              )}

              {currentSolution && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <span className="text-xs font-bold text-slate-600">
                        Board Solution Generated
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setQueryText('');
                        removeAttachedImage();
                        setCurrentSolution(null);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">add</span>
                      <span>Ask Another Problem</span>
                    </button>
                  </div>

                  <ClassroomBoardRenderer
                    solutionText={currentSolution}
                    grade={grade}
                    topic={topic}
                    onCopy={() => onToast('Classroom board solution copied to clipboard!')}
                    onPrint={() => window.print()}
                  />

                  <div ref={solutionEndRef} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
