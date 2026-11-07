import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Smartphone,
  Download,
  CheckCircle2,
  X,
  ExternalLink,
  QrCode,
  Sparkles,
  WifiOff,
  Layers,
  Copy,
  Check,
  Terminal,
  FolderTree,
  Cpu,
  PackageCheck,
  ShieldCheck,
  ArrowDownToLine,
  Info,
} from 'lucide-react';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'apk' | 'pwa' | 'capacitor'>('apk');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const githubReleaseUrl = 'https://github.com/pacoferna32-arch/miagenda/releases/tag/v1.0-apk';
  const directApkUrl = 'https://github.com/pacoferna32-arch/miagenda/releases/download/v1.0-apk/miagenda-debug.apk';
  const localApkUrl = '/miagenda-debug.apk';

  const copyToClipboard = (text: string, key: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2500);
      });
    }
  };

  const qrApkUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    directApkUrl
  )}&bgcolor=ffffff&color=1a1c29&margin=1`;

  const capCommands = `git clone https://github.com/pacoferna32-arch/miagenda.git
cd miagenda
npm install --legacy-peer-deps
npm run build
npx cap sync android
cd android
./gradlew assembleDebug`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-[#161824] border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-sm">
              🤖
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>Instalador Android (APK Oficial)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                  v1.0 · 4.2 MB
                </span>
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Descarga directa del APK compilado con Gradle o instalación WebAPK
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-6 pt-3 border-b border-neutral-200 dark:border-neutral-800 flex gap-2 bg-neutral-50/60 dark:bg-neutral-900/40 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'apk'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-[#161824]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>Descargar APK (Recomendado)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'pwa'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-[#161824]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>WebAPK / Chrome (1 toque)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('capacitor')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'capacitor'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-[#161824]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Código & Gradle</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: APK DIRECT DOWNLOAD */}
          {activeTab === 'apk' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Primary Download Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-300 dark:border-emerald-800 space-y-4 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
                    <PackageCheck className="w-4 h-4 text-emerald-600" />
                    <span>APK Compilado Oficial · Listo para Instalar</span>
                  </div>
                  <span className="text-[11px] bg-white dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                    Android 5.1 a Android 15
                  </span>
                </div>

                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  El archivo <strong className="font-semibold text-neutral-900 dark:text-white">miagenda-debug.apk</strong> ha sido compilado mediante Gradle y ensamblado con todas las funciones activas (calendario, tareas, menús, medicación, peso, finanzas y notas).
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <a
                    href={localApkUrl}
                    download="miagenda-debug.apk"
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Descargar APK Directo (4.2 MB)</span>
                  </a>

                  <a
                    href={githubReleaseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto py-3 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <span>Ver en GitHub Releases</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* QR Code and Mobile scan */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center gap-5">
                <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-neutral-200 shrink-0">
                  <img
                    src={qrApkUrl}
                    alt="Código QR para descargar APK en Android"
                    className="w-32 h-32 object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    <QrCode className="w-4 h-4 text-[#e8533a]" />
                    <span>¿Descargar directamente en tu teléfono?</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                    Apunta con la cámara de tu móvil Android a este código QR para comenzar la descarga del APK directamente en tu terminal.
                  </p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(directApkUrl, 'direct_apk')}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#e8533a] hover:underline pt-1 cursor-pointer"
                  >
                    {copiedKey === 'direct_apk' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'direct_apk' ? '¡Enlace copiado!' : 'Copiar enlace directo de descarga'}</span>
                  </button>
                </div>
              </div>

              {/* Step by step install guide for Android */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Pasos sencillos para instalar el APK en Android:</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1">
                    <div className="w-5 h-5 rounded-full bg-[#1a1c29] dark:bg-white text-white dark:text-[#1a1c29] text-[10px] font-bold flex items-center justify-center">
                      1
                    </div>
                    <strong className="block text-neutral-800 dark:text-neutral-200 font-semibold text-[11px]">
                      Descarga el archivo
                    </strong>
                    <p className="text-[10px] text-neutral-500 leading-relaxed">
                      Pulsa el botón de arriba o escanea el QR. Se guardará <code className="font-mono">miagenda-debug.apk</code>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1">
                    <div className="w-5 h-5 rounded-full bg-[#1a1c29] dark:bg-white text-white dark:text-[#1a1c29] text-[10px] font-bold flex items-center justify-center">
                      2
                    </div>
                    <strong className="block text-neutral-800 dark:text-neutral-200 font-semibold text-[11px]">
                      Acepta el aviso de seguridad
                    </strong>
                    <p className="text-[10px] text-neutral-500 leading-relaxed">
                      Android avisará sobre archivos APK externos. Pulsa <strong>«Descargar de todos modos»</strong>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1">
                    <div className="w-5 h-5 rounded-full bg-[#1a1c29] dark:bg-white text-white dark:text-[#1a1c29] text-[10px] font-bold flex items-center justify-center">
                      3
                    </div>
                    <strong className="block text-neutral-800 dark:text-neutral-200 font-semibold text-[11px]">
                      Abre e Instala
                    </strong>
                    <p className="text-[10px] text-neutral-500 leading-relaxed">
                      Toca la notificación de descarga o busca el archivo en tus descargas y pulsa <strong>«Instalar»</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PWA WEBAPK */}
          {activeTab === 'pwa' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {isInstallable && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-300 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <span>Instalador automático listo</span>
                  </div>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300">
                    Tu navegador permite instalar la app directamente en tu dispositivo Android con un solo toque:
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      const success = await install();
                      if (success) onClose();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Instalar Aplicación en Android Ahora</span>
                  </button>
                </div>
              )}

              {isInstalled && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-emerald-800 dark:text-emerald-200 text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    <strong>¡La aplicación ya está instalada!</strong> La estás ejecutando en modo nativo independiente (Standalone / WebAPK).
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200">
                    <Layers className="w-3.5 h-3.5 text-[#e8533a]" />
                    <span>100% Nativa (WebAPK)</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Android compila un APK firmado con icono en el cajón de apps y pantalla completa sin barras.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200">
                    <WifiOff className="w-3.5 h-3.5 text-blue-500" />
                    <span>Modo sin conexión</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Funciona sin internet. Todas tus tareas, menús y datos se guardan en tu teléfono.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                  📲 Instalación desde Chrome / Samsung Internet:
                </h3>

                <div className="space-y-2 text-xs text-neutral-700 dark:text-neutral-300">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
                    <span className="w-5 h-5 rounded-full bg-[#1a1c29] dark:bg-white text-white dark:text-[#1a1c29] text-[10px] font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <p className="leading-snug">
                      Abre esta aplicación en <strong>Google Chrome</strong> en tu móvil Android.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
                    <span className="w-5 h-5 rounded-full bg-[#1a1c29] dark:bg-white text-white dark:text-[#1a1c29] text-[10px] font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <p className="leading-snug">
                      Pulsa el menú de <strong>tres puntos (⋮)</strong> en la esquina superior derecha del navegador.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
                    <span className="w-5 h-5 rounded-full bg-[#1a1c29] dark:bg-white text-white dark:text-[#1a1c29] text-[10px] font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <p className="leading-snug">
                      Selecciona <strong>«Instalar aplicación»</strong> o <strong>«Añadir a pantalla de inicio»</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CAPACITOR GUIDE */}
          {activeTab === 'capacitor' && (
            <div className="space-y-4 text-xs animate-in fade-in duration-200">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                  <Cpu className="w-4 h-4" />
                  <span>Código Fuente Android Nativo & Gradle</span>
                </div>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  El proyecto ya tiene la carpeta nativa <code className="font-mono font-bold">android/</code> configurada con Capacitor y compilable en local o mediante GitHub Actions.
                </p>
              </div>

              {/* Step 1: Clone repo */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-neutral-800 dark:text-neutral-200">
                    <Terminal className="w-4 h-4 text-emerald-500" />
                    <span>Comandos para compilar en tu ordenador</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(capCommands, 'cap')}
                    className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'cap' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'cap' ? 'Copiado' : 'Copiar comandos'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-neutral-900 text-emerald-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                  {capCommands}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1 text-neutral-700 dark:text-neutral-300">
                <strong>Ubicación del APK resultante:</strong>
                <p className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                  android/app/build/outputs/apk/debug/app-debug.apk
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
          <a
            href={githubReleaseUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Repositorio & Releases GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
