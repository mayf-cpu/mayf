import React, { useState } from 'react';
import {
  AdsGlobalConfig,
  AdPlacementLocation,
  AdPlacementConfig,
  saveAdsConfigLocally,
  saveAdsConfigToFirestore,
  DEFAULT_ADS_CONFIG,
} from '../../services/ads';
import { AdPlacement } from '../AdPlacement';

interface AdminAdsTabProps {
  adsConfig: AdsGlobalConfig;
  setAdsConfig: React.Dispatch<React.SetStateAction<AdsGlobalConfig>>;
  onToast: (msg: string) => void;
}

export const AdminAdsTab: React.FC<AdminAdsTabProps> = ({
  adsConfig,
  setAdsConfig,
  onToast,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPlacementKey, setSelectedPlacementKey] = useState<AdPlacementLocation>('home_hero_bottom');
  const [filterPage, setFilterPage] = useState<string>('all');

  const placementsList: AdPlacementConfig[] = Object.values(adsConfig.placements || {});

  const filteredPlacements = placementsList.filter((p) => {
    if (filterPage === 'all') return true;
    if (filterPage === 'home') return p.pageName.includes('Home') || p.pageName.includes('Catalog');
    if (filterPage === 'formula') return p.pageName.includes('Formula');
    if (filterPage === 'dashboard') return p.pageName.includes('Dashboard');
    if (filterPage === 'modal') return p.pageName.includes('Modal');
    if (filterPage === 'global') return p.pageName.includes('Global');
    return true;
  });

  const selectedPlacement = adsConfig.placements[selectedPlacementKey] || adsConfig.placements.home_hero_bottom;

  const handleUpdatePlacement = (updates: Partial<AdPlacementConfig>) => {
    setAdsConfig((prev) => ({
      ...prev,
      placements: {
        ...prev.placements,
        [selectedPlacementKey]: {
          ...prev.placements[selectedPlacementKey],
          ...updates,
        },
      },
    }));
  };

  const handleTogglePlacement = (key: AdPlacementLocation) => {
    setAdsConfig((prev) => ({
      ...prev,
      placements: {
        ...prev.placements,
        [key]: {
          ...prev.placements[key],
          enabled: !prev.placements[key].enabled,
        },
      },
    }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      saveAdsConfigLocally(adsConfig);
      await saveAdsConfigToFirestore(adsConfig);
      onToast('✅ AdSense configuration and placement settings saved & updated live!');
    } catch (err) {
      saveAdsConfigLocally(adsConfig);
      onToast('Saved locally in browser cache.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePopulateStandardSlots = () => {
    const pubId = adsConfig.adClient?.trim() || 'ca-pub-6461734149500000';
    const populated = JSON.parse(JSON.stringify(DEFAULT_ADS_CONFIG)) as AdsGlobalConfig;
    populated.adClient = pubId;
    populated.enabled = true;
    populated.testMode = true;
    setAdsConfig(populated);
    onToast('Standard high-converting AdSense slots generated for all pages!');
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all AdSense settings to default configuration?')) {
      setAdsConfig(DEFAULT_ADS_CONFIG);
      saveAdsConfigLocally(DEFAULT_ADS_CONFIG);
      onToast('AdSense settings reset to default.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-2xl">ads_click</span>
            <h3 className="text-base font-extrabold text-slate-800">
              Google AdSense &amp; Ad Placements Module
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Insert and manage high-CTR ad units across all pages with custom slots, responsive formats, and live preview.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handlePopulateStandardSlots}
            className="flex-1 sm:flex-initial px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-blue-200"
            title="Auto-fill tested slot IDs"
          >
            Auto-Fill Slots
          </button>
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex-1 sm:flex-initial px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            <span>{isSaving ? 'Saving...' : 'Save & Publish Ads'}</span>
          </button>
        </div>
      </div>

      {/* Global Master Settings */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Global AdSense Credentials &amp; Controls
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* 1. Global Enable Switch */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Master Ad Switch</span>
              <span className="text-[11px] text-slate-500">Enable or disable all ads globally</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={adsConfig.enabled}
                onChange={(e) => setAdsConfig({ ...adsConfig, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* 2. Test / Preview Mode Switch */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Preview / Test Mode</span>
              <span className="text-[11px] text-slate-500">Show visual mock containers</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={adsConfig.testMode}
                onChange={(e) => setAdsConfig({ ...adsConfig, testMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* 3. Auto Ads Script Switch */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Google Auto-Ads</span>
              <span className="text-[11px] text-slate-500">Allow AI placement by Google</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={adsConfig.enableAutoAds}
                onChange={(e) => setAdsConfig({ ...adsConfig, enableAutoAds: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* AdSense Publisher ID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Google AdSense Publisher ID (data-ad-client):
            </label>
            <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white">
              <span className="text-xs font-mono font-bold text-blue-600 mr-2 shrink-0">ca-pub-</span>
              <input
                type="text"
                value={adsConfig.adClient?.replace(/^ca-pub-/, '') || ''}
                onChange={(e) => {
                  const val = e.target.value.trim().replace(/^ca-pub-/, '');
                  setAdsConfig({ ...adsConfig, adClient: `ca-pub-${val}` });
                }}
                placeholder="6461734149500000"
                className="w-full bg-transparent border-0 outline-none text-xs font-mono text-slate-800"
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Found on your AdSense dashboard (e.g., <code>ca-pub-XXXXXXXXXXXXXXXX</code>).
            </span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Global Advertisement Disclaimer:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={selectedPlacement.labelText || 'ADVERTISEMENT'}
                onChange={(e) => handleUpdatePlacement({ labelText: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ADVERTISEMENT"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Placements Manager (2-Column Layout: Selector & Editor) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Placements List & Page Filter */}
        <div className="lg:col-span-5 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Page Ad Units ({filteredPlacements.length})
            </h4>
            {/* Filter pills */}
            <select
              value={filterPage}
              onChange={(e) => setFilterPage(e.target.value)}
              className="text-[11px] font-bold bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-700"
            >
              <option value="all">All Pages</option>
              <option value="home">Home / Catalog</option>
              <option value="formula">Formula Deck</option>
              <option value="dashboard">Dashboard</option>
              <option value="modal">Resource Modal</option>
              <option value="global">Global</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredPlacements.map((plc) => {
              const isSelected = plc.id === selectedPlacementKey;
              return (
                <div
                  key={plc.id}
                  onClick={() => setSelectedPlacementKey(plc.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          plc.enabled ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      ></span>
                      <span className="text-xs font-extrabold text-slate-800 truncate">
                        {plc.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 truncate">
                      <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                        {plc.pageName}
                      </span>
                      <span>•</span>
                      <span className="font-mono">{plc.adSlot || 'Responsive'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleTogglePlacement(plc.id)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                        plc.enabled
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {plc.enabled ? 'Active' : 'Off'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Placement Customization Form */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">
                  {selectedPlacement.name}
                </span>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  {selectedPlacement.pageName}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedPlacement.description}
              </p>
            </div>

            <button
              onClick={() => handleTogglePlacement(selectedPlacementKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedPlacement.enabled
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {selectedPlacement.enabled ? 'Unit Enabled ✓' : 'Unit Disabled ✕'}
            </button>
          </div>

          {/* Ad Type Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Ad Unit Format / Type:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleUpdatePlacement({ adType: 'adsense' })}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedPlacement.adType === 'adsense'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Google AdSense
              </button>
              <button
                type="button"
                onClick={() => handleUpdatePlacement({ adType: 'banner_image' })}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedPlacement.adType === 'banner_image'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Custom Banner Image
              </button>
              <button
                type="button"
                onClick={() => handleUpdatePlacement({ adType: 'custom_html' })}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedPlacement.adType === 'custom_html'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                HTML5 / Affiliate
              </button>
            </div>
          </div>

          {/* Type-Specific Options */}
          {selectedPlacement.adType === 'adsense' ? (
            <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    AdSense Slot ID (data-ad-slot):
                  </label>
                  <input
                    type="text"
                    value={selectedPlacement.adSlot}
                    onChange={(e) => handleUpdatePlacement({ adSlot: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 2002002002"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Created in Google AdSense &gt; Ads &gt; By ad unit.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Ad Format (data-ad-format):
                  </label>
                  <select
                    value={selectedPlacement.adFormat}
                    onChange={(e) => handleUpdatePlacement({ adFormat: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="auto">Auto (Responsive)</option>
                    <option value="horizontal">Horizontal (Leaderboard)</option>
                    <option value="rectangle">Rectangle (300x250 / Card)</option>
                    <option value="vertical">Vertical (Skyscraper)</option>
                    <option value="fluid">Fluid (In-Feed)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Full-Width Responsive
                  </span>
                  <span className="text-[11px] text-slate-500">
                    data-full-width-responsive="true" (Recommended for mobile screens)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={selectedPlacement.adFullWidthResponsive}
                  onChange={(e) => handleUpdatePlacement({ adFullWidthResponsive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>
            </div>
          ) : selectedPlacement.adType === 'banner_image' ? (
            <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Banner Image URL:
                </label>
                <input
                  type="text"
                  value={selectedPlacement.bannerImageUrl || ''}
                  onChange={(e) => handleUpdatePlacement({ bannerImageUrl: e.target.value })}
                  placeholder="https://example.com/banner-728x90.png"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Destination Click URL:
                  </label>
                  <input
                    type="text"
                    value={selectedPlacement.bannerLinkUrl || ''}
                    onChange={(e) => handleUpdatePlacement({ bannerLinkUrl: e.target.value })}
                    placeholder="https://yourpartner.com/special-deal"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Image Alt Description:
                  </label>
                  <input
                    type="text"
                    value={selectedPlacement.bannerAlt || ''}
                    onChange={(e) => handleUpdatePlacement({ bannerAlt: e.target.value })}
                    placeholder="Special Olympiad Workbook Offer"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Custom HTML / JavaScript / Affiliate Embed Code:
                </label>
                <textarea
                  rows={4}
                  value={selectedPlacement.customHtml || ''}
                  onChange={(e) => handleUpdatePlacement({ customHtml: e.target.value })}
                  placeholder="<iframe src='...' width='728' height='90' frameborder='0'></iframe>"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
            </div>
          )}

          {/* Styling & Layout Customization */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Placement Styling &amp; Layout Options
            </h5>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Alignment:
                </label>
                <select
                  value={selectedPlacement.alignment}
                  onChange={(e) => handleUpdatePlacement({ alignment: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  <option value="center">Centered</option>
                  <option value="left">Left Aligned</option>
                  <option value="right">Right Aligned</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Padding:
                </label>
                <select
                  value={selectedPlacement.padding || 'normal'}
                  onChange={(e) => handleUpdatePlacement({ padding: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  <option value="compact">Compact (8px)</option>
                  <option value="normal">Normal (16px)</option>
                  <option value="relaxed">Relaxed (24px)</option>
                  <option value="none">Zero Padding</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Max Width:
                </label>
                <input
                  type="text"
                  value={selectedPlacement.maxWidth || '100%'}
                  onChange={(e) => handleUpdatePlacement({ maxWidth: e.target.value })}
                  placeholder="100% or 970px"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Show "Ad" Tag:
                </label>
                <button
                  type="button"
                  onClick={() => handleUpdatePlacement({ showLabel: !selectedPlacement.showLabel })}
                  className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold border transition-colors ${
                    selectedPlacement.showLabel
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {selectedPlacement.showLabel ? 'Shown ✓' : 'Hidden ✕'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Background Color:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedPlacement.backgroundColor?.startsWith('#') ? selectedPlacement.backgroundColor : '#f8fafc'}
                    onChange={(e) => handleUpdatePlacement({ backgroundColor: e.target.value })}
                    className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 shrink-0"
                  />
                  <input
                    type="text"
                    value={selectedPlacement.backgroundColor || '#f8fafc'}
                    onChange={(e) => handleUpdatePlacement({ backgroundColor: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Border Color:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedPlacement.borderColor?.startsWith('#') ? selectedPlacement.borderColor : '#e2e8f0'}
                    onChange={(e) => handleUpdatePlacement({ borderColor: e.target.value })}
                    className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 shrink-0"
                  />
                  <input
                    type="text"
                    value={selectedPlacement.borderColor || '#e2e8f0'}
                    onChange={(e) => handleUpdatePlacement({ borderColor: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview of this exact unit */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 block mb-2">
              Live Preview on Website:
            </span>
            <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200">
              <AdPlacement location={selectedPlacementKey} forceTestMode={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
