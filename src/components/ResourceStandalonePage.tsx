import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { UserProfile } from '../firebase';
import { MathResource } from '../data/mathResources';
import { BrandingConfig } from '../services/branding';
import {
  isInAppBrowser,
  isAndroidDevice,
  getChromeIntentUrl,
  getExternalBrowserShareUrl,
  attemptAutoLaunchExternalBrowser,
} from '../services/externalBrowser';
import { InAppBrowserBanner } from './InAppBrowserBanner';
import { ChromeIcon, WhatsAppIcon, TelegramIcon, FacebookIcon } from './SocialIcons';
import { downloadResourceToSystem, printResourceInA4 } from '../services/fileDownloader';
import { AdPlacement } from './AdPlacement';

interface ResourceStandalonePageProps {
  resource: MathResource;
  onNavigateHome: () => void;
  currentUser: User | null;
  userProfile?: UserProfile | null;
  onGoogleSignIn: () => void;
  onQuickDemoSignIn?: (email: string, name: string) => void;
  onToast: (msg: string) => void;
  onRequireLogin?: (title: string, grade: string) => void;
  onRequireCaptcha?: (res: MathResource) => void;
  branding?: BrandingConfig;
  allResources?: MathResource[];
  onOpenResource?: (res: MathResource) => void;
}

