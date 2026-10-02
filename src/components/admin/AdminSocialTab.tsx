import React, { useState } from 'react';
import {
  SocialConfig,
  PlatformConfig,
  DEFAULT_SOCIAL_CONFIG,
  saveSocialConfigLocally,
  openInAppOrWeb,
  shareToWhatsAppDirectApp,
  shareToTelegramDirectApp,
  openInstagramDirectApp,
  openYouTubeDirectApp,
} from '../../services/social';
import { saveSocialSettingsToFirestore } from '../../firebase';

interface AdminSocialTabProps {
  currentSocial: SocialConfig;
  onUpdateSocial: (newSocial: SocialConfig) => void;
  onToast: (msg: string) => void;
}

export const AdminSocialTab: React.FC<AdminSocialTabProps> = ({
  currentSocial,
  onUpdateSocial,
  onToast,
}) => {
  const [social, setSocial] = useState<SocialConfig>(currentSocial);
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdatePlatform = (
    platformKey: keyof SocialConfig['platforms'],
    partial: Partial<PlatformConfig>
  ) => {
    const updated: SocialConfig = {
      ...social,
      platforms: {
        ...social.platforms,
        [platformKey]: {
          ...social.platforms[platformKey],
          ...partial,
        },
      },
    };
    setSocial(updated);
    onUpdateSocial(updated);
  };

  const handleTestDeepLink = (platformKey: keyof SocialConfig['platforms']) => {
    const p = social.platforms[platformKey];
    if (platformKey === 'whatsapp') {
      shareToWhatsAppDirectApp('Testing Maths at Your Fingertips deep-link!', window.location.origin);
      onToast('Triggering WhatsApp native app scheme (whatsapp://)...');
    } else if (platformKey === 'telegram') {
      shareToTelegramDirectApp('Testing Maths at Your Fingertips deep-link!', window.location.origin);
      onToast('Triggering Telegram native app scheme (tg://)...');
    } else if (platformKey === 'instagram') {
      openInstagramDirectApp(p.handleOrNumber);
      onToast(`Triggering Instagram app (instagram://user?username=${p.handleOrNumber})...`);
    } else if (platformKey === 'youtube') {
      openYouTubeDirectApp(p.url);
      onToast('Triggering YouTube native app (vnd.youtube://)...');
    } else {
      openInAppOrWeb(`${p.nativeAppScheme}launch`, p.url);
      onToast(`Triggering ${p.name} native protocol (${p.nativeAppScheme})...`);
    }
  };

  const handleSaveToCloud = async () => {
    setIsSaving(true);
    try {
      await saveSocialSettingsToFirestore(social);
      saveSocialConfigLocally(social);
      onToast('✓ Social channels & App Deep Links published live to website!');
    } catch (_e) {
      saveSocialConfigLocally(social);
      onToast('Saved locally in browser cache.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all social media URLs and app deep linking protocols to defaults?')) {
      setSocial(DEFAULT_SOCIAL_CONFIG);
      onUpdateSocial(DEFAULT_SOCIAL_CONFIG);
      saveSocialConfigLocally(DEFAULT_SOCIAL_CONFIG);
      onToast('Reset social settings to defaults');
    }
  };

  const platformKeys = Object.keys(social.platforms) as (keyof SocialConfig['platforms'])[];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-blue-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/20 mb-2">
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              Direct In-App Deep-Linking Engine
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Social Media Channels & Native App Links
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Configure URLs and handles for all student community channels. Social share links directly launch the relevant native mobile app (WhatsApp, Telegram, Instagram, etc.) instead of opening a web browser.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={handleSaveToCloud}
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
              {isSaving ? 'Syncing...' : 'Save & Publish Live'}
            </button>
          </div>
        </div>

        {/* Deep Linking Engine Status Callout */}
        <div className="mt-5 p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">bolt</span>
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>In-App Protocol Dispatcher Enabled</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-extrabold uppercase">
                  Active
                </span>
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                Automatically resolves <code className="bg-white/10 px-1 rounded text-emerald-200">whatsapp://</code>, <code className="bg-white/10 px-1 rounded text-emerald-200">tg://</code>, <code className="bg-white/10 px-1 rounded text-emerald-200">vnd.youtube://</code> protocols with graceful web browser fallback if app is uninstalled.
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer shrink-0 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
            <input
              type="checkbox"
              checked={social.forceNativeAppOnMobile}
              onChange={(e) =>
                setSocial({ ...social, forceNativeAppOnMobile: e.target.checked })
              }
              className="w-4 h-4 text-emerald-500 rounded"
            />
            <span className="text-xs font-bold text-white">Direct App Handshake</span>
          </label>
        </div>
      </div>

      {/* Share Message Template */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">share</span>
            Default Student Share Message Template
          </h3>
          <span className="text-[11px] font-semibold text-slate-400">
            Included in 1-Click WhatsApp & Telegram shares
          </span>
        </div>
        <input
          type="text"
          value={social.defaultShareMessage}
          onChange={(e) => setSocial({ ...social, defaultShareMessage: e.target.value })}
          placeholder="e.g. Check out this 1-page math formula cheat sheet on Maths at Your Fingertips!"
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        />
      </div>

      {/* Social Platforms Setup Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platformKeys.map((key) => {
          const p = social.platforms[key];
          return (
            <div
              key={key}
              className={`p-5 rounded-3xl border transition-all ${
                p.enabled
                  ? 'bg-white border-slate-200 shadow-sm'
                  : 'bg-slate-50/70 border-slate-200/60 opacity-70'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">{p.icon}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900">{p.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">
                        {p.badge}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Scheme: {p.nativeAppScheme}
                    </span>
                  </div>
                </div>

                {/* Enabled Toggle */}
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={p.enabled}
                    onChange={(e) => handleUpdatePlatform(key, { enabled: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    {p.enabled ? 'Active' : 'Disabled'}
                  </span>
                </label>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-500 mb-3 line-clamp-1">{p.description}</p>

              {/* Input Columns */}
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Handle / Phone Number / Username
                  </label>
                  <input
                    type="text"
                    value={p.handleOrNumber}
                    onChange={(e) =>
                      handleUpdatePlatform(key, { handleOrNumber: e.target.value })
                    }
                    placeholder="e.g. +919876543210 or @MathsAtYourFingertips"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Channel / Group / Profile Web URL (Fallback)
                  </label>
                  <input
                    type="text"
                    value={p.url}
                    onChange={(e) => handleUpdatePlatform(key, { url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">smartphone</span>
                  Opens directly in {p.name.split(' ')[0]} App
                </span>
                <button
                  type="button"
                  onClick={() => handleTestDeepLink(key)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Test launching the installed native app"
                >
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  Test App Launch
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
