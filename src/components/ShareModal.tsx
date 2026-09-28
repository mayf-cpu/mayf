import React, { useState } from 'react';
import {
  shareToWhatsAppDirectApp,
  shareToTelegramDirectApp,
  shareToTwitterDirectApp,
  shareToFacebookDirectApp,
  triggerNativeOsShare,
} from '../services/social';
import { getChromeIntentUrl, getExternalBrowserShareUrl, isAndroidDevice } from '../services/externalBrowser';
import {
  WhatsAppIcon,
  TelegramIcon,
  FacebookIcon,
  XTwitterIcon,
  ChromeIcon,
} from './SocialIcons';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, title, url }) => {
  const [copiedLink, setCopiedLink] = useState<'standard' | 'chrome' | null>(null);

  if (!isOpen) return null;

  const currentHref = url || (typeof window !== 'undefined' ? window.location.href : '');
  const externalShareUrl = getExternalBrowserShareUrl(currentHref);
  const chromeIntentUrl = getChromeIntentUrl(currentHref);
  const shareText = `Check out "${title}" on Maths at Your Fingertips (Class 5 - 10 Learning Hub):`;

  const handleCopyStandard = () => {
    navigator.clipboard?.writeText(`${shareText}\n${externalShareUrl}`);
    setCopiedLink('standard');
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleCopyChromeIntent = () => {
    navigator.clipboard?.writeText(chromeIntentUrl);
    setCopiedLink('chrome');
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleLaunchChromeDirect = () => {
    if (isAndroidDevice()) {
      window.location.href = chromeIntentUrl;
    } else {
      handleCopyStandard();
    }
  };

  // Direct Social Sharers with External Browser URL
  const handleWhatsApp = () => {
    shareToWhatsAppDirectApp(shareText, externalShareUrl);
  };

  const handleTelegram = () => {
    shareToTelegramDirectApp(shareText, externalShareUrl);
  };

  const handleTwitter = () => {
    shareToTwitterDirectApp(shareText, externalShareUrl);
  };

  const handleFacebook = () => {
    shareToFacebookDirectApp(externalShareUrl);
  };

  const handleNativeOsApp = async () => {
    await triggerNativeOsShare({
      title,
      text: shareText,
      url: externalShareUrl,
    });
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-5 sm:p-6 border border-gray-100 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">share</span>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900 leading-tight">
                Share Material Externally
              </h3>
              <p className="text-[11px] text-gray-500 font-semibold">
                Guaranteed to open directly in Google Chrome / External Browser
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Selected Resource Title */}
        <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-blue-600 text-[20px] shrink-0">
            auto_stories
          </span>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-600 block">
              Sharing Content:
            </span>
            <span className="text-xs font-bold text-gray-900 line-clamp-1">
              "{title}"
            </span>
          </div>
        </div>

        {/* Direct Chrome / External Browser Launch Banner */}
        <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 rounded-2xl border border-emerald-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-950">
              <ChromeIcon size={18} />
              <span>Direct Chrome Browser Link</span>
            </div>
            <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
              Bypasses In-App WebView
            </span>
          </div>
          <p className="text-[11px] text-emerald-900 leading-relaxed font-medium">
            This external link forces recipient social media apps (WhatsApp, Facebook, Instagram) to launch in their device's default Chrome/Safari browser instead of an internal restricted viewer.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleLaunchChromeDirect}
              className="flex-1 py-2 px-3 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-transform active:scale-95"
            >
              <ChromeIcon size={16} />
              <span>Open in Chrome</span>
            </button>
            <button
              onClick={handleCopyChromeIntent}
              className="py-2 px-3 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">
                {copiedLink === 'chrome' ? 'done' : 'content_copy'}
              </span>
              <span>{copiedLink === 'chrome' ? 'Copied Chrome Link!' : 'Copy Chrome Link'}</span>
            </button>
          </div>
        </div>

        {/* Official Social Media Sharers Grid */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block">
            Share directly to study squads:
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Official WhatsApp */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-[#ecfdf5] hover:bg-[#d1fae5] border border-[#a7f3d0] text-[#065f46] cursor-pointer transition-all active:scale-95 group shadow-2xs"
            >
              <WhatsAppIcon size={26} />
              <span className="text-xs font-extrabold">WhatsApp</span>
              <span className="text-[9px] opacity-75 font-semibold">Official App</span>
            </button>

            {/* Official Telegram */}
            <button
              type="button"
              onClick={handleTelegram}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-[#eff6ff] hover:bg-[#dbeafe] border border-[#bfdbfe] text-[#1e40af] cursor-pointer transition-all active:scale-95 group shadow-2xs"
            >
              <TelegramIcon size={26} />
              <span className="text-xs font-extrabold">Telegram</span>
              <span className="text-[9px] opacity-75 font-semibold">Official App</span>
            </button>

            {/* Official Facebook */}
            <button
              type="button"
              onClick={handleFacebook}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-[#eff6ff] hover:bg-[#dbeafe] border border-[#bfdbfe] text-[#1e3a8a] cursor-pointer transition-all active:scale-95 group shadow-2xs"
            >
              <FacebookIcon size={26} />
              <span className="text-xs font-extrabold">Facebook</span>
              <span className="text-[9px] opacity-75 font-semibold">Official App</span>
            </button>

            {/* Official X / Twitter */}
            <button
              type="button"
              onClick={handleTwitter}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 cursor-pointer transition-all active:scale-95 group shadow-2xs"
            >
              <XTwitterIcon size={24} />
              <span className="text-xs font-extrabold">X (Twitter)</span>
              <span className="text-[9px] opacity-75 font-semibold">Official App</span>
            </button>
          </div>
        </div>

        {/* Copy Standard Link & Native Share Bar */}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
          {hasNativeShare && (
            <button
              type="button"
              onClick={handleNativeOsApp}
              className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[17px]">share</span>
              <span>Open Device Share Tray</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyStandard}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              hasNativeShare
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                : 'w-full bg-slate-950 text-white hover:bg-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">
              {copiedLink === 'standard' ? 'check' : 'content_copy'}
            </span>
            <span>{copiedLink === 'standard' ? 'Copied Full Link!' : 'Copy Link'}</span>
          </button>
        </div>

        {copiedLink && (
          <div className="p-2 bg-emerald-50 text-emerald-800 text-xs font-bold text-center rounded-xl animate-fadeIn border border-emerald-200">
            ✓ External browser link copied to clipboard! Ready to paste into social media.
          </div>
        )}
      </div>
    </div>
  );
};
