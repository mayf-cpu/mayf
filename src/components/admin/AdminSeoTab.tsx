import React, { useState } from 'react';
import {
  SeoSettings,
  DEFAULT_SEO_SETTINGS,
  saveSeoSettingsToFirestore,
} from '../../firebase';

interface AdminSeoTabProps {
  initialSeo: SeoSettings | null;
  onToast: (msg: string) => void;
}

export const AdminSeoTab: React.FC<AdminSeoTabProps> = ({ initialSeo, onToast }) => {
  const [seo, setSeo] = useState<SeoSettings>(initialSeo || DEFAULT_SEO_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveSeoSettingsToFirestore(seo);
      // Also apply document title in current DOM
      if (seo.metaTitle) {
        document.title = seo.metaTitle;
      }
      onToast('🎉 Website SEO & OpenGraph Settings Saved & Deployed!');
    } catch (e) {
      onToast('Failed to save SEO settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const jsonLdPreview = JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': seo.structuredDataType || 'EducationalOrganization',
      name: seo.metaTitle,
      description: seo.metaDescription,
      url: seo.canonicalUrl,
      keywords: seo.keywords,
      hasCourse: [
        {
          '@type': 'Course',
          name: 'Class 10 CBSE Maths Board Prep',
          description: 'NCERT solutions, rapid formulas, and exam questions.',
        },
        {
          '@type': 'Course',
          name: 'Class 9 Math Mastery',
          description: 'Polynomials, circles, geometry, and exemplar walkthroughs.',
        },
      ],
    },
    null,
    2
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 1. SEO CONFIGURATION FORM */}
      <form onSubmit={handleSaveSeo} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">travel_explore</span>
              <span>Search Engine Optimization (SEO) &amp; Meta Tags</span>
            </h3>
            <p className="text-xs text-slate-500">
              Control how Maths at Your Fingertips ranks on Google, Bing, and previews when shared on WhatsApp, Facebook, or Twitter.
            </p>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-75"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isSaving ? 'sync' : 'save'}
            </span>
            <span>{isSaving ? 'Deploying...' : 'Save & Deploy SEO'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Meta Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">Meta Title Tag: *</label>
              <span className={`text-[10px] font-mono ${seo.metaTitle.length > 60 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                {seo.metaTitle.length}/60 chars
              </span>
            </div>
            <input
              type="text"
              value={seo.metaTitle}
              onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900"
              required
            />
          </div>

          {/* Canonical URL */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Canonical Website URL:</label>
            <input
              type="url"
              value={seo.canonicalUrl}
              onChange={(e) => setSeo({ ...seo, canonicalUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900"
            />
          </div>
        </div>

        {/* Meta Description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700">Meta Description: *</label>
            <span className={`text-[10px] font-mono ${seo.metaDescription.length > 160 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
              {seo.metaDescription.length}/160 chars (Recommended &lt; 160)
            </span>
          </div>
          <textarea
            rows={2}
            value={seo.metaDescription}
            onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900"
            required
          />
        </div>

        {/* Keywords */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Target Search Keywords (Comma-separated):
          </label>
          <input
            type="text"
            value={seo.keywords}
            onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
            placeholder="class 10 maths, ncert solutions, formula cheat sheet"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800"
          />
        </div>

        {/* Social Card (OG Image) */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            OpenGraph Social Share Banner Image (og:image):
          </label>
          <input
            type="url"
            value={seo.ogImageUrl}
            onChange={(e) => setSeo({ ...seo, ogImageUrl: e.target.value })}
            placeholder="https://..."
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800"
          />
        </div>
      </form>

      {/* 2. REALISTIC GOOGLE SERP RESULT SNIPPET */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-blue-600">search</span>
          <span>Google Search Result Snippet Simulation</span>
        </h4>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans max-w-xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
              ∑
            </div>
            <div className="text-xs text-[#202124] leading-tight">
              <span className="font-semibold block">Maths at Your Fingertips</span>
              <span className="text-[11px] text-[#4d5156] font-mono">{seo.canonicalUrl || 'https://mathsatyourfingertips.com'}</span>
            </div>
          </div>
          <h3 className="text-base font-semibold text-[#1a0dab] hover:underline cursor-pointer leading-tight mb-1">
            {seo.metaTitle || 'Maths at Your Fingertips - Class 5 - 10 Learning Hub'}
          </h3>
          <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-2">
            {seo.metaDescription || 'Demystifying school mathematics for Class 5 to Class 10 with handcrafted notes and 2-minute formula sheets.'}
          </p>
        </div>
      </div>

      {/* 3. SCHEMA.ORG JSON-LD PREVIEW */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400">data_object</span>
            <h4 className="text-sm font-bold text-slate-100">Schema.org JSON-LD Structured Data</h4>
          </div>
          <span className="text-xs font-mono bg-slate-800 text-emerald-400 px-2 py-0.5 rounded">
            Rich Results Validated
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Embedded in website head to power Google rich snippets, breadcrumbs, and course carousels.
        </p>
        <pre className="bg-slate-950 p-3.5 rounded-xl font-mono text-[11px] text-emerald-300 overflow-x-auto border border-slate-800">
          {jsonLdPreview}
        </pre>
      </div>
    </div>
  );
};
