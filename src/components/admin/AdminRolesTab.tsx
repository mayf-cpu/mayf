/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AdminUserRecord,
  PRIMARY_SUPERADMIN_EMAIL,
} from '../../firebase';

interface AdminRolesTabProps {
  admins: AdminUserRecord[];
  onAddAdmin: (newAdmin: AdminUserRecord) => Promise<void>;
  onRevokeAdmin: (email: string) => Promise<void>;
  currentAdminEmail?: string | null;
  onToast: (msg: string) => void;
}

function cleanFriendlyMessage(err: any): string {
  if (!err) return 'Operation failed. Please check credentials and try again.';
  const str = err?.message || String(err);
  try {
    const jsonMatch = str.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error) return String(parsed.error);
    }
  } catch {}
  return str.replace(/^Error:\s*/i, '').replace(/\{.*\}/g, '').trim() || 'Operation failed. Please try again.';
}

export const AdminRolesTab: React.FC<AdminRolesTabProps> = ({
  admins,
  onAddAdmin,
  onRevokeAdmin,
  currentAdminEmail,
  onToast,
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'superadmin' | 'admin' | 'faculty'>('admin');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revokingEmail, setRevokingEmail] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      onToast('Please provide a valid Google email address.');
      return;
    }

    if (admins.some((a) => a.email.toLowerCase().trim() === cleanEmail)) {
      onToast('This email is already assigned an administrator role.');
      return;
    }

    setIsSubmitting(true);
    try {
      const record: AdminUserRecord = {
        email: cleanEmail,
        role: newRole,
        assignedBy: currentAdminEmail || PRIMARY_SUPERADMIN_EMAIL,
        assignedAt: new Date().toISOString(),
        displayName: newDisplayName.trim() || cleanEmail.split('@')[0],
        notes: newNotes.trim() || 'Assigned via Admin Management Panel',
      };

      await onAddAdmin(record);
      setNewEmail('');
      setNewDisplayName('');
      setNewNotes('');
      setSuccessMessage(`Administrator access granted to ${cleanEmail} (${newRole.toUpperCase()})`);
      onToast(`Administrator role granted to ${cleanEmail} successfully!`);
    } catch (err: any) {
      const friendlyError = cleanFriendlyMessage(err);
      onToast(`Failed to assign role: ${friendlyError}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (email: string) => {
    if (email.toLowerCase().trim() === PRIMARY_SUPERADMIN_EMAIL.toLowerCase().trim()) {
      onToast('Primary Superadministrator cannot be removed.');
      return;
    }

    if (!window.confirm(`Are you sure you want to revoke administrator access for ${email}? They will immediately lose access to this control panel.`)) {
      return;
    }

    setRevokingEmail(email);
    try {
      await onRevokeAdmin(email);
      onToast(`Revoked administrator privileges for ${email}.`);
    } catch (err: any) {
      const friendlyError = cleanFriendlyMessage(err);
      onToast(`Failed to revoke role: ${friendlyError}`);
    } finally {
      setRevokingEmail(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 1. Header & Security Overview */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[15px]">admin_panel_settings</span>
              <span>Zero-Trust Admin Role Provisioning</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Administrator Accounts &amp; Access Roles
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Only authenticated users whose Google email is listed below are permitted to access this panel.
              Zero links exist on the public website; authorized staff must navigate directly to the secret admin URL.
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 shrink-0 text-right sm:text-center">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">
              Direct URL Guard
            </span>
            <span className="text-xs font-black text-emerald-900 flex items-center gap-1 mt-0.5 justify-end sm:justify-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Protected &bull; Noindex
            </span>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-bold text-slate-500 block mb-1">Total Authorized Admins</span>
            <span className="text-2xl font-black text-slate-900">{admins.length}</span>
            <span className="text-[11px] text-slate-400 block mt-1">Granted panel access</span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
            <span className="text-xs font-bold text-indigo-800 block mb-1">Primary Owner</span>
            <span className="text-sm font-black text-indigo-950 font-mono truncate block">
              {PRIMARY_SUPERADMIN_EMAIL}
            </span>
            <span className="text-[11px] text-indigo-600 block mt-1">Permanent root authority</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <span className="text-xs font-bold text-amber-800 block mb-1">Access Channel</span>
            <span className="text-xs font-black text-amber-950 font-mono block">
              Direct URL: /#admin
            </span>
            <span className="text-[11px] text-amber-700 block mt-1">Hidden from public website</span>
          </div>
        </div>
      </div>

      {/* 2. Add New Admin Form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">person_add</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Assign New Administrator</h3>
            <p className="text-xs text-slate-500">Add an educator, faculty member, or assistant to the control panel</p>
          </div>
        </div>

        {successMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs px-2 py-0.5 rounded cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Google Email Address: <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                  mail
                </span>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="teacher.name@gmail.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Must match the Google account the administrator will use to sign in.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Administrator Role:
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="admin">Full Administrator</option>
                <option value="superadmin">Superadministrator</option>
                <option value="faculty">Faculty / Content Admin</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Full Name / Designation:
              </label>
              <input
                type="text"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="e.g. Prof. Vivek Sharma (Senior Math Faculty)"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Notes / Authorization Purpose:
              </label>
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="e.g. CBSE Class 10 Notes Curator & Doubts Faculty"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[17px]">verified_user</span>
              <span>{isSubmitting ? 'Granting Role...' : 'Assign Administrator Role'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. List of Authorized Admins */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Active Authorized Administrators ({admins.length})
            </h3>
            <p className="text-xs text-slate-500">
              Accounts permitted to log in to this management console
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {admins.map((admin) => {
            const isRoot = admin.email.toLowerCase().trim() === PRIMARY_SUPERADMIN_EMAIL.toLowerCase().trim();
            const isCurrent = admin.email.toLowerCase().trim() === (currentAdminEmail || '').toLowerCase().trim();

            return (
              <div
                key={admin.email}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 px-3 rounded-2xl transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isRoot
                        ? 'bg-purple-100 text-purple-700'
                        : admin.role === 'superadmin'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {isRoot ? 'shield' : 'shield_person'}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold text-slate-900">
                        {admin.displayName || admin.email.split('@')[0]}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isRoot
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : admin.role === 'superadmin'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isRoot ? 'Primary Superadmin' : admin.role}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                          You
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 font-mono mt-0.5">{admin.email}</div>

                    {admin.notes && (
                      <p className="text-[11px] text-slate-500 mt-1 italic">&ldquo;{admin.notes}&rdquo;</p>
                    )}

                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                      <span>Assigned by: {admin.assignedBy || 'System'}</span>
                      {admin.assignedAt && (
                        <span>&bull; {new Date(admin.assignedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  {isRoot ? (
                    <span className="text-[11px] font-bold text-slate-400 px-3 py-1.5 bg-slate-100 rounded-xl">
                      Protected Root
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={revokingEmail === admin.email}
                      onClick={() => handleRevoke(admin.email)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1 border border-rose-200"
                    >
                      <span className="material-symbols-outlined text-[15px]">person_remove</span>
                      <span>{revokingEmail === admin.email ? 'Revoking...' : 'Revoke Role'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Security & SEO Information Notice */}
      <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 border border-slate-800 space-y-3 text-xs leading-relaxed">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <span className="material-symbols-outlined text-[20px]">security</span>
          <span>Security &amp; Crawler Isolation Architecture</span>
        </div>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
          <li>
            <strong>Zero Public Links:</strong> All buttons, menu links, and drawer references to the admin panel have been removed from the front website.
          </li>
          <li>
            <strong>Secret Direct URL:</strong> Authorized staff must navigate directly to <code className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded font-mono">/#admin</code> or <code className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded font-mono">/#portal-vault-8842</code>.
          </li>
          <li>
            <strong>Anti-Scraping &amp; SEO Isolation:</strong> Robots.txt strictly disallows all search engine spiders (<code className="text-slate-300">Googlebot, Bingbot, Slurp, DuckDuckBot</code>) from crawling or indexing admin paths.
          </li>
          <li>
            <strong>Meta Tag Protection:</strong> Whenever the admin panel is mounted in the browser, meta robots headers (<code className="text-slate-300">noindex, nofollow, noarchive, nosnippet</code>) are injected dynamically.
          </li>
        </ul>
      </div>
    </div>
  );
};
