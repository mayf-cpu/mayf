import React, { useState } from 'react';
import {
  UserProfile,
  grantProStatusManually,
  toggleUserProStatus,
  deleteStudentAccount,
} from '../../firebase';
import { formatPrice } from '../../services/currency';

interface AdminStudentsTabProps {
  users: UserProfile[];
  onRefresh: () => void;
  onToast: (msg: string) => void;
}

const AVAILABLE_COURSES = [
  { id: 'c10-board', title: 'Class 10 Board 100/100 Pro Pass', price: 499 },
  { id: 'c9-mastery', title: 'Class 9 Complete Math Mastery Pass', price: 399 },
  { id: 'c8-foundation', title: 'Class 8 High-School Foundation Pass', price: 299 },
  { id: 'all-access', title: 'All-Access 1-Year Pro Pass (Classes 5-10)', price: 999 },
  { id: 'olympiad-pass', title: 'IMO & National Math Olympiad Bootcamp', price: 699 },
];

export const AdminStudentsTab: React.FC<AdminStudentsTabProps> = ({
  users,
  onRefresh,
  onToast,
}) => {
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pro' | 'Free'>('All');

  // Manual Assign Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(AVAILABLE_COURSES[0].title);
  const [accessDuration, setAccessDuration] = useState('1 Year');
  const [grantReason, setGrantReason] = useState('Merit Scholarship / Top Performer');
  const [isAssigning, setIsAssigning] = useState(false);

  // Actual registered students only (no dummy data)
  const displayUsers: UserProfile[] = users;

  const filteredStudents = displayUsers.filter((u) => {
    const matchSearch =
      (u.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.userId || '').toLowerCase().includes(search.toLowerCase());
    const matchGrade = gradeFilter === 'All' || u.grade === gradeFilter;
    const matchStatus =
      statusFilter === 'All' || (statusFilter === 'Pro' ? u.isPro : !u.isPro);
    return matchSearch && matchGrade && matchStatus;
  });

  const handleManualGrantCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      onToast('⚠️ Please select a student to assign course.');
      return;
    }

    setIsAssigning(true);
    try {
      await grantProStatusManually(selectedStudentId, `${selectedCourse} (${accessDuration} - ${grantReason})`);
      onToast(`🎉 Assigned "${selectedCourse}" to student successfully!`);
      setSelectedStudentId('');
      onRefresh();
    } catch (err) {
      onToast('Error assigning course. Check student ID.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleTogglePro = async (user: UserProfile) => {
    const nextStatus = !user.isPro;
    try {
      await toggleUserProStatus(user.userId, nextStatus, nextStatus ? 'Admin Assigned Pro Pass' : '');
      onToast(`Updated ${user.displayName || user.email} to ${nextStatus ? '⭐ PRO' : 'FREE'}`);
      onRefresh();
    } catch (e) {
      onToast('Failed to update student Pro status.');
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove student "${name}"?`)) return;
    try {
      await deleteStudentAccount(userId);
      onToast(`Student ${name} removed from registry.`);
      onRefresh();
    } catch (e) {
      onToast('Failed to delete student.');
    }
  };

  const handleExportCSV = () => {
    const headers = ['User ID', 'Full Name', 'Email', 'Grade', 'Pro Status', 'Subscribed Plan', 'Joined Date'];
    const rows = filteredStudents.map((u) => [
      `"${u.userId}"`,
      `"${u.displayName || 'Learner'}"`,
      `"${u.email}"`,
      `"${u.grade || 'Class 9'}"`,
      u.isPro ? 'PRO' : 'FREE',
      `"${u.proPlan || 'N/A'}"`,
      `"${u.createdAt || new Date().toISOString()}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `students_registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('📥 Students directory exported to CSV!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* CARD 1: Manually Assign Paid Courses Without Payment */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-blue-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-amber-400 text-[22px]">card_membership</span>
              <h3 className="text-base font-bold">Manually Assign Paid Courses to Students</h3>
              <span className="bg-amber-400 text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                Zero ₹ Payment
              </span>
            </div>
            <p className="text-xs text-blue-200">
              Grant instant Pro courses or formula packs to students for scholarships, offline cash collections, or special incentives.
            </p>
          </div>
        </div>

        <form onSubmit={handleManualGrantCourse} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Select Student */}
          <div>
            <label className="text-[11px] font-bold text-blue-200 block mb-1">
              Select Student:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 bg-white text-slate-800 text-xs font-semibold rounded-xl border border-blue-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">-- Choose Student --</option>
              {displayUsers.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.displayName || u.email} ({u.grade || 'Class 9'} - {u.isPro ? 'Pro' : 'Free'})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Choose Course / Pro Pass */}
          <div>
            <label className="text-[11px] font-bold text-blue-200 block mb-1">
              Course / Pro Plan:
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 bg-white text-slate-800 text-xs font-semibold rounded-xl border border-blue-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {AVAILABLE_COURSES.map((c) => (
                <option key={c.id} value={c.title}>
                  {c.title} (Value: {formatPrice(c.price)})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Duration & Reason */}
          <div>
            <label className="text-[11px] font-bold text-blue-200 block mb-1">
              Access Duration &amp; Reason:
            </label>
            <div className="flex gap-2">
              <select
                value={accessDuration}
                onChange={(e) => setAccessDuration(e.target.value)}
                className="w-28 px-2 py-2 bg-white text-slate-800 text-xs font-semibold rounded-xl border border-blue-300 focus:outline-none"
              >
                <option value="3 Months">3 Months</option>
                <option value="6 Months">6 Months</option>
                <option value="1 Year">1 Year</option>
                <option value="Lifetime">Lifetime</option>
              </select>
              <input
                type="text"
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                placeholder="Reason (e.g. Scholarship)"
                className="flex-1 px-2.5 py-2 bg-white text-slate-800 text-xs rounded-xl border border-blue-300 focus:outline-none"
              />
            </div>
          </div>

          {/* 4. Action Button */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isAssigning || !selectedStudentId}
              className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-extrabold rounded-xl cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>{isAssigning ? 'Upgrading...' : 'Assign Course Free'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* CARD 2: Registered Students Table & Directory */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Header with Search and Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>All Registered Students Directory</span>
              <span className="text-xs font-mono bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                {displayUsers.length} Students
              </span>
            </h4>
            <p className="text-xs text-slate-500">Live profiles from Firebase Firestore database collection <code className="text-blue-600 font-mono">/users</code></p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, UID..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
              />
              <span className="material-symbols-outlined absolute left-2 top-2 text-[16px] text-slate-400">
                search
              </span>
            </div>

            {/* Grade Filter */}
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="py-1.5 px-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none text-slate-700 font-semibold"
            >
              <option value="All">All Grades</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 8">Class 8</option>
              <option value="Class 7">Class 7</option>
              <option value="Class 6">Class 6</option>
              <option value="Class 5">Class 5</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="py-1.5 px-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none text-slate-700 font-semibold"
            >
              <option value="All">All Status</option>
              <option value="Pro">Pro Members</option>
              <option value="Free">Free Users</option>
            </select>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student Profile</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Grade</th>
                <th className="py-3 px-4">Downloads</th>
                <th className="py-3 px-4">Subscription Status</th>
                <th className="py-3 px-4">Assigned Plan</th>
                <th className="py-3 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No matching students found for this search criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((u) => (
                  <tr key={u.userId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {(u.displayName || u.email || 'S')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{u.displayName || 'Registered Student'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {u.userId.slice(0, 14)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                        {u.grade || 'Class 9'}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                        <span className="material-symbols-outlined text-[13px]">file_download</span>
                        <span>{u.downloads?.length || 0}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {u.isPro ? (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">
                          <span className="material-symbols-outlined text-[12px]">workspace_premium</span>
                          <span>PRO ACTIVE</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          <span>Free Learner</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-[11px] font-medium text-slate-600">
                      {u.proPlan || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleTogglePro(u)}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer transition-colors ${
                            u.isPro
                              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          }`}
                        >
                          {u.isPro ? 'Revoke Pro' : 'Make Pro'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.userId, u.displayName || u.email)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                          title="Delete Student"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
