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

export interface DailyLogEntry {
  date: string; // ISO date 'YYYY-MM-DD'
  visitors: number;
  pageViews: number;
  downloads: number;
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
  dailyHistory: DailyLogEntry[];
  updatedAt: string;
}

const STORAGE_KEY = 'maths_hub_analytics_metrics_v5';
const DAILY_HISTORY_KEY = 'maths_hub_analytics_daily_history_v2';

// Clean out legacy fake data keys if present
if (typeof localStorage !== 'undefined') {
  try {
    localStorage.removeItem('maths_hub_analytics_metrics_v4');
    localStorage.removeItem('maths_hub_analytics_daily_history_v1');
  } catch (_e) {}
}

export function generateDefaultDailyHistory(): DailyLogEntry[] {
  return [];
}

export const INITIAL_ANALYTICS: AnalyticsSummary = {
  totalVisitors: 0,
  totalPageViews: 0,
  totalFreeDownloads: 0,
  totalPaidDownloads: 0,
  conversionRate: '0%',
  avgSessionDuration: '0s',
  pages: [
    { path: '/', name: 'Home / Hero Banner', visitors: 0, pageViews: 0, avgTime: '0s', bounceRate: '0%' },
    { path: '/explore-notes', name: 'Curriculum & Notes Explorer', visitors: 0, pageViews: 0, avgTime: '0s', bounceRate: '0%' },
    { path: '/formula-deck', name: 'Pocket Formula Deck & Printable Sheets', visitors: 0, pageViews: 0, avgTime: '0s', bounceRate: '0%' },
    { path: '/ask-teacher', name: 'Ask Teacher Classroom Board Math Solver', visitors: 0, pageViews: 0, avgTime: '0s', bounceRate: '0%' },
    { path: '/video-lessons', name: 'Concept Animation & Video Masterclasses', visitors: 0, pageViews: 0, avgTime: '0s', bounceRate: '0%' },
    { path: '/free-downloads', name: 'Instant Free Revision PDF Depot', visitors: 0, pageViews: 0, avgTime: '0s', bounceRate: '0%' },
    { path: '/olympiad', name: 'IMO & Science Olympiad Portal', visitors: 0, pageViews: 0, avgTime: '0s', bounceRate: '0%' },
    { path: '/checkout', name: 'Pro Pass Checkout & Payment', visitors: 0, pageViews: 0, avgTime: '0s', bounceRate: '0%' },
  ],
  posts: [],
  dailyViews: [],
  dailyHistory: [],
  updatedAt: new Date().toISOString(),
};

export function getDailyHistoryLogs(): DailyLogEntry[] {
  try {
    const raw = localStorage.getItem(DAILY_HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {}
  return [];
}

export function saveDailyHistoryLogs(logs: DailyLogEntry[]): void {
  try {
    localStorage.setItem(DAILY_HISTORY_KEY, JSON.stringify(logs));
  } catch (_e) {
    // Non-blocking telemetry
  }
}

export function getAnalyticsMetrics(): AnalyticsSummary {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let base = raw ? JSON.parse(raw) : { ...INITIAL_ANALYTICS };

    // Reconcile with real student download records
    const rawDownloads = localStorage.getItem('maths_hub_admin_download_records');
    if (rawDownloads) {
      try {
        const downloadRecords = JSON.parse(rawDownloads);
        if (Array.isArray(downloadRecords)) {
          const freeCount = downloadRecords.filter((d: any) => d.tier !== 'pro').length;
          const proCount = downloadRecords.filter((d: any) => d.tier === 'pro').length;
          base.totalFreeDownloads = freeCount;
          base.totalPaidDownloads = proCount;

          // Reconcile post downloads
          const downloadMap: Record<string, number> = {};
          downloadRecords.forEach((d: any) => {
            const key = d.resourceId || d.resourceTitle;
            if (key) {
              downloadMap[key] = (downloadMap[key] || 0) + 1;
            }
          });

          // Update existing or inject new custom posts into analytics
          downloadRecords.forEach((d: any) => {
            const existing = base.posts.find((p: any) => p.id === d.resourceId || p.title === d.resourceTitle);
            if (existing) {
              existing.downloads = Math.max(existing.downloads, downloadMap[d.resourceId || d.resourceTitle] || 1);
            } else if (d.resourceTitle) {
              base.posts.unshift({
                id: d.resourceId || `custom-${Date.now()}`,
                title: d.resourceTitle,
                grade: d.grade || 'All',
                topic: d.topic || 'General',
                tier: d.tier === 'pro' ? 'pro' : 'free',
                format: d.format || 'Formula Sheet',
                views: Math.max(1, downloadMap[d.resourceId || d.resourceTitle] || 1),
                downloads: downloadMap[d.resourceId || d.resourceTitle] || 1,
                upvotes: 0,
                lastVisited: 'Just now',
              });
            }
          });
        }
      } catch {}
    }

    // Reconcile with real Razorpay orders
    const rawOrders = localStorage.getItem('maths_portal_local_orders');
    if (rawOrders) {
      try {
        const orders = JSON.parse(rawOrders);
        if (Array.isArray(orders) && orders.length > 0) {
          const capturedCount = orders.filter((o: any) => o.status === 'captured' || !o.status).length;
          base.totalPaidDownloads = Math.max(base.totalPaidDownloads, capturedCount);
          if (base.totalVisitors > 0) {
            base.conversionRate = `${((capturedCount / base.totalVisitors) * 100).toFixed(2)}%`;
          }
        }
      } catch {}
    }

    base.dailyHistory = getDailyHistoryLogs();
    return base;
  } catch (_e) {
    // Non-blocking fallback
  }
  return { ...INITIAL_ANALYTICS, dailyHistory: getDailyHistoryLogs() };
}

export function saveAnalyticsMetrics(data: AnalyticsSummary): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('analytics-updated', { detail: data }));
  } catch (_e) {
    // Non-blocking telemetry
  }
}

