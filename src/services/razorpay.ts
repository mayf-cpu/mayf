export interface RazorpayPaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export interface RazorpayOptions {
  key?: string;
  amount: number; // in paise (e.g. 49900 for ₹499)
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler?: (response: RazorpayPaymentSuccessResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, callback: (response: any) => void) => void;
    };
  }
}

// Payment Gateway Configuration
export interface RazorpayGatewayConfig {
  keyId: string;
  keySecret: string;
  mode: 'test' | 'live';
  merchantName: string;
  upiId: string;
  currency: string;
  autoCapture: boolean;
  enabled?: boolean;
  webhookSecret?: string;
  updatedAt?: string;
}

// Default standard test key for demonstration
export const DEFAULT_RAZORPAY_KEY_ID = 'rzp_test_1DP5mmOlF5G5ag';

export const DEFAULT_GATEWAY_CONFIG: RazorpayGatewayConfig = {
  keyId: DEFAULT_RAZORPAY_KEY_ID,
  keySecret: '••••••••••••••••••••',
  mode: 'test',
  merchantName: 'Maths at Your Fingertips',
  upiId: 'maths@razorpay',
  currency: 'INR',
  autoCapture: true,
};

const STORAGE_KEY = 'maths_razorpay_gateway_config';

export function getRazorpayGatewayConfig(): RazorpayGatewayConfig {
  if (typeof window === 'undefined') return DEFAULT_GATEWAY_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_GATEWAY_CONFIG, ...JSON.parse(raw) };
    }
  } catch (_e) {
    // Graceful fallback to default gateway config
  }
  return DEFAULT_GATEWAY_CONFIG;
}

export function saveRazorpayGatewayConfig(config: Partial<RazorpayGatewayConfig>): RazorpayGatewayConfig {
  const current = getRazorpayGatewayConfig();
  const updated: RazorpayGatewayConfig = {
    ...current,
    ...config,
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function openRazorpayCheckout(
  options: RazorpayOptions,
  onFallbackRequired?: () => void
): boolean {
  const gatewayConfig = getRazorpayGatewayConfig();
  const effectiveKey = options.key || gatewayConfig.keyId || DEFAULT_RAZORPAY_KEY_ID;

  if (typeof window !== 'undefined' && window.Razorpay) {
    try {
      const rzp = new window.Razorpay({
        ...options,
        name: options.name || gatewayConfig.merchantName,
        key: effectiveKey,
      });
      rzp.open();
      return true;
    } catch (_err) {
      if (onFallbackRequired) onFallbackRequired();
      return false;
    }
  } else {
    // Razorpay script not loaded or blocked in current sandbox environment
    if (onFallbackRequired) {
      onFallbackRequired();
    }
    return false;
  }
}
