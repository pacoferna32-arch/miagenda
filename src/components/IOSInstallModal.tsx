import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Share,
  PlusSquare,
  Compass,
  CheckCircle2,
  X,
  QrCode,
  Sparkles,
  WifiOff,
  Copy,
  Check,
  PenTool,
  Maximize2,
} from 'lucide-react';

interface IOSInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IOSInstallModal: React.FC<IOSInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstalled, isIOS } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  // QR Code URL using QR Server for reliable scannability
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    currentUrl
  )}&bgcolor=ffffff&color=1a1c29&margin=1`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-[#161824] border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-gradient-to-r from-sky-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 dark:bg-neutral-800 text-white flex items-center justify-center text-xl shadow-xs border border-white/10">
              {/* Apple SVG Logo */}
              <svg className="w-5 h-5 fill-current" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.5-7.79-11.44-14.14-5.87-9.52-10.4-20.2-13.59-32.05-3.19-11.85-4.79-22.95-4.79-33.3 0-14.28 3.54-26.27 10.63-35.97 7.08-9.7 16.03-14.67 26.85-14.92 5.09 0 10.46 1.34 16.11 4.02 5.66 2.68 9.39 4.07 11.2 4.17 1.48-.1 5.37-1.57 11.67-4.41 6.3-2.84 11.75-4.14 16.36-3.89 12.39.73 22.42 5.48 30.08 14.24-10.84 6.57-16.13 15.62-15.86 27.15.27 9.07 3.73 16.73 10.37 22.97 6.65 6.24 14.61 9.77 23.88 10.59-2.2 6.64-4.87 13.55-8.02 20.73zM119.22 33.64c0-7.39 2.66-14.41 7.98-21.06 5.32-6.65 11.96-11.13 19.92-13.44.82 2.76 1.23 5.46 1.23 8.11 0 7.4-2.73 14.47-8.19 21.2-5.46 6.74-12.18 11.17-20.16 13.29-.27-2.65-.78-5.35-.78-8.1z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <span>Instalar en iOS</span>
                <span className="text-[11px] font-mono font-normal px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                  iPhone / iPad
                </span>
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Añade a tu pantalla de inicio como App nativa en Safari
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Active installation state badge */}
          {isInstalled && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-emerald-800 dark:text-emerald-200 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>¡App ya instalada en tu iPhone o iPad!</strong> La estás disfrutando en modo nativo independiente (Standalone) a pantalla completa.
              </span>
            </div>
          )}

          {isIOS && !isInstalled && (
            <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center gap-2.5 text-xs text-sky-800 dark:text-sky-200">
              <Sparkles className="w-4 h-4 text-sky-600 shrink-0 animate-pulse" />
              <span>
                Dispositivo iOS detectado. Sigue los 3 sencillos pasos a continuación para instalarla en tu pantalla principal.
              </span>
            </div>
          )}

          {/* Advantages on iOS */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200">
                <Maximize2 className="w-3.5 h-3.5 text-[#e8533a]" />
                <span className="text-[11px]">Pantalla Completa</span>
              </div>
              <p className="text-[10px] text-neutral-500 leading-tight">
                Sin barras de Safari. Se comporta como una app de la App Store.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200">
                <PenTool className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-[11px]">Apple Pencil</span>
              </div>
              <p className="text-[10px] text-neutral-500 leading-tight">
                Dibuja y toma notas manuscritas en tu iPad o iPhone.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200">
                <WifiOff className="w-3.5 h-3.5 text-sky-500" />
                <span className="text-[11px]">Sin Conexión</span>
              </div>
              <p className="text-[10px] text-neutral-500 leading-tight">
                Guarda tus tareas localmente aunque viajes sin cobertura.
              </p>
            </div>
          </div>

          {/* Illustrated Step by Step Guide for iOS Safari */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 flex items-center justify-between">
              <span>📋 Guía de instalación en Safari (iOS)</span>
              <span className="text-[10px] font-normal text-neutral-500">Toma 10 segundos</span>
            </h3>

            <div className="space-y-2.5 text-xs text-neutral-700 dark:text-neutral-300">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
                <span className="w-6 h-6 rounded-full bg-[#1a1c29] dark:bg-white text-white dark:text-[#1a1c29] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-white">
                    <Compass className="w-4 h-4 text-sky-500" />
                    <span>Abre la app en Safari</span>
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-snug">
                    Apple requiere que el proceso se realice desde <strong>Safari</strong>. Si la has abierto desde Chrome, WhatsApp o redes sociales, copia el enlace y pégalo en Safari.
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-[11px] font-semibold text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 transition-colors mt-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-sky-500" />}
                    <span>{copied ? '¡Enlace copiado!' : 'Copiar enlace para Safari'}</span>
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
                <span className="w-6 h-6 rounded-full bg-[#1a1c29] dark:bg-white text-white dark:text-[#1a1c29] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-white">
                    <div className="w-5 h-5 rounded-md bg-sky-500 text-white flex items-center justify-center shadow-xs">
                      <Share className="w-3.5 h-3.5" />
                    </div>
                    <span>Toca el botón «Compartir»</span>
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-snug">
                    Pulsa el icono de compartir (el cuadrado azul con una <strong>flecha hacia arriba</strong> ↑). En iPhone está en la <strong>barra inferior</strong>; en iPad está en la <strong>barra superior</strong>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
                <span className="w-6 h-6 rounded-full bg-[#1a1c29] dark:bg-white text-white dark:text-[#1a1c29] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-white">
                    <div className="w-5 h-5 rounded-md bg-neutral-800 text-white flex items-center justify-center shadow-xs">
                      <PlusSquare className="w-3.5 h-3.5" />
                    </div>
                    <span>Selecciona «Añadir a la pantalla de inicio»</span>
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-snug">
                    Desliza hacia abajo por la lista de opciones y pulsa en <strong>«Añadir a la pantalla de inicio»</strong> (icono cuadrado con un <strong>+</strong>).
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Confirma pulsando «Añadir»</span>
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-snug">
                    En la esquina superior derecha, toca <strong>«Añadir»</strong>. ¡Listo! El icono de «Mis Tareas» quedará fijado en tu pantalla de inicio junto a tus apps nativas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code to scan from iPhone / iPad */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center gap-4">
            <div className="bg-white p-2 rounded-xl shadow-xs border border-neutral-200 shrink-0">
              <img
                src={qrUrl}
                alt="Código QR para abrir en iPhone o iPad"
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                <QrCode className="w-3.5 h-3.5 text-sky-500" />
                <span>¿Estás en tu PC o Mac?</span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                Apunta con la <strong>Cámara de tu iPhone o iPad</strong> a este código QR y pulsa en la notificación amarilla para abrirlo directamente en Safari.
              </p>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline pt-0.5"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? '¡Enlace copiado al portapapeles!' : 'Copiar enlace directo'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex justify-between items-center">
          <span className="text-[11px] text-neutral-400 hidden sm:inline">
            Compatible con iOS 14, 15, 16, 17, 18+ y iPadOS
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity ml-auto"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
