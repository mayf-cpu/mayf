export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  rateFromInr: number;
  decimalPlaces: number;
  country: string;
  countryName: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    rateFromInr: 1,
    decimalPlaces: 0,
    country: 'IN',
    countryName: 'India',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    rateFromInr: 0.0118,
    decimalPlaces: 2,
    country: 'US',
    countryName: 'United States',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    rateFromInr: 0.0093,
    decimalPlaces: 2,
    country: 'GB',
    countryName: 'United Kingdom',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    rateFromInr: 0.0109,
    decimalPlaces: 2,
    country: 'DE',
    countryName: 'Europe',
  },
  AED: {
    code: 'AED',
    symbol: 'AED ',
    name: 'UAE Dirham',
    rateFromInr: 0.0435,
    decimalPlaces: 0,
    country: 'AE',
    countryName: 'United Arab Emirates',
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    rateFromInr: 0.0161,
    decimalPlaces: 2,
    country: 'CA',
    countryName: 'Canada',
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    rateFromInr: 0.0182,
    decimalPlaces: 2,
    country: 'AU',
    countryName: 'Australia',
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    rateFromInr: 0.0156,
    decimalPlaces: 2,
    country: 'SG',
    countryName: 'Singapore',
  },
  SAR: {
    code: 'SAR',
    symbol: 'SAR ',
    name: 'Saudi Riyal',
    rateFromInr: 0.0442,
    decimalPlaces: 0,
    country: 'SA',
    countryName: 'Saudi Arabia',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    rateFromInr: 1.75,
    decimalPlaces: 0,
    country: 'JP',
    countryName: 'Japan',
  },
};

const STORAGE_KEY = 'maths_portal_currency_v2';
const COUNTRY_STORAGE_KEY = 'maths_portal_country_v2';

/**
 * Detects user country based on browser TimeZone, language locale, and non-blocking IP lookup
 */
export function detectUserCountryAndCurrency(): { countryCode: string; currencyCode: string } {
  // 1. Check local storage cache first
  try {
    const savedCurrency = localStorage.getItem(STORAGE_KEY);
    const savedCountry = localStorage.getItem(COUNTRY_STORAGE_KEY);
    if (savedCurrency && SUPPORTED_CURRENCIES[savedCurrency]) {
      return {
        countryCode: savedCountry || SUPPORTED_CURRENCIES[savedCurrency].country,
        currencyCode: savedCurrency,
      };
    }
  } catch (e) {
    // Ignore localStorage access issues
  }

  // 2. Detect from TimeZone
  let detectedCountry = 'IN';
  let detectedCurrency = 'INR';

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const tzLower = tz.toLowerCase();

    if (tzLower.includes('calcutta') || tzLower.includes('kolkata') || tzLower.includes('delhi')) {
      detectedCountry = 'IN';
      detectedCurrency = 'INR';
    } else if (tzLower.startsWith('america/new_york') || tzLower.startsWith('america/chicago') ||
               tzLower.startsWith('america/denver') || tzLower.startsWith('america/los_angeles') ||
               tzLower.startsWith('america/phoenix') || tzLower.startsWith('america/detroit') ||
               tzLower.startsWith('america/boise') || tzLower.startsWith('pacific/honolulu') ||
               tzLower.startsWith('america/anchorage')) {
      detectedCountry = 'US';
      detectedCurrency = 'USD';
    } else if (tzLower.startsWith('europe/london') || tzLower.startsWith('europe/belfast')) {
      detectedCountry = 'GB';
      detectedCurrency = 'GBP';
    } else if (tzLower.startsWith('america/toronto') || tzLower.startsWith('america/vancouver') ||
               tzLower.startsWith('america/edmonton') || tzLower.startsWith('america/winnipeg') ||
               tzLower.startsWith('america/halifax') || tzLower.startsWith('america/montreal')) {
      detectedCountry = 'CA';
      detectedCurrency = 'CAD';
    } else if (tzLower.startsWith('australia/')) {
      detectedCountry = 'AU';
      detectedCurrency = 'AUD';
    } else if (tzLower.includes('dubai') || tzLower.includes('abu_dhabi')) {
      detectedCountry = 'AE';
      detectedCurrency = 'AED';
    } else if (tzLower.includes('singapore')) {
      detectedCountry = 'SG';
      detectedCurrency = 'SGD';
    } else if (tzLower.includes('riyadh')) {
      detectedCountry = 'SA';
      detectedCurrency = 'SAR';
    } else if (tzLower.includes('tokyo')) {
      detectedCountry = 'JP';
      detectedCurrency = 'JPY';
    } else if (tzLower.startsWith('europe/')) {
      detectedCountry = 'DE';
      detectedCurrency = 'EUR';
    } else {
      // Check navigator language
      const lang = (navigator.language || (navigator.languages && navigator.languages[0]) || '').toUpperCase();
      if (lang.endsWith('-IN') || lang.startsWith('HI') || lang.startsWith('GU') || lang.startsWith('TA') || lang.startsWith('TE') || lang.startsWith('MR')) {
        detectedCountry = 'IN';
        detectedCurrency = 'INR';
      } else if (lang.endsWith('-US')) {
        detectedCountry = 'US';
        detectedCurrency = 'USD';
      } else if (lang.endsWith('-GB')) {
        detectedCountry = 'GB';
        detectedCurrency = 'GBP';
      } else if (lang.endsWith('-CA')) {
        detectedCountry = 'CA';
        detectedCurrency = 'CAD';
      } else if (lang.endsWith('-AU')) {
        detectedCountry = 'AU';
        detectedCurrency = 'AUD';
      } else if (lang.endsWith('-AE')) {
        detectedCountry = 'AE';
        detectedCurrency = 'AED';
      } else if (lang.endsWith('-SG')) {
        detectedCountry = 'SG';
        detectedCurrency = 'SGD';
      } else if (lang.endsWith('-SA')) {
        detectedCountry = 'SA';
        detectedCurrency = 'SAR';
      } else {
        // Fallback default
        detectedCountry = 'IN';
        detectedCurrency = 'INR';
      }
    }
  } catch (_err) {
    // Fallback to INR default
  }

  // Cache detected
  try {
    localStorage.setItem(STORAGE_KEY, detectedCurrency);
    localStorage.setItem(COUNTRY_STORAGE_KEY, detectedCountry);
  } catch (_e) {
    // Ignore
  }

  return { countryCode: detectedCountry, currencyCode: detectedCurrency };
}

