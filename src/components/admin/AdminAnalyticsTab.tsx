import React, { useState } from 'react';
import { AnalyticsSummary, getAnalyticsMetrics } from '../../services/analytics';

interface AdminAnalyticsTabProps {
  onToast: (msg: string) => void;
}

export const AdminAnalyticsTab: React.FC<AdminAnalyticsTabProps> = ({ onToast }) => {
  const [metrics, setMetrics] = useState<AnalyticsSummary>(getAnalyticsMetrics);
  const [postSearch, setPostSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedTier, setSelectedTier] = useState('All');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('7d');

  const filteredPosts = metrics.posts.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(postSearch.toLowerCase()) ||
      p.topic.toLowerCase().includes(postSearch.toLowerCase());
    const matchGrade = selectedGrade === 'All' || p.grade === selectedGrade;
    const matchTier = selectedTier === 'All' || p.tier === selectedTier.toLowerCase();
    return matchSearch && matchGrade && matchTier;
  });

  const handleExportCSV = () => {
    const headers = ['Post ID', 'Title', 'Class', 'Domain', 'Tier', 'Format', 'Total Views', 'Downloads', 'Upvotes', 'Last Visited'];
    const rows = filteredPosts.map((p) => [
      `"${p.id}"`,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.grade}"`,
      `"${p.topic}"`,
      `"${p.tier.toUpperCase()}"`,
      `"${p.format}"`,
      p.views,
      p.downloads,
      p.upvotes,
      `"${p.lastVisited}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `maths_analytics_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('📊 Analytics CSV exported successfully!');
  };

  const maxDailyVisitors = Math.max(...metrics.dailyViews.map((d) => d.visitors));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Controls & Timeframe */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">monitoring</span>
            <span>Website Traffic &amp; Resource Analytics</span>
          </h3>
          <p className="text-xs text-slate-500">
            Real-time telemetry on visitors, page views, and free vs paid download volumes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {(['7d', '30d', 'all'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-lg cursor-pointer transition-colors uppercase ${
                  timeframe === tf ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf === '7d' ? 'Last 7 Days' : tf === '30d' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Visitors */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Total Unique Visitors</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">group</span>
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {metrics.totalVisitors.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>+18.4% this month</span>
          </div>
        </div>

        {/* Total Page Views */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Total Page Views</span>
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">visibility</span>
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {metrics.totalPageViews.toLocaleString()}
          </div>
          <div className="mt-2 text-slate-500 text-xs font-medium">
            Avg. {metrics.avgSessionDuration} per learner
          </div>
        </div>

        {/* Free Downloads */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Free PDF Downloads</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">file_download</span>
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
            {metrics.totalFreeDownloads.toLocaleString()}
          </div>
          <div className="mt-2 text-slate-500 text-xs font-medium">
            Formula sheets &amp; revision cheat sheets
          </div>
        </div>

        {/* Paid / Pro Downloads & Conversion */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Paid Pro Passes</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
            {metrics.totalPaidDownloads.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-blue-600">
            <span>Conv. Rate: {metrics.conversionRate}</span>
          </div>
        </div>
      </div>

      {/* Traffic Trend Chart (7 Days) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900">7-Day Visitor Traffic vs. Download Velocity</h4>
            <p className="text-xs text-slate-500">Daily breakdown of student visits and learning sheet downloads</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-600"></span>
              <span className="text-slate-600 font-medium">Visitors</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#6ffbbe]"></span>
              <span className="text-slate-600 font-medium">Downloads</span>
            </div>
          </div>
        </div>

        {/* Responsive Bar Graphic */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44 pt-6 pb-2 border-b border-slate-100">
          {metrics.dailyViews.map((d) => {
            const visitorHeight = Math.round((d.visitors / maxDailyVisitors) * 100);
            const downloadHeight = Math.round((d.downloads / maxDailyVisitors) * 100);
            return (
              <div key={d.date} className="flex flex-col items-center h-full justify-end group">
                <div className="flex items-end gap-1 sm:gap-1.5 w-full justify-center h-full">
                  {/* Visitor Bar */}
                  <div
                    style={{ height: `${visitorHeight}%` }}
                    className="w-3 sm:w-6 bg-blue-600 hover:bg-blue-700 rounded-t-md transition-all relative"
                    title={`${d.date}: ${d.visitors} visitors`}
                  >
                    <span className="hidden group-hover:block absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded whitespace-nowrap z-10 font-bold">
                      {d.visitors}
                    </span>
                  </div>

                  {/* Download Bar */}
                  <div
                    style={{ height: `${downloadHeight}%` }}
                    className="w-2.5 sm:w-5 bg-[#6ffbbe] hover:bg-[#58e2a6] rounded-t-md transition-all relative"
                    title={`${d.date}: ${d.downloads} downloads`}
                  >
                    <span className="hidden group-hover:block absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded whitespace-nowrap z-10 font-bold">
                      {d.downloads}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-500 mt-2">{d.date}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Page Traffic Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Traffic Breakdown by Website Page</h4>
            <p className="text-xs text-slate-500">Number of unique visitors and total pageviews across primary sections</p>
          </div>
          <span className="text-xs font-mono bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg">
            {metrics.pages.length} Tracked Pages
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Page Path &amp; Name</th>
                <th className="py-3 px-4">Unique Visitors</th>
                <th className="py-3 px-4">Page Views</th>
                <th className="py-3 px-4">Avg. Time on Page</th>
                <th className="py-3 px-4">Bounce Rate</th>
                <th className="py-3 px-4">Popularity Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {metrics.pages.map((p) => {
                const sharePercent = Math.round((p.pageViews / metrics.totalPageViews) * 100);
                return (
                  <tr key={p.path} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] font-mono text-blue-600">{p.path}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold">{p.visitors.toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.pageViews.toLocaleString()}</td>
                    <td className="py-3 px-4">{p.avgTime}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        parseInt(p.bounceRate) < 25 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.bounceRate}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div style={{ width: `${sharePercent}%` }} className="bg-blue-600 h-full rounded-full"></div>
                        </div>
                        <span className="text-[11px] font-bold text-slate-600">{sharePercent}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Post & Resource Level Traffic */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Traffic on Individual Resource Posts</h4>
            <p className="text-xs text-slate-500">Live view counts, downloads, and popularity metrics per formula sheet and note</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
                placeholder="Search post title..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
              />
              <span className="material-symbols-outlined absolute left-2 top-2 text-[16px] text-slate-400">
                search
              </span>
            </div>

            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
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

            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="py-1.5 px-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none text-slate-700 font-semibold"
            >
              <option value="All">All Tiers</option>
              <option value="Free">Free</option>
              <option value="Pro">Pro Only</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Resource / Post Title</th>
                <th className="py-3 px-4">Class &amp; Domain</th>
                <th className="py-3 px-4">Access Tier</th>
                <th className="py-3 px-4">Total Visitors</th>
                <th className="py-3 px-4">Downloads</th>
                <th className="py-3 px-4">Upvotes</th>
                <th className="py-3 px-4">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPosts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-bold text-slate-900 truncate" title={p.title}>
                      {p.title}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">{p.format}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-bold text-blue-700 block">{p.grade}</span>
                    <span className="text-[11px] text-slate-500">{p.topic}</span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {p.tier === 'free' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        🟢 FREE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        ⭐ PRO ONLY
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{p.views.toLocaleString()}</td>
                  <td className="py-3 px-4 font-bold text-emerald-700">{p.downloads.toLocaleString()}</td>
                  <td className="py-3 px-4 text-slate-600">👍 {p.upvotes}</td>
                  <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">{p.lastVisited}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
