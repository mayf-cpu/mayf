/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  PageTextConfig,
  DEFAULT_PAGE_TEXT,
  FaqItem,
} from '../../services/pageText';

interface AdminPageTextTabProps {
  pageText: PageTextConfig;
  onChange: (updated: PageTextConfig) => void;
  onSave: () => void;
  isSaving: boolean;
  onToast: (msg: string) => void;
}

type SectionKey =
  | 'hero'
  | 'announcement'
  | 'catalog'
  | 'aiTeacher'
  | 'formulaDeck'
  | 'midBanner'
  | 'proMasterclass'
  | 'socialCommunity'
  | 'faq'
  | 'footer'
  | 'formulaDeckPage';

interface SectionMeta {
  key: SectionKey;
  label: string;
  icon: string;
  description: string;
}

const SECTIONS: SectionMeta[] = [
  { key: 'hero', label: 'Hero Header Block', icon: 'flag', description: 'Top headline, subtitle, action buttons, and live student stats' },
  { key: 'announcement', label: 'Top Announcement Banner', icon: 'campaign', description: 'Olympiad announcement bar at the top of the portal' },
  { key: 'catalog', label: 'Study Vault & Notes Block', icon: 'menu_book', description: 'Notes directory header, search bar placeholder, and filter tips' },
  { key: 'aiTeacher', label: 'AI Teacher Spotlight Block', icon: 'psychology', description: 'Prof. Raman AI solver intro, key bullet points, and CTA button' },
  { key: 'formulaDeck', label: 'Interactive Formula Deck Block', icon: 'functions', description: 'Homepage sandbox showcase and dedicated launch button' },
  { key: 'midBanner', label: 'Mid-Page Camp / Sponsored Banner', icon: 'bolt', description: 'Vedic Math camp highlight and registration callout' },
  { key: 'proMasterclass', label: 'Pro Masterclass & Pricing Vault', icon: 'workspace_premium', description: 'Syllabus vault headline, feature perks, guarantee, and deal tags' },
  { key: 'socialCommunity', label: 'Social Channels & Study Community', icon: 'groups', description: 'Community join banner title, description, and channel headlines' },
  { key: 'faq', label: 'FAQ Accordion Block', icon: 'quiz', description: 'Manage student & parent questions and expandable answers' },
  { key: 'footer', label: 'Footer & Educator Signoff', icon: 'vertical_align_bottom', description: 'About synopsis, teacher accreditation, and copyright statement' },
  { key: 'formulaDeckPage', label: 'Dedicated Formula Deck Page (/#formula-deck)', icon: 'auto_stories', description: 'Page headers on the standalone visual formula laboratory' },
];

