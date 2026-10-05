import React, { useState } from 'react';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSignIn: () => void;
  onQuickDemoSignIn: (email: string, name: string) => void;
  onOpenManualRegister?: () => void;
  pendingResourceTitle?: string;
  pendingResourceGrade?: string;
}

export const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({
  isOpen,
  onClose,
  onGoogleSignIn,
  onQuickDemoSignIn,
  onOpenManualRegister,
  pendingResourceTitle,
  pendingResourceGrade,
}) => {
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [showDirectForm, setShowDirectForm] = useState(false);

  if (!isOpen) return null;

  const handleInstantDemo = (name: string, email: string) => {
    onQuickDemoSignIn(email, name);
  };

  const handleCustomFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentEmail.trim()) return;
    onQuickDemoSignIn(
      studentEmail.trim(),
      studentName.trim() || studentEmail.split('@')[0] || 'Math Student'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-blue-100 overflow-hidden">
        {/* Top Header Badge */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>

          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md text-white flex items-center justify-center mx-auto mb-3 border border-white/25 shadow-inner">
            <span className="material-symbols-outlined text-[30px]">lock</span>
          </div>

          <span className="text-[11px] font-extrabold tracking-widest uppercase bg-white/20 text-blue-100 px-3 py-1 rounded-full border border-white/20 inline-block mb-1">
            Student Access Required
          </span>

          <h3 className="text-xl font-black mt-1 leading-tight">
            Login Required to Download
          </h3>

          <p className="text-xs text-blue-100 mt-1.5 leading-relaxed max-w-xs mx-auto">
            Please sign in with your student account to download verified NCERT notes and save your offline revision history.
          </p>
        </div>

        {/* Pending Item Banner */}
        {pendingResourceTitle && (
          <div className="bg-blue-50/70 border-b border-blue-100 px-5 py-3 flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0">
              <span className="material-symbols-outlined text-[16px]">description</span>
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                Target Study Sheet {pendingResourceGrade ? `(${pendingResourceGrade})` : ''}
              </span>
              <span className="text-xs font-bold text-slate-800 truncate block">
                {pendingResourceTitle}
              </span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="space-y-2.5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
              <span className="font-semibold text-slate-700">Downloads synced to your student profile</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
              <span className="font-semibold text-slate-700">Instant A4 Printable PDFs &amp; 2-Min Formula Sheets</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
              <span className="font-semibold text-slate-700">Free access across Class 5 to Class 10</span>
            </div>
          </div>

          {/* Primary: Google Sign In Button */}
          <button
            type="button"
            onClick={onGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm py-3 px-4 rounded-2xl border-2 border-slate-200 hover:border-blue-500 shadow-sm transition-all active:scale-98 cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google Account</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              Or Student Quick Login
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Manual Student Registration Option */}
          {onOpenManualRegister && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenManualRegister();
              }}
              className="w-full flex items-center justify-center gap-1.5 bg-blue-50/80 hover:bg-blue-100 text-[#004ac6] border border-blue-200 font-bold text-xs py-2.5 px-3 rounded-xl transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>Register New Student Account</span>
            </button>
          )}

          {/* Toggle Custom Direct Login */}
          {!showDirectForm ? (
            <button
              type="button"
              onClick={() => setShowDirectForm(true)}
              className="w-full text-center text-[11px] font-bold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer py-1"
            >
              Enter student name &amp; email directly →
            </button>
          ) : (
            <form onSubmit={handleCustomFormSubmit} className="space-y-2.5 pt-1">
              <div>
                <input
                  type="text"
                  placeholder="Student Full Name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Student Email"
                  required
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#004ac6] hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Sign In &amp; Proceed to Download
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
