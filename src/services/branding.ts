// Branding and Assets Management Service

export interface BrandingConfig {
  logoUrl: string;
  iconUrl: string;
  faviconUrl: string;
  siteTitle: string;
  tagline: string;
  announcementText?: string;
  announcementLinkText?: string;
  showAnnouncement?: boolean;
  heroBadgeText?: string;
  updatedAt?: string;
}

export const DEFAULT_BRANDING_CONFIG: BrandingConfig = {
  logoUrl: 'https://lh3.googleusercontent.com/aida/AEtjO1UjgWp59CcYsKXuqwB2FYHcehNEDlMGhbND9VEHl154aFff2EPvt39mUwZ6qXVc-edHZxj5IPmP7JbzGPqzLaCgdQX4S4GUMQBtC4KxFgHHUCu_55VykewYAvz0ReMRXT-l8SNrEHvxLcCxtTX0zVGZ6bSEQvSxd3WcuoKgXa3gTPPWl-czWwPLaYldf3jK6W4CDevlmvi08ew8Ag-k6FiBm7lx3ROJP5G9hsY15VySSpP-r5sf3fqLFLs',
  iconUrl: '/favicon.svg',
  faviconUrl: '/favicon.svg',
  siteTitle: '',
  tagline: '',
  announcementText: '🎉 Term 2 Formula Sheets & Chapter Cheat-Sheets are LIVE!',
  announcementLinkText: 'Get PDFs →',
  showAnnouncement: true,
  heroBadgeText: 'CBSE, ICSE & State Boards • New 2025 Edition',
};

const STORAGE_KEY = 'mayf_branding_config';

/**
 * Retrieve current branding configuration from localStorage or defaults
 */
export function getBrandingConfig(): BrandingConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_BRANDING_CONFIG,
        ...parsed,
        siteTitle: parsed.siteTitle !== undefined ? parsed.siteTitle : '',
        tagline: parsed.tagline !== undefined ? parsed.tagline : '',
      };
    }
  } catch (e) {
    console.warn('Failed to parse branding config from localStorage:', e);
  }
  return DEFAULT_BRANDING_CONFIG;
}

/**
 * Update the favicon in the browser tab live
 */
export function applyFaviconToDocument(faviconUrl: string): void {
  try {
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
    
    // Also update apple-touch-icon if present
    const appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
    if (appleLink) {
      appleLink.href = faviconUrl;
    }
  } catch (e) {
    console.error('Error applying favicon:', e);
  }
}

/**
 * Save branding configuration to localStorage and apply DOM updates
 */
export function saveBrandingConfigLocally(config: BrandingConfig): void {
  try {
    const payload = {
      ...config,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    if (config.faviconUrl) {
      applyFaviconToDocument(config.faviconUrl);
    }
    // Broadcast event for live reactivity across components
    window.dispatchEvent(new CustomEvent('branding-changed', { detail: payload }));
  } catch (e) {
    console.error('Failed to save branding locally:', e);
  }
}

/**
 * Utility to process uploaded image file and optimize it for web/localStorage
 */
export function processImageUpload(file: File, maxDimension = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    // If SVG, read as text/dataURL directly
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Export as WebP or PNG
        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mime, 0.9);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(readerEvent.target?.result as string);
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
