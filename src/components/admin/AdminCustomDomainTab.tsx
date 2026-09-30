import React, { useState } from 'react';
import firebaseConfig from '../../../firebase-applet-config.json';

interface AdminCustomDomainTabProps {
  onToast: (msg: string) => void;
}

export const AdminCustomDomainTab: React.FC<AdminCustomDomainTabProps> = ({ onToast }) => {
  const [subdomainPrefix, setSubdomainPrefix] = useState('notes');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const mainDomain = 'mathsatfingertips.com';
  const fullSubdomain = subdomainPrefix.trim() ? `${subdomainPrefix.trim().toLowerCase()}.${mainDomain}` : mainDomain;
  const firebaseProjectId = firebaseConfig.projectId || 'maths-at-your-fingertips';
  const firebaseAuthSettingsUrl = `https://console.firebase.google.com/project/${firebaseProjectId}/authentication/settings`;
  const firebaseHostingUrl = `https://console.firebase.google.com/project/${firebaseProjectId}/hosting/sites`;

  const copyToClipboard = (text: string, key: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    onToast(`✓ Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedKey(null), 3000);
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
              <span>Subdomain Migration Wizard</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Migrate to your Custom Subdomain
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Connect this web app to a custom subdomain on <strong className="text-white font-bold">{mainDomain}</strong> (e.g. <span className="text-amber-300 font-mono font-bold">notes.{mainDomain}</span> or <span className="text-amber-300 font-mono font-bold">app.{mainDomain}</span>) with automated SSL, Firebase Auth, and CDN.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center shrink-0 min-w-[200px]">
            <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block">Target Subdomain</span>
            <span className="text-base sm:text-lg font-black text-amber-300 font-mono block mt-1">
              {fullSubdomain}
            </span>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
              HTTPS / SSL Supported
            </span>
          </div>
        </div>
      </div>

      {/* Subdomain Input Selector */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
          <span>Choose Your Subdomain Prefix</span>
        </h3>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 relative flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
            <span className="text-xs text-slate-400 font-medium mr-2">https://</span>
            <input
              type="text"
              value={subdomainPrefix}
              onChange={(e) => setSubdomainPrefix(e.target.value.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase())}
              placeholder="e.g. notes, app, study, vault, learn"
              className="bg-transparent text-sm font-bold text-slate-900 outline-none w-full"
            />
            <span className="text-sm font-bold text-slate-500 font-mono">.{mainDomain}</span>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 mr-1">Popular:</span>
            {['notes', 'app', 'study', 'vault', 'portal'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setSubdomainPrefix(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  subdomainPrefix === preset
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Migration Method Steps (Tabbed or Sequential) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* STEP 2: DNS Records in Domain Registrar */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">2</span>
              <span>Add DNS Record in your Domain Registrar</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Log in to where <strong className="text-slate-700">{mainDomain}</strong> is hosted (GoDaddy, Namecheap, Cloudflare, Hostinger, etc.) and add this CNAME record:
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
                <span className="text-slate-500 font-sans font-bold">Points to (Firebase Target):</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 truncate max-w-[150px]">{`${firebaseProjectId}.web.app`}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`${firebaseProjectId}.web.app`, 'dns_target', 'Target')}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500"
                    title="Copy Target"
                  >
                    <span className="material-symbols-outlined text-[14px]">{copiedKey === 'dns_target' ? 'done' : 'content_copy'}</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 font-sans font-bold">TTL:</span>
                <span className="text-slate-700 font-sans">Automatic or 1 Hour</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">DNS propagates in 5 - 30 minutes</span>
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
              <span>Authorize Subdomain in Firebase Auth</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              <strong className="text-red-600">Crucial for Google Sign-In &amp; Accounts:</strong> Add your new subdomain to the authorized list in Firebase to prevent login popups from being blocked.
            </p>

            <div className="bg-emerald-50/70 rounded-xl p-3.5 border border-emerald-200 space-y-2">
              <span className="text-[11px] font-bold text-emerald-900 block">Copy domain to authorize:</span>
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

      {/* STEP 4: Hosting & Deployment Options */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center text-xs font-bold">4</span>
          <span>Deploy Web App to your Subdomain</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Method A: Firebase Hosting (Recommended) */}
          <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-blue-900 uppercase">Option A: Firebase Hosting (Recommended)</span>
                <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">Fastest</span>
              </div>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                Connects directly to your Firebase project with automatic SSL provisioning and instant global CDN delivery.
              </p>
              <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg text-xs font-mono space-y-1 select-all overflow-x-auto mb-3">
                <div className="text-slate-400"># 1. Build app</div>
                <div>npm run build</div>
                <div className="text-slate-400 mt-1"># 2. Deploy to Firebase</div>
                <div>firebase deploy --only hosting</div>
              </div>
            </div>
            <a
              href={firebaseHostingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              <span>Add Custom Domain in Firebase Hosting</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          </div>

          {/* Method B: Cloudflare or Custom Reverse Proxy */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-800 uppercase">Option B: Cloudflare / DNS Proxy</span>
                <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Flexible</span>
              </div>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                If your domain <strong className="text-slate-800">{mainDomain}</strong> is managed in Cloudflare, simply add a CNAME record with proxying (Orange Cloud) enabled.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Free universal SSL certificate included.</li>
                <li>DDoS protection &amp; caching built-in.</li>
                <li>Zero server maintenance required.</li>
              </ul>
            </div>
            <div className="pt-3 text-[11px] text-slate-400">
              Need help? All assets and static build files compile via <code className="bg-slate-200 px-1 rounded text-slate-800">npm run build</code> into <code className="bg-slate-200 px-1 rounded text-slate-800">dist/</code>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
