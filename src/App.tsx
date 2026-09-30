/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  logOut,
  subscribeToUserProfile,
  UserProfile,
  isUserAdmin,
  createDemoStudentSession,
  getLocalDemoSession,
  recordStudentDownload,
  fetchStudentProfileDownloads,
} from './firebase';
import { UnauthorizedDomainModal } from './components/UnauthorizedDomainModal';
import { LoginRequiredModal } from './components/LoginRequiredModal';
import { MATH_RESOURCES, MathResource } from './data/mathResources';
import { Header } from './components/Header';
import { InteractiveFormulaDeckModal } from './components/InteractiveFormulaDeckModal';
import { ResourceModal } from './components/ResourceModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { FlashcardsModal } from './components/FlashcardsModal';
import { ProCheckoutModal } from './components/ProCheckoutModal';
import { DownloadsDrawer, DownloadedItem } from './components/DownloadsDrawer';
import { ShareModal } from './components/ShareModal';
import { OlympiadEnrollModal } from './components/OlympiadEnrollModal';
import { InAppBrowserBanner } from './components/InAppBrowserBanner';
import { YouTubeIcon, FacebookIcon, WhatsAppIcon, TelegramIcon, InstagramIcon } from './components/SocialIcons';
import { downloadResourceToSystem, printResourceInA4 } from './services/fileDownloader';
import { attemptAutoLaunchExternalBrowser } from './services/externalBrowser';
import { AdminControlPanelPage } from './components/AdminControlPanelPage';
import { StudentMobileRegisterModal } from './components/StudentMobileRegisterModal';
import { SocialMediaJoinBlock } from './components/SocialMediaJoinBlock';
import { DownloadCaptchaModal } from './components/DownloadCaptchaModal';
import { SocialFloatingJoinBar } from './components/SocialFloatingJoinBar';
import { FormulaDeckPage } from './components/FormulaDeckPage';
import { FormulaDeckSandbox } from './components/FormulaDeckSandbox';
import { AiTeacherModal } from './components/AiTeacherModal';
import { AskTeacherPage } from './components/AskTeacherPage';
import { ResourceStandalonePage } from './components/ResourceStandalonePage';
import { generateDocumentCoverThumbnail } from './services/thumbnailGenerator';
import {
  HomePageBlock,
  getLocalPageBlocks,
  loadPageBlocksFromFirestore,
  DEFAULT_PAGE_BLOCKS,
} from './services/pageBlocks';
import { getAskTeacherShareUrl } from './services/externalBrowser';
import {
  BrandingConfig,
  getBrandingConfig,
  applyFaviconToDocument,
} from './services/branding';
import {
  CategoryItem,
  getCategories,
} from './services/categories';
import {
  ThemeConfig,
  getThemeConfig,
  applyThemeToDocument,
} from './services/theme';
import {
  SocialConfig,
  getSocialConfig,
  shareToWhatsAppDirectApp,
  shareToTelegramDirectApp,
  openInstagramDirectApp,
  openYouTubeDirectApp,
  openInAppOrWeb,
} from './services/social';
import {
  syncAndLoadAllResources,
} from './services/resources';
import {
  getSeoSettingsLocally,
  applySeoToDocument,
  applyAdminNoIndexToDocument,
} from './services/seo';
import {
  recordResourceDownloadEvent,
  recordPostViewEvent,
  recordPageViewEvent,
} from './services/analytics';
import {
  loadBrandingSettingsFromFirestore,
  loadCategorySettingsFromFirestore,
  loadThemeSettingsFromFirestore,
  loadSocialSettingsFromFirestore,
  loadSeoSettingsFromFirestore,
  loadPageTextSettingsFromFirestore,
} from './firebase';
import {
  PageTextConfig,
  getPageTextConfig,
} from './services/pageText';
import { UserDashboardPage } from './components/UserDashboardPage';
import {
  formatPrice,
  getUserCurrency,
  refineUserCurrencyWithIp,
  CurrencyInfo,
} from './services/currency';
import { AdPlacement } from './components/AdPlacement';
import { loadAdsConfigFromFirestore, saveAdsConfigLocally } from './services/ads';

