import React, { useRef } from 'react';
import { CategoryKey, Task, Medication, UserSettings } from '../types';
import { CATEGORIES } from '../utils/constants';
import {
  Calendar,
  CalendarDays,
  Clock,
  CheckSquare,
  UtensilsCrossed,
  ShoppingCart,
  Pill,
  Scale,
  Wallet,
  BookOpen,
  Flame,
  Sun,
  Moon,
  Download,
  Upload,
  Volume2,
  VolumeX,
  X,
  RotateCcw,
  LogOut,
  Settings,
  Crown,
  Sparkles,
  Home,
  Inbox,
  Palette,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';
import { AdBanner } from './AdBanner';
import { UserAvatar } from './UserAvatar';
import { MiniMonthlyCalendar } from './MiniMonthlyCalendar';

interface SidebarProps {
  currentCategory: CategoryKey | 'all';
  onSelectCategory: (cat: CategoryKey | 'all') => void;
  activeView: 'welcome' | 'month' | 'week' | 'day' | 'list' | 'undated' | 'menus' | 'finanzas' | 'medication' | 'weight' | 'shopping' | 'journal' | 'habits';
  onSelectView: (view: 'welcome' | 'month' | 'week' | 'day' | 'list' | 'undated' | 'menus' | 'finanzas' | 'medication' | 'weight' | 'shopping' | 'journal' | 'habits') => void;
  tasks: Task[];
  medications: Medication[];
  habitsCount?: number;
  currentDate: Date;
  onSelectDate?: (date: Date) => void;
  currentDayDate?: Date;
  onSelectDay?: (date: Date) => void;
  settings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonStr: string) => void;
  onResetData: () => void;
  onOpenAndroidModal: () => void;
  onOpenIOSModal: () => void;
  onOpenAuthModal: () => void;
  onOpenSettings?: () => void;
  onOpenThemeModal?: () => void;
  onOpenSubscription?: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentCategory,
  onSelectCategory,
  activeView,
  onSelectView,
  tasks,
  medications,
  habitsCount,
  currentDate,
  onSelectDate,
  currentDayDate,
  onSelectDay,
  settings,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
  onResetData,
  onOpenAndroidModal,
  onOpenIOSModal,
  onOpenAuthModal,
  onOpenSettings,
  onOpenThemeModal,
  onOpenSubscription,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentLang = settings.language || 'es';
  const isPremium = !!settings.premium?.isPremium;

  const currentYearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const monthTasks = tasks.filter(
    (t) => t && typeof t.d === 'string' && t.d.startsWith(currentYearMonth) && !t.done
  );
  const undatedTasksCount = tasks.filter(
    (t) => t && (t.isUndated || !t.d || t.d === 'sin-fecha') && !t.done
  ).length;

  const getCategoryCount = (key: CategoryKey) => {
    return monthTasks.filter((t) => t.c === key).length;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportBackup(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const isDarkMode = settings.theme === 'dark';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-neutral-950/60 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#1a1c29] text-white flex flex-col z-40 transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand / Logo */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onSelectCategory('all');
              onSelectView('welcome');
              onCloseMobile();
            }}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer text-left"
            title="Ir a Inicio & Bienvenida"
          >
            <span className="text-xl">📅</span>
            <div className="font-serif font-bold text-xl tracking-tight">
              Mis tareas<span className="text-[#e8533a]">·</span>
            </div>
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1 rounded-lg text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Account Bar */}
        <div className="px-3 pt-3 pb-1">
          <div className="w-full p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2 transition-colors">
            <button
              type="button"
              onClick={() => {
                onSelectView('welcome');
                onCloseMobile();
              }}
              className="flex items-center gap-2.5 flex-1 min-w-0 text-left hover:opacity-85 transition-opacity cursor-pointer"
              title="Ir a tu Página de Bienvenida y Perfil"
            >
              <UserAvatar
                avatar={settings.userAvatar || user?.photoURL || undefined}
                avatarType={settings.userAvatar ? settings.userAvatarType : (user?.photoURL ? 'upload' : 'preset')}
                userName={settings.userName || user?.displayName || user?.email?.split('@')[0] || 'Mi Cuenta'}
                size="sm"
                className="ring-1 ring-white/20"
              />

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {settings.userName || user?.displayName || user?.email?.split('@')[0] || 'Mi Cuenta'}
                </p>
                {user?.email && (
                  <p className="text-[10px] text-white/60 truncate font-mono">
                    {user.email}
                  </p>
                )}
                {isPremium ? (
                  <p className="text-[10px] text-amber-300 flex items-center gap-1 font-bold mt-0.5">
                    <Crown className="w-3 h-3 text-amber-300" />
                    Premium Vitalicio
                  </p>
                ) : (
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    {user ? 'Sincronizado' : 'Modo local'}
                  </p>
                )}
              </div>
            </button>
            {user && (
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  onCloseMobile();
                }}
                className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                title={t('header.logout', currentLang)}
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Lifetime Subscription Unlock Card (Only for free tier) */}
          {!isPremium && onOpenSubscription && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onOpenSubscription();
                  onCloseMobile();
                }}
                className="w-full p-2.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-[#e8533a]/25 border border-amber-400/50 hover:border-amber-400 text-white flex items-center gap-2.5 transition-all text-left group shadow-xs cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-[#e8533a] flex items-center justify-center text-xs text-white shrink-0 shadow-xs">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-amber-300 group-hover:text-amber-200 transition-colors">
                      Desbloquear Todo
                    </p>
                    <span className="text-[10px] font-extrabold bg-amber-400/30 text-amber-200 px-1.5 py-0.5 rounded">
                      4,99 €
                    </span>
                  </div>
                  <p className="text-[10px] text-white/70 truncate">Pago único · Sin anuncios</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Mini Calendario Mensual */}
          <div>
            <MiniMonthlyCalendar
              currentDate={currentDate}
              onSelectDate={(date) => {
                if (onSelectDate) onSelectDate(date);
              }}
              currentDayDate={currentDayDate}
              onSelectDay={(dayDate) => {
                if (onSelectDay) {
                  onSelectDay(dayDate);
                } else if (onSelectDate) {
                  onSelectDate(dayDate);
                }
                onSelectView('day');
                onCloseMobile();
              }}
              tasks={tasks}
              language={currentLang}
              onSelectView={(v) => {
                onSelectView(v);
                onCloseMobile();
              }}
            />
          </div>

          {/* Main Views */}
          <div>
            <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
              Vistas Principales
            </h4>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  onSelectCategory('all');
                  onSelectView('welcome');
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeView === 'welcome' && currentCategory === 'all'
                    ? 'bg-[#e8533a] text-white shadow-sm font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
                <span className="flex-1 text-left">Inicio & Bienvenida</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectCategory('all');
                  onSelectView('month');
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeView === 'month' && currentCategory === 'all'
                    ? 'bg-[#e8533a] text-white shadow-sm font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Calendar className="w-4 h-4 shrink-0 text-amber-400" />
                <span className="flex-1 text-left">Calendario Mes</span>
                <span className="text-[10px] tabular-nums bg-white/10 px-1.5 py-0.5 rounded-full font-mono">
                  {monthTasks.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectCategory('all');
                  onSelectView('week');
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeView === 'week' && currentCategory === 'all'
                    ? 'bg-[#e8533a] text-white shadow-sm font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <CalendarDays className="w-4 h-4 shrink-0 text-sky-400" />
                <span className="flex-1 text-left">Calendario Semana</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectCategory('all');
                  onSelectView('day');
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeView === 'day' && currentCategory === 'all'
                    ? 'bg-[#e8533a] text-white shadow-sm font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Clock className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="flex-1 text-left">Calendario Día</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectCategory('all');
                  onSelectView('list');
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeView === 'list' && currentCategory === 'all'
                    ? 'bg-[#e8533a] text-white shadow-sm font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <CheckSquare className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">Lista de Tareas</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectCategory('all');
                  onSelectView('undated');
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeView === 'undated' && currentCategory === 'all'
                    ? 'bg-[#e8533a] text-white shadow-sm font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Inbox className="w-4 h-4 shrink-0 text-orange-400" />
                <span className="flex-1 text-left">Tareas Sin Fecha</span>
                {undatedTasksCount > 0 && (
                  <span className="text-[10px] tabular-nums bg-orange-500/30 text-orange-200 px-1.5 py-0.5 rounded-full font-mono font-bold">
                    {undatedTasksCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectCategory('menus');
                  onSelectView('menus');
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeView === 'menus'
                    ? 'bg-[#e8533a] text-white shadow-sm font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4 shrink-0 text-amber-400" />
                <span className="flex-1 text-left">Menús Semanales</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectCategory('compras');
                  onSelectView('shopping');
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeView === 'shopping'
                    ? 'bg-[#e8533a] text-white shadow-sm font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <ShoppingCart className="w-4 h-4 shrink-0 text-amber-300" />
                <span className="flex-1 text-left">Lista de Compras</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectCategory('medicas');
                  onSelectView('medication');
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeView === 'medication'
                    ? 'bg-[#e8533a] text-white shadow-sm font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Pill className="w-4 h-4 shrink-0 text-pink-400" />
                <span className="flex-1 text-left">Medicación Diaria</span>
                <span className="text-[10px] tabular-nums bg-white/10 px-1.5 py-0.5 rounded-full font-mono">
                  {medications.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectCategory('medicas');
                  onSelectView('weight');
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeView === 'weight'
                    ? 'bg-[#e8533a] text-white shadow-sm font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Scale className="w-4 h-4 shrink-0 text-sky-400" />
                <span className="flex-1 text-left">Control de Peso</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectCategory('finanzas');
                  onSelectView('finanzas');
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeView === 'finanzas'
                    ? 'bg-[#e8533a] text-white shadow-sm font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Wallet className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="flex-1 text-left">Finanzas y Balance</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectView('journal');
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeView === 'journal'
                    ? 'bg-[#e8533a] text-white shadow-sm font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0 text-amber-300" />
                <span className="flex-1 text-left">Diario Personal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectCategory('habitos');
                  onSelectView('habits');
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeView === 'habits'
                    ? 'bg-[#e8533a] text-white shadow-sm font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Flame className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="flex-1 text-left">{t('nav.habits', currentLang)}</span>
                {habitsCount !== undefined && habitsCount > 0 && (
                  <span className="text-[10px] tabular-nums bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded-full font-mono">
                    {habitsCount}
                  </span>
                )}
              </button>

              {/* User Settings CTA */}
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenSettings();
                    onCloseMobile();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 shrink-0 text-amber-300" />
                  <span className="flex-1 text-left">{t('nav.settings', currentLang)}</span>
                  <span className="text-[10px] bg-white/15 px-1.5 py-0.5 rounded font-mono uppercase">
                    {currentLang}
                  </span>
                </button>
              )}



              <button
                type="button"
                onClick={() => {
                  onOpenAndroidModal();
                  onCloseMobile();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors shadow-xs cursor-pointer"
              >
                <span className="text-sm">🤖</span>
                <span className="flex-1 text-left">Descargar APK Android</span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold">
                  4.2 MB
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenIOSModal();
                  onCloseMobile();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold bg-sky-600/20 text-sky-300 border border-sky-500/30 hover:bg-sky-600/30 transition-colors shadow-xs cursor-pointer"
              >
                <span className="text-sm">🍏</span>
                <span className="flex-1 text-left">Instalar en iOS / iPhone</span>
                <span className="text-[10px] bg-sky-500/30 text-sky-200 px-1.5 py-0.5 rounded font-mono">
                  Safari
                </span>
              </button>
            </div>
          </div>

          {/* Categories Filter */}
          <div>
            <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
              Pestañas por Categoría
            </h4>
            <div className="space-y-0.5">
              {CATEGORIES.map((cat) => {
                const count = getCategoryCount(cat.k);
                const isSelected = currentCategory === cat.k && (activeView === 'month' || (cat.k === 'habitos' && activeView === 'habits'));

                return (
                  <button
                    key={cat.k}
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat.k);
                      if (cat.k === 'menus') {
                        onSelectView('menus');
                      } else if (cat.k === 'finanzas') {
                        onSelectView('finanzas');
                      } else if (cat.k === 'diario') {
                        onSelectView('journal');
                      } else if (cat.k === 'habitos') {
                        onSelectView('habits');
                      } else {
                        onSelectView('month');
                      }
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-white/15 text-white font-semibold'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.c }} />
                    <span className="text-sm shrink-0">{cat.e}</span>
                    <span className="flex-1 text-left truncate">{cat.n}</span>
                    {count > 0 && (
                      <span className="text-[10px] tabular-nums font-mono opacity-60">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar Ad / Upgrade Banner (Removed permanently for Premium users) */}
          {!isPremium && onOpenSubscription && (
            <AdBanner
              isPremium={isPremium}
              onOpenSubscription={onOpenSubscription}
              variant="sidebar"
              className="mt-3"
            />
          )}
        </div>

        {/* Sidebar Footer with Theme, Audio, Backup */}
        <div className="p-3 border-t border-white/10 space-y-2 bg-black/10">
          <div className="flex items-center justify-between px-1 gap-1">
            {/* Theme Palette Modal Trigger */}
            <button
              type="button"
              onClick={onOpenThemeModal}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/90 transition-colors cursor-pointer border border-white/5"
              title="Selector de temas y paletas de color"
            >
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>Temas</span>
              {settings.theme === 'high-contrast' && (
                <span className="text-[9px] bg-yellow-400 text-black px-1 rounded font-bold">AAA</span>
              )}
              {settings.theme === 'custom' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => onUpdateSettings({ enableSound: !settings.enableSound })}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                settings.enableSound ? 'text-white/80 hover:bg-white/10' : 'text-white/40 hover:bg-white/10'
              }`}
              title={settings.enableSound ? 'Sonido activado' : 'Sonido silenciado'}
            >
              {settings.enableSound ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Settings button */}
            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  onOpenSettings();
                  onCloseMobile();
                }}
                className="p-1.5 rounded-lg text-white/80 hover:bg-white/10 hover:text-amber-300 transition-colors cursor-pointer"
                title={t('settings.title', currentLang)}
              >
                <Settings className="w-4 h-4 text-amber-300" />
              </button>
            )}

            {/* Backup export */}
            <button
              type="button"
              onClick={onExportBackup}
              className="p-1.5 rounded-lg text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
              title="Descargar copia de seguridad (JSON)"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Backup import */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
              title="Restaurar copia de seguridad"
            >
              <Upload className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />

            {/* Reset data */}
            <button
              type="button"
              onClick={() => {
                onResetData();
              }}
              className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
              title="Limpiar datos"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
