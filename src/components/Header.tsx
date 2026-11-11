// src/components/Header.tsx
import React from 'react';
import { User } from 'firebase/auth';
import { UserSettings, CategoryKey } from '../types';
import { CATEGORY_MAP } from '../utils/constants';
import { WeatherWidget } from './WeatherWidget';
import { sounds } from '../utils/audio';
import {
  t,
  getCategoryLocalizedName,
  getLocalizedMonthName,
  getLocalizedDayName,
} from '../utils/i18n';
import {
  Menu,
  Clock,
  CalendarDays,
  Calendar,
  List,
  Inbox,
  Globe,
  Crown,
  Palette,
  Settings,
  Search,
  Plus,
  Layers,
  LogOut,
} from 'lucide-react';

export interface HeaderProps {
  activeView: 'welcome' | 'month' | 'week' | 'day' | 'list' | 'undated' | 'menus' | 'finanzas' | 'medication' | 'weight' | 'shopping' | 'journal' | 'habits';
  onSelectView: (view: 'welcome' | 'month' | 'week' | 'day' | 'list' | 'undated') => void;
  currentCategory: CategoryKey | 'all';
  currentDate: Date;
  currentDayDate: Date;
  settings: UserSettings;
  isPremium: boolean;
  user: User | null;
  onLogout: () => Promise<void>;
  onOpenMobileSidebar: () => void;
  onOpenMobileRightBar: () => void;
  onOpenNewTask: () => void;
  onOpenSearch: () => void;
  onOpenAuthModal: () => void;
  onOpenSettingsModal: (tab?: 'push' | 'language') => void;
  onOpenThemeModal: () => void;
  onOpenSubscriptionModal: () => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  activeView,
  onSelectView,
  currentCategory,
  currentDate,
  currentDayDate,
  settings,
  isPremium,
  user,
  onLogout,
  onOpenMobileSidebar,
  onOpenMobileRightBar,
  onOpenNewTask,
  onOpenSearch,
  onOpenAuthModal,
  onOpenSettingsModal,
  onOpenThemeModal,
  onOpenSubscriptionModal,
}) => {
  const currentLang = settings.language || 'es';

  return (
    <header className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 border-b border-neutral-200/90 dark:border-neutral-800 bg-white/80 dark:bg-[#151722]/80 backdrop-blur-md sticky top-0 z-20 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
      {/* Top row on mobile / Left group on desktop */}
      <div className="flex items-center justify-between gap-3 w-full lg:w-auto">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 shrink-0 cursor-pointer"
            title="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-serif font-bold text-neutral-900 dark:text-neutral-100 leading-tight truncate">
              {currentCategory === 'all'
                ? activeView === 'welcome'
                  ? 'Inicio & Bienvenida'
                  : activeView === 'journal'
                  ? t('header.journalTitle', currentLang)
                  : activeView === 'habits'
                  ? t('header.habitsTitle', currentLang)
                  : activeView === 'menus'
                  ? 'Menús Semanales'
                  : activeView === 'undated'
                  ? 'Tareas Sin Fecha'
                  : activeView === 'day'
                  ? t('header.dayTitle', currentLang)
                  : activeView === 'week'
                  ? t('header.weekTitle', currentLang)
                  : activeView === 'shopping'
                  ? t('header.shoppingTitle', currentLang)
                  : activeView === 'medication'
                  ? t('header.medicationTitle', currentLang)
                  : activeView === 'weight'
                  ? t('header.weightTitle', currentLang)
                  : activeView === 'finanzas'
                  ? t('header.financeTitle', currentLang)
                  : t('header.allTasksTitle', currentLang)
                : `${CATEGORY_MAP[currentCategory]?.e || '📌'} ${getCategoryLocalizedName(currentCategory, currentLang)}`}
            </h1>
            <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 truncate">
              {activeView === 'welcome'
                ? `Hola de nuevo, ${settings.userName || 'Paco'} · Inspiración diaria y tareas`
                : activeView === 'undated'
                ? 'Bandeja de entrada y tareas pendientes para realizar sin fecha fija en el calendario'
                : activeView === 'day'
                ? `${getLocalizedDayName((currentDayDate.getDay() + 6) % 7, true, currentLang)}, ${currentDayDate.getDate()} de ${getLocalizedMonthName(currentDayDate.getMonth(), currentLang)} ${currentDayDate.getFullYear()}`
                : `${getLocalizedMonthName(currentDate.getMonth(), currentLang)} ${currentDate.getFullYear()} · ${t('header.subtitle', currentLang)}`}
            </p>
          </div>
        </div>

        {/* Mobile / Tablet Quick CTA cluster */}
        <div className="flex items-center gap-1.5 lg:hidden shrink-0">
          <button
            type="button"
            onClick={onOpenSearch}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#161824] hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold shadow-2xs cursor-pointer"
            title="Buscar tareas (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-[#e8533a]" />
          </button>
          <button
            type="button"
            onClick={onOpenNewTask}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#e8533a] hover:bg-[#d4432c] text-white text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer"
            title={t('header.newTask', currentLang)}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">{t('header.newTask', currentLang)}</span>
          </button>
          <button
            type="button"
            onClick={onOpenMobileRightBar}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#161824] hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold shadow-2xs cursor-pointer"
            title="Abrir pestañas por categoría"
          >
            <Layers className="w-4 h-4 text-[#e8533a]" />
          </button>
        </div>
      </div>

      {/* Right Zone / Bottom row on mobile: View switcher & utility buttons */}
      <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar w-full lg:w-auto pb-1 lg:pb-0 shrink-0">
        {/* Calendar View Switcher */}
        <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800/90 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => onSelectView('day')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeView === 'day'
                ? 'bg-white dark:bg-[#161824] text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">{t('view.day', currentLang)}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectView('week')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeView === 'week'
                ? 'bg-white dark:bg-[#161824] text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 text-sky-500" />
            <span className="hidden sm:inline">{t('view.week', currentLang)}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectView('month')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeView === 'month'
                ? 'bg-white dark:bg-[#161824] text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">{t('view.month', currentLang)}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectView('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeView === 'list'
                ? 'bg-white dark:bg-[#161824] text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('view.list', currentLang)}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectView('undated')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeView === 'undated'
                ? 'bg-white dark:bg-[#161824] text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <Inbox className="w-3.5 h-3.5 text-orange-500" />
            <span className="hidden sm:inline">Sin Fecha</span>
          </button>
        </div>

        {/* Live Sync Cross-Device Badge */}
        <button
          type="button"
          onClick={onOpenAuthModal}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-colors shadow-2xs cursor-pointer"
          title="Sincronización en la nube activa."
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Sincronizado en tiempo real</span>
        </button>

        {/* Quick Access to Tab Notes & Files */}
        {currentCategory !== 'diario' && activeView !== 'journal' && (
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('tab-notes-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 text-xs font-semibold transition-all shrink-0 cursor-pointer"
            title="Ir a las Notas y Archivos de esta pestaña"
          >
            <span>📂</span>
            <span className="hidden sm:inline">Notas & Archivos</span>
            <span className="sm:hidden">Notas</span>
          </button>
        )}

        {/* Weather Pill Widget */}
        <WeatherWidget />

        {/* Quick Language Switcher Pill */}
        <button
          type="button"
          onClick={() => onOpenSettingsModal('language')}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#161824] hover:bg-neutral-50 dark:hover:bg-neutral-800/80 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          title={`${t('lang.title', currentLang)} (${currentLang.toUpperCase()})`}
        >
          <Globe className="w-3.5 h-3.5 text-[#e8533a]" />
          <span className="text-xs uppercase font-mono">{currentLang}</span>
        </button>

        {/* Lifetime Subscription & Ad Removal CTA */}
        {isPremium ? (
          <button
            type="button"
            onClick={onOpenSubscriptionModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition-colors shadow-2xs shrink-0 cursor-pointer"
            title="Suscripción Premium Vitalicia Activa"
          >
            <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="hidden md:inline">Premium Vitalicio</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenSubscriptionModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs font-bold transition-all shadow-xs shrink-0 active:scale-95 cursor-pointer"
            title="Pago único de 4,99 €: Desbloquea todas las opciones y elimina la publicidad para siempre"
          >
            <Crown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quitar anuncios (4,99 €)</span>
            <span className="sm:hidden">4,99 €</span>
          </button>
        )}

        {/* Quick Theme & Color Palette Selector Button */}
        <button
          type="button"
          onClick={onOpenThemeModal}
          className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#161824] hover:bg-neutral-50 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 transition-all shadow-2xs relative cursor-pointer"
          title={`Temas y Colores (${settings.theme === 'custom' ? 'Personalizado' : settings.theme === 'high-contrast' ? 'Alto Contraste AAA' : settings.theme === 'dark' ? 'Oscuro' : settings.theme === 'sepia' ? 'Cálido' : 'Claro'})`}
        >
          <Palette className="w-4 h-4 text-amber-500 hover:rotate-12 transition-transform duration-300" />
          {settings.theme === 'custom' && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1 right-1 animate-pulse" />
          )}
          {settings.theme === 'high-contrast' && (
            <span className="w-2 h-2 rounded-full bg-yellow-400 absolute top-1 right-1" />
          )}
        </button>

        {/* User Settings Gear CTA */}
        <button
          type="button"
          onClick={() => onOpenSettingsModal('push')}
          className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#161824] hover:bg-neutral-50 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 transition-all shadow-2xs relative cursor-pointer"
          title={t('settings.title', currentLang)}
        >
          <Settings className="w-4 h-4 text-neutral-600 dark:text-neutral-300 hover:rotate-45 transition-transform duration-300" />
          {settings.pushNotifications?.enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1 right-1" />
          )}
        </button>

        {/* Quick Interactive Search Button (Desktop) */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#161824] hover:bg-neutral-50 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 text-xs font-semibold shadow-2xs transition-all shrink-0 cursor-pointer"
          title="Búsqueda interactiva en tiempo real (Ctrl+K)"
        >
          <Search className="w-4 h-4 text-[#e8533a]" />
          <span className="hidden md:inline">Buscar</span>
          <kbd className="hidden lg:inline-block text-[9px] font-mono px-1 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500">⌘K</kbd>
        </button>

        {/* Primary Action Button (desktop) */}
        <button
          type="button"
          onClick={onOpenNewTask}
          className="hidden lg:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#e8533a] hover:bg-[#d4432c] text-white text-xs font-semibold shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t('header.newTask', currentLang)}</span>
        </button>

        {/* Authenticated User Pill */}
        <div className="flex items-center gap-1.5 p-1 pl-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#161824] shadow-2xs">
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 pr-2 hover:opacity-85 transition-opacity text-left cursor-pointer"
            title="Ver mi cuenta y detalles de sincronización"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Usuario'}
                className="w-6 h-6 rounded-full object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#e8533a] to-amber-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block leading-tight">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block max-w-[110px] truncate">
                {user?.displayName || (typeof user?.email === 'string' ? user.email.split('@')[0] : '') || 'Mi Cuenta'}
              </span>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                {user ? 'En línea' : 'Sesión local'}
              </span>
            </div>
          </button>
          {user && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                void onLogout();
              }}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
