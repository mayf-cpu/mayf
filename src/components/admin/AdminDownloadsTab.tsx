import React, { useState, useEffect } from 'react';
import {
  StudentDownloadRecord,
  fetchAllStudentDownloadRecords,
} from '../../firebase';

interface AdminDownloadsTabProps {
  onToast: (msg: string) => void;
}

export const AdminDownloadsTab: React.FC<AdminDownloadsTabProps> = ({ onToast }) => {
  const [records, setRecords] = useState<StudentDownloadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState<'All' | 'free' | 'pro'>('All');

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await fetchAllStudentDownloadRecords();
      setRecords(data);
    } catch (_err) {
      onToast('Could not refresh student download records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();

    const handleDownloadEvent = () => {
      loadRecords();
    };

    window.addEventListener('student-download-recorded', handleDownloadEvent);
    window.addEventListener('student-downloads-changed', handleDownloadEvent);

    return () => {
      window.removeEventListener('student-download-recorded', handleDownloadEvent);
      window.removeEventListener('student-downloads-changed', handleDownloadEvent);
    };
  }, []);

  const filteredRecords = records.filter((r) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      (r.userName || '').toLowerCase().includes(q) ||
      (r.userEmail || '').toLowerCase().includes(q) ||
      (r.title || '').toLowerCase().includes(q) ||
      (r.topic || '').toLowerCase().includes(q) ||
      (r.userId || '').toLowerCase().includes(q);

    const matchGrade = gradeFilter === 'All' || r.grade === gradeFilter;
    const matchTier = tierFilter === 'All' || r.tier === tierFilter;

    return matchSearch && matchGrade && matchTier;
  });

  // Calculate Metrics
  const totalDownloads = records.length;
  const freeDownloads = records.filter((r) => r.tier !== 'pro').length;
  const proDownloads = records.filter((r) => r.tier === 'pro').length;
  const uniqueStudents = new Set(records.map((r) => r.userEmail || r.userId)).size;

  const todayStr = new Date().toDateString();
  const todayDownloads = records.filter((r) => {
    try {
      return new Date(r.downloadedAt).toDateString() === todayStr;
    } catch {
      return false;
    }
  }).length;

  const formatTimestamp = (iso: string): { full: string; relative: string } => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return { full: iso, relative: '' };
      const now = Date.now();
      const diffMin = Math.round((now - d.getTime()) / 60000);

      let relative = '';
      if (diffMin < 2) relative = 'Just now';
      else if (diffMin < 60) relative = `${diffMin}m ago`;
      else if (diffMin < 1440) relative = `${Math.round(diffMin / 60)}h ago`;
      else relative = `${Math.round(diffMin / 1440)}d ago`;

      return {
        full: d.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        relative,
      };
    } catch {
      return { full: iso, relative: '' };
    }
  };

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      onToast('No download records matching current filters to export.');
      return;
    }

    const headers = [
      'Download ID',
      'Student Name',
      'Student Email',
      'User ID',
      'Resource Title',
      'Grade',
      'Topic / Chapter',
      'Format',
      'Tier',
      'File Size',
      'Downloaded Timestamp',
      'Device / Environment',
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.id}"`,
      `"${r.userName || 'Student'}"`,
      `"${r.userEmail || 'N/A'}"`,
      `"${r.userId}"`,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.grade || 'Class 10'}"`,
      `"${(r.topic || 'Mathematics').replace(/"/g, '""')}"`,
      `"${r.format || 'Formula Sheet'}"`,
      r.tier === 'pro' ? 'PRO' : 'FREE',
      `"${r.size || '2.1 MB'}"`,
      `"${r.downloadedAt}"`,
      `"${r.device || 'Web Browser'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Student_Downloads_Audit_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onToast(`📥 Exported ${filteredRecords.length} download records as CSV spreadsheet!`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
              <span className="material-symbols-outlined text-[24px]">cloud_download</span>
            </span>
            <h2 className="text-xl font-black text-white">Student Download Activity Vault</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Live auditable tracking of every student login, study sheet export, and formula deck download across all classes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadRecords}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-700"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#004ac6] hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Downloads</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <span className="material-symbols-outlined text-[20px]">file_download</span>
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-2">{totalDownloads}</div>
          <div className="text-[11px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            <span>{todayDownloads} downloaded today</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unique Students</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <span className="material-symbols-outlined text-[20px]">group</span>
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-2">{uniqueStudents}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Verified logged-in accounts</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Free Study Kits</span>
            <span className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-2">{freeDownloads}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">
            {totalDownloads > 0 ? `${Math.round((freeDownloads / totalDownloads) * 100)}%` : '0%'} of all downloads
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pro Pass Content</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-2">{proDownloads}</div>
          <div className="text-[11px] text-amber-400 font-medium mt-1">Premium subscriber exports</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search by student name, email, or sheet title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="All">All Grades</option>
            <option value="Class 10">Class 10</option>
            <option value="Class 9">Class 9</option>
            <option value="Class 8">Class 8</option>
            <option value="Class 7">Class 7</option>
            <option value="Class 6">Class 6</option>
            <option value="Class 5">Class 5</option>
            <option value="Olympiad">Olympiad</option>
          </select>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="All">All Tiers</option>
            <option value="free">Free Kits</option>
            <option value="pro">Pro Only</option>
          </select>

          <div className="text-xs text-slate-400 px-2 shrink-0">
            Showing <strong className="text-white">{filteredRecords.length}</strong> records
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-5">Student Learner</th>
                <th className="py-3.5 px-4">Study Material / Title</th>
                <th className="py-3.5 px-4">Grade &amp; Chapter</th>
                <th className="py-3.5 px-4">Access Tier</th>
                <th className="py-3.5 px-4">File Details</th>
                <th className="py-3.5 px-5 text-right">Downloaded Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <span className="material-symbols-outlined text-[26px]">find_in_page</span>
                    </div>
                    <p className="font-bold text-sm text-slate-300">No download records found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {search || gradeFilter !== 'All' || tierFilter !== 'All'
                        ? 'Try changing your search keywords or clearing filters.'
                        : 'Students must log in before downloading materials. As soon as a student downloads notes, their records appear here instantly.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  const time = formatTimestamp(item.downloadedAt);
                  const isPro = item.tier === 'pro';

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Student Learner */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          {item.userPhoto ? (
                            <img
                              src={item.userPhoto}
                              alt={item.userName || 'Student'}
                              className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-700"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-blue-600/30 text-blue-400 font-black flex items-center justify-center shrink-0 border border-blue-500/20 text-xs">
                              {(item.userName || item.userEmail || 'S').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-slate-200 block truncate leading-tight">
                              {item.userName || 'Enrolled Student'}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {item.userEmail || item.userId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Resource Title */}
                      <td className="py-4 px-4">
                        <span className="font-bold text-white block max-w-sm leading-snug line-clamp-2">
                          {item.title}
                        </span>
                        {item.device && (
                          <span className="text-[10px] text-slate-500 block mt-0.5 font-mono truncate">
                            via {item.device}
                          </span>
                        )}
                      </td>

                      {/* Grade & Topic */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="inline-block bg-blue-500/10 text-blue-400 font-bold px-2 py-0.5 rounded-md text-[10px] border border-blue-500/20 w-fit">
                            {item.grade || 'Class 10'}
                          </span>
                          <span className="text-[11px] text-slate-300 font-medium truncate max-w-[150px]">
                            {item.topic || 'Mathematics'}
                          </span>
                        </div>
                      </td>

                      {/* Access Tier */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isPro ? (
                          <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-300 font-bold px-2.5 py-1 rounded-lg text-[10px] border border-amber-500/30">
                            <span className="material-symbols-outlined text-[13px]">workspace_premium</span>
                            <span>PRO ACCESS</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-300 font-bold px-2.5 py-1 rounded-lg text-[10px] border border-emerald-500/30">
                            <span className="material-symbols-outlined text-[13px]">check_circle</span>
                            <span>FREE KIT</span>
                          </span>
                        )}
                      </td>

                      {/* File Details */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-mono text-slate-300 block text-[11px]">
                          {item.size || '2.4 MB'}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {item.format || 'PDF Study Sheet'}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <span className="font-bold text-slate-200 block text-xs">
                          {time.relative}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {time.full}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-5 py-3.5 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Displaying <strong>{filteredRecords.length}</strong> of <strong>{records.length}</strong> total student download logs
          </span>
          <span className="flex items-center gap-1 text-[11px] text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Firestore synchronization active
          </span>
        </div>
      </div>
    </div>
  );
};