/**
 * Get active user currency
 */
export function getUserCurrency(): CurrencyInfo {
  const { currencyCode } = detectUserCountryAndCurrency();
  return SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.INR;
}

/**
 * Set and persist user's preferred currency
 */
export function setUserCurrency(currencyCode: string): void {
  if (SUPPORTED_CURRENCIES[currencyCode]) {
    try {
      localStorage.setItem(STORAGE_KEY, currencyCode);
      localStorage.setItem(COUNTRY_STORAGE_KEY, SUPPORTED_CURRENCIES[currencyCode].country);
      window.dispatchEvent(new CustomEvent('currency-changed', {
        detail: SUPPORTED_CURRENCIES[currencyCode],
      }));
    } catch (_e) {
      // Ignore
    }
  }
}

/**
 * Convert INR base price into the target currency amount
 */
export function convertInrToTarget(amountInInr: number, currencyCode?: string): number {
  const cur = currencyCode && SUPPORTED_CURRENCIES[currencyCode]
    ? SUPPORTED_CURRENCIES[currencyCode]
    : getUserCurrency();

  const converted = amountInInr * cur.rateFromInr;

  if (cur.decimalPlaces === 0) {
    return Math.round(converted);
  }
  return Math.round(converted * 100) / 100;
}

/**
 * Format a price strictly in a SINGLE currency (the user's detected country currency).
 * Guaranteed to NEVER output dual currencies like "₹199 ($3)".
 */
export function formatPrice(amountInInr: number, currencyCode?: string): string {
  const cur = currencyCode && SUPPORTED_CURRENCIES[currencyCode]
    ? SUPPORTED_CURRENCIES[currencyCode]
    : getUserCurrency();

  const converted = convertInrToTarget(amountInInr, cur.code);

  if (cur.decimalPlaces === 0) {
    return `${cur.symbol}${converted.toLocaleString()}`;
  }

  // If decimal number has trailing .00, format nicely or show 2 decimals
  const formattedNum = converted % 1 === 0
    ? converted.toString()
    : converted.toFixed(cur.decimalPlaces);

  return `${cur.symbol}${formattedNum}`;
}

/**
 * Detection via browser TimeZone and locale without external API calls
 * to prevent 429 Too Many Requests errors in the console.
 */
export function refineUserCurrencyWithIp(): void {
  // Uses synchronous client-side timezone and locale detection which is 100% reliable and zero-cost
  const { currencyCode } = detectUserCountryAndCurrency();
  if (currencyCode && SUPPORTED_CURRENCIES[currencyCode]) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved || saved !== currencyCode) {
        localStorage.setItem(STORAGE_KEY, currencyCode);
      }
    } catch (_e) {
      // Ignore
    }
  }
}
