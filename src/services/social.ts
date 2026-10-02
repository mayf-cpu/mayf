// Social Media URLs & Native App Deep-Linking Engine

export interface PlatformConfig {
  id: string;
  name: string;
  icon: string;
  badge: string;
  enabled: boolean;
  handleOrNumber: string;
  url: string;
  groupUrl?: string;
  nativeAppScheme: string;
  description: string;
}

export interface SocialConfig {
  platforms: {
    whatsapp: PlatformConfig;
    telegram: PlatformConfig;
    youtube: PlatformConfig;
    instagram: PlatformConfig;
    facebook: PlatformConfig;
    twitter: PlatformConfig;
    linkedin: PlatformConfig;
    discord: PlatformConfig;
  };
  defaultShareMessage: string;
  forceNativeAppOnMobile: boolean;
  updatedAt?: string;
}

export const DEFAULT_SOCIAL_CONFIG: SocialConfig = {
  platforms: {
    whatsapp: {
      id: 'whatsapp',
      name: 'WhatsApp Community',
      icon: 'chat',
      badge: 'Most Popular',
      enabled: true,
      handleOrNumber: '+919876543210',
      url: 'https://chat.whatsapp.com/FMathsFingertipsOfficial',
      groupUrl: 'https://chat.whatsapp.com/FMathsFingertipsOfficial',
      nativeAppScheme: 'whatsapp://',
      description: 'Daily math challenge questions, doubt clearing & rapid formula alerts.',
    },
    telegram: {
      id: 'telegram',
      name: 'Telegram Channel',
      icon: 'send',
      badge: 'High-Speed Vault',
      enabled: true,
      handleOrNumber: '@MathsAtYourFingertips',
      url: 'https://t.me/MathsAtYourFingertips',
      groupUrl: 'https://t.me/MathsDiscussionSquad',
      nativeAppScheme: 'tg://',
      description: 'Uncompressed PDF formula booklets, exemplar solution packs & live updates.',
    },
    youtube: {
      id: 'youtube',
      name: 'YouTube Lessons',
      icon: 'smart_display',
      badge: 'Video Explanations',
      enabled: true,
      handleOrNumber: '@MathsAtYourFingertips',
      url: 'https://youtube.com/@MathsAtYourFingertips',
      nativeAppScheme: 'vnd.youtube://',
      description: 'Animated 10-minute micro-lessons explaining Class 9 & 10 NCERT theorems.',
    },
    instagram: {
      id: 'instagram',
      name: 'Instagram Visuals',
      icon: 'photo_camera',
      badge: 'Bite-Sized Math',
      enabled: true,
      handleOrNumber: '@maths_fingertips',
      url: 'https://instagram.com/maths_fingertips',
      nativeAppScheme: 'instagram://',
      description: 'Visual geometry tricks, mental math reels, and daily mnemonic flashcards.',
    },
    twitter: {
      id: 'twitter',
      name: 'X (Twitter)',
      icon: 'tag',
      badge: 'Announcements',
      enabled: true,
      handleOrNumber: '@MathsFingertips',
      url: 'https://twitter.com/MathsFingertips',
      nativeAppScheme: 'twitter://',
      description: 'CBSE board notifications, exam date sheets, and syllabus updates.',
    },
    facebook: {
      id: 'facebook',
      name: 'Facebook Group',
      icon: 'groups',
      badge: 'Parent & Teacher Hub',
      enabled: false,
      handleOrNumber: 'MathsAtYourFingertipsHub',
      url: 'https://facebook.com/MathsAtYourFingertipsHub',
      nativeAppScheme: 'fb://',
      description: 'Parent-teacher discussions and Olympiad scholarship application guidance.',
    },
    linkedin: {
      id: 'linkedin',
      name: 'LinkedIn Education',
      icon: 'work',
      badge: 'Professional Hub',
      enabled: false,
      handleOrNumber: 'maths-at-your-fingertips',
      url: 'https://linkedin.com/company/maths-at-your-fingertips',
      nativeAppScheme: 'linkedin://',
      description: 'Academic collaborations, educator hiring, and pedagogy articles.',
    },
    discord: {
      id: 'discord',
      name: 'Discord Study Squad',
      icon: 'forum',
      badge: '24/7 Study Room',
      enabled: true,
      handleOrNumber: 'discord.gg/mathsfingertips',
      url: 'https://discord.gg/mathsfingertips',
      nativeAppScheme: 'discord://',
      description: 'Silent study pomodoro voice channels and peer math problem solving.',
    },
  },
  defaultShareMessage: 'Check out this 1-page math formula cheat sheet on Maths at Your Fingertips!',
  forceNativeAppOnMobile: true,
};

