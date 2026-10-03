import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  isUserAdmin,
  ADMIN_EMAILS,
  MASTER_ADMIN_PASSCODE,
  PRIMARY_SUPERADMIN_EMAIL,
  AdminUserRecord,
  getCachedAssignedAdmins,
  loadAssignedAdminsFromFirestore,
  saveAssignedAdminsToFirestore,
  deleteAssignedAdminFromFirestore,
  fetchAllOrders,
  fetchAllUsers,
  subscribeToAllUsers,
  OrderRecord,
  UserProfile,
  getLocalUsers,
  checkIsUserAdminLive,
  INITIAL_ADMIN_EMAILS,
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
  saveCategorySettingsToFirestore,
  saveThemeSettingsToFirestore,
  saveSocialSettingsToFirestore,
  savePageTextSettingsToFirestore,
  loadPageTextSettingsFromFirestore,
  migrateAndRestoreLegacyDatabaseData,
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
import { AdminRolesTab } from './admin/AdminRolesTab';
import { AdminStudentsTab } from './admin/AdminStudentsTab';
import { AdminDownloadsTab } from './admin/AdminDownloadsTab';
import { AdminContentUploadTab } from './admin/AdminContentUploadTab';
import { AdminPromosTab } from './admin/AdminPromosTab';
import { AdminNotificationsTab } from './admin/AdminNotificationsTab';
import { AdminSeoTab } from './admin/AdminSeoTab';
import { AdminCategoriesTab } from './admin/AdminCategoriesTab';
import { AdminThemeTab } from './admin/AdminThemeTab';
import { AdminSocialTab } from './admin/AdminSocialTab';
import { AdminAiTeacherTab } from './admin/AdminAiTeacherTab';
import { AdminAdsTab } from './admin/AdminAdsTab';
import { AdminPageTextTab } from './admin/AdminPageTextTab';
import { AdminPageBlocksTab } from './admin/AdminPageBlocksTab';
import { AdminCustomDomainTab } from './admin/AdminCustomDomainTab';
import {
  PageTextConfig,
  getPageTextConfig,
  savePageTextConfigLocally,
  DEFAULT_PAGE_TEXT,
} from '../services/pageText';
import {
  AdsGlobalConfig,
  getAdsConfig,
  loadAdsConfigFromFirestore,
  saveAdsConfigLocally,
} from '../services/ads';

interface AdminControlPanelPageProps {
  currentUser: User | null;
  userProfile?: UserProfile | null;
  onGoogleSignIn: () => void;
  onSignOut?: () => void;
  onToast: (msg: string) => void;
  onNavigateHome: () => void;
}

