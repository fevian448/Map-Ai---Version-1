import React, { useState, useEffect } from 'react';
import {
  Tv,
  Download,
  X,
  Laptop,
  Smartphone,
  Globe,
  Monitor,
  CheckCircle2,
  Maximize2,
  Sparkles,
  ArrowRight,
  Terminal,
  Cpu,
  Layers,
  Code2
} from 'lucide-react';

interface TvInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TvInstallModal: React.FC<TvInstallModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [activeOsTab, setActiveOsTab] = useState<'gradle' | 'react' | 'rust' | 'windows' | 'tv'>('gradle');

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        'To install MapAi on this device, click your browser menu (⋮ or Share) and select "Install App" or "Add to Home Screen".'
      );
    }
  };

  const handleToggleFullscreenTv = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative text-slate-100 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>MapAi Installation & Build Studio</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  MULTI-STACK
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Gradle • React PWA • Rust / Tauri • Windows Native • Smart TV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleInstallClick}
            className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm flex items-center justify-center gap-3 shadow-lg transition-all group"
          >
            <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>{isInstalled ? 'App Already Installed ✓' : 'Direct Browser / PWA Install'}</span>
          </button>

          <button
            onClick={handleToggleFullscreenTv}
            className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm flex items-center justify-center gap-3 shadow-md transition-all group"
          >
            <Maximize2 className="w-5 h-5 text-cyan-400 group-hover:rotate-90 transition-transform" />
            <span>Launch Smart TV Mode 📺</span>
          </button>
        </div>

        {/* Build Technology & OS Selector Tabs */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveOsTab('gradle')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeOsTab === 'gradle'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Gradle (Android)</span>
            </button>
            <button
              onClick={() => setActiveOsTab('react')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeOsTab === 'react'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>React & PWA</span>
            </button>
            <button
              onClick={() => setActiveOsTab('rust')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeOsTab === 'rust'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Rust / Tauri</span>
            </button>
            <button
              onClick={() => setActiveOsTab('windows')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeOsTab === 'windows'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>Windows</span>
            </button>
            <button
              onClick={() => setActiveOsTab('tv')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeOsTab === 'tv'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>Smart TV</span>
            </button>
          </div>

          {/* Technology Guide Content */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-xs space-y-3">
            {activeOsTab === 'gradle' && (
              <div className="space-y-2">
                <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  <span>Gradle Android Build & Installation (Android Phone, Tablet, Android TV)</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl font-mono text-[11px] text-amber-300 space-y-1">
                  <div># Run complete workflow script</div>
                  <div>./workflow.sh build</div>
                  <div className="text-slate-400"># or compile directly via Gradle wrapper</div>
                  <div>./gradlew assembleDebug</div>
                  <div>./gradlew assembleRelease</div>
                </div>
                <ul className="space-y-1.5 text-slate-300 list-disc list-inside leading-relaxed pt-1">
                  <li>
                    <strong className="text-white">Output APK:</strong> <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-300">app/build/outputs/apk/debug/app-debug.apk</code>
                  </li>
                  <li>
                    <strong className="text-white">Sideload Installation:</strong> Copy the generated APK to any Android smartphone, Huawei (HarmonyOS) device, or Android TV box via USB or ADB.
                  </li>
                </ul>
              </div>
            )}

            {activeOsTab === 'react' && (
              <div className="space-y-2">
                <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  <span>React 18 + Vite PWA Build (All Browsers & Mobile OS)</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl font-mono text-[11px] text-amber-300 space-y-1">
                  <div># Install frontend dependencies</div>
                  <div>npm install</div>
                  <div className="text-slate-400"># Build production web bundle</div>
                  <div>npm run build</div>
                </div>
                <ul className="space-y-1.5 text-slate-300 list-disc list-inside leading-relaxed pt-1">
                  <li>
                    <strong className="text-white">Chrome / Edge / Safari / Brave:</strong> Open site and click <span className="text-cyan-300">"Install MapAi"</span> or <span className="text-cyan-300">"Add to Home Screen"</span> for native app wrapper.
                  </li>
                  <li>
                    <strong className="text-white">Full Offline Capabilities:</strong> Built-in Service Worker and Web Manifest ensure background offline navigation capability.
                  </li>
                </ul>
              </div>
            )}

            {activeOsTab === 'rust' && (
              <div className="space-y-2">
                <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" />
                  <span>Rust + Tauri High Performance Native Desktop App (Windows, Mac, Linux)</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl font-mono text-[11px] text-amber-300 space-y-1">
                  <div># Add Tauri CLI & Rust toolchain</div>
                  <div>cargo install tauri-cli</div>
                  <div className="text-slate-400"># Build native Rust binary installer</div>
                  <div>cargo tauri build</div>
                </div>
                <ul className="space-y-1.5 text-slate-300 list-disc list-inside leading-relaxed pt-1">
                  <li>
                    <strong className="text-white">Ultra Lightweight:</strong> Memory usage &lt; 30MB with native C++/Rust Webview2 engine.
                  </li>
                  <li>
                    <strong className="text-white">Supported Binaries:</strong> Generates <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-300">.exe</code> (Windows), <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-300">.deb / .AppImage</code> (Linux), and <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-300">.dmg</code> (macOS).
                  </li>
                </ul>
              </div>
            )}

            {activeOsTab === 'windows' && (
              <div className="space-y-2">
                <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <Laptop className="w-4 h-4" />
                  <span>Windows 10 / 11 Native Executable & PWA App</span>
                </div>
                <ul className="space-y-1.5 text-slate-300 list-disc list-inside leading-relaxed">
                  <li>
                    <strong className="text-white">Option A (Direct PWA):</strong> Click <span className="text-cyan-300">"Direct Browser / PWA Install"</span> above in Edge/Chrome to install as a standalone Windows taskbar app.
                  </li>
                  <li>
                    <strong className="text-white">Option B (Windows .exe bundle):</strong> Package via Rust Tauri (<code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">cargo tauri build</code>) or Electron (<code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">npx electron-builder</code>) to create a setup wizardinstaller.
                  </li>
                </ul>
              </div>
            )}

            {activeOsTab === 'tv' && (
              <div className="space-y-2">
                <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4" />
                  <span>Smart TV Mode (Android TV, Fire TV, WebOS, Tizen, Apple TV)</span>
                </div>
                <ul className="space-y-1.5 text-slate-300 list-disc list-inside leading-relaxed">
                  <li>
                    <strong className="text-white">10ft Big Screen View:</strong> Tap <span className="text-cyan-300">"Launch Smart TV Mode 📺"</span> above to toggle full-screen interface optimized for TV remote controls.
                  </li>
                  <li>
                    <strong className="text-white">Android TV / Fire TV:</strong> Use Silk Browser or install the APK compiled via Gradle.
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Gradle, React, Rust/Tauri & Windows Build Ready</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all flex items-center gap-1"
          >
            <span>Close</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