const SOCIAL_STORAGE_KEY = 'maths_portal_social_config_v1';

export function getSocialConfig(): SocialConfig {
  try {
    const raw = localStorage.getItem(SOCIAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.platforms) {
        return {
          ...DEFAULT_SOCIAL_CONFIG,
          ...parsed,
          platforms: { ...DEFAULT_SOCIAL_CONFIG.platforms, ...parsed.platforms },
        };
      }
    }
  } catch (_e) {
    // Graceful fallback to default social config
  }
  return DEFAULT_SOCIAL_CONFIG;
}

export function saveSocialConfigLocally(cfg: SocialConfig): void {
  try {
    localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(cfg));
    window.dispatchEvent(new CustomEvent('social-changed', { detail: cfg }));
  } catch (_e) {
    // Ignore
  }
}

/**
 * Deep-linking dispatcher: Launches installed native app directly.
 * If the user's device doesn't have the native app installed, gracefully falls back to the web browser.
 */
export function openInAppOrWeb(nativeUri: string, webFallbackUrl: string): void {
  // Check if browser has focus/blur support to detect native app handoff
  let hasBlurred = false;
  const onBlur = () => {
    hasBlurred = true;
    window.removeEventListener('blur', onBlur);
  };
  window.addEventListener('blur', onBlur);

  const start = Date.now();

  try {
    // Attempt to invoke the native app handler
    window.location.href = nativeUri;
  } catch (_e) {
    // Graceful fallback
  }

  // Fallback timer: if the app is not installed, open the browser fallback
  setTimeout(() => {
    window.removeEventListener('blur', onBlur);
    const elapsed = Date.now() - start;
    if (!hasBlurred && elapsed < 2000 && document.hasFocus()) {
      window.open(webFallbackUrl, '_blank', 'noopener,noreferrer');
    }
  }, 650);
}

/**
 * Trigger mobile OS native share sheet if available (iOS / Android / macOS),
 * which directly passes the content into the user's chosen installed native app.
 */
export async function triggerNativeOsShare(data: {
  title: string;
  text: string;
  url: string;
}): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch (_err: any) {
      // User cancelled or share unavailable
    }
  }
  return false;
}

/**
 * Platform-specific native deep link generators
 */
export function shareToWhatsAppDirectApp(text: string, url: string): void {
  const fullText = `${text} ${url}`.trim();
  const nativeUri = `whatsapp://send?text=${encodeURIComponent(fullText)}`;
  const webUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`;
  openInAppOrWeb(nativeUri, webUrl);
}

export function shareToTelegramDirectApp(text: string, url: string): void {
  const nativeUri = `tg://msg_url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  const webUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  openInAppOrWeb(nativeUri, webUrl);
}

export function shareToTwitterDirectApp(text: string, url: string): void {
  const nativeUri = `twitter://post?message=${encodeURIComponent(`${text} ${url}`)}`;
  const webUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  openInAppOrWeb(nativeUri, webUrl);
}

export function shareToFacebookDirectApp(url: string): void {
  const nativeUri = `fb://facewebmodal/f?href=${encodeURIComponent(url)}`;
  const webUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  openInAppOrWeb(nativeUri, webUrl);
}

export function openInstagramDirectApp(handle: string): void {
  const cleanHandle = handle.replace('@', '').trim();
  const nativeUri = `instagram://user?username=${cleanHandle}`;
  const webUrl = `https://instagram.com/${cleanHandle}`;
  openInAppOrWeb(nativeUri, webUrl);
}

export function openYouTubeDirectApp(channelUrlOrHandle: string): void {
  const nativeUri = channelUrlOrHandle.includes('youtube.com')
    ? channelUrlOrHandle.replace('https://www.youtube.com', 'vnd.youtube://www.youtube.com').replace('https://youtube.com', 'vnd.youtube://www.youtube.com')
    : `vnd.youtube://www.youtube.com/${channelUrlOrHandle}`;
  const webUrl = channelUrlOrHandle.startsWith('http') ? channelUrlOrHandle : `https://youtube.com/${channelUrlOrHandle}`;
  openInAppOrWeb(nativeUri, webUrl);
}
