import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User } from 'firebase/auth';
import { UserProfile, isUserAdmin, NotificationRecord } from '../firebase';
import { BrandingConfig } from '../services/branding';
import { SocialConfig, getSocialConfig } from '../services/social';
import { ThemeConfig } from '../services/theme';
import { syncAndLoadNotifications, getLocalNotifications } from '../services/notifications';
import { getUserCurrency, setUserCurrency, SUPPORTED_CURRENCIES } from '../services/currency';
import { MathResource } from '../data/mathResources';
import { AdPlacement } from './AdPlacement';
import {
  YouTubeIcon,
  WhatsAppIcon,
  TelegramIcon,
  InstagramIcon,
  FacebookIcon,
  ChromeIcon,
} from './SocialIcons';

interface HeaderProps {
  onOpenDownloads: () => void;
  downloadsCount: number;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  onOpenFormulaDeck: () => void;
  onOpenProPass: () => void;
  activeClass: string;
  onSelectClass?: (grade: string) => void;
  onSelectNav: (nav: string) => void;
  activeNav: string;
  currentUser: User | null;
  userProfile: UserProfile | null;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  authLoading: boolean;
  onOpenDashboard?: () => void;
  onOpenMobileRegister?: () => void;
  onOpenAiTeacher?: () => void;
  onShareWebsite?: () => void;
  branding?: BrandingConfig;
  socialConfig?: SocialConfig;
  themeConfig?: ThemeConfig;
  allResources?: MathResource[];
  onSelectResource?: (res: MathResource) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDownloads,
  downloadsCount,
  onSearchChange,
  searchQuery,
  onOpenFormulaDeck,
  onOpenProPass,
  activeClass,
  onSelectClass,
  onSelectNav,
  activeNav,
  currentUser,
  userProfile,
  onGoogleSignIn,
  onSignOut,
  authLoading,
  onOpenDashboard,
  onOpenMobileRegister,
  onOpenAiTeacher,
  onShareWebsite,
  branding,
  socialConfig = getSocialConfig(),
  themeConfig,
  allResources = [],
  onSelectResource,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  const [notificationsList, setNotificationsList] = useState<NotificationRecord[]>(getLocalNotifications);
  const [hasUnread, setHasUnread] = useState(true);
  const [userCurrencyState, setUserCurrencyState] = useState(getUserCurrency());

  // Check if title and tagline are non-empty
  const hasSiteTitle = Boolean(branding?.siteTitle && branding.siteTitle.trim().length > 0);
  const hasTagline = Boolean(branding?.tagline && branding.tagline.trim().length > 0);

  // Close search dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(e.target as Node)) {
        setDesktopDropdownOpen(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
        setMobileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  // Compute live search suggestions
  const trimmedSearch = searchQuery.trim().toLowerCase();

  const matchingResources = useMemo(() => {
    if (!trimmedSearch || !allResources || allResources.length === 0) return [];
    const terms = trimmedSearch.split(/\s+/).filter(Boolean);

    // Score and filter each resource
    const scored = allResources
      .map((r) => {
        const titleLower = r.title.toLowerCase();
        const topicLower = (r.topic || '').toLowerCase();
        const gradeLower = (r.grade || '').toLowerCase();
        const formatLower = (r.format || '').toLowerCase();
        const descLower = (r.description || '').toLowerCase();
        const tagsLower = (r.tags || []).map((t) => t.toLowerCase()).join(' ');
        const fullHaystack = `${titleLower} ${topicLower} ${gradeLower} ${formatLower} ${tagsLower} ${descLower}`;

        // Every term must match somewhere in the resource
        const matchesAll = terms.every((term) => fullHaystack.includes(term));
        if (!matchesAll) return null;

        // Calculate relevance score
        let score = 0;
        if (titleLower === trimmedSearch) score += 100;
        else if (titleLower.startsWith(trimmedSearch)) score += 60;
        else if (titleLower.includes(trimmedSearch)) score += 40;

        terms.forEach((term) => {
          if (titleLower.includes(term)) score += 20;
          if (topicLower.includes(term)) score += 15;
          if (gradeLower.includes(term)) score += 10;
          if (formatLower.includes(term)) score += 10;
          if (tagsLower.includes(term)) score += 8;
        });

        return { resource: r, score };
      })
      .filter((item): item is { resource: MathResource; score: number } => item !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item) => item.resource);

    return scored;
  }, [trimmedSearch, allResources]);

