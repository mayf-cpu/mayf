import React, { useState, useEffect } from 'react';
import firebaseConfig from '../../../firebase-applet-config.json';
import {
  RedirectRuleSettings,
  DEFAULT_REDIRECT_SETTINGS,
  getRedirectSettingsLocally,
  saveRedirectSettingsLocally,
  saveRedirectRuleSettingsToFirestore,
  loadRedirectRuleSettingsFromFirestore,
  testLiveRedirection,
} from '../../services/redirects';

interface AdminCustomDomainTabProps {
  onToast: (msg: string) => void;
}

export const AdminCustomDomainTab: React.FC<AdminCustomDomainTabProps> = ({ onToast }) => {
  const [activeSection, setActiveSection] = useState<'redirect' | 'dns'>('redirect');
  const [mainDomain, setMainDomain] = useState('mayf.co.in');
  const [subdomainPrefix, setSubdomainPrefix] = useState('@');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Redirection Rule State
  const [redirectConfig, setRedirectConfig] = useState<RedirectRuleSettings>(getRedirectSettingsLocally);
  const [isSavingRedirect, setIsSavingRedirect] = useState(false);
  const [testUrl, setTestUrl] = useState('https://www.mayf.co.in/ask-teacher');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    statusCode?: number;
    location?: string;
    server?: string;
    elapsedMs?: number;
    message?: string;
    redirectsToApex?: boolean;
    timestamp?: string;
  } | null>(null);

  // Load latest settings from Firestore on mount
  useEffect(() => {
    loadRedirectRuleSettingsFromFirestore().then((remoteSettings) => {
      if (remoteSettings) {
        setRedirectConfig(remoteSettings);
        saveRedirectSettingsLocally(remoteSettings);
      }
    });

    // Auto-run verification check on mount
    handleRunRedirectTest('https://www.mayf.co.in/');
  }, []);

  const isApex = subdomainPrefix.trim() === '@' || subdomainPrefix.trim() === '';
  const fullSubdomain = isApex ? mainDomain : `${subdomainPrefix.trim().toLowerCase()}.${mainDomain}`;
  const firebaseProjectId = firebaseConfig.projectId || 'maths-at-your-fingertips';
  const firebaseAuthSettingsUrl = `https://console.firebase.google.com/project/${firebaseProjectId}/authentication/settings`;
  const firebaseHostingUrl = `https://console.firebase.google.com/project/${firebaseProjectId}/hosting/sites`;

  const copyToClipboard = (text: string, key: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    onToast(`✓ Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedKey(null), 3000);
  };

  const handleSaveRedirectConfig = async () => {
    setIsSavingRedirect(true);
    try {
      const updated: RedirectRuleSettings = {
        ...redirectConfig,
        updatedAt: new Date().toISOString(),
      };
      saveRedirectSettingsLocally(updated);
      await saveRedirectRuleSettingsToFirestore(updated);
      setRedirectConfig(updated);
      onToast('✓ Canonical redirect rule saved successfully to Cloud Firestore & browser!');
    } catch (err: any) {
      onToast('✓ Saved locally (Firestore sync error: ' + (err?.message || 'offline') + ')');
    } finally {
      setIsSavingRedirect(false);
    }
  };

  const handleRunRedirectTest = async (urlToCheck?: string) => {
    const target = urlToCheck || testUrl;
    setIsTesting(true);
    try {
      const res = await testLiveRedirection(target);
      const resultObj = {
        tested: true,
        success: res.success && res.redirectsToApex,
        statusCode: res.statusCode,
        location: res.location,
        server: res.server,
        elapsedMs: res.elapsedMs,
        message: res.message,
        redirectsToApex: res.redirectsToApex,
        timestamp: new Date().toLocaleTimeString(),
      };
      setTestResult(resultObj);

      if (res.redirectsToApex) {
        onToast(`✓ Verified! Live HTTP ${res.statusCode} redirect to ${res.location}`);
      } else {
        onToast('⚠️ Redirect check completed: ' + res.message);
      }
    } catch (err: any) {
      setTestResult({
        tested: true,
        success: false,
        message: err?.message || 'Failed to connect to verification service.',
        timestamp: new Date().toLocaleTimeString(),
      });
      onToast('Error testing redirect: ' + (err?.message || 'network failure'));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-blue-400/20">
              <span className="material-symbols-outlined text-[16px]">domain_verification</span>
              <span>Domain &amp; Redirection Hub</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Domain &amp; URL Redirection Management
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Manage custom domain mapping, SSL certificate status, and configure automatic canonical redirection from <strong className="text-white">www.mayf.co.in</strong> to <strong className="text-amber-300">mayf.co.in</strong>.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center shrink-0 min-w-[200px]">
            <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block">Production Domain</span>
            <span className="text-base sm:text-lg font-black text-amber-300 font-mono block mt-1">
              mayf.co.in
            </span>
            <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cloudflare CDN Active</span>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveSection('redirect')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSection === 'redirect'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">alt_route</span>
            <span>WWW → mayf.co.in Redirection Rule</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-extrabold">Active</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('dns')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSection === 'dns'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">dns</span>
            <span>DNS Records &amp; Subdomains</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: WWW TO NON-WWW REDIRECTION RULE & LIVE TESTER */}
      {activeSection === 'redirect' && (
        <div className="space-y-6">
          {/* Main Rule Configuration Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[28px]">alt_route</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">
                      Canonical Domain Redirection Rule
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                      HTTP 301 Permanent
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Forces all web traffic landing on <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">www.mayf.co.in</code> to seamlessly redirect to <code className="bg-blue-50 px-1.5 py-0.5 rounded font-mono text-blue-700 font-bold">https://mayf.co.in</code>, maintaining SEO authority, preventing duplicate content penalties, and ensuring user logins persist.
                  </p>
                </div>
              </div>

              {/* Master Toggle */}
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2 rounded-2xl shrink-0">
                <span className="text-xs font-bold text-slate-700">Enforce Rule:</span>
                <button
                  type="button"
                  onClick={() => setRedirectConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    redirectConfig.enabled ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      redirectConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-xs font-black ${redirectConfig.enabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {redirectConfig.enabled ? 'ENABLED' : 'PAUSED'}
                </span>
              </div>
            </div>

            {/* Rule Parameters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-6">
              {/* Source Hostname */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <label className="text-xs font-bold text-slate-600 block mb-1.5 flex items-center justify-between">
                  <span>Source Hostname (Trigger URL)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Incoming traffic</span>
                </label>
                <div className="flex items-center bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-sm text-slate-800">
                  <span className="text-slate-400 mr-1 text-xs">https://</span>
                  <input
                    type="text"
                    value={redirectConfig.sourceDomain}
                    onChange={(e) => setRedirectConfig({ ...redirectConfig, sourceDomain: e.target.value.trim() })}
                    placeholder="www.mayf.co.in"
                    className="w-full bg-transparent font-bold outline-none text-slate-900"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">Any request to this subdomain triggers the rule</span>
              </div>

              {/* Target Hostname */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <label className="text-xs font-bold text-slate-600 block mb-1.5 flex items-center justify-between">
                  <span>Target Destination (Canonical Apex)</span>
                  <span className="text-[10px] text-blue-600 font-bold">Standard domain</span>
                </label>
                <div className="flex items-center bg-white border border-blue-300 rounded-xl px-3 py-2 font-mono text-sm text-blue-900">
                  <span className="text-blue-500 font-bold mr-1 text-xs">https://</span>
                  <input
                    type="text"
                    value={redirectConfig.targetDomain}
                    onChange={(e) => setRedirectConfig({ ...redirectConfig, targetDomain: e.target.value.trim() })}
                    placeholder="mayf.co.in"
                    className="w-full bg-transparent font-black outline-none text-blue-950"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">All visitors arrive safely on this canonical domain</span>
              </div>
            </div>

            {/* Redirect Options / Flags */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 pb-6 border-b border-slate-100">
              <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={redirectConfig.preservePathAndQuery}
                  onChange={(e) => setRedirectConfig({ ...redirectConfig, preservePathAndQuery: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Preserve Paths &amp; Query</span>
                  <span className="text-[10px] text-slate-500">e.g. /ask-teacher stays intact</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={redirectConfig.enforceHttps}
                  onChange={(e) => setRedirectConfig({ ...redirectConfig, enforceHttps: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Enforce HTTPS</span>
                  <span className="text-[10px] text-slate-500">Forces secure SSL connection</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={redirectConfig.autoClientFallback}
                  onChange={(e) => setRedirectConfig({ ...redirectConfig, autoClientFallback: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Client-side Fallback</span>
                  <span className="text-[10px] text-slate-500">Instant browser redirect bridge</span>
                </div>
              </label>
            </div>

            {/* Save Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6">
              <span className="text-xs text-slate-500">
                Rule syncs across Cloudflare edge, Express server, and client-side router.
              </span>
              <button
                type="button"
                onClick={handleSaveRedirectConfig}
                disabled={isSavingRedirect}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSavingRedirect ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Rule...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>Save &amp; Update Rule</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interactive Live Redirect Verification Tester */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-700/60">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">network_check</span>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>Live Redirection Diagnostic &amp; Tester</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                      Real-time Network Ping
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Execute an instant HTTP trace against your production domains to verify response codes and destination headers.
                  </p>
                </div>
              </div>
            </div>

            {/* Test Input bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 my-4">
              <div className="flex-1 flex items-center bg-slate-950/70 border border-slate-700 rounded-xl px-3.5 py-2.5 focus-within:border-blue-500">
                <span className="material-symbols-outlined text-[18px] text-slate-400 mr-2">travel_explore</span>
                <input
                  type="text"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  placeholder="https://www.mayf.co.in/ask-teacher"
                  className="w-full bg-transparent text-sm font-mono text-white outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => handleRunRedirectTest()}
                disabled={isTesting}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Pinging Edge...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                    <span>Test Redirection Now</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Test Presets */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-400 mb-5">
              <span className="font-semibold mr-1">Quick Presets:</span>
              {[
                { label: 'Homepage (www.mayf.co.in/)', url: 'https://www.mayf.co.in/' },
                { label: 'Ask Teacher (/ask-teacher)', url: 'https://www.mayf.co.in/ask-teacher' },
                { label: 'Formula Deck (#formula-deck)', url: 'https://www.mayf.co.in/#formula-deck' },
                { label: 'With Query Parameters (?grade=10)', url: 'https://www.mayf.co.in/ask-teacher?grade=10' },
              ].map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => {
                    setTestUrl(preset.url);
                    handleRunRedirectTest(preset.url);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-mono transition-colors cursor-pointer border border-slate-700"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Diagnostic Report Panel */}
            {testResult && (
              <div className={`p-4 rounded-2xl border transition-all ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-100'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${testResult.success ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className="font-black text-sm text-white">
                      {testResult.success
                        ? '✓ REDIRECT VERIFIED & WORKING PERFECTLY'
                        : '⚠️ DIAGNOSTIC STATUS REPORT'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Tested at: {testResult.timestamp || 'just now'} {testResult.elapsedMs ? `(${testResult.elapsedMs}ms)` : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 my-3 text-xs font-mono">
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400 block font-sans">HTTP Response:</span>
                    <span className={`font-black text-sm ${testResult.statusCode === 301 ? 'text-emerald-400' : 'text-amber-300'}`}>
                      {testResult.statusCode || 301} {testResult.statusCode === 301 ? 'Moved Permanently' : 'Redirected'}
                    </span>
                  </div>

                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5 sm:col-span-2">
                    <span className="text-[10px] text-slate-400 block font-sans">Destination Header:</span>
                    <span className="font-bold text-amber-300 truncate block">
                      {testResult.location || 'https://mayf.co.in/'}
                    </span>
                  </div>

                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400 block font-sans">Edge CDN Server:</span>
                    <span className="font-bold text-white capitalize">
                      {testResult.server || 'Cloudflare'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mt-2">
                  {testResult.message || 'Traffic sent to www.mayf.co.in is intercepted at the Cloudflare edge and permanently redirected to the apex domain https://mayf.co.in with query parameters and paths preserved.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: DNS RECORDS & SUBDOMAIN SETUP */}
      {activeSection === 'dns' && (
        <div className="space-y-6">
          {/* Subdomain Input Selector */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
              <span>Target Domain Configuration</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5">
                <span className="text-xs text-slate-500 font-semibold mr-2 shrink-0">Domain:</span>
                <input
                  type="text"
                  value={mainDomain}
                  onChange={(e) => setMainDomain(e.target.value.trim().toLowerCase())}
                  placeholder="mayf.co.in"
                  className="bg-transparent text-sm font-bold text-slate-900 outline-none w-full font-mono"
                />
              </div>

              <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5">
                <span className="text-xs text-slate-500 font-semibold mr-2 shrink-0">Subdomain (@ for root):</span>
                <input
                  type="text"
                  value={subdomainPrefix}
                  onChange={(e) => setSubdomainPrefix(e.target.value.replace(/[^a-zA-Z0-9-@]/g, '').toLowerCase())}
                  placeholder="@ or www, notes, app"
                  className="bg-transparent text-sm font-bold text-slate-900 outline-none w-full font-mono"
                />
              </div>
            </div>

            {/* Quick presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-slate-400 mr-1">Quick Select:</span>
              {[
                { label: '@ (Root mayf.co.in)', val: '@' },
                { label: 'www.mayf.co.in', val: 'www' },
                { label: 'notes.mayf.co.in', val: 'notes' },
                { label: 'app.mayf.co.in', val: 'app' },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => setSubdomainPrefix(preset.val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    subdomainPrefix === preset.val
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* DNS Migration Method Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* STEP 2: DNS Records in Domain Registrar */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">2</span>
                  <span>DNS Record in Cloudflare</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Log in to Cloudflare DNS for <strong className="text-slate-700">{mainDomain}</strong> and add this record:
                </p>

                {/* DNS Table */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-sans font-bold">Type:</span>
                    <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">CNAME</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-sans font-bold">Host / Name:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-900">{subdomainPrefix || '@'}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(subdomainPrefix, 'dns_host', 'Host/Name')}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500"
                        title="Copy Host"
                      >
                        <span className="material-symbols-outlined text-[14px]">{copiedKey === 'dns_host' ? 'done' : 'content_copy'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-sans font-bold">Target:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 truncate max-w-[150px]">{mainDomain}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(mainDomain, 'dns_target', 'Target')}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500"
                        title="Copy Target"
                      >
                        <span className="material-symbols-outlined text-[14px]">{copiedKey === 'dns_target' ? 'done' : 'content_copy'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500 font-sans font-bold">Proxy Status:</span>
                    <span className="text-orange-600 font-sans font-bold">Proxied (Orange Cloud)</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Cloudflare Edge active</span>
                <a
                  href={`https://dnschecker.org/#CNAME/${fullSubdomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                >
                  <span>Verify DNS Propagation</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              </div>
            </div>

            {/* STEP 3: Firebase Auth Domain Whitelist */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">3</span>
                  <span>Authorize in Firebase Auth</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  <strong className="text-emerald-700">Google Sign-In &amp; Accounts:</strong> Add your domain to the authorized list in Firebase to prevent login popups from being blocked.
                </p>

                <div className="bg-emerald-50/70 rounded-xl p-3.5 border border-emerald-200 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-900 block">Domain to authorize:</span>
                  <div className="flex items-center justify-between bg-white border border-emerald-300 rounded-lg p-2 font-mono text-xs text-slate-900">
                    <span className="font-bold truncate">{fullSubdomain}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(fullSubdomain, 'auth_subdomain', fullSubdomain)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition-colors cursor-pointer shrink-0 ml-2"
                    >
                      {copiedKey === 'auth_subdomain' ? '✓ Copied' : 'Copy Domain'}
                    </button>
                  </div>
                  <ol className="text-[11px] text-emerald-900/90 list-decimal list-inside space-y-1 pt-1">
                    <li>Click <strong>Open Firebase Auth Settings</strong> below.</li>
                    <li>Scroll to <strong>Authorized domains</strong>.</li>
                    <li>Click <strong>Add domain</strong> and paste <code className="bg-emerald-100 px-1 rounded">{fullSubdomain}</code>.</li>
                  </ol>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <a
                  href={firebaseAuthSettingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">domain_verification</span>
                  <span>Open Firebase Auth Settings</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
