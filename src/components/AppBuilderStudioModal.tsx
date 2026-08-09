import React, { useState } from 'react';
import { SettingsState } from '../types';
import { Sparkles, Code2, Download, Key, ShieldCheck, Cpu, Smartphone, Laptop, CheckCircle2, Copy, ExternalLink, Zap, DollarSign, Lock, FileCode, Check } from 'lucide-react';
import { t } from '../lib/i18n';

interface AppBuilderStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SettingsState;
}

export const AppBuilderStudioModal: React.FC<AppBuilderStudioModalProps> = ({ isOpen, onClose, settings }) => {
  const [activeSubTab, setActiveSubTab] = useState<'app_builder' | 'keystore_play' | 'admob_dev'>('app_builder');

  // App Builder state
  const [appName, setAppName] = useState('MyCustomNavApp');
  const [appType, setAppType] = useState<'android' | 'web' | 'flutter' | 'pwa'>('android');
  const [customApiKey, setCustomApiKey] = useState(settings.aiApiKey || '');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'live_map',
    'speed_cam',
    'ai_copilot',
    'dashcam_gallery',
    'sos_radar'
  ]);

  // Google Play Keystore state
  const [keystoreFileName, setKeystoreFileName] = useState('mapai-release.keystore');
  const [keystoreAlias, setKeystoreAlias] = useState('mapai_key_release');
  const [storePassword, setStorePassword] = useState('MySuperSecretPass2026!');
  const [keyPassword, setKeyPassword] = useState('MySuperSecretPass2026!');
  const [developerName, setDeveloperName] = useState('Developer Name');
  const [organization, setOrganization] = useState('MapAi Inc');
  const [countryCode, setCountryCode] = useState('MY');
  const [keystoreBase64, setKeystoreBase64] = useState('');

  // AdMob & Developer Settings state
  const [packageName, setPackageName] = useState('com.example.mapai');
  const [versionCode, setVersionCode] = useState('1');
  const [versionName, setVersionName] = useState('1.0.0');
  const [admobAppId, setAdmobAppId] = useState('ca-app-pub-3940256099942544~3347511713');
  const [admobBannerId, setAdmobBannerId] = useState('ca-app-pub-3940256099942544/6300978111');
  const [admobInterstitialId, setAdmobInterstitialId] = useState('ca-app-pub-3940256099942544/1033173712');
  const [admobRewardedId, setAdmobRewardedId] = useState('ca-app-pub-3940256099942544/5224354917');
  
  const [copied, setCopied] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleFeature = (feat: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const generateConfigManifest = () => {
    return JSON.stringify(
      {
        appName,
        appType,
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        personalApiKeyConfigured: Boolean(customApiKey),
        billingNote: 'Personal API usage & payment managed directly via Google AI Studio / Groq / OpenAI dashboard.',
        features: selectedFeatures,
        keystoreConfig: {
          storeFile: keystoreFileName,
          keyAlias: keystoreAlias,
          hasStorePass: Boolean(storePassword),
          hasKeyPass: Boolean(keyPassword),
          configuredForGooglePlay: true
        },
        backendEndpoints: {
          osmTiles: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          osrmRouting: 'https://router.project-osrm.org/route/v1/driving',
          liveSocket: settings.serverUrl || 'http://localhost:3000'
        }
      },
      null,
      2
    );
  };

  const generateGradlePropertiesSnippet = () => {
    return `# Google Play Console Release Signing Configuration
MYAPP_RELEASE_STORE_FILE=${keystoreFileName}
MYAPP_RELEASE_KEY_ALIAS=${keystoreAlias}
MYAPP_RELEASE_STORE_PASSWORD=${storePassword}
MYAPP_RELEASE_KEY_PASSWORD=${keyPassword}
MYAPP_DEVELOPER_NAME=${developerName}
MYAPP_ORGANIZATION=${organization}
MYAPP_COUNTRY=${countryCode}`;
  };

  const generateAdMobPropertiesSnippet = () => {
    return `# MapAi Developer & AdMob Configuration Properties
APPLICATION_ID=${packageName}
VERSION_CODE=${versionCode}
VERSION_NAME=${versionName}

# Google AdMob Units
ADMOB_APP_ID=${admobAppId}
ADMOB_BANNER_ID=${admobBannerId}
ADMOB_INTERSTITIAL_ID=${admobInterstitialId}
ADMOB_REWARDED_ID=${admobRewardedId}`;
  };

  const generateKeytoolCommand = () => {
    return `keytool -genkeypair -v -keystore ${keystoreFileName} -alias ${keystoreAlias} -keyalg RSA -keysize 2048 -validity 10000 -storepass "${storePassword}" -keypass "${keyPassword}" -dname "CN=${developerName}, O=${organization}, C=${countryCode}"`;
  };

  const getCurrentSnippet = () => {
    if (activeSubTab === 'app_builder') return generateConfigManifest();
    if (activeSubTab === 'keystore_play') return generateGradlePropertiesSnippet();
    return generateAdMobPropertiesSnippet();
  };

  const getFileNameForExport = () => {
    if (activeSubTab === 'app_builder') return `${appName.toLowerCase().replace(/\s+/g, '_')}_config.json`;
    if (activeSubTab === 'keystore_play') return 'gradle.properties';
    return 'admob_config.properties';
  };

  const handleCopyManifest = () => {
    navigator.clipboard.writeText(getCurrentSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadAppPackage = () => {
    const manifest = getCurrentSnippet();
    const isJson = activeSubTab === 'app_builder';
    const blob = new Blob([manifest], { type: isJson ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getFileNameForExport();
    a.click();
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-[3500] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 text-slate-100 shadow-2xl space-y-4 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-extrabold shadow-lg shadow-cyan-500/20">
              <Code2 className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>MapAi Studio & Google Play Signing</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PLAY STORE READY
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Build custom apps & update your Google Play Console signing keystore.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
          >
            ✕
          </button>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('app_builder')}
            className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
              activeSubTab === 'app_builder'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1. SDK Builder</span>
          </button>

          <button
            onClick={() => setActiveSubTab('keystore_play')}
            className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
              activeSubTab === 'keystore_play'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>2. Keystore Play</span>
          </button>

          <button
            onClick={() => setActiveSubTab('admob_dev')}
            className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
              activeSubTab === 'admob_dev'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>3. AdMob & Dev</span>
          </button>
        </div>

        {/* Success Toast */}
        {exportSuccess && (
          <div className="bg-emerald-950 border border-emerald-500 text-emerald-300 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {activeSubTab === 'app_builder'
                ? 'Personal Application Package exported successfully!'
                : 'Keystore & gradle.properties configuration updated successfully!'}
            </span>
          </div>
        )}

        {/* TAB 1: App Builder Creator */}
        {activeSubTab === 'app_builder' && (
          <>
            {/* Payment & Personal API Notice */}
            <div className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <DollarSign className="w-4 h-4 shrink-0" />
                <span>Personal API Key & Billing Notice</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                To build and run your standalone app, API quota costs (such as Gemini, Groq, or Google Maps) are managed directly via the respective provider's console. MapAi charges zero additional fees.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1 hover:bg-amber-500/30 transition-colors"
                >
                  <span>Get Google AI Studio Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://console.groq.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 hover:bg-slate-700 transition-colors"
                >
                  <span>Groq Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* App Settings & Name */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Application Name
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="e.g. MyRiderNavigation"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Target Platform
                </label>
                <div className="grid grid-cols-4 gap-2 text-xs font-bold">
                  {[
                    { id: 'android', label: 'Android APK', icon: Smartphone },
                    { id: 'web', label: 'Web PWA', icon: Laptop },
                    { id: 'flutter', label: 'Flutter App', icon: Zap },
                    { id: 'pwa', label: 'Docker Cloud', icon: Cpu }
                  ].map((p) => {
                    const IconComp = p.icon;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setAppType(p.id as any)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                          appType === p.id
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-extrabold ring-1 ring-cyan-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-[10px]">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Personal Gemini / AI API Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="AIzaSy... (Personal Gemini/Groq Key)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <Key className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                </div>
              </div>

              {/* Features Checkbox Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Select Application Modules & Features
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'live_map', label: 'Live Map & OSRM Routing' },
                    { id: 'speed_cam', label: 'Speed Camera Radar' },
                    { id: 'ai_copilot', label: 'Floating AI Copilot' },
                    { id: 'dashcam_gallery', label: 'Dashcam Vault' },
                    { id: 'sos_radar', label: 'Emergency & SOS Mode' },
                    { id: 'socket_live', label: 'Live Rider Socket Push' }
                  ].map((f) => (
                    <label
                      key={f.id}
                      onClick={() => toggleFeature(f.id)}
                      className={`p-2 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                        selectedFeatures.includes(f.id)
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 font-semibold'
                          : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}
                    >
                      <span className="text-[11px]">{f.label}</span>
                      <input
                        type="checkbox"
                        checked={selectedFeatures.includes(f.id)}
                        onChange={() => {}}
                        className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: Google Play Keystore & App Signing Manager */}
        {activeSubTab === 'keystore_play' && (
          <div className="space-y-3">
            <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-3 text-xs text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <Lock className="w-4 h-4" />
                <span>Google Play App Signing Keystore Manager</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Enter your Android Keystore information for app signing (Release AAB/APK) before uploading to Google Play Console.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Keystore File Name (.keystore / .jks)</label>
                <input
                  type="text"
                  value={keystoreFileName}
                  onChange={(e) => setKeystoreFileName(e.target.value)}
                  placeholder="mapai-release.keystore"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Key Alias</label>
                <input
                  type="text"
                  value={keystoreAlias}
                  onChange={(e) => setKeystoreAlias(e.target.value)}
                  placeholder="mapai_key_release"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Store Password</label>
                <input
                  type="password"
                  value={storePassword}
                  onChange={(e) => setStorePassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Key Password</label>
                <input
                  type="password"
                  value={keyPassword}
                  onChange={(e) => setKeyPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Developer / Owner Name (CN)</label>
                <input
                  type="text"
                  value={developerName}
                  onChange={(e) => setDeveloperName(e.target.value)}
                  placeholder="Fevian Benjo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Organization (O)</label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="MapAi Devs"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            {/* Optional Base64 Keystore Import */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Paste Keystore Base64 / Encoded Key (Optional)
              </label>
              <textarea
                value={keystoreBase64}
                onChange={(e) => setKeystoreBase64(e.target.value)}
                placeholder="Paste Base64 string of your .keystore file if available..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* CLI Command Generator */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 text-[11px]">Keytool CLI Command to Create New Keystore:</span>
              </div>
              <code className="block text-[10px] font-mono text-amber-300 bg-slate-900 p-2 rounded-xl break-all">
                {generateKeytoolCommand()}
              </code>
            </div>
          </div>
        )}

        {/* TAB 3: AdMob & Developer Configuration */}
        {activeSubTab === 'admob_dev' && (
          <div className="space-y-3">
            <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-2xl p-3 text-xs text-emerald-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                <DollarSign className="w-4 h-4" />
                <span>AdMob Advertising & Android Developer Settings</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Configure your AdMob App ID and Ad Unit IDs (Banner, Interstitial, Rewarded) and Android package name for your app release.
              </p>
              <button
                onClick={() => {
                  setAdmobAppId('ca-app-pub-3940256099942544~3347511713');
                  setAdmobBannerId('ca-app-pub-3940256099942544/6300978111');
                  setAdmobInterstitialId('ca-app-pub-3940256099942544/1033173712');
                  setAdmobRewardedId('ca-app-pub-3940256099942544/5224354917');
                }}
                className="mt-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold hover:bg-emerald-500/30 transition-all"
              >
                Use Official Google AdMob Test IDs
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Package Name (ID)</label>
                <input
                  type="text"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="com.example.mapai"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Version Code</label>
                <input
                  type="text"
                  value={versionCode}
                  onChange={(e) => setVersionCode(e.target.value)}
                  placeholder="1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Version Name</label>
                <input
                  type="text"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  placeholder="1.0.0"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">AdMob App ID</label>
                <input
                  type="text"
                  value={admobAppId}
                  onChange={(e) => setAdmobAppId(e.target.value)}
                  placeholder="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Banner Ad Unit ID</label>
                <input
                  type="text"
                  value={admobBannerId}
                  onChange={(e) => setAdmobBannerId(e.target.value)}
                  placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Interstitial Ad Unit ID</label>
                <input
                  type="text"
                  value={admobInterstitialId}
                  onChange={(e) => setAdmobInterstitialId(e.target.value)}
                  placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Rewarded Video Ad Unit ID</label>
                <input
                  type="text"
                  value={admobRewardedId}
                  onChange={(e) => setAdmobRewardedId(e.target.value)}
                  placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono text-[11px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Code / Config Preview Output & Download */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-slate-400 text-[10px]">
              {getFileNameForExport()}
            </span>
            <button
              onClick={handleCopyManifest}
              className="text-[10px] font-bold text-cyan-400 hover:underline flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="text-[10px] font-mono text-emerald-400 bg-slate-900/90 p-2.5 rounded-xl max-h-28 overflow-y-auto custom-scrollbar border border-slate-800">
            {getCurrentSnippet()}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
          >
            Close
          </button>
          <button
            onClick={handleDownloadAppPackage}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
          >
            <Download className="w-4 h-4" />
            <span>
              {activeSubTab === 'app_builder'
                ? 'Export App Package'
                : activeSubTab === 'keystore_play'
                ? 'Save gradle.properties'
                : 'Save admob_config.properties'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

