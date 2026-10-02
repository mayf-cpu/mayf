import { NotificationRecord, fetchNotifications, sendNotificationToFirestore } from '../firebase';

const NOTIFICATIONS_STORAGE_KEY = 'maths_portal_notifications_v1';

export const DEFAULT_NOTIFICATIONS: NotificationRecord[] = [
  {
    id: 'notif-1',
    title: '⚡ Class 9 Half-Yearly Blitz',
    message: 'Mock exam test series uploaded today. Free download available for all registered students!',
    tag: 'Exam Prep',
    priority: 'high',
    targetGrade: 'Class 9',
    targetAudience: 'all',
    createdBy: 'Admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    title: '📐 Term 2 Trigonometry Cheatsheet',
    message: '1-page quick revision sheet updated for 2026 syllabus with all formulas & shortcuts.',
    tag: 'Formula Deck',
    priority: 'normal',
    targetGrade: 'Class 10',
    targetAudience: 'all',
    createdBy: 'Admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'notif-3',
    title: '🌟 New Olympiad Mastery Worksheets',
    message: 'Free Class 7 & 8 high-order thinking problems now open in the resource catalog.',
    tag: 'Olympiad',
    priority: 'normal',
    targetGrade: 'All Grades',
    targetAudience: 'all',
    createdBy: 'Admin',
    createdAt: new Date().toISOString(),
  },
];

export function getLocalNotifications(): NotificationRecord[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (_e) {
    // Graceful fallback to default notifications
  }
  return DEFAULT_NOTIFICATIONS;
}

export function saveLocalNotifications(notifications: NotificationRecord[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    window.dispatchEvent(new CustomEvent('notifications-changed', { detail: notifications }));
  } catch (_e) {
    // Ignore
  }
}

export async function syncAndLoadNotifications(): Promise<NotificationRecord[]> {
  let list = getLocalNotifications();
  try {
    const cloud = await fetchNotifications();
    if (cloud && cloud.length > 0) {
      const map = new Map<string, NotificationRecord>();
      list.forEach((n) => map.set(n.id, n));
      cloud.forEach((n) => map.set(n.id, n));
      list = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      saveLocalNotifications(list);
    }
  } catch (_e) {
    // Graceful fallback to local cache
  }
  return list;
}
