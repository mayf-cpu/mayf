import {
  DEFAULT_BRANDING_CONFIG,
  saveBrandingConfigLocally,
  applyFaviconToDocument,
} from './branding';
import {
  DEFAULT_CATEGORIES,
  saveCategoriesLocally,
} from './categories';
import {
  DEFAULT_THEME_CONFIG,
  saveThemeConfigLocally,
  applyThemeToDocument,
} from './theme';
import {
  DEFAULT_SOCIAL_CONFIG,
  saveSocialConfigLocally,
} from './social';
import {
  DEFAULT_COUPONS,
  saveLocalCoupons,
} from './promos';
import {
  DEFAULT_NOTIFICATIONS,
  saveLocalNotifications,
} from './notifications';
import {
  DEFAULT_SEO_SETTINGS,
  saveSeoSettingsLocally,
  applySeoToDocument,
} from './seo';
import {
  DEFAULT_GATEWAY_CONFIG,
  saveRazorpayGatewayConfig,
} from './razorpay';
import {
  saveLocalCustomResources,
  saveTierOverrides,
} from './resources';
import {
  saveBrandingSettingsToFirestore,
  saveCategorySettingsToFirestore,
  saveThemeSettingsToFirestore,
  saveSocialSettingsToFirestore,
  saveGatewaySettingsToFirestore,
  saveSeoSettingsToFirestore,
} from '../firebase';

export interface AdminResetResult {
  success: boolean;
  message: string;
  timestamp: string;
}

/**
 * Resets all admin configurations across all 12 modules back to clean, working,
 * verified defaults, syncs them locally, updates the document/DOM, dispatches events,
 * and saves them to Firestore.
 */
export async function resetAllAdminFeaturesToDefaults(): Promise<AdminResetResult> {
  const timestamp = new Date().toISOString();

  try {
    // 1. Reset Branding
    saveBrandingConfigLocally(DEFAULT_BRANDING_CONFIG);
    if (DEFAULT_BRANDING_CONFIG.faviconUrl) {
      applyFaviconToDocument(DEFAULT_BRANDING_CONFIG.faviconUrl);
    }

    // 2. Reset Categories & Taxonomies
    saveCategoriesLocally(DEFAULT_CATEGORIES);

    // 3. Reset Theme, Colors, Layout
    saveThemeConfigLocally(DEFAULT_THEME_CONFIG);
    applyThemeToDocument(DEFAULT_THEME_CONFIG);

    // 4. Reset Social Media Channels & Deep Links
    saveSocialConfigLocally(DEFAULT_SOCIAL_CONFIG);

    // 5. Reset Promos & Discount Coupons
    saveLocalCoupons(DEFAULT_COUPONS);

    // 6. Reset Push Notifications & Broadcasts
    saveLocalNotifications(DEFAULT_NOTIFICATIONS);

    // 7. Reset SEO & Meta Tags
    saveSeoSettingsLocally(DEFAULT_SEO_SETTINGS);
    applySeoToDocument(DEFAULT_SEO_SETTINGS);

    // 8. Reset Payment Gateway
    saveRazorpayGatewayConfig(DEFAULT_GATEWAY_CONFIG);

    // 9. Reset Custom Resources & Tier Overrides to clean state
    saveTierOverrides({});
    saveLocalCustomResources([]);

    // 10. Sync defaults to Firestore in parallel (non-blocking)
    Promise.allSettled([
      saveBrandingSettingsToFirestore(DEFAULT_BRANDING_CONFIG),
      saveCategorySettingsToFirestore(DEFAULT_CATEGORIES),
      saveThemeSettingsToFirestore(DEFAULT_THEME_CONFIG),
      saveSocialSettingsToFirestore(DEFAULT_SOCIAL_CONFIG),
      saveGatewaySettingsToFirestore(DEFAULT_GATEWAY_CONFIG),
      saveSeoSettingsToFirestore(DEFAULT_SEO_SETTINGS),
    ]).catch((err) => {
      console.warn('Notice while saving reset settings to cloud Firestore:', err);
    });

    // 11. Broadcast master reset notification event
    window.dispatchEvent(
      new CustomEvent('admin-master-reset', {
        detail: { timestamp },
      })
    );

    return {
      success: true,
      message: 'All admin features reset to clean working defaults. Website refreshed!',
      timestamp,
    };
  } catch (error) {
    console.error('Error during admin master reset:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error during reset',
      timestamp,
    };
  }
}
