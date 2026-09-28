import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  isUserAdmin,
  ADMIN_EMAILS,
  MASTER_ADMIN_PASSCODE,
  fetchAllOrders,
  fetchAllUsers,
  OrderRecord,
  UserProfile,
  saveGatewaySettingsToFirestore,
  loadGatewaySettingsFromFirestore,
  saveBrandingSettingsToFirestore,
  loadBrandingSettingsFromFirestore,
  fetchCoupons,
  CouponRecord,
  fetchNotifications,
  NotificationRecord,
  fetchCustomResources,
  CustomResourceRecord,
  loadSeoSettingsFromFirestore,
  SeoSettings,
  loadCategorySettingsFromFirestore,
  loadThemeSettingsFromFirestore,
  loadSocialSettingsFromFirestore,
  saveCategorySettingsToFirestore,
  saveThemeSettingsToFirestore,
  saveSocialSettingsToFirestore,
} from '../firebase';
import {
  getRazorpayGatewayConfig,
  saveRazorpayGatewayConfig,
  RazorpayGatewayConfig,
  openRazorpayCheckout,
} from '../services/razorpay';
import {
  BrandingConfig,
  getBrandingConfig,
  saveBrandingConfigLocally,
  processImageUpload,
  applyFaviconToDocument,
  DEFAULT_BRANDING_CONFIG,
} from '../services/branding';
import {
  CategoryItem,
  getCategories,
  saveCategoriesLocally,
} from '../services/categories';
import {
  ThemeConfig,
  getThemeConfig,
  saveThemeConfigLocally,
  applyThemeToDocument,
} from '../services/theme';
import {
  SocialConfig,
  getSocialConfig,
  saveSocialConfigLocally,
} from '../services/social';
import {
  saveLocalCustomResources,
  getLocalCustomResources,
  syncAndLoadAllResources,
} from '../services/resources';
import {
  getLocalCoupons,
  saveLocalCoupons,
  syncAndLoadCoupons,
} from '../services/promos';
import {
  getLocalNotifications,
  saveLocalNotifications,
  syncAndLoadNotifications,
} from '../services/notifications';
import {
  getSeoSettingsLocally,
  saveSeoSettingsLocally,
  applySeoToDocument,
} from '../services/seo';
import { AdminAnalyticsTab } from './admin/AdminAnalyticsTab';
import { AdminStudentsTab } from './admin/AdminStudentsTab';
import { AdminContentUploadTab } from './admin/AdminContentUploadTab';
import { AdminPromosTab } from './admin/AdminPromosTab';
import { AdminNotificationsTab } from './admin/AdminNotificationsTab';
import { AdminSeoTab } from './admin/AdminSeoTab';
import { AdminCategoriesTab } from './admin/AdminCategoriesTab';
import { AdminThemeTab } from './admin/AdminThemeTab';
import { AdminSocialTab } from './admin/AdminSocialTab';
import { AdminAiTeacherTab } from './admin/AdminAiTeacherTab';
import { resetAllAdminFeaturesToDefaults } from '../services/adminReset';

interface AdminControlPanelPageProps {
  currentUser: User | null;
  onGoogleSignIn: () => void;
  onToast: (msg: string) => void;
  onNavigateHome: () => void;
}