export function recordPageViewEvent(path: string, pageName?: string): void {
  try {
    const current = getAnalyticsMetrics();
    current.totalPageViews += 1;

    // Track unique session visitor
    const sessionKey = 'maths_hub_session_logged';
    let isNewVisitor = false;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      current.totalVisitors += 1;
      isNewVisitor = true;
    }

    // Update specific page stats
    let page = current.pages.find((p) => p.path === path);
    if (page) {
      page.pageViews += 1;
      if (isNewVisitor) page.visitors += 1;
    } else if (pageName) {
      current.pages.push({
        path,
        name: pageName,
        visitors: 1,
        pageViews: 1,
        avgTime: '3m 00s',
        bounceRate: '20%',
      });
    }

    // Update today's entry in dailyViews
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = days[new Date().getDay()];
    const todayEntry = current.dailyViews.find((d) => d.date === currentDay);
    if (todayEntry) {
      todayEntry.visitors += 1;
    }

    // Update today's entry in date-stamped daily history logs
    const todayStr = new Date().toISOString().slice(0, 10);
    const history = getDailyHistoryLogs();
    const existingDay = history.find((h) => h.date === todayStr);
    if (existingDay) {
      existingDay.pageViews += 1;
      if (isNewVisitor) existingDay.visitors += 1;
    } else {
      history.push({
        date: todayStr,
        visitors: isNewVisitor ? 1 : 0,
        pageViews: 1,
        downloads: 0,
      });
    }
    saveDailyHistoryLogs(history);

    current.updatedAt = new Date().toISOString();
    saveAnalyticsMetrics(current);
  } catch (_e) {
    // Non-blocking telemetry
  }
}

export function recordResourceDownloadEvent(
  resourceId: string,
  isPro: boolean,
  details?: { title?: string; grade?: string; topic?: string; format?: string }
): void {
  try {
    const current = getAnalyticsMetrics();
    if (isPro) {
      current.totalPaidDownloads += 1;
    } else {
      current.totalFreeDownloads += 1;
    }

    // Update today's download count in dailyViews
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = days[new Date().getDay()];
    const todayEntry = current.dailyViews.find((d) => d.date === currentDay);
    if (todayEntry) {
      todayEntry.downloads += 1;
    }

    // Update today's download count in date-stamped daily history logs
    const todayStr = new Date().toISOString().slice(0, 10);
    const history = getDailyHistoryLogs();
    const existingDay = history.find((h) => h.date === todayStr);
    if (existingDay) {
      existingDay.downloads += 1;
    } else {
      history.push({
        date: todayStr,
        visitors: 1,
        pageViews: 1,
        downloads: 1,
      });
    }
    saveDailyHistoryLogs(history);

    let targetPost = current.posts.find((p) => p.id === resourceId);
    if (targetPost) {
      targetPost.downloads += 1;
      targetPost.lastVisited = 'Just now';
    } else if (details?.title) {
      current.posts.unshift({
        id: resourceId,
        title: details.title,
        grade: details.grade || 'All',
        topic: details.topic || 'General',
        tier: isPro ? 'pro' : 'free',
        format: details.format || 'Formula Sheet',
        views: 1,
        downloads: 1,
        upvotes: 0,
        lastVisited: 'Just now',
      });
    }

    current.updatedAt = new Date().toISOString();
    saveAnalyticsMetrics(current);
  } catch (_e) {
    // Non-blocking telemetry
  }
}

export function recordPostViewEvent(
  resourceId: string,
  details?: { title?: string; grade?: string; topic?: string; format?: string }
): void {
  try {
    const current = getAnalyticsMetrics();
    current.totalPageViews += 1;
    let targetPost = current.posts.find((p) => p.id === resourceId);
    if (targetPost) {
      targetPost.views += 1;
      targetPost.lastVisited = 'Just now';
    } else if (details?.title) {
      current.posts.unshift({
        id: resourceId,
        title: details.title,
        grade: details.grade || 'All',
        topic: details.topic || 'General',
        tier: details.format?.toLowerCase().includes('pro') ? 'pro' : 'free',
        format: details.format || 'Study Notes',
        views: 1,
        downloads: 0,
        upvotes: 0,
        lastVisited: 'Just now',
      });
    }
    current.updatedAt = new Date().toISOString();
    saveAnalyticsMetrics(current);
  } catch (_e) {
    // Non-blocking telemetry
  }
}
