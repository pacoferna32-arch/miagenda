import React from 'react';
import { Crown, Sparkles, X } from 'lucide-react';
import { sounds } from '../utils/audio';

interface AdBannerProps {
  isPremium?: boolean;
  onOpenSubscription: () => void;
  className?: string;
  variant?: 'banner' | 'sidebar' | 'compact';
}

export const AdBanner: React.FC<AdBannerProps> = ({
  isPremium,
  onOpenSubscription,
  className = '',
  variant = 'banner',
}) => {
  // If user is premium, never render ads anywhere
  if (isPremium) return null;

  if (variant === 'sidebar') {
    return (
      <div className={`p-3 rounded-2xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-rose-500/15 border border-amber-400/30 text-white space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
            <Crown className="w-3.5 h-3.5" />
            <span>Versión Gratuita</span>
          </div>
          <span className="text-[9px] text-white/50 bg-black/20 px-1.5 py-0.5 rounded font-mono">
            Anuncio
          </span>
        </div>

        <p className="text-xs font-semibold text-white/90 leading-tight">
          ¿Cansado de la publicidad? Desbloquea todas las opciones para siempre.
        </p>

        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onOpenSubscription();
          }}
          className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-[#e8533a] hover:opacity-95 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Quitar anuncios · 4,99 €</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-rose-950/30 border border-amber-300/60 dark:border-amber-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-[#e8533a] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Crown className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Elimina los anuncios y desbloquea el 100% de la app
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded uppercase">
              Pago único
            </span>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
            Sin suscripciones mensuales. Disfruta de una experiencia limpia, rápida y sin distracciones.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          sounds.playClick();
          onOpenSubscription();
        }}
        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-[#e8533a] hover:from-amber-600 hover:to-[#d4432c] text-white text-xs font-bold shadow-sm transition-all shrink-0 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
      >
        <Sparkles className="w-4 h-4 text-amber-200" />
        <span>Desbloquear por 4,99 €</span>
      </button>
    </div>
  );
};