export const ResourceStandalonePage: React.FC<ResourceStandalonePageProps> = ({
  resource,
  onNavigateHome,
  currentUser,
  userProfile,
  onGoogleSignIn,
  onQuickDemoSignIn,
  onToast,
  onRequireLogin,
  onRequireCaptcha,
  branding,
  allResources = [],
  onOpenResource,
}) => {
  const [inApp, setInApp] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Auto-launch external browser if clicked from in-app browser or with openExternal param
  useEffect(() => {
    attemptAutoLaunchExternalBrowser();
    if (isInAppBrowser()) {
      setInApp(true);
    }
    // Update document title for SEO
    if (typeof document !== 'undefined') {
      document.title = `${resource.title} (${resource.grade}) - Free Download | ${branding?.siteTitle || 'Maths at Your Fingertips'}`;
    }
  }, [resource, branding]);

  const shareUrl = typeof window !== 'undefined'
    ? getExternalBrowserShareUrl(`${window.location.origin}/resource/${resource.id}`)
    : `/resource/${resource.id}?openExternal=true`;

  const copyShareLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      onToast('Direct webpage link copied! Anyone clicking it directly opens this page.');
    }
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(
      `Check out this high-scoring math resource: "${resource.title}" (${resource.grade} • ${resource.topic})\n\nOpen directly here: ${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const shareViaTelegram = () => {
    const text = encodeURIComponent(`${resource.title} - ${resource.grade} Mathematics Revision`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, '_blank');
  };

  const shareViaFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleOpenChrome = () => {
    if (isAndroidDevice()) {
      window.location.href = getChromeIntentUrl(shareUrl);
    } else {
      navigator.clipboard?.writeText(shareUrl);
      onToast('Link copied! Paste into Google Chrome or Safari.');
    }
  };

  const handleDownloadClick = async () => {
    if (!currentUser) {
      if (onRequireLogin) {
        onRequireLogin(resource.title, resource.grade);
      } else {
        onGoogleSignIn();
      }
      return;
    }

    if (onRequireCaptcha) {
      onRequireCaptcha(resource);
      return;
    }

    setIsDownloading(true);
    try {
      await downloadResourceToSystem(resource);
      onToast(`✓ Download started for "${resource.title}"`);
    } catch {
      onToast('Download initiated');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintClick = () => {
    setIsPrinting(true);
    try {
      printResourceInA4(resource);
    } catch {
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  // Related resources from same grade or topic
  const relatedResources = allResources
    .filter((r) => r.id !== resource.id && (r.grade === resource.grade || r.topic === resource.topic))
    .slice(0, 3);

  const thumbImg = resource.thumbnailUrl || resource.imageUrl;

  return (
    <div className="w-full min-h-screen bg-[#f9f9ff] text-[#111c2d] pb-24 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Social Media in-app browser banner */}
      <InAppBrowserBanner />

      {inApp && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">open_in_browser</span>
            <span>You are viewing in a social app browser. For direct PDF download &amp; printing, open in Chrome.</span>
          </div>
          <button
            onClick={handleOpenChrome}
            className="bg-slate-950 hover:bg-black text-amber-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-extrabold cursor-pointer shrink-0"
          >
            <ChromeIcon size={14} />
            <span>Open in Chrome</span>
          </button>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-xs px-3 sm:px-8 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#004ac6] bg-slate-100 hover:bg-blue-50 px-3 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Return to Learning Hub"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span className="hidden sm:inline">All Study Materials</span>
          </button>

          <div className="h-5 w-[1px] bg-slate-200 hidden sm:block"></div>

          <div className="truncate">
            <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
              {resource.title}
            </h1>
            <p className="text-[10px] text-slate-500 hidden sm:block">
              {resource.grade} • {resource.topic} • {resource.format}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={copyShareLink}
            className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-[#004ac6] text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-200 transition-all cursor-pointer"
            title="Copy direct shareable webpage URL"
          >
            <span className="material-symbols-outlined text-[16px]">share</span>
            <span className="hidden md:inline">Share Page Link</span>
          </button>

          {currentUser ? (
            <div
              className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs"
              title={currentUser.displayName || currentUser.email || 'Student'}
            >
              {(currentUser.displayName || currentUser.email || 'S')[0].toUpperCase()}
            </div>
          ) : (
            <button
              onClick={onGoogleSignIn}
              className="inline-flex items-center gap-1 bg-[#004ac6] hover:bg-blue-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">login</span>
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Webpage Body */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-4 flex-wrap">
          <button onClick={onNavigateHome} className="hover:text-blue-600 cursor-pointer">
            Home
          </button>
          <span>/</span>
          <span>{resource.grade}</span>
          <span>/</span>
          <span>{resource.topic}</span>
          <span>/</span>
          <span className="text-slate-800 font-bold truncate max-w-[200px]">{resource.title}</span>
        </div>

        {/* Hero Card Container */}
        <div className="bg-white rounded-3xl border border-blue-100 shadow-xl overflow-hidden mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Left: Thumbnail Preview Graphic (5 cols) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-blue-950 p-6 flex flex-col items-center justify-center text-white relative min-h-[280px]">
              {thumbImg ? (
                <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/20 relative group">
                  <img src={thumbImg} alt={resource.title} className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 bg-slate-950/80 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    Auto-Generated Thumbnail
                  </span>
                </div>
              ) : (
                <div className="text-center p-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <span className="material-symbols-outlined text-[36px]">description</span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">{resource.title}</h3>
                  <p className="text-xs text-blue-200 mt-1">{resource.format}</p>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-xs text-blue-200">
                <span className="material-symbols-outlined text-[16px] text-emerald-400">verified</span>
                <span>Verified Handcrafted Mathematics Resource</span>
              </div>
            </div>

            {/* Right: Metadata, Actions & Details (7 cols) */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                    {resource.grade}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {resource.topic}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                      resource.tier === 'pro'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {resource.tier === 'pro' ? '★ Pro Masterclass' : '✓ 100% Free Download'}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {resource.title}
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
                  {resource.description ||
                    `High-yield revision notes and formulas for ${resource.grade} covering ${resource.topic}. Handcrafted specifically for CBSE/ICSE board exams and Olympiads.`}
                </p>

                {/* Key stats pill row */}
                <div className="grid grid-cols-3 gap-2.5 my-5 pt-4 border-t border-slate-100 text-center">
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Format</span>
                    <span className="text-xs font-extrabold text-slate-900 truncate block mt-0.5">
                      {resource.format}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Downloads</span>
                    <span className="text-xs font-extrabold text-emerald-600 block mt-0.5">
                      {resource.downloadsCount || '1.8k+'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Student Rating</span>
                    <span className="text-xs font-extrabold text-amber-600 block mt-0.5">
                      ★ {resource.rating || 4.9} / 5.0
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={handleDownloadClick}
                  disabled={isDownloading}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-[#004ac6] hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isDownloading ? 'hourglass_top' : 'download'}
                  </span>
                  <span>{isDownloading ? 'Preparing PDF...' : 'Download Resource File'}</span>
                </button>

                <button
                  onClick={handlePrintClick}
                  disabled={isPrinting}
                  className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm px-4 py-3.5 rounded-2xl transition-colors cursor-pointer"
                  title="Print A4 Revision Sheet"
                >
                  <span className="material-symbols-outlined text-[18px]">print</span>
                  <span>Print A4</span>
                </button>
              </div>
            </div>
          </div>

          {/* Social Media Sharing Strip */}
          <div className="bg-slate-50 border-t border-slate-100 p-4 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <span className="material-symbols-outlined text-[18px] text-blue-600">share</span>
              <span>Share this dedicated webpage (Direct link opens in any browser / Chrome):</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={shareViaWhatsApp}
                className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold px-3 py-1.5 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                title="Share to WhatsApp"
              >
                <WhatsAppIcon size={15} />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={shareViaTelegram}
                className="inline-flex items-center gap-1.5 bg-[#229ED9] hover:bg-[#1f8ec4] text-white font-bold px-3 py-1.5 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                title="Share to Telegram"
              >
                <TelegramIcon size={15} />
                <span>Telegram</span>
              </button>
              <button
                onClick={shareViaFacebook}
                className="inline-flex items-center gap-1.5 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold px-3 py-1.5 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                title="Share to Facebook"
              >
                <FacebookIcon size={15} />
                <span>Facebook</span>
              </button>
              <button
                onClick={copyShareLink}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-2xs"
                title="Copy Direct Share URL"
              >
                <span className="material-symbols-outlined text-[15px]">content_copy</span>
                <span>Copy Link</span>
              </button>
            </div>
          </div>
        </div>

        {/* Ad Placement */}
        <div className="my-6">
          <AdPlacement location="catalog_bottom" />
        </div>

        {/* Related Chapter Notes */}
        {relatedResources.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                Related {resource.grade} Study Materials
              </h3>
              <button onClick={onNavigateHome} className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                View All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedResources.map((rel) => {
                const relThumb = rel.thumbnailUrl || rel.imageUrl;
                return (
                  <div
                    key={rel.id}
                    onClick={() => {
                      if (onOpenResource) {
                        onOpenResource(rel);
                      } else {
                        window.open(`/resource/${rel.id}`, '_blank');
                      }
                    }}
                    className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
                  >
                    {relThumb && (
                      <div className="aspect-video rounded-xl overflow-hidden mb-2.5 bg-slate-900">
                        <img src={relThumb} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    )}
                    <span className="text-[10px] font-bold text-blue-600 uppercase">{rel.topic}</span>
                    <h4 className="text-xs font-extrabold text-slate-900 mt-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {rel.title}
                    </h4>
                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">
                      {rel.format}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
