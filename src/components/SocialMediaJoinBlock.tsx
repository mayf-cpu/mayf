import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { UserProfile, updateUserJoinedSocial } from '../firebase';
import {
  SocialConfig,
  openInAppOrWeb,
  openInstagramDirectApp,
  openYouTubeDirectApp,
} from '../services/social';

interface SocialMediaJoinBlockProps {
  currentUser: User | null;
  userProfile: UserProfile | null;
  socialConfig: SocialConfig;
  onToast: (msg: string) => void;
}

const STORAGE_JOINED_KEY = 'maths_portal_student_joined_social_v1';
const STORAGE_DISMISSED_KEY = 'maths_portal_student_dismissed_social_v1';

export const SocialMediaJoinBlock: React.FC<SocialMediaJoinBlockProps> = ({
  currentUser,
  userProfile,
  socialConfig,
  onToast,
}) => {
  const [hasJoinedLocally, setHasJoinedLocally] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_JOINED_KEY) === 'true';
  });
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_DISMISSED_KEY) === 'true';
  });
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [clickedChannels, setClickedChannels] = useState<Record<string, boolean>>({});

  // If user is not logged in, this block is not displayed as per requirements
  if (!currentUser) return null;

  const platforms = socialConfig.platforms;
  const whatsappCfg = platforms.whatsapp;
  const instagramCfg = platforms.instagram;
  const youtubeCfg = platforms.youtube;
  const telegramCfg = platforms.telegram;

  const handleJoinWhatsApp = () => {
    setClickedChannels((prev) => ({ ...prev, whatsapp: true }));
    const groupUrl = whatsappCfg.groupUrl || whatsappCfg.url || 'https://chat.whatsapp.com/FMathsFingertipsOfficial';
    const nativeUri = groupUrl.includes('chat.whatsapp.com')
      ? groupUrl.replace('https://chat.whatsapp.com', 'whatsapp://chat?code=')
      : 'whatsapp://';
    openInAppOrWeb(nativeUri, groupUrl);
    onToast('Opening WhatsApp Community...');
  };

  const handleFollowInstagram = () => {
    setClickedChannels((prev) => ({ ...prev, instagram: true }));
    const handle = instagramCfg.handleOrNumber || '@maths_fingertips';
    openInstagramDirectApp(handle);
    onToast(`Opening Instagram (${handle})...`);
  };

  const handleSubscribeYouTube = () => {
    setClickedChannels((prev) => ({ ...prev, youtube: true }));
    const channelUrl = youtubeCfg.url || 'https://youtube.com/@MathsAtYourFingertips';
    openYouTubeDirectApp(channelUrl);
    onToast('Opening YouTube Channel...');
  };

  const handleJoinTelegram = () => {
    setClickedChannels((prev) => ({ ...prev, telegram: true }));
    const groupUrl = telegramCfg.groupUrl || telegramCfg.url || 'https://t.me/MathsAtYourFingertips';
    const channelHandle = telegramCfg.handleOrNumber?.replace('@', '') || 'MathsAtYourFingertips';
    const nativeUri = `tg://resolve?domain=${channelHandle}`;
    openInAppOrWeb(nativeUri, groupUrl);
    onToast('Opening Telegram Channel...');
  };

  const handleMarkAllJoined = async () => {
    setHasJoinedLocally(true);
    localStorage.setItem(STORAGE_JOINED_KEY, 'true');
    if (currentUser) {
      try {
        await updateUserJoinedSocial(currentUser.uid, true);
      } catch (e) {
        console.warn('Could not update joined social in cloud:', e);
      }
    }
    onToast('🎉 Thank you for joining our community! Enjoy all math resources.');
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(STORAGE_DISMISSED_KEY, 'true');
  };

  const studentName = currentUser.displayName?.split(' ')[0] || userProfile?.displayName?.split(' ')[0] || 'Student';

  // If dismissed or marked as joined, show a minimal expandable ribbon
  if (isDismissed || hasJoinedLocally) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-4 animate-fadeIn">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[16px]">groups</span>
            </span>
            <span className="font-bold text-slate-800">
              {hasJoinedLocally ? '✓ You are connected with Maths at Your Fingertips community!' : 'Official Social Channels & Study Groups'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setIsDismissed(false);
                setIsCollapsed(false);
                localStorage.removeItem(STORAGE_DISMISSED_KEY);
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>View Channel Links</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6 animate-fadeIn">
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20 overflow-hidden">
        {/* Glow and accent shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/20 mb-2">
                <span className="material-symbols-outlined text-[15px]">diversity_3</span>
                Official Student Learning Community
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-2 flex-wrap">
                <span>Welcome, {studentName}!</span>
                <span className="text-blue-300 font-semibold text-lg sm:text-xl">
                  Join our official channels for daily formula drops
                </span>
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                Stay ahead in your CBSE Class 9 &amp; 10 board prep! Join our official student groups to get instant PDF notes, 1-minute visual mnemonic reels, and live teacher doubt clearing.
              </p>
            </div>

            {/* Quick Actions (Minimize / Dismiss) */}
            <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                title={isCollapsed ? 'Expand Channels' : 'Collapse Channels'}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isCollapsed ? 'expand_more' : 'expand_less'}
                </span>
                <span>{isCollapsed ? 'Show Channels' : 'Minimize'}</span>
              </button>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Dismiss block"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {/* Social Channels Grid */}
          {!isCollapsed && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {/* 1. WhatsApp Community */}
              <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 backdrop-blur-md transition-all group hover:border-emerald-400/40 hover:-translate-y-1">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-sm">
                      <span className="material-symbols-outlined text-[24px]">chat</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      24k+ Students
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                      WhatsApp Community
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                      {whatsappCfg.description || 'Daily formula sheet drops, doubt clearing & rapid exam alerts.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleJoinWhatsApp}
                  className="w-full py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/30 active:scale-98 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {clickedChannels.whatsapp ? 'check' : 'forum'}
                  </span>
                  <span>{clickedChannels.whatsapp ? 'Joined ✓ / Open Again' : 'Join WhatsApp Group'}</span>
                </button>
              </div>

              {/* 2. Instagram Page */}
              <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 backdrop-blur-md transition-all group hover:border-pink-400/40 hover:-translate-y-1">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 via-pink-500/20 to-purple-500/20 border border-pink-400/30 flex items-center justify-center text-pink-400 shadow-sm">
                      <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                      Visual Math
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white group-hover:text-pink-300 transition-colors">
                      Instagram Visuals
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                      {instagramCfg.description || 'Geometry tricks, mental math reels, and daily mnemonic flashcards.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleFollowInstagram}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/30 active:scale-98 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {clickedChannels.instagram ? 'check' : 'add_circle'}
                  </span>
                  <span>{clickedChannels.instagram ? 'Followed ✓ / Open' : 'Follow on Instagram'}</span>
                </button>
              </div>

              {/* 3. YouTube Channel */}
              <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 backdrop-blur-md transition-all group hover:border-red-400/40 hover:-translate-y-1">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-400/30 flex items-center justify-center text-red-400 shadow-sm">
                      <span className="material-symbols-outlined text-[24px]">smart_display</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                      Micro-Lectures
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white group-hover:text-red-300 transition-colors">
                      YouTube Channel
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                      {youtubeCfg.description || 'Animated 10-minute micro-lessons explaining Class 9 & 10 NCERT theorems.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSubscribeYouTube}
                  className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-red-950/30 active:scale-98 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {clickedChannels.youtube ? 'check' : 'subscriptions'}
                  </span>
                  <span>{clickedChannels.youtube ? 'Subscribed ✓ / Open' : 'Subscribe on YouTube'}</span>
                </button>
              </div>

              {/* 4. Telegram Channel */}
              <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 backdrop-blur-md transition-all group hover:border-sky-400/40 hover:-translate-y-1">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-sm">
                      <span className="material-symbols-outlined text-[24px]">send</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      PDF Vault
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white group-hover:text-sky-300 transition-colors">
                      Telegram Channel
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                      {telegramCfg.description || 'Uncompressed PDF formula booklets, exemplar packs & question papers.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleJoinTelegram}
                  className="w-full py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-sky-950/30 active:scale-98 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {clickedChannels.telegram ? 'check' : 'send'}
                  </span>
                  <span>{clickedChannels.telegram ? 'Joined ✓ / Open' : 'Join Telegram Channel'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer with "Mark all as joined" confirmation */}
          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-emerald-400">verified</span>
              <span>All links open directly inside your mobile app with instant handoff.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllJoined}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px] text-emerald-400">task_alt</span>
                <span>I have joined the channels</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
