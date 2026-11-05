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
} from 'lucide-react';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'pwa' | 'capacitor'>('pwa');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2500);
      });
    }
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    currentUrl
  )}&bgcolor=ffffff&color=1a1c29&margin=1`;

  const capCommands = `mkdir mi-calendario-android
cd mi-calendario-android
mkdir www
# Copia tu archivo HTML renombrado como index.html dentro de ./www/index.html

npm init -y
npm install @capacitor/core @capacitor/android @capacitor/local-notifications
npm install -D @capacitor/cli
npx cap init "Mi Calendario de Tareas" com.micalendario.tareas --web-dir=www
npx cap add android
npx cap sync
npx cap open android`;

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
              <h2 className="text-base font-serif font-bold text-neutral-900 dark:text-neutral-100">
                Instalar y Empaquetar en Android (APK)
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Instalación directa WebAPK o compilación nativa con Capacitor y Android Studio
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-6 pt-3 border-b border-neutral-200 dark:border-neutral-800 flex gap-2 bg-neutral-50/60 dark:bg-neutral-900/40">
          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'pwa'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-[#161824]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Instalación Directa (1 clic)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('capacitor')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'capacitor'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-[#161824]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Guía Capacitor + Android Studio (APK)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'pwa' ? (
            <>
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
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
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
                  📲 Cómo instalar en Android en 3 pasos:
                </h3>

                <div className="space-y-2 text-xs text-neutral-700 dark:text-neutral-300">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
                    <span className="w-5 h-5 rounded-full bg-[#1a1c29] dark:bg-white text-white dark:text-[#1a1c29] text-[10px] font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <p className="leading-snug">
                      Abre esta app en <strong>Google Chrome</strong> o <strong>Samsung Internet</strong> en tu móvil Android.
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

              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-white p-2 rounded-xl shadow-xs border border-neutral-200 shrink-0">
                  <img
                    src={qrUrl}
                    alt="Código QR para abrir en Android"
                    className="w-28 h-28 object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    <QrCode className="w-3.5 h-3.5 text-[#e8533a]" />
                    <span>¿Estás en el ordenador?</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                    Apunta con la cámara de tu móvil Android a este código QR para abrir e instalar la app en 2 segundos.
                  </p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentUrl, 'url')}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#e8533a] hover:underline pt-1"
                  >
                    {copiedKey === 'url' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'url' ? '¡Enlace copiado!' : 'Copiar enlace directo'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
                <span>¿Prefieres compilar el APK con Capacitor y Android Studio?</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('capacitor')}
                  className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <span>Ver Guía Capacitor</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </>
          ) : (
            /* Capacitor + Android Studio Guide Tab */
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                  <Cpu className="w-4 h-4" />
                  <span>Compilación de APK con Capacitor + Android Studio</span>
                </div>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Sigue estos 3 pasos para convertir tu archivo <code className="font-mono font-bold">Mi_Calendario_de_Tareas.html</code> o este proyecto React en un archivo <code className="font-mono font-bold">.apk</code> instalable.
                </p>
              </div>

              {/* Step 1: Folder Structure */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-neutral-800 dark:text-neutral-200">
                  <FolderTree className="w-4 h-4 text-[#e8533a]" />
                  <span>1. Estructura de carpetas en tu ordenador</span>
                </div>
                <pre className="p-3 rounded-xl bg-neutral-900 text-neutral-100 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`mi-calendario-android/
├── package.json
├── capacitor.config.json
├── www/
│   └── index.html   <-- Tu archivo HTML renombrado a index.html
└── android/         <-- Generado automáticamente por Capacitor`}
                </pre>
              </div>

              {/* Step 2: Terminal commands */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-neutral-800 dark:text-neutral-200">
                    <Terminal className="w-4 h-4 text-emerald-500" />
                    <span>2. Comandos de terminal (Node.js / npx cap)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(capCommands, 'cap')}
                    className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-[11px] font-semibold flex items-center gap-1"
                  >
                    {copiedKey === 'cap' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'cap' ? 'Copiado' : 'Copiar comandos'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-neutral-900 text-emerald-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                  {capCommands}
                </pre>
              </div>

              {/* Step 3: Android Studio APK Export */}
              <div className="space-y-2">
                <h4 className="font-bold text-neutral-800 dark:text-neutral-200">
                  3. Compilar y exportar el APK en Android Studio
                </h4>
                <div className="space-y-1.5 text-neutral-700 dark:text-neutral-300">
                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
                    <strong>A. Sincronización Gradle:</strong> Al abrirse Android Studio, espera a que termine la barra inferior <em>"Gradle Sync"</em>.
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
                    <strong>B. Compilar APK:</strong> En el menú superior, ve a <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>.
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
                    <strong>C. Descargar e instalar:</strong> Haz clic en <strong>locate</strong> en la notificación inferior derecha. Encontrarás tu archivo en <code className="font-mono text-[10px]">android/app/build/outputs/apk/debug/app-debug.apk</code> listo para enviar a tu móvil.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
