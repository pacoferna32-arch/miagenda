import { ThemeMode, CustomThemeColors, UserSettings } from '../types';

export interface ThemePreset {
  id: ThemeMode;
  name: string;
  desc: string;
  bg: string;
  text: string;
  interactive: string;
  surface: string;
  border: string;
  badge?: string;
  contrastText: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'light',
    name: 'Paleta Clara',
    desc: 'Limpia, luminosa y cálida para trabajar de día con máxima claridad.',
    bg: '#faf8f5',
    text: '#171717',
    interactive: '#e8533a',
    surface: '#ffffff',
    border: '#e5e7eb',
    contrastText: '#ffffff',
  },
  {
    id: 'dark',
    name: 'Paleta Oscura',
    desc: 'Medianoche profunda que reduce el brillo y la fatiga visual.',
    bg: '#0f111a',
    text: '#f3f4f6',
    interactive: '#e8533a',
    surface: '#151722',
    border: '#26293b',
    contrastText: '#ffffff',
  },
  {
    id: 'high-contrast',
    name: 'Alto Contraste',
    desc: 'Fondo negro azabache, texto blanco puro y elementos en amarillo neón (WCAG AAA).',
    bg: '#000000',
    text: '#ffffff',
    interactive: '#ffff00',
    surface: '#0d0d12',
    border: '#ffffff',
    badge: 'Accesible',
    contrastText: '#000000',
  },
  {
    id: 'sepia',
    name: 'Sepia / Cálida',
    desc: 'Papel pergamino cálido y relajante, ideal para lectura y diario íntimo.',
    bg: '#fbf0d9',
    text: '#291e14',
    interactive: '#c05621',
    surface: '#f5e6c8',
    border: '#dcc69f',
    contrastText: '#ffffff',
  },
];

export const DEFAULT_CUSTOM_COLORS: CustomThemeColors = {
  bg: '#181b2a',
  text: '#f8fafc',
  interactive: '#6366f1',
  surface: '#22263d',
  border: '#333854',
};

export interface InspirationPalette {
  name: string;
  bg: string;
  text: string;
  interactive: string;
}

export const INSPIRATION_PALETTES: InspirationPalette[] = [
  {
    name: 'Esmeralda Nocturna',
    bg: '#062c24',
    text: '#ecfdf5',
    interactive: '#10b981',
  },
  {
    name: 'Atardecer Púrpura',
    bg: '#1e1035',
    text: '#faf5ff',
    interactive: '#c084fc',
  },
  {
    name: 'Azul Zafiro',
    bg: '#0b192c',
    text: '#f0f9ff',
    interactive: '#38bdf8',
  },
  {
    name: 'Café Moca',
    bg: '#271b14',
    text: '#fef3c7',
    interactive: '#d97706',
  },
  {
    name: 'Grafito & Neón',
    bg: '#141416',
    text: '#f4f4f5',
    interactive: '#00e599',
  },
  {
    name: 'Rosa Crema',
    bg: '#fff5f7',
    text: '#4a0429',
    interactive: '#e11d48',
  },
];

/**
 * Calculate if a hex color is perceived as dark (luminance < 128)
 */
export function isColorDark(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length < 6) return false;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance < 135;
}

/**
 * Returns '#000000' or '#ffffff' based on background contrast
 */
export function getContrastText(hex: string): string {
  return isColorDark(hex) ? '#ffffff' : '#000000';
}

/**
 * Apply the selected theme and custom CSS variables to the document
 */
export function applyThemeToDocument(settings: UserSettings): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const theme = settings.theme || 'light';

  // Remove existing theme classes
  root.classList.remove('dark', 'high-contrast', 'theme-sepia', 'theme-custom');

  if (theme === 'dark') {
    root.classList.add('dark');
    root.style.removeProperty('--app-bg');
    root.style.removeProperty('--app-text');
    root.style.removeProperty('--app-interactive');
    root.style.removeProperty('--app-interactive-text');
    root.style.removeProperty('--app-surface');
  } else if (theme === 'high-contrast') {
    root.classList.add('dark', 'high-contrast');
    root.style.setProperty('--app-bg', '#000000');
    root.style.setProperty('--app-text', '#ffffff');
    root.style.setProperty('--app-interactive', '#ffff00');
    root.style.setProperty('--app-interactive-text', '#000000');
    root.style.setProperty('--app-surface', '#0a0a0f');
  } else if (theme === 'sepia') {
    root.classList.add('theme-sepia');
    root.style.setProperty('--app-bg', '#fbf0d9');
    root.style.setProperty('--app-text', '#291e14');
    root.style.setProperty('--app-interactive', '#c05621');
    root.style.setProperty('--app-interactive-text', '#ffffff');
    root.style.setProperty('--app-surface', '#f5e6c8');
  } else if (theme === 'custom') {
    root.classList.add('theme-custom');
    const custom = settings.customThemeColors || DEFAULT_CUSTOM_COLORS;
    const isDark = isColorDark(custom.bg);

    if (isDark) {
      root.classList.add('dark');
    }

    root.style.setProperty('--app-bg', custom.bg);
    root.style.setProperty('--app-text', custom.text);
    root.style.setProperty('--app-interactive', custom.interactive);
    root.style.setProperty('--app-interactive-text', getContrastText(custom.interactive));
    root.style.setProperty('--app-surface', custom.surface || (isDark ? '#1a1e30' : '#ffffff'));
  } else {
    // Light
    root.style.removeProperty('--app-bg');
    root.style.removeProperty('--app-text');
    root.style.removeProperty('--app-interactive');
    root.style.removeProperty('--app-interactive-text');
    root.style.removeProperty('--app-surface');
  }
}
