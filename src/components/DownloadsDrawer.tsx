import React from 'react';

export interface DownloadedItem {
  id: string;
  title: string;
  size: string;
  downloadedAt: string;
}

interface DownloadsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: DownloadedItem[];
  onOpenItem: (title: string) => void;
  onClearDownloads: () => void;
}

export const DownloadsDrawer: React.FC<DownloadsDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onOpenItem,
  onClearDownloads,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-slideLeft">
        {/* Header */}
        <div className="p-6 bg-[#f0f3ff] border-b border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#6ffbbe] text-[#002113] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">download</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 leading-tight">My Offline Vault</h3>
              <span className="text-xs text-gray-500">{items.length} materials saved for offline study</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer transition-colors shadow-2xs"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* List of downloaded resources */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {items.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-3">
              <span className="material-symbols-outlined text-[48px] text-gray-300">
                cloud_download
              </span>
              <p className="text-sm font-semibold text-gray-600">No downloads saved yet</p>
              <p className="text-xs text-gray-400 max-w-xs">
                Click "Download PDF" or "Instant Download" on any cheat sheet in the catalog to read offline without internet!
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-[#f9f9ff] rounded-2xl p-4 border border-blue-100 hover:border-blue-300 transition-all shadow-2xs flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-blue-600 text-[24px] mt-0.5">
                      picture_as_pdf
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 leading-snug">{item.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                        <span>{item.size}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Offline Ready
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-100 mt-1">
                  <button
                    onClick={() => onOpenItem(item.title)}
                    className="flex-1 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">visibility</span>
                    <span>View Sheet</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer"
                    title="Print"
                  >
                    <span className="material-symbols-outlined text-[16px]">print</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 bg-[#f9f9ff] border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={onClearDownloads}
              className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
            >
              Clear all downloads
            </button>
            <span className="text-[11px] text-gray-400">Synced to Browser Cache</span>
          </div>
        )}
      </div>
    </div>
  );
};
