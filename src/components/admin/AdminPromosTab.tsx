import React, { useState } from 'react';
import {
  CouponRecord,
  saveCouponToFirestore,
  deleteCouponFromFirestore,
} from '../../firebase';
import {
  getLocalCoupons,
  saveLocalCoupons,
} from '../../services/promos';

interface AdminPromosTabProps {
  coupons: CouponRecord[];
  onRefresh: () => void;
  onToast: (msg: string) => void;
}

export const AdminPromosTab: React.FC<AdminPromosTabProps> = ({
  coupons,
  onRefresh,
  onToast,
}) => {
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(50);
  const [maxUses, setMaxUses] = useState<number>(200);
  const [expiresAt, setExpiresAt] = useState<string>('2026-12-31');
  const [isSaving, setIsSaving] = useState(false);

  // Fallback demo promo codes if initial empty database
  const localList = getLocalCoupons();
  const displayCoupons: CouponRecord[] = coupons.length > 0 ? coupons : localList;

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      onToast('⚠️ Please enter a coupon code (e.g. TOPPER50).');
      return;
    }

    setIsSaving(true);
    try {
      const payload: CouponRecord = {
        id: `cpn-${cleanCode.toLowerCase()}-${Date.now().toString().slice(-4)}`,
        code: cleanCode,
        discountType,
        discountValue: Number(discountValue),
        maxUses: Number(maxUses),
        usedCount: 0,
        expiresAt,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      const existing = getLocalCoupons();
      const updated = [payload, ...existing.filter((c) => c.code !== cleanCode)];
      saveLocalCoupons(updated);

      try {
        await saveCouponToFirestore(payload);
      } catch (_cloudErr) {
        // Non-blocking cloud sync fallback
      }

      onToast(`🎉 Promo code "${cleanCode}" created & active! Ready for student checkout.`);
      setCode('');
      onRefresh();
    } catch (e) {
      onToast('Failed to create coupon code.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (c: CouponRecord) => {
    const updated: CouponRecord = { ...c, isActive: !c.isActive };
    try {
      const existing = getLocalCoupons();
      const updatedList = existing.map((item) => (item.id === c.id ? updated : item));
      saveLocalCoupons(updatedList);

      try {
        await saveCouponToFirestore(updated);
      } catch (_cloudErr) {
        // Non-blocking cloud sync fallback
      }

      onToast(`Promo code "${c.code}" is now ${updated.isActive ? 'ACTIVE' : 'PAUSED'}.`);
      onRefresh();
    } catch (e) {
      onToast('Failed to update promo status.');
    }
  };

  const handleDeleteCoupon = async (couponId: string, couponCode: string) => {
    if (!window.confirm(`Delete promo code "${couponCode}"?`)) return;
    try {
      const existing = getLocalCoupons();
      const updatedList = existing.filter((item) => item.id !== couponId && item.code !== couponCode);
      saveLocalCoupons(updatedList);

      try {
        await deleteCouponFromFirestore(couponId);
      } catch (_cloudErr) {
        // Non-blocking cloud sync fallback
      }

      onToast(`Promo code "${couponCode}" deleted.`);
      onRefresh();
    } catch (e) {
      onToast('Failed to delete coupon.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    onToast(`📋 Copied code "${text}" to clipboard!`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 1. CREATE NEW COUPON CODE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">loyalty</span>
              <span>Create Promo &amp; Discount Offer</span>
            </h3>
            <p className="text-xs text-slate-500">
              Configure promotional voucher codes for students purchasing Pro Passes or Olympiad registrations.
            </p>
          </div>
          <span className="text-xs font-mono bg-amber-50 text-amber-800 font-bold px-2.5 py-1 rounded-lg">
            Razorpay Compatible
          </span>
        </div>

        <form onSubmit={handleCreateCoupon} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Coupon Code */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Coupon Code: *
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                placeholder="e.g. TOPPER50"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase text-blue-700"
                required
              />
            </div>

            {/* Discount Type */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Discount Type:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDiscountType('percent')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                    discountType === 'percent'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('flat')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                    discountType === 'flat'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Flat Amount (₹)
                </button>
              </div>
            </div>

            {/* Discount Value */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Discount Value: ({discountType === 'percent' ? '%' : '₹'})
              </label>
              <input
                type="number"
                min="1"
                max={discountType === 'percent' ? 100 : 999}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                required
              />
            </div>

            {/* Max Redemptions */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Max Redemptions / Uses:
              </label>
              <input
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Expiry Date */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Expiration Date:
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800"
              />
            </div>

            {/* Action */}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-75"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isSaving ? 'sync' : 'add_circle'}
                </span>
                <span>{isSaving ? 'Creating Code...' : 'Generate & Activate Promo Code'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 2. ACTIVE PROMO CODES DIRECTORY */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>All Configured Promo Codes</span>
              <span className="text-xs font-mono bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                {displayCoupons.length} Offers
              </span>
            </h4>
            <p className="text-xs text-slate-500">Live coupons valid at checkout across all grade passes.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Discount Offered</th>
                <th className="py-3 px-4">Usage Progress</th>
                <th className="py-3 px-4">Valid Until</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayCoupons.map((c) => {
                const percentUsed = Math.min(100, Math.round((c.usedCount / c.maxUses) * 100));
                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg tracking-wider text-xs">
                          {c.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(c.code)}
                          className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                          title="Copy Code"
                        >
                          <span className="material-symbols-outlined text-[15px]">content_copy</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 text-sm">
                        {c.discountType === 'percent' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-28">
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                          <span>{c.usedCount} used</span>
                          <span>{c.maxUses} max</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${percentUsed}%` }}
                            className={`h-full rounded-full ${percentUsed > 80 ? 'bg-amber-500' : 'bg-blue-600'}`}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{c.expiresAt}</td>
                    <td className="py-3 px-4">
                      {c.isActive ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          PAUSED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c)}
                          className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                        >
                          {c.isActive ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(c.id, c.code)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Delete Code"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
