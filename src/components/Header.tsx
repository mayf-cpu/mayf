import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { UserProfile, isUserAdmin, NotificationRecord } from '../firebase';
import { BrandingConfig } from '../services/branding';
import { SocialConfig, getSocialConfig } from '../services/social';
import { ThemeConfig } from '../services/theme';
import { syncAndLoadNotifications, getLocalNotifications } from '../services/notifications';
import { getUserCurrency, setUserCurrency, SUPPORTED_CURRENCIES } from '../services/currency';

interface HeaderProps {
  onOpenDownloads: () => void;
  downloadsCount: number;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  onOpenFormulaDeck: () => void;
  onOpenProPass: () => void;
  activeClass: string;
  onSelectNav: (nav: string) => void;
  activeNav: string;
  currentUser: User | null;
  userProfile: UserProfile | null;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  authLoading: boolean;
  onOpenAdminPanel: () => void;
  onOpenDashboard?: () => void;
  onOpenMobileRegister?: () => void;
  branding?: BrandingConfig;
  socialConfig?: SocialConfig;
  themeConfig?: ThemeConfig;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDownloads,
  downloadsCount,
  onSearchChange,
  searchQuery,
  onOpenFormulaDeck,
  onOpenProPass,
  activeClass,
  onSelectNav,
  activeNav,
  currentUser,
  userProfile,
  onGoogleSignIn,
  onSignOut,
  authLoading,
  onOpenAdminPanel,
  onOpenDashboard,
  onOpenMobileRegister,
  branding,
  socialConfig = getSocialConfig(),
  themeConfig,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState<NotificationRecord[]>(getLocalNotifications);
  const [hasUnread, setHasUnread] = useState(true);
  const [userCurrencyState, setUserCurrencyState] = useState(getUserCurrency());

