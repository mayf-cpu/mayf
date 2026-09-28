import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { UserProfile, updateUserMobileNumber } from '../firebase';

interface StudentMobileRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  userProfile: UserProfile | null;
  onRegistered: (phone: string) => void;
  onToast: (msg: string) => void;
}

export const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳', digits: 10, placeholder: '98765 43210' },
  { code: '+1', country: 'United States', flag: '🇺🇸', digits: 10, placeholder: '202 555 0123' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧', digits: 10, placeholder: '7911 123456' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪', digits: 9, placeholder: '50 123 4567' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', digits: 8, placeholder: '8123 4567' },
  { code: '+1', country: 'Canada', flag: '🇨🇦', digits: 10, placeholder: '416 555 0145' },
  { code: '+61', country: 'Australia', flag: '🇦🇺', digits: 9, placeholder: '412 345 678' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', digits: 9, placeholder: '50 123 4567' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦', digits: 8, placeholder: '3312 3456' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼', digits: 8, placeholder: '9123 4567' },
  { code: '+968', country: 'Oman', flag: '🇴🇲', digits: 8, placeholder: '9123 4567' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵', digits: 10, placeholder: '9841 234567' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩', digits: 10, placeholder: '1712 345678' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰', digits: 9, placeholder: '71 234 5678' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾', digits: 9, placeholder: '12 345 6789' },
  { code: '+49', country: 'Germany', flag: '🇩🇪', digits: 10, placeholder: '151 12345678' },
];

export const StudentMobileRegisterModal: React.FC<StudentMobileRegisterModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userProfile,
  onRegistered,
  onToast,
}) => {
  // Pre-added country codes, default to India (+91)
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('+91');
  const [mobileNumber, setMobileNumber] = useState<string>(userProfile?.mobileNumber || '');
  const [selectedGrade, setSelectedGrade] = useState<string>(userProfile?.grade || 'Class 10');
  const [whatsappAlerts, setWhatsappAlerts] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const currentCountry = COUNTRY_CODES.find((c) => c.code === selectedCountryCode) || COUNTRY_CODES[0];

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep only numbers and clean spaces
    const digitsOnly = e.target.value.replace(/\D/g, '');
    setMobileNumber(digitsOnly);
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mobileNumber.trim()) {
      setErrorMessage('Please enter your mobile number');
      return;
    }

    if (selectedCountryCode === '+91' && mobileNumber.trim().length !== 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    if (mobileNumber.trim().length < 7) {
      setErrorMessage('Please enter a valid phone number');
      return;
    }

    if (!currentUser) {
      onToast('You must be signed in to register your mobile number');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await updateUserMobileNumber(
        currentUser.uid,
        selectedCountryCode,
        mobileNumber.trim(),
        selectedGrade,
        whatsappAlerts
      );

      const fullFormattedPhone = `${selectedCountryCode} ${mobileNumber.trim()}`;
      onRegistered(fullFormattedPhone);
      onToast(`✓ Mobile number registered successfully (${fullFormattedPhone})`);
      onClose();
    } catch (err: any) {
      console.error('Error registering mobile number:', err);
      setErrorMessage('Failed to save mobile number. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-scaleUp">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 p-6 text-white relative overflow-hidden">
          {/* Subtle math graph accents */}
          <div className="absolute -right-10 -bottom-10 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute right-4 top-4 opacity-20 pointer-events-none">
            <span className="material-symbols-outlined text-[64px]">phone_iphone</span>
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-sm mb-3 border border-white/20">
              <span className="material-symbols-outlined text-[15px]">verified</span>
              Student Verification &amp; Alerts
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Register Your Mobile Number
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-md">
              Receive free 1-page formula cheatsheets, board exam date reminders, and WhatsApp study alerts directly on your phone.
            </p>

            {/* Current Google User Pill */}
            {currentUser && (
              <div className="mt-4 flex items-center gap-2.5 p-2 bg-white/10 rounded-2xl border border-white/15 backdrop-blur-sm">
                <img
                  src={
                    currentUser.photoURL ||
                    'https://lh3.googleusercontent.com/aida/AEtjO1UhpsrCRgiMrqTFlxfxPmNEa9Mtse1EmIX9zICS42Uh1JtnrsM60AU9GVMNCbNnlbrAIotsPgTX3W9nKh4uAiXM0PgHoimvPKQaBLpbqHIp4_1uZu4yWVHLf54escoJl1BeIFQQMxvnUd3rHWguFEMELvfGhz6uqHQlt_qbW8WfXMr9-xLECGS6hIfPWzseTtdN2clzE2Wti1lCQf-pZHLuvXNZBRKctOh3IRBzw9Reiie7HJ1jVKCPzQ'
                  }
                  alt={currentUser.displayName || 'Student'}
                  className="w-8 h-8 rounded-full border border-white/40 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate">
                    {currentUser.displayName || 'Math Student'}
                  </div>
                  <div className="text-[11px] text-blue-200 truncate">
                    {currentUser.email || ''}
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-emerald-400 text-emerald-950 px-2 py-0.5 rounded-full shrink-0">
                  Google Verified
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Country Code & Mobile Number block */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Mobile / WhatsApp Number *</span>
              <span className="text-[10px] text-slate-400 font-medium">Default: India (+91)</span>
            </label>

            <div className="flex items-stretch gap-2">
              {/* Country Code Pre-added block */}
              <div className="relative shrink-0 w-36 sm:w-44">
                <select
                  value={selectedCountryCode}
                  onChange={(e) => {
                    setSelectedCountryCode(e.target.value);
                    setErrorMessage('');
                  }}
                  className="w-full h-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer appearance-none"
                >
                  {COUNTRY_CODES.map((item) => (
                    <option key={`${item.country}-${item.code}`} value={item.code}>
                      {item.flag} {item.code} ({item.country})
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-3 text-slate-400 text-[18px] pointer-events-none">
                  expand_more
                </span>
              </div>

              {/* Mobile Number Input */}
              <div className="relative flex-1">
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={handleMobileChange}
                  placeholder={currentCountry.placeholder}
                  maxLength={15}
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {mobileNumber && (
                  <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400">
                    {mobileNumber.length} {selectedCountryCode === '+91' ? '/ 10' : ''}
                  </span>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-emerald-600">lock</span>
              Your number will never be shared. Used strictly for curriculum formula drops.
            </p>
          </div>

          {/* Student Grade Confirmation */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Confirm Your Current Grade / Class
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {['Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedGrade === g
                      ? 'bg-blue-600 text-white shadow-xs scale-102 ring-2 ring-blue-500/20'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* WhatsApp Exam Alerts Opt-In */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-2.5">
            <input
              type="checkbox"
              id="whatsapp-optin"
              checked={whatsappAlerts}
              onChange={(e) => setWhatsappAlerts(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded cursor-pointer mt-0.5 shrink-0"
            />
            <label htmlFor="whatsapp-optin" className="text-xs text-emerald-950 font-medium cursor-pointer">
              <span className="font-bold">Receive instant revision packs on WhatsApp:</span> Get daily 1-page formula summaries, NCERT exemplar theorem solutions, and board date announcements.
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Skip for now
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {isSubmitting ? 'Saving Number...' : 'Complete & Save Number'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
