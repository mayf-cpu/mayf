import React, { useState, useEffect } from 'react';
import {
  CustomResourceRecord,
  saveCustomResourceToFirestore,
  deleteCustomResourceFromFirestore,
} from '../../firebase';
import { MATH_RESOURCES } from '../../data/mathResources';
import { getCategories } from '../../services/categories';
import {
  saveLocalCustomResources,
  getLocalCustomResources,
  getTierOverrides,
  saveTierOverrides,
} from '../../services/resources';

interface AdminContentUploadTabProps {
  customResources: CustomResourceRecord[];
  onRefresh: () => void;
  onToast: (msg: string) => void;
}

export const AdminContentUploadTab: React.FC<AdminContentUploadTabProps> = ({
  customResources,
  onRefresh,
  onToast,
}) => {
  const dynamicCategories = getCategories();
  const gradeOptions = dynamicCategories.filter((c) => c.type === 'grade' && c.enabled);
  const topicOptions = dynamicCategories.filter((c) => c.type === 'topic' && c.enabled);
  const formatOptions = dynamicCategories.filter((c) => c.type === 'format' && c.enabled);

  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState(gradeOptions[0]?.name || 'Class 10');
  const [topic, setTopic] = useState(topicOptions[0]?.name || 'Polynomials');
  const [format, setFormat] = useState(formatOptions[0]?.name || 'Formula Sheets (1-Pager)');
  const [tier, setTier] = useState<'free' | 'pro'>('free');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  const [description, setDescription] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // Local overrides for existing MATH_RESOURCES
  const [resourceTierOverrides, setResourceTierOverrides] = useState<Record<string, 'free' | 'pro'>>(getTierOverrides);

  useEffect(() => {
    setResourceTierOverrides(getTierOverrides());
  }, []);

  const handlePublishContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onToast('⚠️ Please enter a title for this learning material.');
      return;
    }

    setIsPublishing(true);
    try {
      const newId = `res-${Date.now()}`;
      const payload: CustomResourceRecord = {
        id: newId,
        title: title.trim(),
        grade,
        topic,
        format,
        tier,
        downloadUrl: downloadUrl.trim() || undefined,
        youtubeId: youtubeId.trim() || undefined,
        description: description.trim() || undefined,
        views: 0,
        downloads: 0,
        createdAt: new Date().toISOString(),
      };

      // Save locally first for instant reflect
      const currentList = getLocalCustomResources();
      const updatedList = [payload, ...currentList.filter((r) => r.id !== newId)];
      saveLocalCustomResources(updatedList);

      try {
        await saveCustomResourceToFirestore(payload);
      } catch (cloudErr) {
        console.warn('Saved to local storage, Firestore cloud sync notice:', cloudErr);
      }

      onToast(`🎉 Published "${title}" successfully! Live in website catalog.`);
      // Reset form
      setTitle('');
      setDownloadUrl('');
      setYoutubeId('');
      setDescription('');
      onRefresh();
    } catch (err) {
      onToast('Failed to publish material. Check connection.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteCustom = async (id: string, itemTitle: string) => {
    if (!window.confirm(`Delete "${itemTitle}"?`)) return;
    try {
      // Update local storage first
      const currentList = getLocalCustomResources();
      const updatedList = currentList.filter((r) => r.id !== id);
      saveLocalCustomResources(updatedList);

      try {
        await deleteCustomResourceFromFirestore(id);
      } catch (cloudErr) {
        console.warn('Deleted locally, cloud notice:', cloudErr);
      }

      onToast(`Deleted "${itemTitle}"`);
      onRefresh();
    } catch (e) {
      onToast('Failed to delete resource.');
    }
  };

  const toggleCoreResourceTier = (id: string, currentTier: 'free' | 'pro') => {
    const nextTier: 'free' | 'pro' = (resourceTierOverrides[id] || currentTier) === 'free' ? 'pro' : 'free';
    const updated: Record<string, 'free' | 'pro'> = { ...resourceTierOverrides, [id]: nextTier };
    setResourceTierOverrides(updated);
    saveTierOverrides(updated);
    onToast(`Resource "${id}" changed to ${nextTier.toUpperCase()} & updated on front-end!`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 1. UPLOAD NEW STUDY MATERIAL FORM */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">upload_file</span>
              <span>Publish New Study Material &amp; Lectures</span>
            </h3>
            <p className="text-xs text-slate-500">
              Upload NCERT notes, formula sheets, PDF walkthroughs, or YouTube concept video lessons.
            </p>
          </div>
          <span className="text-xs font-mono bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg">
            Instant Student Access
          </span>
        </div>

        <form onSubmit={handlePublishContent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Document / Video Title: *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Class 10 Trigonometric Identities 2-Page Revision Sheet"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-900"
                required
              />
            </div>

            {/* Class / Grade */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Target Grade:
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-800"
              >
                {gradeOptions.map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.name} {g.badge ? `(${g.badge})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Domain / Topic */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Domain / Topic:
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-800"
              >
                {topicOptions.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Format */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Resource Format:
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-800"
              >
                {formatOptions.map((f) => (
                  <option key={f.id} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Access Tier */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Access Tier:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTier('free')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    tier === 'free'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span>🟢 FREE</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTier('pro')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    tier === 'pro'
                      ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span>⭐ PRO ONLY</span>
                </button>
              </div>
            </div>

            {/* YouTube Video ID */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                YouTube Video ID (Optional):
              </label>
              <input
                type="text"
                value={youtubeId}
                onChange={(e) => setYoutubeId(e.target.value)}
                placeholder="e.g. dQw4w9WgXcQ"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Download URL / Drive link */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Download File Link (PDF, Google Drive, or CDN URL):
            </label>
            <input
              type="url"
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/... or direct PDF link"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Syllabus Description */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Brief Description &amp; Key Concepts Covered:
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Includes standard CBSE definitions, proof of theorems, and 5 exemplar board questions..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isPublishing}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-70"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isPublishing ? 'sync' : 'publish'}
              </span>
              <span>{isPublishing ? 'Publishing...' : 'Publish Material to Learning Hub'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. RECENTLY UPLOADED CUSTOM MATERIALS */}
      {customResources.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Custom Uploaded Material</span>
              <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                {customResources.length} items
              </span>
            </h4>
            <span className="text-xs text-slate-400">Stored in Firestore /custom_resources</span>
          </div>

          <div className="divide-y divide-slate-100">
            {customResources.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {item.grade}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">{item.topic}</span>
                    <span className="text-[10px] text-slate-400 font-mono">• {item.format}</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 truncate">{item.title}</h5>
                  {item.downloadUrl && (
                    <a
                      href={item.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 hover:underline truncate block"
                    >
                      {item.downloadUrl}
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.tier === 'free' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.tier === 'free' ? 'FREE' : 'PRO'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteCustom(item.id, item.title)}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Delete item"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. CORE CURRICULUM ACCESS CONTROLS */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Core Curriculum Tiers (Toggle Free / Pro)</h4>
            <p className="text-xs text-slate-500">Quickly toggle existing sheets between free open access and paid Pro pass.</p>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
            {MATH_RESOURCES.length} Core Notes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
          {MATH_RESOURCES.map((r) => {
            const currentTier = resourceTierOverrides[r.id] || r.tier;
            return (
              <div
                key={r.id}
                className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">
                    {r.grade} • {r.topic}
                  </span>
                  <h5 className="text-xs font-bold text-slate-900 truncate" title={r.title}>
                    {r.title}
                  </h5>
                </div>

                <button
                  type="button"
                  onClick={() => toggleCoreResourceTier(r.id, r.tier)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all shrink-0 ${
                    currentTier === 'free'
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  }`}
                >
                  {currentTier === 'free' ? '🟢 FREE' : '⭐ PRO ONLY'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
