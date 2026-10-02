import React, { useState } from 'react';
import {
  NotificationRecord,
  sendNotificationToFirestore,
  deleteNotificationFromFirestore,
} from '../../firebase';
import {
  getLocalNotifications,
  saveLocalNotifications,
} from '../../services/notifications';

interface AdminNotificationsTabProps {
  notifications: NotificationRecord[];
  onRefresh: () => void;
  onToast: (msg: string) => void;
}

export const AdminNotificationsTab: React.FC<AdminNotificationsTabProps> = ({
  notifications,
  onRefresh,
  onToast,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'free' | 'pro' | 'class9' | 'class10'>('all');
  const [actionUrl, setActionUrl] = useState('#formula-deck');
  const [isSending, setIsSending] = useState(false);

  // Fallback demo notifications if initial empty state
  const localList = getLocalNotifications();
  const displayNotifications: NotificationRecord[] = notifications.length > 0 ? notifications : localList;

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      onToast('⚠️ Please enter both a title and message.');
      return;
    }

    setIsSending(true);
    try {
      const payload: NotificationRecord = {
        id: `notif-${Date.now()}`,
        title: title.trim(),
        message: message.trim(),
        targetAudience,
        actionUrl: actionUrl.trim() || undefined,
        createdAt: new Date().toISOString(),
        createdBy: 'sachin.itig@gmail.com',
      };

      const existing = getLocalNotifications();
      const updated = [payload, ...existing.filter((n) => n.id !== payload.id)];
      saveLocalNotifications(updated);

      try {
        await sendNotificationToFirestore(payload);
      } catch (_cloudErr) {
        // Non-blocking cloud sync fallback
      }

      // Dispatch browser notification event
      window.dispatchEvent(new CustomEvent('broadcast-notification', { detail: payload }));
      onToast('🚀 Broadcast notification sent to all enrolled students & Header bell!');
      setTitle('');
      setMessage('');
      onRefresh();
    } catch (e) {
      onToast('Failed to dispatch notification.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (id: string, itemTitle: string) => {
    if (!window.confirm(`Delete announcement "${itemTitle}"?`)) return;
    try {
      const existing = getLocalNotifications();
      const updated = existing.filter((n) => n.id !== id);
      saveLocalNotifications(updated);

      try {
        await deleteNotificationFromFirestore(id);
      } catch (_cloudErr) {
        // Non-blocking cloud sync fallback
      }

      onToast('Notification removed from history.');
      onRefresh();
    } catch (e) {
      onToast('Failed to delete notification.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 1. COMPOSE BROADCAST NOTIFICATION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-500">campaign</span>
              <span>Send Push Broadcast &amp; Student Announcements</span>
            </h3>
            <p className="text-xs text-slate-500">
              Deliver high-priority announcements, exam tips, and new material alerts to students' browsers and notification bells.
            </p>
          </div>
          <span className="text-xs font-mono bg-rose-50 text-rose-700 font-bold px-2.5 py-1 rounded-lg">
            Live Web Push
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <form onSubmit={handleSendNotification} className="lg:col-span-2 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Notification Headline / Title: *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 📢 Class 10 Board Mock Exam #4 Released!"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Announcement Message: *
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write message details for students..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Target Student Audience:
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800"
                >
                  <option value="all">🌍 All Registered Students</option>
                  <option value="class10">🎓 Class 10 Students Only</option>
                  <option value="class9">📐 Class 9 Students Only</option>
                  <option value="free">🟢 Free Learners (Upsell)</option>
                  <option value="pro">⭐ Pro Pass Holders</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Action Button Link / Target:
                </label>
                <input
                  type="text"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="#formula-deck or /explore-notes"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSending}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-xs flex items-center gap-2 disabled:opacity-75"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isSending ? 'sync' : 'send'}
                </span>
                <span>{isSending ? 'Broadcasting...' : 'Send Broadcast to Students'}</span>
              </button>
            </div>
          </form>

          {/* Live Mobile Push Preview Mockup */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col justify-between border border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2 tracking-wider">
                Simulated Push Alert Preview
              </span>
              <div className="bg-slate-800/90 border border-slate-700 p-3.5 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center text-[10px] font-bold">
                      ∑
                    </div>
                    <span className="text-[11px] font-bold text-slate-200">Maths at Your Fingertips</span>
                  </div>
                  <span className="text-[10px] text-slate-400">now</span>
                </div>
                <h5 className="text-xs font-bold text-white mb-1">
                  {title || '📢 Class 10 Formula Sheet Update'}
                </h5>
                <p className="text-[11px] text-slate-300 line-clamp-2">
                  {message || 'Download your rapid revision sheets for upcoming board exams.'}
                </p>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 mt-4 pt-3 border-t border-slate-800">
              Students will receive this alert in their browser toast and notification drawer.
            </div>
          </div>
        </div>
      </div>

      {/* 2. BROADCAST HISTORY */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">Broadcast Announcement History</h4>
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
            {displayNotifications.length} Sent
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {displayNotifications.map((notif) => (
            <div key={notif.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded uppercase">
                    Audience: {notif.targetAudience}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h5 className="text-xs font-bold text-slate-900 truncate">{notif.title}</h5>
                <p className="text-[11px] text-slate-600 truncate">{notif.message}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDelete(notif.id, notif.title)}
                  className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  title="Delete from history"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