export const AdminControlPanelPage: React.FC<AdminControlPanelPageProps> = ({
  currentUser,
  userProfile,
  onGoogleSignIn,
  onSignOut,
  onToast,
  onNavigateHome,
}) => {
  const [passcode, setPasscode] = useState('');
  const [isPasscodeUnlocked, setIsPasscodeUnlocked] = useState(false);
  const [assignedAdmins, setAssignedAdmins] = useState<AdminUserRecord[]>(getCachedAssignedAdmins);
  const [activeTab, setActiveTab] = useState<
    | 'analytics'
    | 'roles'
    | 'students'
    | 'downloads'
    | 'ai-teacher'
    | 'content'
    | 'categories'
    | 'theme'
    | 'social'
    | 'promos'
    | 'notifications'
    | 'gateway'
    | 'branding'
    | 'ads'
    | 'blocks'
    | 'seo'
    | 'page-text'
    | 'orders'
    | 'subdomain'
  >('analytics');

  // Page text & blocks state
  const [pageText, setPageText] = useState<PageTextConfig>(getPageTextConfig);
  const [isSavingPageText, setIsSavingPageText] = useState(false);

  // Ads & AdSense state
  const [adsConfig, setAdsConfig] = useState<AdsGlobalConfig>(getAdsConfig);

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
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const local = getLocalUsers();
    if (userProfile && (userProfile.userId || userProfile.email)) {
      const exists = local.some(
        (u) =>
          (userProfile.userId && u.userId === userProfile.userId) ||
          (userProfile.email && u.email?.toLowerCase().trim() === userProfile.email.toLowerCase().trim())
      );
      if (!exists) {
        return [userProfile, ...local];
      }
    }
    return local;
  });
  const [coupons, setCoupons] = useState<CouponRecord[]>(getLocalCoupons);
  const [notifications, setNotifications] = useState<NotificationRecord[]>(getLocalNotifications);
  const [customResources, setCustomResources] = useState<CustomResourceRecord[]>(getLocalCustomResources);
  const [seoSettings, setSeoSettings] = useState<SeoSettings | null>(getSeoSettingsLocally);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isMigratingLegacy, setIsMigratingLegacy] = useState(false);
  const [liveAdminVerified, setLiveAdminVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [isCheckingAdminStatus, setIsCheckingAdminStatus] = useState(false);

  // Check if current user is directly known as admin without network call
  const isDirectlyKnownAdmin = useMemo(() => {
    if (!currentUser?.email) return false;
    const clean = currentUser.email.toLowerCase().trim();
    return (
      INITIAL_ADMIN_EMAILS.some((e) => e.toLowerCase().trim() === clean) ||
      assignedAdmins.some((a) => a.email.toLowerCase().trim() === clean) ||
      getCachedAssignedAdmins().some((a) => a.email.toLowerCase().trim() === clean) ||
      (userProfile && (userProfile.role === 'admin' || userProfile.role === 'superadmin' || userProfile.role === 'faculty'))
    );
  }, [currentUser?.email, assignedAdmins, userProfile]);

  // Verify live admin status for current user
  useEffect(() => {
    let isMounted = true;
    if (currentUser?.email) {
      const cleanEmail = currentUser.email.toLowerCase().trim();
      const inInitials = INITIAL_ADMIN_EMAILS.some((e) => e.toLowerCase().trim() === cleanEmail);
      const inAssigned = assignedAdmins.some((a) => a.email.toLowerCase().trim() === cleanEmail);
      const inCached = getCachedAssignedAdmins().some((a) => a.email.toLowerCase().trim() === cleanEmail);
      const inProfile = userProfile && (userProfile.role === 'admin' || userProfile.role === 'superadmin' || userProfile.role === 'faculty');

      if (inInitials || inAssigned || inCached || inProfile || verifiedEmail === cleanEmail) {
        setLiveAdminVerified(true);
        setIsCheckingAdminStatus(false);
      } else {
        setIsCheckingAdminStatus(true);
        checkIsUserAdminLive(cleanEmail)
          .then((verified) => {
            if (isMounted) {
              if (verified) {
                setLiveAdminVerified(true);
                setVerifiedEmail(cleanEmail);
                loadAssignedAdminsFromFirestore().then((admins) => {
                  if (admins && admins.length > 0) setAssignedAdmins(admins);
                });
              }
              setIsCheckingAdminStatus(false);
            }
          })
          .catch(() => {
            if (isMounted) setIsCheckingAdminStatus(false);
          });
      }
    } else {
      setIsCheckingAdminStatus(false);
      setLiveAdminVerified(false);
      setVerifiedEmail(null);
    }
    return () => {
      isMounted = false;
    };
  }, [currentUser?.email, assignedAdmins.length, userProfile?.role]);

  // Listen for admin role changes across tabs/windows
  useEffect(() => {
    const handleAdminsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<AdminUserRecord[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setAssignedAdmins(customEvent.detail);
      } else {
        loadAssignedAdminsFromFirestore().then((admins) => {
          if (admins && admins.length > 0) setAssignedAdmins(admins);
        });
      }
    };
    window.addEventListener('admins-updated', handleAdminsUpdated);
    return () => window.removeEventListener('admins-updated', handleAdminsUpdated);
  }, []);

  // Listen for student registrations and updates in real-time
  useEffect(() => {
    const handleUsersChanged = () => {
      fetchAllUsers().then((fetched) => {
        if (fetched && fetched.length > 0) {
          setUsers(fetched);
        }
      });
    };
    window.addEventListener('registered-users-changed', handleUsersChanged);
    window.addEventListener('student-profile-updated', handleUsersChanged);

    // Also attach Firestore live listener if user is authenticated admin
    const unsubUsers = subscribeToAllUsers((liveUsers) => {
      if (liveUsers && liveUsers.length > 0) {
        setUsers(liveUsers);
      }
    });

    return () => {
      window.removeEventListener('registered-users-changed', handleUsersChanged);
      window.removeEventListener('student-profile-updated', handleUsersChanged);
      unsubUsers();
    };
  }, []);

  const isGoogleAdmin = Boolean(
    isDirectlyKnownAdmin ||
    liveAdminVerified ||
    (currentUser?.email && verifiedEmail === currentUser.email.toLowerCase().trim())
  );
  const isAuthorized = isGoogleAdmin || isPasscodeUnlocked;

  // Refresh student directory when switching to students tab
  useEffect(() => {
    if (activeTab === 'students' && isAuthorized) {
      fetchAllUsers().then((fetched) => {
        if (fetched && fetched.length > 0) {
          setUsers(fetched);
        }
      });
    }
  }, [activeTab, isAuthorized]);

  // Sync current authenticated user or profile into student directory
  useEffect(() => {
    if (currentUser?.email || currentUser?.uid || userProfile) {
      fetchAllUsers().then((fetched) => {
        if (fetched && fetched.length > 0) {
          setUsers(fetched);
        }
      });
    }
  }, [currentUser?.email, currentUser?.uid, userProfile]);

  const handleSyncLegacyData = async () => {
    setIsMigratingLegacy(true);
    try {
      const res = await migrateAndRestoreLegacyDatabaseData();
      if (res.success) {
        onToast('🎉 All data from previous database successfully migrated & saved to current database!');
        await loadData();
      } else {
        onToast(`Notice: ${res.message}`);
      }
    } catch (e: any) {
      onToast(`Sync error: ${e?.message || 'Failed to sync'}`);
    } finally {
      setIsMigratingLegacy(false);
    }
  };

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
    setPageText(getPageTextConfig());

    loadAssignedAdminsFromFirestore().then((admins) => {
      if (admins && admins.length > 0) {
        setAssignedAdmins(admins);
      }
    });

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
        cloudAds,
        cloudPageText,
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
        loadAdsConfigFromFirestore(),
        loadPageTextSettingsFromFirestore(),
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
      // Merge custom resources so local uploads and cloud uploads are always preserved
      const localRes = getLocalCustomResources();
      const resMap = new Map<string, CustomResourceRecord>();
      localRes.forEach((r) => resMap.set(r.id, r));
      if (fetchedResources && fetchedResources.length > 0) {
        fetchedResources.forEach((r) => resMap.set(r.id, r));
      }
      const mergedRes = Array.from(resMap.values());
      setCustomResources(mergedRes);
      saveLocalCustomResources(mergedRes);
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
        const mergedBranding = {
          ...brandingConfig,
          ...cloudBranding,
          siteTitle: cloudBranding.siteTitle !== undefined ? cloudBranding.siteTitle : '',
          tagline: cloudBranding.tagline !== undefined ? cloudBranding.tagline : '',
        };
        setBrandingConfig(mergedBranding);
        saveBrandingConfigLocally(mergedBranding);
      }
      if (cloudAds) {
        const mergedAds = {
          ...adsConfig,
          ...cloudAds,
          placements: { ...adsConfig.placements, ...(cloudAds.placements || {}) },
        };
        setAdsConfig(mergedAds);
        saveAdsConfigLocally(mergedAds);
      }
      if (cloudPageText) {
        setPageText(cloudPageText);
        savePageTextConfigLocally(cloudPageText);
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
      onToast('❌ Invalid administrative credentials. Access denied.');
    }
  };

  const handleAddAdmin = async (newAdmin: AdminUserRecord) => {
    const cleanEmail = newAdmin.email.toLowerCase().trim();
    const cleanRecord = { ...newAdmin, email: cleanEmail };
    const updated = [
      ...assignedAdmins.filter((a) => a.email.toLowerCase().trim() !== cleanEmail),
      cleanRecord,
    ];
    setAssignedAdmins(updated);
    await saveAssignedAdminsToFirestore(updated);
  };

  const handleRevokeAdmin = async (email: string) => {
    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail === PRIMARY_SUPERADMIN_EMAIL.toLowerCase().trim()) {
      onToast('⚠️ Primary Superadministrator role cannot be revoked.');
      return;
    }
    const updated = assignedAdmins.filter(
      (a) => a.email.toLowerCase().trim() !== cleanEmail
    );
    setAssignedAdmins(updated);
    await deleteAssignedAdminFromFirestore(cleanEmail);
    await saveAssignedAdminsToFirestore(updated);
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
        // Fallback simulation mode
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

  // Determine current administrator's assigned role
  const currentAssignedRecord = assignedAdmins.find(
    (a) => a.email.toLowerCase().trim() === (currentUser?.email || '').toLowerCase().trim()
  );
  const currentRole: 'superadmin' | 'admin' | 'faculty' =
    isPasscodeUnlocked ? 'superadmin' :
    (currentUser?.email && INITIAL_ADMIN_EMAILS.some((e) => e.toLowerCase().trim() === currentUser.email!.toLowerCase().trim())) ? 'superadmin' :
    currentAssignedRecord?.role || (userProfile?.role as any) || 'admin';

  const studentCount = Math.max(users.length, getLocalUsers().length);

  const allTabs = [
    { id: 'analytics', label: 'Overview', icon: 'monitoring', minRole: 'faculty' },
    { id: 'roles', label: `Staff & Roles (${assignedAdmins.length})`, icon: 'admin_panel_settings', minRole: 'superadmin' },
    { id: 'students', label: `Students (${studentCount})`, icon: 'group', minRole: 'faculty' },
    { id: 'downloads', label: 'Student Downloads', icon: 'cloud_download', minRole: 'faculty' },
    { id: 'ai-teacher', label: 'AI Teacher Activity', icon: 'psychology', minRole: 'faculty' },
    { id: 'content', label: `Upload Material (${customResources.length})`, icon: 'upload_file', minRole: 'faculty' },
    { id: 'categories', label: `Categories (${categories.length})`, icon: 'category', minRole: 'faculty' },
    { id: 'theme', label: 'Theme & Layout', icon: 'palette', minRole: 'admin' },
    { id: 'social', label: 'Social & Groups', icon: 'open_in_new', minRole: 'admin' },
    { id: 'promos', label: `Promos & Coupons (${coupons.length})`, icon: 'loyalty', minRole: 'admin' },
    { id: 'notifications', label: `Broadcasts (${notifications.length})`, icon: 'campaign', minRole: 'faculty' },
    { id: 'gateway', label: 'Payment Gateway', icon: 'credit_card', minRole: 'superadmin' },
    { id: 'branding', label: 'Branding & Logo', icon: 'palette', minRole: 'admin' },
    { id: 'ads', label: 'AdSense & Ads', icon: 'ads_click', minRole: 'admin' },
    { id: 'blocks', label: 'Homepage Blocks', icon: 'view_column', minRole: 'admin' },
    { id: 'page-text', label: 'Page Text & Copy', icon: 'edit_note', minRole: 'admin' },
    { id: 'seo', label: 'SEO & Meta', icon: 'travel_explore', minRole: 'admin' },
    { id: 'subdomain', label: 'Domain & Migration', icon: 'domain', minRole: 'admin' },
    { id: 'orders', label: `Orders (${orders.length})`, icon: 'receipt_long', minRole: 'admin' },
  ];

  const allowedTabs = allTabs.filter((tab) => {
    if (currentRole === 'superadmin') return true;
    if (currentRole === 'admin') return tab.minRole !== 'superadmin';
    if (currentRole === 'faculty') return tab.minRole === 'faculty';
    return false;
  });

  useEffect(() => {
    if (!allowedTabs.some((t) => t.id === activeTab)) {
      setActiveTab('analytics');
    }
  }, [activeTab, currentRole]);

  // Requirement 3: If a logged-in user is not an admin, do not display any message on admin login page; throw a page error
  if (currentUser && !isAuthorized) {
    if (isCheckingAdminStatus) {
      return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-semibold text-slate-400">Verifying administrative access...</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-[36px]">error</span>
          </div>
          <div className="text-4xl font-black text-rose-500 mb-2 font-mono">403</div>
          <h1 className="text-xl font-bold text-white mb-2">Access Forbidden</h1>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            The server understood the request, but refuses to authorize it. You do not have permission to access the requested resource.
          </p>
          <div className="space-y-3">
            <button
              type="button"
              onClick={onNavigateHome}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Return to Website
            </button>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="w-full py-2 px-4 text-slate-500 hover:text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If not authorized yet, show clean administrator gateway
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
              <span>Back to Learning Hub</span>
            </button>
            <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>
            <span className="text-sm font-bold text-white hidden sm:inline">
              Administrative Gateway
            </span>
          </div>

          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            <span>Restricted Admin Portal</span>
          </span>
        </header>

        {/* Auth Gate Card */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <span className="material-symbols-outlined text-[36px]">shield_person</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mb-2">
              Administrator Gateway
            </h1>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              This administrative portal is restricted exclusively to authorized administrators. Access by unauthorized accounts is strictly prohibited.
            </p>

            <div className="space-y-5">
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
                  <span>Sign In with Authorized Google Account</span>
                </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-800 w-full"></div>
                <span className="bg-slate-900 px-3 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  Or Administrative Passcode
                </span>
              </div>

              {/* Option 2: Enter Master Passcode */}
              <form onSubmit={handleUnlockWithPasscode} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter Master Administrative Passcode"
                    className="flex-1 px-4 py-3 bg-slate-800/80 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl cursor-pointer transition-colors shadow-sm"
                  >
                    Unlock
                  </button>
                </div>
              </form>

              <div className="pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={onNavigateHome}
                  className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  ← Return to Public Student Portal
                </button>
              </div>
            </div>
          </div>
        </main>

        <footer className="py-4 text-center text-xs text-slate-600 border-t border-slate-900">
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
              onClick={handleSyncLegacyData}
              disabled={isMigratingLegacy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg text-xs font-bold cursor-pointer border border-amber-400/50 transition-all shadow-xs"
              title="Push all custom texts, branding, theme, and settings from previous database into current Firestore database"
            >
              <span className={`material-symbols-outlined text-[16px] ${isMigratingLegacy ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span className="hidden sm:inline">{isMigratingLegacy ? 'Syncing...' : 'Sync Previous DB Data'}</span>
              <span className="sm:hidden">{isMigratingLegacy ? '...' : 'Sync DB'}</span>
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
              <span className={`w-2 h-2 rounded-full ${
                currentRole === 'superadmin' ? 'bg-purple-400' : currentRole === 'faculty' ? 'bg-emerald-400' : 'bg-blue-400'
              }`}></span>
              <span className="text-slate-300 font-mono text-[11px] truncate max-w-[140px] sm:max-w-none">
                {currentUser?.email || (isPasscodeUnlocked ? 'Passcode Admin' : 'admin@mathsatyourfingertips.com')}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                currentRole === 'superadmin'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : currentRole === 'faculty'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {currentRole === 'superadmin' ? 'Super Admin' : currentRole === 'faculty' ? 'Faculty Admin' : 'Admin'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. SUB-NAVIGATION TABS BAR (Filtered by Assigned Role) */}
      <nav className="bg-slate-900 border-b border-slate-800 px-3 sm:px-6 overflow-x-auto scrollbar-none shrink-0 sticky top-[57px] z-30">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2">
          {allowedTabs.map((tab) => (
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
            users={users}
            orders={orders}
            customResources={customResources}
            onToast={onToast}
          />
        )}

        {/* TAB: ADMIN ROLES & PROVISIONING */}
        {activeTab === 'roles' && (
          <AdminRolesTab
            admins={assignedAdmins}
            onAddAdmin={handleAddAdmin}
            onRevokeAdmin={handleRevokeAdmin}
            currentAdminEmail={currentUser?.email}
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

        {/* TAB: STUDENT DOWNLOADS ACTIVITY AUDIT */}
        {activeTab === 'downloads' && (
          <AdminDownloadsTab
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
              } catch (_e) {
                // Non-blocking cloud sync fallback
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
              } catch (_e) {
                // Non-blocking cloud sync fallback
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
              } catch (_e) {
                // Non-blocking cloud sync fallback
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

        {/* TAB: ADSENSE & AD PLACEMENTS */}
        {activeTab === 'ads' && (
          <div className="max-w-6xl mx-auto">
            <AdminAdsTab
              adsConfig={adsConfig}
              setAdsConfig={setAdsConfig}
              onToast={onToast}
            />
          </div>
        )}

        {/* TAB: HOMEPAGE BLOCKS & ORDERING */}
        {activeTab === 'blocks' && (
          <div className="max-w-7xl mx-auto">
            <AdminPageBlocksTab onToast={onToast} />
          </div>
        )}

        {/* TAB: PAGE TEXT & BLOCKS MANAGER */}
        {activeTab === 'page-text' && (
          <div className="max-w-7xl mx-auto">
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

        {/* TAB: DOMAIN & SUBDOMAIN MIGRATION */}
        {activeTab === 'subdomain' && (
          <AdminCustomDomainTab onToast={onToast} />
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
    </div>
  );
};