  useEffect(() => {
    const handleCurrencyChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setUserCurrencyState(customEvent.detail);
      }
    };
    window.addEventListener('currency-changed', handleCurrencyChange);
    return () => window.removeEventListener('currency-changed', handleCurrencyChange);
  }, []);

  useEffect(() => {
    syncAndLoadNotifications().then((notifs) => {
      if (notifs && notifs.length > 0) {
        setNotificationsList(notifs);
      }
    });

    const handleNotifsChange = (e: Event) => {
      const customEvent = e as CustomEvent<NotificationRecord[]>;
      if (customEvent.detail) {
        setNotificationsList(customEvent.detail);
        setHasUnread(true);
      }
    };

    const handleBroadcast = (e: Event) => {
      const customEvent = e as CustomEvent<NotificationRecord>;
      if (customEvent.detail) {
        setNotificationsList((prev) => [customEvent.detail, ...prev]);
        setHasUnread(true);
      }
    };

    window.addEventListener('notifications-changed', handleNotifsChange);
    window.addEventListener('broadcast-notification', handleBroadcast);
    return () => {
      window.removeEventListener('notifications-changed', handleNotifsChange);
      window.removeEventListener('broadcast-notification', handleBroadcast);
    };
  }, []);

  const isPro = userProfile?.isPro || false;
  const isAdmin = isUserAdmin(currentUser);
  const displayName = currentUser?.displayName || userProfile?.displayName || 'Arjun S.';
  const userPhoto =
    currentUser?.photoURL ||
    userProfile?.photoURL ||
    'https://lh3.googleusercontent.com/aida/AEtjO1UhpsrCRgiMrqTFlxfxPmNEa9Mtse1EmIX9zICS42Uh1JtnrsM60AU9GVMNCbNnlbrAIotsPgTX3W9nKh4uAiXM0PgHoimvPKQaBLpbqHIp4_1uZu4yWVHLf54escoJl1BeIFQQMxvnUd3rHWguFEMELvfGhz6uqHQlt_qbW8WfXMr9-xLECGS6hIfPWzseTtdN2clzE2Wti1lCQf-pZHLuvXNZBRKctOh3IRBzw9Reiie7HJ1jVKCPzQ';

  const handleMobileNavClick = (nav: string) => {
    onSelectNav(nav);
    setMobileMenuOpen(false);
    if (nav === 'formula-deck') {
      onOpenFormulaDeck();
    } else if (nav === 'paid-masterclasses') {
      onOpenProPass();
    } else if (nav === 'free-downloads') {
      const el = document.getElementById('resource-catalog');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else {
      const el = document.getElementById('resource-catalog');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full max-w-full bg-[#ffffff]/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      {/* Top Banner Announcement */}
      {branding?.showAnnouncement !== false && (
        <div
          className="text-[#eeefff] px-3 py-1.5 w-full overflow-hidden text-center transition-colors"
          style={{ backgroundColor: themeConfig?.primaryColor || '#2563eb' }}
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-[13px] font-semibold">
            <span className="material-symbols-outlined text-[16px] sm:text-[18px] shrink-0">celebration</span>
            <span className="truncate">
              {branding?.announcementText || '🎉 Term 2 Formula Sheets & Chapter Cheat-Sheets are LIVE!'}
            </span>
            <button
              onClick={() => handleMobileNavClick('free-downloads')}
              className="underline hover:text-white shrink-0 ml-1 cursor-pointer font-bold"
            >
              {branding?.announcementLinkText || 'Get PDFs →'}
            </button>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="h-16 sm:h-20 max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 flex items-center justify-between gap-1.5 sm:gap-4 w-full">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2 sm:gap-6 min-w-0 flex-1 sm:flex-initial">
          <button
            onClick={() => {
              onSelectNav('explore-notes');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 sm:gap-3 text-left cursor-pointer group min-w-0 max-w-full"
          >
            <img
              alt={branding?.siteTitle || "Brand logo"}
              className="h-6 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105 shrink-0"
              src={branding?.logoUrl || "https://lh3.googleusercontent.com/aida/AEtjO1UjgWp59CcYsKXuqwB2FYHcehNEDlMGhbND9VEHl154aFff2EPvt39mUwZ6qXVc-edHZxj5IPmP7JbzGPqzLaCgdQX4S4GUMQBtC4KxFgHHUCu_55VykewYAvz0ReMRXT-l8SNrEHvxLcCxtTX0zVGZ6bSEQvSxd3WcuoKgXa3gTPPWl-czWwPLaYldf3jK6W4CDevlmvi08ew8Ag-k6FiBm7lx3ROJP5G9hsY15VySSpP-r5sf3fqLFLs"}
            />
            <div className="flex flex-col min-w-0">
              <span
                className="text-sm sm:text-lg lg:text-[20px] font-bold leading-tight tracking-tight truncate max-w-[150px] sm:max-w-none transition-colors"
                style={{ color: themeConfig?.primaryColor || '#004ac6' }}
              >
                {branding?.siteTitle || "Maths at Your Fingertips"}
              </span>
              <span className="hidden sm:block text-[10px] sm:text-[11px] font-bold text-[#434655] uppercase tracking-wider truncate">
                {branding?.tagline || "Class 5 – 10 Learning Hub"}
              </span>
            </div>
          </button>
        </div>

        {/* Global Search Bar (Large screens) */}
        <div className="hidden xl:flex flex-1 max-w-md items-center relative mx-2">
          <div className="w-full flex items-center bg-[#f0f3ff] rounded-xl px-3 py-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <span className="material-symbols-outlined text-[#737686] mr-2 text-[20px]">search</span>
            <input
              className="w-full bg-transparent border-0 outline-none text-[14px] text-[#111c2d] placeholder:text-[#737686]"
              placeholder="Search formula sheets, notes, NCERT..."
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="text-gray-400 hover:text-gray-600 mr-1 p-0.5 cursor-pointer"
                title="Clear search"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
            <div className="flex items-center gap-1 shrink-0">
              <span className="bg-[#d8e3fb] text-[#434655] text-[11px] font-bold px-2 py-0.5 rounded-lg">
                {activeClass}
              </span>
              <kbd className="bg-[#d8e3fb] text-[#737686] text-[11px] font-bold px-1.5 py-0.5 rounded">
                /
              </kbd>
            </div>
          </div>
        </div>

        {/* Main Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 shrink-0">
          <button
            onClick={() => handleMobileNavClick('explore-notes')}
            style={activeNav === 'explore-notes' && themeConfig?.primaryColor ? { backgroundColor: themeConfig.primaryColor } : {}}
            className={`text-[13px] font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer ${
              activeNav === 'explore-notes'
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'text-[#434655] hover:text-[#111c2d] hover:bg-[#e7eeff]'
            }`}
          >
            Explore Notes
          </button>
          <button
            onClick={() => handleMobileNavClick('video-lessons')}
            style={activeNav === 'video-lessons' && themeConfig?.primaryColor ? { backgroundColor: themeConfig.primaryColor } : {}}
            className={`text-[13px] font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer ${
              activeNav === 'video-lessons'
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'text-[#434655] hover:text-[#111c2d] hover:bg-[#e7eeff]'
            }`}
          >
            Video Lessons
          </button>
          <button
            onClick={() => handleMobileNavClick('formula-deck')}
            style={activeNav === 'formula-deck' && themeConfig?.primaryColor ? { backgroundColor: themeConfig.primaryColor } : {}}
            className={`text-[13px] font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer ${
              activeNav === 'formula-deck'
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'text-[#434655] hover:text-[#111c2d] hover:bg-[#e7eeff]'
            }`}
          >
            Formula Deck
          </button>
          <button
            onClick={() => handleMobileNavClick('paid-masterclasses')}
            className={`text-[13px] font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer ${
              activeNav === 'paid-masterclasses'
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'text-[#434655] hover:text-[#111c2d] hover:bg-[#e7eeff]'
            }`}
          >
            Masterclasses
          </button>
        </nav>

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Mobile search toggle */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="xl:hidden p-1.5 sm:p-2 text-[#434655] hover:bg-[#e7eeff] rounded-xl cursor-pointer transition-colors"
            title="Search"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]">search</span>
          </button>

          {/* Social Links (Desktop) */}
          <div className="hidden md:flex items-center gap-1 text-[#434655]">
            <a
              className="p-1.5 rounded-lg hover:bg-[#e7eeff] text-[#434655] hover:text-[#111c2d] transition-colors"
              href={socialConfig.platforms.youtube.url || "https://youtube.com"}
              target="_blank"
              rel="noopener noreferrer"
              title="YouTube Video Channel"
            >
              <span className="material-symbols-outlined text-[19px]">smart_display</span>
            </a>
            <a
              className="p-1.5 rounded-lg hover:bg-[#e7eeff] text-[#434655] hover:text-[#111c2d] transition-colors"
              href={socialConfig.platforms.whatsapp.groupUrl || socialConfig.platforms.whatsapp.url || "https://whatsapp.com"}
              target="_blank"
              rel="noopener noreferrer"
              title="Discussion Group"
            >
              <span className="material-symbols-outlined text-[19px]">groups</span>
            </a>
            <a
              className="p-1.5 rounded-lg hover:bg-[#e7eeff] text-[#434655] hover:text-[#111c2d] transition-colors"
              href={socialConfig.platforms.telegram.groupUrl || socialConfig.platforms.telegram.url || "https://t.me"}
              target="_blank"
              rel="noopener noreferrer"
              title="Study Notifications Telegram"
            >
              <span className="material-symbols-outlined text-[19px]">send</span>
            </a>
          </div>

          {/* Downloads Action Button */}
          <button
            onClick={onOpenDownloads}
            className="hidden sm:inline-flex items-center gap-1.5 bg-[#6ffbbe] text-[#002113] text-xs sm:text-[13px] font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl hover:bg-[#4edea3] transition-colors shadow-sm cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">download</span>
            <span className="hidden md:inline">Downloads</span>
            {downloadsCount > 0 && (
              <span className="bg-[#006242] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {downloadsCount}
              </span>
            )}
          </button>

          {/* Official Currency Indicator (single currency display) */}
          <div className="hidden lg:flex items-center gap-1 bg-[#f0f3ff] px-2 py-1 rounded-xl border border-blue-100 text-xs">
            <span className="material-symbols-outlined text-[#004ac6] text-[15px]">payments</span>
            <select
              value={userCurrencyState.code}
              onChange={(e) => {
                setUserCurrency(e.target.value);
                setUserCurrencyState(SUPPORTED_CURRENCIES[e.target.value]);
              }}
              className="bg-transparent border-none outline-none font-bold text-xs text-[#004ac6] cursor-pointer"
              title="Official Currency for your Region"
            >
              {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol.trim()})
                </option>
              ))}
            </select>
          </div>

          {/* User Dashboard Quick Button (when logged in) */}
          {currentUser && onOpenDashboard && (
            <button
              onClick={onOpenDashboard}
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors shrink-0 shadow-xs border bg-[#e7eeff] hover:bg-[#dee8ff] text-[#004ac6] border-blue-200"
              title="Open Student Dashboard"
            >
              <span className="material-symbols-outlined text-[16px]">account_circle</span>
              <span>Dashboard</span>
            </button>
          )}

          {/* Quick Admin Console Button (ONLY visible for verified admin, completely hidden for normal users) */}
          {isAdmin && (
            <button
              onClick={onOpenAdminPanel}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors shrink-0 shadow-xs border bg-slate-900 text-amber-300 border-amber-500/50 hover:bg-slate-800"
              title="Admin Control Center (Admin Only)"
            >
              <span className="material-symbols-outlined text-[16px] text-amber-400">admin_panel_settings</span>
              <span>Control Panel</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </button>
          )}

          {/* Notification Bell */}
          <div className="relative">
            <button
              aria-label="Notifications"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setHasUnread(false);
              }}
              className="p-1.5 sm:p-2 text-[#434655] hover:bg-[#e7eeff] rounded-xl relative cursor-pointer transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">notifications</span>
              {hasUnread && notificationsList.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#fea619] border-2 border-white"></span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-xs sm:max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-fadeIn max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-gray-900">Study Notifications</span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {notificationsList.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Live Feed</span>
                </div>
                <div className="space-y-2.5 mt-3">
                  {notificationsList.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400">
                      No announcements right now. Check back soon!
                    </div>
                  ) : (
                    notificationsList.map((notif) => (
                      <div
                        key={notif.id}
                        className={`text-left text-xs p-2.5 rounded-xl border transition-all ${
                          notif.priority === 'urgent' || notif.priority === 'high'
                            ? 'bg-amber-50/80 border-amber-200'
                            : 'bg-blue-50/70 border-blue-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`font-bold truncate ${
                              notif.priority === 'urgent' || notif.priority === 'high'
                                ? 'text-amber-900'
                                : 'text-blue-900'
                            }`}
                          >
                            {notif.title}
                          </span>
                          {notif.tag && (
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-white/80 px-1.5 py-0.5 rounded text-gray-600 shrink-0">
                              {notif.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 leading-relaxed text-[11px]">{notif.message}</p>
                        {notif.createdAt && (
                          <div className="mt-1 text-[9px] text-gray-400 font-medium">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile or Google Sign In */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-1.5 sm:gap-2 p-1 sm:pl-2 bg-[#f0f3ff] hover:bg-[#e7eeff] transition-colors rounded-full sm:pr-2.5 py-1 shadow-sm cursor-pointer border border-blue-100 shrink-0"
              >
                <img
                  alt={displayName}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-white shrink-0"
                  src={userPhoto}
                />
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-[#111c2d] leading-none truncate max-w-[90px]">
                    {displayName}
                  </span>
                  <span
                    className={`text-[10px] font-bold leading-tight ${
                      isPro ? 'text-[#006242]' : 'text-blue-600'
                    }`}
                  >
                    {isPro ? `${activeClass} • Pro` : `${activeClass} • Free`}
                  </span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-gray-500 hidden sm:inline-block">
                  {showProfileMenu ? 'arrow_drop_up' : 'arrow_drop_down'}
                </span>
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-xs bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-fadeIn">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                    <img
                      src={userPhoto}
                      alt={displayName}
                      className="w-10 h-10 rounded-full object-cover border border-blue-100"
                    />
                    <div className="overflow-hidden">
                      <div className="font-bold text-sm text-gray-900 truncate">{displayName}</div>
                      <div className="text-[11px] text-gray-500 truncate">{currentUser.email}</div>
                    </div>
                  </div>

                  <div className="py-2.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Status:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full ${
                          isPro
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isPro ? 'Pro Active ⭐' : 'Free Learner'}
                      </span>
                    </div>

                    {!isPro && (
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onOpenProPass();
                        }}
                        className="w-full mt-2 py-2 px-3 bg-[#fea619] hover:bg-amber-400 text-[#2a1700] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs tactile-btn-secondary"
                      >
                        <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
                        <span>Upgrade with Razorpay</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-100 mt-1 space-y-1">
                    {onOpenMobileRegister && (
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onOpenMobileRegister();
                        }}
                        className="w-full text-left py-1.5 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-emerald-600">phone_iphone</span>
                          <span>{userProfile?.mobileNumber ? 'Mobile Number' : 'Register Mobile (+91)'}</span>
                        </div>
                        {userProfile?.mobileNumber ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                            {userProfile.countryCode || '+91'} {userProfile.mobileNumber.slice(-4)}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                            Add
                          </span>
                        )}
                      </button>
                    )}

                    {onOpenDashboard && (
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onOpenDashboard();
                        }}
                        className="w-full text-left py-2 px-2 text-xs font-bold text-blue-700 bg-blue-50/70 hover:bg-blue-100/70 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-blue-700">account_circle</span>
                          <span>My Student Dashboard</span>
                        </div>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onOpenAdminPanel();
                        }}
                        className="w-full text-left py-1.5 px-2 text-xs font-bold text-slate-800 hover:bg-slate-100 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-amber-500">admin_panel_settings</span>
                          <span>Admin &amp; Gateway</span>
                        </div>
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                          Admin Only
                        </span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onSignOut();
                      }}
                      className="w-full text-left py-1.5 px-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">logout</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onGoogleSignIn}
              disabled={authLoading}
              className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-[#111c2d] border border-gray-200 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-60 shrink-0"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" viewBox="0 0 24 24">
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
              <span className="hidden sm:inline">{authLoading ? 'Signing in...' : 'Sign In'}</span>
            </button>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 text-[#434655] hover:bg-[#e7eeff] rounded-xl cursor-pointer transition-colors"
            title="Open Menu"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Search Bar Expansion */}
      {mobileSearchOpen && (
        <div className="xl:hidden px-4 py-2.5 bg-[#f0f3ff] border-t border-blue-50 animate-fadeIn">
          <div className="w-full flex items-center bg-white rounded-xl px-3 py-1.5 shadow-2xs border border-blue-100">
            <span className="material-symbols-outlined text-[#737686] mr-2 text-[18px]">search</span>
            <input
              className="w-full bg-transparent border-0 outline-none text-xs text-[#111c2d] placeholder:text-[#737686]"
              placeholder="Search formula sheets, notes..."
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="text-gray-400 hover:text-gray-600 p-0.5"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Navigation Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl p-4 space-y-2 animate-fadeIn max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-gray-100">
            <button
              onClick={() => handleMobileNavClick('explore-notes')}
              className={`p-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2 cursor-pointer ${
                activeNav === 'explore-notes'
                  ? 'bg-[#2563eb] text-white'
                  : 'bg-[#f0f3ff] text-[#111c2d]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              <span>Explore Notes</span>
            </button>
            <button
              onClick={() => handleMobileNavClick('video-lessons')}
              className={`p-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2 cursor-pointer ${
                activeNav === 'video-lessons'
                  ? 'bg-[#2563eb] text-white'
                  : 'bg-[#f0f3ff] text-[#111c2d]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">smart_display</span>
              <span>Video Lessons</span>
            </button>
            <button
              onClick={() => handleMobileNavClick('formula-deck')}
              className={`p-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2 cursor-pointer ${
                activeNav === 'formula-deck'
                  ? 'bg-[#2563eb] text-white'
                  : 'bg-[#f0f3ff] text-[#111c2d]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">square_foot</span>
              <span>Formula Deck</span>
            </button>
            <button
              onClick={() => handleMobileNavClick('paid-masterclasses')}
              className={`p-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2 cursor-pointer ${
                activeNav === 'paid-masterclasses'
                  ? 'bg-[#2563eb] text-white'
                  : 'bg-[#f0f3ff] text-[#111c2d]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
              <span>Masterclasses</span>
            </button>
            {currentUser && onOpenDashboard && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDashboard();
                }}
                className="p-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2 cursor-pointer bg-blue-50 text-[#004ac6] col-span-2 border border-blue-100"
              >
                <span className="material-symbols-outlined text-[18px]">account_circle</span>
                <span>My Student Dashboard</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdminPanel();
                }}
                className="p-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2 cursor-pointer bg-slate-900 text-amber-300 col-span-2"
              >
                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                <span>Admin Console &amp; Gateway</span>
                <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                  Admin
                </span>
              </button>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDownloads();
              }}
              className="flex items-center gap-2 bg-[#6ffbbe] text-[#002113] text-xs font-bold py-2 px-3 rounded-xl cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Offline Vault ({downloadsCount})</span>
            </button>

            <div className="flex items-center gap-2 text-[#434655]">
              <a
                href={socialConfig.platforms.youtube.url || "https://youtube.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-100 rounded-lg text-red-600"
                title="YouTube Channel"
              >
                <span className="material-symbols-outlined text-[20px]">smart_display</span>
              </a>
              <a
                href={socialConfig.platforms.whatsapp.groupUrl || socialConfig.platforms.whatsapp.url || "https://whatsapp.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-100 rounded-lg text-emerald-600"
                title="WhatsApp Community"
              >
                <span className="material-symbols-outlined text-[20px]">groups</span>
              </a>
              <a
                href={socialConfig.platforms.telegram.groupUrl || socialConfig.platforms.telegram.url || "https://t.me"}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-100 rounded-lg text-blue-600"
                title="Telegram Group"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
