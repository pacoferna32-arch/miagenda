import React, { useState, useEffect } from 'react';
import { Task, Medication, Habit, UserSettings } from '../types';
import { UserAvatar } from './UserAvatar';
import {
  getRandomMotivationalQuote,
  getTimeGreeting,
  MotivationalQuote,
} from '../utils/motivationalQuotes';
import { sounds } from '../utils/audio';
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  Circle,
  Plus,
  RotateCw,
  Copy,
  Check,
  Settings,
  Pill,
  Sparkles,
  ArrowRight,
  Flame,
  Sun,
  Clock,
} from 'lucide-react';

interface WelcomeViewProps {
  settings: UserSettings;
  tasks: Task[];
  medications: Medication[];
  habits: Habit[];
  onOpenSettings: (tab?: 'push' | 'language' | 'general' | 'security' | 'profile') => void;
  onNavigateView: (view: 'month' | 'week' | 'day' | 'list' | 'menus' | 'finanzas' | 'medication' | 'weight' | 'shopping' | 'journal' | 'habits') => void;
  onToggleTaskDone: (taskId: number) => void;
  onOpenNewTaskModal: (date?: string) => void;
  onOpenAndroidModal?: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  settings,
  tasks,
  medications,
  habits,
  onOpenSettings,
  onNavigateView,
  onToggleTaskDone,
  onOpenNewTaskModal,
  onOpenAndroidModal,
}) => {
  const [quote, setQuote] = useState<MotivationalQuote>(() => getRandomMotivationalQuote());
  const [isRotatingQuote, setIsRotatingQuote] = useState(false);
  const [copiedQuote, setCopiedQuote] = useState(false);

  const userName = settings.userName?.trim() || 'Amigo';
  const avatar = settings.userAvatar;
  const avatarType = settings.userAvatarType;

  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const greetingData = getTimeGreeting(userName);

  // Formatear fecha actual en español
  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  // Tareas de hoy
  const todayTasks = tasks.filter((t) => t && t.d === todayIso);
  const pendingTasks = todayTasks.filter((t) => !t.done);
  const completedTasks = todayTasks.filter((t) => t.done);

  // Medicación de hoy
  const activeMeds = medications.filter((m) => m && m.on);

  // Hábitos activos
  const activeHabits = habits.filter((h) => !h.archived);
  const habitsDoneToday = activeHabits.filter((h) => h.history?.[todayIso]);

  const handleNextQuote = () => {
    setIsRotatingQuote(true);
    sounds.playClick();
    setTimeout(() => {
      setQuote(getRandomMotivationalQuote(quote.id));
      setIsRotatingQuote(false);
    }, 200);
  };

  const handleCopyQuote = () => {
    if (!quote) return;
    navigator.clipboard.writeText(`"${quote.text}" — ${quote.author}`);
    setCopiedQuote(true);
    sounds.playClick();
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* 1. HERO & BIENVENIDA CON FOTOGRAFÍA O AVATAR */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-[#1e2130] to-neutral-900 text-white p-6 sm:p-8 md:p-10 shadow-xl border border-white/10">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#e8533a]/20 to-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          {/* Avatar con botón de edición rápida */}
          <div className="relative group shrink-0">
            <UserAvatar
              avatar={avatar}
              avatarType={avatarType}
              userName={userName}
              size="2xl"
              className="ring-4 ring-white/20 shadow-2xl transition-transform duration-300 group-hover:scale-105"
            />
            <button
              type="button"
              onClick={() => onOpenSettings('profile')}
              className="absolute -bottom-1 -right-1 p-2 rounded-full bg-[#e8533a] hover:bg-[#d4432c] text-white shadow-lg transition-transform active:scale-95 cursor-pointer"
              title="Cambiar fotografía o avatar"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Mensaje de Bienvenida y Fecha */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-amber-300 text-xs font-medium border border-white/10 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{capitalizedDate}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              {greetingData.greeting}
            </h1>

            <p className="text-sm sm:text-base text-neutral-300 max-w-xl font-normal leading-relaxed">
              Tu espacio personal de productividad y bienestar está listo. Revisa tus tareas de hoy,
              mantén el enfoque y da lo mejor de ti.
            </p>

            <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <button
                type="button"
                onClick={() => onNavigateView('month')}
                className="px-4 py-2 rounded-xl bg-white text-neutral-900 hover:bg-neutral-100 text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-[#e8533a]" />
                <span>Ver Calendario</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenNewTaskModal(todayIso)}
                className="px-4 py-2 rounded-xl bg-[#e8533a] hover:bg-[#d4432c] text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Tarea para Hoy</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenSettings('profile')}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-all border border-white/10 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-neutral-300" />
                <span>Editar Perfil</span>
              </button>

              {onOpenAndroidModal && (
                <button
                  type="button"
                  onClick={onOpenAndroidModal}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 text-xs font-bold transition-all border border-emerald-400/40 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Descargar APK oficial para instalar en Android"
                >
                  <span>🤖</span>
                  <span>Descargar APK Android</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. FRASE MOTIVADORA ELEGIDA AL AZAR */}
      <section className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#1a1c29] border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">✨</span>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider text-[11px]">
                Inspiración del Momento · Frase Motivadora
              </h2>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Elegida al azar para acompañarte e impulsarte hoy
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyQuote}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Copiar frase al portapapeles"
            >
              {copiedQuote ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">¡Copiada!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleNextQuote}
              disabled={isRotatingQuote}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              title="Ver otra frase motivadora al azar"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRotatingQuote ? 'animate-spin' : ''}`} />
              <span>Otra frase</span>
            </button>
          </div>
        </div>

        {/* Quote body */}
        <div className="pt-5 flex items-start gap-4">
          <span className="text-4xl text-[#e8533a]/30 font-serif leading-none select-none">“</span>
          <div className="space-y-2 flex-1">
            <p className="text-base sm:text-lg md:text-xl font-serif italic text-neutral-800 dark:text-neutral-100 leading-snug">
              {quote.text}
            </p>
            <p className="text-xs font-bold text-[#e8533a] dark:text-orange-400 uppercase tracking-wider">
              — {quote.author}
            </p>
          </div>
        </div>
      </section>

      {/* 3. RESUMEN INTELIGENTE DEL DÍA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card A: Tareas para Hoy */}
        <div className="md:col-span-2 rounded-2xl bg-white dark:bg-[#1a1c29] border border-neutral-200 dark:border-neutral-800 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Tareas para Hoy ({todayTasks.length})
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {completedTasks.length} completadas · {pendingTasks.length} pendientes
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateView('day')}
              className="text-xs font-bold text-[#e8533a] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver agenda del día</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todayTasks.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 space-y-3">
              <span className="text-3xl">🎉</span>
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                ¡No tienes ninguna tarea programada para hoy! Día libre o tiempo para organizarte.
              </p>
              <button
                type="button"
                onClick={() => onOpenNewTaskModal(todayIso)}
                className="px-3.5 py-1.5 rounded-xl bg-[#e8533a] hover:bg-[#d4432c] text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir tarea para hoy</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {todayTasks.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    t.done
                      ? 'bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800/60 opacity-60'
                      : 'bg-white dark:bg-[#1f2233] border-neutral-200 dark:border-neutral-700/80 shadow-2xs hover:border-[#e8533a]/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleTaskDone(t.id)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer group"
                  >
                    {t.done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-neutral-400 group-hover:text-[#e8533a] shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-semibold truncate ${
                          t.done ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-800 dark:text-neutral-100'
                        }`}
                      >
                        {t.t}
                      </p>
                      {t.h && (
                        <p className="text-[10px] text-neutral-500 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {t.h}
                          {t.priority === 'urgente' && (
                            <span className="text-rose-500 font-bold ml-1">· Urgente</span>
                          )}
                        </p>
                      )}
                    </div>
                  </button>
                </div>
              ))}

              {todayTasks.length > 5 && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigateView('day')}
                    className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium"
                  >
                    + {todayTasks.length - 5} tareas más en la agenda de hoy
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card B: Medicación y Hábitos */}
        <div className="space-y-5">
          {/* Medicación */}
          <div className="rounded-2xl bg-white dark:bg-[#1a1c29] border border-neutral-200 dark:border-neutral-800 p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                  <Pill className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Medicación ({activeMeds.length})
                </h4>
              </div>

              <button
                type="button"
                onClick={() => onNavigateView('medication')}
                className="text-[11px] font-bold text-[#e8533a] hover:underline"
              >
                Ver
              </button>
            </div>

            {activeMeds.length === 0 ? (
              <p className="text-xs text-neutral-500">Sin tomas activas programadas.</p>
            ) : (
              <div className="space-y-1.5">
                {activeMeds.slice(0, 3).map((m) => {
                  const taken = !!m.taken?.[todayIso];
                  return (
                    <div
                      key={m.id}
                      className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold truncate max-w-[120px]">{m.n}</span>
                      <span className="font-mono text-[11px] text-neutral-500">{m.h}</span>
                      {taken ? (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Tomada</span>
                      ) : (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Pendiente</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hábitos */}
          <div className="rounded-2xl bg-white dark:bg-[#1a1c29] border border-neutral-200 dark:border-neutral-800 p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Hábitos ({habitsDoneToday.length}/{activeHabits.length})
                </h4>
              </div>

              <button
                type="button"
                onClick={() => onNavigateView('habits')}
                className="text-[11px] font-bold text-[#e8533a] hover:underline"
              >
                Ver
              </button>
            </div>

            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${activeHabits.length > 0 ? (habitsDoneToday.length / activeHabits.length) * 100 : 0}%`,
                }}
              />
            </div>

            <p className="text-[11px] text-neutral-500">
              {activeHabits.length > 0
                ? `${habitsDoneToday.length} de ${activeHabits.length} hábitos completados hoy`
                : 'Crea hábitos saludables para tu día a día.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
