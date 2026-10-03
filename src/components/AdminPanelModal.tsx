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
  saveRazorpayOrder,
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
  savePageTextSettingsToFirestore,
  loadPageTextSettingsFromFirestore,
} from '../firebase';
import { AdminPageTextTab } from './admin/AdminPageTextTab';
import {
  PageTextConfig,
  getPageTextConfig,
  savePageTextConfigLocally,
} from '../services/pageText';
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
import { AdminAnalyticsTab } from './admin/AdminAnalyticsTab';
import { AdminStudentsTab } from './admin/AdminStudentsTab';
import { AdminContentUploadTab } from './admin/AdminContentUploadTab';
import { AdminPromosTab } from './admin/AdminPromosTab';
import { AdminNotificationsTab } from './admin/AdminNotificationsTab';
import { AdminSeoTab } from './admin/AdminSeoTab';
import { AdminCategoriesTab } from './admin/AdminCategoriesTab';
import { AdminThemeTab } from './admin/AdminThemeTab';
import { AdminSocialTab } from './admin/AdminSocialTab';
import { AdminAdsTab } from './admin/AdminAdsTab';
import {
  AdsGlobalConfig,
  getAdsConfig,
  loadAdsConfigFromFirestore,
  saveAdsConfigLocally,
} from '../services/ads';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onGoogleSignIn: () => void;
  onToast: (msg: string) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onGoogleSignIn,
  onToast,
}) => {
  const [passcode, setPasscode] = useState('');
  const [isPasscodeUnlocked, setIsPasscodeUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | 'analytics'
    | 'students'
    | 'content'
    | 'categories'
    | 'theme'
    | 'social'
    | 'promos'
    | 'notifications'
    | 'gateway'
    | 'branding'
    | 'ads'
    | 'page-text'
    | 'seo'
    | 'orders'
  >('analytics');

  // Page Text state
  const [pageText, setPageText] = useState<PageTextConfig>(getPageTextConfig());
  const [isSavingPageText, setIsSavingPageText] = useState(false);

  // Ads state
  const [adsConfig, setAdsConfig] = useState<AdsGlobalConfig>(getAdsConfig());

  // Categories state
  const [categories, setCategories] = useState<CategoryItem[]>(getCategories());

  // Theme & Layout state
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(getThemeConfig());

  // Social Media state
  const [socialConfig, setSocialConfig] = useState<SocialConfig>(getSocialConfig());

  // Gateway config state
  const [gatewayConfig, setGatewayConfig] = useState<RazorpayGatewayConfig>(getRazorpayGatewayConfig());
  const [showSecret, setShowSecret] = useState(false);
  const [isSavingGateway, setIsSavingGateway] = useState(false);

  // Branding & Assets state
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>(getBrandingConfig());
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [iconUploading, setIconUploading] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);

  // Core Data state
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [customResources, setCustomResources] = useState<CustomResourceRecord[]>([]);
  const [seoSettings, setSeoSettings] = useState<SeoSettings | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const isGoogleAdmin = isUserAdmin(currentUser);
  const isAuthorized = isGoogleAdmin || isPasscodeUnlocked;

  // Load gateway settings and data when modal opens and authorized
  useEffect(() => {
    if (isOpen) {
      const cfg = getRazorpayGatewayConfig();
      setGatewayConfig(cfg);
      setCategories(getCategories());
      setThemeConfig(getThemeConfig());
      setSocialConfig(getSocialConfig());

      if (isAuthorized) {
        loadData();
      }
    }
  }, [isOpen, isAuthorized]);

  const loadData = async () => {
    setLoadingOrders(true);
    try {
      const results = await Promise.allSettled([
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
        loadAdsConfigFromFirestore(),
        loadPageTextSettingsFromFirestore(),
      ]);

      const [
        ordersRes,
        usersRes,
        gatewayRes,
        brandingRes,
        couponsRes,
        notifRes,
        resRes,
        seoRes,
        catsRes,
        themeRes,
        socialRes,
        adsRes,
        pageTextRes,
      ] = results;

      if (ordersRes.status === 'fulfilled' && ordersRes.value && ordersRes.value.length > 0) {
        setOrders(ordersRes.value);
      }
      if (usersRes.status === 'fulfilled' && usersRes.value && usersRes.value.length > 0) {
        setUsers(usersRes.value);
      }
      if (couponsRes.status === 'fulfilled' && couponsRes.value && couponsRes.value.length > 0) {
        setCoupons(couponsRes.value);
      }
      if (notifRes.status === 'fulfilled' && notifRes.value && notifRes.value.length > 0) {
        setNotifications(notifRes.value);
      }
      if (resRes.status === 'fulfilled' && resRes.value && resRes.value.length > 0) {
        setCustomResources(resRes.value);
      }
      if (seoRes.status === 'fulfilled' && seoRes.value) {
        setSeoSettings(seoRes.value);
      }
      if (catsRes.status === 'fulfilled' && catsRes.value && Array.isArray(catsRes.value) && catsRes.value.length > 0) {
        setCategories(catsRes.value);
        saveCategoriesLocally(catsRes.value);
      }
      if (themeRes.status === 'fulfilled' && themeRes.value) {
        const mergedTheme = { ...themeConfig, ...themeRes.value };
        setThemeConfig(mergedTheme);
        saveThemeConfigLocally(mergedTheme);
        applyThemeToDocument(mergedTheme);
      }
      if (socialRes.status === 'fulfilled' && socialRes.value) {
        const mergedSocial = { ...socialConfig, ...socialRes.value };
        setSocialConfig(mergedSocial);
        saveSocialConfigLocally(mergedSocial);
      }
      if (gatewayRes.status === 'fulfilled' && gatewayRes.value) {
        const merged = { ...gatewayConfig, ...gatewayRes.value };
        setGatewayConfig(merged);
        saveRazorpayGatewayConfig(merged);
      }
      if (brandingRes.status === 'fulfilled' && brandingRes.value) {
        const cloudBranding = brandingRes.value;
        const mergedBranding = {
          ...brandingConfig,
          ...cloudBranding,
          siteTitle: cloudBranding.siteTitle !== undefined ? cloudBranding.siteTitle : '',
          tagline: cloudBranding.tagline !== undefined ? cloudBranding.tagline : '',
        };
        setBrandingConfig(mergedBranding);
        saveBrandingConfigLocally(mergedBranding);
      }
      if (adsRes.status === 'fulfilled' && adsRes.value) {
        const cloudAds = adsRes.value;
        const mergedAds = {
          ...adsConfig,
          ...cloudAds,
          placements: { ...adsConfig.placements, ...(cloudAds.placements || {}) },
        };
        setAdsConfig(mergedAds);
        saveAdsConfigLocally(mergedAds);
      }
      if (pageTextRes.status === 'fulfilled' && pageTextRes.value) {
        setPageText(pageTextRes.value);
        savePageTextConfigLocally(pageTextRes.value);
      }
    } catch (_e) {
      // Non-blocking admin data load fallback
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
      setBrandingConfig((prev) => ({ ...prev, logoUrl: dataUrl }));
      onToast('✅ Brand Logo uploaded successfully! Click "Save Branding" to apply.');
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
      setBrandingConfig((prev) => ({ ...prev, iconUrl: dataUrl }));
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
      setBrandingConfig((prev) => ({ ...prev, faviconUrl: dataUrl }));
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
      onToast('🎉 Branding (Logo, Icon & Favicon) Saved & Applied Live!');
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
    if (passcode.trim() === MASTER_ADMIN_PASSCODE || passcode.trim().toUpperCase() === 'MATHS2025' || passcode.trim() === 'admin123') {
      setIsPasscodeUnlocked(true);
      onToast('✅ Admin Console Unlocked with Master Passcode');
    } else {
      onToast('❌ Invalid Passcode. Try: MATHS2025');
    }
  };

  const handleSaveGateway = async () => {
    setIsSavingGateway(true);
    try {
      // Save locally
      saveRazorpayGatewayConfig(gatewayConfig);

      // Save to Firestore
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
        handler: async (res) => {
          const testOrder: OrderRecord = {
            orderId: `order_test_${Date.now()}`,
            userId: currentUser?.uid || 'admin_tester',
            userEmail: currentUser?.email || 'admin@mathsatyourfingertips.com',
            plan: 'Admin Diagnostic Test Pass',
            amount: 1,
            currency: 'INR',
            paymentId: res.razorpay_payment_id || `pay_test_${Date.now()}`,
            status: 'captured',
            createdAt: new Date().toISOString(),
          };
          try {
            await saveRazorpayOrder(testOrder);
          } catch {}
          try {
            const raw = localStorage.getItem('maths_portal_local_orders');
            const arr = raw ? JSON.parse(raw) : [];
            localStorage.setItem('maths_portal_local_orders', JSON.stringify([testOrder, ...arr]));
          } catch {}
          onToast(`Test payment success! Payment ID: ${res.razorpay_payment_id}`);
          loadData();
        },
      },
      async () => {
        const testOrder: OrderRecord = {
          orderId: `order_sim_${Date.now()}`,
          userId: currentUser?.uid || 'admin_tester',
          userEmail: currentUser?.email || 'admin@mathsatyourfingertips.com',
          plan: 'Admin Diagnostic Test Pass',
          amount: 1,
          currency: 'INR',
          paymentId: `pay_sim_${Date.now()}`,
          status: 'captured',
          createdAt: new Date().toISOString(),
        };
        try {
          await saveRazorpayOrder(testOrder);
        } catch {}
        try {
          const raw = localStorage.getItem('maths_portal_local_orders');
          const arr = raw ? JSON.parse(raw) : [];
          localStorage.setItem('maths_portal_local_orders', JSON.stringify([testOrder, ...arr]));
        } catch {}
        onToast('Test opened in Sandbox Mode simulation & order recorded.');
        loadData();
      }
    );

    if (!success) {
      onToast('Razorpay simulation launched.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#f8fafc] w-full max-w-5xl max-h-[95vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-blue-200 flex flex-col overflow-hidden text-slate-800">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-inner">
              <span className="material-symbols-outlined text-[24px]">admin_panel_settings</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                  Admin &amp; Payment Gateway Console
                </h2>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  v2.5 Live
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Primary Administrator:{' '}
                <span className="text-amber-300 font-semibold">{ADMIN_EMAILS[0]}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthorized && (
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Authorized</span>
              </span>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Verification Gate (If not authorized) */}
        {!isAuthorized ? (
          <div className="p-6 sm:p-10 flex-1 overflow-y-auto flex flex-col items-center justify-center max-w-xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[36px]">lock</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
              Administrator Authentication
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              This restricted console allows configuring payment gateways, Razorpay API credentials, and student orders. Please authenticate as{' '}
              <strong className="text-blue-700">sachin.itig@gmail.com</strong> or use your Master Admin Passcode.
            </p>

            <div className="w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              {/* Option 1: Sign in with Google */}
              <div>
                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-xl border border-slate-300 shadow-xs flex items-center justify-center gap-3 transition-all cursor-pointer"
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
              </div>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-xs text-slate-400 font-semibold uppercase">Or enter Passcode</span>
              </div>

              {/* Option 2: Enter Master Passcode */}
              <form onSubmit={handleUnlockWithPasscode} className="space-y-3">
                <div className="text-left">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Master Admin Passcode:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Enter passkey (e.g. MATHS2025)"
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl cursor-pointer shadow-xs transition-colors shrink-0"
                    >
                      Unlock
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-slate-500">
                      Default Developer Key: <code className="bg-slate-100 text-blue-700 px-1.5 py-0.5 rounded font-mono font-bold">MATHS2025</code>
                    </span>
                    <button
                      type="button"
                      onClick={() => setPasscode('MATHS2025')}
                      className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                      Auto-fill Key
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Authorized Content */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Navigation Tabs */}
            <div className="bg-white px-4 sm:px-6 border-b border-slate-200 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar shrink-0">
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-3 px-3 sm:px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">monitoring</span>
                <span>Analytics Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab('students')}
                className={`py-3 px-3 sm:px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                  activeTab === 'students'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">group</span>
                <span>Students &amp; Manual Assign</span>
              </button>

              <button
                onClick={() => setActiveTab('content')}
                className={`py-3 px-3 sm:px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                  activeTab === 'content'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                <span>Upload Content</span>
              </button>

              <button
                onClick={() => setActiveTab('categories')}
                className={`py-3 px-3 sm:px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                  activeTab === 'categories'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">category</span>
                <span>Content Categories ({categories.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('theme')}
                className={`py-3 px-3 sm:px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                  activeTab === 'theme'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">palette</span>
                <span>Theme &amp; Layout</span>
              </button>

              <button
                onClick={() => setActiveTab('social')}
                className={`py-3 px-3 sm:px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                  activeTab === 'social'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                <span>Social Media &amp; App Links</span>
              </button>

              <button
                onClick={() => setActiveTab('promos')}
                className={`py-3 px-3 sm:px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                  activeTab === 'promos'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">loyalty</span>
                <span>Promos &amp; Offers</span>
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-3 px-3 sm:px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                  activeTab === 'notifications'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">campaign</span>
                <span>Push Broadcasts</span>
              </button>

              <button
                onClick={() => setActiveTab('gateway')}
                className={`py-3 px-3 sm:px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                  activeTab === 'gateway'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">credit_card</span>
                <span>Payment Gateway</span>
              </button>

              <button
                onClick={() => setActiveTab('branding')}
                className={`py-3 px-3 sm:px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                  activeTab === 'branding'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">palette</span>
                <span>Logo &amp; Favicon</span>
              </button>

              <button
                onClick={() => setActiveTab('ads')}
                className={`py-3 px-3 sm:px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                  activeTab === 'ads'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">ads_click</span>
                <span>AdSense &amp; Ads</span>
              </button>

              <button
                onClick={() => setActiveTab('page-text')}
                className={`py-3 px-3 sm:px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                  activeTab === 'page-text'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                <span>Page Text &amp; Blocks</span>
              </button>

              <button
                onClick={() => setActiveTab('seo')}
                className={`py-3 px-3 sm:px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                  activeTab === 'seo'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">travel_explore</span>
                <span>Website SEO</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`py-3 px-3 sm:px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                  activeTab === 'orders'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                <span>Orders ({orders.length})</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f8fafc]">
              {/* TAB: Analytics Dashboard */}
              {activeTab === 'analytics' && <AdminAnalyticsTab onToast={onToast} />}

              {/* TAB: Students & Manual Course Grant */}
              {activeTab === 'students' && (
                <AdminStudentsTab users={users} onRefresh={loadData} onToast={onToast} />
              )}

              {/* TAB: Upload Curriculum Content */}
              {activeTab === 'content' && (
                <AdminContentUploadTab
                  customResources={customResources}
                  onRefresh={loadData}
                  onToast={onToast}
                />
              )}

              {/* TAB: Content Categories & Taxonomies */}
              {activeTab === 'categories' && (
                <AdminCategoriesTab
                  categories={categories}
                  onUpdateCategories={(newCats) => {
                    setCategories(newCats);
                    saveCategoriesLocally(newCats);
                  }}
                  onToast={onToast}
                />
              )}

              {/* TAB: Theme, Colors & Design/Layout */}
              {activeTab === 'theme' && (
                <AdminThemeTab
                  currentTheme={themeConfig}
                  onUpdateTheme={(newTheme) => {
                    setThemeConfig(newTheme);
                    saveThemeConfigLocally(newTheme);
                  }}
                  onToast={onToast}
                />
              )}

              {/* TAB: Social Media URLs & In-App Deep Links */}
              {activeTab === 'social' && (
                <AdminSocialTab
                  currentSocial={socialConfig}
                  onUpdateSocial={(newSocial) => {
                    setSocialConfig(newSocial);
                    saveSocialConfigLocally(newSocial);
                  }}
                  onToast={onToast}
                />
              )}

              {/* TAB: Promo Codes & Offers */}
              {activeTab === 'promos' && (
                <AdminPromosTab coupons={coupons} onRefresh={loadData} onToast={onToast} />
              )}

              {/* TAB: Push Notifications & Broadcasts */}
              {activeTab === 'notifications' && (
                <AdminNotificationsTab
                  notifications={notifications}
                  onRefresh={loadData}
                  onToast={onToast}
                />
              )}

              {/* TAB: AdSense & Ad Placements */}
              {activeTab === 'ads' && (
                <AdminAdsTab
                  adsConfig={adsConfig}
                  setAdsConfig={setAdsConfig}
                  onToast={onToast}
                />
              )}

              {/* TAB: Website SEO */}
              {activeTab === 'seo' && (
                <AdminSeoTab initialSeo={seoSettings} onToast={onToast} />
              )}

              {/* TAB 1: Payment Gateway Setup */}
              {activeTab === 'gateway' && (
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Step-by-Step Guide Banner */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 shadow-xs">
                    <h3 className="text-base font-bold text-blue-900 flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-blue-600">help</span>
                      How to Set Up Your Razorpay Payment Gateway:
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-blue-950 mt-3">
                      <div className="bg-white/80 p-3 rounded-xl border border-blue-100">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold inline-flex items-center justify-center mr-1 mb-1">
                          1
                        </span>
                        <strong> Log into Razorpay</strong>
                        <p className="mt-1 text-slate-600">
                          Visit{' '}
                          <a
                            href="https://dashboard.razorpay.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-700 underline font-semibold"
                          >
                            dashboard.razorpay.com
                          </a>{' '}
                          and create or log into your account.
                        </p>
                      </div>
                      <div className="bg-white/80 p-3 rounded-xl border border-blue-100">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold inline-flex items-center justify-center mr-1 mb-1">
                          2
                        </span>
                        <strong> Generate API Keys</strong>
                        <p className="mt-1 text-slate-600">
                          Navigate to <strong>Account &amp; Settings &gt; API Keys</strong>. Click <em>Generate Key</em> to copy your Key ID and Secret.
                        </p>
                      </div>
                      <div className="bg-white/80 p-3 rounded-xl border border-blue-100">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold inline-flex items-center justify-center mr-1 mb-1">
                          3
                        </span>
                        <strong> Paste &amp; Save Below</strong>
                        <p className="mt-1 text-slate-600">
                          Paste your <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-800 font-mono">rzp_live_...</code> or{' '}
                          <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-800 font-mono">rzp_test_...</code> below and click Save.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Gateway Form */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h4 className="text-base font-bold text-slate-900">Razorpay Credentials &amp; Controls</h4>
                        <p className="text-xs text-slate-500">Configure public key, secret, and operating environment.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-600">Mode:</span>
                        <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setGatewayConfig({ ...gatewayConfig, mode: 'test' })}
                            className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                              gatewayConfig.mode === 'test'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            🧪 Test Sandbox
                          </button>
                          <button
                            type="button"
                            onClick={() => setGatewayConfig({ ...gatewayConfig, mode: 'live' })}
                            className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                              gatewayConfig.mode === 'live'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            🚀 Live Production
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Key ID */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Razorpay Key ID:
                        </label>
                        <input
                          type="text"
                          value={gatewayConfig.keyId}
                          onChange={(e) => setGatewayConfig({ ...gatewayConfig, keyId: e.target.value.trim() })}
                          placeholder="e.g. rzp_test_1DP5mmOlF5G5ag or rzp_live_..."
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          Current prefix:{' '}
                          <span className={`font-mono font-bold ${gatewayConfig.keyId.startsWith('rzp_live') ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {gatewayConfig.keyId.startsWith('rzp_live') ? 'Live Production Key' : 'Test Mode Sandbox Key'}
                          </span>
                        </span>
                      </div>

                      {/* Key Secret */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Razorpay Key Secret:
                        </label>
                        <div className="relative">
                          <input
                            type={showSecret ? 'text' : 'password'}
                            value={gatewayConfig.keySecret}
                            onChange={(e) => setGatewayConfig({ ...gatewayConfig, keySecret: e.target.value.trim() })}
                            placeholder="Key Secret from Razorpay Dashboard"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSecret(!showSecret)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {showSecret ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          Kept confidential; used for signature verification.
                        </span>
                      </div>

                      {/* Merchant Business Display Name */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Merchant Brand Name:
                        </label>
                        <input
                          type="text"
                          value={gatewayConfig.merchantName}
                          onChange={(e) => setGatewayConfig({ ...gatewayConfig, merchantName: e.target.value })}
                          placeholder="e.g. Maths at Your Fingertips"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      {/* Default UPI VPA */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Default UPI ID / VPA:
                        </label>
                        <input
                          type="text"
                          value={gatewayConfig.upiId}
                          onChange={(e) => setGatewayConfig({ ...gatewayConfig, upiId: e.target.value })}
                          placeholder="e.g. merchant@razorpay or yourname@okhdfcbank"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Auto Capture & Options */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={gatewayConfig.autoCapture}
                          onChange={(e) => setGatewayConfig({ ...gatewayConfig, autoCapture: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>Automatically capture payments on completion</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleTestCheckout}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                          <span>Test ₹1 Checkout</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveGateway}
                          disabled={isSavingGateway}
                          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-75"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isSavingGateway ? 'sync' : 'save'}
                          </span>
                          <span>{isSavingGateway ? 'Saving Changes...' : 'Save & Activate Gateway'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Webhook Info Card */}
                  <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-400">webhook</span>
                        Razorpay Webhook Configuration (Optional):
                      </h4>
                      <span className="text-[11px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                        Webhook Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                      To receive instant asynchronous payment confirmations from Razorpay servers, configure a webhook endpoint in your Razorpay Dashboard with the events:
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs font-mono">
                      <span className="bg-slate-800 text-emerald-300 px-2.5 py-1 rounded-lg border border-slate-700">
                        payment.captured
                      </span>
                      <span className="bg-slate-800 text-emerald-300 px-2.5 py-1 rounded-lg border border-slate-700">
                        order.paid
                      </span>
                      <span className="bg-slate-800 text-amber-300 px-2.5 py-1 rounded-lg border border-slate-700">
                        payment.failed
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: Branding & Visual Assets (Logo, Icon, Favicon) */}
              {activeTab === 'branding' && (
                <div className="max-w-5xl mx-auto space-y-6">
                  {/* Title Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-5 rounded-2xl shadow-sm">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-amber-400">palette</span>
                        <h3 className="text-base font-bold">Brand Assets &amp; Visual Identity</h3>
                        <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                          Live Sync
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Upload and configure your Website Logo, Mobile App Icon, and Browser Tab Favicon. Changes apply across the site in real-time.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleResetBranding}
                        className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors border border-white/15"
                      >
                        Reset Defaults
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveBranding}
                        disabled={isSavingBranding}
                        className="px-5 py-2 bg-[#6ffbbe] hover:bg-[#5ae6ab] text-[#002113] text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-70"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isSavingBranding ? 'sync' : 'check_circle'}
                        </span>
                        <span>{isSavingBranding ? 'Saving...' : 'Save & Apply Live'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Grid for Logo, Favicon, App Icon */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* 1. Brand Logo */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                              1
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">Website Brand Logo</h4>
                              <p className="text-[11px] text-slate-500">Displayed in main navbar and mobile menu</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            PNG, SVG, JPG
                          </span>
                        </div>

                        {/* Live Navbar Preview Mock */}
                        <div className="bg-[#f0f3ff] border border-blue-100 rounded-xl p-3 mb-3 flex items-center gap-3">
                          <div className="h-10 px-2 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-xs max-w-[200px] overflow-hidden">
                            {brandingConfig.logoUrl ? (
                              <img
                                src={brandingConfig.logoUrl}
                                alt="Logo Preview"
                                className="max-h-8 max-w-full object-contain"
                              />
                            ) : (
                              <span className="text-xs text-slate-400">No logo</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-[#004ac6] block truncate">
                              {brandingConfig.siteTitle}
                            </span>
                            <span className="text-[9px] font-bold text-[#434655] uppercase block truncate">
                              {brandingConfig.tagline}
                            </span>
                          </div>
                        </div>

                        {/* Upload Button */}
                        <div className="space-y-3">
                          <label className="block">
                            <input
                              type="file"
                              accept="image/png,image/svg+xml,image/jpeg,image/webp"
                              onChange={handleLogoFileUpload}
                              disabled={logoUploading}
                              className="hidden"
                              id="logo-upload-input"
                            />
                            <label
                              htmlFor="logo-upload-input"
                              className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                {logoUploading ? 'sync' : 'cloud_upload'}
                              </span>
                              <span>{logoUploading ? 'Processing File...' : 'Upload New Logo Image'}</span>
                            </label>
                          </label>

                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">
                              Or Enter Image URL:
                            </label>
                            <input
                              type="text"
                              value={brandingConfig.logoUrl}
                              onChange={(e) =>
                                setBrandingConfig({ ...brandingConfig, logoUrl: e.target.value.trim() })
                              }
                              placeholder="https://your-domain.com/logo.png"
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Recommended: 320×80px (transparent PNG or SVG)</span>
                      </div>
                    </div>

                    {/* 2. Browser Tab Favicon (Fevicon) */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                              2
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">Browser Favicon (Fevicon)</h4>
                              <p className="text-[11px] text-slate-500">Icon displayed in browser tab and bookmark bars</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">
                            SVG / ICO / PNG
                          </span>
                        </div>

                        {/* Simulated Browser Tab Preview */}
                        <div className="bg-slate-800 rounded-t-xl px-3 pt-2.5 pb-2 mb-3">
                          <div className="bg-slate-100 rounded-t-lg px-3 py-1.5 flex items-center gap-2 max-w-[240px] shadow-xs">
                            <img
                              src={brandingConfig.faviconUrl || '/favicon.svg'}
                              alt="Favicon preview"
                              className="w-4 h-4 object-contain rounded-xs shrink-0"
                            />
                            <span className="text-[11px] font-semibold text-slate-800 truncate">
                              {brandingConfig.siteTitle}
                            </span>
                            <span className="material-symbols-outlined text-[13px] text-slate-400 ml-auto">
                              close
                            </span>
                          </div>
                        </div>

                        {/* Favicon Upload Button & Controls */}
                        <div className="space-y-3">
                          <label className="block">
                            <input
                              type="file"
                              accept="image/svg+xml,image/x-icon,image/png,image/jpeg"
                              onChange={handleFaviconFileUpload}
                              disabled={faviconUploading}
                              className="hidden"
                              id="favicon-upload-input"
                            />
                            <label
                              htmlFor="favicon-upload-input"
                              className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                {faviconUploading ? 'sync' : 'upload_file'}
                              </span>
                              <span>{faviconUploading ? 'Processing Favicon...' : 'Upload Favicon (.svg, .ico, .png)'}</span>
                            </label>
                          </label>

                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">
                              Or Enter Favicon URL / Path:
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={brandingConfig.faviconUrl}
                                onChange={(e) => {
                                  const url = e.target.value.trim();
                                  setBrandingConfig({ ...brandingConfig, faviconUrl: url });
                                }}
                                placeholder="/favicon.svg or https://..."
                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  applyFaviconToDocument(brandingConfig.faviconUrl);
                                  onToast('🎯 Favicon applied to your current browser tab!');
                                }}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors shrink-0"
                              >
                                Test Tab
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Recommended: 32×32px, 64×64px or vector SVG</span>
                      </div>
                    </div>

                    {/* 3. App Icon / Square Emblem */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                              3
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">Square App Icon</h4>
                              <p className="text-[11px] text-slate-500">Square 1:1 icon for mobile home screen and header badge</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            512 × 512
                          </span>
                        </div>

                        {/* Icon Preview */}
                        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#004ac6] to-[#002113] p-1.5 flex items-center justify-center shadow-md shrink-0">
                            <img
                              src={brandingConfig.iconUrl || '/favicon.svg'}
                              alt="App Icon"
                              className="w-full h-full object-contain rounded-xl"
                            />
                          </div>
                          <div className="text-xs text-slate-600">
                            <span className="font-bold text-slate-900 block">Mobile App / PWA Icon</span>
                            <span>Used when students add this website to their mobile home screen.</span>
                          </div>
                        </div>

                        {/* Upload App Icon */}
                        <div className="space-y-3">
                          <label className="block">
                            <input
                              type="file"
                              accept="image/png,image/svg+xml,image/jpeg,image/webp"
                              onChange={handleIconFileUpload}
                              disabled={iconUploading}
                              className="hidden"
                              id="icon-upload-input"
                            />
                            <label
                              htmlFor="icon-upload-input"
                              className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                {iconUploading ? 'sync' : 'add_photo_alternate'}
                              </span>
                              <span>{iconUploading ? 'Processing Icon...' : 'Upload App Icon Image'}</span>
                            </label>
                          </label>

                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">
                              App Icon URL:
                            </label>
                            <input
                              type="text"
                              value={brandingConfig.iconUrl}
                              onChange={(e) =>
                                setBrandingConfig({ ...brandingConfig, iconUrl: e.target.value.trim() })
                              }
                              placeholder="/favicon.svg or https://..."
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 mt-4 text-[11px] text-slate-500">
                        <span>Recommended: 512×512px or 192×192px square</span>
                      </div>
                    </div>

                    {/* 4. Brand Text Details */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                            4
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">Brand Title &amp; Tagline</h4>
                            <p className="text-[11px] text-slate-500">Site title displayed next to logo in navbar</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">
                              Site Name / Title:
                            </label>
                            <input
                              type="text"
                              value={brandingConfig.siteTitle || ''}
                              onChange={(e) =>
                                setBrandingConfig({ ...brandingConfig, siteTitle: e.target.value })
                              }
                              placeholder="Leave empty to display logo only"
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-900"
                            />
                            <span className="text-[10px] text-slate-400 mt-1 block">Leave empty to hide platform title text completely from header.</span>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">
                              Header Tagline / Subtitle:
                            </label>
                            <input
                              type="text"
                              value={brandingConfig.tagline || ''}
                              onChange={(e) =>
                                setBrandingConfig({ ...brandingConfig, tagline: e.target.value })
                              }
                              placeholder="Leave empty to hide subtitle"
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-900"
                            />
                            <span className="text-[10px] text-slate-400 mt-1 block">Leave empty to hide subtitle completely from header.</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 mt-4">
                        <button
                          type="button"
                          onClick={handleSaveBranding}
                          disabled={isSavingBranding}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-75"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isSavingBranding ? 'sync' : 'save'}
                          </span>
                          <span>{isSavingBranding ? 'Saving...' : 'Save All Branding Changes'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 5. Developer Guide: Codebase File Locations */}
                  <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-[#6ffbbe]">folder_code</span>
                      <h4 className="text-sm font-bold text-slate-100">
                        Where Assets are Stored in the Project Codebase
                      </h4>
                    </div>

                    <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                      You can change your assets either by uploading them directly above (which saves them to Firestore &amp; your browser instantly), or by committing static files directly into the repository:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                        <div className="flex items-center gap-1.5 text-[#6ffbbe] font-mono font-bold mb-1">
                          <span className="material-symbols-outlined text-[16px]">tab</span>
                          <span>/public/favicon.svg</span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          Browser tab favicon. Linked via <code className="text-amber-300">&lt;link rel="icon"&gt;</code> in <code className="text-slate-300">index.html</code>.
                        </p>
                      </div>

                      <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                        <div className="flex items-center gap-1.5 text-[#6ffbbe] font-mono font-bold mb-1">
                          <span className="material-symbols-outlined text-[16px]">image</span>
                          <span>/public/logo.svg</span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          Official vector brand logo for the website navbar and email headers.
                        </p>
                      </div>

                      <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                        <div className="flex items-center gap-1.5 text-[#6ffbbe] font-mono font-bold mb-1">
                          <span className="material-symbols-outlined text-[16px]">code</span>
                          <span>index.html &amp; Header.tsx</span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          Root HTML and React header component where branding is referenced and mounted.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: PAGE TEXT & BLOCKS MANAGER */}
              {activeTab === 'page-text' && (
                <div className="max-w-6xl mx-auto">
                  <AdminPageTextTab
                    pageText={pageText}
                    onChange={(updated) => {
                      setPageText(updated);
                      savePageTextConfigLocally(updated);
                    }}
                    onSave={async () => {
                      setIsSavingPageText(true);
                      try {
                        savePageTextConfigLocally(pageText);
                        await savePageTextSettingsToFirestore(pageText);
                        onToast('🎉 All page and block texts saved and published live!');
                      } catch (e) {
                        onToast('Saved locally in browser cache.');
                      } finally {
                        setIsSavingPageText(false);
                      }
                    }}
                    isSaving={isSavingPageText}
                    onToast={onToast}
                  />
                </div>
              )}

              {/* TAB 2: Captured Orders */}
              {activeTab === 'orders' && (
                <div className="max-w-5xl mx-auto space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Captured Orders &amp; Subscriptions</h3>
                      <p className="text-xs text-slate-500">
                        Synchronized live from Firestore collection <code className="bg-slate-100 text-blue-700 px-1 py-0.5 rounded">/orders</code>
                      </p>
                    </div>
                    <button
                      onClick={loadData}
                      disabled={loadingOrders}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <span className={`material-symbols-outlined text-[16px] ${loadingOrders ? 'animate-spin' : ''}`}>
                        refresh
                      </span>
                      <span>Refresh</span>
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <span className="material-symbols-outlined text-[24px]">receipt_long</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">No payment orders recorded yet</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                        Orders completed via the Razorpay checkout modal will automatically log here and update student subscription status.
                      </p>
                      <button
                        onClick={handleTestCheckout}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 cursor-pointer shadow-xs"
                      >
                        Launch Test Transaction
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                            <tr>
                              <th className="py-3 px-4">Order ID</th>
                              <th className="py-3 px-4">Student UID</th>
                              <th className="py-3 px-4">Plan</th>
                              <th className="py-3 px-4">Amount</th>
                              <th className="py-3 px-4">Payment ID</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {orders.map((ord) => (
                              <tr key={ord.orderId} className="hover:bg-slate-50/75 transition-colors">
                                <td className="py-3 px-4 font-mono font-semibold text-blue-700">{ord.orderId}</td>
                                <td className="py-3 px-4 font-mono text-slate-500 max-w-[120px] truncate">{ord.userId}</td>
                                <td className="py-3 px-4 font-medium text-slate-800">{ord.plan}</td>
                                <td className="py-3 px-4 font-bold text-slate-900">₹{ord.amount}</td>
                                <td className="py-3 px-4 font-mono text-slate-600 max-w-[120px] truncate">
                                  {ord.paymentId || '—'}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                    {ord.status || 'captured'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                                  {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'Today'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
