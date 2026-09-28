import { SeoSettings, DEFAULT_SEO_SETTINGS, loadSeoSettingsFromFirestore, saveSeoSettingsToFirestore } from '../firebase';

export { DEFAULT_SEO_SETTINGS, loadSeoSettingsFromFirestore, saveSeoSettingsToFirestore };
export type { SeoSettings };

const SEO_STORAGE_KEY = 'maths_portal_seo_config_v1';

export function getSeoSettingsLocally(): SeoSettings {
  try {
    const raw = localStorage.getItem(SEO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_SEO_SETTINGS, ...parsed };
      }
    }
  } catch (e) {
    console.warn('Error reading SEO settings from localStorage:', e);
  }
  return DEFAULT_SEO_SETTINGS;
}

export function saveSeoSettingsLocally(settings: SeoSettings): void {
  try {
    localStorage.setItem(SEO_STORAGE_KEY, JSON.stringify(settings));
    applySeoToDocument(settings);
    window.dispatchEvent(new CustomEvent('seo-changed', { detail: settings }));
  } catch (e) {
    console.warn('Error saving SEO settings locally:', e);
  }
}

export function applySeoToDocument(seo: SeoSettings): void {
  if (typeof document === 'undefined') return;

  // Title
  if (seo.metaTitle) {
    document.title = seo.metaTitle;
  }

  // Meta description
  let descMeta = document.querySelector('meta[name="description"]');
  if (!descMeta) {
    descMeta = document.createElement('meta');
    descMeta.setAttribute('name', 'description');
    document.head.appendChild(descMeta);
  }
  descMeta.setAttribute('content', seo.metaDescription || '');

  // Meta keywords
  if (seo.keywords) {
    let kwMeta = document.querySelector('meta[name="keywords"]');
    if (!kwMeta) {
      kwMeta = document.createElement('meta');
      kwMeta.setAttribute('name', 'keywords');
      document.head.appendChild(kwMeta);
    }
    kwMeta.setAttribute('content', seo.keywords);
  }

  // OpenGraph Tags
  setMetaTag('og:title', seo.ogTitle || seo.metaTitle);
  setMetaTag('og:description', seo.ogDescription || seo.metaDescription);
  if (seo.ogImageUrl) {
    setMetaTag('og:image', seo.ogImageUrl);
  }
  if (seo.canonicalUrl) {
    setMetaTag('og:url', seo.canonicalUrl);
  }

  // Twitter Cards
  setMetaTag('twitter:card', 'summary_large_image', 'name');
  setMetaTag('twitter:title', seo.ogTitle || seo.metaTitle, 'name');
  setMetaTag('twitter:description', seo.ogDescription || seo.metaDescription, 'name');
  if (seo.ogImageUrl) {
    setMetaTag('twitter:image', seo.ogImageUrl, 'name');
  }

  // Canonical Link
  if (seo.canonicalUrl) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', seo.canonicalUrl);
  }

  // Structured Data (JSON-LD)
  let scriptLd = document.getElementById('schema-jsonld') as HTMLScriptElement | null;
  if (!scriptLd) {
    scriptLd = document.createElement('script');
    scriptLd.id = 'schema-jsonld';
    scriptLd.type = 'application/ld+json';
    document.head.appendChild(scriptLd);
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': seo.structuredDataType || 'EducationalOrganization',
    name: seo.metaTitle,
    description: seo.metaDescription,
    url: seo.canonicalUrl || window.location.origin,
    image: seo.ogImageUrl,
    sameAs: [
      'https://youtube.com/@MathsAtYourFingertips',
      'https://t.me/MathsAtYourFingertips'
    ]
  };
  scriptLd.textContent = JSON.stringify(structuredData);
}

function setMetaTag(property: string, content: string, attrName: 'property' | 'name' = 'property'): void {
  let meta = document.querySelector(`meta[${attrName}="${property}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attrName, property);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}