export const AdminPageTextTab: React.FC<AdminPageTextTabProps> = ({
  pageText,
  onChange,
  onSave,
  isSaving,
  onToast,
}) => {
  const [activeSection, setActiveSection] = useState<SectionKey>('hero');
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);

  const updateSubField = <K extends SectionKey>(
    section: K,
    field: keyof PageTextConfig[K],
    value: any
  ) => {
    const updated = {
      ...pageText,
      [section]: {
        ...(pageText[section] as any),
        [field]: value,
      },
    };
    onChange(updated);
  };

  const handleResetSection = (section: SectionKey) => {
    if (confirm(`Reset "${SECTIONS.find((s) => s.key === section)?.label}" texts back to default?`)) {
      onChange({
        ...pageText,
        [section]: JSON.parse(JSON.stringify(DEFAULT_PAGE_TEXT[section])),
      });
      onToast(`Reset ${section} text to defaults`);
    }
  };

  const handleResetAll = () => {
    if (confirm('Reset ALL website texts across all blocks and pages back to default handcrafted text?')) {
      onChange(JSON.parse(JSON.stringify(DEFAULT_PAGE_TEXT)));
      onToast('All website texts restored to default!');
    }
  };

  // FAQ management helpers
  const handleAddFaq = () => {
    const newId = `faq-${Date.now()}`;
    const newItems: FaqItem[] = [
      ...pageText.faq.items,
      {
        id: newId,
        question: 'New Frequently Asked Question?',
        answer: 'Provide clear, encouraging explanation and instructions for students and parents.',
      },
    ];
    updateSubField('faq', 'items', newItems);
    setEditingFaqId(newId);
    onToast('Added new FAQ item. Edit it below!');
  };

  const handleUpdateFaq = (id: string, question: string, answer: string) => {
    const updated = pageText.faq.items.map((item) =>
      item.id === id ? { ...item, question, answer } : item
    );
    updateSubField('faq', 'items', updated);
  };

  const handleDeleteFaq = (id: string) => {
    if (confirm('Delete this FAQ item?')) {
      const filtered = pageText.faq.items.filter((item) => item.id !== id);
      updateSubField('faq', 'items', filtered);
      if (editingFaqId === id) setEditingFaqId(null);
      onToast('FAQ question deleted');
    }
  };

  const handleMoveFaq = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= pageText.faq.items.length) return;
    const items = [...pageText.faq.items];
    const [moved] = items.splice(index, 1);
    items.splice(targetIdx, 0, moved);
    updateSubField('faq', 'items', items);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Master Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[26px]">edit_note</span>
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[11px] font-bold uppercase tracking-wider mb-1">
              <span>Full Website Copy Editor</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Website Page &amp; Block Text Manager
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Customize any text, headline, description, banner alert, or call-to-action button across all pages. Changes are synced to cloud storage and apply immediately.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-center shrink-0 flex-wrap">
          <button
            onClick={handleResetAll}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-all cursor-pointer"
            title="Reset all blocks to original template"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            <span>Reset All Defaults</span>
          </button>

          <button
            onClick={onSave}
            disabled={isSaving}
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-900/30 transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                <span>Saving to Cloud...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>Save All Text Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid Layout: Left Navigation + Right Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-3 sm:p-4 space-y-1.5 shadow-lg">
          <div className="px-3 py-2 text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Select Page Block</span>
            <span className="text-slate-500">{SECTIONS.length} Blocks</span>
          </div>

          <div className="space-y-1">
            {SECTIONS.map((sec) => {
              const isActive = activeSection === sec.key;
              return (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => setActiveSection(sec.key)}
                  className={`w-full text-left px-3.5 py-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20 font-bold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {sec.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-[13px] font-bold truncate leading-snug">
                      {sec.label}
                    </div>
                    <div
                      className={`text-[11px] truncate mt-0.5 ${
                        isActive ? 'text-blue-100' : 'text-slate-500'
                      }`}
                    >
                      {sec.description}
                    </div>
                  </div>
                  {isActive && (
                    <span className="material-symbols-outlined text-[18px] text-white shrink-0">
                      chevron_right
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Section Editor Area */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-bold mb-1">
                <span className="material-symbols-outlined text-[16px]">
                  {SECTIONS.find((s) => s.key === activeSection)?.icon}
                </span>
                <span>Active Block Configuration</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                {SECTIONS.find((s) => s.key === activeSection)?.label}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {SECTIONS.find((s) => s.key === activeSection)?.description}
              </p>
            </div>

            <button
              onClick={() => handleResetSection(activeSection)}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold self-start sm:self-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">undo</span>
              <span>Reset Block</span>
            </button>
          </div>

          {/* 1. HERO BLOCK EDITOR */}
          {activeSection === 'hero' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Top Badge Tag
                </label>
                <input
                  type="text"
                  value={pageText.hero.badgeText}
                  onChange={(e) => updateSubField('hero', 'badgeText', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
                  placeholder="e.g. CBSE, ICSE & State Boards • New 2025 Edition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Main Headline (First Part)
                  </label>
                  <input
                    type="text"
                    value={pageText.hero.headlineMain}
                    onChange={(e) => updateSubField('hero', 'headlineMain', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
                    placeholder="e.g. Ace School Maths"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Highlighted Wavy Word(s)
                  </label>
                  <input
                    type="text"
                    value={pageText.hero.headlineHighlight}
                    onChange={(e) => updateSubField('hero', 'headlineHighlight', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-amber-400 focus:outline-none focus:border-blue-500 font-bold"
                    placeholder="e.g. Without the Stress!"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Hero Tagline / Explanation
                </label>
                <textarea
                  rows={3}
                  value={pageText.hero.tagline}
                  onChange={(e) => updateSubField('hero', 'tagline', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                  placeholder="Detailed description of what the portal provides..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Primary CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={pageText.hero.ctaPrimaryText}
                    onChange={(e) => updateSubField('hero', 'ctaPrimaryText', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
                    placeholder="e.g. Explore Free Notes"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Secondary CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={pageText.hero.ctaSecondaryText}
                    onChange={(e) => updateSubField('hero', 'ctaSecondaryText', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
                    placeholder="e.g. Unlock Pro Masterclass"
                  />
                </div>
              </div>

              {/* Trust Stat Counters */}
              <div className="pt-3 border-t border-slate-800">
                <span className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                  Live Trust Stats (3 Highlights)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block mb-1">Stat 1 Value</span>
                      <input
                        type="text"
                        value={pageText.hero.stat1Value}
                        onChange={(e) => updateSubField('hero', 'stat1Value', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-black"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block mb-1">Stat 1 Label</span>
                      <input
                        type="text"
                        value={pageText.hero.stat1Label}
                        onChange={(e) => updateSubField('hero', 'stat1Label', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block mb-1">Stat 2 Value</span>
                      <input
                        type="text"
                        value={pageText.hero.stat2Value}
                        onChange={(e) => updateSubField('hero', 'stat2Value', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-black"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block mb-1">Stat 2 Label</span>
                      <input
                        type="text"
                        value={pageText.hero.stat2Label}
                        onChange={(e) => updateSubField('hero', 'stat2Label', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block mb-1">Stat 3 Value</span>
                      <input
                        type="text"
                        value={pageText.hero.stat3Value}
                        onChange={(e) => updateSubField('hero', 'stat3Value', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-black"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block mb-1">Stat 3 Label</span>
                      <input
                        type="text"
                        value={pageText.hero.stat3Label}
                        onChange={(e) => updateSubField('hero', 'stat3Label', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. ANNOUNCEMENT BANNER EDITOR */}
          {activeSection === 'announcement' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <input
                  type="checkbox"
                  id="announcement-enabled"
                  checked={pageText.announcement.enabled}
                  onChange={(e) => updateSubField('announcement', 'enabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded bg-slate-900 border-slate-700"
                />
                <label htmlFor="announcement-enabled" className="text-xs sm:text-sm font-bold text-white cursor-pointer">
                  Display Top Banner on Homepage
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Badge Tag
                </label>
                <input
                  type="text"
                  value={pageText.announcement.badge}
                  onChange={(e) => updateSubField('announcement', 'badge', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Advertisement / Olympiad Notice / Special Update"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Banner Title
                </label>
                <input
                  type="text"
                  value={pageText.announcement.title}
                  onChange={(e) => updateSubField('announcement', 'title', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
                  placeholder="e.g. National Math Olympiad Preparatory Kit 2025"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Banner Subtitle
                </label>
                <input
                  type="text"
                  value={pageText.announcement.subtitle}
                  onChange={(e) => updateSubField('announcement', 'subtitle', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. NCERT Aligned • Mock Tests & AI Live Doubts"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Button Text
                </label>
                <input
                  type="text"
                  value={pageText.announcement.buttonText}
                  onChange={(e) => updateSubField('announcement', 'buttonText', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
                  placeholder="e.g. Enroll Now"
                />
              </div>
            </div>
          )}

          {/* 3. CATALOG & STUDY VAULT EDITOR */}
          {activeSection === 'catalog' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Section Pill Badge
                </label>
                <input
                  type="text"
                  value={pageText.catalog.sectionBadge}
                  onChange={(e) => updateSubField('catalog', 'sectionBadge', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Curriculum Resources"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Section Title
                </label>
                <input
                  type="text"
                  value={pageText.catalog.title}
                  onChange={(e) => updateSubField('catalog', 'title', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
                  placeholder="e.g. Handcrafted Study Vault"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Section Subtitle
                </label>
                <input
                  type="text"
                  value={pageText.catalog.subtitle}
                  onChange={(e) => updateSubField('catalog', 'subtitle', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Filter by standard, format, and chapter..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Search Bar Placeholder Text
                </label>
                <input
                  type="text"
                  value={pageText.catalog.searchPlaceholder}
                  onChange={(e) => updateSubField('catalog', 'searchPlaceholder', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Search formulas, chapters, theorems..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Active Filter Guarantee Callout
                </label>
                <input
                  type="text"
                  value={pageText.catalog.activeFilterHint}
                  onChange={(e) => updateSubField('catalog', 'activeFilterHint', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-emerald-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Instant free downloads — No forced login or paywall required for 1-pagers"
                />
              </div>
            </div>
          )}

          {/* 4. AI TEACHER BLOCK EDITOR */}
          {activeSection === 'aiTeacher' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Section Badge
                </label>
                <input
                  type="text"
                  value={pageText.aiTeacher.badge}
                  onChange={(e) => updateSubField('aiTeacher', 'badge', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-amber-400 focus:outline-none focus:border-blue-500 font-bold"
                  placeholder="e.g. AI Teacher Assistant • Step-by-Step Solver"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Headline
                </label>
                <input
                  type="text"
                  value={pageText.aiTeacher.title}
                  onChange={(e) => updateSubField('aiTeacher', 'title', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
                  placeholder="e.g. Stuck on a Tricky Math Problem?"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={pageText.aiTeacher.description}
                  onChange={(e) => updateSubField('aiTeacher', 'description', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                  placeholder="Meet Prof. Raman, your 24/7 personal math faculty!..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Feature Bullet 1
                  </label>
                  <input
                    type="text"
                    value={pageText.aiTeacher.feature1}
                    onChange={(e) => updateSubField('aiTeacher', 'feature1', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Feature Bullet 2
                  </label>
                  <input
                    type="text"
                    value={pageText.aiTeacher.feature2}
                    onChange={(e) => updateSubField('aiTeacher', 'feature2', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Feature Bullet 3
                  </label>
                  <input
                    type="text"
                    value={pageText.aiTeacher.feature3}
                    onChange={(e) => updateSubField('aiTeacher', 'feature3', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Action Button Text
                </label>
                <input
                  type="text"
                  value={pageText.aiTeacher.buttonText}
                  onChange={(e) => updateSubField('aiTeacher', 'buttonText', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
                  placeholder="e.g. Ask Teacher"
                />
              </div>
            </div>
          )}

          {/* 5. INTERACTIVE FORMULA DECK BLOCK */}
          {activeSection === 'formulaDeck' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Badge Pill
                </label>
                <input
                  type="text"
                  value={pageText.formulaDeck.badge}
                  onChange={(e) => updateSubField('formulaDeck', 'badge', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-blue-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Maths at Your Fingertips Sandbox"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Headline
                </label>
                <input
                  type="text"
                  value={pageText.formulaDeck.title}
                  onChange={(e) => updateSubField('formulaDeck', 'title', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
                  placeholder="e.g. Interactive Formula Deck & Mathematical Transitions"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={pageText.formulaDeck.description}
                  onChange={(e) => updateSubField('formulaDeck', 'description', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                  placeholder="Experience mathematical concepts in action..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Launch Fullscreen Button Text
                </label>
                <input
                  type="text"
                  value={pageText.formulaDeck.buttonText}
                  onChange={(e) => updateSubField('formulaDeck', 'buttonText', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
                  placeholder="e.g. Launch Fullscreen Deck (/#formula-deck)"
                />
              </div>
            </div>
          )}

          {/* 6. MID-PAGE BANNER EDITOR */}
          {activeSection === 'midBanner' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <input
                  type="checkbox"
                  id="mid-banner-enabled"
                  checked={pageText.midBanner.enabled}
                  onChange={(e) => updateSubField('midBanner', 'enabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded bg-slate-900 border-slate-700"
                />
                <label htmlFor="mid-banner-enabled" className="text-xs sm:text-sm font-bold text-white cursor-pointer">
                  Display Mid-Page Sponsored / Camp Banner
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Badge Tag
                </label>
                <input
                  type="text"
                  value={pageText.midBanner.badge}
                  onChange={(e) => updateSubField('midBanner', 'badge', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Sponsored Content / Workshop Highlight"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Banner Headline
                </label>
                <input
                  type="text"
                  value={pageText.midBanner.title}
                  onChange={(e) => updateSubField('midBanner', 'title', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
                  placeholder="e.g. Mental Math Master: Speed Multiplication Camp"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Banner Subtitle
                </label>
                <input
                  type="text"
                  value={pageText.midBanner.subtitle}
                  onChange={(e) => updateSubField('midBanner', 'subtitle', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Live weekend sessions for ages 10-15 • Learn Vedic Math tricks"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Button Action Text
                </label>
                <input
                  type="text"
                  value={pageText.midBanner.buttonText}
                  onChange={(e) => updateSubField('midBanner', 'buttonText', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
                  placeholder="e.g. Claim Free Seat →"
                />
              </div>
            </div>
          )}

          {/* 7. PRO MASTERCLASS SECTION */}
          {activeSection === 'proMasterclass' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Top Pro Badge
                </label>
                <input
                  type="text"
                  value={pageText.proMasterclass.badge}
                  onChange={(e) => updateSubField('proMasterclass', 'badge', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-amber-400 focus:outline-none focus:border-blue-500 font-bold"
                  placeholder="e.g. THE ULTIMATE CLASS 9 & 10 MATHS VAULT"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Main Headline
                </label>
                <input
                  type="text"
                  value={pageText.proMasterclass.headline}
                  onChange={(e) => updateSubField('proMasterclass', 'headline', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
                  placeholder="e.g. Stop Memorizing Formulas. Understand Them Visually."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Subtitle
                </label>
                <textarea
                  rows={2}
                  value={pageText.proMasterclass.subtitle}
                  onChange={(e) => updateSubField('proMasterclass', 'subtitle', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Key Feature Perk 1
                  </label>
                  <input
                    type="text"
                    value={pageText.proMasterclass.perk1}
                    onChange={(e) => updateSubField('proMasterclass', 'perk1', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Key Feature Perk 2
                  </label>
                  <input
                    type="text"
                    value={pageText.proMasterclass.perk2}
                    onChange={(e) => updateSubField('proMasterclass', 'perk2', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Key Feature Perk 3
                  </label>
                  <input
                    type="text"
                    value={pageText.proMasterclass.perk3}
                    onChange={(e) => updateSubField('proMasterclass', 'perk3', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Pricing Card Deal Tag
                  </label>
                  <input
                    type="text"
                    value={pageText.proMasterclass.dealTag}
                    onChange={(e) => updateSubField('proMasterclass', 'dealTag', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-amber-400 focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={pageText.proMasterclass.buttonText}
                    onChange={(e) => updateSubField('proMasterclass', 'buttonText', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Deal Description
                  </label>
                  <input
                    type="text"
                    value={pageText.proMasterclass.dealDescription}
                    onChange={(e) => updateSubField('proMasterclass', 'dealDescription', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Guarantee / Refund Note
                  </label>
                  <input
                    type="text"
                    value={pageText.proMasterclass.guaranteeText}
                    onChange={(e) => updateSubField('proMasterclass', 'guaranteeText', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 8. SOCIAL COMMUNITY BLOCK */}
          {activeSection === 'socialCommunity' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Section Pill Badge
                </label>
                <input
                  type="text"
                  value={pageText.socialCommunity.badge}
                  onChange={(e) => updateSubField('socialCommunity', 'badge', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-blue-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Study Together • Grow Faster"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Community Headline
                </label>
                <input
                  type="text"
                  value={pageText.socialCommunity.title}
                  onChange={(e) => updateSubField('socialCommunity', 'title', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
                  placeholder="e.g. Join 150k+ Maths Champions on Our Channels"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Subtitle / Channel Highlights
                </label>
                <textarea
                  rows={3}
                  value={pageText.socialCommunity.subtitle}
                  onChange={(e) => updateSubField('socialCommunity', 'subtitle', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                  placeholder="Daily morning formulas, 60-second theorem reels..."
                />
              </div>
            </div>
          )}

          {/* 9. FAQ ACCORDION BLOCK */}
          {activeSection === 'faq' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    FAQ Section Title
                  </label>
                  <input
                    type="text"
                    value={pageText.faq.title}
                    onChange={(e) => updateSubField('faq', 'title', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    FAQ Section Subtitle
                  </label>
                  <input
                    type="text"
                    value={pageText.faq.subtitle}
                    onChange={(e) => updateSubField('faq', 'subtitle', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Questions List & Add Button */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Questions &amp; Answers ({pageText.faq.items.length})
                  </span>
                  <button
                    onClick={handleAddFaq}
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold border border-blue-500/30 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Add New Question</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {pageText.faq.items.map((item, idx) => {
                    const isExpanded = editingFaqId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="bg-slate-950 border border-slate-800 rounded-2xl p-4 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-black shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-bold text-white truncate">
                              {item.question}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleMoveFaq(idx, 'up')}
                              disabled={idx === 0}
                              type="button"
                              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                              title="Move Up"
                            >
                              <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                            </button>
                            <button
                              onClick={() => handleMoveFaq(idx, 'down')}
                              disabled={idx === pageText.faq.items.length - 1}
                              type="button"
                              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                              title="Move Down"
                            >
                              <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                            </button>
                            <button
                              onClick={() => setEditingFaqId(isExpanded ? null : item.id)}
                              type="button"
                              className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer ml-1"
                            >
                              {isExpanded ? 'Collapse' : 'Edit'}
                            </button>
                            <button
                              onClick={() => handleDeleteFaq(item.id)}
                              type="button"
                              className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer ml-1"
                              title="Delete Question"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                                Question Title
                              </label>
                              <input
                                type="text"
                                value={item.question}
                                onChange={(e) => handleUpdateFaq(item.id, e.target.value, item.answer)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                                Answer Body
                              </label>
                              <textarea
                                rows={3}
                                value={item.answer}
                                onChange={(e) => handleUpdateFaq(item.id, item.question, e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 leading-relaxed"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 10. FOOTER BLOCK */}
          {activeSection === 'footer' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  About Synopsis Text
                </label>
                <textarea
                  rows={3}
                  value={pageText.footer.aboutText}
                  onChange={(e) => updateSubField('footer', 'aboutText', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                  placeholder="Demystifying school mathematics for Class 5 to Class 10..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Educator / Faculty Dedication Signoff
                </label>
                <input
                  type="text"
                  value={pageText.footer.mentorSignoff}
                  onChange={(e) => updateSubField('footer', 'mentorSignoff', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
                  placeholder="e.g. Curated with dedication by passionate math educators..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Bottom Copyright Text
                </label>
                <input
                  type="text"
                  value={pageText.footer.copyrightText}
                  onChange={(e) => updateSubField('footer', 'copyrightText', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Maths at Your Fingertips. Built for ambitious students, parents & educators."
                />
              </div>
            </div>
          )}

          {/* 11. DEDICATED FORMULA DECK PAGE */}
          {activeSection === 'formulaDeckPage' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Page Badge Tag
                </label>
                <input
                  type="text"
                  value={pageText.formulaDeckPage.badgeText}
                  onChange={(e) => updateSubField('formulaDeckPage', 'badgeText', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-blue-400 focus:outline-none focus:border-blue-500 font-bold"
                  placeholder="e.g. Interactive Visual Math Lab"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Page Main Title
                </label>
                <input
                  type="text"
                  value={pageText.formulaDeckPage.title}
                  onChange={(e) => updateSubField('formulaDeckPage', 'title', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
                  placeholder="e.g. Interactive Formula Deck Sandbox"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Page Subtitle
                </label>
                <input
                  type="text"
                  value={pageText.formulaDeckPage.subtitle}
                  onChange={(e) => updateSubField('formulaDeckPage', 'subtitle', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Explore mathematical theorems with real-time parameter controls..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Instructions Callout
                </label>
                <textarea
                  rows={2}
                  value={pageText.formulaDeckPage.instructionText}
                  onChange={(e) => updateSubField('formulaDeckPage', 'instructionText', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                  placeholder="Select any mathematical theorem or identity below..."
                />
              </div>
            </div>
          )}

          {/* Quick Preview Card */}
          <div className="pt-5 border-t border-slate-800">
            <span className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-blue-400">visibility</span>
              <span>Live Visual Context Preview</span>
            </span>

            <div className="bg-slate-950 rounded-2xl p-4 sm:p-5 border border-slate-800">
              {activeSection === 'hero' && (
                <div className="text-center space-y-2">
                  <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-white text-xs font-bold">
                    {pageText.hero.badgeText}
                  </div>
                  <h4 className="text-lg sm:text-xl font-black text-white">
                    {pageText.hero.headlineMain} <span className="text-amber-400 underline decoration-wavy">{pageText.hero.headlineHighlight}</span> 📐✨
                  </h4>
                  <p className="text-xs text-slate-400 max-w-lg mx-auto">
                    {pageText.hero.tagline}
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <span className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">
                      {pageText.hero.ctaPrimaryText}
                    </span>
                    <span className="px-4 py-1.5 bg-amber-400 text-slate-950 rounded-lg text-xs font-bold">
                      {pageText.hero.ctaSecondaryText}
                    </span>
                  </div>
                </div>
              )}

              {activeSection === 'announcement' && (
                <div className="p-3 bg-blue-950/40 rounded-xl border border-blue-800/40 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-400 block">{pageText.announcement.badge}</span>
                    <strong className="text-xs font-bold text-white">{pageText.announcement.title}</strong>
                    <p className="text-[11px] text-slate-400">{pageText.announcement.subtitle}</p>
                  </div>
                  <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shrink-0">
                    {pageText.announcement.buttonText}
                  </span>
                </div>
              )}

              {activeSection === 'catalog' && (
                <div className="space-y-1 text-center">
                  <span className="text-[10px] uppercase font-bold text-blue-400 block">{pageText.catalog.sectionBadge}</span>
                  <h4 className="text-base font-black text-white">{pageText.catalog.title}</h4>
                  <p className="text-xs text-slate-400">{pageText.catalog.subtitle}</p>
                </div>
              )}

              {activeSection === 'aiTeacher' && (
                <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl text-white space-y-2">
                  <span className="text-[10px] uppercase font-black text-amber-300 block">{pageText.aiTeacher.badge}</span>
                  <h4 className="text-base font-black">{pageText.aiTeacher.title}</h4>
                  <p className="text-xs text-blue-100">{pageText.aiTeacher.description}</p>
                  <span className="inline-block mt-2 px-3 py-1.5 bg-amber-400 text-slate-950 rounded-lg text-xs font-bold">
                    {pageText.aiTeacher.buttonText}
                  </span>
                </div>
              )}

              {activeSection === 'formulaDeck' && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-blue-400 block">{pageText.formulaDeck.badge}</span>
                  <h4 className="text-base font-black text-white">{pageText.formulaDeck.title}</h4>
                  <p className="text-xs text-slate-400">{pageText.formulaDeck.description}</p>
                </div>
              )}

              {activeSection === 'midBanner' && (
                <div className="p-3 bg-white/5 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{pageText.midBanner.badge}</span>
                    <strong className="text-xs font-bold text-white">{pageText.midBanner.title}</strong>
                    <p className="text-[11px] text-slate-400">{pageText.midBanner.subtitle}</p>
                  </div>
                  <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shrink-0">
                    {pageText.midBanner.buttonText}
                  </span>
                </div>
              )}

              {activeSection === 'proMasterclass' && (
                <div className="p-4 bg-gradient-to-r from-blue-700 to-blue-600 rounded-xl text-white space-y-2">
                  <span className="text-[10px] uppercase font-black text-amber-300">{pageText.proMasterclass.badge}</span>
                  <h4 className="text-base font-black">{pageText.proMasterclass.headline}</h4>
                  <p className="text-xs text-blue-100">{pageText.proMasterclass.subtitle}</p>
                </div>
              )}

              {activeSection === 'socialCommunity' && (
                <div className="text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-blue-400 block">{pageText.socialCommunity.badge}</span>
                  <h4 className="text-base font-black text-white">{pageText.socialCommunity.title}</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">{pageText.socialCommunity.subtitle}</p>
                </div>
              )}

              {activeSection === 'faq' && (
                <div className="space-y-1">
                  <h4 className="text-base font-black text-white">{pageText.faq.title}</h4>
                  <p className="text-xs text-slate-400 mb-2">{pageText.faq.subtitle}</p>
                  <div className="p-2.5 bg-slate-900 rounded-lg text-xs font-bold text-slate-200">
                    Q: {pageText.faq.items[0]?.question}
                  </div>
                </div>
              )}

              {activeSection === 'footer' && (
                <div className="space-y-2 text-xs text-slate-400">
                  <p>{pageText.footer.aboutText}</p>
                  <p className="italic text-slate-500">"{pageText.footer.mentorSignoff}"</p>
                  <p className="text-[11px] text-slate-600">© {pageText.footer.copyrightText}</p>
                </div>
              )}

              {activeSection === 'formulaDeckPage' && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-blue-400">{pageText.formulaDeckPage.badgeText}</span>
                  <h4 className="text-base font-black text-white">{pageText.formulaDeckPage.title}</h4>
                  <p className="text-xs text-slate-400">{pageText.formulaDeckPage.subtitle}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