  const matchingTopics = useMemo(() => {
    if (!trimmedSearch || !allResources || allResources.length === 0) return [];
    const set = new Set<string>();
    const terms = trimmedSearch.split(/\s+/).filter(Boolean);
    allResources.forEach((r) => {
      const topLower = (r.topic || '').toLowerCase();
      if (topLower.includes(trimmedSearch) || terms.some((t) => topLower.includes(t))) {
        set.add(r.topic);
      }
    });
    return Array.from(set).slice(0, 4);
  }, [trimmedSearch, allResources]);

  const matchingGrades = useMemo(() => {
    if (!trimmedSearch) return [];
    const grades = ['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
    const terms = trimmedSearch.split(/\s+/).filter(Boolean);
    return grades.filter((g) => {
      const gLower = g.toLowerCase();
      const numOnly = gLower.replace('class', '').trim();
      return (
        gLower.includes(trimmedSearch) ||
        terms.some((t) => gLower.includes(t) || t === numOnly)
      );
    });
  }, [trimmedSearch]);

  const handleExecuteSearch = (queryToUse?: string) => {
    if (queryToUse !== undefined) {
      onSearchChange(queryToUse);
    }
    setDesktopDropdownOpen(false);
    setMobileDropdownOpen(false);
    onSelectNav('explore-notes');
    const el = document.getElementById('resource-catalog') || document.getElementById('cards-grid');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectResourceItem = (res: MathResource) => {
    setDesktopDropdownOpen(false);
    setMobileDropdownOpen(false);
    if (onSelectResource) {
      onSelectResource(res);
    } else {
      onSearchChange(res.title);
      handleExecuteSearch(res.title);
    }
  };

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

  // Prevent background scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const isPro = userProfile?.isPro || false;
  const isAdmin = isUserAdmin(currentUser);
  const displayName = currentUser?.displayName || userProfile?.displayName || 'Student';
  const userPhoto =
    currentUser?.photoURL ||
    userProfile?.photoURL ||
    'https://lh3.googleusercontent.com/aida/AEtjO1UhpsrCRgiMrqTFlxfxPmNEa9Mtse1EmIX9zICS42Uh1JtnrsM60AU9GVMNCbNnlbrAIotsPgTX3W9nKh4uAiXM0PgHoimvPKQaBLpbqHIp4_1uZu4yWVHLf54escoJl1BeIFQQMxvnUd3rHWguFEMELvfGhz6uqHQlt_qbW8WfXMr9-xLECGS6hIfPWzseTtdN2clzE2Wti1lCQf-pZHLuvXNZBRKctOh3IRBzw9Reiie7HJ1jVKCPzQ';

  const handleNavClick = (nav: string) => {
    onSelectNav(nav);
    setSidebarOpen(false);
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

  const handleClassSelect = (grade: string) => {
    if (onSelectClass) {
      onSelectClass(grade);
    }
    setSidebarOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full max-w-full bg-[#ffffff]/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-gray-100">
        {/* Universal Top Ad Placement */}
        <AdPlacement location="header_top" className="my-0" />

        {/* Top Announcement Banner (Optional) */}
        {branding?.showAnnouncement !== false && (
          <div
            className="text-[#eeefff] px-3 py-1.5 w-full overflow-hidden text-center transition-colors text-xs font-semibold"
            style={{ backgroundColor: themeConfig?.primaryColor || '#2563eb' }}
          >
            <div className="max-w-7xl mx-auto w-full flex items-center justify-center gap-1.5 sm:gap-2">
              <span className="material-symbols-outlined text-[16px] shrink-0">celebration</span>
              <span className="truncate">
                {branding?.announcementText || '🎉 Term 2 Formula Sheets & Chapter Cheat-Sheets are LIVE!'}
              </span>
              <button
                onClick={() => handleNavClick('free-downloads')}
                className="underline hover:text-white shrink-0 ml-1 cursor-pointer font-bold"
              >
                {branding?.announcementLinkText || 'Get PDFs →'}
              </button>
            </div>
          </div>
        )}

        {/* Main Navbar:
            - Desktop: Logo, Search Bar, Social Media Icons, Notification Symbol, AI Teacher Button, Login/Logged-in Button, Hamburger Menu Icon ONLY.
            - Mobile: Logo, Search Icon, Notification Icon, Hamburger Menu Icon ONLY.
        */}
        <div className="h-16 sm:h-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4 w-full">
          {/* 1. BRAND LOGO */}
          <div className="flex items-center min-w-0 shrink-0">
            <button
              onClick={() => {
                onSelectNav('explore-notes');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 sm:gap-3.5 text-left cursor-pointer group min-w-0 py-1"
              title="Return to Home"
            >
              <img
                alt={branding?.siteTitle || 'Brand logo'}
                className="h-9 sm:h-11 md:h-12 w-auto object-contain transition-transform group-hover:scale-105 shrink-0 drop-shadow-xs"
                src={
                  branding?.logoUrl ||
                  'https://lh3.googleusercontent.com/aida/AEtjO1UjgWp59CcYsKXuqwB2FYHcehNEDlMGhbND9VEHl154aFff2EPvt39mUwZ6qXVc-edHZxj5IPmP7JbzGPqzLaCgdQX4S4GUMQBtC4KxFgHHUCu_55VykewYAvz0ReMRXT-l8SNrEHvxLcCxtTX0zVGZ6bSEQvSxd3WcuoKgXa3gTPPWl-czWwPLaYldf3jK6W4CDevlmvi08ew8Ag-k6FiBm7lx3ROJP5G9hsY15VySSpP-r5sf3fqLFLs'
                }
              />
              {(hasSiteTitle || hasTagline) && (
                <div className="flex flex-col min-w-0">
                  {hasSiteTitle && (
                    <span
                      className="text-base sm:text-lg lg:text-[21px] font-black leading-tight tracking-tight truncate max-w-[190px] sm:max-w-[280px] md:max-w-none transition-colors"
                      style={{ color: themeConfig?.primaryColor || '#004ac6' }}
                    >
                      {branding!.siteTitle}
                    </span>
                  )}
                  {hasTagline && (
                    <span className="hidden sm:block text-[10px] sm:text-[11px] font-bold text-[#434655] uppercase tracking-wider truncate">
                      {branding!.tagline}
                    </span>
                  )}
                </div>
              )}
            </button>
          </div>

          {/* 2. SEARCH BAR (Desktop & Tablet) WITH AUTO-SUGGESTIONS DROPDOWN */}
          <div ref={desktopSearchRef} className="hidden md:flex flex-1 max-w-sm lg:max-w-md items-center relative mx-2">
            <div className="w-full flex items-center bg-[#f0f3ff] rounded-xl px-3 py-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] focus-within:ring-2 focus-within:ring-blue-500 transition-all border border-blue-50">
              <span className="material-symbols-outlined text-[#737686] mr-2 text-[20px]">search</span>
              <input
                className="w-full bg-transparent border-0 outline-none text-[13px] text-[#111c2d] placeholder:text-[#737686]"
                placeholder="Search formula sheets, notes, NCERT..."
                type="text"
                value={searchQuery}
                onFocus={() => setDesktopDropdownOpen(true)}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setDesktopDropdownOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleExecuteSearch();
                  }
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    onSearchChange('');
                    setDesktopDropdownOpen(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 mr-1 p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
              <div className="flex items-center gap-1 shrink-0">
                <span className="bg-[#d8e3fb] text-[#434655] text-[10px] font-bold px-2 py-0.5 rounded-lg">
                  {activeClass}
                </span>
              </div>
            </div>

            {/* Desktop Suggestions Dropdown */}
            {desktopDropdownOpen && trimmedSearch && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-blue-100 z-50 overflow-hidden max-h-[440px] overflow-y-auto animate-fadeIn divide-y divide-slate-100 text-left">
                {/* Topic / Chapter Quick Matches */}
                {matchingTopics.length > 0 && (
                  <div className="p-2.5 bg-slate-50/70">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 block mb-1.5">
                      Matching Topics &amp; Chapters
                    </span>
                    <div className="flex flex-wrap gap-1.5 px-1">
                      {matchingTopics.map((topicName) => (
                        <button
                          key={topicName}
                          type="button"
                          onClick={() => handleExecuteSearch(topicName)}
                          className="inline-flex items-center gap-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">auto_stories</span>
                          <span>{topicName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grade Matches */}
                {matchingGrades.length > 0 && onSelectClass && (
                  <div className="p-2 bg-indigo-50/50 flex items-center gap-2 px-3">
                    <span className="text-[11px] font-bold text-indigo-700">Filter by Grade:</span>
                    <div className="flex items-center gap-1">
                      {matchingGrades.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            onSelectClass(g);
                            handleExecuteSearch();
                          }}
                          className="text-[10px] font-extrabold bg-indigo-600 text-white px-2 py-0.5 rounded cursor-pointer hover:bg-indigo-700"
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resource Item Suggestions */}
                {matchingResources.length > 0 ? (
                  <div className="py-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3.5 py-1 block">
                      Suggested Study Materials
                    </span>
                    {matchingResources.map((res) => (
                      <div
                        key={res.id}
                        onClick={() => handleSelectResourceItem(res)}
                        className="px-3.5 py-2 hover:bg-blue-50/60 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[16px]">
                              {res.hasVideo ? 'smart_display' : 'description'}
                            </span>
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                              {res.title}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 truncate">
                              <span className="font-semibold text-blue-600">{res.grade}</span>
                              <span>•</span>
                              <span>{res.topic}</span>
                              <span>•</span>
                              <span>{res.format}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                              res.tier === 'free'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {res.tier === 'free' ? 'FREE' : 'PRO'}
                          </span>
                          <span className="material-symbols-outlined text-gray-400 group-hover:text-blue-600 text-[16px]">
                            chevron_right
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <span className="material-symbols-outlined text-slate-300 text-3xl mb-1">search_off</span>
                    <p className="text-xs font-semibold text-slate-600">
                      No exact matches for &quot;{searchQuery}&quot;
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Press enter to explore all resources or try searching Quadratic, Trigonometry, or NCERT.
                    </p>
                  </div>
                )}

                {/* View All Matching Results Footer */}
                <div className="p-2 bg-slate-50 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium px-2">
                    Search query: &quot;{searchQuery}&quot;
                  </span>
                  <button
                    type="button"
                    onClick={() => handleExecuteSearch()}
                    className="text-xs font-extrabold text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-100/70 transition-colors cursor-pointer"
                  >
                    View In Catalog &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT ACTION ICONS & BUTTONS */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* MOBILE ONLY: Search Toggle Icon Button */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-1.5 text-[#434655] hover:bg-[#e7eeff] rounded-xl cursor-pointer transition-colors"
              title="Search notes and formulas"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">search</span>
            </button>

            {/* OFFICIAL SOCIAL CHANNELS WITH DIRECT JOIN LINKS */}
            <div className="flex items-center gap-1 sm:gap-1.5 text-[#434655]">
              {/* WhatsApp Community Join Button */}
              {socialConfig.platforms.whatsapp.enabled && (
                <a
                  className="flex items-center gap-1.5 py-1 px-2 sm:px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  href={socialConfig.platforms.whatsapp.groupUrl || socialConfig.platforms.whatsapp.url || 'https://chat.whatsapp.com/FMathsFingertipsOfficial'}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Join Official WhatsApp Study Group"
                >
                  <WhatsAppIcon size={16} />
                  <span className="hidden xl:inline">Join WhatsApp</span>
                  <span className="hidden sm:inline-block xl:hidden">WhatsApp</span>
                </a>
              )}

              {/* Telegram Channel */}
              {socialConfig.platforms.telegram.enabled && (
                <a
                  className="hidden sm:flex items-center gap-1 py-1 px-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  href={socialConfig.platforms.telegram.groupUrl || socialConfig.platforms.telegram.url || 'https://t.me/MathsAtYourFingertips'}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Join Official Telegram PDF Vault"
                >
                  <TelegramIcon size={16} />
                  <span className="hidden xl:inline">Telegram</span>
                </a>
              )}

              {/* YouTube Channel */}
              {socialConfig.platforms.youtube.enabled && (
                <a
                  className="hidden md:flex p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors items-center justify-center"
                  href={socialConfig.platforms.youtube.url || 'https://youtube.com/@MathsAtYourFingertips'}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Subscribe to YouTube Video Lessons"
                >
                  <YouTubeIcon size={18} />
                </a>
              )}

              {/* Instagram Channel */}
              {socialConfig.platforms.instagram.enabled && (
                <a
                  className="hidden lg:flex p-1.5 rounded-lg hover:bg-pink-50 text-pink-600 transition-colors items-center justify-center"
                  href={socialConfig.platforms.instagram.url || 'https://instagram.com/maths_fingertips'}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Follow Instagram Visual Math Tricks"
                >
                  <InstagramIcon size={18} />
                </a>
              )}

              {onShareWebsite && (
                <button
                  type="button"
                  onClick={onShareWebsite}
                  className="hidden md:flex p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors items-center justify-center cursor-pointer"
                  title="Share Website Externally (Chrome Direct)"
                >
                  <span className="material-symbols-outlined text-[19px]">share</span>
                </button>
              )}
            </div>

            {/* NOTIFICATION SYMBOL (Shown on both Desktop & Mobile) */}
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
                <span className="material-symbols-outlined text-[21px] sm:text-[22px]">notifications</span>
                {hasUnread && notificationsList.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#fea619] border-2 border-white"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-xs sm:max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-fadeIn max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-gray-900">Study Notifications</span>
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                        {notificationsList.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>

                  <div className="divide-y divide-gray-50 mt-2">
                    {notificationsList.length === 0 ? (
                      <div className="py-6 text-center text-xs text-gray-400">No new announcements</div>
                    ) : (
                      notificationsList.map((notif) => (
                        <div key={notif.id} className="py-2.5 hover:bg-slate-50 px-2 rounded-xl transition-colors">
                          <div className="text-xs font-bold text-gray-900">{notif.title}</div>
                          <div className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">{notif.message}</div>
                          {notif.createdAt && (
                            <div className="text-[10px] text-gray-400 mt-1">
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

            {/* DESKTOP ONLY: AI Teacher Button */}
            {onOpenAiTeacher && (
              <button
                onClick={onOpenAiTeacher}
                className="hidden md:inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-xl cursor-pointer transition-all shrink-0 shadow-xs border bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 border-amber-300"
                title="Ask Teacher (Classroom Board Solver)"
              >
                <span className="material-symbols-outlined text-[17px]">co_present</span>
                <span>Ask Teacher</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              </button>
            )}

            {/* DESKTOP ONLY: Login / Logged In Bar Button */}
            <div className="hidden md:block">
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-1.5 sm:gap-2 p-1 sm:pl-2 bg-[#f0f3ff] hover:bg-[#e7eeff] transition-colors rounded-full sm:pr-2.5 py-1 shadow-xs cursor-pointer border border-blue-100 shrink-0"
                  >
                    <img
                      alt={displayName}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-white shrink-0"
                      src={userPhoto}
                    />
                    <div className="flex flex-col text-left">
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
                    <span className="material-symbols-outlined text-[16px] text-gray-500">
                      {showProfileMenu ? 'arrow_drop_up' : 'arrow_drop_down'}
                    </span>
                  </button>

                  {/* Profile Dropdown Menu */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-fadeIn">
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
                              isPro ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
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
                  className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-[#111c2d] border border-gray-200 px-3 py-1.5 rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-60 shrink-0"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
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
                  <span>{authLoading ? 'Signing in...' : 'Sign In'}</span>
                </button>
              )}
            </div>

            {/* HAMBURGER MENU ICON (Shown on both Desktop & Mobile to toggle the sidebar drawer) */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 sm:p-2 text-[#111c2d] hover:bg-[#e7eeff] rounded-xl cursor-pointer transition-colors flex items-center justify-center shrink-0 border border-transparent hover:border-blue-100"
              title="Open Navigation Menu"
              type="button"
              aria-label="Toggle Navigation Sidebar"
            >
              <span className="material-symbols-outlined text-[24px] sm:text-[26px]">menu</span>
            </button>
          </div>
        </div>

        {/* MOBILE ONLY: Search Bar Input Expansion (Toggled via search icon) */}
        {mobileSearchOpen && (
          <div ref={mobileSearchRef} className="md:hidden px-3 py-2 bg-[#f0f3ff] border-t border-blue-50 animate-fadeIn relative">
            <div className="w-full flex items-center bg-white rounded-xl px-3 py-1.5 shadow-2xs border border-blue-100">
              <span className="material-symbols-outlined text-[#737686] mr-2 text-[18px]">search</span>
              <input
                className="w-full bg-transparent border-0 outline-none text-xs text-[#111c2d] placeholder:text-[#737686]"
                placeholder="Search notes, formula sheets, NCERT..."
                type="text"
                value={searchQuery}
                onFocus={() => setMobileDropdownOpen(true)}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setMobileDropdownOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleExecuteSearch();
                  }
                }}
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    onSearchChange('');
                    setMobileDropdownOpen(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Mobile Suggestions Dropdown */}
            {mobileDropdownOpen && trimmedSearch && (
              <div className="mt-2 bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden max-h-[380px] overflow-y-auto divide-y divide-slate-100 text-left">
                {/* Topic / Chapter Quick Matches */}
                {matchingTopics.length > 0 && (
                  <div className="p-2.5 bg-slate-50/70">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 block mb-1">
                      Topics &amp; Chapters
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {matchingTopics.map((topicName) => (
                        <button
                          key={topicName}
                          type="button"
                          onClick={() => handleExecuteSearch(topicName)}
                          className="bg-white text-blue-700 border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded-lg"
                        >
                          {topicName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resource Item Suggestions */}
                {matchingResources.length > 0 ? (
                  <div className="py-1">
                    {matchingResources.map((res) => (
                      <div
                        key={res.id}
                        onClick={() => handleSelectResourceItem(res)}
                        className="px-3 py-2 hover:bg-blue-50/60 transition-colors cursor-pointer flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">
                            {res.title}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {res.grade} • {res.topic}
                          </div>
                        </div>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
                            res.tier === 'free'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {res.tier === 'free' ? 'FREE' : 'PRO'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-xs text-slate-500">
                    No results for &quot;{searchQuery}&quot;. Press enter to search catalog.
                  </div>
                )}

                <div className="p-2 bg-slate-50 text-right">
                  <button
                    type="button"
                    onClick={() => handleExecuteSearch()}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 px-2 py-1"
                  >
                    View All Matching Results &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ==============================================================
          SIDEBAR DRAWER (Opened via Hamburger Menu Icon)
          Contains:
          - User Login/Profile state (especially crucial for mobile)
          - AI Teacher Assistant card (especially crucial for mobile)
          - All Main Navigation Links (Notes, Videos, Formula Deck, Masterclasses, Downloads, Olympiad)
          - Class Selector
          - Regional Currency Selector
          - Admin Control Panel Link
          - Social Media Communities
          ============================================================== */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fadeIn">
          {/* Backdrop Overlay */}
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity cursor-pointer"
          />

          {/* Drawer Container */}
          <div className="relative w-full max-w-sm sm:max-w-md bg-white h-full shadow-2xl z-10 flex flex-col overflow-y-auto font-['Plus_Jakarta_Sans',sans-serif]">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-3 bg-gradient-to-r from-blue-50/60 to-indigo-50/60 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  alt={branding?.siteTitle || 'Logo'}
                  className="h-8 sm:h-9 w-auto object-contain drop-shadow-xs"
                  src={
                    branding?.logoUrl ||
                    'https://lh3.googleusercontent.com/aida/AEtjO1UjgWp59CcYsKXuqwB2FYHcehNEDlMGhbND9VEHl154aFff2EPvt39mUwZ6qXVc-edHZxj5IPmP7JbzGPqzLaCgdQX4S4GUMQBtC4KxFgHHUCu_55VykewYAvz0ReMRXT-l8SNrEHvxLcCxtTX0zVGZ6bSEQvSxd3WcuoKgXa3gTPPWl-czWwPLaYldf3jK6W4CDevlmvi08ew8Ag-k6FiBm7lx3ROJP5G9hsY15VySSpP-r5sf3fqLFLs'
                  }
                />
                {hasSiteTitle && (
                  <span className="font-black text-base text-[#004ac6] truncate">
                    {branding?.siteTitle}
                  </span>
                )}
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors cursor-pointer border border-gray-200 shadow-2xs"
                title="Close Sidebar"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-4 sm:p-5 space-y-5 flex-1">
              {/* 1. USER ACCOUNT CARD (Prominent for Mobile & Desktop) */}
              <div className="bg-[#f0f4ff] rounded-2xl p-3.5 border border-blue-100">
                {currentUser ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={userPhoto}
                        alt={displayName}
                        className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-gray-900 truncate">{displayName}</div>
                        <div className="text-[11px] text-gray-500 truncate">{currentUser.email}</div>
                        <span
                          className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.2 rounded-full ${
                            isPro ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isPro ? 'Pro Pass Active ⭐' : 'Free Learner'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200/60">
                      {onOpenDashboard && (
                        <button
                          onClick={() => {
                            setSidebarOpen(false);
                            onOpenDashboard();
                          }}
                          className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white hover:bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-100 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">account_circle</span>
                          <span>Dashboard</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSidebarOpen(false);
                          onSignOut();
                        }}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white hover:bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-100 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">logout</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 space-y-2.5">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-[22px]">account_circle</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">Student Account</div>
                      <div className="text-[11px] text-gray-500">Sign in to sync your notes, tests, and AI history</div>
                    </div>
                    <button
                      onClick={() => {
                        setSidebarOpen(false);
                        onGoogleSignIn();
                      }}
                      disabled={authLoading}
                      className="w-full flex items-center justify-center gap-2 bg-[#004ac6] hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>{authLoading ? 'Signing in...' : 'Sign in with Google'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 2. AI TEACHER ASSISTANT CARD */}
              {onOpenAiTeacher && (
                <div
                  onClick={() => {
                    setSidebarOpen(false);
                    onOpenAiTeacher();
                  }}
                  className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-2xl p-3.5 text-slate-950 shadow-md cursor-pointer hover:shadow-lg transition-transform active:scale-98 flex items-center justify-between gap-3 border border-amber-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-bold shrink-0">
                      <span className="material-symbols-outlined text-[22px]">co_present</span>
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-tight flex items-center gap-1.5">
                        <span>Ask Teacher</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                      </div>
                      <div className="text-[11px] text-slate-900 font-semibold opacity-90">
                        Classroom Board Solver • Ask via text or photo
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </div>
              )}

              {/* 3. PRIMARY NAVIGATION LINKS */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">
                  Main Navigation
                </div>

                <button
                  onClick={() => handleNavClick('explore-notes')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeNav === 'explore-notes'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                    <span>Explore Notes</span>
                  </div>
                  <span className="text-[10px] opacity-75">Classes 5-10</span>
                </button>

                <button
                  onClick={() => handleNavClick('video-lessons')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeNav === 'video-lessons'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px]">smart_display</span>
                    <span>Video Lessons</span>
                  </div>
                  <span className="text-[10px] opacity-75">Animated</span>
                </button>

                <button
                  onClick={() => handleNavClick('formula-deck')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeNav === 'formula-deck'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px]">functions</span>
                    <span>Formula Deck &amp; Sandbox</span>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                    Interactive
                  </span>
                </button>

                <button
                  onClick={() => handleNavClick('paid-masterclasses')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeNav === 'paid-masterclasses'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                    <span>Pro Masterclasses</span>
                  </div>
                  <span className="text-[10px] text-amber-600 font-bold">100/100 Prep</span>
                </button>

                {/* Downloads Drawer Link */}
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    onOpenDownloads();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-emerald-600">download</span>
                    <span>Downloads &amp; Offline Vault</span>
                  </div>
                  {downloadsCount > 0 && (
                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.2 rounded-full">
                      {downloadsCount} items
                    </span>
                  )}
                </button>
              </div>

              {/* 4. CLASS GRADE SELECTOR */}
              <div className="pt-2 border-t border-gray-100">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">
                  Select Class Syllabus
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {['Class 10', 'Class 9', 'Class 8', 'Class 7', 'Class 6', 'Class 5'].map((grade) => (
                    <button
                      key={grade}
                      onClick={() => handleClassSelect(grade)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold text-center transition-colors cursor-pointer ${
                        activeClass === grade
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. REGIONAL CURRENCY & PREFERENCES */}
              <div className="pt-2 border-t border-gray-100">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">
                  Currency Setting
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <span className="material-symbols-outlined text-[18px] text-blue-600">payments</span>
                    <span>Display Currency</span>
                  </div>
                  <select
                    value={userCurrencyState.code}
                    onChange={(e) => {
                      setUserCurrency(e.target.value);
                      setUserCurrencyState(SUPPORTED_CURRENCIES[e.target.value]);
                    }}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-xs text-blue-700 outline-none cursor-pointer"
                  >
                    {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol.trim()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 6. SOCIAL MEDIA COMMUNITIES & SHARE (Especially Crucial for Mobile) */}
              <div className="pt-2 border-t border-gray-100">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2 flex items-center justify-between">
                  <span>Study Communities</span>
                  <span className="text-[10px] text-blue-600 font-extrabold uppercase">Official</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={socialConfig.platforms.youtube.url || 'https://youtube.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded-xl text-xs font-semibold border border-slate-100 transition-colors"
                  >
                    <YouTubeIcon size={18} />
                    <span>YouTube</span>
                  </a>
                  <a
                    href={socialConfig.platforms.whatsapp.groupUrl || socialConfig.platforms.whatsapp.url || 'https://whatsapp.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-xl text-xs font-semibold border border-slate-100 transition-colors"
                  >
                    <WhatsAppIcon size={18} />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={socialConfig.platforms.telegram.groupUrl || socialConfig.platforms.telegram.url || 'https://t.me'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 rounded-xl text-xs font-semibold border border-slate-100 transition-colors"
                  >
                    <TelegramIcon size={18} />
                    <span>Telegram</span>
                  </a>
                  <a
                    href={socialConfig.platforms.instagram.url || 'https://instagram.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-pink-50 text-slate-700 hover:text-pink-700 rounded-xl text-xs font-semibold border border-slate-100 transition-colors"
                  >
                    <InstagramIcon size={18} />
                    <span>Instagram</span>
                  </a>
                </div>

                {onShareWebsite && (
                  <button
                    type="button"
                    onClick={() => {
                      setSidebarOpen(false);
                      onShareWebsite();
                    }}
                    className="mt-2.5 w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">share</span>
                    <span>Share Website (Direct Chrome Link)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-center text-[11px] text-gray-500 shrink-0">
              Maths at Your Fingertips • Classes 5 to 10
            </div>
          </div>
        </div>
      )}
    </>
  );
};
