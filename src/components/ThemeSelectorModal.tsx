import React, { useState } from 'react';
import { UserSettings, ThemeMode, CustomThemeColors } from '../types';
import {
  THEME_PRESETS,
  DEFAULT_CUSTOM_COLORS,
  INSPIRATION_PALETTES,
  isColorDark,
  getContrastText,
} from '../utils/theme';
import { sounds } from '../utils/audio';
import {
  X,
  Palette,
  Sun,
  Moon,
  Contrast,
  BookOpen,
  Check,
  CheckCircle2,
  Sliders,
  RotateCcw,
  Sparkles,
  Eye,
  ShieldCheck,
} from 'lucide-react';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>(() =>
    settings.theme === 'custom' ? 'custom' : 'presets'
  );

  const [customColors, setCustomColors] = useState<CustomThemeColors>(() => {
    return settings.customThemeColors || DEFAULT_CUSTOM_COLORS;
  });

  if (!isOpen) return null;

  const currentTheme = settings.theme || 'light';

  const handleSelectPreset = (mode: ThemeMode) => {
    sounds.playClick();
    onUpdateSettings({ theme: mode });
  };

  const handleApplyCustom = (colors: CustomThemeColors) => {
    sounds.playClick();
    setCustomColors(colors);
    onUpdateSettings({
      theme: 'custom',
      customThemeColors: colors,
    });
  };

  const handleResetToDefault = () => {
    sounds.playClick();
    setCustomColors(DEFAULT_CUSTOM_COLORS);
    onUpdateSettings({
      theme: 'light',
      customThemeColors: DEFAULT_CUSTOM_COLORS,
    });
  };

  const presetIcons: Record<string, React.ReactNode> = {
    light: <Sun className="w-5 h-5 text-amber-500" />,
    dark: <Moon className="w-5 h-5 text-sky-400" />,
    'high-contrast': <Contrast className="w-5 h-5 text-yellow-400" />,
    sepia: <BookOpen className="w-5 h-5 text-amber-700" />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#151722] text-neutral-900 dark:text-neutral-100 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/70 dark:bg-[#1a1c29]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-[#e8533a] text-white flex items-center justify-center shadow-md shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-neutral-900 dark:text-white leading-tight">
                Temas y Paletas de Color
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Elige un tema prediseñado o personaliza los colores a tu medida
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 bg-neutral-100/50 dark:bg-[#12141e]/50 gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('presets');
              sounds.playClick();
            }}
            className={`py-3 px-4 border-b-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'presets'
                ? 'border-[#e8533a] text-[#e8533a]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Paletas Predefinidas ({THEME_PRESETS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('custom');
              sounds.playClick();
            }}
            className={`py-3 px-4 border-b-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'custom'
                ? 'border-[#e8533a] text-[#e8533a]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Colores Personalizados</span>
            {currentTheme === 'custom' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: PREDEFINED PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {THEME_PRESETS.map((preset) => {
                  const isSelected = currentTheme === preset.id;
                  const icon = presetIcons[preset.id] || <Palette className="w-5 h-5 text-[#e8533a]" />;

                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'border-[#e8533a] ring-2 ring-[#e8533a]/30 shadow-md bg-neutral-50/80 dark:bg-[#181a26]'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-[#161824]'
                      }`}
                    >
                      {/* Active Check Badge */}
                      {isSelected && (
                        <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#e8533a] text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}

                      <div className="flex items-center gap-2.5 mb-2">
                        {icon}
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                          {preset.name}
                        </h4>
                        {preset.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-400 text-black shadow-2xs">
                            {preset.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3.5 leading-relaxed">
                        {preset.desc}
                      </p>

                      {/* Visual Swatch Mini-Preview */}
                      <div
                        className="p-3 rounded-xl border flex items-center justify-between text-xs transition-colors"
                        style={{
                          backgroundColor: preset.bg,
                          color: preset.text,
                          borderColor: preset.border,
                        }}
                      >
                        <span className="font-semibold truncate max-w-[140px]">
                          Texto de ejemplo
                        </span>
                        <span
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-2xs shrink-0"
                          style={{
                            backgroundColor: preset.interactive,
                            color: preset.contrastText,
                          }}
                        >
                          Botón
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informative Note for High Contrast */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  El tema de <b>Alto Contraste</b> cumple con las directrices de accesibilidad universal <b>WCAG 2.1 nivel AAA</b>, maximizando la relación de contraste (21:1) para personas con baja visión o fatiga ocular.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM COLOR PALETTE */}
          {activeTab === 'custom' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#161824] border border-neutral-200 dark:border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-[#e8533a]" />
                    <span>Personaliza cada elemento:</span>
                  </h4>
                  <span className="text-[11px] text-neutral-500">
                    Cambios en tiempo real
                  </span>
                </div>

                {/* 3 Color Pickers: Fondo, Texto, Elementos Interactivos */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Background Color Picker */}
                  <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1a1c29] space-y-2">
                    <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
                      Color de Fondo
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customColors.bg}
                        onChange={(e) => {
                          const updated = { ...customColors, bg: e.target.value };
                          handleApplyCustom(updated);
                        }}
                        className="w-9 h-9 rounded-lg border border-neutral-300 dark:border-neutral-700 cursor-pointer shrink-0 p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={customColors.bg}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = { ...customColors, bg: val };
                          setCustomColors(updated);
                          if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                            handleApplyCustom(updated);
                          }
                        }}
                        maxLength={7}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#e8533a]"
                      />
                    </div>
                    <span className="text-[10px] text-neutral-400 block">
                      {isColorDark(customColors.bg) ? 'Tono oscuro' : 'Tono claro'}
                    </span>
                  </div>

                  {/* Text Color Picker */}
                  <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1a1c29] space-y-2">
                    <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
                      Color del Texto
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customColors.text}
                        onChange={(e) => {
                          const updated = { ...customColors, text: e.target.value };
                          handleApplyCustom(updated);
                        }}
                        className="w-9 h-9 rounded-lg border border-neutral-300 dark:border-neutral-700 cursor-pointer shrink-0 p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={customColors.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = { ...customColors, text: val };
                          setCustomColors(updated);
                          if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                            handleApplyCustom(updated);
                          }
                        }}
                        maxLength={7}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#e8533a]"
                      />
                    </div>
                    <span className="text-[10px] text-neutral-400 block">
                      Titulares y contenido
                    </span>
                  </div>

                  {/* Interactive Elements / Buttons Color Picker */}
                  <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1a1c29] space-y-2">
                    <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
                      Elementos Interactivos
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customColors.interactive}
                        onChange={(e) => {
                          const updated = { ...customColors, interactive: e.target.value };
                          handleApplyCustom(updated);
                        }}
                        className="w-9 h-9 rounded-lg border border-neutral-300 dark:border-neutral-700 cursor-pointer shrink-0 p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={customColors.interactive}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = { ...customColors, interactive: val };
                          setCustomColors(updated);
                          if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                            handleApplyCustom(updated);
                          }
                        }}
                        maxLength={7}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#e8533a]"
                      />
                    </div>
                    <span className="text-[10px] text-neutral-400 block">
                      Botones y destacados
                    </span>
                  </div>
                </div>
              </div>

              {/* LIVE PREVIEW BOX */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Vista Previa en Vivo:</span>
                  </h4>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    {currentTheme === 'custom' ? '✓ Tema personalizado activo' : 'Modo prueba'}
                  </span>
                </div>

                <div
                  className="p-5 rounded-2xl border shadow-md transition-all space-y-3"
                  style={{
                    backgroundColor: customColors.bg,
                    color: customColors.text,
                    borderColor: isColorDark(customColors.bg) ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-serif font-bold text-base">
                      Mi Agenda Personal
                    </h5>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        backgroundColor: customColors.interactive,
                        color: getContrastText(customColors.interactive),
                      }}
                    >
                      Personalizado
                    </span>
                  </div>

                  <p className="text-xs opacity-85 leading-relaxed">
                    Esta es una demostración de cómo se verán tus tarjetas de tareas, el texto de las notas y los botones principales con los colores que acabas de configurar.
                  </p>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer"
                      style={{
                        backgroundColor: customColors.interactive,
                        color: getContrastText(customColors.interactive),
                      }}
                    >
                      Botón de Acción
                    </button>
                    <span
                      className="px-3 py-2 rounded-xl text-xs border"
                      style={{
                        borderColor: isColorDark(customColors.bg) ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                      }}
                    >
                      Borde secundario
                    </span>
                  </div>
                </div>
              </div>

              {/* QUICK INSPIRATION PRESETS */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                  O prueba una paleta de inspiración con 1 clic:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {INSPIRATION_PALETTES.map((pal) => (
                    <button
                      key={pal.name}
                      type="button"
                      onClick={() => handleApplyCustom(pal)}
                      className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-[#161824] flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                        {pal.name}
                      </span>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: pal.bg }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: pal.interactive }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-[#1a1c29]/50 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer tema inicial</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#e8533a] hover:bg-[#d4432c] text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            Aplicar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
