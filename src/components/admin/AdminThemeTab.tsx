import React, { useState } from 'react';
import {
  ThemeConfig,
  THEME_PRESETS,
  ThemePreset,
  LayoutGrid,
  CardStyle,
  BorderRadiusOption,
  HeroBannerStyle,
  BackgroundTone,
  DEFAULT_THEME_CONFIG,
  applyThemeToDocument,
  saveThemeConfigLocally,
  resetThemeToDefault,
} from '../../services/theme';
import { saveThemeSettingsToFirestore } from '../../firebase';

interface AdminThemeTabProps {
  currentTheme: ThemeConfig;
  onUpdateTheme: (newTheme: ThemeConfig) => void;
  onToast: (msg: string) => void;
}

export const AdminThemeTab: React.FC<AdminThemeTabProps> = ({
  currentTheme,
  onUpdateTheme,
  onToast,
}) => {
  const [theme, setTheme] = useState<ThemeConfig>(currentTheme);
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = (partial: Partial<ThemeConfig>) => {
    const updated = { ...theme, ...partial };
    setTheme(updated);
    onUpdateTheme(updated);
    applyThemeToDocument(updated);
  };

  const handleSelectPreset = (key: ThemePreset) => {
    const p = THEME_PRESETS[key];
    const updated: ThemeConfig = {
      ...theme,
      preset: key,
      primaryColor: p.primaryColor,
      secondaryColor: p.secondaryColor,
      accentColor: p.accentColor,
      backgroundTone: p.backgroundTone,
      isDarkMode: p.isDarkMode,
    };
    setTheme(updated);
    onUpdateTheme(updated);
    applyThemeToDocument(updated);
    onToast(`Applied theme preset: ${p.name}`);
  };

  const handleSaveToCloud = async () => {
    setIsSaving(true);
    try {
      await saveThemeSettingsToFirestore(theme);
      saveThemeConfigLocally(theme);
      onToast('✓ Theme & Layout settings saved to cloud & published live!');
    } catch (e) {
      console.warn('Theme cloud save notice:', e);
      saveThemeConfigLocally(theme);
      onToast('Saved locally. Cloud sync warning.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all theme, colors, and layout customizations to defaults?')) {
      const def = resetThemeToDefault();
      setTheme(def);
      onUpdateTheme(def);
      onToast('Theme reset to default Sapphire Blue');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold border border-blue-400/20 mb-2">
              <span className="material-symbols-outlined text-[16px]">palette</span>
              Design, Theme & Layout Engine
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Theme Settings & Visual Customization
            </h2>
            <p className="text-blue-200 text-xs sm:text-sm mt-1 max-w-xl">
              Customize primary colors, dark/light modes, card geometries, grid column densities, and hero banner styles. Changes apply live to all students across mobile and desktop.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Reset Defaults
            </button>
            <button
              onClick={handleSaveToCloud}
              disabled={isSaving}
              className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-950/40 transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
              {isSaving ? 'Publishing...' : 'Save & Publish Live'}
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Settings Columns & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Theme & Colors (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Theme Presets */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[18px]">auto_awesome</span>
                1-Click Theme Presets
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                Click any preset to apply instantly
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.keys(THEME_PRESETS) as ThemePreset[]).map((key) => {
                const p = THEME_PRESETS[key];
                const isSelected = theme.preset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectPreset(key)}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col gap-1 items-center shrink-0 pt-0.5">
                      <div
                        className="w-5 h-5 rounded-full shadow-sm"
                        style={{ backgroundColor: p.primaryColor }}
                      />
                      <div
                        className="w-3.5 h-3.5 rounded-full shadow-sm"
                        style={{ backgroundColor: p.accentColor }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {p.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold shrink-0">
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {p.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Custom Colors */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[18px]">colorize</span>
              Custom Color Palette & Brand Tones
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Primary Color */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Primary Brand Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => handleUpdate({ primaryColor: e.target.value })}
                    className="w-9 h-9 rounded-xl cursor-pointer border border-slate-300 p-0"
                  />
                  <input
                    type="text"
                    value={theme.primaryColor}
                    onChange={(e) => handleUpdate({ primaryColor: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Accent Color (Action Badges)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.accentColor}
                    onChange={(e) => handleUpdate({ accentColor: e.target.value })}
                    className="w-9 h-9 rounded-xl cursor-pointer border border-slate-300 p-0"
                  />
                  <input
                    type="text"
                    value={theme.accentColor}
                    onChange={(e) => handleUpdate({ accentColor: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Secondary Text / Neutral
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.secondaryColor}
                    onChange={(e) => handleUpdate({ secondaryColor: e.target.value })}
                    className="w-9 h-9 rounded-xl cursor-pointer border border-slate-300 p-0"
                  />
                  <input
                    type="text"
                    value={theme.secondaryColor}
                    onChange={(e) => handleUpdate({ secondaryColor: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Background Tone & Dark Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Background Tone
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'light', label: 'Clean White', bg: '#f9f9ff' },
                      { id: 'slate', label: 'Slate Ice', bg: '#f1f5f9' },
                      { id: 'cream', label: 'Warm Cream', bg: '#faf8f5' },
                      { id: 'dark', label: 'Charcoal Dark', bg: '#0f172a' },
                      { id: 'midnight', label: 'Midnight Navy', bg: '#0b1120' },
                    ] as { id: BackgroundTone; label: string; bg: string }[]
                  ).map((tone) => (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => handleUpdate({ backgroundTone: tone.id, isDarkMode: tone.id === 'dark' || tone.id === 'midnight' })}
                      className={`p-2 rounded-xl text-center text-[10px] font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        theme.backgroundTone === tone.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-slate-300"
                        style={{ backgroundColor: tone.bg }}
                      />
                      <span>{tone.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dark mode switcher toggle */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">dark_mode</span>
                    Dark Mode Mode Switch
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Force dark slate aesthetic for late evening study hours.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleUpdate({ isDarkMode: false, backgroundTone: 'light' })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors ${
                      !theme.isDarkMode
                        ? 'bg-white shadow text-slate-900 border border-slate-200'
                        : 'text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">light_mode</span> Light
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdate({ isDarkMode: true, backgroundTone: 'midnight' })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors ${
                      theme.isDarkMode
                        ? 'bg-slate-900 text-white shadow'
                        : 'text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">dark_mode</span> Dark
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Design & Layout Grid Options */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[18px]">dashboard</span>
              Layout, Grid & Geometry Features
            </h3>

            {/* Grid Density */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Cards Grid Density
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: '3-col', label: '3 Columns (Balanced)', icon: 'view_column', desc: 'Standard 3-grid' },
                  { id: '4-col', label: '4 Columns (Compact)', icon: 'grid_view', desc: 'High density cards' },
                  { id: '2-col', label: '2 Columns (Detailed)', icon: 'view_agenda', desc: 'Large cards' },
                  { id: 'list', label: 'List / Table View', icon: 'view_list', desc: 'Compact rows' },
                ].map((layout) => (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => handleUpdate({ layoutGrid: layout.id as LayoutGrid })}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      theme.layoutGrid === layout.id
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">{layout.icon}</span>
                      <span className="text-xs font-bold">{layout.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">{layout.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Card Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Card Visual Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'elevated', label: 'Elevated Shadow' },
                    { id: 'bordered', label: 'Clean Bordered' },
                    { id: 'glass', label: 'Frosted Glass' },
                    { id: 'vibrant', label: 'Vibrant Accent' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => handleUpdate({ cardStyle: style.id as CardStyle })}
                      className={`p-2 rounded-xl text-center text-xs font-bold border transition-all cursor-pointer ${
                        theme.cardStyle === style.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Radius */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Corner Geometry (Border Radius)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'rounded-3xl', label: 'Ultra Rounded (24px)' },
                    { id: 'rounded-2xl', label: 'Smooth (16px)' },
                    { id: 'rounded-xl', label: 'Modern (12px)' },
                    { id: 'rounded-md', label: 'Sharp (6px)' },
                  ].map((rad) => (
                    <button
                      key={rad.id}
                      type="button"
                      onClick={() => handleUpdate({ borderRadius: rad.id as BorderRadiusOption })}
                      className={`p-2 rounded-xl text-center text-xs font-bold border transition-all cursor-pointer ${
                        theme.borderRadius === rad.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      {rad.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hero Banner Style & Font Scale */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Homepage Hero Banner Style
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'split', label: 'Split Hero' },
                    { id: 'centered', label: 'Centered' },
                    { id: 'compact', label: 'Compact' },
                  ].map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => handleUpdate({ heroStyle: h.id as HeroBannerStyle })}
                      className={`p-2 rounded-xl text-center text-xs font-bold border transition-all cursor-pointer ${
                        theme.heroStyle === h.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Typography Scale
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'compact', label: 'Compact' },
                    { id: 'normal', label: 'Balanced' },
                    { id: 'large', label: 'Accessible' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleUpdate({ fontScale: f.id as any })}
                      className={`p-2 rounded-xl text-center text-xs font-bold border transition-all cursor-pointer ${
                        theme.fontScale === f.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Card Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-4">
            <div className="bg-slate-900 p-4 rounded-3xl text-white mb-3 flex items-center justify-between shadow-md">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-400 text-[18px]">preview</span>
                Real-Time Component Preview
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                Live Simulator
              </span>
            </div>

            {/* Simulated Resource Card */}
            <div
              className={`p-5 transition-all duration-300 border ${
                theme.isDarkMode
                  ? 'bg-slate-800/90 text-white border-slate-700'
                  : theme.cardStyle === 'glass'
                  ? 'bg-white/70 backdrop-blur-md border-white/50 shadow-xl'
                  : theme.cardStyle === 'bordered'
                  ? 'bg-white border-2 border-slate-200 shadow-none'
                  : theme.cardStyle === 'vibrant'
                  ? 'bg-white border-2 border-l-8 shadow-md'
                  : 'bg-white border-slate-100 shadow-xl'
              }`}
              style={{
                borderRadius:
                  theme.borderRadius === 'rounded-3xl'
                    ? '24px'
                    : theme.borderRadius === 'rounded-2xl'
                    ? '16px'
                    : theme.borderRadius === 'rounded-xl'
                    ? '12px'
                    : '6px',
                borderLeftColor:
                  theme.cardStyle === 'vibrant' ? theme.primaryColor : undefined,
              }}
            >
              {/* Category & Badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${theme.primaryColor}18`,
                      color: theme.primaryColor,
                    }}
                  >
                    Class 10 • Trigonometry
                  </span>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: theme.accentColor }}
                >
                  FREE 1-PAGER
                </span>
              </div>

              {/* Title & Description */}
              <h4 className="text-base font-extrabold line-clamp-1 mb-1">
                Trigonometry Super Mastery Cheat Sheet
              </h4>
              <p
                className={`text-xs leading-relaxed line-clamp-2 mb-4 ${
                  theme.isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                Every standard identity, sin²θ+cos²θ=1 shortcuts, and 12 typical board examination trap questions solved.
              </p>

              {/* Formula Sample Box */}
              <div
                className={`p-3 mb-4 rounded-xl font-mono text-xs border ${
                  theme.isDarkMode
                    ? 'bg-slate-900/60 border-slate-700 text-sky-300'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                sin(90° - θ) = cos(θ) • tan²θ + 1 = sec²θ
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100/50">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">download</span>
                  12.4k downloads
                </div>
                <button
                  type="button"
                  className="px-4 py-2 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  style={{
                    backgroundColor: theme.primaryColor,
                  }}
                >
                  <span className="material-symbols-outlined text-[16px]">file_download</span>
                  Download Free
                </button>
              </div>
            </div>

            {/* Hero Simulation Miniature */}
            <div className="mt-4 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-blue-600">view_compact</span>
                Homepage Hero Preview ({theme.heroStyle.toUpperCase()})
              </span>
              <div
                className="p-4 rounded-2xl text-white text-center"
                style={{
                  background: `linear-gradient(135deg, ${theme.primaryColor}, #0f172a)`,
                }}
              >
                <div
                  className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-1"
                  style={{ backgroundColor: `${theme.accentColor}` }}
                >
                  Maths at Your Fingertips
                </div>
                <h5 className="font-extrabold text-sm">Ace Class 5 - 10 Board Exams</h5>
                <p className="text-[11px] opacity-80 mt-0.5">
                  1-Page Formula Sheets & NCERT Walkthroughs
                </p>
              </div>
            </div>

            {/* Quick summary specs */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Active Preset:</span>
                <span className="font-bold text-slate-800">{theme.preset}</span>
              </div>
              <div className="flex justify-between">
                <span>Layout Columns:</span>
                <span className="font-bold text-slate-800">{theme.layoutGrid}</span>
              </div>
              <div className="flex justify-between">
                <span>Corner Radius:</span>
                <span className="font-bold text-slate-800">{theme.borderRadius}</span>
              </div>
              <div className="flex justify-between">
                <span>Dark Mode Status:</span>
                <span className="font-bold text-slate-800">
                  {theme.isDarkMode ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
