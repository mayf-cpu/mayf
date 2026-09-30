import React, { useState, useRef, useEffect, useMemo } from 'react';
import { getChaptersForGrade } from '../services/classChapters';

export interface GradeItem {
  name: string;
  count: string | number;
  icon: string;
  label?: string;
  isActiveLabel?: string;
}

export interface ChapterItem {
  id: string;
  name: string;
  icon?: string;
  badge?: string;
}

interface CatalogFilterDropdownsProps {
  selectedClass: string;
  onSelectClass: (grade: string) => void;
  classList: GradeItem[];

  selectedStream: string;
  onSelectStream: (stream: string) => void;
  streamList: string[];

  activeGradeChildren: ChapterItem[];
  selectedChapter?: string;
  onSelectChapter: (chapterName: string) => void;

  selectedFormat: string;
  onSelectFormat: (format: string) => void;
  formatList: string[];

  selectedTopic: string;
  onSelectTopic: (topic: string) => void;
  topicList: string[];

  themeColor?: string;
}

export const CatalogFilterDropdowns: React.FC<CatalogFilterDropdownsProps> = ({
  selectedClass,
  onSelectClass,
  classList,
  selectedStream,
  onSelectStream,
  streamList,
  activeGradeChildren,
  selectedChapter = '',
  onSelectChapter,
  selectedFormat,
  onSelectFormat,
  formatList,
  selectedTopic,
  onSelectTopic,
  topicList,
  themeColor = '#004ac6',
}) => {
  const [openDropdown, setOpenDropdown] = useState<'grade' | 'stream' | 'chapter' | 'format' | 'topic' | null>(null);
  const [chapterSearch, setChapterSearch] = useState('');
  const [topicSearch, setTopicSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDropdown(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleDropdown = (id: 'grade' | 'stream' | 'chapter' | 'format' | 'topic') => {
    setOpenDropdown((prev) => (prev === id ? null : id));
    setChapterSearch('');
    setTopicSearch('');
  };

  const selectedClassItem = classList.find((c) => c.name === selectedClass);

  // Combine NCERT standard chapters with any custom admin categories
  const allGradeChapters = useMemo(() => {
    const standardChapters = getChaptersForGrade(selectedClass);
    const existingNames = new Set(standardChapters.map((c) => c.name.toLowerCase()));
    const customList: ChapterItem[] = [];

    activeGradeChildren.forEach((child) => {
      if (!existingNames.has(child.name.toLowerCase())) {
        customList.push(child);
      }
    });

    return [...standardChapters, ...customList];
  }, [selectedClass, activeGradeChildren]);

  const filteredChapters = chapterSearch.trim()
    ? allGradeChapters.filter((c) => c.name.toLowerCase().includes(chapterSearch.toLowerCase()))
    : allGradeChapters;

  const filteredTopics = topicSearch.trim()
    ? topicList.filter((t) => t.toLowerCase().includes(topicSearch.toLowerCase()))
    : topicList;

  const currentChapterLabel = selectedChapter && selectedChapter !== 'All Chapters' ? selectedChapter : 'All Chapters';

  return (
    <div ref={containerRef} className="w-full bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-blue-50/80">
      {/* 5 Beautiful Dropdown Select Menus Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-3.5">
        {/* ================= 1. SELECT YOUR GRADE / CLASS ================= */}
        <div className="relative">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-blue-600">school</span>
            <span>Select Your Grade / Class:</span>
          </label>
          <button
            type="button"
            onClick={() => toggleDropdown('grade')}
            aria-haspopup="listbox"
            aria-expanded={openDropdown === 'grade'}
            className={`w-full bg-slate-50/80 hover:bg-slate-50 border rounded-xl px-3 py-2.5 sm:py-3 text-left flex items-center justify-between gap-2 shadow-xs transition-all cursor-pointer ${
              openDropdown === 'grade'
                ? 'border-blue-600 ring-2 ring-blue-100 bg-white'
                : 'border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="material-symbols-outlined text-blue-600 text-[18px] shrink-0">
                {selectedClassItem?.icon || 'school'}
              </span>
              <span className="text-xs sm:text-[13px] font-bold text-slate-900 truncate">
                {selectedClass}
              </span>
              {selectedClassItem?.count && (
                <span className="text-[10px] bg-blue-100/70 text-blue-800 font-extrabold px-1.5 py-0.5 rounded-full shrink-0">
                  {selectedClassItem.count}
                </span>
              )}
            </div>
            <span className={`material-symbols-outlined text-slate-400 text-[18px] shrink-0 transition-transform ${openDropdown === 'grade' ? 'rotate-180 text-blue-600' : ''}`}>
              expand_more
            </span>
          </button>

          {openDropdown === 'grade' && (
            <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 bg-white rounded-2xl shadow-2xl border border-blue-100 py-1.5 max-h-68 overflow-y-auto divide-y divide-slate-100 animate-fadeIn min-w-[220px]">
              <button
                type="button"
                onClick={() => {
                  onSelectClass('All');
                  setOpenDropdown(null);
                }}
                className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                  selectedClass === 'All' ? 'bg-blue-50 text-blue-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-blue-600">apps</span>
                  <span>All Grades (Full Vault)</span>
                </div>
                {selectedClass === 'All' && (
                  <span className="material-symbols-outlined text-[16px] text-blue-600">check</span>
                )}
              </button>
              {classList.map((item) => {
                const isSelected = selectedClass === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      onSelectClass(item.name);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50 text-blue-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-[16px] text-blue-600 shrink-0">{item.icon}</span>
                      <span className="truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-full">
                        {item.count}
                      </span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-[16px] text-blue-600">check</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= 2. CURRICULUM BOARD ================= */}
        <div className="relative">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-amber-600">domain</span>
            <span>Curriculum Board:</span>
          </label>
          <button
            type="button"
            onClick={() => toggleDropdown('stream')}
            aria-haspopup="listbox"
            aria-expanded={openDropdown === 'stream'}
            className={`w-full bg-slate-50/80 hover:bg-slate-50 border rounded-xl px-3 py-2.5 sm:py-3 text-left flex items-center justify-between gap-2 shadow-xs transition-all cursor-pointer ${
              openDropdown === 'stream'
                ? 'border-blue-600 ring-2 ring-blue-100 bg-white'
                : 'border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0">verified</span>
              <span className="text-xs sm:text-[13px] font-bold text-slate-900 truncate">
                {selectedStream || 'All Streams'}
              </span>
            </div>
            <span className={`material-symbols-outlined text-slate-400 text-[18px] shrink-0 transition-transform ${openDropdown === 'stream' ? 'rotate-180 text-blue-600' : ''}`}>
              expand_more
            </span>
          </button>

          {openDropdown === 'stream' && (
            <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 bg-white rounded-2xl shadow-2xl border border-blue-100 py-1.5 max-h-68 overflow-y-auto divide-y divide-slate-100 animate-fadeIn min-w-[220px]">
              {streamList.map((stream) => {
                const isSelected = selectedStream === stream;
                return (
                  <button
                    key={stream}
                    type="button"
                    onClick={() => {
                      onSelectStream(stream);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50 text-blue-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="truncate">{stream}</span>
                    {isSelected && (
                      <span className="material-symbols-outlined text-[16px] text-blue-600">check</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= 3. CLASS 9 CHAPTERS ================= */}
        <div className="relative">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-indigo-600">menu_book</span>
            <span>{selectedClass === 'All' ? 'Class Chapters:' : `${selectedClass} Chapters:`}</span>
          </label>
          <button
            type="button"
            onClick={() => toggleDropdown('chapter')}
            aria-haspopup="listbox"
            aria-expanded={openDropdown === 'chapter'}
            className={`w-full bg-slate-50/80 hover:bg-slate-50 border rounded-xl px-3 py-2.5 sm:py-3 text-left flex items-center justify-between gap-2 shadow-xs transition-all cursor-pointer ${
              openDropdown === 'chapter'
                ? 'border-blue-600 ring-2 ring-blue-100 bg-white'
                : 'border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="material-symbols-outlined text-indigo-600 text-[18px] shrink-0">bookmark</span>
              <span className="text-xs sm:text-[13px] font-bold text-slate-900 truncate">
                {currentChapterLabel}
              </span>
            </div>
            <span className={`material-symbols-outlined text-slate-400 text-[18px] shrink-0 transition-transform ${openDropdown === 'chapter' ? 'rotate-180 text-blue-600' : ''}`}>
              expand_more
            </span>
          </button>

          {openDropdown === 'chapter' && (
            <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 bg-white rounded-2xl shadow-2xl border border-blue-100 py-1.5 max-h-72 overflow-y-auto divide-y divide-slate-100 animate-fadeIn min-w-[260px]">
              {/* Chapter Search Bar */}
              <div className="p-2 bg-slate-50/80 border-b border-slate-100">
                <div className="relative flex items-center bg-white rounded-lg px-2.5 py-1.5 border border-slate-200">
                  <span className="material-symbols-outlined text-slate-400 text-[16px] mr-1.5">search</span>
                  <input
                    type="text"
                    value={chapterSearch}
                    onChange={(e) => setChapterSearch(e.target.value)}
                    placeholder="Search chapters..."
                    className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {chapterSearch && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setChapterSearch('');
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  )}
                </div>
              </div>

              {/* All Chapters option */}
              <button
                type="button"
                onClick={() => {
                  onSelectChapter('');
                  setOpenDropdown(null);
                }}
                className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                  !selectedChapter || selectedChapter === 'All Chapters'
                    ? 'bg-blue-50 text-blue-800 font-bold'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-blue-600">auto_stories</span>
                  <span className="font-semibold">All Chapters (Full Syllabus)</span>
                </div>
                {(!selectedChapter || selectedChapter === 'All Chapters') && (
                  <span className="material-symbols-outlined text-[16px] text-blue-600">check</span>
                )}
              </button>

              {filteredChapters.map((child) => {
                const isSelected = selectedChapter.toLowerCase() === child.name.toLowerCase();
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => {
                      onSelectChapter(isSelected ? '' : child.name);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50 text-blue-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-[16px] text-indigo-500 shrink-0">
                        {child.icon || 'tag'}
                      </span>
                      <span className="truncate">{child.name}</span>
                      {child.badge && (
                        <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold shrink-0">
                          {child.badge}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-[16px] text-blue-600">check</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= 4. TYPE ================= */}
        <div className="relative">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-emerald-600">category</span>
            <span>TYPE:</span>
          </label>
          <button
            type="button"
            onClick={() => toggleDropdown('format')}
            aria-haspopup="listbox"
            aria-expanded={openDropdown === 'format'}
            className={`w-full bg-slate-50/80 hover:bg-slate-50 border rounded-xl px-3 py-2.5 sm:py-3 text-left flex items-center justify-between gap-2 shadow-xs transition-all cursor-pointer ${
              openDropdown === 'format'
                ? 'border-blue-600 ring-2 ring-blue-100 bg-white'
                : 'border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0">description</span>
              <span className="text-xs sm:text-[13px] font-bold text-slate-900 truncate">
                {selectedFormat || 'All Formats'}
              </span>
            </div>
            <span className={`material-symbols-outlined text-slate-400 text-[18px] shrink-0 transition-transform ${openDropdown === 'format' ? 'rotate-180 text-blue-600' : ''}`}>
              expand_more
            </span>
          </button>

          {openDropdown === 'format' && (
            <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 bg-white rounded-2xl shadow-2xl border border-blue-100 py-1.5 max-h-68 overflow-y-auto divide-y divide-slate-100 animate-fadeIn min-w-[220px]">
              {formatList.map((fmt) => {
                const isSelected = selectedFormat === fmt;
                return (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => {
                      onSelectFormat(fmt);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50 text-blue-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="truncate">{fmt}</span>
                    {isSelected && (
                      <span className="material-symbols-outlined text-[16px] text-blue-600">check</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= 5. TOPICS ================= */}
        <div className="relative">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-purple-600">interests</span>
            <span>TOPICS:</span>
          </label>
          <button
            type="button"
            onClick={() => toggleDropdown('topic')}
            aria-haspopup="listbox"
            aria-expanded={openDropdown === 'topic'}
            className={`w-full bg-slate-50/80 hover:bg-slate-50 border rounded-xl px-3 py-2.5 sm:py-3 text-left flex items-center justify-between gap-2 shadow-xs transition-all cursor-pointer ${
              openDropdown === 'topic'
                ? 'border-blue-600 ring-2 ring-blue-100 bg-white'
                : 'border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="material-symbols-outlined text-purple-600 text-[18px] shrink-0">functions</span>
              <span className="text-xs sm:text-[13px] font-bold text-slate-900 truncate">
                {selectedTopic || 'All Topics'}
              </span>
            </div>
            <span className={`material-symbols-outlined text-slate-400 text-[18px] shrink-0 transition-transform ${openDropdown === 'topic' ? 'rotate-180 text-blue-600' : ''}`}>
              expand_more
            </span>
          </button>

          {openDropdown === 'topic' && (
            <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 bg-white rounded-2xl shadow-2xl border border-blue-100 py-1.5 max-h-72 overflow-y-auto divide-y divide-slate-100 animate-fadeIn min-w-[240px]">
              {/* Topic Search Bar */}
              <div className="p-2 bg-slate-50/80 border-b border-slate-100">
                <div className="relative flex items-center bg-white rounded-lg px-2.5 py-1.5 border border-slate-200">
                  <span className="material-symbols-outlined text-slate-400 text-[16px] mr-1.5">search</span>
                  <input
                    type="text"
                    value={topicSearch}
                    onChange={(e) => setTopicSearch(e.target.value)}
                    placeholder="Search topics..."
                    className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {topicSearch && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTopicSearch('');
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectTopic('');
                  setOpenDropdown(null);
                }}
                className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                  !selectedTopic ? 'bg-blue-50 text-blue-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-purple-600">category</span>
                  <span>All Topics</span>
                </div>
                {!selectedTopic && (
                  <span className="material-symbols-outlined text-[16px] text-blue-600">check</span>
                )}
              </button>

              {filteredTopics.map((topic) => {
                const isSelected = selectedTopic === topic;
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => {
                      onSelectTopic(isSelected ? '' : topic);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50 text-blue-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="truncate">{topic}</span>
                    {isSelected && (
                      <span className="material-symbols-outlined text-[16px] text-blue-600">check</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
