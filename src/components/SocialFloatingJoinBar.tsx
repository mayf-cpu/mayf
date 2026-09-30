import React, { useState } from 'react';
import { SocialConfig, getSocialConfig, openInAppOrWeb, openInstagramDirectApp, openYouTubeDirectApp } from '../services/social';
import { WhatsAppIcon, TelegramIcon, YouTubeIcon, InstagramIcon } from './SocialIcons';

interface SocialFloatingJoinBarProps {
  socialConfig?: SocialConfig;
  onToast: (msg: string) => void;
}

export const SocialFloatingJoinBar: React.FC<SocialFloatingJoinBarProps> = ({
  socialConfig = getSocialConfig(),
  onToast,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const platforms = socialConfig.platforms;
  const whatsappCfg = platforms.whatsapp;
  const telegramCfg = platforms.telegram;
  const youtubeCfg = platforms.youtube;
  const instagramCfg = platforms.instagram;

  const handleJoinWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const groupUrl = whatsappCfg.groupUrl || whatsappCfg.url || 'https://chat.whatsapp.com/FMathsFingertipsOfficial';
    const nativeUri = groupUrl.includes('chat.whatsapp.com')
      ? groupUrl.replace('https://chat.whatsapp.com', 'whatsapp://chat?code=')
      : 'whatsapp://';
    openInAppOrWeb(nativeUri, groupUrl);
    onToast('Opening WhatsApp Community...');
  };

  const handleJoinTelegram = (e: React.MouseEvent) => {
    e.stopPropagation();
    const groupUrl = telegramCfg.groupUrl || telegramCfg.url || 'https://t.me/MathsAtYourFingertips';
    const channelHandle = telegramCfg.handleOrNumber?.replace('@', '') || 'MathsAtYourFingertips';
    const nativeUri = `tg://resolve?domain=${channelHandle}`;
    openInAppOrWeb(nativeUri, groupUrl);
    onToast('Opening Telegram Channel...');
  };

  const handleSubscribeYouTube = (e: React.MouseEvent) => {
    e.stopPropagation();
    const channelUrl = youtubeCfg.url || 'https://youtube.com/@MathsAtYourFingertips';
    openYouTubeDirectApp(channelUrl);
    onToast('Opening YouTube Lessons...');
  };

  const handleFollowInstagram = (e: React.MouseEvent) => {
    e.stopPropagation();
    const handle = instagramCfg.handleOrNumber || '@maths_fingertips';
    openInstagramDirectApp(handle);
    onToast(`Opening Instagram (${handle})...`);
  };

  return (
    <div className="fixed bottom-5 left-4 z-40 animate-fadeIn">
      {isExpanded ? (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-blue-200/80 p-2 sm:p-2.5 flex items-center gap-1.5 sm:gap-2 text-slate-800 transition-all duration-200">
          <div className="flex items-center gap-1.5 px-2 border-r border-slate-200 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-tight text-blue-700 leading-none">
                Join Channels
              </span>
              <span className="text-[9px] text-slate-500 font-semibold leading-none mt-0.5">
                Official Communities
              </span>
            </div>
          </div>

          {/* WhatsApp Channel */}
          {whatsappCfg.enabled && (
            <button
              onClick={handleJoinWhatsApp}
              type="button"
              className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/70 text-xs font-bold transition-transform active:scale-95 cursor-pointer shadow-2xs group"
              title="Join official WhatsApp Community"
            >
              <WhatsAppIcon size={18} />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
          )}

          {/* Telegram Channel */}
          {telegramCfg.enabled && (
            <button
              onClick={handleJoinTelegram}
              type="button"
              className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200/70 text-xs font-bold transition-transform active:scale-95 cursor-pointer shadow-2xs group"
              title="Join official Telegram Study Vault"
            >
              <TelegramIcon size={18} />
              <span className="hidden sm:inline">Telegram</span>
            </button>
          )}

          {/* YouTube Channel */}
          {youtubeCfg.enabled && (
            <button
              onClick={handleSubscribeYouTube}
              type="button"
              className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 border border-red-200/70 text-xs font-bold transition-transform active:scale-95 cursor-pointer shadow-2xs group"
              title="Subscribe to YouTube Video Lessons"
            >
              <YouTubeIcon size={18} />
              <span className="hidden sm:inline">YouTube</span>
            </button>
          )}

          {/* Instagram Channel */}
          {instagramCfg.enabled && (
            <button
              onClick={handleFollowInstagram}
              type="button"
              className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-800 border border-pink-200/70 text-xs font-bold transition-transform active:scale-95 cursor-pointer shadow-2xs group"
              title="Follow Instagram Visuals"
            >
              <InstagramIcon size={18} />
              <span className="hidden sm:inline">Instagram</span>
            </button>
          )}

          {/* Collapse Button */}
          <button
            onClick={() => setIsExpanded(false)}
            type="button"
            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-0.5"
            title="Minimize join bar"
          >
            <span className="material-symbols-outlined text-[14px]">chevron_left</span>
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          type="button"
          className="flex items-center gap-2 bg-[#004ac6] hover:bg-blue-700 text-white rounded-full py-2 px-3.5 shadow-xl transition-transform active:scale-95 cursor-pointer border border-blue-400/40"
          title="Open Official Channels & Communities"
        >
          <div className="flex items-center -space-x-1.5">
            <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs">
              <WhatsAppIcon size={13} />
            </span>
            <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs">
              <TelegramIcon size={13} />
            </span>
          </div>
          <span className="text-xs font-extrabold tracking-tight">Join Channels</span>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </button>
      )}
    </div>
  );
};
