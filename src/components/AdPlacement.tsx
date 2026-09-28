import React, { useEffect, useState, useRef } from 'react';
import {
  AdPlacementLocation,
  AdPlacementConfig,
  AdsGlobalConfig,
  getAdsConfig,
} from '../services/ads';

interface AdPlacementProps {
  location: AdPlacementLocation;
  className?: string;
  forceTestMode?: boolean;
}

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export const AdPlacement: React.FC<AdPlacementProps> = ({
  location,
  className = '',
  forceTestMode,
}) => {
  const [config, setConfig] = useState<AdsGlobalConfig>(getAdsConfig);
  const adRef = useRef<HTMLDivElement>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<AdsGlobalConfig>;
      if (customEvent.detail) {
        setConfig(customEvent.detail);
      } else {
        setConfig(getAdsConfig());
      }
    };

    window.addEventListener('ads-config-changed', handleUpdate);
    return () => window.removeEventListener('ads-config-changed', handleUpdate);
  }, []);

  const placement: AdPlacementConfig | undefined = config.placements?.[location];

  // If globally disabled or this specific slot is disabled, render nothing
  if (!config.enabled && !forceTestMode) {
    return null;
  }
  if (!placement?.enabled && !forceTestMode) {
    return null;
  }
  if (!placement) {
    return null;
  }

  const isTestMode = forceTestMode ?? config.testMode;

  // Execute real AdSense script push if real adsense is active
  useEffect(() => {
    if (!isTestMode && placement.adType === 'adsense' && !pushedRef.current) {
      try {
        if (typeof window !== 'undefined') {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushedRef.current = true;
        }
      } catch (e) {
        // Ignore AdSense duplicate push errors
      }
    }
  }, [isTestMode, placement.adType, placement.adSlot]);

  // Alignment classes
  const alignClass =
    placement.alignment === 'left'
      ? 'mr-auto text-left'
      : placement.alignment === 'right'
      ? 'ml-auto text-right'
      : 'mx-auto text-center';

  // Padding classes
  const paddingClass =
    placement.padding === 'none'
      ? 'p-0'
      : placement.padding === 'compact'
      ? 'p-2 sm:p-2.5'
      : placement.padding === 'relaxed'
      ? 'p-5 sm:p-7'
      : 'p-3.5 sm:p-4';

  const containerStyle: React.CSSProperties = {
    maxWidth: placement.maxWidth || '100%',
    backgroundColor: placement.backgroundColor || 'transparent',
    borderColor: placement.borderColor || '#e2e8f0',
  };

  return (
    <div
      ref={adRef}
      className={`my-3 sm:my-4 transition-all overflow-hidden ${alignClass} ${className}`}
      style={containerStyle}
    >
      <div
        className={`w-full rounded-2xl border transition-all ${paddingClass}`}
        style={{
          borderColor: placement.borderColor || '#e2e8f0',
          backgroundColor: placement.backgroundColor || '#f8fafc',
        }}
      >
        {/* Label ("ADVERTISEMENT" / "SPONSORED") */}
        {placement.showLabel && (
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mb-1.5 px-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {placement.labelText || 'ADVERTISEMENT'}
            </span>
            {isTestMode && (
              <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded text-[9px]">
                AdSense Preview Mode
              </span>
            )}
          </div>
        )}

        {/* 1. TEST MODE / PREVIEW CARD */}
        {isTestMode ? (
          <div className="border border-dashed border-blue-300 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-blue-50/70 rounded-xl p-3 sm:p-4 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-tight text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
                  Google AdSense
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {placement.name}
                </span>
              </div>
              <span className="text-[11px] font-mono font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-blue-200">
                Slot ID: {placement.adSlot || 'Auto-Responsive'}
              </span>
            </div>

            <div className="py-3 px-2 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mb-1">
                <span className="material-symbols-outlined text-blue-600 text-[18px]">ads_click</span>
                <span>Format: <strong className="text-blue-800 uppercase">{placement.adFormat}</strong></span>
                <span>•</span>
                <span>Publisher: <strong className="text-slate-800 font-mono text-[11px]">{config.adClient}</strong></span>
              </div>
              <p className="text-[11px] text-slate-400 max-w-md">
                {placement.description}
              </p>
            </div>

            <div className="text-[10px] text-slate-400 border-t border-blue-100 pt-2 flex items-center justify-between">
              <span>Full-Width Responsive: {placement.adFullWidthResponsive ? 'Yes' : 'No'}</span>
              <span>Target: {placement.pageName}</span>
            </div>
          </div>
        ) : placement.adType === 'adsense' ? (
          /* 2. REAL GOOGLE ADSENSE INS TAG */
          <div className="w-full overflow-hidden flex items-center justify-center min-h-[90px]">
            <ins
              className="adsbygoogle"
              style={{
                display: 'block',
                width: '100%',
                minHeight: placement.adFormat === 'rectangle' ? '250px' : '90px',
              }}
              data-ad-client={config.adClient}
              data-ad-slot={placement.adSlot}
              data-ad-format={placement.adFormat}
              data-full-width-responsive={placement.adFullWidthResponsive ? 'true' : 'false'}
            />
          </div>
        ) : placement.adType === 'banner_image' && placement.bannerImageUrl ? (
          /* 3. CUSTOM BANNER IMAGE AD */
          <div className="w-full flex items-center justify-center">
            {placement.bannerLinkUrl ? (
              <a
                href={placement.bannerLinkUrl}
                target={placement.openInNewTab ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="block max-w-full group"
              >
                <img
                  src={placement.bannerImageUrl}
                  alt={placement.bannerAlt || 'Advertisement'}
                  className="max-h-64 w-auto rounded-lg object-contain transition-transform group-hover:scale-[1.01]"
                />
              </a>
            ) : (
              <img
                src={placement.bannerImageUrl}
                alt={placement.bannerAlt || 'Advertisement'}
                className="max-h-64 w-auto rounded-lg object-contain"
              />
            )}
          </div>
        ) : placement.adType === 'custom_html' && placement.customHtml ? (
          /* 4. CUSTOM HTML / SCRIPT SNIPPET */
          <div
            className="w-full overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: placement.customHtml }}
          />
        ) : (
          <div className="py-2 text-center text-xs text-slate-400">
            Ad configured but no creative content loaded.
          </div>
        )}
      </div>
    </div>
  );
};
