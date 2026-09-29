import React, { useState } from 'react';
import { firebaseConfig } from '../firebase';

interface UnauthorizedDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickSignIn: (email: string, name: string) => void;
  onRetryGoogleSignIn: () => void;
}

export const UnauthorizedDomainModal: React.FC<UnauthorizedDomainModalProps> = ({
  isOpen,
  onClose,
  onQuickSignIn,
  onRetryGoogleSignIn,
}) => {
  const [copied, setCopied] = useState(false);
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;

  if (!isOpen) return null;

  const handleCopyDomain = () => {
    navigator.clipboard?.writeText(currentHost);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-200 relative overflow-hidden">
        {/* Top Decorative accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px]">domain_verification</span>
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase">
                <span>Firebase Authentication</span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight mt-0.5">
                Authorize Preview Domain
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
            title="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          Firebase Auth blocked the Google Sign-In popup because this preview deployment domain has not been registered in your Firebase project (<strong className="text-slate-800">{firebaseConfig.projectId}</strong>).
        </p>

        {/* Domain Copy Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span>Domain to authorize:</span>
            {copied && <span className="text-emerald-600 font-bold">✓ Copied to clipboard!</span>}
          </div>
          <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs text-slate-900 select-all overflow-x-auto">
            <span className="truncate">{currentHost}</span>
            <button
              onClick={handleCopyDomain}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer shrink-0 transition-colors"
              title="Copy domain to clipboard"
            >
              <span className="material-symbols-outlined text-[15px]">{copied ? 'done' : 'content_copy'}</span>
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* How to add steps */}
        <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-3.5 mb-5 space-y-2 text-xs text-blue-950">
          <div className="font-extrabold flex items-center gap-1.5 text-blue-900">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span>How to add in 15 seconds:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-blue-900/90 pl-1">
            <li>Click <strong>Open Firebase Console</strong> below.</li>
            <li>Scroll down to <strong>Authorized domains</strong> section.</li>
            <li>Click <strong>Add domain</strong>, paste <code className="bg-blue-100 px-1 rounded">{currentHost}</code> and click <strong>Save</strong>.</li>
          </ol>
          <a
            href={firebaseSettingsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-xs transition-colors"
          >
            <span>Open Firebase Console Settings</span>
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </a>
        </div>

        {/* Immediate Access Buttons (Never Blocked) */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Or continue immediately while configuring:
          </div>

          <button
            onClick={() => onQuickSignIn('sachinagrawal16@gmail.com', 'Sachin Agrawal (Admin)')}
            className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-200 text-amber-950 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                SA
              </span>
              <div className="text-left">
                <div className="font-extrabold text-slate-900">Sign in as Sachin Agrawal</div>
                <div className="text-[10px] text-amber-800">sachinagrawal16@gmail.com • Superadmin Privileges</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-amber-700 group-hover:translate-x-0.5 transition-transform">
              arrow_forward
            </span>
          </button>

          <button
            onClick={() => onQuickSignIn('student@mathsfingertips.edu', 'Math Learner')}
            className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl text-xs font-semibold transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                ML
              </span>
              <div className="text-left">
                <div className="font-bold text-slate-800">Sign in as Student (Class 10)</div>
                <div className="text-[10px] text-slate-500">Test AI Teacher, Formula Deck, Bookmarks</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
          </button>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={onClose}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={onRetryGoogleSignIn}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">refresh</span>
              <span>Retry Google Sign-In</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
