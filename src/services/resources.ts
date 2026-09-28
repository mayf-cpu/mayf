import { CustomResourceRecord, fetchCustomResources, saveCustomResourceToFirestore, deleteCustomResourceFromFirestore } from '../firebase';
import { MathResource, MATH_RESOURCES } from '../data/mathResources';

const CUSTOM_RESOURCES_STORAGE_KEY = 'maths_portal_custom_resources_v1';
const TIER_OVERRIDES_STORAGE_KEY = 'maths_portal_resource_tier_overrides_v1';

export function getLocalCustomResources(): CustomResourceRecord[] {
  try {
    const raw = localStorage.getItem(CUSTOM_RESOURCES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading local custom resources:', e);
  }
  return [];
}

export function saveLocalCustomResources(resources: CustomResourceRecord[]): void {
  try {
    localStorage.setItem(CUSTOM_RESOURCES_STORAGE_KEY, JSON.stringify(resources));
    window.dispatchEvent(new CustomEvent('resources-changed', { detail: resources }));
  } catch (e) {
    console.warn('Error saving local custom resources:', e);
  }
}

export function getTierOverrides(): Record<string, 'free' | 'pro'> {
  try {
    const raw = localStorage.getItem(TIER_OVERRIDES_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) || {};
    }
  } catch (e) {
    console.warn('Error reading tier overrides:', e);
  }
  return {};
}

export function saveTierOverrides(overrides: Record<string, 'free' | 'pro'>): void {
  try {
    localStorage.setItem(TIER_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
    window.dispatchEvent(new CustomEvent('tier-overrides-changed', { detail: overrides }));
  } catch (e) {
    console.warn('Error saving tier overrides:', e);
  }
}

export function customRecordToMathResource(rec: CustomResourceRecord, tierOverride?: 'free' | 'pro'): MathResource {
  const effectiveTier = tierOverride || rec.tier || 'free';
  return {
    id: rec.id,
    title: rec.title,
    grade: (rec.grade as any) || 'Class 10',
    topic: (rec.topic as any) || 'Polynomials',
    categoryTitle: `${rec.topic} • ${rec.format}`,
    tier: effectiveTier,
    format: (rec.format as any) || 'Formula Sheets (1-Pager)',
    description: rec.description || `Comprehensive ${rec.format} covering ${rec.topic} for ${rec.grade}. Curated by Maths at Your Fingertips.`,
    rating: 5.0,
    downloadsCount: `${rec.downloads || 0} downloads`,
    sizeOrDuration: rec.format === 'Video Lessons' ? '15 mins' : '2.1 MB • PDF',
    pageCount: rec.format === 'Formula Sheets (1-Pager)' ? '1 Page' : '8 Pages',
    badgeLabel: effectiveTier === 'free' ? 'FREE DOWNLOAD' : 'PRO PASS ONLY',
    hasVideo: !!rec.youtubeId || !!rec.facebookVideoUrl || !!rec.videoUrl || !!rec.embedHtml || rec.format === 'Video Lessons',
    tags: [rec.grade, rec.topic, rec.format],
    downloadUrl: rec.downloadUrl,
    youtubeId: rec.youtubeId,
    facebookVideoUrl: rec.facebookVideoUrl,
    videoUrl: rec.videoUrl,
    videoPlatform: rec.videoPlatform || (rec.facebookVideoUrl ? 'facebook' : rec.youtubeId ? 'youtube' : undefined),
    embedHtml: rec.embedHtml,
    price: effectiveTier === 'pro' ? 199 : undefined,
    isBoardExam: rec.grade === 'Class 10',
  };
}

export async function syncAndLoadAllResources(): Promise<{
  customList: CustomResourceRecord[];
  allResources: MathResource[];
}> {
  let customList = getLocalCustomResources();
  const tierOverrides = getTierOverrides();

  try {
    const cloudResources = await fetchCustomResources();
    if (cloudResources && cloudResources.length > 0) {
      // Merge cloud resources with local
      const mergedMap = new Map<string, CustomResourceRecord>();
      customList.forEach((r) => mergedMap.set(r.id, r));
      cloudResources.forEach((r) => mergedMap.set(r.id, r));
      customList = Array.from(mergedMap.values());
      saveLocalCustomResources(customList);
    }
  } catch (e) {
    console.warn('Cloud custom resources sync notice:', e);
  }

  // Convert custom records to MathResource
  const convertedCustom: MathResource[] = customList.map((rec) =>
    customRecordToMathResource(rec, tierOverrides[rec.id])
  );

  // Apply tier overrides to core MATH_RESOURCES
  const updatedCoreResources: MathResource[] = MATH_RESOURCES.map((r) => {
    if (tierOverrides[r.id]) {
      return {
        ...r,
        tier: tierOverrides[r.id],
        badgeLabel: tierOverrides[r.id] === 'free' ? 'FREE DOWNLOAD' : 'PRO PASS ONLY',
        price: tierOverrides[r.id] === 'pro' ? (r.price || 199) : undefined,
      };
    }
    return r;
  });

  return {
    customList,
    allResources: [...convertedCustom, ...updatedCoreResources],
  };
}
