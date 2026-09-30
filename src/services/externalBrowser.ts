// Service to detect in-app browsers (Facebook, Instagram, WhatsApp, TikTok, etc.)
// and provide Chrome Intent / external browser links so links never get stuck in restricted WebViews.

export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  return /FBAN|FBAV|Instagram|Line|Twitter|Snapchat|MicroMessenger|musical_ly|BytedanceWebview|LinkedInApp|WhatsApp|Telegram|Messenger|FB_IAB|FB4A|Threads|wv|WebView/i.test(ua) || (isAndroidDevice() && /Version\/[0-9.]+/i.test(ua));
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Builds an Android Chrome Intent URL that tells Android OS
 * to open the link directly in Google Chrome instead of in-app webviews.
 */
export function getChromeIntentUrl(targetUrl?: string): string {
  const url = targetUrl || (typeof window !== 'undefined' ? window.location.href : '');
  const cleanUrl = url.replace(/^https?:\/\//, '');
  return `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
}

/**
 * Builds a universal Android Intent URL that asks Android to launch the default external browser.
 */
export function getUniversalBrowserIntentUrl(targetUrl?: string): string {
  const url = targetUrl || (typeof window !== 'undefined' ? window.location.href : '');
  const cleanUrl = url.replace(/^https?:\/\//, '');
  return `intent://${cleanUrl}#Intent;scheme=https;end`;
}

/**
 * Builds an external-browser deep link with an openExternal bridge parameter
 * so that when clicked in a social app, the landing page detects it and auto-launches Chrome.
 */
export function getExternalBrowserShareUrl(targetUrl?: string): string {
  const base = targetUrl || (typeof window !== 'undefined' ? window.location.href : '');
  const separator = base.includes('?') ? '&' : '?';
  // If already has openExternal, return as is
  if (base.includes('openExternal=true')) return base;
  return `${base}${separator}openExternal=true`;
}

/**
 * Generates the dedicated Ask Teacher standalone share URL that forces external browser launch.
 */
export function getAskTeacherShareUrl(origin?: string): string {
  const baseOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${baseOrigin}/ask-teacher?openExternal=true`;
}

/**
 * Trigger external browser launch if running inside an in-app browser or if requested via openExternal.
 */
export function attemptAutoLaunchExternalBrowser(): void {
  if (typeof window === 'undefined') return;

  const urlParams = new URLSearchParams(window.location.search);
  const requestedExternal = urlParams.get('openExternal') === 'true';

  if ((isInAppBrowser() || requestedExternal) && isAndroidDevice()) {
    // Only attempt once per session to prevent infinite reload loops
    try {
      if (sessionStorage.getItem('external_browser_attempted') === 'true') {
        return;
      }
      sessionStorage.setItem('external_browser_attempted', 'true');
    } catch (_) {}

    const cleanUrl = window.location.href.replace(/^https?:\/\//, '');
    const intentUrl = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
    try {
      // Small timeout to allow page frame to acknowledge
      setTimeout(() => {
        window.location.href = intentUrl;
      }, 50);
    } catch (e) {
      console.warn('Intent redirect attempted:', e);
    }
  }
}

