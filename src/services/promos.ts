import { CouponRecord, fetchCoupons, saveCouponToFirestore } from '../firebase';
import { formatPrice } from './currency';

const COUPONS_STORAGE_KEY = 'maths_portal_promos_config_v1';

export const DEFAULT_COUPONS: CouponRecord[] = [
  {
    id: 'cpn-topper50',
    code: 'TOPPER50',
    discountType: 'percent',
    discountValue: 50,
    maxUses: 500,
    usedCount: 142,
    expiresAt: '2026-12-31',
    isActive: true,
    createdAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'cpn-examblitz',
    code: 'EXAMBLITZ',
    discountType: 'flat',
    discountValue: 100,
    maxUses: 500,
    usedCount: 88,
    expiresAt: '2026-12-31',
    isActive: true,
    createdAt: '2026-09-10T00:00:00Z',
  },
  {
    id: 'cpn-pro100',
    code: 'PRO100',
    discountType: 'flat',
    discountValue: 100,
    maxUses: 250,
    usedCount: 45,
    expiresAt: '2026-12-31',
    isActive: true,
    createdAt: '2026-09-10T00:00:00Z',
  },
  {
    id: 'cpn-board99',
    code: 'BOARD99',
    discountType: 'flat',
    discountValue: 100,
    maxUses: 250,
    usedCount: 88,
    expiresAt: '2026-11-30',
    isActive: true,
    createdAt: '2026-09-10T00:00:00Z',
  },
  {
    id: 'cpn-earlybird',
    code: 'EARLYBIRD',
    discountType: 'percent',
    discountValue: 30,
    maxUses: 1000,
    usedCount: 412,
    expiresAt: '2026-10-31',
    isActive: true,
    createdAt: '2026-08-15T00:00:00Z',
  },
];

export function getLocalCoupons(): CouponRecord[] {
  try {
    const raw = localStorage.getItem(COUPONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading coupons from localStorage:', e);
  }
  return DEFAULT_COUPONS;
}

export function saveLocalCoupons(coupons: CouponRecord[]): void {
  try {
    localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(coupons));
    window.dispatchEvent(new CustomEvent('coupons-changed', { detail: coupons }));
  } catch (e) {
    console.warn('Error saving coupons locally:', e);
  }
}

export async function syncAndLoadCoupons(): Promise<CouponRecord[]> {
  let list = getLocalCoupons();
  try {
    const cloud = await fetchCoupons();
    if (cloud && cloud.length > 0) {
      const map = new Map<string, CouponRecord>();
      list.forEach((c) => map.set(c.code.toUpperCase(), c));
      cloud.forEach((c) => map.set(c.code.toUpperCase(), c));
      list = Array.from(map.values());
      saveLocalCoupons(list);
    }
  } catch (e) {
    console.warn('Cloud coupons sync notice:', e);
  }
  return list;
}

export function validateCoupon(
  code: string,
  currentPrice: number,
  couponsList: CouponRecord[]
): {
  valid: boolean;
  discount: number;
  message: string;
  coupon?: CouponRecord;
} {
  const clean = code.trim().toUpperCase();
  if (!clean) {
    return { valid: false, discount: 0, message: 'Please enter a coupon code.' };
  }

  const allCoupons = couponsList.length > 0 ? couponsList : getLocalCoupons();
  const matched = allCoupons.find((c) => c.code.toUpperCase() === clean);

  if (!matched) {
    return {
      valid: false,
      discount: 0,
      message: `❌ Invalid code "${clean}". Try TOPPER50 or EXAMBLITZ.`,
    };
  }

  if (matched.isActive === false) {
    return { valid: false, discount: 0, message: `❌ Promo code "${clean}" has expired or is inactive.` };
  }

  if (matched.expiresAt && new Date(matched.expiresAt) < new Date()) {
    return { valid: false, discount: 0, message: `❌ Promo code "${clean}" has expired.` };
  }

  if (matched.maxUses && matched.usedCount >= matched.maxUses) {
    return { valid: false, discount: 0, message: `❌ Promo code "${clean}" usage limit reached.` };
  }

  let discount = 0;
  if (matched.discountType === 'percent') {
    discount = Math.round((currentPrice * matched.discountValue) / 100);
  } else {
    discount = Math.min(matched.discountValue, currentPrice);
  }

  return {
    valid: true,
    discount,
    message: `🎉 Coupon ${clean} applied! You save ${formatPrice(discount)} (${matched.discountValue}${matched.discountType === 'percent' ? '%' : ' OFF'})`,
    coupon: matched,
  };
}
