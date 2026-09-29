import React, { useState, useEffect } from 'react';
import {
  AiQueryRecord,
  fetchAllAiQueries,
  deleteAiQueryRecord,
} from '../../firebase';
import { ClassroomBoardRenderer } from '../ClassroomBoardRenderer';

interface AdminAiTeacherTabProps {
  onToast: (msg: string) => void;
}

export const AdminAiTeacherTab: React.FC<AdminAiTeacherTabProps> = ({ onToast }) => {
  const [queries, setQueries] = useState<AiQueryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState<string>('All');
  const [selectedRecord, setSelectedRecord] = useState<AiQueryRecord | null>(null);

  const loadQueries = async () => {
    setLoading(true);
    try {
      const records = await fetchAllAiQueries();
      setQueries(records);
    } catch (e) {
      console.warn('Failed to load AI query records:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueries();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this query record from the admin log?')) {
      await deleteAiQueryRecord(id);
      setQueries((prev) => prev.filter((q) => q.id !== id));
      if (selectedRecord?.id === id) {
        setSelectedRecord(null);
      }
      onToast('Query log record deleted.');
    }
  };

  const handleExportCSV = () => {
    if (queries.length === 0) {
      onToast('No query records to export.');
      return;
    }
    const headers = ['Query ID', 'Student Name', 'Student Email', 'Grade', 'Topic', 'Has Image', 'Timestamp', 'Query Text'];
    const rows = queries.map((q) => [
      q.id,
      `"${q.userName || 'Student'}"`,
      `"${q.userEmail}"`,
      `"${q.grade}"`,
      `"${q.topic || 'Math'}"`,
      q.hasImage ? 'Yes' : 'No',
      `"${q.createdAt}"`,
      `"${q.queryText.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ai_teacher_inquiries_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('Exported AI queries to CSV.');
  };

  // Seed demo records if database is empty so admin has visual feedback
  const displayQueries: AiQueryRecord[] =
    queries.length > 0
      ? queries
      : [
          {
            id: 'demo_q1',
            userId: 'usr_sachin_admin',
            userEmail: 'sachin.itig@gmail.com',
            userName: 'Sachin Kumar',
            grade: 'Class 10',
            topic: 'Quadratic Equations',
            queryText: 'Find the roots of 2x² - 7x + 3 = 0 using the quadratic formula with verification.',
            hasImage: false,
            solution: '### 📌 1. Problem Breakdown\n- Equation: 2x² - 7x + 3 = 0\n- Coefficients: a=2, b=-7, c=3\n\n### 📐 2. Key Formula\n- x = (-b ± √(b² - 4ac)) / (2a)\n\n### ✍️ 3. Step-by-Step\n- D = (-7)² - 4(2)(3) = 49 - 24 = 25\n- x = (7 ± √25) / 4 = (7 ± 5)/4\n- x₁ = 12/4 = 3, x₂ = 2/4 = 1/2',
            modelUsed: 'gemini-3.8-flash',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'demo_q2',
            userId: 'usr_aarav_sharma',
            userEmail: 'aarav.sharma24@gmail.com',
            userName: 'Aarav Sharma',
            grade: 'Class 10',
            topic: 'Trigonometry',
            queryText: 'Attached textbook photo: Exercise 8.4 question 5 part 3 regarding tangent identities.',
            hasImage: true,
            solution: '### 📌 1. Given Identity\n- Prove: tan θ / (1 - cot θ) + cot θ / (1 - tan θ) = 1 + sec θ csc θ\n\n### ✍️ 3. Step-by-Step\n- Convert everything to sin θ and cos θ...',
            modelUsed: 'gemini-3.8-flash',
            createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          },
        ];

  const filtered = displayQueries.filter((q) => {
    const matchesGrade = gradeFilter === 'All' || q.grade.toLowerCase().includes(gradeFilter.toLowerCase());
    const matchesSearch =
      search === '' ||
      q.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      (q.userName && q.userName.toLowerCase().includes(search.toLowerCase())) ||
      q.queryText.toLowerCase().includes(search.toLowerCase());
    return matchesGrade && matchesSearch;
  });

  const uniqueStudents = new Set(displayQueries.map((q) => q.userEmail)).size;
  const photoQueriesCount = displayQueries.filter((q) => q.hasImage).length;

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
            <span>Total Queries Solved</span>
            <span className="material-symbols-outlined text-[18px] text-blue-400">psychology</span>
          </div>
          <div className="text-2xl font-extrabold text-white">{displayQueries.length}</div>
          <div className="text-[11px] text-emerald-400 mt-1">Live recorded in Firestore</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
            <span>Unique Students Assisted</span>
            <span className="material-symbols-outlined text-[18px] text-emerald-400">groups</span>
          </div>
          <div className="text-2xl font-extrabold text-white">{uniqueStudents}</div>
          <div className="text-[11px] text-slate-400 mt-1">Logged-in student accounts</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
            <span>Photo / OCR Queries</span>
            <span className="material-symbols-outlined text-[18px] text-amber-400">photo_camera</span>
          </div>
          <div className="text-2xl font-extrabold text-white">{photoQueriesCount}</div>
          <div className="text-[11px] text-amber-400 mt-1">Textbook image uploads</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
            <span>Model Reasoning Engine</span>
            <span className="material-symbols-outlined text-[18px] text-purple-400">memory</span>
          </div>
          <div className="text-sm font-extrabold text-purple-300 mt-1">Gemini 3.8 Flash</div>
          <div className="text-[11px] text-slate-400 mt-1">Server-side proxy endpoint</div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {['All', 'Class 10', 'Class 9', 'Class 8', 'Class 7', 'Class 6', 'Class 5', 'Olympiad'].map((g) => (
            <button
              key={g}
              onClick={() => setGradeFilter(g)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                gradeFilter === g
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search student or query..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 w-52 sm:w-64"
            />
          </div>

          <button
            onClick={loadQueries}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors cursor-pointer"
            title="Refresh logs from Firestore"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Query Logs List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-blue-400">table_rows</span>
            <span>Student Inquiries & AI Teacher Responses ({filtered.length})</span>
          </h3>
          <span className="text-[11px] text-slate-400">Auto-logged on student query</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading query logs from Firestore...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No query activity matches your filter.</div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-blue-900/60 border border-blue-700 text-blue-300 flex items-center justify-center font-bold text-sm shrink-0">
                    {item.userName ? item.userName.charAt(0).toUpperCase() : 'S'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-extrabold text-white">
                        {item.userName || 'Student'}
                      </span>
                      <span className="text-[11px] text-slate-400">{item.userEmail}</span>
                      <span className="bg-blue-950 text-blue-400 border border-blue-800 text-[10px] font-bold px-2 py-0.2 rounded-full">
                        {item.grade}
                      </span>
                      {item.hasImage && (
                        <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold px-2 py-0.2 rounded-full flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">image</span>
                          <span>Photo Query</span>
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 font-medium line-clamp-2">
                      {item.queryText}
                    </p>

                    <div className="text-[11px] text-slate-400 line-clamp-1 mt-1 font-mono">
                      Solution: {item.solution.replace(/###/g, '').substring(0, 120)}...
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedRecord(item)}
                    className="inline-flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-700/50 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    <span>View Solution</span>
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                    title="Delete log entry"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal to View Full Query & Solution */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl text-white">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                  Student Query Record
                </span>
                <h3 className="text-base font-extrabold text-white">
                  {selectedRecord.userName || 'Student'} ({selectedRecord.grade})
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="text-xs font-bold text-slate-400 mb-1">Student's Question:</div>
                <div className="text-sm font-semibold text-white leading-relaxed">
                  {selectedRecord.queryText}
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  Asked by {selectedRecord.userEmail} on {new Date(selectedRecord.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="bg-slate-950 p-2 sm:p-4 rounded-2xl border border-slate-800">
                <div className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5 px-2">
                  <span className="material-symbols-outlined text-[16px]">co_present</span>
                  <span>Teacher Classroom Board Response ({selectedRecord.modelUsed || 'Gemini'})</span>
                </div>
                <ClassroomBoardRenderer
                  solutionText={selectedRecord.solution}
                  grade={selectedRecord.grade}
                  topic={selectedRecord.topic}
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <button
                onClick={() => handleDelete(selectedRecord.id)}
                className="text-xs font-bold text-red-400 hover:text-red-300 px-3 py-1.5 cursor-pointer"
              >
                Delete this record
              </button>
              <button
                onClick={() => setSelectedRecord(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
