import React, { useState, useEffect } from 'react';
import { isInAppBrowser, getChromeIntentUrl, isAndroidDevice, isIosDevice } from '../services/externalBrowser';
import { ChromeIcon } from './SocialIcons';

export const InAppBrowserBanner: React.FC = () => {
  const [inApp, setInApp] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (isInAppBrowser()) {
      setInApp(true);
    }
  }, []);

  if (!inApp || dismissed) return null;

  const handleOpenChrome = () => {
    if (isAndroidDevice()) {
      window.location.href = getChromeIntentUrl();
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setShowIosGuide(true);
      setTimeout(() => setShowIosGuide(false), 5000);
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-3 py-2.5 shadow-md font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs font-bold">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-[20px] shrink-0 text-white animate-bounce">
            open_in_browser
          </span>
          <div className="truncate">
            <span className="hidden sm:inline">Notice: You are in a social media in-app browser. </span>
            <span>Open in Chrome for direct file downloads &amp; Google Sign-in.</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleOpenChrome}
            className="inline-flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <ChromeIcon size={16} />
            <span>{isAndroidDevice() ? 'Open in Chrome' : 'Open in Safari / Chrome'}</span>
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-white/80 hover:text-white cursor-pointer"
            title="Dismiss banner"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      </div>

      {showIosGuide && (
        <div className="mt-2 p-2 bg-slate-950 text-amber-200 text-[11px] rounded-lg border border-amber-400/30 flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-[16px] text-amber-300">info</span>
          <span>
            Link copied to clipboard! Tap the <strong>···</strong> menu at the top or bottom of your screen and select <strong>"Open in Browser / Safari"</strong>.
          </span>
        </div>
      )}
    </div>
  );
};

