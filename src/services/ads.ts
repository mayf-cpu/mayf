// Google AdSense & Custom Ad Placement Management Service
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export type AdType = 'adsense' | 'custom_html' | 'banner_image';
export type AdFormat = 'auto' | 'horizontal' | 'rectangle' | 'vertical' | 'fluid';

export type AdPlacementLocation =
  | 'header_top'
  | 'home_hero_bottom'
  | 'catalog_infeed'
  | 'catalog_bottom'
  | 'formula_deck_top'
  | 'formula_deck_sidebar'
  | 'dashboard_top'
  | 'resource_modal_bottom'
  | 'footer_top';

export interface AdPlacementConfig {
  id: AdPlacementLocation;
  name: string;
  pageName: string;
  description: string;
  enabled: boolean;
  adType: AdType;
  // AdSense parameters
  adSlot: string;
  adFormat: AdFormat;
  adFullWidthResponsive: boolean;
  // Custom HTML / Script
  customHtml?: string;
  // Banner Image option
  bannerImageUrl?: string;
  bannerLinkUrl?: string;
  bannerAlt?: string;
  openInNewTab?: boolean;
  // Styling and display options
  showLabel: boolean;
  labelText?: string;
  alignment: 'center' | 'left' | 'right';
  maxWidth?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: string;
  padding?: 'none' | 'compact' | 'normal' | 'relaxed';
}

export interface AdsGlobalConfig {
  enabled: boolean;
  adClient: string; // e.g. "ca-pub-1234567890123456"
  enableAutoAds: boolean;
  testMode: boolean; // Previews ad placement boxes visually with size and slot details
  showGlobalLabel: boolean;
  placements: Record<AdPlacementLocation, AdPlacementConfig>;
  updatedAt?: string;
}

export const DEFAULT_ADS_CONFIG: AdsGlobalConfig = {
  enabled: true,
  adClient: 'ca-pub-6461734149500000',
  enableAutoAds: false,
  testMode: true, // Enabled initially so admin can see placements immediately
  showGlobalLabel: true,
  placements: {
    header_top: {
      id: 'header_top',
      name: 'Top Header Leaderboard',
      pageName: 'Global (All Pages)',
      description: 'Super leaderboard banner displayed at the very top of the page above the navbar.',
      enabled: false,
      adType: 'adsense',
      adSlot: '1001001001',
      adFormat: 'horizontal',
      adFullWidthResponsive: true,
      showLabel: true,
      labelText: 'ADVERTISEMENT',
      alignment: 'center',
      maxWidth: '970px',
      backgroundColor: '#f8fafc',
      borderColor: '#e2e8f0',
      borderRadius: '8px',
      padding: 'compact',
    },
    home_hero_bottom: {
      id: 'home_hero_bottom',
      name: 'Home Hero Bottom Banner',
      pageName: 'Home / Catalog',
      description: 'High-visibility responsive horizontal ad banner placed directly beneath the hero introduction.',
      enabled: true,
      adType: 'adsense',
      adSlot: '2002002002',
      adFormat: 'horizontal',
      adFullWidthResponsive: true,
      showLabel: true,
      labelText: 'SPONSORED LEARNING PARTNER',
      alignment: 'center',
      maxWidth: '100%',
      backgroundColor: '#ffffff',
      borderColor: '#e0e7ff',
      borderRadius: '16px',
      padding: 'normal',
    },
    catalog_infeed: {
      id: 'catalog_infeed',
      name: 'In-Feed Resource Grid Ad',
      pageName: 'Home / Catalog',
      description: 'Native responsive card embedded between the 3rd and 4th formula sheets/notes in the study library.',
      enabled: true,
      adType: 'adsense',
      adSlot: '3003003003',
      adFormat: 'rectangle',
      adFullWidthResponsive: true,
      showLabel: true,
      labelText: 'FEATURED SPONSOR',
      alignment: 'center',
      maxWidth: '100%',
      backgroundColor: '#f8fafc',
      borderColor: '#cbd5e1',
      borderRadius: '24px',
      padding: 'normal',
    },
    catalog_bottom: {
      id: 'catalog_bottom',
      name: 'Catalog Footer Leaderboard',
      pageName: 'Home / Catalog',
      description: 'Wide horizontal leaderboard beneath the search and filter results grid.',
      enabled: true,
      adType: 'adsense',
      adSlot: '4004004004',
      adFormat: 'horizontal',
      adFullWidthResponsive: true,
      showLabel: true,
      labelText: 'ADVERTISEMENT',
      alignment: 'center',
      maxWidth: '970px',
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
      borderRadius: '16px',
      padding: 'normal',
    },
    formula_deck_top: {
      id: 'formula_deck_top',
      name: 'Formula Deck Top Banner',
      pageName: 'Formula Deck Page',
      description: 'Full-width banner across the top of the interactive Pocket Formula Deck and Sandbox.',
      enabled: true,
      adType: 'adsense',
      adSlot: '5005005005',
      adFormat: 'horizontal',
      adFullWidthResponsive: true,
      showLabel: true,
      labelText: 'ADVERTISEMENT',
      alignment: 'center',
      maxWidth: '100%',
      backgroundColor: '#f1f5f9',
      borderColor: '#cbd5e1',
      borderRadius: '12px',
      padding: 'compact',
    },
    formula_deck_sidebar: {
      id: 'formula_deck_sidebar',
      name: 'Formula Deck Bottom Ad',
      pageName: 'Formula Deck Page',
      description: 'Medium rectangle or responsive card located below the flashcard flip deck.',
      enabled: false,
      adType: 'adsense',
      adSlot: '6006006006',
      adFormat: 'rectangle',
      adFullWidthResponsive: true,
      showLabel: true,
      labelText: 'SPONSORED',
      alignment: 'center',
      maxWidth: '728px',
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
      borderRadius: '16px',
      padding: 'normal',
    },
    dashboard_top: {
      id: 'dashboard_top',
      name: 'Student Dashboard Top Banner',
      pageName: 'Student Dashboard',
      description: 'Clean responsive banner at the top of the student personalized learning dashboard.',
      enabled: true,
      adType: 'adsense',
      adSlot: '7007007007',
      adFormat: 'horizontal',
      adFullWidthResponsive: true,
      showLabel: true,
      labelText: 'ADVERTISEMENT',
      alignment: 'center',
      maxWidth: '100%',
      backgroundColor: '#f8fafc',
      borderColor: '#e2e8f0',
      borderRadius: '16px',
      padding: 'compact',
    },
    resource_modal_bottom: {
      id: 'resource_modal_bottom',
      name: 'Resource Preview Modal Ad',
      pageName: 'Resource Modal View',
      description: 'Non-intrusive banner positioned before the download/print button in the preview sheet modal.',
      enabled: true,
      adType: 'adsense',
      adSlot: '8008008008',
      adFormat: 'horizontal',
      adFullWidthResponsive: true,
      showLabel: true,
      labelText: 'SPONSORED CONTENT',
      alignment: 'center',
      maxWidth: '100%',
      backgroundColor: '#f1f5f9',
      borderColor: '#cbd5e1',
      borderRadius: '12px',
      padding: 'compact',
    },
    footer_top: {
      id: 'footer_top',
      name: 'Above Footer Universal Banner',
      pageName: 'Global (All Pages)',
      description: 'Full-width leaderboard banner displayed just above the website bottom footer.',
      enabled: true,
      adType: 'adsense',
      adSlot: '9009009009',
      adFormat: 'horizontal',
      adFullWidthResponsive: true,
      showLabel: true,
      labelText: 'ADVERTISEMENT',
      alignment: 'center',
      maxWidth: '1100px',
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
      borderRadius: '16px',
      padding: 'normal',
    },
  },
};

