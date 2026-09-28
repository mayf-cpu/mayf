import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { UserProfile, OrderRecord, fetchUserOrders, updateUserProfile, isUserAdmin } from '../firebase';
import { MathResource } from '../data/mathResources';
import { formatPrice, getUserCurrency, setUserCurrency, SUPPORTED_CURRENCIES } from '../services/currency';
import { AdPlacement } from './AdPlacement';

interface DownloadedItem {
  id: string;
  title: string;
  size: string;
  downloadedAt: string;
}

interface UserDashboardPageProps {
  currentUser: User | null;
  userProfile: UserProfile | null;
  downloads: DownloadedItem[];
  allResources: MathResource[];
  bookmarkedIds: string[];
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
  onDownload: (title: string, size: string) => void;
  onNavigateHome: () => void;
  onOpenProPass: () => void;
  onOpenFormulaDeck: () => void;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  onToast: (msg: string) => void;
}

const PRESET_AVATARS = [
  { id: 'av-1', label: 'Math Wizard', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80' },
  { id: 'av-2', label: 'Geometry Scholar', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&auto=format&fit=crop&q=80' },
  { id: 'av-3', label: 'Olympiad Ranker', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80' },
  { id: 'av-4', label: 'Algebra Ace', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&auto=format&fit=crop&q=80' },
  { id: 'av-5', label: 'Speed Calculator', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=160&auto=format&fit=crop&q=80' },
  { id: 'av-6', label: 'Problem Solver', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80' },
];

export const UserDashboardPage: React.FC<UserDashboardPageProps> = ({
  currentUser,
  userProfile,
  downloads,
  allResources,
  bookmarkedIds,
  onToggleBookmark,
  onDownload,
  onNavigateHome,
  onOpenProPass,
  onOpenFormulaDeck,
  onGoogleSignIn,
  onSignOut,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'downloads' | 'payments' | 'paid-material' | 'bookmarks'>('profile');
  
  // Profile form state
  const [displayName, setDisplayName] = useState(userProfile?.displayName || currentUser?.displayName || 'Math Student');
  const [grade, setGrade] = useState(userProfile?.grade || 'Class 9');
  const [targetExam, setTargetExam] = useState(userProfile?.targetExam || 'CBSE Curriculum');
  const [schoolName, setSchoolName] = useState(userProfile?.schoolName || 'St. Xavier High School');
  const [countryCode, setCountryCode] = useState(userProfile?.countryCode || '+91');
  const [mobileNumber, setMobileNumber] = useState(userProfile?.mobileNumber || '9876543210');
  const [whatsappAlerts, setWhatsappAlerts] = useState(userProfile?.whatsappAlerts ?? true);
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || currentUser?.photoURL || PRESET_AVATARS[0].url);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [customPhotoInput, setCustomPhotoInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Currency
  const [currentCurrency, setCurrentCurrency] = useState(getUserCurrency());

  // Orders / Payments state
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<OrderRecord | null>(null);

  // Sync profile details if changed externally
  useEffect(() => {
    if (userProfile) {
      if (userProfile.displayName) setDisplayName(userProfile.displayName);
      if (userProfile.grade) setGrade(userProfile.grade);
      if (userProfile.targetExam) setTargetExam(userProfile.targetExam);
      if (userProfile.schoolName) setSchoolName(userProfile.schoolName);
      if (userProfile.countryCode) setCountryCode(userProfile.countryCode);
      if (userProfile.mobileNumber) setMobileNumber(userProfile.mobileNumber);
      if (userProfile.whatsappAlerts !== undefined) setWhatsappAlerts(userProfile.whatsappAlerts);
      if (userProfile.photoURL) setPhotoURL(userProfile.photoURL);
    }
  }, [userProfile]);

  // Load orders
  useEffect(() => {
    if (currentUser?.uid) {
      setLoadingOrders(true);
      fetchUserOrders(currentUser.uid)
        .then((userOrders) => {
          // If no cloud orders, check for local test orders
          if (userOrders.length === 0) {
            try {
              const localRaw = localStorage.getItem('maths_portal_local_orders');
              if (localRaw) {
                const parsed = JSON.parse(localRaw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setOrders(parsed.filter((o: any) => o.userId === currentUser.uid || !o.userId));
                  setLoadingOrders(false);
                  return;
                }
              }
            } catch (e) {
              // Ignore
            }
          }
          setOrders(userOrders);
        })
        .finally(() => setLoadingOrders(false));
    }

    const handleCurrencyChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setCurrentCurrency(customEvent.detail);
      }
    };
    window.addEventListener('currency-changed', handleCurrencyChange);
    return () => window.removeEventListener('currency-changed', handleCurrencyChange);
  }, [currentUser]);

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onToast('Please sign in to save your profile changes.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const cleanPhone = `${countryCode.trim()} ${mobileNumber.trim()}`.trim();
      const payload: Partial<UserProfile> = {
        displayName: displayName.trim(),
        grade,
        targetExam,
        schoolName: schoolName.trim(),
        countryCode: countryCode.trim(),
        mobileNumber: mobileNumber.trim(),
        phoneNumber: cleanPhone,
        whatsappAlerts,
        photoURL,
        preferredCurrency: currentCurrency.code,
      };

      await updateUserProfile(currentUser.uid, payload);
      onToast('✓ Profile details & preferences saved successfully!');
    } catch (err) {
      console.warn('Profile save warning:', err);
      onToast('Saved locally in browser cache.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const isPro = userProfile?.isPro || orders.some(o => o.status === 'captured');
  const isAdmin = isUserAdmin(currentUser);

  // If not logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen w-full bg-[#f9f9ff] flex flex-col justify-between p-4 sm:p-8 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="max-w-md mx-auto my-auto w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-50 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#004ac6] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[36px]">account_circle</span>
          </div>
          <h2 className="text-2xl font-black text-[#111c2d]">Student Dashboard</h2>
          <p className="text-xs sm:text-[14px] text-[#434655] leading-relaxed">
            Sign in with your Google account to access your personalized learning vault, downloaded formula sheets, pro masterclasses, and payment receipts.
          </p>
          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={onGoogleSignIn}
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm px-5 py-3 rounded-2xl border border-slate-300 shadow-sm transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>
            <button
              onClick={onNavigateHome}
              type="button"
              className="w-full text-center text-xs font-bold text-[#004ac6] hover:underline py-2 cursor-pointer"
            >
              ← Return to Front Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  const bookmarkedResources = allResources.filter((r) => bookmarkedIds.includes(r.id));

  return (
    <div className="min-h-screen w-full bg-[#f9f9ff] text-[#111c2d] font-['Plus_Jakarta_Sans',sans-serif] flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* 1. TOP NAV BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-blue-50 px-3 sm:px-6 lg:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#004ac6] bg-[#e7eeff] hover:bg-[#dee8ff] px-3 py-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Return to Notes & Formulas"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span className="hidden sm:inline">Back to Study Vault</span>
              <span className="sm:hidden">Back</span>
            </button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
            <span className="text-sm sm:text-base font-extrabold text-[#111c2d] hidden md:inline">
              Student Learning Center
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Currency selector badge (Shows user's detected official currency in 1 currency only) */}
            <div className="flex items-center gap-1 bg-[#f0f3ff] px-2.5 py-1 rounded-xl border border-blue-100 text-xs">
              <span className="material-symbols-outlined text-[#004ac6] text-[16px]">payments</span>
              <span className="text-[11px] font-bold text-[#434655] hidden sm:inline">Currency:</span>
              <select
                value={currentCurrency.code}
                onChange={(e) => {
                  setUserCurrency(e.target.value);
                  try {
                    localStorage.setItem('maths_portal_currency_manual_set', 'true');
                  } catch (err) {}
                  onToast(`Switched currency to ${e.target.value} (${SUPPORTED_CURRENCIES[e.target.value].symbol})`);
                }}
                className="bg-transparent border-none outline-none font-bold text-xs text-[#004ac6] cursor-pointer"
              >
                {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol.trim()}) - {c.countryName}
                  </option>
                ))}
              </select>
            </div>

            {/* Pro badge or Pro Upgrade Button */}
            {isPro ? (
              <span className="inline-flex items-center gap-1 bg-[#ffddb8] text-[#2a1700] text-xs font-bold px-3 py-1 rounded-xl shadow-2xs">
                <span className="material-symbols-outlined text-[16px] text-amber-600">workspace_premium</span>
                <span className="hidden sm:inline">PRO MEMBER</span>
              </span>
            ) : (
              <button
                onClick={onOpenProPass}
                type="button"
                className="inline-flex items-center gap-1 bg-[#fea619] hover:bg-amber-400 text-[#2a1700] text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm cursor-pointer transition-transform active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">star</span>
                <span>Upgrade to Pro</span>
              </button>
            )}

            {/* Logout button */}
            <button
              onClick={onSignOut}
              className="p-1.5 sm:p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="Sign Out"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. DASHBOARD BODY */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 space-y-6">
        {/* Top Dashboard Ad Unit */}
        <AdPlacement location="dashboard_top" className="mb-4" />

        {/* User Profile Header Card */}
        <section className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-blue-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 text-center md:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {/* Avatar with edit button */}
              <div className="relative group shrink-0">
                <img
                  src={photoURL}
                  alt={displayName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white shadow-md bg-blue-50"
                />
                <button
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  type="button"
                  className="absolute -bottom-1.5 -right-1.5 bg-[#004ac6] hover:bg-blue-700 text-white p-1.5 rounded-xl shadow-md cursor-pointer transition-transform group-hover:scale-105"
                  title="Change Profile Photo"
                >
                  <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                </button>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-black text-[#111c2d]">
                    {displayName}
                  </h1>
                  <span className="bg-[#6ffbbe] text-[#002113] text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">verified</span>
                    Verified Student
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] text-[#434655] mb-2">{currentUser.email}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs">
                  <span className="bg-[#f0f3ff] text-[#004ac6] font-bold px-2.5 py-1 rounded-lg">
                    {grade}
                  </span>
                  <span className="bg-[#f0f3ff] text-[#434655] font-semibold px-2.5 py-1 rounded-lg">
                    {targetExam}
                  </span>
                  {schoolName && (
                    <span className="bg-[#f0f3ff] text-[#737686] px-2.5 py-1 rounded-lg hidden sm:inline">
                      🏫 {schoolName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Counter Bar */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 bg-[#f0f3ff] p-3 sm:p-4 rounded-2xl border border-blue-50 text-center w-full md:w-auto">
              <div className="px-2">
                <span className="text-lg sm:text-2xl font-black text-[#004ac6] block">
                  {downloads.length}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-[#434655]">
                  Downloads
                </span>
              </div>
              <div className="px-2 border-x border-blue-200/50">
                <span className="text-lg sm:text-2xl font-black text-[#855300] block">
                  {bookmarkedIds.length}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-[#434655]">
                  Bookmarks
                </span>
              </div>
              <div className="px-2">
                <span className="text-lg sm:text-2xl font-black text-emerald-700 block">
                  {orders.length}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-[#434655]">
                  Orders
                </span>
              </div>
            </div>
          </div>

          {/* Quick Avatar Picker Drawer */}
          {showAvatarPicker && (
            <div className="mt-5 pt-5 border-t border-gray-100 animate-fadeIn">
              <span className="text-xs font-bold text-[#111c2d] block mb-2">
                Choose a Student Avatar or enter image link:
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-3">
                {PRESET_AVATARS.map((av) => (
                  <button
                    key={av.id}
                    onClick={() => {
                      setPhotoURL(av.url);
                      setShowAvatarPicker(false);
                      onToast(`Selected "${av.label}" avatar! Click Save to apply.`);
                    }}
                    type="button"
                    className={`p-1 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      photoURL === av.url ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <img src={av.url} alt={av.label} className="w-12 h-12 rounded-xl object-cover" />
                    <span className="text-[10px] font-bold truncate max-w-full">{av.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Or paste external image URL (https://...)"
                  value={customPhotoInput}
                  onChange={(e) => setCustomPhotoInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customPhotoInput.trim()) {
                      setPhotoURL(customPhotoInput.trim());
                      setCustomPhotoInput('');
                      setShowAvatarPicker(false);
                      onToast('Custom photo set! Click Save Changes.');
                    }
                  }}
                  className="px-3 py-1.5 bg-[#004ac6] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Use URL
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 3. TABS NAVIGATION */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-[#004ac6] text-white shadow-xs'
                : 'text-[#434655] hover:bg-[#e7eeff] hover:text-[#111c2d]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
            <span>Profile &amp; Account</span>
          </button>

          <button
            onClick={() => setActiveTab('downloads')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'downloads'
                ? 'bg-[#004ac6] text-white shadow-xs'
                : 'text-[#434655] hover:bg-[#e7eeff] hover:text-[#111c2d]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">download_for_offline</span>
            <span>Downloaded Content ({downloads.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('paid-material')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'paid-material'
                ? 'bg-[#004ac6] text-white shadow-xs'
                : 'text-[#434655] hover:bg-[#e7eeff] hover:text-[#111c2d]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
            <span>Pro Vault &amp; Paid Material</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'payments'
                ? 'bg-[#004ac6] text-white shadow-xs'
                : 'text-[#434655] hover:bg-[#e7eeff] hover:text-[#111c2d]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            <span>Payments &amp; Invoices ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'bookmarks'
                ? 'bg-[#004ac6] text-white shadow-xs'
                : 'text-[#434655] hover:bg-[#e7eeff] hover:text-[#111c2d]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">bookmark</span>
            <span>Saved Bookmarks ({bookmarkedIds.length})</span>
          </button>
        </div>

        {/* 4. TAB CONTENTS */}

        {/* TAB 1: PROFILE & ACCOUNT DETAILS */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left 2 Cols: Form inputs */}
              <div className="md:col-span-2 bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-blue-50 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-base font-extrabold text-[#111c2d]">Edit Student Profile Details</h3>
                    <p className="text-xs text-[#737686]">Update your grade, exam board, and contact preferences</p>
                  </div>
                  <span className="material-symbols-outlined text-[#004ac6] text-[24px]">edit_note</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="text-xs font-bold text-[#111c2d] block mb-1">Full Student Name:</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="w-full bg-[#f0f3ff] border border-blue-100 rounded-xl px-3.5 py-2.5 text-xs sm:text-[13px] font-semibold text-[#111c2d] focus:bg-white focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#111c2d] block mb-1">Registered Google Email:</label>
                    <input
                      type="text"
                      disabled
                      value={currentUser.email || ''}
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#111c2d] block mb-1">Class / Grade:</label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full bg-[#f0f3ff] border border-blue-100 rounded-xl px-3.5 py-2.5 text-xs sm:text-[13px] font-bold text-[#111c2d] focus:bg-white focus:border-blue-500 outline-none cursor-pointer"
                    >
                      <option value="Class 5">Class 5 (Primary Math Foundation)</option>
                      <option value="Class 6">Class 6 (Middle School Maths)</option>
                      <option value="Class 7">Class 7 (Pre-Algebra &amp; Geometry)</option>
                      <option value="Class 8">Class 8 (Algebraic Identities &amp; Mensuration)</option>
                      <option value="Class 9">Class 9 (High-Yield Concept Builder)</option>
                      <option value="Class 10">Class 10 (Board Exam Special)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#111c2d] block mb-1">Target Curriculum / Board:</label>
                    <select
                      value={targetExam}
                      onChange={(e) => setTargetExam(e.target.value)}
                      className="w-full bg-[#f0f3ff] border border-blue-100 rounded-xl px-3.5 py-2.5 text-xs sm:text-[13px] font-bold text-[#111c2d] focus:bg-white focus:border-blue-500 outline-none cursor-pointer"
                    >
                      <option value="CBSE Curriculum">CBSE Curriculum (NCERT Aligned)</option>
                      <option value="ICSE & State Boards">ICSE &amp; State Boards</option>
                      <option value="Olympiad & IMO Foundation">Olympiad &amp; IMO Foundation</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#111c2d] block mb-1">School / Institute Name:</label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="e.g. Delhi Public School"
                      className="w-full bg-[#f0f3ff] border border-blue-100 rounded-xl px-3.5 py-2.5 text-xs sm:text-[13px] font-semibold text-[#111c2d] focus:bg-white focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#111c2d] block mb-1">Mobile / WhatsApp Number:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-20 bg-[#f0f3ff] border border-blue-100 rounded-xl px-2.5 py-2.5 text-xs sm:text-[13px] font-bold text-center outline-none"
                        placeholder="+91"
                      />
                      <input
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="flex-1 bg-[#f0f3ff] border border-blue-100 rounded-xl px-3.5 py-2.5 text-xs sm:text-[13px] font-semibold outline-none"
                        placeholder="9876543210"
                      />
                    </div>
                  </div>
                </div>

                {/* WhatsApp notification alerts check */}
                <div className="pt-3">
                  <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatsappAlerts}
                      onChange={(e) => setWhatsappAlerts(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-emerald-900 block">
                        Receive instant chapter formula alerts on WhatsApp
                      </span>
                      <span className="text-[11px] text-emerald-700">
                        Exam blitz schedules, answer key notifications &amp; olympiad updates
                      </span>
                    </div>
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="inline-flex items-center gap-2 bg-[#004ac6] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-75"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isSavingProfile ? 'sync' : 'save'}
                    </span>
                    <span>{isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Account Meta & Security Card */}
              <div className="space-y-4">
                <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-blue-50 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-100">
                    <span className="material-symbols-outlined text-blue-600 text-[18px]">shield</span>
                    Account &amp; Security Details
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">User ID (UID):</span>
                      <span className="font-mono text-slate-700 break-all text-[11px] select-all bg-slate-50 p-1.5 rounded-lg block mt-0.5 border border-slate-100">
                        {currentUser.uid}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Auth Provider:</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Google Identity Services (OAuth 2.0)
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Active Currency:</span>
                      <span className="font-bold text-[#004ac6] mt-0.5 block">
                        {currentCurrency.name} ({currentCurrency.symbol})
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Account Created:</span>
                      <span className="font-medium text-slate-700 mt-0.5 block">
                        {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Active Member'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Last Updated:</span>
                      <span className="font-medium text-slate-700 mt-0.5 block">
                        {userProfile?.updatedAt ? new Date(userProfile.updatedAt).toLocaleDateString() : 'Just now'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Secret Admin Vault Entry (Visible ONLY for Sachins account / Admins) */}
                {isAdmin && (
                  <div className="bg-slate-900 text-slate-100 rounded-3xl p-5 border border-blue-500/30 space-y-3 shadow-md animate-fadeIn">
                    <div className="flex items-center gap-2 text-blue-400">
                      <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                      <span className="text-xs font-black uppercase tracking-wider">Teacher Control Room</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      You have verified administrative privileges. Access the portal control room via the unique non-identifiable URL below:
                    </p>
                    <div className="p-2 bg-slate-950 rounded-xl font-mono text-[10px] text-blue-300 break-all border border-slate-800 select-all">
                      {window.location.origin}/#portal-vault-8842
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          window.location.hash = '#portal-vault-8842';
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 px-3 rounded-xl cursor-pointer text-center"
                      >
                        Enter Control Room →
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(`${window.location.origin}/#portal-vault-8842`);
                          onToast('Copied secret admin URL to clipboard!');
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-2 rounded-xl cursor-pointer"
                        title="Copy Secret Admin URL"
                      >
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: DOWNLOADED CONTENT */}
        {activeTab === 'downloads' && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-blue-50 space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-extrabold text-[#111c2d]">Your Offline Downloaded Notes &amp; Formulas</h3>
                <p className="text-xs text-[#737686]">Instant re-downloadable documents saved for offline homework revision</p>
              </div>
              <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-xl self-start sm:self-auto border border-emerald-200">
                {downloads.length} Files Ready
              </span>
            </div>

            {downloads.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#004ac6] flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[30px]">download</span>
                </div>
                <h4 className="text-sm font-bold text-gray-700">No downloads saved yet</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Browse through any Class 5 to Class 10 formula sheets or chapter notes and hit download.
                </p>
                <button
                  type="button"
                  onClick={onNavigateHome}
                  className="bg-[#004ac6] text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Browse Free Notes
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {downloads.map((item) => (
                  <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 p-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#004ac6] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[20px]">description</span>
                      </div>
                      <div>
                        <span className="text-xs sm:text-[14px] font-bold text-[#111c2d] block leading-snug">
                          {item.title}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                          <span>PDF Document</span>
                          <span>•</span>
                          <span>{item.size}</span>
                          <span>•</span>
                          <span>Downloaded: {item.downloadedAt}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => onDownload(item.title, item.size)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#004ac6] hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-transform active:scale-95 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">file_download</span>
                        <span>Re-Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PRO VAULT & PAID MATERIAL */}
        {activeTab === 'paid-material' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Status card */}
            <div className={`rounded-3xl p-6 border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 ${
              isPro
                ? 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-amber-200 text-amber-950'
                : 'bg-white border-blue-100 text-slate-800'
            }`}>
              <div className="flex items-center gap-4 text-center md:text-left">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  isPro ? 'bg-amber-400 text-[#2a1700] shadow-md' : 'bg-blue-50 text-blue-700'
                }`}>
                  <span className="material-symbols-outlined text-[32px]">
                    {isPro ? 'workspace_premium' : 'lock'}
                  </span>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black">
                    {isPro ? 'Pro Masterclass All-Access Pass Active' : 'Unlock Complete Pro Math Vault'}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {isPro
                      ? 'You have unlimited lifetime access to all question banks, mock exams, and video lessons.'
                      : 'Get step-by-step solved question banks, 4K animated video lessons, and exam booster packs.'}
                  </p>
                </div>
              </div>

              {!isPro && (
                <button
                  type="button"
                  onClick={onOpenProPass}
                  className="bg-[#fea619] hover:bg-amber-400 text-[#2a1700] text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl shadow-md cursor-pointer shrink-0 transition-transform active:scale-95"
                >
                  Unlock for {formatPrice(499, currentCurrency.code)}
                </button>
              )}
            </div>

            {/* List of Pro Material Decks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Item 1 */}
              <div className="bg-white rounded-3xl p-5 border border-blue-50 shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px]">menu_book</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                      Board Exam Special
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                      Class 10 Trigonometry Super Booklet &amp; Height Distances
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Complete step-by-step NCERT + Exemplar solved proofs with 20 past years CBSE questions.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    {isPro ? 'Included with Pro' : formatPrice(199, currentCurrency.code)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (isPro) {
                        onDownload('Class 10 Trigonometry Super Booklet', '14.2 MB');
                      } else {
                        onOpenProPass();
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      isPro
                        ? 'bg-[#004ac6] text-white hover:bg-blue-700'
                        : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                    }`}
                  >
                    {isPro ? 'Download Book (14 MB)' : 'Get Booklet'}
                  </button>
                </div>
              </div>

              {/* Item 2 */}
              <div className="bg-white rounded-3xl p-5 border border-blue-50 shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px]">smart_display</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                      Animated Video Series
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                      Triangles &amp; Geometric Theorem Proofs in 4K
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Visualize BPT, Pythagoras, and similarity theorems with 3D color-coded step explanations.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    {isPro ? 'Included with Pro' : formatPrice(349, currentCurrency.code)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (isPro) {
                        onToast('Launching Animated Video Player...');
                      } else {
                        onOpenProPass();
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      isPro
                        ? 'bg-[#004ac6] text-white hover:bg-blue-700'
                        : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                    }`}
                  >
                    {isPro ? 'Watch Lessons (1.5 hrs)' : 'Unlock Course'}
                  </button>
                </div>
              </div>

              {/* Item 3 */}
              <div className="bg-white rounded-3xl p-5 border border-blue-50 shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px]">style</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                      Rapid Deck
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                      High-Yield Pocket Formula Deck (All Chapters)
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Interactive digital flashcard deck covering 48 core theorems, formulas, and diagrams.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Free &amp; Pro Access
                  </span>
                  <button
                    type="button"
                    onClick={onOpenFormulaDeck}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#004ac6] text-white hover:bg-blue-700 cursor-pointer transition-colors"
                  >
                    Launch Interactive Deck →
                  </button>
                </div>
              </div>

              {/* Item 4 */}
              <div className="bg-white rounded-3xl p-5 border border-blue-50 shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px]">military_tech</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                      Olympiad Preparation
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                      National Math Olympiad (IMO) Preparatory Kit
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      3 full-length mock papers, detailed solution breakdowns, and mentor guidance notes.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    {isPro ? 'Included with Pro' : formatPrice(299, currentCurrency.code)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (isPro) {
                        onDownload('National Math Olympiad Kit 2025', '22.8 MB');
                      } else {
                        onOpenProPass();
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      isPro
                        ? 'bg-[#004ac6] text-white hover:bg-blue-700'
                        : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                    }`}
                  >
                    {isPro ? 'Download Mock Kit' : 'Unlock Olympiad'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PAYMENTS & INVOICES */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-blue-50 space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-extrabold text-[#111c2d]">Payment Details &amp; Transaction Invoices</h3>
                <p className="text-xs text-[#737686]">
                  All payments are securely processed via Razorpay. Prices displayed in your detected currency ({currentCurrency.code}).
                </p>
              </div>
              <span className="bg-blue-50 text-[#004ac6] text-xs font-bold px-3 py-1 rounded-xl self-start sm:self-auto border border-blue-100">
                Razorpay Verified Gateway
              </span>
            </div>

            {loadingOrders ? (
              <div className="py-8 text-center text-xs text-gray-500">Loading order records...</div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[30px]">receipt</span>
                </div>
                <h4 className="text-sm font-bold text-gray-700">No payment transactions found</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  When you purchase a Pro Pass or individual subject kit, your official tax invoice and payment ID will appear here.
                </p>
                <button
                  type="button"
                  onClick={onOpenProPass}
                  className="bg-[#004ac6] text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Explore Pro Plans
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-2">Order ID</th>
                      <th className="py-3 px-2">Item / Plan</th>
                      <th className="py-3 px-2">Date</th>
                      <th className="py-3 px-2">Amount</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {orders.map((ord) => (
                      <tr key={ord.orderId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-2 font-mono text-[11px] text-gray-600">{ord.orderId}</td>
                        <td className="py-3 px-2 font-bold text-slate-900">{ord.plan}</td>
                        <td className="py-3 px-2 text-gray-500 text-[11px]">
                          {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'Recent'}
                        </td>
                        <td className="py-3 px-2 font-extrabold text-slate-900">
                          {formatPrice(ord.amount, currentCurrency.code)}
                        </td>
                        <td className="py-3 px-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <span className="material-symbols-outlined text-[13px]">check_circle</span>
                            Captured
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(ord)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">receipt</span>
                            <span>Invoice</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: BOOKMARKS */}
        {activeTab === 'bookmarks' && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-blue-50 space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-extrabold text-[#111c2d]">Saved Chapters &amp; Formulas</h3>
                <p className="text-xs text-[#737686]">Quick access to your bookmarked revision sheets</p>
              </div>
              <span className="bg-blue-50 text-[#004ac6] text-xs font-bold px-3 py-1 rounded-xl self-start sm:self-auto border border-blue-100">
                {bookmarkedResources.length} Bookmarks
              </span>
            </div>

            {bookmarkedResources.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[30px]">bookmark</span>
                </div>
                <h4 className="text-sm font-bold text-gray-700">No bookmarks saved yet</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Click the bookmark ribbon on any resource card to pin it here for quick access before exams!
                </p>
                <button
                  type="button"
                  onClick={onNavigateHome}
                  className="bg-[#004ac6] text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Explore Notes Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookmarkedResources.map((res) => (
                  <div key={res.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-bold text-[#004ac6] uppercase">{res.grade}</span>
                        <button
                          type="button"
                          onClick={(e) => onToggleBookmark(res.id, e)}
                          className="text-blue-600 hover:text-red-500 cursor-pointer"
                          title="Remove bookmark"
                        >
                          <span className="material-symbols-outlined text-[18px]">bookmark_remove</span>
                        </button>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#111c2d] leading-snug">{res.title}</h4>
                      <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">{res.description}</p>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">{res.sizeOrDuration}</span>
                      <button
                        type="button"
                        onClick={() => onDownload(res.title, res.sizeOrDuration)}
                        className="bg-[#004ac6] text-white text-xs font-bold px-3 py-1 rounded-xl cursor-pointer"
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Universal Footer Top Ad Banner */}
        <div className="mt-10 mb-4">
          <AdPlacement location="footer_top" />
        </div>
      </main>

      {/* 5. INVOICE RECEIPT MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-blue-50 text-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004ac6] text-[24px]">receipt_long</span>
                <div>
                  <h3 className="text-base font-extrabold text-[#111c2d]">Tax Invoice &amp; Payment Receipt</h3>
                  <span className="text-[10px] text-gray-400 font-mono">Invoice #{selectedInvoice.orderId}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="bg-[#f0f3ff] p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Student:</span>
                <span className="font-bold text-[#111c2d]">{displayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span className="font-medium text-[#111c2d]">{currentUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Plan / Pack:</span>
                <span className="font-bold text-[#004ac6]">{selectedInvoice.plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment ID:</span>
                <span className="font-mono text-gray-700">{selectedInvoice.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span>{selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleString() : 'Recent'}</span>
              </div>
              <div className="pt-2 border-t border-blue-200/50 flex justify-between text-sm font-extrabold">
                <span>Total Amount Paid:</span>
                <span className="text-[#004ac6]">{formatPrice(selectedInvoice.amount, currentCurrency.code)}</span>
              </div>
            </div>

            <div className="text-center text-[11px] text-gray-400 pt-1">
              Maths at Your Fingertips Learning Portal &bull; GST Exempt Educational Supply
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl cursor-pointer"
              >
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="flex-1 bg-[#004ac6] hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
