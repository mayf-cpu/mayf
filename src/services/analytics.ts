// Analytics and Website Traffic Tracking Service

export interface PageTraffic {
  path: string;
  name: string;
  visitors: number;
  pageViews: number;
  avgTime: string;
  bounceRate: string;
}

export interface PostTraffic {
  id: string;
  title: string;
  grade: string;
  topic: string;
  tier: 'free' | 'pro';
  format: string;
  views: number;
  downloads: number;
  upvotes: number;
  lastVisited: string;
}

export interface AnalyticsSummary {
  totalVisitors: number;
  totalPageViews: number;
  totalFreeDownloads: number;
  totalPaidDownloads: number;
  conversionRate: string;
  avgSessionDuration: string;
  pages: PageTraffic[];
  posts: PostTraffic[];
  dailyViews: { date: string; visitors: number; downloads: number }[];
  updatedAt: string;
}

const STORAGE_KEY = 'mayf_analytics_metrics_v2';

export const INITIAL_ANALYTICS: AnalyticsSummary = {
  totalVisitors: 14820,
  totalPageViews: 48950,
  totalFreeDownloads: 3410,
  totalPaidDownloads: 512,
  conversionRate: '3.45%',
  avgSessionDuration: '4m 18s',
  pages: [
    { path: '/', name: 'Home / Hero Banner', visitors: 14820, pageViews: 22100, avgTime: '2m 14s', bounceRate: '28%' },
    { path: '/explore-notes', name: 'Curriculum & Notes Explorer', visitors: 9450, pageViews: 14200, avgTime: '5m 30s', bounceRate: '19%' },
    { path: '/formula-deck', name: 'Pocket Formula Deck & Printable Sheets', visitors: 6800, pageViews: 9300, avgTime: '4m 45s', bounceRate: '15%' },
    { path: '/video-lessons', name: 'Concept Animation & Video Masterclasses', visitors: 4200, pageViews: 6150, avgTime: '7m 10s', bounceRate: '22%' },
    { path: '/free-downloads', name: 'Instant Free Revision PDF Depot', visitors: 5600, pageViews: 7900, avgTime: '3m 50s', bounceRate: '24%' },
    { path: '/olympiad', name: 'IMO & Science Olympiad Portal', visitors: 2890, pageViews: 3820, avgTime: '6m 02s', bounceRate: '31%' },
    { path: '/checkout', name: 'Pro Pass Checkout & Payment', visitors: 1240, pageViews: 1580, avgTime: '3m 15s', bounceRate: '41%' },
  ],
  posts: [
    {
      id: 'res-quad-class10',
      title: 'Class 10: Quadratic Equations 2-Min Concept & Derivation Sheet',
      grade: 'Class 10',
      topic: 'Algebra & Quadratics',
      tier: 'free',
      format: 'Formula Sheet',
      views: 3940,
      downloads: 1250,
      upvotes: 412,
      lastVisited: '2 mins ago',
    },
    {
      id: 'res-trig-class10',
      title: 'Class 10: Trigonometric Ratios & Angle Table Rapid Sheet',
      grade: 'Class 10',
      topic: 'Trigonometry',
      tier: 'free',
      format: 'Formula Sheet',
      views: 4520,
      downloads: 1410,
      upvotes: 528,
      lastVisited: 'Just now',
    },
    {
      id: 'res-triangles-pro',
      title: 'Class 10: Triangles BPT & Similarity Theorem Proofs Masterclass',
      grade: 'Class 10',
      topic: 'Geometry',
      tier: 'pro',
      format: 'Video Masterclass',
      views: 2180,
      downloads: 410,
      upvotes: 280,
      lastVisited: '15 mins ago',
    },
    {
      id: 'res-poly-class9',
      title: 'Class 9: Polynomial Identities & Remainder Theorem Notes',
      grade: 'Class 9',
      topic: 'Polynomials',
      tier: 'free',
      format: 'Cheat Sheet',
      views: 3100,
      downloads: 890,
      upvotes: 310,
      lastVisited: '8 mins ago',
    },
    {
      id: 'res-circles-class9',
      title: 'Class 9: Circles Angle Subtended & Cyclic Quadrilateral Proofs',
      grade: 'Class 9',
      topic: 'Circles',
      tier: 'pro',
      format: 'NCERT Exemplar',
      views: 1840,
      downloads: 320,
      upvotes: 195,
      lastVisited: '22 mins ago',
    },
    {
      id: 'res-mensuration-class8',
      title: 'Class 8: Surface Area & Volume 3D Models Summary',
      grade: 'Class 8',
      topic: 'Mensuration',
      tier: 'free',
      format: 'Formula Sheet',
      views: 1950,
      downloads: 540,
      upvotes: 188,
      lastVisited: '1 hour ago',
    },
    {
      id: 'res-linear-class8',
      title: 'Class 8: Linear Equations in One Variable Word Problem Guide',
      grade: 'Class 8',
      topic: 'Linear Equations',
      tier: 'free',
      format: 'Step-by-Step PDF',
      views: 1420,
      downloads: 430,
      upvotes: 140,
      lastVisited: '45 mins ago',
    },
    {
      id: 'res-fractions-class6',
      title: 'Class 6 & 7: Fractions, Decimals & Visual Number Line Guide',
      grade: 'Class 6',
      topic: 'Fractions & Decimals',
      tier: 'free',
      format: 'Pocket Guide',
      views: 1670,
      downloads: 490,
      upvotes: 160,
      lastVisited: '3 hours ago',
    },
  ],
  dailyViews: [
    { date: 'Mon', visitors: 1850, downloads: 420 },
    { date: 'Tue', visitors: 2100, downloads: 490 },
    { date: 'Wed', visitors: 2450, downloads: 580 },
    { date: 'Thu', visitors: 2300, downloads: 540 },
    { date: 'Fri', visitors: 2800, downloads: 670 },
    { date: 'Sat', visitors: 3400, downloads: 820 },
    { date: 'Sun', visitors: 3900, downloads: 910 },
  ],
  updatedAt: new Date().toISOString(),
};

export function getAnalyticsMetrics(): AnalyticsSummary {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Analytics parsing error:', e);
  }
  return INITIAL_ANALYTICS;
}

export function saveAnalyticsMetrics(data: AnalyticsSummary): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Could not save analytics metrics:', e);
  }
}

export function recordResourceDownloadEvent(resourceId: string, isPro: boolean): void {
  try {
    const current = getAnalyticsMetrics();
    if (isPro) {
      current.totalPaidDownloads += 1;
    } else {
      current.totalFreeDownloads += 1;
    }
    const targetPost = current.posts.find((p) => p.id === resourceId);
    if (targetPost) {
      targetPost.downloads += 1;
      targetPost.lastVisited = 'Just now';
    }
    current.updatedAt = new Date().toISOString();
    saveAnalyticsMetrics(current);
  } catch (e) {
    console.warn('Download tracking notice:', e);
  }
}

export function recordPostViewEvent(resourceId: string): void {
  try {
    const current = getAnalyticsMetrics();
    current.totalPageViews += 1;
    const targetPost = current.posts.find((p) => p.id === resourceId);
    if (targetPost) {
      targetPost.views += 1;
      targetPost.lastVisited = 'Just now';
    }
    saveAnalyticsMetrics(current);
  } catch (e) {
    console.warn('Post view tracking notice:', e);
  }
}
