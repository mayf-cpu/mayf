import React, { useState, useEffect, useRef } from 'react';
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
import { YouTubeIcon, FacebookIcon } from '../SocialIcons';
import { generateContentThumbnail, generateDocumentCoverThumbnail } from '../../services/thumbnailGenerator';

interface AdminContentUploadTabProps {
  customResources: CustomResourceRecord[];
  onRefresh: () => void;
  onToast: (msg: string) => void;
}

type IngestMode = 'spreadsheet' | 'google_drive' | 'google_sheets' | 'ai_syllabus';

export const AdminContentUploadTab: React.FC<AdminContentUploadTabProps> = ({
  customResources,
  onRefresh,
  onToast,
}) => {
  const dynamicCategories = getCategories();
  const gradeOptions = dynamicCategories.filter((c) => c.type === 'grade' && c.enabled);
  const topicOptions = dynamicCategories.filter((c) => c.type === 'topic' && c.enabled);
  const formatOptions = dynamicCategories.filter((c) => c.type === 'format' && c.enabled);

  // Top view switcher - default to catalog so uploaded content is immediately visible
  const [viewTab, setViewTab] = useState<'catalog' | 'manual' | 'ai_ingest'>('catalog');

  // AI Ingest Sub-mode
  const [ingestMode, setIngestMode] = useState<IngestMode>('spreadsheet');

  // AI Ingest Form States
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'claude'>('gemini');
  const [customAiKey, setCustomAiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('admin_custom_ai_key') || '';
    } catch {
      return '';
    }
  });
  const [showKeyField, setShowKeyField] = useState<boolean>(false);
  const [csvInput, setCsvInput] = useState<string>('');
  const [googleDriveUrl, setGoogleDriveUrl] = useState<string>('');
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>('');
  const [syllabusPrompt, setSyllabusPrompt] = useState<string>('');
  const [targetGrade, setTargetGrade] = useState<string>(gradeOptions[0]?.name || 'Class 10');
  const [defaultTier, setDefaultTier] = useState<'free' | 'pro'>('free');

  // Processing & Staged Queue
  const [isProcessingAi, setIsProcessingAi] = useState<boolean>(false);
  const [stagedResources, setStagedResources] = useState<CustomResourceRecord[]>([]);
  const [isPublishingBatch, setIsPublishingBatch] = useState<boolean>(false);
  const [showWebhookDocs, setShowWebhookDocs] = useState<boolean>(false);

  // Single Manual Form State & Edit State
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState(gradeOptions[0]?.name || 'Class 10');
  const [topic, setTopic] = useState(topicOptions[0]?.name || 'Polynomials');
  const [format, setFormat] = useState(formatOptions[0]?.name || 'Formula Sheets (1-Pager)');
  const [tier, setTier] = useState<'free' | 'pro'>('free');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoSourceType, setVideoSourceType] = useState<'youtube' | 'facebook' | 'iframe'>('youtube');
  const [youtubeId, setYoutubeId] = useState('');
  const [facebookVideoUrl, setFacebookVideoUrl] = useState('');
  const [embedHtml, setEmbedHtml] = useState('');
  const [description, setDescription] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // Filter & Search states for Catalog
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogGrade, setCatalogGrade] = useState('All');
  const [catalogTier, setCatalogTier] = useState('All');
  const [previewModalResource, setPreviewModalResource] = useState<CustomResourceRecord | null>(null);

  // Local overrides for existing MATH_RESOURCES
  const [resourceTierOverrides, setResourceTierOverrides] = useState<Record<string, 'free' | 'pro'>>(getTierOverrides);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setResourceTierOverrides(getTierOverrides());
  }, []);

  // Download official CSV template
  const handleDownloadCsvTemplate = () => {
    const csvContent =
      'Title,Grade,Topic,Format,Tier,DownloadUrl,YouTubeId,Description,BadgeLabel\n' +
      'Class 10 Trigonometry 1-Pager Cheat Sheet,Class 10,Trigonometry,Formula Sheets (1-Pager),free,https://drive.google.com/file/d/sample1/view,,Complete trigonometric ratios identities and value table,Board Special\n' +
      'Quadratic Equations Masterclass Notes,Class 10,Quadratic Equations,Handcrafted Notes (PDF),pro,https://drive.google.com/file/d/sample2/view,,Comprehensive step-by-step factorization and quadratic formula notes,Pro Kit\n' +
      'Class 9 Number Systems NCERT Exemplar,Class 9,Real Numbers & Polynomials,NCERT Exemplar Solutions,free,,,Complete solved examples with irrationality proofs and rationalization,Free PDF\n' +
      'Surface Areas & Volumes 3D Formula Vault,Class 10,Surface Areas & Volumes,Formula Sheets (1-Pager),free,,,All curved surface and total surface area formulas for cone cylinder sphere,Quick Formula\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Maths_Content_Upload_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('Downloaded Maths_Content_Upload_Template.csv');
  };

  // Handle Drag-and-drop or File upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvInput(text);
      onToast(`Loaded file "${file.name}" (${(file.size / 1024).toFixed(1)} KB). Ready for AI categorization!`);
    };
    reader.readAsText(file);
  };

  // Process AI Ingestion
  const handleRunAiIngest = async () => {
    let inputData = '';
    let modeParam = ingestMode;

    if (ingestMode === 'spreadsheet') {
      if (!csvInput.trim()) {
        onToast('Please paste spreadsheet CSV text or upload a CSV file.');
        return;
      }
      inputData = csvInput.trim();
    } else if (ingestMode === 'google_drive') {
      if (!googleDriveUrl.trim()) {
        onToast('Please enter a Google Drive shared file or folder link.');
        return;
      }
      inputData = googleDriveUrl.trim();
    } else if (ingestMode === 'google_sheets') {
      if (!googleSheetUrl.trim()) {
        onToast('Please enter a Google Sheets URL.');
        return;
      }
      setIsProcessingAi(true);
      try {
        // Fetch CSV from Google Sheets via backend proxy
        const fetchRes = await fetch('/api/ai/fetch-sheets-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sheetUrl: googleSheetUrl.trim() }),
        });
        const sheetData = await fetchRes.json();
        if (!fetchRes.ok) {
          throw new Error(sheetData.error || 'Failed to fetch Google Sheet.');
        }
        inputData = sheetData.csvText;
        modeParam = 'spreadsheet';
      } catch (err: any) {
        setIsProcessingAi(false);
        onToast(err.message || 'Error fetching Google Sheet.');
        return;
      }
    } else if (ingestMode === 'ai_syllabus') {
      if (!syllabusPrompt.trim()) {
        onToast('Please enter a chapter or syllabus topic outline for AI generation.');
        return;
      }
      inputData = syllabusPrompt.trim();
    }

    setIsProcessingAi(true);
    try {
      const response = await fetch('/api/ai/batch-content-ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: modeParam,
          inputData,
          targetGrade,
          defaultTier,
          aiProvider,
          customApiKey: customAiKey.trim() || undefined,
          availableCategories: topicOptions.map((t) => t.name),
          availableGrades: gradeOptions.map((g) => g.name),
          availableFormats: formatOptions.map((f) => f.name),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'AI ingestion failed.');
      }

      const parsed: any[] = data.resources || [];
      if (parsed.length === 0) {
        onToast('No resources could be extracted. Please check the input.');
      } else {
        const newItems: CustomResourceRecord[] = parsed.map((item, idx) => {
          const itemTitle = item.title || `Math Resource ${idx + 1}`;
          const itemGrade = item.grade || targetGrade;
          const itemTopic = item.topic || topicOptions[0]?.name || 'General Mathematics';
          const itemFormat = item.format || 'Handcrafted Notes (PDF)';
          const itemTier = item.tier === 'pro' ? 'pro' : 'free';
          const autoThumb = generateDocumentCoverThumbnail(itemTitle, {
            title: itemTitle,
            grade: itemGrade,
            topic: itemTopic,
            format: itemFormat,
            tier: itemTier,
          });

          return {
            id: `res-${Date.now()}-${idx}`,
            title: itemTitle,
            grade: itemGrade,
            topic: itemTopic,
            format: itemFormat,
            tier: itemTier,
            downloadUrl: item.downloadUrl || undefined,
            imageUrl: autoThumb,
            thumbnailUrl: autoThumb,
            fileType: item.youtubeId ? 'video' : 'image',
            youtubeId: item.youtubeId || undefined,
            description: item.description || undefined,
            views: 0,
            downloads: 0,
            createdAt: new Date().toISOString(),
          };
        });

        setStagedResources((prev) => [...newItems, ...prev]);
        onToast(`🎉 AI successfully categorized ${newItems.length} items with auto-generated thumbnails! Review them below before publishing.`);
      }
    } catch (err: any) {
      console.error('Error in AI content ingest:', err);
      onToast(err?.message || 'Failed to ingest content with AI.');
    } finally {
      setIsProcessingAi(false);
    }
  };

  // Publish all staged items to Firestore & Local Catalog
  const handlePublishAllStaged = async () => {
    if (stagedResources.length === 0) {
      onToast('No items in the review queue.');
      return;
    }

    setIsPublishingBatch(true);
    try {
      const currentList = getLocalCustomResources();
      const updatedList = [...stagedResources, ...currentList];
      saveLocalCustomResources(updatedList);

      // Save each to Firestore
      for (const item of stagedResources) {
        try {
          await saveCustomResourceToFirestore(item);
        } catch (_e) {
          // Non-blocking cloud sync fallback
        }
      }

      onToast(`🚀 Successfully published ${stagedResources.length} resources to the live catalog!`);
      setStagedResources([]);
      onRefresh();
    } catch (err: any) {
      onToast('Error batch publishing resources.');
    } finally {
      setIsPublishingBatch(false);
    }
  };

  const removeStagedItem = (id: string) => {
    setStagedResources((prev) => prev.filter((item) => item.id !== id));
  };

  const updateStagedItem = (id: string, field: keyof CustomResourceRecord, value: any) => {
    setStagedResources((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleCancelEdit = () => {
    setEditingResourceId(null);
    setTitle('');
    setDownloadUrl('');
    setImageUrl('');
    setYoutubeId('');
    setFacebookVideoUrl('');
    setEmbedHtml('');
    setDescription('');
  };

  const handleEditCustom = (res: CustomResourceRecord) => {
    setEditingResourceId(res.id);
    setTitle(res.title || '');
    setGrade(res.grade || gradeOptions[0]?.name || 'Class 10');
    setTopic(res.topic || topicOptions[0]?.name || 'Polynomials');
    setFormat(res.format || formatOptions[0]?.name || 'Formula Sheets (1-Pager)');
    setTier(res.tier || 'free');
    setDownloadUrl(res.downloadUrl || '');
    setImageUrl(res.imageUrl || '');
    setYoutubeId(res.youtubeId || '');
    setFacebookVideoUrl(res.facebookVideoUrl || '');
    setEmbedHtml(res.embedHtml || '');
    setDescription(res.description || '');
    setViewTab('manual');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onToast(`Editing "${res.title}". Make changes and click Update.`);
  };

  const handleDuplicateCustom = async (res: CustomResourceRecord) => {
    try {
      const newId = `res-${Date.now()}`;
      const duplicatePayload: CustomResourceRecord = {
        ...res,
        id: newId,
        title: `${res.title} (Copy)`,
        views: 0,
        downloads: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const currentList = getLocalCustomResources();
      const updatedList = [duplicatePayload, ...currentList];
      saveLocalCustomResources(updatedList);

      try {
        await saveCustomResourceToFirestore(duplicatePayload);
      } catch (_cloudErr) {
        // Non-blocking cloud sync fallback
      }

      onToast(`🎉 Duplicated "${res.title}" successfully!`);
      onRefresh();
    } catch (err) {
      onToast('Failed to duplicate resource.');
    }
  };

  // Single Manual Form Submit (Create or Update)
  const handlePublishContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onToast('⚠️ Please enter a title for this learning material.');
      return;
    }

    setIsPublishing(true);
    try {
      const isEditing = Boolean(editingResourceId);
      const targetId = editingResourceId || `res-${Date.now()}`;

      let resolvedYt = youtubeId.trim() || undefined;
      let resolvedFb = facebookVideoUrl.trim() || undefined;
      let effectiveFormat = format;

      // Auto-detect format if a video link was provided
      if (resolvedFb || resolvedYt || embedHtml.trim()) {
        if (effectiveFormat !== 'Video Lessons') {
          effectiveFormat = 'Video Lessons';
        }
      }

      const existingRecord = isEditing ? getLocalCustomResources().find((r) => r.id === targetId) : null;

      const effectiveTitle = title.trim();
      const effectiveThumb = imageUrl.trim() || generateDocumentCoverThumbnail(effectiveTitle || 'Mathematics Study Kit', {
        title: effectiveTitle || 'Mathematics Revision Notes',
        grade,
        topic,
        format: effectiveFormat,
        tier,
      });

      const payload: CustomResourceRecord = {
        id: targetId,
        title: effectiveTitle,
        grade,
        topic,
        format: effectiveFormat,
        tier,
        downloadUrl: downloadUrl.trim() || undefined,
        imageUrl: effectiveThumb,
        thumbnailUrl: effectiveThumb,
        fileType: (resolvedFb || resolvedYt || embedHtml.trim()) ? 'video' : effectiveThumb ? 'image' : 'file',
        youtubeId: resolvedYt,
        facebookVideoUrl: resolvedFb,
        videoPlatform: resolvedFb ? 'facebook' : resolvedYt ? 'youtube' : undefined,
        embedHtml: embedHtml.trim() || undefined,
        description: description.trim() || undefined,
        views: existingRecord?.views || 0,
        downloads: existingRecord?.downloads || 0,
        createdAt: existingRecord?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const currentList = getLocalCustomResources();
      const updatedList = isEditing
        ? currentList.map((r) => (r.id === targetId ? payload : r))
        : [payload, ...currentList.filter((r) => r.id !== targetId)];
      saveLocalCustomResources(updatedList);

      try {
        await saveCustomResourceToFirestore(payload);
      } catch (_cloudErr) {
        // Non-blocking cloud sync fallback
      }

      onToast(isEditing ? `✅ Updated "${title}" successfully!` : `🎉 Published "${title}" successfully! Live in website catalog.`);
      handleCancelEdit();
      setViewTab('catalog');
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
      const currentList = getLocalCustomResources();
      const updatedList = currentList.filter((r) => r.id !== id);
      saveLocalCustomResources(updatedList);

      try {
        await deleteCustomResourceFromFirestore(id);
      } catch (_cloudErr) {
        // Non-blocking cloud sync fallback
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
      {/* Top Mode Header Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewTab('catalog')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              viewTab === 'catalog'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            <span>Uploaded Content ({customResources.length})</span>
          </button>

          <button
            onClick={() => {
              if (!editingResourceId) handleCancelEdit();
              setViewTab('manual');
            }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              viewTab === 'manual'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {editingResourceId ? 'edit' : 'add_circle'}
            </span>
            <span>{editingResourceId ? 'Edit Material' : '+ Upload Material'}</span>
          </button>

          <button
            onClick={() => setViewTab('ai_ingest')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              viewTab === 'ai_ingest'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            <span>AI Bulk Ingest (Excel / Drive)</span>
            <span className="bg-amber-400 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
              Gemini
            </span>
          </button>
        </div>

        {stagedResources.length > 0 && (
          <span className="text-xs font-bold text-amber-300 bg-amber-950/80 border border-amber-700/50 px-3 py-1 rounded-xl shrink-0">
            {stagedResources.length} items in review queue
          </span>
        )}
      </div>

      {/* ==============================================================
          TAB 1: AI AUTOMATED INGESTION ENGINE
          ============================================================== */}
      {viewTab === 'ai_ingest' && (
        <div className="space-y-6">
          {/* Ingest Mode Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[22px]">psychology</span>
                  <span>AI Automated Content Ingest &amp; Auto-Categorization</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Import spreadsheets, Google Drive links, Google Sheets, or enter a syllabus topic. Gemini 3.8 Flash automatically extracts titles, classifies them into the correct grade and subject category, generates descriptions, and prepares ready-to-publish assets.
                </p>
              </div>

              <button
                onClick={handleDownloadCsvTemplate}
                className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-2 rounded-xl border border-emerald-200 transition-colors cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[17px]">file_download</span>
                <span>Download Excel/CSV Template</span>
              </button>
            </div>

            {/* AI Model / Engine Selector (Gemini / Claude / ChatGPT) */}
            <div className="mb-5 p-3.5 bg-slate-900 rounded-2xl border border-slate-800 text-white space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-400 text-[20px]">smart_toy</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    AI Auto-Categorization Engine:
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowKeyField(!showKeyField)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer flex items-center gap-1 self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-[15px]">key</span>
                  <span>{showKeyField ? 'Hide API Key Settings' : 'Custom API Key (Optional)'}</span>
                </button>
              </div>

              {/* Engine Toggle Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAiProvider('gemini')}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left ${
                    aiProvider === 'gemini'
                      ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-300 shrink-0"></span>
                  <div className="min-w-0">
                    <div className="font-extrabold text-[12px] truncate">Google Gemini</div>
                    <div className="text-[10px] opacity-80 truncate">Gemini 3.8 Flash (Built-in)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAiProvider('openai')}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left ${
                    aiProvider === 'openai'
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 shrink-0"></span>
                  <div className="min-w-0">
                    <div className="font-extrabold text-[12px] truncate">OpenAI ChatGPT</div>
                    <div className="text-[10px] opacity-80 truncate">GPT-4o JSON Mode</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAiProvider('claude')}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left ${
                    aiProvider === 'claude'
                      ? 'bg-amber-600 border-amber-400 text-white shadow-md'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-300 shrink-0"></span>
                  <div className="min-w-0">
                    <div className="font-extrabold text-[12px] truncate">Anthropic Claude</div>
                    <div className="text-[10px] opacity-80 truncate">Claude 3.5 Sonnet</div>
                  </div>
                </button>
              </div>

              {/* Optional Custom API Key Field */}
              {showKeyField && (
                <div className="pt-2 border-t border-slate-800 space-y-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Custom API Key for {aiProvider === 'gemini' ? 'Google Gemini' : aiProvider === 'openai' ? 'OpenAI / ChatGPT' : 'Anthropic Claude'}:</span>
                    {customAiKey && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomAiKey('');
                          localStorage.removeItem('admin_custom_ai_key');
                          onToast('Custom API key cleared. Using server defaults.');
                        }}
                        className="text-red-400 hover:underline cursor-pointer"
                      >
                        Clear Key
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={customAiKey}
                    onChange={(e) => {
                      setCustomAiKey(e.target.value);
                      try {
                        localStorage.setItem('admin_custom_ai_key', e.target.value);
                      } catch (err) {
                        // ignore
                      }
                    }}
                    placeholder={`Enter your ${aiProvider === 'gemini' ? 'AI Studio Gemini' : aiProvider === 'openai' ? 'sk-...' : 'sk-ant-...'} key (leave blank to use system key)`}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-emerald-400 focus:border-blue-500 outline-none"
                  />
                  <div className="text-[10px] text-slate-500">
                    Stored securely in your admin browser session. If left empty, default high-speed Gemini 3.8 Flash model runs all categorization.
                  </div>
                </div>
              )}
            </div>

            {/* Ingest Sub-mode Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
              {[
                { id: 'spreadsheet', label: 'Excel / CSV Upload', icon: 'table_view' },
                { id: 'google_drive', label: 'Google Drive Link', icon: 'add_to_drive' },
                { id: 'google_sheets', label: 'Google Sheets Live', icon: 'grid_on' },
                { id: 'ai_syllabus', label: 'AI Syllabus Generator', icon: 'auto_stories' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setIngestMode(m.id as IngestMode)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    ingestMode === m.id
                      ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-2xs font-extrabold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Ingestion Sub-mode Body */}
            <div className="space-y-4">
              {/* Option 1: Excel / CSV File or Text */}
              {ingestMode === 'spreadsheet' && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-blue-50/70 p-3 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 text-xs text-blue-900 font-semibold">
                      <span className="material-symbols-outlined text-[20px] text-blue-600">upload_file</span>
                      <span>Upload your prepared spreadsheet or paste raw CSV/TSV table rows below:</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".csv,.tsv,.txt"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 bg-white hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-200 transition-colors cursor-pointer shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">folder_open</span>
                        <span>Select File (.csv)</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={6}
                    value={csvInput}
                    onChange={(e) => setCsvInput(e.target.value)}
                    placeholder="Paste CSV rows here, for example:
Title,Grade,Topic,Format,Tier,DownloadUrl
Class 10 Arithmetic Progressions Notes,10th,AP,Handcrafted Notes,free,https://drive.google.com/file/d/123/view
Class 9 Polynomials Exemplar Solutions,9th,Polynomials,NCERT Solutions,pro,https://drive.google.com/file/d/456/view
Real Numbers 2-Minute Formula Sheet,Class 10,Real Numbers,Formula Sheet,free,https://drive.google.com/file/d/789/view"
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              {/* Option 2: Google Drive Link Ingestion */}
              {ingestMode === 'google_drive' && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-900 leading-relaxed">
                    Paste any public/shared <strong>Google Drive file or folder URL</strong> (e.g., PDF notes, cheat sheets, exemplar doc). AI will automatically inspect the filename and context, generate curriculum metadata, convert it to a viewable preview link, and assign it to the proper Class and Category.
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Google Drive Shared URL:
                    </label>
                    <input
                      type="url"
                      value={googleDriveUrl}
                      onChange={(e) => setGoogleDriveUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/1A2B3C.../view?usp=sharing"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Option 3: Google Sheets Live Sync */}
              {ingestMode === 'google_sheets' && (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 text-xs text-emerald-950 leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <strong>Live Google Sheets Connection:</strong> Paste your published or shared Google Sheet URL. AI will ingest all rows directly into the categorization pipeline.
                      <div className="text-[11px] text-emerald-700 mt-0.5">
                        Tip: Make sure the sheet share setting is "Anyone with the link can view".
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowWebhookDocs(!showWebhookDocs)}
                      className="text-xs font-bold text-blue-700 hover:underline cursor-pointer whitespace-nowrap"
                    >
                      {showWebhookDocs ? 'Hide Webhook API' : '⚡ View Google Apps Script Webhook'}
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Google Sheet URL:
                    </label>
                    <input
                      type="url"
                      value={googleSheetUrl}
                      onChange={(e) => setGoogleSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/1X-Y-Z.../edit?usp=sharing"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                    />
                  </div>

                  {/* Webhook & Google Apps Script Snippet */}
                  {showWebhookDocs && (
                    <div className="bg-slate-950 text-slate-200 p-4 rounded-2xl border border-slate-800 text-xs space-y-2 animate-fadeIn font-mono">
                      <div className="text-amber-400 font-bold flex items-center justify-between">
                        <span>Google Apps Script Auto-Sync Snippet</span>
                        <span className="text-[11px] text-slate-400">Paste in Extensions &gt; Apps Script</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans">
                        Whenever your team edits or adds rows to your master Google Sheet, this script sends the rows to the AI catalog endpoint automatically:
                      </p>
                      <pre className="bg-slate-900 p-3 rounded-xl overflow-x-auto text-[11px] text-blue-300">
{`function sendRowToMathsApp(e) {
  var url = "${window.location.origin}/api/content/publish-batch";
  var rowData = e.range.getValues()[0];
  var payload = {
    resources: [{
      title: rowData[0],
      grade: rowData[1] || "Class 10",
      topic: rowData[2] || "General Mathematics",
      format: rowData[3] || "Handcrafted Notes (PDF)",
      tier: rowData[4] || "free",
      downloadUrl: rowData[5] || ""
    }]
  };
  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  });
}`}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Option 4: AI Syllabus Curriculum Generator */}
              {ingestMode === 'ai_syllabus' && (
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 text-xs text-purple-950 leading-relaxed">
                    <strong>Autonomous Curriculum Builder:</strong> Enter a textbook chapter, topic, or syllabus requirement. Gemini AI will generate 3 to 5 curriculum units (Notes, 1-Pager Cheat Sheet, NCERT Walkthrough, and Practice Sheet) with curriculum-aligned descriptions, auto-categorized into the right grade.
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Chapter / Topic Outline:
                    </label>
                    <input
                      type="text"
                      value={syllabusPrompt}
                      onChange={(e) => setSyllabusPrompt(e.target.value)}
                      placeholder="e.g. NCERT Class 10 Circles: Tangent theorems, lengths of tangents from external point, proofs and exemplar problems"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Target Grade and Default Tier Hints */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Target Grade Syllabus (Default Hint):
                  </label>
                  <select
                    value={targetGrade}
                    onChange={(e) => setTargetGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    {gradeOptions.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Default Access Tier:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDefaultTier('free')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        defaultTier === 'free'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-300'
                      }`}
                    >
                      Free Access
                    </button>
                    <button
                      type="button"
                      onClick={() => setDefaultTier('pro')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        defaultTier === 'pro'
                          ? 'bg-amber-500 text-slate-950 border-amber-500'
                          : 'bg-slate-50 text-slate-700 border-slate-300'
                      }`}
                    >
                      Pro Pass Only
                    </button>
                  </div>
                </div>
              </div>

              {/* Run AI Categorization Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleRunAiIngest}
                  disabled={isProcessingAi}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessingAi ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Gemini AI is analyzing &amp; categorizing...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[19px]">auto_awesome</span>
                      <span>Run AI Categorization &amp; Stage Resources</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ==============================================================
              STAGING & REVIEW QUEUE (Approve before live website sync)
              ============================================================== */}
          {stagedResources.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-blue-500 p-5 sm:p-6 shadow-lg animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 mb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Ready for Approval ({stagedResources.length} Items)</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Review Staged Content &amp; Categories
                  </h3>
                  <p className="text-xs text-slate-500">
                    AI has automatically matched the appropriate Grade, Subject Category, and Format. You can edit any field before pushing to the live website catalog.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setStagedResources([])}
                    className="text-xs font-bold text-slate-500 hover:text-red-600 px-3 py-2 cursor-pointer"
                  >
                    Clear Queue
                  </button>

                  <button
                    onClick={handlePublishAllStaged}
                    disabled={isPublishingBatch}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isPublishingBatch ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Publishing to Catalog...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">publish</span>
                        <span>Approve &amp; Publish All ({stagedResources.length})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Staged Cards List */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {stagedResources.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateStagedItem(item.id, 'title', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                        />
                      </div>

                      <button
                        onClick={() => removeStagedItem(item.id)}
                        className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                        title="Remove from queue"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {/* Grade Selector */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block mb-0.5">Grade:</span>
                        <select
                          value={item.grade}
                          onChange={(e) => updateStagedItem(item.id, 'grade', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800"
                        >
                          {gradeOptions.map((g) => (
                            <option key={g.id} value={g.name}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Topic Selector */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block mb-0.5">Category Topic:</span>
                        <select
                          value={item.topic}
                          onChange={(e) => updateStagedItem(item.id, 'topic', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800"
                        >
                          {topicOptions.map((t) => (
                            <option key={t.id} value={t.name}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Format Selector */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block mb-0.5">Format:</span>
                        <select
                          value={item.format}
                          onChange={(e) => updateStagedItem(item.id, 'format', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800"
                        >
                          {formatOptions.map((f) => (
                            <option key={f.id} value={f.name}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Tier Toggle */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block mb-0.5">Access Tier:</span>
                        <select
                          value={item.tier}
                          onChange={(e) => updateStagedItem(item.id, 'tier', e.target.value as any)}
                          className={`w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold ${
                            item.tier === 'pro' ? 'text-amber-700' : 'text-emerald-700'
                          }`}
                        >
                          <option value="free">Free Download</option>
                          <option value="pro">Pro Pass Only</option>
                        </select>
                      </div>
                    </div>

                    {/* Description preview */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">Desc:</span>
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(e) => updateStagedItem(item.id, 'description', e.target.value)}
                        placeholder="Add student description..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-600 outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==============================================================
          TAB 2: MANUAL SINGLE UPLOAD FORM
          ============================================================== */}
      {viewTab === 'manual' && (
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTier('free')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      tier === 'free'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    Free Download
                  </button>
                  <button
                    type="button"
                    onClick={() => setTier('pro')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      tier === 'pro'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    Pro Pass Only
                  </button>
                </div>
              </div>

              {/* Direct Video Embed (YouTube & Facebook) */}
              <div className="md:col-span-2 p-3.5 bg-slate-900 rounded-2xl border border-slate-800 text-white space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-amber-400">smart_display</span>
                    <div>
                      <h4 className="text-xs font-extrabold text-white">
                        Direct Video Embed (YouTube &amp; Facebook)
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Plays seamlessly in the Embedded Video Player under the "Video Lessons" category.
                      </p>
                    </div>
                  </div>

                  {/* Video Type Tabs */}
                  <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setVideoSourceType('youtube')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        videoSourceType === 'youtube'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <YouTubeIcon size={14} />
                      <span>YouTube</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoSourceType('facebook')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        videoSourceType === 'facebook'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <FacebookIcon size={14} />
                      <span>Facebook</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoSourceType('iframe')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        videoSourceType === 'iframe'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">code</span>
                      <span>Iframe Code</span>
                    </button>
                  </div>
                </div>

                {videoSourceType === 'youtube' && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      YouTube Video URL or Video ID:
                    </label>
                    <input
                      type="text"
                      value={youtubeId}
                      onChange={(e) => {
                        setYoutubeId(e.target.value);
                        if (format !== 'Video Lessons') setFormat('Video Lessons');
                      }}
                      placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/... or ID"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none font-mono text-slate-100"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Supports standard videos, YouTube Shorts, and direct IDs. Auto-assigns to the <strong>Video Lessons</strong> category.
                    </p>
                  </div>
                )}

                {videoSourceType === 'facebook' && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Facebook Video / Reel / Watch URL:
                    </label>
                    <input
                      type="text"
                      value={facebookVideoUrl}
                      onChange={(e) => {
                        setFacebookVideoUrl(e.target.value);
                        if (format !== 'Video Lessons') setFormat('Video Lessons');
                      }}
                      placeholder="https://www.facebook.com/watch/?v=... or https://www.facebook.com/reel/..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-slate-100"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Embedded directly using Facebook's official video player plugin. Auto-assigns to <strong>Video Lessons</strong> category.
                    </p>
                  </div>
                )}

                {videoSourceType === 'iframe' && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Raw Iframe Embed Snippet:
                    </label>
                    <textarea
                      rows={2}
                      value={embedHtml}
                      onChange={(e) => {
                        setEmbedHtml(e.target.value);
                        if (format !== 'Video Lessons') setFormat('Video Lessons');
                      }}
                      placeholder="<iframe src='...' width='560' height='315' allowfullscreen></iframe>"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono text-slate-100"
                    />
                  </div>
                )}

                {/* Live Preview if video link is present */}
                {(youtubeId || facebookVideoUrl || embedHtml) && (
                  <div className="p-2.5 bg-black/50 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                      <span>Live Embedded Player Preview:</span>
                      <span className="text-[10px] text-emerald-400">✓ Ready to Embed</span>
                    </div>
                    <div className="aspect-video w-full max-h-48 rounded-lg overflow-hidden bg-black flex items-center justify-center">
                      {videoSourceType === 'youtube' && youtubeId && (
                        <iframe
                          src={`https://www.youtube.com/embed/${youtubeId.includes('v=') ? youtubeId.split('v=')[1]?.split('&')[0] : youtubeId.includes('youtu.be/') ? youtubeId.split('youtu.be/')[1]?.split('?')[0] : youtubeId}?rel=0`}
                          title="YouTube Preview"
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      )}
                      {videoSourceType === 'facebook' && facebookVideoUrl && (
                        <iframe
                          src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(facebookVideoUrl)}&show_text=false`}
                          title="Facebook Preview"
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      )}
                      {videoSourceType === 'iframe' && embedHtml && (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          dangerouslySetInnerHTML={{ __html: embedHtml }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Media Attachments: File / Image / Video */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-blue-600 text-[18px]">attachment</span>
                  <span>Learning Media Attachments (Choose any: File, Image, or Video)</span>
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Automatic Preview Generated</span>
              </div>

              {/* 1. File / PDF Attachment */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  📄 Document / PDF File (URL or Direct Upload):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={downloadUrl}
                    onChange={(e) => setDownloadUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../view or direct PDF URL"
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-slate-800"
                  />
                  <label className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    <span>Browse File</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,text/plain"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = async (ev) => {
                            const res = ev.target?.result as string;
                            setDownloadUrl(res);
                            const effectiveTitle = title.trim() || file.name.replace(/\.[^/.]+$/, '');
                            if (!title) setTitle(effectiveTitle);

                            // Auto-generate thumbnail from uploaded content file!
                            try {
                              const autoThumb = await generateContentThumbnail(file, {
                                title: effectiveTitle,
                                grade,
                                topic,
                                format,
                                tier,
                              });
                              if (autoThumb) {
                                setImageUrl(autoThumb);
                              }
                              onToast(`Attached file "${file.name}" & auto-generated content thumbnail!`);
                            } catch {
                              onToast(`Attached file "${file.name}" (${(file.size / 1024).toFixed(0)} KB)`);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* 2. Image / Diagram Attachment & Auto-Generated Thumbnail */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">
                    🖼️ Content Thumbnail / Image (Auto-Generated from file):
                  </label>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Auto-generated on file upload
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... or auto-generated from uploaded file"
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const autoThumb = generateDocumentCoverThumbnail(title || 'Mathematics Study Kit', {
                        title: title || 'Mathematics Revision Notes',
                        grade,
                        topic,
                        format,
                        tier,
                      });
                      setImageUrl(autoThumb);
                      onToast('⚡ Auto-generated rich document thumbnail from content!');
                    }}
                    className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-1"
                    title="Auto-generate or refresh thumbnail based on title, grade, and topic"
                  >
                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                    <span>Auto-Generate</span>
                  </button>
                  <label className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">image</span>
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const thumb = await generateContentThumbnail(file, {
                              title,
                              grade,
                              topic,
                              format,
                              tier,
                            });
                            setImageUrl(thumb);
                            onToast(`Attached image & generated thumbnail: "${file.name}"`);
                          } catch {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setImageUrl(ev.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Live Preview Inside Form if File, Image, or Video is present */}
              {(imageUrl || downloadUrl || youtubeId || facebookVideoUrl || embedHtml) && (
                <div className="p-3 bg-white rounded-xl border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-900 border-b border-blue-100 pb-1.5">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-blue-600">visibility</span>
                      <span>Live Automatic Front-End Preview:</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      ✓ Ready for Student View
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Image Preview */}
                    {imageUrl && (
                      <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-900 aspect-video flex items-center justify-center relative group">
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded font-bold">
                          Image Asset Preview
                        </span>
                      </div>
                    )}

                    {/* Video Preview */}
                    {(youtubeId || facebookVideoUrl || embedHtml) && (
                      <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-950 aspect-video flex items-center justify-center relative">
                        {youtubeId ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${youtubeId.includes('v=') ? youtubeId.split('v=')[1]?.split('&')[0] : youtubeId.includes('youtu.be/') ? youtubeId.split('youtu.be/')[1]?.split('?')[0] : youtubeId}?rel=0`}
                            title="YouTube Preview"
                            className="w-full h-full border-0"
                            allowFullScreen
                          />
                        ) : facebookVideoUrl ? (
                          <iframe
                            src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(facebookVideoUrl)}&show_text=false`}
                            title="Facebook Preview"
                            className="w-full h-full border-0"
                            allowFullScreen
                          />
                        ) : (
                          <div dangerouslySetInnerHTML={{ __html: embedHtml }} className="w-full h-full flex items-center justify-center" />
                        )}
                      </div>
                    )}

                    {/* File / PDF Document Card Preview */}
                    {downloadUrl && !imageUrl && !youtubeId && (
                      <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[22px]">description</span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 truncate">
                            {title || 'Document File Attached'}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            {downloadUrl.startsWith('data:') ? 'Embedded Base64 Data' : downloadUrl}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Short Description / Key Concepts:
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of theorems, shortcuts, or exercises covered..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              {editingResourceId ? (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Cancel Edit
                </button>
              ) : (
                <div></div>
              )}

              <button
                type="submit"
                disabled={isPublishing}
                className="inline-flex items-center gap-2 bg-[#004ac6] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {editingResourceId ? 'save' : 'publish'}
                </span>
                <span>
                  {isPublishing
                    ? 'Saving...'
                    : editingResourceId
                    ? 'Save Changes'
                    : 'Publish to Student Portal'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==============================================================
          TAB 3: MANAGE LIVE CATALOG & TIER OVERRIDES
          ============================================================== */}
      {viewTab === 'catalog' && (
        <div className="space-y-6">
          {/* Custom Uploaded Resources */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">inventory_2</span>
                  <span>Custom Uploaded Study Materials ({customResources.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Manage, edit, duplicate, or remove custom formula sheets, notes, images, and video lessons.
                </p>
              </div>

              <button
                onClick={() => {
                  handleCancelEdit();
                  setViewTab('manual');
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>+ Upload New Material</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search by title, topic, or format..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800"
                  />
                  <span className="material-symbols-outlined absolute left-2.5 top-2 text-[15px] text-slate-400">
                    search
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={catalogGrade}
                  onChange={(e) => setCatalogGrade(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
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
                  value={catalogTier}
                  onChange={(e) => setCatalogTier(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="All">All Tiers</option>
                  <option value="free">Free Access</option>
                  <option value="pro">Pro Pass</option>
                </select>
              </div>
            </div>

            {/* Resources List / Table */}
            {(() => {
              const localList = getLocalCustomResources();
              const map = new Map<string, CustomResourceRecord>();
              localList.forEach((r) => map.set(r.id, r));
              customResources.forEach((r) => map.set(r.id, r));
              const allCustom = Array.from(map.values());

              const filtered = allCustom.filter((r) => {
                const matchSearch =
                  r.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                  r.topic.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                  r.format.toLowerCase().includes(catalogSearch.toLowerCase());
                const matchGrade = catalogGrade === 'All' || r.grade === catalogGrade;
                const matchTier = catalogTier === 'All' || r.tier === catalogTier.toLowerCase();
                return matchSearch && matchGrade && matchTier;
              });

              if (filtered.length === 0) {
                return (
                  <div className="text-center py-12 px-4 text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <span className="material-symbols-outlined text-[36px] text-slate-400 block mx-auto">
                      folder_open
                    </span>
                    <p className="font-bold text-slate-700">No uploaded materials found</p>
                    <p className="text-slate-400 max-w-sm mx-auto">
                      {allCustom.length === 0
                        ? 'You haven\'t uploaded any custom study sheets or videos yet.'
                        : 'No resources match your search filters.'}
                    </p>
                    <button
                      onClick={() => {
                        handleCancelEdit();
                        setViewTab('manual');
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      <span>+ Upload First Study Material</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="divide-y divide-slate-100">
                  {filtered.map((res) => {
                    const hasVideo = !!res.youtubeId || !!res.facebookVideoUrl || !!res.videoUrl || !!res.embedHtml;
                    const hasImage = !!res.imageUrl;
                    const hasFile = !!res.downloadUrl;

                    return (
                      <div
                        key={res.id}
                        className="py-3.5 px-3 hover:bg-slate-50/80 rounded-xl transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        {/* Left: Thumbnail & Details */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Thumbnail / Media icon */}
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden relative group">
                            {hasImage ? (
                              <img src={res.imageUrl} alt={res.title} className="w-full h-full object-cover" />
                            ) : hasVideo ? (
                              <div className="w-full h-full bg-slate-900 flex items-center justify-center text-red-400">
                                <span className="material-symbols-outlined text-[22px]">smart_display</span>
                              </div>
                            ) : (
                              <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <span className="material-symbols-outlined text-[22px]">description</span>
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-900 text-sm truncate flex items-center gap-2">
                              <span>{res.title}</span>
                              {res.tier === 'pro' ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-900 uppercase">
                                  PRO
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-900 uppercase">
                                  FREE
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-blue-700">{res.grade}</span>
                              <span>•</span>
                              <span>{res.topic}</span>
                              <span>•</span>
                              <span className="text-slate-400 font-mono">{res.format}</span>
                              {hasVideo && (
                                <span className="text-red-600 font-bold bg-red-50 px-1.5 py-0.2 rounded text-[10px]">
                                  Video Lesson
                                </span>
                              )}
                              {hasImage && (
                                <span className="text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded text-[10px]">
                                  Image Asset
                                </span>
                              )}
                              {hasFile && (
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded text-[10px]">
                                  Direct File
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions (Edit, Duplicate, Preview, Delete) */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          {/* Preview button */}
                          <button
                            type="button"
                            onClick={() => setPreviewModalResource(res)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                            title="Preview how students see this"
                          >
                            <span className="material-symbols-outlined text-[17px]">visibility</span>
                            <span className="hidden md:inline">Preview</span>
                          </button>

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleEditCustom(res)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                            title="Edit this learning material"
                          >
                            <span className="material-symbols-outlined text-[17px]">edit</span>
                            <span className="hidden md:inline">Edit</span>
                          </button>

                          {/* Duplicate button */}
                          <button
                            type="button"
                            onClick={() => handleDuplicateCustom(res)}
                            className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                            title="Create a duplicate copy of this material"
                          >
                            <span className="material-symbols-outlined text-[17px]">content_copy</span>
                            <span className="hidden md:inline">Duplicate</span>
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteCustom(res.id, res.title)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                            title="Delete this material permanently"
                          >
                            <span className="material-symbols-outlined text-[17px]">delete</span>
                            <span className="hidden md:inline">Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Core Curriculum Tier Overrides */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Core Library Access Tier Toggles
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Toggle any core study material between Free Access and Pro Subscription pass. Changes reflect immediately on student catalog.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {MATH_RESOURCES.slice(0, 9).map((res) => {
                const currentTier = resourceTierOverrides[res.id] || res.tier;
                return (
                  <div
                    key={res.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{res.title}</div>
                      <div className="text-[10px] text-slate-500">{res.grade} • {res.topic}</div>
                    </div>

                    <button
                      onClick={() => toggleCoreResourceTier(res.id, res.tier)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer transition-colors shrink-0 ${
                        currentTier === 'pro'
                          ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                          : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                      }`}
                    >
                      {currentTier.toUpperCase()}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quick Preview Modal */}
      {previewModalResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">visibility</span>
                <h4 className="font-bold text-base text-slate-900">Student Card Preview</h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalResource(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Front-End Block Preview */}
            <div className="bg-white rounded-2xl p-5 border-2 border-blue-200 shadow-md space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                  {previewModalResource.tier.toUpperCase()}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800">
                  {previewModalResource.grade}
                </span>
              </div>

              {/* Automatic preview if image */}
              {previewModalResource.imageUrl && (
                <div className="rounded-xl overflow-hidden aspect-video bg-slate-900">
                  <img src={previewModalResource.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Automatic preview if video */}
              {(previewModalResource.youtubeId || previewModalResource.facebookVideoUrl || previewModalResource.videoUrl) && (
                <div className="rounded-xl overflow-hidden aspect-video bg-black flex items-center justify-center relative">
                  {previewModalResource.youtubeId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${previewModalResource.youtubeId.includes('v=') ? previewModalResource.youtubeId.split('v=')[1]?.split('&')[0] : previewModalResource.youtubeId.includes('youtu.be/') ? previewModalResource.youtubeId.split('youtu.be/')[1]?.split('?')[0] : previewModalResource.youtubeId}?rel=0`}
                      title="YouTube"
                      className="w-full h-full border-0"
                      allowFullScreen
                    />
                  ) : (
                    <span className="text-white text-xs font-bold">Video Player</span>
                  )}
                </div>
              )}

              {/* Automatic preview if file */}
              {previewModalResource.downloadUrl && !previewModalResource.imageUrl && !previewModalResource.youtubeId && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3">
                  <span className="material-symbols-outlined text-blue-600 text-[28px]">description</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-800 block">PDF / Document File</span>
                    <span className="text-[10px] text-slate-500 font-mono truncate block">
                      {previewModalResource.downloadUrl}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase block">
                  {previewModalResource.topic} • {previewModalResource.format}
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">{previewModalResource.title}</h4>
                {previewModalResource.description && (
                  <p className="text-xs text-slate-500 mt-1">{previewModalResource.description}</p>
                )}
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">file_download</span>
                  <span>Download Learning Material</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleEditCustom(previewModalResource);
                  setPreviewModalResource(null);
                }}
                className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold cursor-pointer"
              >
                Edit Material
              </button>
              <button
                type="button"
                onClick={() => setPreviewModalResource(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