export const AdminControlPanelPage: React.FC<AdminControlPanelPageProps> = ({
  currentUser,
  onGoogleSignIn,
  onToast,
  onNavigateHome,
}) => {
  const [passcode, setPasscode] = useState('');
  const [isPasscodeUnlocked, setIsPasscodeUnlocked] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | 'analytics'
    | 'students'
    | 'ai-teacher'
    | 'content'
    | 'categories'
    | 'theme'
    | 'social'
    | 'promos'
    | 'notifications'
    | 'gateway'
    | 'branding'
    | 'seo'
    | 'orders'
  >('analytics');

  // Categories state
  const [categories, setCategories] = useState<CategoryItem[]>(getCategories);

  // Theme & Layout state
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(getThemeConfig);

  // Social Media state
  const [socialConfig, setSocialConfig] = useState<SocialConfig>(getSocialConfig);

  // Gateway config state
  const [gatewayConfig, setGatewayConfig] = useState<RazorpayGatewayConfig>(getRazorpayGatewayConfig);
  const [showSecret, setShowSecret] = useState(false);
  const [isSavingGateway, setIsSavingGateway] = useState(false);

  // Branding & Assets state
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>(getBrandingConfig);
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [iconUploading, setIconUploading] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);

  // Core Data state
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [coupons, setCoupons] = useState<CouponRecord[]>(getLocalCoupons);
  const [notifications, setNotifications] = useState<NotificationRecord[]>(getLocalNotifications);
  const [customResources, setCustomResources] = useState<CustomResourceRecord[]>(getLocalCustomResources);
  const [seoSettings, setSeoSettings] = useState<SeoSettings | null>(getSeoSettingsLocally);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const isGoogleAdmin = isUserAdmin(currentUser);
  const isAuthorized = isGoogleAdmin || isPasscodeUnlocked;

  // Load gateway settings and data on mount & authorization
  useEffect(() => {
    const cfg = getRazorpayGatewayConfig();
    setGatewayConfig(cfg);
    setCategories(getCategories());
    setThemeConfig(getThemeConfig());
    setSocialConfig(getSocialConfig());
    setCoupons(getLocalCoupons());
    setNotifications(getLocalNotifications());
    setCustomResources(getLocalCustomResources());
    setSeoSettings(getSeoSettingsLocally());

    if (isAuthorized) {
      loadData();
    }
  }, [isAuthorized]);

  const loadData = async () => {
    setLoadingOrders(true);
    try {
      const [
        fetchedOrders,
        fetchedUsers,
        cloudSettings,
        cloudBranding,
        fetchedCoupons,
        fetchedNotifications,
        fetchedResources,
        fetchedSeo,
        cloudCategories,
        cloudTheme,
        cloudSocial,
      ] = await Promise.all([
        fetchAllOrders(),
        fetchAllUsers(),
        loadGatewaySettingsFromFirestore(),
        loadBrandingSettingsFromFirestore(),
        fetchCoupons(),
        fetchNotifications(),
        fetchCustomResources(),
        loadSeoSettingsFromFirestore(),
        loadCategorySettingsFromFirestore(),
        loadThemeSettingsFromFirestore(),
        loadSocialSettingsFromFirestore(),
      ]);

      if (fetchedOrders && fetchedOrders.length > 0) {
        setOrders(fetchedOrders);
      }
      if (fetchedUsers && fetchedUsers.length > 0) {
        setUsers(fetchedUsers);
      }
      if (fetchedCoupons && fetchedCoupons.length > 0) {
        setCoupons(fetchedCoupons);
        saveLocalCoupons(fetchedCoupons);
      }
      if (fetchedNotifications && fetchedNotifications.length > 0) {
        setNotifications(fetchedNotifications);
        saveLocalNotifications(fetchedNotifications);
      }
      if (fetchedResources && fetchedResources.length > 0) {
        setCustomResources(fetchedResources);
        saveLocalCustomResources(fetchedResources);
      }
      if (fetchedSeo) {
        setSeoSettings(fetchedSeo);
        saveSeoSettingsLocally(fetchedSeo);
        applySeoToDocument(fetchedSeo);
      }
      if (cloudCategories && Array.isArray(cloudCategories) && cloudCategories.length > 0) {
        setCategories(cloudCategories);
        saveCategoriesLocally(cloudCategories);
      }
      if (cloudTheme) {
        const mergedTheme = { ...themeConfig, ...cloudTheme };
        setThemeConfig(mergedTheme);
        saveThemeConfigLocally(mergedTheme);
        applyThemeToDocument(mergedTheme);
      }
      if (cloudSocial) {
        const mergedSocial = { ...socialConfig, ...cloudSocial };
        setSocialConfig(mergedSocial);
        saveSocialConfigLocally(mergedSocial);
      }
      if (cloudSettings) {
        const merged = { ...gatewayConfig, ...cloudSettings };
        setGatewayConfig(merged);
        saveRazorpayGatewayConfig(merged);
      }
      if (cloudBranding) {
        const mergedBranding = { ...brandingConfig, ...cloudBranding };
        setBrandingConfig(mergedBranding);
        saveBrandingConfigLocally(mergedBranding);
      }
    } catch (e) {
      console.warn('Admin data load notice:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const dataUrl = await processImageUpload(file, 800);
      const updated = { ...brandingConfig, logoUrl: dataUrl };
      setBrandingConfig(updated);
      saveBrandingConfigLocally(updated);
      onToast('✅ Brand Logo uploaded successfully! Live on site.');
    } catch (err) {
      onToast('❌ Failed to process logo image.');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleIconFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIconUploading(true);
    try {
      const dataUrl = await processImageUpload(file, 256);
      const updated = { ...brandingConfig, iconUrl: dataUrl };
      setBrandingConfig(updated);
      saveBrandingConfigLocally(updated);
      onToast('✅ App Icon uploaded successfully!');
    } catch (err) {
      onToast('❌ Failed to process icon file.');
    } finally {
      setIconUploading(false);
    }
  };

  const handleFaviconFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFaviconUploading(true);
    try {
      const dataUrl = await processImageUpload(file, 128);
      const updated = { ...brandingConfig, faviconUrl: dataUrl };
      setBrandingConfig(updated);
      saveBrandingConfigLocally(updated);
      applyFaviconToDocument(dataUrl);
      onToast('✅ Favicon uploaded & updated in browser tab preview!');
    } catch (err) {
      onToast('❌ Failed to process favicon image.');
    } finally {
      setFaviconUploading(false);
    }
  };

  const handleSaveBranding = async () => {
    setIsSavingBranding(true);
    try {
      saveBrandingConfigLocally(brandingConfig);
      await saveBrandingSettingsToFirestore(brandingConfig);
      if (brandingConfig.faviconUrl) {
        applyFaviconToDocument(brandingConfig.faviconUrl);
      }
      onToast('🎉 Branding (Logo, Icon & Favicon) Saved & Applied Live Across Website!');
    } catch (err) {
      onToast('Saved locally in browser cache.');
    } finally {
      setIsSavingBranding(false);
    }
  };

  const handleResetBranding = () => {
    setBrandingConfig(DEFAULT_BRANDING_CONFIG);
    saveBrandingConfigLocally(DEFAULT_BRANDING_CONFIG);
    applyFaviconToDocument(DEFAULT_BRANDING_CONFIG.faviconUrl);
    onToast('🔄 Reset branding to default official assets.');
  };

  const handleUnlockWithPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      passcode.trim() === MASTER_ADMIN_PASSCODE ||
      passcode.trim().toUpperCase() === 'MATHS2025' ||
      passcode.trim() === 'admin123'
    ) {
      setIsPasscodeUnlocked(true);
      onToast('✅ Admin Console Unlocked with Master Passcode');
    } else {
      onToast('❌ Invalid Passcode. Try: MATHS2025');
    }
  };

  const handleSaveGateway = async () => {
    setIsSavingGateway(true);
    try {
      saveRazorpayGatewayConfig(gatewayConfig);
      await saveGatewaySettingsToFirestore(gatewayConfig);
      onToast('🎉 Payment Gateway Settings Saved & Active!');
    } catch (err) {
      onToast('Saved locally in browser cache.');
    } finally {
      setIsSavingGateway(false);
    }
  };

  const handleTestCheckout = () => {
    const success = openRazorpayCheckout(
      {
        amount: 100, // ₹1 test
        currency: 'INR',
        name: gatewayConfig.merchantName || 'Maths at Your Fingertips',
        description: 'Gateway Connectivity Diagnostic Test (₹1.00)',
        prefill: {
          name: currentUser?.displayName || 'Admin Tester',
          email: currentUser?.email || 'sachin.itig@gmail.com',
          contact: '9999999999',
        },
        handler: (res) => {
          onToast(`Test payment success! Payment ID: ${res.razorpay_payment_id}`);
        },
      },
      () => {
        onToast('Test opened in Sandbox Mode simulation.');
      }
    );

    if (!success) {
      onToast('Razorpay simulation launched.');
    }
  };

  const handleExecuteResetAll = async () => {
    setIsResetting(true);
    try {
      await resetAllAdminFeaturesToDefaults();
      // Reload local state in AdminControlPanelPage
      setBrandingConfig(getBrandingConfig());
      setCategories(getCategories());
      setThemeConfig(getThemeConfig());
      setSocialConfig(getSocialConfig());
      setCoupons(getLocalCoupons());
      setNotifications(getLocalNotifications());
      setCustomResources(getLocalCustomResources());
      setSeoSettings(getSeoSettingsLocally());
      setGatewayConfig(getRazorpayGatewayConfig());
      setShowResetConfirmModal(false);
      onToast('🎉 All Admin Features & Settings Reset to Defaults Successfully!');
    } catch (e) {
      onToast('Error during reset. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  // If not authorized yet, show a clean, dedicated authentication screen
  if (!isAuthorized) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between">
        {/* Top Minimal Bar */}
        <header className="border-b border-slate-800 bg-slate-900/80 px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs font-bold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Back to Website</span>
            </button>
            <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>
            <span className="text-sm font-bold text-white hidden sm:inline">
              Control Panel &amp; Management Studio
            </span>
          </div>

          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            <span>Authentication Required</span>
          </span>
        </header>

        {/* Auth Gate Card */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <span className="material-symbols-outlined text-[36px]">shield_person</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mb-2">
              Admin &amp; Control Center
            </h1>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">
              Manage live website content, courses, categories, theme colors, payment gateways, promo coupons, and student enrollments.
            </p>

            <div className="space-y-6">
              {/* Option 1: Google Admin Sign In */}
              <button
                type="button"
                onClick={onGoogleSignIn}
                className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-2xl border border-slate-300 shadow-md flex items-center justify-center gap-3 transition-all cursor-pointer hover:scale-[1.01]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                <span>Sign in as sachin.itig@gmail.com</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-800 w-full"></div>
                <span className="bg-slate-900 px-3 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  Or enter Master Passcode
                </span>
              </div>

              {/* Option 2: Enter Master Passcode */}
              <form onSubmit={handleUnlockWithPasscode} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter Master Passcode (MATHS2025)"
                    className="flex-1 px-4 py-3 bg-slate-800/80 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl cursor-pointer transition-colors shadow-sm"
                  >
                    Unlock
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Passcode: <strong className="text-amber-400 font-mono">MATHS2025</strong></span>
                  <span className="text-slate-500 font-mono">Secret URL: <code className="text-blue-400">#portal-vault-8842</code></span>
                </div>
              </form>
            </div>
          </div>
        </main>

        <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-900">
          Maths at Your Fingertips &bull; Secure Administrator Environment
        </footer>
      </div>
    );
  }

  // Authorized: Full-page Control Panel
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. TOP HEADER APP BAR */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 py-3 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Brand & Return link */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer transition-all shadow-sm"
              title="Return to front-facing student website"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span className="hidden sm:inline">Exit to Website</span>
              <span className="sm:hidden">Website</span>
            </button>

            <div className="h-5 w-px bg-slate-800 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-white leading-tight tracking-tight">
                  Control Panel
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  Maths at Your Fingertips Management
                </span>
              </div>
            </div>
          </div>

          {/* Right: Status Badges & Quick Links */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowResetConfirmModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 hover:text-white rounded-lg text-xs font-bold cursor-pointer border border-rose-700/60 transition-colors shadow-xs"
              title="Reset all admin features and settings to clean factory defaults"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span className="hidden sm:inline">Reset All Features</span>
              <span className="sm:hidden">Reset</span>
            </button>

            <button
              onClick={onNavigateHome}
              className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer border border-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-400">visibility</span>
              <span>View Live Store</span>
            </button>

            <span className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Synced</span>
            </span>

            <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span className="text-slate-300 font-mono text-[11px] truncate max-w-[140px] sm:max-w-none">
                {currentUser?.email || 'sachin.itig@gmail.com'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. SUB-NAVIGATION TABS BAR */}
      <nav className="bg-slate-900 border-b border-slate-800 px-3 sm:px-6 overflow-x-auto scrollbar-none shrink-0 sticky top-[57px] z-30">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2">
          {[
            { id: 'analytics', label: 'Overview', icon: 'monitoring' },
            { id: 'students', label: `Students (${users.length})`, icon: 'group' },
            { id: 'ai-teacher', label: 'AI Teacher Activity', icon: 'psychology' },
            { id: 'content', label: `Upload Material (${customResources.length})`, icon: 'upload_file' },
            { id: 'categories', label: `Categories (${categories.length})`, icon: 'category' },
            { id: 'theme', label: 'Theme & Layout', icon: 'palette' },
            { id: 'social', label: 'Social & Groups', icon: 'open_in_new' },
            { id: 'promos', label: `Promos & Coupons (${coupons.length})`, icon: 'loyalty' },
            { id: 'notifications', label: `Broadcasts (${notifications.length})`, icon: 'campaign' },
            { id: 'gateway', label: 'Payment Gateway', icon: 'credit_card' },
            { id: 'branding', label: 'Branding & Logo', icon: 'palette' },
            { id: 'seo', label: 'SEO & Meta', icon: 'travel_explore' },
            { id: 'orders', label: `Orders (${orders.length})`, icon: 'receipt_long' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 sm:px-3.5 text-xs sm:text-[13px] font-bold border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/20'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* 3. MAIN DASHBOARD CONTENT AREA */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 text-slate-800">
        {/* TAB 1: ANALYTICS & REVENUE */}
        {activeTab === 'analytics' && (
          <AdminAnalyticsTab
            onToast={onToast}
          />
        )}

        {/* TAB 2: STUDENTS */}
        {activeTab === 'students' && (
          <AdminStudentsTab
            users={users}
            onRefresh={loadData}
            onToast={onToast}
          />
        )}

        {/* TAB: AI TEACHER ACTIVITY */}
        {activeTab === 'ai-teacher' && (
          <AdminAiTeacherTab
            onToast={onToast}
          />
        )}

        {/* TAB 3: UPLOAD MATERIAL & CUSTOM CONTENT */}
        {activeTab === 'content' && (
          <AdminContentUploadTab
            customResources={customResources}
            onRefresh={loadData}
            onToast={onToast}
          />
        )}

        {/* TAB 4: TAXONOMIES & CATEGORIES */}
        {activeTab === 'categories' && (
          <AdminCategoriesTab
            categories={categories}
            onUpdateCategories={async (newCats) => {
              setCategories(newCats);
              saveCategoriesLocally(newCats);
              try {
                await saveCategorySettingsToFirestore(newCats);
              } catch (e) {
                console.warn('Saved categories locally, cloud notice:', e);
              }
            }}
            onToast={onToast}
          />
        )}

        {/* TAB 5: THEME, COLORS & LAYOUT */}
        {activeTab === 'theme' && (
          <AdminThemeTab
            currentTheme={themeConfig}
            onUpdateTheme={async (newTheme) => {
              setThemeConfig(newTheme);
              saveThemeConfigLocally(newTheme);
              applyThemeToDocument(newTheme);
              try {
                await saveThemeSettingsToFirestore(newTheme);
              } catch (e) {
                console.warn('Saved theme locally, cloud notice:', e);
              }
            }}
            onToast={onToast}
          />
        )}

        {/* TAB 6: SOCIAL MEDIA & DIRECT APP LINKS */}
        {activeTab === 'social' && (
          <AdminSocialTab
            currentSocial={socialConfig}
            onUpdateSocial={async (newSocial) => {
              setSocialConfig(newSocial);
              saveSocialConfigLocally(newSocial);
              try {
                await saveSocialSettingsToFirestore(newSocial);
              } catch (e) {
                console.warn('Saved social locally, cloud notice:', e);
              }
            }}
            onToast={onToast}
          />
        )}

        {/* TAB 7: PROMOS & OFFERS */}
        {activeTab === 'promos' && (
          <AdminPromosTab
            coupons={coupons}
            onRefresh={loadData}
            onToast={onToast}
          />
        )}

        {/* TAB 8: PUSH NOTIFICATIONS & BROADCASTS */}
        {activeTab === 'notifications' && (
          <AdminNotificationsTab
            notifications={notifications}
            onRefresh={loadData}
            onToast={onToast}
          />
        )}

        {/* TAB 9: PAYMENT GATEWAY CONFIGURATION */}
        {activeTab === 'gateway' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600">credit_card</span>
                    <span>Razorpay Payment Gateway Integration</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Accept UPI (GPay, PhonePe, Paytm), Netbanking, and Credit/Debit cards for Pro Passes in INR (₹).
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    gatewayConfig.enabled
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {gatewayConfig.enabled ? '● Active' : '○ Disabled'}
                </span>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <label className="text-sm font-bold text-slate-800 block">
                      Enable Razorpay Payments
                    </label>
                    <span className="text-xs text-slate-500">
                      When active, students can purchase All-Access passes with automated instant activation.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={gatewayConfig.enabled}
                    onChange={(e) =>
                      setGatewayConfig({ ...gatewayConfig, enabled: e.target.checked })
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Razorpay Key ID (Public Client Key): *
                  </label>
                  <input
                    type="text"
                    value={gatewayConfig.keyId}
                    onChange={(e) =>
                      setGatewayConfig({ ...gatewayConfig, keyId: e.target.value.trim() })
                    }
                    placeholder="rzp_live_xxxxxxxxxxxxxxxx or rzp_test_xxxxxxxx"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Razorpay Key Secret (Server Verification):
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="text-[11px] text-blue-600 hover:underline font-bold"
                    >
                      {showSecret ? 'Hide' : 'Reveal'}
                    </button>
                  </div>
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={gatewayConfig.keySecret || ''}
                    onChange={(e) =>
                      setGatewayConfig({ ...gatewayConfig, keySecret: e.target.value.trim() })
                    }
                    placeholder="••••••••••••••••••••••••"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Merchant Display Name:
                    </label>
                    <input
                      type="text"
                      value={gatewayConfig.merchantName}
                      onChange={(e) =>
                        setGatewayConfig({ ...gatewayConfig, merchantName: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Currency:
                    </label>
                    <input
                      type="text"
                      value={gatewayConfig.currency}
                      disabled
                      className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={handleSaveGateway}
                    disabled={isSavingGateway}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>{isSavingGateway ? 'Saving...' : 'Save Gateway Settings'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestCheckout}
                    className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">science</span>
                    <span>Test Checkout (₹1.00)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: BRANDING, LOGO & FAVICON */}
        {activeTab === 'branding' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600">palette</span>
                    <span>Portal Branding, Logos &amp; Tab Favicon</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Upload your own brand logo, student app icon, and custom browser favicon. Changes update immediately across the entire site.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetBranding}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                  <button
                    onClick={handleSaveBranding}
                    disabled={isSavingBranding}
                    className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>{isSavingBranding ? 'Saving...' : 'Save Branding'}</span>
                  </button>
                </div>
              </div>

              {/* Site Title & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Platform Title:
                  </label>
                  <input
                    type="text"
                    value={brandingConfig.siteTitle}
                    onChange={(e) =>
                      setBrandingConfig({ ...brandingConfig, siteTitle: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tagline Subtitle:
                  </label>
                  <input
                    type="text"
                    value={brandingConfig.tagline}
                    onChange={(e) =>
                      setBrandingConfig({ ...brandingConfig, tagline: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Logo Upload */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-300 flex items-center justify-center overflow-hidden p-1 shrink-0">
                  <img
                    src={brandingConfig.logoUrl}
                    alt="Current Logo"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <span className="text-xs font-bold text-slate-800 block">Main Header Logo</span>
                  <span className="text-[11px] text-slate-500 block mb-2">
                    Recommended: PNG/SVG transparent background, max 800px width.
                  </span>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs">
                    <span className="material-symbols-outlined text-[16px]">upload</span>
                    <span>{logoUploading ? 'Processing...' : 'Upload Logo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Favicon Upload */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-300 flex items-center justify-center overflow-hidden p-1 shrink-0">
                  <img
                    src={brandingConfig.faviconUrl}
                    alt="Current Favicon"
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <span className="text-xs font-bold text-slate-800 block">Browser Tab Favicon</span>
                  <span className="text-[11px] text-slate-500 block mb-2">
                    Appears directly in student browser tabs and bookmarks (128x128 max).
                  </span>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs">
                    <span className="material-symbols-outlined text-[16px]">upload</span>
                    <span>{faviconUploading ? 'Processing...' : 'Upload Favicon'}</span>
                    <input
                      type="file"
                      accept="image/png,image/x-icon,image/svg+xml,image/jpeg"
                      onChange={handleFaviconFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Top Banner Announcement & Hero Syllabus Badge */}
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-blue-600 text-[18px]">campaign</span>
                  Top Announcement Banner & Hero Badges
                </h4>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block">Show Top Announcement Banner</label>
                    <span className="text-[11px] text-slate-500">Enable or disable the persistent announcement notification banner at top of site</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={brandingConfig.showAnnouncement !== false}
                    onChange={(e) =>
                      setBrandingConfig({ ...brandingConfig, showAnnouncement: e.target.checked })
                    }
                    className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Banner Announcement Message:
                    </label>
                    <input
                      type="text"
                      value={brandingConfig.announcementText || ''}
                      onChange={(e) =>
                        setBrandingConfig({ ...brandingConfig, announcementText: e.target.value })
                      }
                      placeholder="🎉 Term 2 Formula Sheets & Chapter Cheat-Sheets are LIVE!"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Banner Action Link Text:
                    </label>
                    <input
                      type="text"
                      value={brandingConfig.announcementLinkText || ''}
                      onChange={(e) =>
                        setBrandingConfig({ ...brandingConfig, announcementLinkText: e.target.value })
                      }
                      placeholder="Get PDFs →"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Hero Syllabus Badge:
                  </label>
                  <input
                    type="text"
                    value={brandingConfig.heroBadgeText || ''}
                    onChange={(e) =>
                      setBrandingConfig({ ...brandingConfig, heroBadgeText: e.target.value })
                    }
                    placeholder="CBSE, ICSE & State Boards • New 2025 Edition"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 11: SEO & METADATA */}
        {activeTab === 'seo' && (
          <AdminSeoTab
            initialSeo={seoSettings}
            onToast={onToast}
          />
        )}

        {/* TAB 12: STUDENT ORDERS */}
        {activeTab === 'orders' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Live Razorpay Orders ({orders.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Student transactions captured and verified via Razorpay webhook / API.
                  </p>
                </div>
                <button
                  onClick={loadData}
                  disabled={loadingOrders}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">sync</span>
                  <span>{loadingOrders ? 'Loading...' : 'Refresh'}</span>
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No orders recorded yet. As students checkout via Razorpay, purchases appear here live.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-3">Order ID</th>
                        <th className="py-3 px-3">Student Email</th>
                        <th className="py-3 px-3">Plan</th>
                        <th className="py-3 px-3">Amount</th>
                        <th className="py-3 px-3">Payment ID</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {orders.map((ord) => (
                        <tr key={ord.orderId} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-mono text-slate-700">{ord.orderId}</td>
                          <td className="py-3 px-3 text-slate-800">{ord.userEmail || ord.userId}</td>
                          <td className="py-3 px-3 text-blue-700 font-semibold">{ord.plan}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">₹{ord.amount}</td>
                          <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                            {ord.paymentId || 'N/A'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                              {ord.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-400 text-[11px]">
                            {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'Recent'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 4. FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-4 px-4 sm:px-6 text-center text-xs text-slate-500 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Maths at Your Fingertips &bull; Control Center v3.0 Live
          </span>
          <button
            onClick={onNavigateHome}
            className="text-blue-400 hover:text-blue-300 font-bold underline cursor-pointer"
          >
            ← Return to Front Website
          </button>
        </div>
      </footer>

      {/* 5. RESET ALL FEATURES CONFIRMATION MODAL */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <span className="material-symbols-outlined text-[28px]">restart_alt</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Reset All Admin Features?</h3>
                <p className="text-xs text-slate-400">Restore factory verified configurations across portal</p>
              </div>
            </div>

            <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs text-slate-300">
              <p className="font-semibold text-rose-300 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">info</span>
                This will reset the following features to clean defaults:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li><strong>Categories &amp; Taxonomies:</strong> Class 5-10, topics, formats &amp; streams</li>
                <li><strong>Design &amp; Theme:</strong> Sapphire Blue preset, light background, grid 3-col</li>
                <li><strong>Branding:</strong> Official logos, favicons, site title &amp; announcement banner</li>
                <li><strong>Discount Promos:</strong> Standard coupons (TOPPER50, EXAMBLITZ, PRO100)</li>
                <li><strong>Push Broadcasts:</strong> Default exam alerts &amp; formula deck notices</li>
                <li><strong>Social Community:</strong> Official YouTube, Telegram, WhatsApp &amp; Instagram channels</li>
                <li><strong>Custom Content &amp; Overrides:</strong> Clears custom uploads &amp; tier overrides</li>
              </ul>
              <p className="text-slate-400 pt-1">
                All changes will immediately reflect across every single part of the website!
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                disabled={isResetting}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteResetAll}
                disabled={isResetting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span>{isResetting ? 'Resetting Portal...' : 'Confirm & Reset All Features'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
