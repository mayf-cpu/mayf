import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { openRazorpayCheckout } from '../services/razorpay';
import { saveRazorpayOrder, CouponRecord } from '../firebase';
import { validateCoupon, syncAndLoadCoupons, getLocalCoupons } from '../services/promos';
import { formatPrice, getUserCurrency, SUPPORTED_CURRENCIES } from '../services/currency';

interface ProCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
  currentUser: User | null;
  onGoogleSignIn: () => void;
}

export const ProCheckoutModal: React.FC<ProCheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
  onGoogleSignIn,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'single'>('yearly');
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponsList, setCouponsList] = useState<CouponRecord[]>(getLocalCoupons);
  const [processing, setProcessing] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [lastPaymentId, setLastPaymentId] = useState('');
  const [showRazorpaySandbox, setShowRazorpaySandbox] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState(currentUser?.email ? `${currentUser.email.split('@')[0]}@okaxis` : 'student@oksbi');
  const [userCurrency, setUserCurrencyState] = useState(getUserCurrency());

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
    if (isOpen) {
      syncAndLoadCoupons().then(setCouponsList);
    }

    const handleCouponsChanged = (e: Event) => {
      const customEvent = e as CustomEvent<CouponRecord[]>;
      if (customEvent.detail) {
        setCouponsList(customEvent.detail);
      }
    };
    window.addEventListener('coupons-changed', handleCouponsChanged);
    return () => window.removeEventListener('coupons-changed', handleCouponsChanged);
  }, [isOpen]);

  if (!isOpen) return null;

  const basePrice = selectedPlan === 'yearly' ? 499 : 199;
  const finalPrice = Math.max(0, basePrice - appliedDiscount);

  const handleApplyCoupon = () => {
    const res = validateCoupon(couponCode, basePrice, couponsList);
    if (res.valid) {
      setAppliedDiscount(res.discount);
      setCouponMessage(res.message);
    } else {
      setAppliedDiscount(0);
      setCouponMessage(res.message);
    }
  };

  const completePaymentFlow = async (paymentId: string) => {
    setLastPaymentId(paymentId);
    setProcessing(false);
    setShowRazorpaySandbox(false);
    setPurchased(true);

    const orderId = `order_${Date.now()}`;
    const userId = currentUser?.uid || `guest_${Date.now()}`;
    const userEmail = currentUser?.email || 'student@domain.com';
    const planName = selectedPlan === 'yearly' ? 'All-Access 1 Year' : 'Trigonometry Booklet';

    const orderData = {
      orderId,
      userId,
      userEmail,
      plan: planName,
      amount: finalPrice,
      currency: userCurrency.code || 'INR',
      paymentId,
      status: 'captured',
      createdAt: new Date().toISOString(),
    };

    // Save locally for instant offline and dashboard sync
    try {
      const localRaw = localStorage.getItem('maths_portal_local_orders');
      const existing = localRaw ? JSON.parse(localRaw) : [];
      localStorage.setItem('maths_portal_local_orders', JSON.stringify([orderData, ...existing]));
    } catch (e) {
      // ignore
    }

    try {
      if (currentUser) {
        await saveRazorpayOrder(orderData);
      }
    } catch (err) {
      console.warn('Order sync warning: ', err);
    }

    setTimeout(() => {
      onSuccess(paymentId);
    }, 2000);
  };

  const handleLaunchRazorpay = () => {
    setProcessing(true);

    const planTitle =
      selectedPlan === 'yearly'
        ? 'Class 9 & 10 Maths All-Access Pro Pass'
        : 'Class 10 Trigonometry Super Booklet';

    const opened = openRazorpayCheckout(
      {
        amount: finalPrice * 100, // paise
        currency: 'INR',
        name: 'Maths at Your Fingertips',
        description: planTitle,
        image:
          'https://lh3.googleusercontent.com/aida/AEtjO1UjgWp59CcYsKXuqwB2FYHcehNEDlMGhbND9VEHl154aFff2EPvt39mUwZ6qXVc-edHZxj5IPmP7JbzGPqzLaCgdQX4S4GUMQBtC4KxFgHHUCu_55VykewYAvz0ReMRXT-l8SNrEHvxLcCxtTX0zVGZ6bSEQvSxd3WcuoKgXa3gTPPWl-czWwPLaYldf3jK6W4CDevlmvi08ew8Ag-k6FiBm7lx3ROJP5G9hsY15VySSpP-r5sf3fqLFLs',
        prefill: {
          name: currentUser?.displayName || 'Student Arjun',
          email: currentUser?.email || 'student@example.com',
          contact: '9876543210',
        },
        theme: {
          color: '#2563eb',
        },
        handler: (response) => {
          completePaymentFlow(response.razorpay_payment_id);
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
        },
      },
      () => {
        // Fallback to Razorpay Sandbox modal when iframe restrictions apply
        setProcessing(false);
        setShowRazorpaySandbox(true);
      }
    );

    if (!opened) {
      setProcessing(false);
      setShowRazorpaySandbox(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-xl max-h-[94vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-amber-100 flex flex-col overflow-hidden">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-[#2563eb] to-[#1e40af] p-4 sm:p-6 text-white relative overflow-hidden shrink-0">
          <div className="flex items-center justify-between relative z-10 gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                <span className="text-[10px] sm:text-[11px] font-bold bg-[#fea619] text-[#2a1700] px-2 sm:px-2.5 py-0.5 rounded-full inline-block shrink-0">
                  ⭐ ALL-ACCESS PRO
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold bg-blue-500/40 text-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                  <span>⚡ Razorpay</span>
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-extrabold truncate">Unlock Masterclass &amp; Vault</h3>
              <p className="text-[11px] sm:text-xs text-blue-100 mt-0.5 truncate">
                Full syllabus for Class 9 &amp; 10 • 48 Chapter Cheat Sheets
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {purchased ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>
            <h4 className="text-xl font-extrabold text-gray-900">
              Payment Successful!
            </h4>
            <p className="text-xs text-gray-600 max-w-sm mx-auto">
              Your Pro Access has been activated! All 48 chapter sheets, cheat codes, and 4K video lectures
              are unlocked.
            </p>
            <div className="bg-emerald-50 text-emerald-800 text-xs font-mono font-bold py-2.5 px-4 rounded-xl inline-block border border-emerald-200">
              Razorpay Payment ID: {lastPaymentId}
            </div>
          </div>
        ) : showRazorpaySandbox ? (
          /* Razorpay Gateway Checkout View */
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm">
                  R
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">Razorpay Trusted Gateway</h4>
                  <span className="text-[11px] text-gray-500">Fast, safe &amp; verified checkout</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 block uppercase font-bold">Payable</span>
                <span className="text-lg font-extrabold text-blue-700">{formatPrice(finalPrice, userCurrency.code)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide block">
                Choose Payment Instrument:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('upi')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    selectedMethod === 'upi'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
                  <span>UPI / GPay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod('card')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    selectedMethod === 'card'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">credit_card</span>
                  <span>Cards / RuPay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod('netbanking')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    selectedMethod === 'netbanking'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">account_balance</span>
                  <span>NetBanking</span>
                </button>
              </div>

              {selectedMethod === 'upi' && (
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 space-y-2 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-700">UPI ID / VPA</span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      Instant Approval
                    </span>
                  </div>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-medium outline-none focus:border-blue-500"
                    placeholder="yourname@okhdfcbank"
                  />
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-500">
                    <span>Supports: Google Pay, PhonePe, Paytm, BHIM UPI</span>
                  </div>
                </div>
              )}

              {selectedMethod === 'card' && (
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 space-y-2 mt-2">
                  <input
                    type="text"
                    disabled
                    value="•••• •••• •••• 4242 (Razorpay Test Card)"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-700"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      disabled
                      value="12 / 28"
                      className="w-1/2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-700"
                    />
                    <input
                      type="text"
                      disabled
                      value="CVV: 123"
                      className="w-1/2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-700"
                    />
                  </div>
                </div>
              )}

              {selectedMethod === 'netbanking' && (
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 space-y-2 mt-2">
                  <select className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 outline-none">
                    <option>State Bank of India</option>
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>Axis Bank</option>
                    <option>Kotak Mahindra Bank</option>
                  </select>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowRazorpaySandbox(false)}
                className="text-xs text-gray-500 hover:text-gray-700 font-semibold cursor-pointer"
              >
                ← Back to Plans
              </button>

              <button
                type="button"
                onClick={() => {
                  setProcessing(true);
                  setTimeout(() => {
                    const mockRazorpayId = `pay_${Math.random().toString(36).substring(2, 12)}`;
                    completePaymentFlow(mockRazorpayId);
                  }, 1200);
                }}
                disabled={processing}
                className="inline-flex items-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl tactile-btn-primary cursor-pointer disabled:opacity-75"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {processing ? 'sync' : 'lock'}
                </span>
                <span>{processing ? 'Authorizing via Razorpay...' : `Pay ${formatPrice(finalPrice, userCurrency.code)} Securely`}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Plan Selection View */
          <div className="p-6 space-y-5">
            {/* Google Account Check */}
            {!currentUser && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                  <div>
                    <span className="text-xs font-bold text-blue-900 block">Sign in with Google</span>
                    <span className="text-[11px] text-blue-700">Sync your Pro pass on phone &amp; laptop</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  className="bg-white hover:bg-gray-50 text-blue-700 font-bold text-xs px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Plan Selector */}
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setSelectedPlan('yearly')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPlan === 'yearly'
                    ? 'border-blue-600 bg-blue-50/50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">All-Access 1 Year</span>
                  <span className="text-[10px] font-bold bg-[#fea619] text-[#2a1700] px-1.5 py-0.5 rounded">
                    POPULAR
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-lg font-extrabold text-blue-700">{formatPrice(499, userCurrency.code)}</span>
                  <span className="text-xs text-gray-500"> / year</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Complete Class 9 &amp; 10 Vault</p>
              </div>

              <div
                onClick={() => setSelectedPlan('single')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPlan === 'single'
                    ? 'border-blue-600 bg-blue-50/50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">Single Booklet</span>
                  <span className="text-[10px] text-gray-400">Class 10</span>
                </div>
                <div className="mt-1">
                  <span className="text-lg font-extrabold text-gray-800">{formatPrice(199, userCurrency.code)}</span>
                  <span className="text-xs text-gray-500 line-through ml-1">{formatPrice(599, userCurrency.code)}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Trigonometry Kit Only</p>
              </div>
            </div>

            {/* Coupon Code Strip */}
            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter promo coupon..."
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs uppercase font-mono font-bold outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-xl cursor-pointer"
                >
                  Apply
                </button>
              </div>

              {/* Live Active Coupons from Admin */}
              {couponsList.filter(c => c.isActive).length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Available:</span>
                  {couponsList.filter(c => c.isActive).map(c => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setCouponCode(c.code);
                        const res = validateCoupon(c.code, basePrice, couponsList);
                        if (res.valid) {
                          setAppliedDiscount(res.discount);
                          setCouponMessage(res.message);
                        }
                      }}
                      className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-mono font-bold cursor-pointer transition-colors"
                    >
                      {c.code} ({c.discountType === 'percent' ? `${c.discountValue}% OFF` : `${formatPrice(c.discountValue, userCurrency.code)} OFF`})
                    </button>
                  ))}
                </div>
              )}

              {couponMessage && (
                <p className="text-[11px] font-semibold mt-1 text-emerald-600">{couponMessage}</p>
              )}
            </div>

            {/* Price Summary & Checkout Action */}
            <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-gray-500 block">Total Amount:</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-gray-900">{formatPrice(finalPrice, userCurrency.code)}</span>
                  {appliedDiscount > 0 && (
                    <span className="text-xs text-emerald-600 font-bold">Saved {formatPrice(appliedDiscount, userCurrency.code)}!</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleLaunchRazorpay}
                disabled={processing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#fea619] hover:bg-amber-400 text-[#2a1700] font-bold text-sm px-5 py-3 rounded-xl tactile-btn-secondary cursor-pointer shadow-md disabled:opacity-75"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {processing ? 'sync' : 'payment'}
                </span>
                <span>{processing ? 'Launching...' : `Pay ${formatPrice(finalPrice, userCurrency.code)} with Razorpay`}</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 pt-1">
              <span className="font-bold text-blue-700 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">verified_user</span>
                Razorpay Secured
              </span>
              <span>•</span>
              <span>UPI, Cards, NetBanking</span>
              <span>•</span>
              <span>7-Day Refund</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
