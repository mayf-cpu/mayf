// Theme, Colors, Design and Layout Configuration Service

export type ThemePreset =
  | 'classic-blue'
  | 'midnight-dark'
  | 'emerald-scholar'
  | 'sunset-amber'
  | 'cosmic-violet'
  | 'ocean-cyan'
  | 'high-contrast';

export type LayoutGrid = '3-col' | '4-col' | '2-col' | 'list';
export type CardStyle = 'elevated' | 'bordered' | 'glass' | 'vibrant';
export type BorderRadiusOption = 'rounded-md' | 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl';
export type HeroBannerStyle = 'split' | 'centered' | 'compact';
export type BackgroundTone = 'light' | 'slate' | 'cream' | 'dark' | 'midnight';

export interface ThemeConfig {
  preset: ThemePreset;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundTone: BackgroundTone;
  layoutGrid: LayoutGrid;
  cardStyle: CardStyle;
  borderRadius: BorderRadiusOption;
  heroStyle: HeroBannerStyle;
  isDarkMode: boolean;
  fontScale: 'normal' | 'large' | 'compact';
  updatedAt?: string;
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  preset: 'cosmic-violet',
  primaryColor: '#7c3aed',
  secondaryColor: '#4c1d95',
  accentColor: '#ec4899',
  backgroundTone: 'light',
  layoutGrid: '3-col',
  cardStyle: 'elevated',
  borderRadius: 'rounded-3xl',
  heroStyle: 'split',
  isDarkMode: false,
  fontScale: 'normal',
};

export const THEME_PRESETS: Record<
  ThemePreset,
  {
    name: string;
    description: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundTone: BackgroundTone;
    isDarkMode: boolean;
    badge: string;
  }
> = {
  'classic-blue': {
    name: 'Classic Sapphire',
    description: 'Clean academic navy blue with emerald accents and high readability.',
    primaryColor: '#004ac6',
    secondaryColor: '#434655',
    accentColor: '#006242',
    backgroundTone: 'light',
    isDarkMode: false,
    badge: 'Default',
  },
  'midnight-dark': {
    name: 'Midnight Dark Cyber',
    description: 'Deep navy-slate dark mode tuned for late-night exam revision.',
    primaryColor: '#38bdf8',
    secondaryColor: '#94a3b8',
    accentColor: '#a855f7',
    backgroundTone: 'midnight',
    isDarkMode: true,
    badge: 'Dark Mode',
  },
  'emerald-scholar': {
    name: 'Emerald Scholar',
    description: 'Calming forest emerald green designed to minimize visual eye fatigue.',
    primaryColor: '#059669',
    secondaryColor: '#374151',
    accentColor: '#d97706',
    backgroundTone: 'slate',
    isDarkMode: false,
    badge: 'Popular',
  },
  'sunset-amber': {
    name: 'Sunset Amber & Crimson',
    description: 'Warm energetic saffron and amber styling for high motivation and focus.',
    primaryColor: '#d97706',
    secondaryColor: '#4b5563',
    accentColor: '#dc2626',
    backgroundTone: 'cream',
    isDarkMode: false,
    badge: 'Vibrant',
  },
  'cosmic-violet': {
    name: 'Cosmic Violet & Pink',
    description: 'Modern sleek purple gradient palette inspiring creative problem solving.',
    primaryColor: '#7c3aed',
    secondaryColor: '#4c1d95',
    accentColor: '#ec4899',
    backgroundTone: 'light',
    isDarkMode: false,
    badge: 'Modern',
  },
  'ocean-cyan': {
    name: 'Ocean Cyan & Teal',
    description: 'Cool crisp oceanic palette with vibrant high-contrast action buttons.',
    primaryColor: '#0284c7',
    secondaryColor: '#334155',
    accentColor: '#0d9488',
    backgroundTone: 'slate',
    isDarkMode: false,
    badge: 'Fresh',
  },
  'high-contrast': {
    name: 'High Contrast (Accessible)',
    description: 'Maximum contrast black, white, and yellow for extreme accessibility.',
    primaryColor: '#0f172a',
    secondaryColor: '#1e293b',
    accentColor: '#eab308',
    backgroundTone: 'light',
    isDarkMode: false,
    badge: 'A11y',
  },
};

const THEME_STORAGE_KEY = 'maths_portal_theme_config_v1';

export function getThemeConfig(): ThemeConfig {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_THEME_CONFIG, ...parsed };
      }
    }
  } catch (e) {
    console.warn('Error reading theme config from localStorage:', e);
  }
  return DEFAULT_THEME_CONFIG;
}

export function saveThemeConfigLocally(cfg: ThemeConfig): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(cfg));
    applyThemeToDocument(cfg);
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: cfg }));
  } catch (e) {
    console.warn('Error saving theme config:', e);
  }
}

export function applyThemeToDocument(cfg: ThemeConfig): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Set CSS custom properties
  root.style.setProperty('--color-primary', cfg.primaryColor);
  root.style.setProperty('--color-accent', cfg.accentColor);
  root.style.setProperty('--color-secondary', cfg.secondaryColor);

  // Apply dark mode class
  if (cfg.isDarkMode || cfg.backgroundTone === 'dark' || cfg.backgroundTone === 'midnight') {
    root.classList.add('dark-theme');
    document.body.style.backgroundColor = cfg.backgroundTone === 'midnight' ? '#0b1120' : '#0f172a';
    document.body.style.color = '#f8fafc';
  } else {
    root.classList.remove('dark-theme');
    if (cfg.backgroundTone === 'cream') {
      document.body.style.backgroundColor = '#faf8f5';
      document.body.style.color = '#1c1917';
    } else if (cfg.backgroundTone === 'slate') {
      document.body.style.backgroundColor = '#f1f5f9';
      document.body.style.color = '#0f172a';
    } else {
      document.body.style.backgroundColor = '#f9f9ff';
      document.body.style.color = '#111c2d';
    }
  }

  // Set font scale
  root.classList.remove('scale-compact', 'scale-normal', 'scale-large');
  root.classList.add(`scale-${cfg.fontScale}`);
}

export function resetThemeToDefault(): ThemeConfig {
  saveThemeConfigLocally(DEFAULT_THEME_CONFIG);
  return DEFAULT_THEME_CONFIG;
}