export default function App() {
  // Page view routing: 'store' for student portal, 'admin' for dedicated Control Panel, 'dashboard' for User Dashboard, 'formula-deck' for dedicated interactive sandbox, 'ask-teacher' for dedicated Ask Teacher solver page, 'resource' for dedicated standalone downloadable content page
  const [currentView, setCurrentView] = useState<'store' | 'admin' | 'dashboard' | 'formula-deck' | 'ask-teacher' | 'resource'>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      const h = window.location.hash.toLowerCase();
      const s = window.location.search.toLowerCase();
      if (p.startsWith('/admin') || h.includes('portal-vault') || h.includes('staff-access') || h.includes('faculty-desk') || h.includes('admin')) {
        return 'admin';
      }
      if (p.startsWith('/resource/') || s.includes('resource=') || h.startsWith('#resource-')) {
        return 'resource';
      }
      if (p.startsWith('/dashboard') || h.includes('dashboard')) {
        return 'dashboard';
      }
      if (p.startsWith('/formula-deck') || h.includes('formula')) {
        return 'formula-deck';
      }
      if (p.startsWith('/ask-teacher') || p.startsWith('/teacher') || h.includes('ask-teacher') || h.includes('teacher') || s.includes('ask-teacher')) {
        return 'ask-teacher';
      }
    }
    return 'store';
  });

  const [standaloneResourceId, setStandaloneResourceId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p.toLowerCase().startsWith('/resource/')) {
        return p.substring('/resource/'.length).split('?')[0].split('#')[0];
      }
      const params = new URLSearchParams(window.location.search);
      const rParam = params.get('resource');
      if (rParam) return rParam;
      const h = window.location.hash;
      if (h.startsWith('#resource-')) return h.substring('#resource-'.length);
    }
    return null;
  });

  // Dynamic Homepage Blocks Ordering state (Study Together • Grow Faster placed after content blocks by default)
  const [pageBlocks, setPageBlocks] = useState<HomePageBlock[]>(getLocalPageBlocks);

  const [currentCurrency, setCurrentCurrency] = useState<CurrencyInfo>(getUserCurrency);

  // Branding state
  const [branding, setBranding] = useState<BrandingConfig>(getBrandingConfig);
  // Dynamic Categories state
  const [categories, setCategories] = useState<CategoryItem[]>(getCategories);
  // Dynamic Theme state
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(getThemeConfig);
  // Dynamic Social Media & Deep Link state
  const [socialConfig, setSocialConfig] = useState<SocialConfig>(getSocialConfig);
  // Dynamic Resources state (combining MATH_RESOURCES + custom uploaded content + tier overrides)
  const [allCatalogResources, setAllCatalogResources] = useState<MathResource[]>(MATH_RESOURCES);
  // Dynamic Page Content & Blocks text state
  const [pageText, setPageText] = useState<PageTextConfig>(getPageTextConfig);

  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Navigation & Class selector states
  const [selectedClass, setSelectedClass] = useState<string>('Class 9');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeNav, setActiveNav] = useState<string>('explore-notes');
  const [catalogSearchOpen, setCatalogSearchOpen] = useState(false);
  const catalogSearchRef = useRef<HTMLDivElement>(null);

  // Close catalog search dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (catalogSearchRef.current && !catalogSearchRef.current.contains(e.target as Node)) {
        setCatalogSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  // Filter states
  const [priceTier, setPriceTier] = useState<'all' | 'free' | 'pro'>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('All Formats');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedStream, setSelectedStream] = useState<string>('All Streams');

  // Bookmarking & Downloads state
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(['res-quad-class10']);
  const [downloads, setDownloads] = useState<DownloadedItem[]>([
    {
      id: 'dl-1',
      title: 'Polynomials & Algebraic Identities Formula Sheet',
      size: '2.4 MB',
      downloadedAt: 'Today',
    },
  ]);

  // Modal visibility states
  const [isFormulaDeckOpen, setIsFormulaDeckOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<MathResource | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
  const [isProPassModalOpen, setIsProPassModalOpen] = useState(false);
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [showMobileRegisterModal, setShowMobileRegisterModal] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [shareModalData, setShareModalData] = useState<{
    isOpen: boolean;
    title: string;
    url?: string;
  }>({
    isOpen: false,
    title: '',
    url: '',
  });

  const openShare = (title: string, customUrl?: string) => {
    setShareModalData({
      isOpen: true,
      title,
      url: customUrl || (typeof window !== 'undefined' ? window.location.href : ''),
    });
  };

  const setShareResourceTitle = (title: string | null) => {
    if (title) {
      openShare(title);
    } else {
      setShareModalData((prev) => ({ ...prev, isOpen: false }));
    }
  };
  const shareResourceTitle = shareModalData.isOpen ? shareModalData.title : null;
  const [enrollModalData, setEnrollModalData] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    isFree: boolean;
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    isFree: true,
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Captcha security verification before download
  const [pendingDownloadItem, setPendingDownloadItem] = useState<{
    title: string;
    size?: string;
    resource?: MathResource;
  } | null>(null);
  const [isCaptchaModalOpen, setIsCaptchaModalOpen] = useState(false);
  const [isLoginRequiredOpen, setIsLoginRequiredOpen] = useState(false);

  // Synchronize student profile downloads from Firestore & Local Storage
  useEffect(() => {
    if (currentUser?.uid) {
      fetchStudentProfileDownloads(currentUser.uid).then((cloudDownloads) => {
        if (cloudDownloads && cloudDownloads.length > 0) {
          setDownloads(cloudDownloads);
        }
      });
    }

    const handleDownloadsSync = () => {
      if (currentUser?.uid) {
        fetchStudentProfileDownloads(currentUser.uid).then((cloudDownloads) => {
          if (cloudDownloads && cloudDownloads.length > 0) {
            setDownloads(cloudDownloads);
          }
        });
      }
    };

    window.addEventListener('student-downloads-changed', handleDownloadsSync);
    window.addEventListener('student-download-recorded', handleDownloadsSync);
    return () => {
      window.removeEventListener('student-downloads-changed', handleDownloadsSync);
      window.removeEventListener('student-download-recorded', handleDownloadsSync);
    };
  }, [currentUser]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // FAQ open/close accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Auth state listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        const unsubscribeProfile = subscribeToUserProfile(user.uid, (profile) => {
          if (profile) {
            setUserProfile(profile);
            if (profile.grade && profile.grade !== selectedClass) {
              setSelectedClass(profile.grade);
            }
            if (profile.bookmarks) {
              setBookmarkedIds(profile.bookmarks);
            }
          }
        });
        return () => unsubscribeProfile();
      } else {
        // If Firebase Auth is null, check if a local demo student session exists
        const localSession = getLocalDemoSession();
        if (localSession) {
          setCurrentUser(localSession);
          const unsubscribeProfile = subscribeToUserProfile(localSession.uid, (profile) => {
            if (profile) {
              setUserProfile(profile);
            } else {
              setUserProfile({
                userId: localSession.uid,
                email: localSession.email,
                displayName: localSession.displayName,
                photoURL: localSession.photoURL,
                grade: selectedClass,
                isPro: true,
                bookmarks: ['res-quad-class10'],
                createdAt: new Date().toISOString(),
              });
            }
          });
          return () => unsubscribeProfile();
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Branding sync & favicon effect
  useEffect(() => {
    // Apply current favicon on launch
    if (branding.faviconUrl) {
      applyFaviconToDocument(branding.faviconUrl);
    }
    // Apply theme on launch
    applyThemeToDocument(themeConfig);

    // Listen for branding changes from Admin modal
    const handleBrandingChange = (event: Event) => {
      const customEvent = event as CustomEvent<BrandingConfig>;
      if (customEvent.detail) {
        setBranding(customEvent.detail);
        if (customEvent.detail.faviconUrl) {
          applyFaviconToDocument(customEvent.detail.faviconUrl);
        }
      }
    };
    window.addEventListener('branding-changed', handleBrandingChange);

    // Listen for category updates
    const handleCategoriesChange = (event: Event) => {
      const customEvent = event as CustomEvent<CategoryItem[]>;
      if (customEvent.detail) {
        setCategories(customEvent.detail);
      }
    };
    window.addEventListener('categories-changed', handleCategoriesChange);

    // Listen for theme updates
    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<ThemeConfig>;
      if (customEvent.detail) {
        setThemeConfig(customEvent.detail);
        applyThemeToDocument(customEvent.detail);
      }
    };
    window.addEventListener('theme-changed', handleThemeChange);

    // Listen for social updates
    const handleSocialChange = (event: Event) => {
      const customEvent = event as CustomEvent<SocialConfig>;
      if (customEvent.detail) {
        setSocialConfig(customEvent.detail);
      }
    };
    window.addEventListener('social-changed', handleSocialChange);

    // Fetch cloud settings from Firestore if present
    loadBrandingSettingsFromFirestore().then((cloudCfg) => {
      if (cloudCfg) {
        setBranding((prev) => {
          const merged = {
            ...prev,
            ...cloudCfg,
            siteTitle: cloudCfg.siteTitle !== undefined ? cloudCfg.siteTitle : '',
            tagline: cloudCfg.tagline !== undefined ? cloudCfg.tagline : '',
          };
          if (merged.faviconUrl) {
            applyFaviconToDocument(merged.faviconUrl);
          }
          return merged;
        });
      }
    });

    loadCategorySettingsFromFirestore().then((cloudCats) => {
      if (cloudCats && Array.isArray(cloudCats) && cloudCats.length > 0) {
        setCategories(cloudCats);
      }
    });

    loadThemeSettingsFromFirestore().then((cloudTheme) => {
      if (cloudTheme) {
        setThemeConfig((prev) => {
          const merged = { ...prev, ...cloudTheme };
          applyThemeToDocument(merged);
          return merged;
        });
      }
    });

    loadSocialSettingsFromFirestore().then((cloudSocial) => {
      if (cloudSocial) {
        setSocialConfig((prev) => ({ ...prev, ...cloudSocial }));
      }
    });

    // SEO settings sync
    const initialSeo = getSeoSettingsLocally();
    applySeoToDocument(initialSeo);
    loadSeoSettingsFromFirestore().then((cloudSeo) => {
      if (cloudSeo) {
        applySeoToDocument(cloudSeo);
      }
    });

    const handleSeoChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        applySeoToDocument(customEvent.detail);
      }
    };
    window.addEventListener('seo-changed', handleSeoChanged);

    // Ads settings sync
    loadAdsConfigFromFirestore().then((cloudAds) => {
      if (cloudAds) {
        saveAdsConfigLocally(cloudAds);
      }
    });

    // Custom Page Text settings sync
    loadPageTextSettingsFromFirestore().then((cloudText) => {
      if (cloudText) {
        setPageText(cloudText);
      }
    });

    const handlePageTextChanged = (e: Event) => {
      const customEvent = e as CustomEvent<PageTextConfig>;
      if (customEvent.detail) {
        setPageText(customEvent.detail);
      }
    };
    window.addEventListener('page-text-changed', handlePageTextChanged);

    // Initial resources sync & listeners
    syncAndLoadAllResources().then(({ allResources }) => {
      if (allResources && allResources.length > 0) {
        setAllCatalogResources(allResources);
      }
    });

    const handleResourcesChanged = () => {
      syncAndLoadAllResources().then(({ allResources }) => {
        if (allResources && allResources.length > 0) {
          setAllCatalogResources(allResources);
        }
      });
    };
    window.addEventListener('resources-changed', handleResourcesChanged);
    window.addEventListener('tier-overrides-changed', handleResourcesChanged);

    // Master Reset Listener
    const handleMasterReset = () => {
      setBranding(getBrandingConfig());
      setCategories(getCategories());
      const defTheme = getThemeConfig();
      setThemeConfig(defTheme);
      applyThemeToDocument(defTheme);
      setSocialConfig(getSocialConfig());
      syncAndLoadAllResources().then(({ allResources }) => {
        if (allResources && allResources.length > 0) {
          setAllCatalogResources(allResources);
        }
      });
      const defSeo = getSeoSettingsLocally();
      applySeoToDocument(defSeo);
      setPageText(getPageTextConfig());
      showToast('🎉 All admin features reset to clean working defaults!');
    };
    window.addEventListener('admin-master-reset', handleMasterReset);

    // Currency detection refinement & listener
    refineUserCurrencyWithIp();
    const handleCurrencyChange = (e: Event) => {
      const customEvent = e as CustomEvent<CurrencyInfo>;
      if (customEvent.detail) {
        setCurrentCurrency(customEvent.detail);
      }
    };
    window.addEventListener('currency-changed', handleCurrencyChange);

    // Auto-launch external browser if coming from an external share link or in-app browser
    attemptAutoLaunchExternalBrowser();

    // Check URL query parameters for direct resource linking (?resource=... or ?format=...)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const targetResId = urlParams.get('resource');
      if (targetResId) {
        setTimeout(() => {
          const found = allCatalogResources.find((r) => r.id === targetResId);
          if (found) {
            if (found.hasVideo) {
              setSelectedResource(found);
              setIsVideoModalOpen(true);
            } else {
              setSelectedResource(found);
            }
          }
        }, 150);
      }
      const targetFormat = urlParams.get('format');
      if (targetFormat && targetFormat.toLowerCase().includes('video')) {
        setSelectedFormat('Video Lessons (YouTube & Facebook)');
      }
    } catch (e) {
      console.warn('URL param parse notice:', e);
    }

    // URL and Hash based page view routing (supports direct /admin or #admin)
    const handleRouteChange = () => {
      const p = window.location.pathname.toLowerCase();
      const h = window.location.hash.toLowerCase();
      const s = window.location.search.toLowerCase();
      if (p.startsWith('/admin') || h.includes('portal-vault') || h.includes('staff-access') || h.includes('faculty-desk') || h.includes('admin')) {
        setCurrentView('admin');
      } else if (p.startsWith('/resource/')) {
        const id = window.location.pathname.substring('/resource/'.length).split('?')[0].split('#')[0];
        setStandaloneResourceId(id);
        setCurrentView('resource');
      } else if (s.includes('resource=')) {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('resource');
        if (id) {
          setStandaloneResourceId(id);
          setCurrentView('resource');
        }
      } else if (h.startsWith('#resource-')) {
        const id = window.location.hash.substring('#resource-'.length);
        setStandaloneResourceId(id);
        setCurrentView('resource');
      } else if (p.startsWith('/dashboard') || h.includes('dashboard')) {
        setCurrentView('dashboard');
      } else if (p.startsWith('/formula-deck') || h.includes('formula')) {
        setCurrentView('formula-deck');
      } else if (p.startsWith('/ask-teacher') || p.startsWith('/teacher') || h.includes('ask-teacher') || h.includes('teacher') || s.includes('ask-teacher')) {
        setCurrentView('ask-teacher');
      } else {
        setCurrentView('store');
      }
    };
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);

    // Sync homepage blocks from Firestore
    loadPageBlocksFromFirestore().then((cloudBlocks) => {
      if (cloudBlocks && cloudBlocks.length > 0) {
        setPageBlocks(cloudBlocks);
      }
    });

    const handleBlocksChanged = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setPageBlocks(e.detail);
      } else {
        setPageBlocks(getLocalPageBlocks());
      }
    };
    window.addEventListener('page-blocks-changed', handleBlocksChanged);

    return () => {
      window.removeEventListener('branding-changed', handleBrandingChange);
      window.removeEventListener('categories-changed', handleCategoriesChange);
      window.removeEventListener('theme-changed', handleThemeChange);
      window.removeEventListener('social-changed', handleSocialChange);
      window.removeEventListener('seo-changed', handleSeoChanged);
      window.removeEventListener('page-text-changed', handlePageTextChanged);
      window.removeEventListener('resources-changed', handleResourcesChanged);
      window.removeEventListener('tier-overrides-changed', handleResourcesChanged);
      window.removeEventListener('admin-master-reset', handleMasterReset);
      window.removeEventListener('currency-changed', handleCurrencyChange);
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('page-blocks-changed', handleBlocksChanged);
    };
  }, []);

  // Strict SEO Isolation & Live Telemetry: Prevent search engine spiders from indexing admin and track real page views
  useEffect(() => {
    if (currentView === 'admin') {
      applyAdminNoIndexToDocument();
      recordPageViewEvent('/admin', 'Admin Control Center');
    } else {
      applySeoToDocument(getSeoSettingsLocally());
      if (currentView === 'dashboard') {
        recordPageViewEvent('/dashboard', 'Student Profile & Downloads');
      } else if (currentView === 'formula-deck') {
        recordPageViewEvent('/formula-deck', 'Pocket Formula Deck & Printable Sheets');
      } else if (currentView === 'ask-teacher') {
        recordPageViewEvent('/ask-teacher', 'Ask Teacher Classroom Board Solver');
        document.title = 'Ask Teacher - Step-by-Step Classroom Board Math Solver | Maths at Your Fingertips';
      } else {
        recordPageViewEvent('/', 'Home / Hero Banner');
      }
    }
  }, [currentView]);

  // AI Teacher Assistant State
  const [isAiTeacherOpen, setIsAiTeacherOpen] = useState(false);
  const [aiTeacherPresetQuery, setAiTeacherPresetQuery] = useState('');

  const handleNavigateToAskTeacher = (query?: string) => {
    if (query) {
      setAiTeacherPresetQuery(query);
    }
    setCurrentView('ask-teacher');
    if (typeof window !== 'undefined') {
      if (window.history && window.history.pushState) {
        window.history.pushState(null, '', '/ask-teacher');
      } else {
        window.location.hash = '#ask-teacher';
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenAiTeacher = (query?: string) => {
    handleNavigateToAskTeacher(query);
  };

  const handleOpenAdminPanel = () => {
    setCurrentView('admin');
    window.location.hash = '#admin';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDashboard = () => {
    setCurrentView('dashboard');
    window.location.hash = '#dashboard';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToFormulaDeck = () => {
    setCurrentView('formula-deck');
    window.location.hash = '#formula-deck';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    setCurrentView('store');
    setStandaloneResourceId(null);
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      if (p.startsWith('/admin') || p.startsWith('/ask-teacher') || p.startsWith('/teacher') || p.startsWith('/formula-deck') || p.startsWith('/dashboard') || p.startsWith('/resource/')) {
        window.history.pushState(null, '', '/');
      }
      window.location.hash = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setAuthLoading(true);
      const user = await signInWithGoogle();
      showToast(`Welcome back, ${user.displayName || 'Learner'}!`);
      // If a download was requested before login, resume it now!
      if (pendingDownloadItem) {
        setIsLoginRequiredOpen(false);
        setIsCaptchaModalOpen(true);
        showToast(`✓ Signed in! Continuing download for "${pendingDownloadItem.title}"...`);
      } else {
        // Open mobile number registration block with Indian country code (+91) default
        setShowMobileRegisterModal(true);
      }
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain') {
        setShowDomainModal(true);
      } else if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        showToast('Google Sign-In cancelled');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleQuickDemoSignIn = (email: string, name: string) => {
    const mockUser = createDemoStudentSession(email, name, selectedClass);
    setCurrentUser(mockUser);
    setUserProfile({
      userId: mockUser.uid,
      email: mockUser.email,
      displayName: mockUser.displayName,
      photoURL: mockUser.photoURL,
      grade: selectedClass,
      isPro: true,
      bookmarks: ['res-quad-class10'],
      createdAt: new Date().toISOString(),
    });
    setShowDomainModal(false);
    setIsLoginRequiredOpen(false);
    showToast(`Signed in as ${mockUser.displayName}! All features active.`);

    // If a download was requested before login, resume it now!
    if (pendingDownloadItem) {
      setIsCaptchaModalOpen(true);
      showToast(`✓ Signed in! Continuing download for "${pendingDownloadItem.title}"...`);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setPendingDownloadItem(null);
      setIsLoginRequiredOpen(false);
      showToast('Signed out successfully');
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  };

  // Dynamic Grade class pills data
  const classList = useMemo(() => {
    const grades = categories.filter((c) => c.type === 'grade' && c.enabled);
    if (grades.length > 0) {
      return grades.map((g) => ({
        name: g.name,
        count: g.count || '12k',
        icon: g.icon || 'school',
        label: g.badge,
        isActiveLabel: `${g.name} (Active)`,
      }));
    }
    return [
      { name: 'Class 5', count: '4.8k', icon: 'toys' },
      { name: 'Class 6', count: '6.1k', icon: 'shapes' },
      { name: 'Class 7', count: '8.4k', icon: 'calculate' },
      { name: 'Class 8', count: '11.2k', icon: 'pie_chart' },
      { name: 'Class 9', count: '18.5k students', icon: 'verified', isActiveLabel: 'Class 9 (Active)' },
      { name: 'Class 10', count: '24k', icon: 'military_tech', label: 'Class 10 Board Prep' },
    ];
  }, [categories]);

  // Dynamic Format List
  const formatList = useMemo(() => {
    const fmts = categories.filter((c) => c.type === 'format' && c.enabled);
    if (fmts.length > 0) {
      return ['All Formats', ...fmts.map((f) => f.name)];
    }
    return [
      'All Formats',
      'Handwritten Notes',
      'Formula Sheets (1-Pager)',
      'Video Lessons',
      'NCERT Exemplar Solutions',
      'Crash Courses',
    ];
  }, [categories]);

  // Dynamic Topic List
  const topicList = useMemo(() => {
    const tops = categories.filter((c) => c.type === 'topic' && c.enabled);
    if (tops.length > 0) {
      return tops.map((t) => t.name);
    }
    return [
      'Real Numbers',
      'Polynomials',
      'Linear Equations',
      'Triangles & Geometry',
      'Trigonometry',
      'Mensuration 2D/3D',
      'Statistics & Probability',
    ];
  }, [categories]);

  // Dynamic Stream / Board List
  const streamList = useMemo(() => {
    const stms = categories.filter((c) => c.type === 'stream' && c.enabled);
    if (stms.length > 0) {
      return ['All Streams', ...stms.map((s) => s.name)];
    }
    return [
      'All Streams',
      'CBSE Curriculum',
      'ICSE & State Boards',
      'Olympiad & IMO Foundation',
    ];
  }, [categories]);

  // Active Grade's Child Subcategories (derived from parent-child category relations)
  const activeGradeChildren = useMemo(() => {
    const parentGrade = categories.find(
      (c) => c.name.toLowerCase().trim() === selectedClass.toLowerCase().trim()
    );
    if (!parentGrade) return [];
    return categories.filter((c) => c.parentId === parentGrade.id && c.enabled);
  }, [categories, selectedClass]);

  // Catalog search suggestions
  const catalogMatchingResources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !allCatalogResources || allCatalogResources.length === 0) return [];
    const terms = q.split(/\s+/).filter(Boolean);
    return allCatalogResources
      .map((r) => {
        const fullHaystack = `${r.title} ${r.topic || ''} ${r.grade || ''} ${r.format || ''} ${(r.tags || []).join(' ')} ${r.description || ''}`.toLowerCase();
        const matchesAll = terms.every((term) => fullHaystack.includes(term));
        if (!matchesAll) return null;
        let score = 0;
        if (r.title.toLowerCase().includes(q)) score += 50;
        terms.forEach((term) => {
          if (r.title.toLowerCase().includes(term)) score += 20;
          if ((r.topic || '').toLowerCase().includes(term)) score += 10;
        });
        return { resource: r, score };
      })
      .filter((item): item is { resource: MathResource; score: number } => item !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item) => item.resource);
  }, [searchQuery, allCatalogResources]);

  const catalogMatchingTopics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !allCatalogResources || allCatalogResources.length === 0) return [];
    const set = new Set<string>();
    const terms = q.split(/\s+/).filter(Boolean);
    allCatalogResources.forEach((r) => {
      const topLower = (r.topic || '').toLowerCase();
      if (topLower.includes(q) || terms.some((t) => topLower.includes(t))) {
        set.add(r.topic);
      }
    });
    return Array.from(set).slice(0, 4);
  }, [searchQuery, allCatalogResources]);

  // Filtered resources calculation (including custom uploaded resources, tier overrides, format, topic & stream)
  const filteredResources = useMemo(() => {
    return allCatalogResources.filter((res) => {
      // Search match - multi-term search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const terms = q.split(/\s+/).filter(Boolean);
        const fullHaystack = `${res.title} ${res.description || ''} ${res.topic || ''} ${res.grade || ''} ${res.format || ''} ${(res.tags || []).join(' ')} ${res.categoryTitle || ''}`.toLowerCase();
        const matchesQuery = terms.every((term) => fullHaystack.includes(term));
        if (!matchesQuery) return false;
      }

      // Grade match (bypassed if searching)
      if (selectedClass !== 'All' && !searchQuery.trim()) {
        if (res.grade !== selectedClass) {
          // If resource is not an exact match, check prefix match (e.g. 'Class 10' matches 'Class 10')
          if (!selectedClass.startsWith(res.grade) && !res.grade.startsWith(selectedClass)) {
            return false;
          }
        }
      }

      // Price tier
      if (priceTier === 'free' && res.tier !== 'free') return false;
      if (priceTier === 'pro' && res.tier !== 'pro') return false;

      // Format filter (flexible match to support custom format naming & video category - bypassed if searching)
      if (selectedFormat && selectedFormat !== 'All Formats' && !searchQuery.trim()) {
        const normFmt = selectedFormat.toLowerCase().trim();
        const resFmt = (res.format || '').toLowerCase().trim();
        if (normFmt.includes('video')) {
          if (!res.hasVideo && !resFmt.includes('video')) return false;
        } else if (
          resFmt !== normFmt &&
          !resFmt.includes(normFmt) &&
          !normFmt.includes(resFmt)
        ) {
          return false;
        }
      }

      // Topic match (filtered live when topic chip or chapter is selected - bypassed if searching)
      if (selectedTopic && selectedTopic !== 'All Topics' && !searchQuery.trim()) {
        const qTopic = selectedTopic.toLowerCase().trim();
        const resTopic = (res.topic || '').toLowerCase().trim();
        const resCat = (res.categoryTitle || '').toLowerCase().trim();
        const resTags = (res.tags || []).map((t) => t.toLowerCase().trim());
        const matchesTopic =
          resTopic === qTopic ||
          resTopic.includes(qTopic) ||
          qTopic.includes(resTopic) ||
          resCat.includes(qTopic) ||
          resTags.some((t) => t.includes(qTopic) || qTopic.includes(t));
        if (!matchesTopic) return false;
      }

      // Stream / Board Curriculum match - bypassed if searching
      if (selectedStream && selectedStream !== 'All Streams' && !searchQuery.trim()) {
        const qStream = selectedStream.toLowerCase().trim();
        const resCat = (res.categoryTitle || '').toLowerCase();
        const resDesc = (res.description || '').toLowerCase();
        const resTags = (res.tags || []).map((t) => t.toLowerCase());
        const isExamSpecific = resTags.some((t) => t.includes('cbse') || t.includes('icse') || t.includes('olympiad'));
        if (isExamSpecific) {
          const matches =
            resCat.includes(qStream) ||
            resDesc.includes(qStream) ||
            resTags.some((t) => qStream.includes(t) || t.includes(qStream));
          if (!matches) return false;
        }
      }

      return true;
    });
  }, [allCatalogResources, searchQuery, selectedClass, priceTier, selectedFormat, selectedTopic, selectedStream]);

  // Gated download with Student Login requirement & Captcha verification
  const handleDownload = (title: string, size?: string, resource?: MathResource) => {
    const targetResource = resource || allCatalogResources.find((r) => r.title === title || r.id === title);
    const itemToDownload = {
      title,
      size: size || targetResource?.sizeOrDuration || '2.1 MB',
      resource: targetResource,
    };
    setPendingDownloadItem(itemToDownload);

    // CRITICAL REQUIREMENT: Before downloading anything from website, login is a must
    if (!currentUser) {
      setIsLoginRequiredOpen(true);
      showToast('⚠️ Please sign in with your student account to download study notes.');
      return;
    }

    setIsCaptchaModalOpen(true);
  };

  const executeVerifiedDownload = () => {
    if (!pendingDownloadItem) return;
    if (!currentUser) {
      setIsLoginRequiredOpen(true);
      showToast('⚠️ Please sign in with your student account to download study notes.');
      return;
    }

    const { title, size, resource } = pendingDownloadItem;
    const targetResource = resource || allCatalogResources.find((r) => r.title === title || r.id === title);

    try {
      downloadResourceToSystem({
        title: targetResource?.title || title,
        grade: targetResource?.grade || selectedClass || 'Class 10',
        topic: targetResource?.topic || 'Mathematics',
        format: targetResource?.format || 'Formula Sheets (1-Pager)',
        downloadUrl: targetResource?.downloadUrl,
        description: targetResource?.description,
        keyFormulas: targetResource?.keyFormulas,
        examTraps: targetResource?.examTraps,
      });
    } catch (e) {
      console.warn('System file download error:', e);
    }

    const downloadId = `dl-${Date.now()}`;
    const newItem: DownloadedItem = {
      id: downloadId,
      title,
      size: size || targetResource?.sizeOrDuration || '2.1 MB',
      downloadedAt: 'Just now',
    };

    // Record student download activity in Firebase Firestore & profile
    recordStudentDownload({
      id: downloadId,
      userId: currentUser.uid,
      userEmail: currentUser.email || 'student@mathsatyourfingertips.com',
      userName: currentUser.displayName || userProfile?.displayName || 'Enrolled Student',
      userPhoto: currentUser.photoURL || userProfile?.photoURL,
      resourceId: targetResource?.id || 'res-custom',
      title: targetResource?.title || title,
      grade: targetResource?.grade || selectedClass || 'Class 10',
      topic: targetResource?.topic || 'Mathematics',
      format: targetResource?.format || 'Formula Sheets (1-Pager)',
      tier: targetResource?.tier === 'pro' ? 'pro' : 'free',
      size: newItem.size,
      downloadUrl: targetResource?.downloadUrl,
      downloadedAt: new Date().toISOString(),
      device: typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
    }).catch((err) => console.warn('Record student download err:', err));

    recordResourceDownloadEvent(title, false);
    setDownloads((prev) => [newItem, ...prev.filter((p) => p.title !== title)]);
    showToast(`✓ Verification passed! Downloading "${title}" (saved to your profile).`);
    setPendingDownloadItem(null);
  };

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (bookmarkedIds.includes(id)) {
      setBookmarkedIds(bookmarkedIds.filter((b) => b !== id));
      showToast('Removed from Bookmarks');
    } else {
      setBookmarkedIds([...bookmarkedIds, id]);
      showToast('Saved to Bookmarks');
    }
  };

  const handleCardClick = (res: MathResource) => {
    recordPostViewEvent(res.id, {
      title: res.title,
      grade: res.grade,
      topic: res.topic,
      format: res.format,
    });
    if (res.hasVideo) {
      setSelectedResource(res);
      setIsVideoModalOpen(true);
    } else if (res.flashcardCount) {
      setIsFlashcardModalOpen(true);
    } else {
      // User requirement: Downloadable content pages must open in a different window and not in a popup window
      window.open(`/resource/${res.id}`, '_blank');
    }
  };

  const isUserPro = userProfile?.isPro || false;

  // Render Admin Control Panel as a separate dedicated page view
  if (currentView === 'admin') {
    return (
      <div className="w-full min-h-screen bg-slate-950 font-['Plus_Jakarta_Sans',sans-serif]">
        <AdminControlPanelPage
          currentUser={currentUser}
          userProfile={userProfile}
          onGoogleSignIn={handleGoogleSignIn}
          onSignOut={handleSignOut}
          onToast={showToast}
          onNavigateHome={handleNavigateHome}
        />
        <UnauthorizedDomainModal
          isOpen={showDomainModal}
          onClose={() => setShowDomainModal(false)}
          onQuickSignIn={handleQuickDemoSignIn}
          onRetryGoogleSignIn={() => {
            setShowDomainModal(false);
            handleGoogleSignIn();
          }}
        />
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#111c2d] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-fadeIn border border-slate-700 max-w-[90vw]">
            <span className="material-symbols-outlined text-[18px] text-emerald-400 shrink-0">check_circle</span>
            <span className="truncate">{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // Render User Dashboard as a separate dedicated page view
  if (currentView === 'dashboard') {
    return (
      <div className="w-full min-h-screen bg-[#f9f9ff] font-['Plus_Jakarta_Sans',sans-serif]">
        <UserDashboardPage
          currentUser={currentUser}
          userProfile={userProfile}
          downloads={downloads}
          allResources={allCatalogResources}
          bookmarkedIds={bookmarkedIds}
          onToggleBookmark={toggleBookmark}
          onDownload={handleDownload}
          onNavigateHome={handleNavigateHome}
          onOpenProPass={() => setIsProPassModalOpen(true)}
          onOpenFormulaDeck={handleNavigateToFormulaDeck}
          onGoogleSignIn={handleGoogleSignIn}
          onSignOut={handleSignOut}
          onToast={showToast}
        />
        <AiTeacherModal
          isOpen={isAiTeacherOpen}
          onClose={() => setIsAiTeacherOpen(false)}
          currentUser={currentUser}
          userProfile={userProfile}
          onGoogleSignIn={handleGoogleSignIn}
          onToast={showToast}
          initialQuery={aiTeacherPresetQuery}
        />
        <UnauthorizedDomainModal
          isOpen={showDomainModal}
          onClose={() => setShowDomainModal(false)}
          onQuickSignIn={handleQuickDemoSignIn}
          onRetryGoogleSignIn={() => {
            setShowDomainModal(false);
            handleGoogleSignIn();
          }}
        />
        <LoginRequiredModal
          isOpen={isLoginRequiredOpen}
          onClose={() => {
            setIsLoginRequiredOpen(false);
            setPendingDownloadItem(null);
          }}
          onGoogleSignIn={handleGoogleSignIn}
          onQuickDemoSignIn={handleQuickDemoSignIn}
          pendingResourceTitle={pendingDownloadItem?.title}
          pendingResourceGrade={pendingDownloadItem?.resource?.grade}
        />
        <DownloadCaptchaModal
          isOpen={isCaptchaModalOpen}
          onClose={() => {
            setIsCaptchaModalOpen(false);
            setPendingDownloadItem(null);
          }}
          onVerified={executeVerifiedDownload}
          itemTitle={pendingDownloadItem?.title || 'Maths Revision Notes'}
          itemSize={pendingDownloadItem?.size || '2.4 MB'}
          resource={pendingDownloadItem?.resource}
        />
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#111c2d] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-fadeIn border border-slate-700 max-w-[90vw]">
            <span className="material-symbols-outlined text-[18px] text-emerald-400 shrink-0">check_circle</span>
            <span className="truncate">{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // Render Formula Deck as a separate dedicated page view with unique URL
  if (currentView === 'formula-deck') {
    return (
      <div className="w-full min-h-screen bg-[#f9f9ff] font-['Plus_Jakarta_Sans',sans-serif]">
        <FormulaDeckPage
          onNavigateHome={handleNavigateHome}
          onOpenAiTeacher={handleOpenAiTeacher}
          onDownloadSheet={handleDownload}
          onToast={showToast}
          branding={branding}
          pageText={pageText}
        />
        <AiTeacherModal
          isOpen={isAiTeacherOpen}
          onClose={() => setIsAiTeacherOpen(false)}
          currentUser={currentUser}
          userProfile={userProfile}
          onGoogleSignIn={handleGoogleSignIn}
          onToast={showToast}
          initialQuery={aiTeacherPresetQuery}
        />
        <UnauthorizedDomainModal
          isOpen={showDomainModal}
          onClose={() => setShowDomainModal(false)}
          onQuickSignIn={handleQuickDemoSignIn}
          onRetryGoogleSignIn={() => {
            setShowDomainModal(false);
            handleGoogleSignIn();
          }}
        />
        <LoginRequiredModal
          isOpen={isLoginRequiredOpen}
          onClose={() => {
            setIsLoginRequiredOpen(false);
            setPendingDownloadItem(null);
          }}
          onGoogleSignIn={handleGoogleSignIn}
          onQuickDemoSignIn={handleQuickDemoSignIn}
          pendingResourceTitle={pendingDownloadItem?.title}
          pendingResourceGrade={pendingDownloadItem?.resource?.grade}
        />
        <DownloadCaptchaModal
          isOpen={isCaptchaModalOpen}
          onClose={() => {
            setIsCaptchaModalOpen(false);
            setPendingDownloadItem(null);
          }}
          onVerified={executeVerifiedDownload}
          itemTitle={pendingDownloadItem?.title || 'Maths Revision Notes'}
          itemSize={pendingDownloadItem?.size || '2.4 MB'}
          resource={pendingDownloadItem?.resource}
        />
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#111c2d] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-fadeIn border border-slate-700 max-w-[90vw]">
            <span className="material-symbols-outlined text-[18px] text-emerald-400 shrink-0">check_circle</span>
            <span className="truncate">{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // Render Ask Teacher as a separate dedicated page view with unique URL (/ask-teacher)
  if (currentView === 'ask-teacher') {
    return (
      <div className="w-full min-h-screen bg-[#f9f9ff] font-['Plus_Jakarta_Sans',sans-serif]">
        <AskTeacherPage
          onNavigateHome={handleNavigateHome}
          currentUser={currentUser}
          userProfile={userProfile}
          onGoogleSignIn={handleGoogleSignIn}
          onQuickDemoSignIn={handleQuickDemoSignIn}
          onToast={showToast}
          branding={branding}
          pageText={pageText}
          initialQuery={aiTeacherPresetQuery}
        />
        <UnauthorizedDomainModal
          isOpen={showDomainModal}
          onClose={() => setShowDomainModal(false)}
          onQuickSignIn={handleQuickDemoSignIn}
          onRetryGoogleSignIn={() => {
            setShowDomainModal(false);
            handleGoogleSignIn();
          }}
        />
        <LoginRequiredModal
          isOpen={isLoginRequiredOpen}
          onClose={() => {
            setIsLoginRequiredOpen(false);
            setPendingDownloadItem(null);
          }}
          onGoogleSignIn={handleGoogleSignIn}
          onQuickDemoSignIn={handleQuickDemoSignIn}
          pendingResourceTitle={pendingDownloadItem?.title}
          pendingResourceGrade={pendingDownloadItem?.resource?.grade}
        />
        <DownloadCaptchaModal
          isOpen={isCaptchaModalOpen}
          onClose={() => {
            setIsCaptchaModalOpen(false);
            setPendingDownloadItem(null);
          }}
          onVerified={executeVerifiedDownload}
          itemTitle={pendingDownloadItem?.title || 'Maths Revision Notes'}
          itemSize={pendingDownloadItem?.size || '2.4 MB'}
          resource={pendingDownloadItem?.resource}
        />
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#111c2d] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-fadeIn border border-slate-700 max-w-[90vw]">
            <span className="material-symbols-outlined text-[18px] text-emerald-400 shrink-0">check_circle</span>
            <span className="truncate">{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // Render Downloadable Content as a dedicated web page with unique URL (/resource/:id) in a new window/page (NOT a popup)
  if (currentView === 'resource' && standaloneResourceId) {
    const currentRes =
      allCatalogResources.find((r) => r.id === standaloneResourceId) ||
      allCatalogResources.find((r) => r.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(standaloneResourceId.toLowerCase())) ||
      allCatalogResources[0];

    return (
      <div className="w-full min-h-screen bg-[#f9f9ff] font-['Plus_Jakarta_Sans',sans-serif]">
        <ResourceStandalonePage
          resource={currentRes}
          onNavigateHome={handleNavigateHome}
          currentUser={currentUser}
          userProfile={userProfile}
          onGoogleSignIn={handleGoogleSignIn}
          onQuickDemoSignIn={handleQuickDemoSignIn}
          onToast={showToast}
          branding={branding}
          allResources={allCatalogResources}
          onRequireLogin={(title, grade) => {
            setPendingDownloadItem({
              title,
              size: currentRes.sizeOrDuration || '2.1 MB',
              resource: currentRes,
            });
            setIsLoginRequiredOpen(true);
          }}
          onRequireCaptcha={(res) => {
            setPendingDownloadItem({
              title: res.title,
              size: res.sizeOrDuration || '2.1 MB',
              resource: res,
            });
            setIsCaptchaModalOpen(true);
          }}
          onOpenResource={(r) => {
            window.open(`/resource/${r.id}`, '_blank');
          }}
        />
        <UnauthorizedDomainModal
          isOpen={showDomainModal}
          onClose={() => setShowDomainModal(false)}
          onQuickSignIn={handleQuickDemoSignIn}
          onRetryGoogleSignIn={() => {
            setShowDomainModal(false);
            handleGoogleSignIn();
          }}
        />
        <LoginRequiredModal
          isOpen={isLoginRequiredOpen}
          onClose={() => {
            setIsLoginRequiredOpen(false);
            setPendingDownloadItem(null);
          }}
          onGoogleSignIn={handleGoogleSignIn}
          onQuickDemoSignIn={handleQuickDemoSignIn}
          pendingResourceTitle={pendingDownloadItem?.title}
          pendingResourceGrade={pendingDownloadItem?.resource?.grade}
        />
        <DownloadCaptchaModal
          isOpen={isCaptchaModalOpen}
          onClose={() => {
            setIsCaptchaModalOpen(false);
            setPendingDownloadItem(null);
          }}
          onVerified={executeVerifiedDownload}
          itemTitle={pendingDownloadItem?.title || currentRes.title}
          itemSize={pendingDownloadItem?.size || currentRes.sizeOrDuration || '2.4 MB'}
          resource={pendingDownloadItem?.resource || currentRes}
        />
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#111c2d] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-fadeIn border border-slate-700 max-w-[90vw]">
            <span className="material-symbols-outlined text-[18px] text-emerald-400 shrink-0">check_circle</span>
            <span className="truncate">{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  const getBlockMeta = (id: string) => {
    const found = pageBlocks.find((b) => b.id === id);
    if (found) return found;
    const def = DEFAULT_PAGE_BLOCKS.find((b) => b.id === id);
    return def || { id, name: id, description: '', enabled: true, order: 99 };
  };

  return (
    <div className="w-full max-w-full bg-[#f9f9ff] font-['Plus_Jakarta_Sans',sans-serif] text-[#111c2d] antialiased min-h-screen flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Social Media In-App Browser Warning & Chrome Intent Launcher */}
      <InAppBrowserBanner />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111c2d] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-fadeIn border border-slate-700 max-w-[90vw]">
          <span className="material-symbols-outlined text-[18px] text-emerald-400 shrink-0">check_circle</span>
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Header with Google Login & Mobile Menu */}
      <Header
        activeClass={selectedClass}
        onSelectClass={setSelectedClass}
        activeNav={activeNav}
        authLoading={authLoading}
        currentUser={currentUser}
        downloadsCount={downloads.length}
        onGoogleSignIn={handleGoogleSignIn}
        onOpenDownloads={() => setIsDownloadsOpen(true)}
        onOpenFormulaDeck={handleNavigateToFormulaDeck}
        onOpenAiTeacher={() => handleNavigateToAskTeacher()}
        onOpenProPass={() => setIsProPassModalOpen(true)}
        onOpenDashboard={handleOpenDashboard}
        onOpenMobileRegister={() => setShowMobileRegisterModal(true)}
        onShareWebsite={() => openShare(branding.siteTitle, window.location.origin)}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q.trim() && currentView !== 'store') {
            setCurrentView('store');
          }
        }}
        onSelectNav={(nav) => {
          setActiveNav(nav);
          if (nav === 'formula-deck') {
            handleNavigateToFormulaDeck();
          } else if (nav === 'ask-teacher' || nav === 'teacher') {
            handleNavigateToAskTeacher();
          } else {
            setCurrentView('store');
          }
        }}
        onSignOut={handleSignOut}
        searchQuery={searchQuery}
        userProfile={userProfile}
        branding={branding}
        socialConfig={socialConfig}
        themeConfig={themeConfig}
        allResources={allCatalogResources}
        onSelectResource={(res) => {
          setCurrentView('store');
          setSelectedResource(res);
          if (res.hasVideo && res.videoUrl) {
            setIsVideoModalOpen(true);
          }
        }}
      />

      <main className="w-full max-w-full pt-24 sm:pt-28 bg-[#f9f9ff] min-h-screen flex-1 flex flex-col">
        {/* Top Advertisement / Olympiad Banner */}
        {pageText.announcement.enabled && (
          <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-2 w-full">
            <div className="w-full bg-[#f0f3ff] rounded-2xl p-3 flex flex-col items-center justify-center border border-dashed border-[#c3c6d7] text-center">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[11px] font-bold tracking-wider uppercase text-[#737686]">
                  {pageText.announcement.badge || 'Advertisement'}
                </span>
                <span className="material-symbols-outlined text-[14px] text-[#737686]">info</span>
              </div>
              <div className="w-full max-w-[728px] min-h-[76px] bg-white rounded-xl flex flex-col sm:flex-row items-center justify-between shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-3 sm:px-5 gap-3 border border-gray-100">
                <div className="flex items-center gap-3 text-left w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-xl bg-[#e7eeff] flex items-center justify-center text-[#004ac6] shrink-0">
                    <span className="material-symbols-outlined text-[22px]">school</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-[13px] font-bold text-[#111c2d] truncate">
                      {pageText.announcement.title || 'National Math Olympiad Preparatory Kit 2025'}
                    </div>
                    <div className="text-[11px] sm:text-[13px] text-[#434655] truncate">
                      {pageText.announcement.subtitle || 'NCERT Aligned • Mock Tests & AI Live Doubts'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setEnrollModalData({
                      isOpen: true,
                      title: pageText.announcement.title || 'National Math Olympiad Kit 2025',
                      subtitle: pageText.announcement.subtitle || 'NCERT Aligned • 3 Mock Tests & AI Doubts',
                      isFree: false,
                    })
                  }
                  className="w-full sm:w-auto text-center shrink-0 text-xs sm:text-[13px] font-bold bg-[#2563eb] text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors cursor-pointer tactile-btn-primary"
                >
                  {pageText.announcement.buttonText || 'Enroll Now'}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Hero Section */}
        <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#dee8ff]/40 via-[#f9f9ff] to-[#f9f9ff] px-3 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-[#dbe1ff]/30 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-1/3 -right-20 w-80 h-80 bg-[#ffddb8]/40 rounded-full blur-3xl pointer-events-none"></div>

          {themeConfig.heroStyle === 'centered' ? (
            /* CENTERED HERO VARIANT */
            <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
              <div className="inline-flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full shadow-sm mb-4 border border-gray-100 max-w-full">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#fea619] text-[#2a1700] text-[11px] font-bold shrink-0">
                  <span className="material-symbols-outlined text-[14px]">bolt</span>
                </span>
                <span className="text-xs sm:text-[13px] font-bold text-[#111c2d] truncate">
                  {pageText.hero.badgeText || branding.heroBadgeText || 'CBSE, ICSE & State Boards • New 2025 Edition'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111c2d] tracking-tight leading-[1.2] max-w-3xl">
                {pageText.hero.headlineMain || 'Ace School Maths'}{' '}
                <span
                  className="underline decoration-wavy decoration-2"
                  style={{ color: themeConfig.primaryColor, textDecorationColor: themeConfig.accentColor || '#fea619' }}
                >
                  {pageText.hero.headlineHighlight || branding.tagline || 'Without the Stress!'}
                </span>{' '}
                📐✨
              </h1>

              <p className="mt-4 text-sm sm:text-base lg:text-lg text-[#434655] max-w-2xl leading-relaxed">
                {pageText.hero.tagline || 'Handcrafted chapter notes, 2-minute formula sheets, NCERT walkthroughs, and animated video lessons tailor-made for Class 5 to 10.'}
              </p>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
                <button
                  onClick={() => {
                    const el = document.getElementById('resource-catalog');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{ backgroundColor: themeConfig.primaryColor }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white text-sm sm:text-[15px] font-bold px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-transform active:translate-y-1 cursor-pointer tactile-btn-primary"
                >
                  <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                  <span>{pageText.hero.ctaPrimaryText || 'Explore Free Notes'}</span>
                </button>

                <button
                  onClick={() => setIsProPassModalOpen(true)}
                  style={{ backgroundColor: themeConfig.accentColor || '#fea619' }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-[#2a1700] text-sm sm:text-[15px] font-bold px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-transform active:translate-y-1 cursor-pointer tactile-btn-secondary"
                >
                  <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
                  <span>{isUserPro ? 'Manage Pro Vault' : (pageText.hero.ctaSecondaryText || 'Unlock Pro Masterclass')}</span>
                  <span className="bg-white text-[#855300] text-[11px] font-bold px-2 py-0.5 rounded-md ml-1 shadow-2xs">
                    {isUserPro ? 'ACTIVE' : 'PRO'}
                  </span>
                </button>
              </div>

              {/* Social Proof */}
              <div className="mt-8 pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 border-t border-blue-50">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-black text-[#111c2d]">{pageText.hero.stat1Value || '50,000+'}</span>
                  <span className="text-xs text-[#434655]">{pageText.hero.stat1Label || 'Active Students'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-black text-[#111c2d]">{pageText.hero.stat3Value || '4.9 / 5'}</span>
                  <span className="text-xs text-[#434655]">{pageText.hero.stat3Label || 'Top Reviews'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-black text-[#111c2d]">{pageText.hero.stat2Value || '100%'}</span>
                  <span className="text-xs text-[#434655]">{pageText.hero.stat2Label || 'Curriculum Aligned'}</span>
                </div>
              </div>
            </div>
          ) : themeConfig.heroStyle === 'compact' ? (
            /* COMPACT HERO VARIANT */
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm mb-3 border border-gray-100 text-xs font-bold text-[#111c2d]">
                  <span>⚡ {pageText.hero.badgeText || branding.heroBadgeText || 'Curated Formula Decks'}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111c2d] tracking-tight">
                  {pageText.hero.headlineMain || branding.siteTitle || 'Maths at Your Fingertips'}
                  {(pageText.hero.tagline || branding.tagline) && (
                    <span className="text-sm font-normal text-slate-500 block">
                      {pageText.hero.tagline || branding.tagline}
                    </span>
                  )}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const el = document.getElementById('resource-catalog');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{ backgroundColor: themeConfig.primaryColor }}
                  className="px-5 py-3 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md cursor-pointer tactile-btn-primary"
                >
                  {pageText.hero.ctaPrimaryText || 'Browse Catalog'}
                </button>
                <button
                  onClick={() => setIsProPassModalOpen(true)}
                  style={{ backgroundColor: themeConfig.accentColor || '#fea619' }}
                  className="px-5 py-3 text-[#2a1700] text-xs sm:text-sm font-bold rounded-xl shadow-md cursor-pointer tactile-btn-secondary"
                >
                  {pageText.hero.ctaSecondaryText || 'Pro Pass'}
                </button>
              </div>
            </div>
          ) : (
            /* SPLIT BENTO HERO (DEFAULT) */
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-10">
              {/* Left Content */}
              <div className="flex-1 text-left w-full">
                <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm mb-4 sm:mb-5 border border-gray-100 max-w-full">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#fea619] text-[#2a1700] text-[11px] font-bold shrink-0">
                    <span className="material-symbols-outlined text-[14px]">bolt</span>
                  </span>
                  <span className="text-xs sm:text-[13px] font-bold text-[#111c2d] truncate">
                    {pageText.hero.badgeText || branding.heroBadgeText || 'CBSE, ICSE & State Boards • New 2025 Edition'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-extrabold text-[#111c2d] tracking-tight leading-[1.2] max-w-2xl">
                  {pageText.hero.headlineMain || branding.siteTitle || 'Ace School Maths'}{' '}
                  <span
                    className="underline decoration-wavy decoration-2"
                    style={{ color: themeConfig.primaryColor, textDecorationColor: themeConfig.accentColor || '#fea619' }}
                  >
                    {pageText.hero.headlineHighlight || branding.tagline || 'Without the Stress!'}
                  </span>{' '}
                  📐✨
                </h1>

                <p className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-[#434655] max-w-xl leading-relaxed">
                  {pageText.hero.tagline || (branding.tagline ? `${branding.tagline} • Handcrafted chapter notes, 2-minute formula sheets, NCERT walkthroughs, and animated video lessons tailor-made for Class 5 to 10.` : 'Handcrafted chapter notes, 2-minute formula sheets, NCERT walkthroughs, and animated video lessons tailor-made for Class 5 to 10.')}
                </p>

                {/* CTA Buttons with tactile bottom borders */}
                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  <button
                    onClick={() => {
                      const el = document.getElementById('resource-catalog');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{ backgroundColor: themeConfig.primaryColor }}
                    className="inline-flex items-center justify-center gap-2 text-white text-sm sm:text-[15px] font-bold px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-transform active:translate-y-1 cursor-pointer tactile-btn-primary"
                  >
                    <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                    <span>{pageText.hero.ctaPrimaryText || 'Explore Free Notes'}</span>
                  </button>

                  <button
                    onClick={() => setIsProPassModalOpen(true)}
                    style={{ backgroundColor: themeConfig.accentColor || '#fea619' }}
                    className="inline-flex items-center justify-center gap-2 text-[#2a1700] text-sm sm:text-[15px] font-bold px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-transform active:translate-y-1 cursor-pointer tactile-btn-secondary"
                  >
                    <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
                    <span>{isUserPro ? 'Manage Pro Vault' : (pageText.hero.ctaSecondaryText || 'Unlock Pro Masterclass')}</span>
                    <span className="bg-white text-[#855300] text-[11px] font-bold px-2 py-0.5 rounded-md ml-1 shadow-2xs">
                      {isUserPro ? 'ACTIVE' : 'PRO'}
                    </span>
                  </button>
                </div>

                {/* Social Proof Stats */}
                <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 flex flex-wrap items-center gap-4 sm:gap-8 lg:gap-10 border-t border-blue-50">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#6ffbbe] text-[#002113] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px] sm:text-[22px]">groups</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg sm:text-[20px] text-[#111c2d] font-extrabold leading-tight">{pageText.hero.stat1Value || '50,000+'}</span>
                      <span className="text-[11px] font-bold text-[#434655]">{pageText.hero.stat1Label || 'Active Students'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#ffddb8] text-[#2a1700] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px] sm:text-[22px]">star</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg sm:text-[20px] text-[#111c2d] font-extrabold leading-tight">{pageText.hero.stat3Value || '4.9 / 5'}</span>
                      <span className="text-[11px] font-bold text-[#434655]">{pageText.hero.stat3Label || 'Top-Rated Reviews'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#dbe1ff] text-[#00174b] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px] sm:text-[22px]">verified</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg sm:text-[20px] text-[#111c2d] font-extrabold leading-tight">{pageText.hero.stat2Value || '100%'}</span>
                      <span className="text-[11px] font-bold text-[#434655]">{pageText.hero.stat2Label || 'Curriculum Aligned'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Bento Box */}
              <div className="w-full lg:w-5/12 max-w-full overflow-hidden">
                <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xl border border-blue-100 max-w-full">
                  <div className="flex items-center justify-between pb-3 gap-2">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="w-3 h-3 rounded-full bg-[#ba1a1a]"></span>
                      <span className="w-3 h-3 rounded-full bg-[#fea619]"></span>
                      <span className="w-3 h-3 rounded-full bg-[#006242]"></span>
                    </div>
                    <button
                      onClick={handleNavigateToFormulaDeck}
                      className="text-[11px] font-bold bg-[#dbe1ff] text-[#00174b] px-2.5 py-0.5 rounded-full hover:bg-blue-200 transition-colors cursor-pointer truncate"
                    >
                      Interactive Formula Deck
                    </button>
                  </div>

                  {/* Illustrated Math Note Card Preview */}
                  <div
                    onClick={handleNavigateToFormulaDeck}
                    className="rounded-xl bg-[#f0f3ff] p-3.5 sm:p-4 relative overflow-hidden cursor-pointer hover:bg-blue-50/80 transition-all border border-blue-50 group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-[#006242] uppercase tracking-wider block">
                          Cheat Sheet #42
                        </span>
                        <h2 className="text-base sm:text-[18px] lg:text-[20px] font-bold text-[#111c2d] group-hover:text-[#004ac6] transition-colors truncate">
                          Pythagorean &amp; Coordinate Tricks
                        </h2>
                      </div>
                      <span className="material-symbols-outlined text-[#004ac6] text-[28px] sm:text-[32px] group-hover:rotate-12 transition-transform shrink-0">
                        square_foot
                      </span>
                    </div>

                    {/* Mathematical Vector doodle preview */}
                    <div className="my-3 sm:my-4 bg-white rounded-lg p-2.5 sm:p-3 flex flex-col sm:flex-row items-center justify-around gap-2 shadow-sm border border-gray-100 max-w-full">
                      <svg
                        className="text-[#004ac6] fill-none stroke-current shrink-0"
                        height="65"
                        strokeWidth="2"
                        viewBox="0 0 120 70"
                        width="110"
                      >
                        <polygon fill="currentColor" fillOpacity="0.08" points="15,60 100,60 100,10"></polygon>
                        <rect height="10" width="10" x="90" y="50"></rect>
                        <text className="text-[10px] font-bold fill-current" stroke="none" x="50" y="68">
                          b = base
                        </text>
                        <text className="text-[10px] font-bold fill-current" stroke="none" x="105" y="38">
                          a
                        </text>
                        <text className="text-[10px] font-extrabold fill-current" stroke="none" x="42" y="30">
                          c = √(a²+b²)
                        </text>
                      </svg>

                      <div className="flex flex-col gap-1 text-center sm:text-right min-w-0">
                        <span className="text-[10px] sm:text-[11px] font-bold text-[#006242] bg-[#6ffbbe] px-2 py-0.5 rounded-full inline-block">
                          10-Sec Mastery
                        </span>
                        <span className="text-xs sm:text-[13px] font-bold text-[#111c2d] truncate">sin²θ + cos²θ = 1</span>
                        <span className="text-[10px] sm:text-[11px] font-mono text-[#737686] truncate">(x - h)² + (y - k)² = r²</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 gap-2">
                      <div className="flex -space-x-2 shrink-0">
                        <img
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-sm object-cover border-2 border-white"
                          alt="Student"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIv__ff-vDbxHMZHcL13vw5OgpJCYUqbpTemp7OEWuIyTnvrzkXE7qJ7hyTLA7q8IK-xkVAuOAhFNvEG9Sp2OxiJ6Y-WxP2vl1zJ1YHSZ5k-lUPXNePfIMssE8epKe_b7QupBtex9Wi5aXoRkV74QFuXP6BPtL17Xse8m0AZsoTxtsqzj8XYyU6Ijbl-BsVpVl-k7JfjHomW-yn5ZiPVFBO_bVpXLpNjMB_L6s4dTXEfjTm6wAdu6S"
                        />
                        <img
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-sm object-cover border-2 border-white"
                          alt="Student"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdTUmiEhNjhptlbQVRXZGV7feJ1hEPNYCQGq44Ev8WisuhYQTI7DfBWVEtN3BckOK-LTWg_v8ReVmtaxoJkNN9-m9HCwAV7wt1A_6ewG190eqU45jcrVmOovCqamoTAmnkpYgeEoi_PEO0DjYUnrVBLNiLQj-W7QHTHTGtHxaaPaex_shqVlWcIh7ANReuXEtiDVSQHd_feUO9RacOYAXRPdXl1JrRkri4zAOZVcbORtzT-H42LKOy"
                        />
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#004ac6] text-white text-[10px] sm:text-[11px] font-bold flex items-center justify-center shadow-sm border-2 border-white">
                          +9k
                        </div>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold text-[#434655] flex items-center gap-1 truncate">
                        <span className="material-symbols-outlined text-[15px] text-[#006242] shrink-0">
                          check_circle
                        </span>
                        Verified by IIT Mentors
                      </span>
                    </div>
                  </div>

                  {/* Micro Floating Notification */}
                  <div
                    onClick={() =>
                      setEnrollModalData({
                        isOpen: true,
                        title: 'Class 9 Half-Yearly Exam Blitz',
                        subtitle: 'Starting in 4 days • Free Question Bank Included',
                        isFree: true,
                      })
                    }
                    className="mt-3 bg-[#ffddb8]/60 rounded-xl p-2.5 flex items-center gap-2.5 cursor-pointer hover:bg-[#ffddb8] transition-colors border border-amber-200"
                  >
                    <span className="material-symbols-outlined text-[#fea619] shrink-0">alarm_on</span>
                    <p className="text-xs sm:text-[13px] text-[#2a1700] leading-snug">
                      Class 9 Half-Yearly Exam Blitz in <strong>4 days</strong>. Grab test series!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Ad Placement: Home Hero Bottom */}
        <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 w-full">
          <AdPlacement location="home_hero_bottom" />
        </section>

        {/* Interactive Grade / Class Quick Switcher Rail */}
        <section className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004ac6] text-[20px]">tune</span>
                <span className="text-xs sm:text-[15px] font-bold text-[#111c2d] uppercase tracking-wider">
                  Select Your Grade / Class:
                </span>
              </div>
              <span className="text-[11px] font-bold text-[#434655] hidden sm:inline-block">
                Curriculum mapped automatically
              </span>
            </div>

            {/* Segmented Class Tab Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar w-full max-w-full" id="classTabs">
              {classList.map((item) => {
                const isSelected = selectedClass === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setSelectedClass(item.name);
                      showToast(`Switched syllabus to ${item.name}`);
                    }}
                    type="button"
                    style={isSelected ? { backgroundColor: themeConfig.primaryColor } : {}}
                    className={`shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full transition-all cursor-pointer ${
                      isSelected
                        ? 'text-white shadow-md tactile-btn-primary font-bold'
                        : 'bg-white text-[#434655] hover:bg-[#e7eeff] hover:text-[#111c2d] shadow-sm border border-gray-100'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[17px] sm:text-[18px] ${
                        isSelected ? 'text-white' : item.name === 'Class 10' ? 'text-[#fea619]' : 'text-[#737686]'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="text-xs sm:text-[15px] font-bold whitespace-nowrap">
                      {isSelected && item.isActiveLabel ? item.isActiveLabel : item.label || item.name}
                    </span>
                    <span
                      className={`text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : item.name === 'Class 10'
                          ? 'bg-[#ffddb8] text-[#2a1700]'
                          : 'bg-[#e7eeff] text-[#737686]'
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Curriculum Board / Stream Switcher Rail (driven by Admin Categories) */}
            <div className="mt-2.5 pt-2.5 border-t border-blue-50 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]" style={{ color: themeConfig.primaryColor }}>domain</span>
                Curriculum Board:
              </span>
              {streamList.map((stream) => {
                const isSelected = selectedStream === stream;
                return (
                  <button
                    key={stream}
                    type="button"
                    onClick={() => {
                      setSelectedStream(stream);
                      showToast(`Curriculum set to: ${stream}`);
                    }}
                    style={isSelected ? { backgroundColor: themeConfig.primaryColor, color: '#ffffff' } : {}}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'text-white shadow-xs font-bold'
                        : 'bg-white text-slate-600 hover:bg-[#e7eeff] border border-gray-100'
                    }`}
                  >
                    {stream}
                  </button>
                );
              })}
            </div>

            {/* Child Subcategories of Selected Parent Class */}
            {activeGradeChildren.length > 0 && (
              <div className="mt-2.5 pt-2.5 border-t border-blue-50 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]" style={{ color: themeConfig.primaryColor }}>subdirectory_arrow_right</span>
                  {selectedClass} Chapters:
                </span>
                {activeGradeChildren.map((child) => {
                  const isMatchingSearch = searchQuery.toLowerCase() === child.name.toLowerCase();
                  return (
                    <button
                      key={child.id}
                      onClick={() => {
                        if (isMatchingSearch) {
                          setSearchQuery('');
                          showToast(`Cleared ${child.name} filter`);
                        } else {
                          setSearchQuery(child.name);
                          showToast(`Filtered by ${child.name}`);
                        }
                      }}
                      style={isMatchingSearch ? { backgroundColor: themeConfig.primaryColor, color: '#ffffff' } : {}}
                      className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        isMatchingSearch
                          ? 'text-white shadow-xs'
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">{child.icon || 'tag'}</span>
                      <span>{child.name}</span>
                      {child.badge && (
                        <span className="text-[9px] bg-white/40 px-1 rounded-full font-bold">
                          {child.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Social Media Community Channels Join Block (Displayed for all learners & visitors) */}
        <SocialMediaJoinBlock
          currentUser={currentUser}
          userProfile={userProfile}
          socialConfig={socialConfig}
          onToast={showToast}
          pageText={pageText}
        />

        {/* Multi-Criteria Filter & Search Console */}
        <section className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 pt-2 pb-2" id="resource-catalog">
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-blue-50 space-y-3 sm:space-y-4 max-w-full overflow-hidden">
            {/* Search & Main Category Chips */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Field with Dropdown Suggestions */}
              <div ref={catalogSearchRef} className="flex-1 relative flex items-center bg-[#f0f3ff] rounded-xl px-3 py-2 border border-blue-50">
                <span className="material-symbols-outlined text-[#737686] mr-2 text-[18px] sm:text-[20px]">search</span>
                <input
                  className="w-full bg-transparent border-0 outline-none text-xs sm:text-[14px] text-[#111c2d] placeholder:text-[#737686]"
                  placeholder={pageText.catalog.searchPlaceholder || "Type a chapter or theorem name (e.g. 'Coordinate Geometry', 'Circles')..."}
                  type="text"
                  value={searchQuery}
                  onFocus={() => setCatalogSearchOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCatalogSearchOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setCatalogSearchOpen(false);
                      const el = document.getElementById('cards-grid');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCatalogSearchOpen(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 mr-2 p-0.5 cursor-pointer"
                    title="Clear search"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setCatalogSearchOpen(false);
                    const el = document.getElementById('cards-grid');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-[#004ac6] hover:text-[#2563eb] text-[11px] font-bold px-2.5 py-1 rounded bg-[#e7eeff] cursor-pointer shrink-0"
                  type="button"
                >
                  Search
                </button>

                {/* Catalog Suggestions Dropdown */}
                {catalogSearchOpen && searchQuery.trim() && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-blue-100 z-50 overflow-hidden max-h-[380px] overflow-y-auto animate-fadeIn divide-y divide-slate-100 text-left">
                    {catalogMatchingTopics.length > 0 && (
                      <div className="p-2.5 bg-slate-50/70">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 block mb-1">
                          Matching Chapters &amp; Topics
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {catalogMatchingTopics.map((topicName) => (
                            <button
                              key={topicName}
                              type="button"
                              onClick={() => {
                                setSearchQuery(topicName);
                                setCatalogSearchOpen(false);
                                document.getElementById('cards-grid')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              {topicName}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {catalogMatchingResources.length > 0 ? (
                      <div className="py-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1 block">
                          Matching Resources ({catalogMatchingResources.length})
                        </span>
                        {catalogMatchingResources.map((res) => (
                          <div
                            key={res.id}
                            onClick={() => {
                              setSelectedResource(res);
                              setCatalogSearchOpen(false);
                            }}
                            className="px-3.5 py-2 hover:bg-blue-50/60 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                                {res.title}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {res.grade} • {res.topic} • {res.format}
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
                        No direct matches. Press &quot;Search&quot; to inspect all filtered resources.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Price Tier Switcher Pill */}
              <div className="flex items-center gap-1 bg-[#f0f3ff] p-1 rounded-xl w-full md:w-auto max-w-full border border-blue-50 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setPriceTier('all')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-[13px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    priceTier === 'all'
                      ? 'bg-white text-[#111c2d] shadow-sm'
                      : 'text-[#434655] hover:text-[#111c2d]'
                  }`}
                  type="button"
                >
                  All Resources
                </button>
                <button
                  onClick={() => setPriceTier('free')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-[13px] font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                    priceTier === 'free'
                      ? 'bg-white text-[#111c2d] shadow-sm'
                      : 'text-[#434655] hover:text-[#111c2d]'
                  }`}
                  type="button"
                >
                  <span>🆓</span> <span>Free Only</span>
                </button>
                <button
                  onClick={() => setPriceTier('pro')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-[13px] font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                    priceTier === 'pro'
                      ? 'bg-white text-[#111c2d] shadow-sm'
                      : 'text-[#434655] hover:text-[#111c2d]'
                  }`}
                  type="button"
                >
                  <span>💎</span> <span>Paid Masterclass</span>
                </button>
              </div>
            </div>

            {/* Content Type Filter Badges */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 whitespace-nowrap no-scrollbar w-full">
              <span className="text-[11px] font-bold text-[#737686] uppercase tracking-wider mr-1 shrink-0">
                Type:
              </span>
              {formatList.map((fmt) => {
                const isSelected = selectedFormat === fmt;
                return (
                  <button
                    key={fmt}
                    onClick={() => setSelectedFormat(fmt)}
                    style={isSelected ? { backgroundColor: themeConfig.primaryColor, color: '#ffffff' } : {}}
                    className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? 'text-white shadow-2xs font-bold'
                        : 'bg-[#f0f3ff] text-[#434655] hover:bg-[#e7eeff]'
                    }`}
                    type="button"
                  >
                    {fmt}
                  </button>
                );
              })}
            </div>

            {/* Domain Topic Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-gray-100">
              <span className="text-[11px] font-bold text-[#737686] uppercase tracking-wider mr-1">
                Topics:
              </span>
              {topicList.map((topic) => {
                const isActive = selectedTopic === topic;
                return (
                  <span
                    key={topic}
                    onClick={() => setSelectedTopic(isActive ? '' : topic)}
                    style={isActive ? { backgroundColor: themeConfig.primaryColor, color: '#ffffff' } : {}}
                    className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-bold cursor-pointer transition-colors ${
                      isActive
                        ? 'text-white shadow-2xs font-bold'
                        : 'bg-[#dee8ff] text-[#434655] hover:bg-[#dbe1ff] hover:text-[#00174b]'
                    }`}
                  >
                    {topic} {isActive ? '✓' : ''}
                  </span>
                );
              })}
            </div>
          </div>
        </section>

        {/* Resource Cards Catalog Grid */}
        <section className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-5 sm:py-6" id="cards-grid">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-[24px] font-bold text-[#111c2d]">{pageText.catalog.title || 'Trending Study Decks & Notes'}</h2>
              <span className="bg-[#6ffbbe] text-[#002113] text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0">
                {pageText.catalog.sectionBadge || 'Term 2 Updated'}
              </span>
            </div>
            <div className="flex flex-col sm:items-end">
              <span className="text-xs sm:text-[14px] text-[#434655]">
                {pageText.catalog.subtitle ? `${pageText.catalog.subtitle} • ` : ''}Showing {filteredResources.length} of 148 verified resources
              </span>
              {pageText.catalog.activeFilterHint && (
                <span className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                  ✓ {pageText.catalog.activeFilterHint}
                </span>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          <div
            className={`w-full gap-5 sm:gap-6 ${
              themeConfig.layoutGrid === '4-col'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                : themeConfig.layoutGrid === '2-col'
                ? 'grid grid-cols-1 lg:grid-cols-2'
                : themeConfig.layoutGrid === 'list'
                ? 'flex flex-col space-y-4'
                : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {filteredResources.map((res, index) => {
              const isBookmarked = bookmarkedIds.includes(res.id);

              return (
                <React.Fragment key={res.id}>
                  <div
                    className={`transition-all duration-200 flex flex-col justify-between group max-w-full overflow-hidden ${
                    themeConfig.borderRadius === 'rounded-3xl'
                      ? 'rounded-3xl'
                      : themeConfig.borderRadius === 'rounded-2xl'
                      ? 'rounded-2xl'
                      : themeConfig.borderRadius === 'rounded-xl'
                      ? 'rounded-xl'
                      : 'rounded-md'
                  } ${
                    themeConfig.cardStyle === 'bordered'
                      ? 'bg-white border-2 border-slate-200 shadow-none hover:border-blue-400 p-4 sm:p-5'
                      : themeConfig.cardStyle === 'glass'
                      ? 'bg-white/80 backdrop-blur-md border border-white/60 shadow-lg hover:shadow-2xl p-4 sm:p-5'
                      : themeConfig.cardStyle === 'vibrant'
                      ? 'bg-white border-l-4 border-l-blue-600 border border-slate-100 shadow-md hover:shadow-xl p-4 sm:p-5'
                      : 'bg-white p-4 sm:p-5 shadow-sm hover:shadow-xl border border-gray-100'
                  }`}
                >
                  <div>
                    {/* Badge Row */}
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full truncate ${
                          res.tier === 'free'
                            ? 'bg-[#6ffbbe] text-[#002113]'
                            : 'bg-[#ffddb8] text-[#2a1700]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px] shrink-0">
                          {res.hasVideo
                            ? 'smart_display'
                            : res.tier === 'free'
                            ? 'lock_open'
                            : 'workspace_premium'}
                        </span>
                        <span className="truncate">{res.badgeLabel}</span>
                      </span>
                      <span
                        className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                          res.isBoardExam
                            ? 'bg-[#ffddb8] text-[#2a1700]'
                            : 'bg-[#e7eeff] text-[#434655]'
                        }`}
                      >
                        {res.grade === 'Class 10' ? 'Class 10 Board' : res.grade}
                      </span>
                    </div>

                    {/* Automatic Preview for Video, Image, or File */}
                    {(() => {
                      const isVideo = Boolean(res.hasVideo || res.youtubeId || res.videoUrl || res.facebookVideoUrl || res.embedHtml);
                      const cleanYt = res.youtubeId ? (res.youtubeId.includes('v=') ? res.youtubeId.split('v=')[1]?.split('&')[0] : res.youtubeId.includes('youtu.be/') ? res.youtubeId.split('youtu.be/')[1]?.split('?')[0] : res.youtubeId) : null;
                      const videoThumb = res.thumbnailUrl || (cleanYt ? `https://img.youtube.com/vi/${cleanYt}/hqdefault.jpg` : null);
                      const isImage = !isVideo && Boolean(res.imageUrl || (res.downloadUrl && /\.(png|jpe?g|webp|svg|gif)($|\?)/i.test(res.downloadUrl)) || (res.downloadUrl && res.downloadUrl.startsWith('data:image/')));
                      const imageSrc = res.imageUrl || (isImage ? res.downloadUrl : null);
                      const hasDocFile = !isVideo && !isImage && Boolean(res.downloadUrl);

                      if (isVideo) {
                        return (
                          <div
                            onClick={() => {
                              setSelectedResource(res);
                              setIsVideoModalOpen(true);
                            }}
                            className="relative rounded-xl overflow-hidden mb-3 aspect-video bg-slate-900 flex items-center justify-center cursor-pointer group/vid shadow-xs"
                          >
                            {videoThumb ? (
                              <img
                                alt={res.title}
                                className="w-full h-full object-cover group-hover/vid:scale-105 transition-transform duration-300"
                                src={videoThumb}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[48px] text-blue-400/40">play_circle</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-slate-950/40 group-hover/vid:bg-slate-950/20 transition-colors flex items-center justify-center">
                              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#fea619] text-[#2a1700] flex items-center justify-center shadow-xl transform group-hover/vid:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[26px] sm:text-[30px] ml-0.5">play_arrow</span>
                              </div>
                            </div>
                            <span className="absolute bottom-2 right-2 bg-slate-950/80 text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded">
                              {res.videoDuration || 'Video Lesson'}
                            </span>
                            <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                              <span>{res.videoPlatform === 'facebook' ? 'Facebook Video' : 'HD Video Lesson'}</span>
                            </span>
                          </div>
                        );
                      }

                      if (isImage && imageSrc) {
                        return (
                          <div
                            onClick={() => handleCardClick(res)}
                            className="relative rounded-xl overflow-hidden mb-3 aspect-video bg-slate-100 flex items-center justify-center cursor-pointer group/img border border-slate-200 shadow-xs"
                          >
                            <img
                              alt={res.title}
                              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                              src={imageSrc}
                            />
                            <div className="absolute inset-0 bg-slate-950/10 group-hover/img:bg-slate-950/20 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                              <div className="px-3 py-1.5 rounded-xl bg-white/95 text-slate-900 font-bold text-xs shadow-lg flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px] text-blue-600">zoom_in</span>
                                <span>Preview Diagram</span>
                              </div>
                            </div>
                            <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                              Visual Formula Sheet
                            </span>
                          </div>
                        );
                      }

                      if (hasDocFile) {
                        return (
                          <div
                            onClick={() => handleCardClick(res)}
                            className="relative rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-100 p-3.5 flex items-center justify-between gap-3 cursor-pointer group/doc hover:border-blue-300 transition-all shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover/doc:scale-105 transition-transform shrink-0">
                                <span className="material-symbols-outlined text-[22px]">description</span>
                              </div>
                              <div className="min-w-0">
                                <div className="text-[11px] font-extrabold text-blue-950 truncate">
                                  Official Learning PDF
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <span>{res.sizeOrDuration || 'Standard Document'}</span>
                                  <span>•</span>
                                  <span className="text-emerald-700 font-bold">A4 Ready</span>
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-blue-700 bg-white px-2 py-1 rounded-lg border border-blue-200 group-hover/doc:bg-blue-600 group-hover/doc:text-white transition-colors shrink-0">
                              View Preview
                            </span>
                          </div>
                        );
                      }

                      return null;
                    })()}

                    {/* Title & Topic Header */}
                    <span
                      className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider block ${
                        res.tier === 'pro' ? 'text-[#855300]' : 'text-[#004ac6]'
                      }`}
                    >
                      {res.categoryTitle}
                    </span>
                    <h3
                      onClick={() => handleCardClick(res)}
                      className="text-lg sm:text-[20px] font-bold text-[#111c2d] mt-1 group-hover:text-[#004ac6] transition-colors cursor-pointer leading-snug"
                    >
                      {res.title}
                    </h3>
                    <p className="text-xs sm:text-[14px] text-[#434655] mt-2 line-clamp-3 leading-relaxed">
                      {res.description}
                    </p>

                    {/* Metadata & Visual Graphic Snippet */}
                    {res.tier === 'pro' && res.price ? (
                      <div className="my-3 sm:my-4 bg-[#ffddb8]/30 rounded-xl p-3 flex items-center justify-between border border-amber-200">
                        <div className="flex flex-col">
                          <span className="text-xl sm:text-[24px] font-extrabold text-[#111c2d]">
                            {formatPrice(res.price, currentCurrency.code)}{' '}
                            {res.originalPrice && (
                              <span className="text-xs sm:text-[14px] text-[#737686] line-through font-normal">
                                {formatPrice(res.originalPrice, currentCurrency.code)}
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-bold text-[#006242] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">security</span>
                            Razorpay Secured
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="bg-white text-[#111c2d] text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded shadow-2xs inline-block">
                            {res.enrolledCount || '5.2k enrolled'}
                          </span>
                          <div className="text-[10px] sm:text-[11px] text-[#737686] mt-0.5">Lifetime Access</div>
                        </div>
                      </div>
                    ) : res.id === 'res-mens-class8' ? (
                      <div className="my-3 sm:my-4 bg-[#f0f3ff] rounded-xl p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[#434655] text-xs">
                          <span className="text-[11px] font-bold">Quick Share with Study Squad:</span>
                          <span className="text-[11px] font-bold text-[#004ac6]">
                            {res.downloadsCount} Downloads
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openShare(res.title, `${window.location.origin}${window.location.pathname}?resource=${res.id}`)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1 rounded bg-[#006242]/10 text-[#006242] text-[10px] sm:text-[11px] font-bold hover:bg-[#006242]/20 cursor-pointer"
                          >
                            <WhatsAppIcon size={14} /> WhatsApp
                          </button>
                          <button
                            onClick={() => openShare(res.title, `${window.location.origin}${window.location.pathname}?resource=${res.id}`)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1 rounded bg-[#004ac6]/10 text-[#004ac6] text-[10px] sm:text-[11px] font-bold hover:bg-[#004ac6]/20 cursor-pointer"
                          >
                            <TelegramIcon size={14} /> Telegram
                          </button>
                          <button
                            onClick={() => {
                              openShare(res.title, `${window.location.origin}${window.location.pathname}?resource=${res.id}`);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-[#855300]/10 text-[#855300] text-[10px] sm:text-[11px] font-bold hover:bg-[#855300]/20 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[13px]">share</span> Share
                          </button>
                        </div>
                      </div>
                    ) : res.id === 'res-frac-flash-class7' ? (
                      <div className="my-3 sm:my-4 bg-[#f0f3ff] rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#006242] text-[24px] sm:text-[26px]">
                            style
                          </span>
                          <div>
                            <span className="text-xs sm:text-[13px] font-bold text-[#111c2d]">36 Color Flashcards</span>
                            <span className="text-[10px] sm:text-[11px] text-[#737686] block">A4 Ready • Easy Cut</span>
                          </div>
                        </div>
                        <div className="flex items-center text-[#fea619]">
                          <span className="material-symbols-outlined text-[16px]">star</span>
                          <span className="text-xs sm:text-[13px] font-bold text-[#111c2d] ml-0.5">4.8</span>
                        </div>
                      </div>
                    ) : res.id === 'res-quad-class10' ? (
                      <div className="my-3 sm:my-4 bg-[#f0f3ff] rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#004ac6] text-[24px] sm:text-[26px]">
                            fact_check
                          </span>
                          <div>
                            <span className="text-xs sm:text-[13px] font-bold text-[#111c2d]">
                              CBSE &amp; ICSE Solved
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-[#737686] block">14 Pages • Free PDF</span>
                          </div>
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-bold text-[#006242] bg-[#6ffbbe]/50 px-2 py-0.5 rounded">
                          Rank Booster
                        </span>
                      </div>
                    ) : (
                      <div className="my-3 sm:my-4 bg-[#f0f3ff] rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#004ac6] text-[24px] sm:text-[28px]">
                            description
                          </span>
                          <div className="flex flex-col">
                            <span className="text-xs sm:text-[13px] font-bold text-[#111c2d]">High-Res PDF</span>
                            <span className="text-[10px] sm:text-[11px] text-[#737686]">{res.sizeOrDuration}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-[#fea619] justify-end">
                            <span className="material-symbols-outlined text-[15px]">star</span>
                            <span className="text-xs sm:text-[13px] font-bold text-[#111c2d] ml-0.5">{res.rating}</span>
                          </div>
                          <span className="text-[10px] sm:text-[11px] text-[#434655]">
                            {res.downloadsCount} downloads
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2">
                    {res.tier === 'pro' && !isUserPro ? (
                      /* PRO ITEM FOR NON-PRO USER */
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedResource(res);
                            if (res.hasVideo) setIsVideoModalOpen(true);
                          }}
                          className="px-3 py-2.5 bg-[#e7eeff] rounded-xl text-[#111c2d] text-xs sm:text-[13px] font-bold hover:bg-[#dee8ff] transition-colors cursor-pointer"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => setIsProPassModalOpen(true)}
                          style={{ backgroundColor: themeConfig.accentColor || '#fea619' }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 sm:gap-2 text-[#2a1700] text-xs sm:text-[13px] font-bold py-2.5 px-3 rounded-xl shadow-sm hover:shadow-md transition-transform active:translate-y-0.5 cursor-pointer tactile-btn-secondary"
                        >
                          <span className="material-symbols-outlined text-[16px] sm:text-[18px]">
                            {res.price ? 'shopping_bag' : 'lock'}
                          </span>
                          <span>{res.price ? `Unlock for ${formatPrice(res.price, currentCurrency.code)}` : 'Unlock Pro Pass'}</span>
                        </button>
                      </div>
                    ) : (
                      /* FREE ITEM OR PRO USER WITH ACCESS */
                      <div className="flex items-center gap-2">
                        {res.flashcardCount ? (
                          <button
                            onClick={() => setIsFlashcardModalOpen(true)}
                            style={{ backgroundColor: themeConfig.primaryColor }}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 sm:gap-2 text-white text-xs sm:text-[13px] font-bold py-2.5 px-3 rounded-xl hover:opacity-90 transition-transform active:translate-y-0.5 cursor-pointer tactile-btn-primary"
                          >
                            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">style</span>
                            <span>Get Free Flashcards ({res.flashcardCount})</span>
                          </button>
                        ) : res.hasVideo ? (
                          <button
                            onClick={() => {
                              setSelectedResource(res);
                              setIsVideoModalOpen(true);
                            }}
                            style={{ backgroundColor: res.videoPlatform === 'facebook' ? '#1877f2' : res.videoPlatform === 'youtube' ? '#dc2626' : themeConfig.primaryColor }}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 sm:gap-2 text-white text-xs sm:text-[13px] font-bold py-2.5 px-3 rounded-xl hover:opacity-90 transition-transform active:translate-y-0.5 cursor-pointer tactile-btn-primary shadow-xs"
                          >
                            {res.videoPlatform === 'facebook' ? (
                              <FacebookIcon size={16} />
                            ) : res.videoPlatform === 'youtube' ? (
                              <YouTubeIcon size={16} />
                            ) : (
                              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">smart_display</span>
                            )}
                            <span>{res.videoPlatform === 'facebook' ? 'Play Facebook Video' : res.videoPlatform === 'youtube' ? 'Play YouTube HD' : 'Watch Video Lesson'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDownload(res.title, res.sizeOrDuration, res)}
                            style={{ backgroundColor: themeConfig.primaryColor }}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 sm:gap-2 text-white text-xs sm:text-[13px] font-bold py-2.5 px-3 rounded-xl hover:opacity-90 transition-transform active:translate-y-0.5 cursor-pointer tactile-btn-primary"
                          >
                            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">file_download</span>
                            <span>{isUserPro && res.tier === 'pro' ? 'Download Pro Kit' : 'Download PDF'}</span>
                          </button>
                        )}

                        <button
                          onClick={(e) => toggleBookmark(res.id, e)}
                          className={`p-2 sm:p-2.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                            isBookmarked
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-[#e7eeff] text-[#434655] hover:text-[#004ac6]'
                          }`}
                          title="Bookmark"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                            {isBookmarked ? 'bookmark' : 'bookmark_border'}
                          </span>
                        </button>

                        <button
                          onClick={() => openShare(res.title, `${window.location.origin}${window.location.pathname}?resource=${res.id}#catalog`)}
                          className="p-2 sm:p-2.5 bg-[#e7eeff] rounded-xl text-[#434655] hover:text-[#004ac6] hover:bg-[#dbe1ff] transition-colors cursor-pointer shrink-0"
                          title="Share externally via Chrome direct link"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px] sm:text-[20px]">share</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {/* Native In-Feed Ad Insertion */}
                  {index === 3 && (
                    <div className="col-span-full my-2">
                      <AdPlacement location="catalog_infeed" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Catalog Bottom Leaderboard Ad */}
          <div className="mt-8">
            <AdPlacement location="catalog_bottom" />
          </div>
        </section>

        {/* AI TEACHER SPOTLIGHT BANNER */}
        <section className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 mt-10 sm:mt-14">
          <div className="bg-gradient-to-r from-[#002a78] via-[#004ac6] to-[#1e58d8] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-blue-400/30">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-extrabold uppercase tracking-wider mb-3">
                <span className="material-symbols-outlined text-[16px]">psychology</span>
                <span>{pageText.aiTeacher.badge || 'AI Teacher Assistant • Step-by-Step Solver'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
                {pageText.aiTeacher.title || 'Stuck on a Tricky Math Problem?'}
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 mt-2 leading-relaxed">
                {pageText.aiTeacher.description || 'Meet Prof. Raman, your 24/7 personal math faculty! Simply type your question or upload a photo from your textbook. Receive clear, pedagogical step-by-step working, applied formulas, and exam cautions.'}
              </p>
              <div className="flex items-center gap-3 mt-4 text-xs font-semibold text-blue-200 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
                  <span>{pageText.aiTeacher.feature1 || 'Text or Photo Input'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
                  <span>{pageText.aiTeacher.feature2 || 'Step-by-Step Proofs'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
                  <span>{pageText.aiTeacher.feature3 || 'Class 5 - 10 & Olympiad'}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => handleNavigateToAskTeacher()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold text-sm px-6 py-3.5 rounded-2xl shadow-lg transition-all cursor-pointer transform hover:scale-102"
                title="Open Dedicated Ask Teacher Page (/ask-teacher)"
              >
                <span className="material-symbols-outlined text-[20px]">co_present</span>
                <span>{pageText.aiTeacher.buttonText || 'Ask Teacher (Dedicated Page)'}</span>
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              </button>

              <button
                onClick={() => {
                  const url = getAskTeacherShareUrl(window.location.origin);
                  navigator.clipboard?.writeText(url);
                  showToast('Direct Ask Teacher link copied (opens in Chrome/external browser)!');
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm px-4 py-3.5 rounded-2xl border border-white/25 transition-all cursor-pointer"
                title="Copy shareable link for social media (forces Chrome/external browser)"
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
                <span>Share Link</span>
              </button>
            </div>
          </div>
        </section>

        {/* INTERACTIVE FORMULA DECK ON HOME PAGE */}
        <section id="formula-deck" className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 mt-12 sm:mt-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#004ac6] text-xs font-extrabold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-[16px]">functions</span>
                <span>{pageText.formulaDeck.badge || 'Maths at Your Fingertips Sandbox'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#111c2d] tracking-tight">
                {pageText.formulaDeck.title || 'Interactive Formula Deck & Mathematical Transitions'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                {pageText.formulaDeck.description || 'Experience mathematical concepts in action. Adjust parameters in real-time, inspect dynamic proofs, and watch algebra and geometry morph seamlessly.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleNavigateToFormulaDeck}
                className="inline-flex items-center gap-1.5 bg-[#004ac6] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                title="Open Dedicated Formula Deck Page"
              >
                <span>{pageText.formulaDeck.buttonText || 'Launch Fullscreen Deck (/#formula-deck)'}</span>
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              </button>
            </div>
          </div>

          <FormulaDeckSandbox
            onAskAiAboutFormula={(name) => handleOpenAiTeacher(`Can you teach me the full derivation, proof, and typical board exam questions for ${name}?`)}
            onDownloadSheet={handleDownload}
            isStandalonePage={false}
          />
        </section>

        {/* Google AdSense Native Placement / Mid-Page Sponsored / Camp Banner */}
        {pageText.midBanner.enabled && (
        <section className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 my-5 sm:my-6">
          <div className="w-full bg-[#f0f3ff] rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#737686]">
                {pageText.midBanner.badge || 'Sponsored Content'}
              </span>
              <span className="material-symbols-outlined text-[14px] text-[#737686]">info</span>
            </div>
            <div className="w-full max-w-[728px] min-h-[76px] bg-white rounded-xl flex flex-col sm:flex-row items-center justify-between p-3 gap-3 shadow-inner border border-gray-100">
              <div className="flex items-center gap-3 text-left w-full sm:w-auto">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#6ffbbe] text-[#002113] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px] sm:text-[26px]">psychology</span>
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-[13px] font-bold text-[#111c2d] truncate">
                    {pageText.midBanner.title || 'Mental Math Master: Speed Multiplication Camp'}
                  </div>
                  <div className="text-[11px] sm:text-[13px] text-[#434655] truncate">
                    {pageText.midBanner.subtitle || 'Live weekend sessions for ages 10-15 • Learn Vedic Math tricks'}
                  </div>
                </div>
              </div>
              <button
                onClick={() =>
                  setEnrollModalData({
                    isOpen: true,
                    title: pageText.midBanner.title || 'Speed Multiplication & Vedic Math Camp',
                    subtitle: pageText.midBanner.subtitle || 'Live weekend masterclass for ages 10-15',
                    isFree: true,
                  })
                }
                className="w-full sm:w-auto text-center shrink-0 bg-[#2563eb] text-white text-xs sm:text-[13px] font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
              >
                {pageText.midBanner.buttonText || 'Claim Free Seat →'}
              </button>
            </div>
          </div>
        </section>
        )}

        {/* Formula Cheat-Sheet Teaser & Pro Masterclass Highlight */}
        <section className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-8" id="paid-masterclasses">
          <div className="bg-gradient-to-r from-[#004ac6] to-[#2563eb] rounded-3xl p-5 sm:p-8 lg:p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-[#0053db] opacity-20 rounded-full blur-2xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
              <div className="max-w-2xl w-full">
                <div className="inline-flex items-center gap-1.5 bg-[#fea619] text-[#2a1700] text-[10px] sm:text-[11px] font-bold px-3 py-1 rounded-full mb-3 sm:mb-4">
                  <span className="material-symbols-outlined text-[14px]">stars</span> {pageText.proMasterclass.badge || 'THE ULTIMATE CLASS 9 & 10 MATHS VAULT'}
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-[40px] font-extrabold leading-tight">
                  {pageText.proMasterclass.headline || 'Stop Memorizing Formulas. Understand Them Visually.'}
                </h2>
                <p className="mt-2.5 sm:mt-3 text-sm sm:text-base lg:text-lg text-[#eeefff] max-w-xl leading-relaxed">
                  {pageText.proMasterclass.subtitle || 'Get unlimited access to all 48 chapter cheatsheets, video derivation library, and instant live doubt support before your board exams.'}
                </p>

                <div className="mt-5 sm:mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="material-symbols-outlined text-[#ffddb8] text-[18px] sm:text-[20px]">
                      check_circle
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold">{pageText.proMasterclass.perk1 || 'Printable Pocket Flashcards'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="material-symbols-outlined text-[#ffddb8] text-[18px] sm:text-[20px]">
                      check_circle
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold">{pageText.proMasterclass.perk2 || 'NCERT Exemplar Video Solutions'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="material-symbols-outlined text-[#ffddb8] text-[18px] sm:text-[20px]">
                      check_circle
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold">{pageText.proMasterclass.perk3 || 'WhatsApp Mentor Hotline'}</span>
                  </div>
                </div>
              </div>

              {/* Pricing Card */}
              <div className="shrink-0 bg-white text-[#111c2d] rounded-2xl p-5 sm:p-6 shadow-xl max-w-full sm:max-w-xs w-full text-center border border-blue-50">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#855300]">
                  {pageText.proMasterclass.dealTag || 'Limited Time Semester Deal'}
                </span>
                <div className="my-1.5 sm:my-2">
                  <span className="text-3xl sm:text-[40px] font-extrabold text-[#004ac6]">{formatPrice(499, currentCurrency.code)}</span>
                  <span className="text-xs sm:text-[14px] text-[#737686]"> / Year</span>
                </div>
                <p className="text-xs sm:text-[14px] text-[#434655] mb-3 sm:mb-4">
                  {pageText.proMasterclass.dealDescription || 'Covers complete syllabus for your selected grade with monthly updates.'}
                </p>
                <button
                  onClick={() => setIsProPassModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#fea619] text-[#2a1700] text-sm sm:text-[15px] font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-transform active:translate-y-1 cursor-pointer tactile-btn-secondary"
                >
                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                    shopping_cart_checkout
                  </span>
                  <span>{isUserPro ? 'Manage Active Pass' : (pageText.proMasterclass.buttonText || 'Get All-Access Pass')}</span>
                </button>
                <span className="text-[10px] sm:text-[11px] font-bold text-[#737686] block mt-2.5">
                  {pageText.proMasterclass.guaranteeText || 'Cancel anytime • 7-day money-back guarantee'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Social Media Study Community Section */}
        <section className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 bg-[#dee8ff] px-3 py-1 rounded-full text-[#004ac6] text-[11px] font-bold uppercase tracking-wider mb-2">
              <span>{pageText.socialCommunity.badge || 'Study Together • Grow Faster'}</span>
            </div>
            <h2 className="text-2xl sm:text-[28px] lg:text-[32px] font-bold text-[#111c2d]">
              {pageText.socialCommunity.title || 'Join 150k+ Maths Champions on Our Channels'}
            </h2>
            <p className="text-xs sm:text-base text-[#434655] mt-1.5 sm:mt-2">
              {pageText.socialCommunity.subtitle || 'Daily morning formulas, 60-second theorem reels, previous year question polls, and round-the-clock homework peer support.'}
            </p>
          </div>

          {/* 4 Community Platform Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full">
            {/* YouTube */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-gray-100">
              <div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#ba1a1a]/10 text-[#ba1a1a] flex items-center justify-center mb-3 sm:mb-4">
                  <span className="material-symbols-outlined text-[24px] sm:text-[28px]">smart_display</span>
                </div>
                <span className="text-[11px] font-bold text-[#ba1a1a]">120k Subscribers</span>
                <h3 className="text-lg sm:text-[20px] font-bold text-[#111c2d] mt-1">YouTube Channel</h3>
                <p className="text-xs sm:text-[14px] text-[#434655] mt-1.5 leading-relaxed">
                  Full-length chapter marathons, animated 3D proofs, and LIVE doubt sessions every Sunday.
                </p>
              </div>
              <a
                className="mt-4 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#e7eeff] text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white text-xs sm:text-[13px] font-bold transition-colors"
                href={socialConfig.platforms.youtube.url || "https://youtube.com"}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span>Watch Free Lectures</span>
                <span className="material-symbols-outlined text-[15px]">open_in_new</span>
              </a>
            </div>

            {/* Telegram */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-gray-100">
              <div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#004ac6]/10 text-[#004ac6] flex items-center justify-center mb-3 sm:mb-4">
                  <span className="material-symbols-outlined text-[24px] sm:text-[28px]">send</span>
                </div>
                <span className="text-[11px] font-bold text-[#004ac6]">25k Members</span>
                <h3 className="text-lg sm:text-[20px] font-bold text-[#111c2d] mt-1">Telegram Daily Quiz</h3>
                <p className="text-xs sm:text-[14px] text-[#434655] mt-1.5 leading-relaxed">
                  Daily 5-question math polls at 7 PM. Download notes and NCERT solutions without ads.
                </p>
              </div>
              <a
                className="mt-4 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#e7eeff] text-[#004ac6] hover:bg-[#2563eb] hover:text-white transition-colors text-xs sm:text-[13px] font-bold"
                href={socialConfig.platforms.telegram.groupUrl || socialConfig.platforms.telegram.url || "https://t.me"}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span>Join Telegram Channel</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </a>
            </div>

            {/* Instagram */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-gray-100">
              <div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#fea619]/20 text-[#fea619] flex items-center justify-center mb-3 sm:mb-4">
                  <span className="material-symbols-outlined text-[24px] sm:text-[28px]">motion_photos_on</span>
                </div>
                <span className="text-[11px] font-bold text-[#855300]">45k Followers</span>
                <h3 className="text-lg sm:text-[20px] font-bold text-[#111c2d] mt-1">Instagram Reels</h3>
                <p className="text-xs sm:text-[14px] text-[#434655] mt-1.5 leading-relaxed">
                  60-second math hacks, exam day memory tips, and hilarious student relatable study memes.
                </p>
              </div>
              <a
                className="mt-4 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#e7eeff] text-[#111c2d] hover:bg-[#ffddb8] hover:text-[#2a1700] transition-colors text-xs sm:text-[13px] font-bold"
                href={socialConfig.platforms.instagram.url || "https://instagram.com"}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span>Follow {socialConfig.platforms.instagram.handleOrNumber || "@MathsAtFingertips"}</span>
                <span className="material-symbols-outlined text-[15px]">open_in_new</span>
              </a>
            </div>

            {/* WhatsApp Doubt Group */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-gray-100">
              <div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#6ffbbe] text-[#002113] flex items-center justify-center mb-3 sm:mb-4">
                  <span className="material-symbols-outlined text-[24px] sm:text-[28px]">forum</span>
                </div>
                <span className="text-[11px] font-bold text-[#006242]">12 Active Batches</span>
                <h3 className="text-lg sm:text-[20px] font-bold text-[#111c2d] mt-1">WhatsApp Doubt Desk</h3>
                <p className="text-xs sm:text-[14px] text-[#434655] mt-1.5 leading-relaxed">
                  Stuck on a homework sum? Snap a picture and receive peer solutions verified by top mentors.
                </p>
              </div>
              <a
                className="mt-4 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#6ffbbe] text-[#002113] hover:bg-[#4edea3] transition-colors text-xs sm:text-[13px] font-bold"
                href={socialConfig.platforms.whatsapp.groupUrl || socialConfig.platforms.whatsapp.url || "https://whatsapp.com"}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span>Join WhatsApp Group</span>
                <span className="material-symbols-outlined text-[15px]">group_add</span>
              </a>
            </div>
          </div>
        </section>

        {/* Interactive Quick FAQ Accordion */}
        <section className="max-w-4xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-8 mb-4">
          <div className="text-center mb-5 sm:mb-6">
            <h2 className="text-xl sm:text-[24px] font-bold text-[#111c2d]">
              {pageText.faq.title || 'Frequently Asked Questions by Students & Parents'}
            </h2>
            <p className="text-xs sm:text-[14px] text-[#434655] mt-1">
              {pageText.faq.subtitle || 'Everything you need to know about downloading and using our curriculum guides'}
            </p>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {pageText.faq.items && pageText.faq.items.map((faqItem, idx) => (
              <div key={faqItem.id || idx} className="bg-white rounded-xl p-3.5 sm:p-4 shadow-sm border border-gray-100">
                <button
                  className="w-full flex items-center justify-between text-left cursor-pointer gap-2"
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  type="button"
                >
                  <span className="text-xs sm:text-[15px] font-bold text-[#111c2d]">
                    {faqItem.question}
                  </span>
                  <span className="material-symbols-outlined text-[#737686] transition-transform duration-200 shrink-0">
                    {openFaqIndex === idx ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {openFaqIndex === idx && (
                  <p className="mt-2 text-xs sm:text-[14px] text-[#434655] leading-relaxed animate-fadeIn">
                    {faqItem.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Above Footer Universal Ad Placement */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full my-4">
        <AdPlacement location="footer_top" />
      </div>

      {/* Footer */}
      <footer className="w-full max-w-full bg-[#f0f3ff] pt-10 sm:pt-12 pb-8 border-t border-blue-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 sm:gap-8 pb-8 sm:pb-10">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-2 sm:mb-3">
                <img
                  src={
                    branding.logoUrl ||
                    branding.iconUrl ||
                    'https://lh3.googleusercontent.com/aida/AEtjO1UjgWp59CcYsKXuqwB2FYHcehNEDlMGhbND9VEHl154aFff2EPvt39mUwZ6qXVc-edHZxj5IPmP7JbzGPqzLaCgdQX4S4GUMQBtC4KxFgHHUCu_55VykewYAvz0ReMRXT-l8SNrEHvxLcCxtTX0zVGZ6bSEQvSxd3WcuoKgXa3gTPPWl-czWwPLaYldf3jK6W4CDevlmvi08ew8Ag-k6FiBm7lx3ROJP5G9hsY15VySSpP-r5sf3fqLFLs'
                  }
                  alt={branding.siteTitle || 'Logo'}
                  className="h-9 sm:h-11 w-auto object-contain drop-shadow-xs"
                />
                {branding.siteTitle && (
                  <span className="text-xl sm:text-[22px] font-black text-[#004ac6]">
                    {branding.siteTitle}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-[14px] text-[#434655] mb-4 pr-2 sm:pr-4 leading-relaxed">
                {pageText.footer.aboutText || 'Demystifying school mathematics for Class 5 to Class 10. Step-by-step NCERT solutions, animated concept summaries, and rapid revision sheets created by expert educators.'}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {socialConfig.platforms.whatsapp.enabled && (
                  <a
                    href={socialConfig.platforms.whatsapp.groupUrl || socialConfig.platforms.whatsapp.url || 'https://chat.whatsapp.com/FMathsFingertipsOfficial'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 px-2.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
                    title="Join WhatsApp Community"
                  >
                    <WhatsAppIcon size={16} />
                    <span>WhatsApp</span>
                  </a>
                )}
                {socialConfig.platforms.telegram.enabled && (
                  <a
                    href={socialConfig.platforms.telegram.groupUrl || socialConfig.platforms.telegram.url || 'https://t.me/MathsAtYourFingertips'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 px-2.5 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
                    title="Join Telegram Channel"
                  >
                    <TelegramIcon size={16} />
                    <span>Telegram</span>
                  </a>
                )}
                {socialConfig.platforms.youtube.enabled && (
                  <a
                    href={socialConfig.platforms.youtube.url || 'https://youtube.com/@MathsAtYourFingertips'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 px-2.5 rounded-full bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
                    title="Subscribe to YouTube Channel"
                  >
                    <YouTubeIcon size={16} />
                    <span>YouTube</span>
                  </a>
                )}
                {socialConfig.platforms.instagram.enabled && (
                  <a
                    href={socialConfig.platforms.instagram.url || 'https://instagram.com/maths_fingertips'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 px-2.5 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-800 border border-pink-200 flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
                    title="Follow Instagram Page"
                  >
                    <InstagramIcon size={16} />
                    <span>Instagram</span>
                  </a>
                )}
                <a
                  className="w-8 h-8 rounded-full bg-[#e7eeff] hover:bg-blue-100 flex items-center justify-center text-[#434655] hover:text-[#004ac6] transition-colors"
                  href={`tel:${socialConfig.platforms.whatsapp.handleOrNumber || '+91800123456'}`}
                  title="Direct Phone Line"
                >
                  <span className="material-symbols-outlined text-[17px]">call</span>
                </a>
                <a
                  className="w-8 h-8 rounded-full bg-[#e7eeff] hover:bg-blue-100 flex items-center justify-center text-[#434655] hover:text-[#004ac6] transition-colors"
                  href="mailto:help@mathsatyourfingertips.com"
                  title="Email Helpdesk"
                >
                  <span className="material-symbols-outlined text-[17px]">mail</span>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-xs sm:text-[15px] font-bold text-[#111c2d] mb-2 sm:mb-3">Select Class</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-[14px] text-[#434655]">
                {classList.map((item) => (
                  <li key={item.name}>
                    <button
                      onClick={() => {
                        setSelectedClass(item.name);
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }}
                      className="hover:text-[#004ac6] text-left cursor-pointer transition-colors"
                    >
                      {item.name} Maths
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs sm:text-[15px] font-bold text-[#111c2d] mb-2 sm:mb-3">Core Domains</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-[14px] text-[#434655]">
                {topicList.slice(0, 6).map((top) => (
                  <li key={top}>
                    <button
                      onClick={() => {
                        setSelectedTopic(top);
                        window.scrollTo({ top: 480, behavior: 'smooth' });
                      }}
                      className="hover:text-[#004ac6] text-left cursor-pointer transition-colors"
                    >
                      {top}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs sm:text-[15px] font-bold text-[#111c2d] mb-2 sm:mb-3">Curriculum Streams</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-[14px] text-[#434655]">
                {streamList.map((st) => (
                  <li key={st}>
                    <button
                      onClick={() => {
                        setSelectedStream(st);
                        const el = document.getElementById('cards-grid');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="hover:text-[#004ac6] text-left cursor-pointer transition-colors"
                    >
                      {st}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs sm:text-[15px] font-bold text-[#111c2d] mb-2 sm:mb-3">Resource Formats</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-[14px] text-[#434655]">
                {formatList.slice(0, 5).map((fmt) => (
                  <li key={fmt}>
                    <button
                      onClick={() => {
                        setSelectedFormat(fmt);
                        const el = document.getElementById('cards-grid');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="hover:text-[#004ac6] text-left cursor-pointer transition-colors"
                    >
                      {fmt}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    onClick={() => setIsFormulaDeckOpen(true)}
                    className="hover:text-[#004ac6] text-left cursor-pointer transition-colors text-blue-600 font-semibold"
                  >
                    Pocket Formula Deck →
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs sm:text-[15px] font-bold text-[#111c2d] mb-2 sm:mb-3">Platform</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-[14px] text-[#434655]">
                {currentUser && (
                  <li>
                    <button
                      onClick={handleOpenDashboard}
                      className="hover:text-[#004ac6] text-left cursor-pointer transition-colors flex items-center gap-1.5 font-semibold text-blue-700"
                    >
                      <span className="material-symbols-outlined text-[14px]">account_circle</span>
                      <span>Student Dashboard</span>
                    </button>
                  </li>
                )}
                <li>
                  <button
                    onClick={() => setIsDownloadsOpen(true)}
                    className="hover:text-[#004ac6] text-left cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <span>Offline Notes Vault</span>
                    {downloads.length > 0 && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 rounded-full">
                        {downloads.length}
                      </span>
                    )}
                  </button>
                </li>
                <li>
                  <a className="hover:text-[#004ac6]" href="#">
                    Educator Programs
                  </a>
                </li>
                <li>
                  <a className="hover:text-[#004ac6]" href="#">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a className="hover:text-[#004ac6]" href="#">
                    Terms of Learning
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-[#e7eeff] flex flex-col md:flex-row items-center justify-between text-[#434655] text-xs sm:text-[14px] gap-3">
            <p>{pageText.footer.copyrightText || '© 2025 Maths at Your Fingertips. Empowering young mathematical thinkers everywhere.'}</p>
            <div className="flex items-center gap-4 sm:gap-6 text-[10px] sm:text-[11px] font-bold">
              <span>{pageText.footer.mentorSignoff || 'NCERT • CBSE • ICSE • State Boards'}</span>
              {currentUser && (
                <button
                  onClick={handleOpenDashboard}
                  className="text-[#004ac6] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[13px]">account_circle</span>
                  <span>My Student Dashboard</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Modals */}
      <InteractiveFormulaDeckModal
        isOpen={isFormulaDeckOpen}
        onClose={() => setIsFormulaDeckOpen(false)}
        onDownloadSheet={(title, size) => {
          handleDownload(title, size);
        }}
      />

      <ResourceModal
        isOpen={!!selectedResource}
        resource={selectedResource}
        currentUser={currentUser}
        onRequireLogin={(title, grade) => {
          setPendingDownloadItem({
            title,
            size: selectedResource?.sizeOrDuration || '2.1 MB',
            resource: selectedResource || undefined,
          });
          setIsLoginRequiredOpen(true);
        }}
        onClose={() => setSelectedResource(null)}
        onShare={(title, r) => openShare(title, `${window.location.origin}${window.location.pathname}?resource=${r.id}`)}
        onDownload={(title, size) => {
          handleDownload(title, size, selectedResource || undefined);
          setSelectedResource(null);
        }}
        onOpenProPass={() => {
          setSelectedResource(null);
          setIsProPassModalOpen(true);
        }}
      />

      <VideoPlayerModal
        isOpen={isVideoModalOpen}
        resource={selectedResource || MATH_RESOURCES[3]}
        onClose={() => setIsVideoModalOpen(false)}
        onShare={(title, r) => openShare(title, `${window.location.origin}${window.location.pathname}?resource=${r.id}`)}
        onDownloadNotes={(title, size) => handleDownload(title, size, selectedResource || undefined)}
        onOpenProPass={() => {
          setIsVideoModalOpen(false);
          setIsProPassModalOpen(true);
        }}
      />

      <FlashcardsModal
        isOpen={isFlashcardModalOpen}
        onClose={() => setIsFlashcardModalOpen(false)}
        onDownloadSheet={(title, size) => {
          handleDownload(title, size);
        }}
      />

      <ProCheckoutModal
        currentUser={currentUser}
        isOpen={isProPassModalOpen}
        onClose={() => setIsProPassModalOpen(false)}
        onGoogleSignIn={handleGoogleSignIn}
        onSuccess={(paymentId) => {
          setIsProPassModalOpen(false);
          showToast(`🎉 Payment verified (${paymentId.slice(0, 10)}...)! Pro Pass Active.`);
        }}
      />

      <DownloadsDrawer
        isOpen={isDownloadsOpen}
        onClose={() => setIsDownloadsOpen(false)}
        items={downloads}
        onClearDownloads={() => {
          setDownloads([]);
          showToast('Cleared downloads cache');
        }}
        onOpenItem={(title) => {
          setIsDownloadsOpen(false);
          const found = allCatalogResources.find((r) => r.title === title);
          if (found) {
            setSelectedResource(found);
          } else {
            setIsFormulaDeckOpen(true);
          }
        }}
        onPrintItem={(title) => {
          const found = allCatalogResources.find((r) => r.title === title);
          if (!currentUser) {
            setPendingDownloadItem({
              title,
              size: found?.sizeOrDuration || '2.1 MB',
              resource: found,
            });
            setIsLoginRequiredOpen(true);
            showToast('⚠️ Please sign in to download or print study materials.');
            return;
          }
          printResourceInA4({
            title,
            grade: found?.grade,
            topic: found?.topic,
            format: found?.format,
            description: found?.description,
            keyFormulas: found?.keyFormulas,
            examTraps: found?.examTraps,
          });
        }}
      />

      <ShareModal
        isOpen={shareModalData.isOpen}
        title={shareModalData.title || branding.siteTitle}
        url={shareModalData.url}
        onClose={() => setShareModalData({ ...shareModalData, isOpen: false })}
      />

      <OlympiadEnrollModal
        isOpen={enrollModalData.isOpen}
        title={enrollModalData.title}
        subtitle={enrollModalData.subtitle}
        isFree={enrollModalData.isFree}
        onClose={() => setEnrollModalData({ ...enrollModalData, isOpen: false })}
      />

      <StudentMobileRegisterModal
        isOpen={showMobileRegisterModal}
        onClose={() => setShowMobileRegisterModal(false)}
        currentUser={currentUser}
        userProfile={userProfile}
        onRegistered={(phone) => {
          showToast(`✓ Mobile number registered: ${phone}`);
        }}
        onToast={showToast}
      />

      {/* Floating Ask Teacher Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => handleOpenAiTeacher()}
          className="group flex items-center gap-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-extrabold text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-amber-300"
          title="Ask Teacher (Classroom Board Solver)"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-[20px]">co_present</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="leading-tight">Ask Teacher</span>
            <span className="text-[10px] text-slate-900 font-semibold opacity-85">Classroom Board Solver</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping ml-0.5"></span>
        </button>
      </div>

      {/* AI Teacher Assistant Modal */}
      <AiTeacherModal
        isOpen={isAiTeacherOpen}
        onClose={() => setIsAiTeacherOpen(false)}
        currentUser={currentUser}
        userProfile={userProfile}
        onGoogleSignIn={handleGoogleSignIn}
        onToast={showToast}
        initialQuery={aiTeacherPresetQuery}
      />

      {/* Firebase Domain Authorization & Quick Sign-in Modal */}
      <UnauthorizedDomainModal
        isOpen={showDomainModal}
        onClose={() => setShowDomainModal(false)}
        onQuickSignIn={handleQuickDemoSignIn}
        onRetryGoogleSignIn={() => {
          setShowDomainModal(false);
          handleGoogleSignIn();
        }}
      />

      {/* Student Login Required Modal Before File Downloads */}
      <LoginRequiredModal
        isOpen={isLoginRequiredOpen}
        onClose={() => {
          setIsLoginRequiredOpen(false);
          setPendingDownloadItem(null);
        }}
        onGoogleSignIn={handleGoogleSignIn}
        onQuickDemoSignIn={handleQuickDemoSignIn}
        pendingResourceTitle={pendingDownloadItem?.title}
        pendingResourceGrade={pendingDownloadItem?.resource?.grade}
      />

      {/* Security Captcha Modal Before File Downloads */}
      <DownloadCaptchaModal
        isOpen={isCaptchaModalOpen}
        onClose={() => {
          setIsCaptchaModalOpen(false);
          setPendingDownloadItem(null);
        }}
        onVerified={executeVerifiedDownload}
        itemTitle={pendingDownloadItem?.title || 'Maths Revision Notes'}
        itemSize={pendingDownloadItem?.size || '2.4 MB'}
        resource={pendingDownloadItem?.resource}
      />

      {/* Floating Channels Quick-Join Bar (WhatsApp, Telegram, YouTube, Instagram) */}
      <SocialFloatingJoinBar
        socialConfig={socialConfig}
        onToast={showToast}
      />
    </div>
  );
}
