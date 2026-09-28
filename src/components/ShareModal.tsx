import React, { useState } from 'react';
import {
  getSocialConfig,
  shareToWhatsAppDirectApp,
  shareToTelegramDirectApp,
  shareToTwitterDirectApp,
  shareToFacebookDirectApp,
  triggerNativeOsShare,
} from '../services/social';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, title }) => {
  const [copied, setCopied] = useState(false);
  const socialConfig = getSocialConfig();

  if (!isOpen) return null;

  const shareText = `Check out this 1-page math formula cheat sheet "${title}" on Maths at Your Fingertips!`;
  const shareUrl = window.location.href;

  const handleCopy = () => {
    navigator.clipboard?.writeText(`${shareText} ${shareUrl}`);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1500);
  };

  // Direct Native App Launchers
  const handleWhatsApp = () => {
    shareToWhatsAppDirectApp(shareText, shareUrl);
  };

  const handleTelegram = () => {
    shareToTelegramDirectApp(shareText, shareUrl);
  };

  const handleTwitter = () => {
    shareToTwitterDirectApp(shareText, shareUrl);
  };

  const handleFacebook = () => {
    shareToFacebookDirectApp(shareUrl);
  };

  const handleNativeOsApp = async () => {
    const shared = await triggerNativeOsShare({
      title,
      text: shareText,
      url: shareUrl,
    });
    if (shared) {
      onClose();
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-gray-100 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-base">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">share</span>
            </div>
            <span>Share with Study Squad</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {/* Direct in-app banner */}
        <div className="px-3 py-2 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-2 text-emerald-800 text-xs font-semibold">
          <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0">bolt</span>
          <span>Direct App Launch: Opens directly inside installed native apps!</span>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed font-medium">
          Send this cheat sheet to your classmates to help them score higher in their term exams.
        </p>

        {/* Resource quote */}
        <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-800 font-semibold border border-gray-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600 text-[18px]">description</span>
          <span className="line-clamp-1">"{title}"</span>
        </div>

        {/* Primary App Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* WhatsApp Direct */}
          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex flex-col items-center justify-center gap-1 p-3 rounded-2xl bg-[#d1fae5] hover:bg-[#a7f3d0] text-[#006242] cursor-pointer transition-all active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-[24px]">chat</span>
            <span className="text-[11px] font-bold">WhatsApp App</span>
            <span className="text-[9px] opacity-75 font-semibold">Direct App</span>
          </button>

          {/* Telegram Direct */}
          <button
            type="button"
            onClick={handleTelegram}
            className="flex flex-col items-center justify-center gap-1 p-3 rounded-2xl bg-[#dbe1ff] hover:bg-[#b4c5ff] text-[#00174b] cursor-pointer transition-all active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-[24px]">send</span>
            <span className="text-[11px] font-bold">Telegram App</span>
            <span className="text-[9px] opacity-75 font-semibold">Direct App</span>
          </button>

          {/* X / Twitter Direct */}
          <button
            type="button"
            onClick={handleTwitter}
            className="flex flex-col items-center justify-center gap-1 p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 cursor-pointer transition-all active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-[24px]">tag</span>
            <span className="text-[11px] font-bold">X (Twitter)</span>
            <span className="text-[9px] opacity-75 font-semibold">Direct App</span>
          </button>

          {/* Facebook Direct */}
          <button
            type="button"
            onClick={handleFacebook}
            className="flex flex-col items-center justify-center gap-1 p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-900 cursor-pointer transition-all active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-[24px]">thumb_up</span>
            <span className="text-[11px] font-bold">Facebook</span>
            <span className="text-[9px] opacity-75 font-semibold">Direct App</span>
          </button>
        </div>

        {/* Secondary options: Mobile Native Share Sheet & Copy Link */}
        <div className="flex items-center gap-2 pt-1">
          {hasNativeShare && (
            <button
              type="button"
              onClick={handleNativeOsApp}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">smartphone</span>
              <span>Open in Mobile App Tray</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className={`py-2.5 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              hasNativeShare ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'w-full bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Link'}</span>
          </button>
        </div>

        {copied && (
          <div className="p-2 bg-emerald-50 text-emerald-800 text-xs font-bold text-center rounded-xl animate-fadeIn">
            ✓ Cheat sheet link copied to clipboard!
          </div>
        )}
      </div>
    </div>
  );
};
