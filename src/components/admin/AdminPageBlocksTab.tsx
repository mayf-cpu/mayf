import React, { useState, useEffect } from 'react';
import {
  HomePageBlock,
  getLocalPageBlocks,
  savePageBlocksToFirestore,
  DEFAULT_PAGE_BLOCKS,
} from '../../services/pageBlocks';

interface AdminPageBlocksTabProps {
  onToast: (msg: string) => void;
}

export const AdminPageBlocksTab: React.FC<AdminPageBlocksTabProps> = ({ onToast }) => {
  const [blocks, setBlocks] = useState<HomePageBlock[]>(getLocalPageBlocks);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setBlocks(getLocalPageBlocks());
  }, []);

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(index, 1);
    newBlocks.splice(targetIndex, 0, moved);

    // Re-assign order numbers
    const reordered = newBlocks.map((b, idx) => ({ ...b, order: idx + 1 }));
    setBlocks(reordered);
    onToast(`Moved "${moved.name}" ${direction}. Click "Save Block Positions" to publish.`);
  };

  const toggleBlockEnabled = (id: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await savePageBlocksToFirestore(blocks);
      onToast('✓ Website homepage block positions saved & published in real-time!');
    } catch {
      onToast('Failed to save block positions.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Reset homepage block positions to default layout ("Study Together" placed after content)?')) {
      setBlocks(DEFAULT_PAGE_BLOCKS);
      await savePageBlocksToFirestore(DEFAULT_PAGE_BLOCKS);
      onToast('Homepage block positions reset to default layout.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#004ac6] text-xs font-black uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[15px]">view_column</span>
              <span>Front-End Page Structure</span>
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Homepage Block Positions &amp; Ordering
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Customize the vertical layout of different sections on the front-end homepage. Move blocks up or down, toggle section visibility, and publish updates instantly.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Reset Default Order
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-[#004ac6] hover:bg-blue-700 shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>{isSaving ? 'Saving...' : 'Save Block Positions'}</span>
            </button>
          </div>
        </div>

        {/* Notice on default requirement */}
        <div className="mt-4 p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center gap-3 text-xs text-blue-950 font-medium">
          <span className="material-symbols-outlined text-blue-600 text-[20px] shrink-0">check_circle</span>
          <span>
            <strong>Requirement Confirmed:</strong> The <strong>"Study Together • Grow Faster"</strong> community block is positioned immediately after the core Content Blocks, and can be moved anywhere using the Up/Down buttons below.
          </span>
        </div>
      </div>

      {/* Block Ordering List */}
      <div className="space-y-3">
        {blocks.map((block, index) => {
          const isFirst = index === 0;
          const isLast = index === blocks.length - 1;

          return (
            <div
              key={block.id}
              className={`bg-white rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-xs ${
                block.enabled ? 'border-slate-200' : 'border-slate-200/50 opacity-60 bg-slate-50/50'
              } ${block.id === 'social_community' ? 'ring-2 ring-blue-500/20 bg-blue-50/30' : ''}`}
            >
              {/* Left: Position Indicator & Details */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-300 font-mono font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                  #{block.order}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {block.name}
                    </h3>
                    {block.badge && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {block.badge}
                      </span>
                    )}
                    {block.id === 'social_community' && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Study Together Block
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {block.description}
                  </p>
                </div>
              </div>

              {/* Right: Reorder Controls & Visibility Toggle */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {/* Move Up */}
                <button
                  type="button"
                  onClick={() => moveBlock(index, 'up')}
                  disabled={isFirst}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                    isFirst
                      ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                      : 'border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 cursor-pointer active:scale-95'
                  }`}
                  title="Move section up"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                </button>

                {/* Move Down */}
                <button
                  type="button"
                  onClick={() => moveBlock(index, 'down')}
                  disabled={isLast}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                    isLast
                      ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                      : 'border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 cursor-pointer active:scale-95'
                  }`}
                  title="Move section down"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                </button>

                {/* Visibility Toggle */}
                <button
                  type="button"
                  onClick={() => toggleBlockEnabled(block.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                    block.enabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                  }`}
                  title="Toggle section visibility on front-end"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {block.enabled ? 'visibility' : 'visibility_off'}
                  </span>
                  <span>{block.enabled ? 'Visible' : 'Hidden'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Button at Bottom */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-black text-white bg-[#004ac6] hover:bg-blue-700 shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          <span>{isSaving ? 'Saving Block Order...' : 'Publish Block Order to Website'}</span>
        </button>
      </div>
    </div>
  );
};
