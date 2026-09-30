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

const STORAGE_KEY = 'maths_hub_analytics_metrics_v4';
const DAILY_HISTORY_KEY = 'maths_hub_analytics_daily_history_v1';

// Generate realistic seeded history for past 365 days if none exists
export function generateDefaultDailyHistory(): DailyLogEntry[] {
  const result: DailyLogEntry[] = [];
  const now = new Date();
  
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Growth factor over time (higher numbers more recently)
    const recencyWeight = (365 - i) / 365;
    const baseVisitors = Math.floor((12 + recencyWeight * 35) * (isWeekend ? 1.35 : 1.0));
    const variance = (i * 7) % 9 - 4;
    const visitors = Math.max(4, baseVisitors + variance);
    const pageViews = Math.max(visitors * 2, Math.floor(visitors * (2.8 + (i % 3) * 0.4)));
    const downloads = Math.max(1, Math.floor(visitors * 0.45));

    result.push({
      date: dateStr,
      visitors,
      pageViews,
      downloads,
    });
  }
  return result;
}

export const INITIAL_ANALYTICS: AnalyticsSummary = {
  totalVisitors: 8420,
  totalPageViews: 24650,
  totalFreeDownloads: 3410,
  totalPaidDownloads: 480,
  conversionRate: '5.7%',
  avgSessionDuration: '3m 24s',
  pages: [
    { path: '/', name: 'Home / Hero Banner', visitors: 8420, pageViews: 12500, avgTime: '2m 14s', bounceRate: '15%' },
    { path: '/explore-notes', name: 'Curriculum & Notes Explorer', visitors: 6100, pageViews: 9200, avgTime: '4m 30s', bounceRate: '12%' },
    { path: '/formula-deck', name: 'Pocket Formula Deck & Printable Sheets', visitors: 4900, pageViews: 7100, avgTime: '3m 45s', bounceRate: '10%' },
    { path: '/ask-teacher', name: 'Ask Teacher Classroom Board Math Solver', visitors: 3800, pageViews: 6400, avgTime: '5m 40s', bounceRate: '8%' },
    { path: '/video-lessons', name: 'Concept Animation & Video Masterclasses', visitors: 3200, pageViews: 5100, avgTime: '5m 10s', bounceRate: '18%' },
    { path: '/free-downloads', name: 'Instant Free Revision PDF Depot', visitors: 4100, pageViews: 6200, avgTime: '3m 50s', bounceRate: '14%' },
    { path: '/olympiad', name: 'IMO & Science Olympiad Portal', visitors: 2200, pageViews: 3800, avgTime: '4m 02s', bounceRate: '20%' },
    { path: '/checkout', name: 'Pro Pass Checkout & Payment', visitors: 1100, pageViews: 1900, avgTime: '2m 15s', bounceRate: '25%' },
  ],
  posts: [],
  dailyViews: [
    { date: 'Mon', visitors: 42, downloads: 18 },
    { date: 'Tue', visitors: 48, downloads: 22 },
    { date: 'Wed', visitors: 55, downloads: 26 },
    { date: 'Thu', visitors: 51, downloads: 24 },
    { date: 'Fri', visitors: 62, downloads: 31 },
    { date: 'Sat', visitors: 78, downloads: 39 },
    { date: 'Sun', visitors: 84, downloads: 44 },
  ],
  dailyHistory: [],
  updatedAt: new Date().toISOString(),
};

export function getDailyHistoryLogs(): DailyLogEntry[] {
  try {
    const raw = localStorage.getItem(DAILY_HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  const seeded = generateDefaultDailyHistory();
  saveDailyHistoryLogs(seeded);
  return seeded;
}

export function saveDailyHistoryLogs(logs: DailyLogEntry[]): void {
  try {
    localStorage.setItem(DAILY_HISTORY_KEY, JSON.stringify(logs));
  } catch (e) {
    console.warn('Could not save daily history logs:', e);
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
  } catch (e) {
    console.warn('Analytics parsing error:', e);
  }
  return { ...INITIAL_ANALYTICS, dailyHistory: getDailyHistoryLogs() };
}

export function saveAnalyticsMetrics(data: AnalyticsSummary): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('analytics-updated', { detail: data }));
  } catch (e) {
    console.warn('Could not save analytics metrics:', e);
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
  } catch (e) {
    console.warn('Page view tracking notice:', e);
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
  } catch (e) {
    console.warn('Download tracking notice:', e);
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
  } catch (e) {
    console.warn('Post view tracking notice:', e);
  }
}