const STORAGE_KEY = 'maths_hub_adsense_config';
const LEGACY_STORAGE_KEY = 'mayf_adsense_config';

/**
 * Get current ads configuration from localStorage or default
 */
export function getAdsConfig(): AdsGlobalConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_ADS_CONFIG,
        ...parsed,
        placements: {
          ...DEFAULT_ADS_CONFIG.placements,
          ...(parsed.placements || {}),
        },
      };
    }
  } catch (_e) {
    // Graceful fallback to default ads config
  }
  return DEFAULT_ADS_CONFIG;
}

/**
 * Save ads configuration to localStorage and dispatch custom event
 */
export function saveAdsConfigLocally(config: AdsGlobalConfig): void {
  try {
    const payload = {
      ...config,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('ads-config-changed', { detail: payload }));
    applyAdSenseScript(payload);
  } catch (_e) {
    // Ignore
  }
}

/**
 * Save ads configuration to Firestore
 */
export async function saveAdsConfigToFirestore(config: AdsGlobalConfig): Promise<void> {
  const docRef = doc(db, 'settings', 'ads');
  try {
    await setDoc(docRef, {
      ...config,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/ads');
  }
}

/**
 * Load ads configuration from Firestore
 */
export async function loadAdsConfigFromFirestore(): Promise<AdsGlobalConfig | null> {
  try {
    const docRef = doc(db, 'settings', 'ads');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as AdsGlobalConfig;
    }
  } catch (_e) {
    // Graceful fallback
  }
  return null;
}

/**
 * Dynamically inject or update Google AdSense script tag
 */
export function applyAdSenseScript(config: AdsGlobalConfig): void {
  if (typeof window === 'undefined') return;

  const scriptId = 'google-adsense-script';
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;

  if (!config.enabled || !config.adClient || config.testMode) {
    // If disabled or in test mode, avoid loading real AdSense network calls
    if (script && (!config.enabled || !config.adClient)) {
      script.remove();
    }
    return;
  }

  const clientClean = config.adClient.trim();
  const scriptSrc = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientClean}`;

  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = scriptSrc;
    document.head.appendChild(script);
  } else if (script.src !== scriptSrc) {
    script.src = scriptSrc;
  }
}
