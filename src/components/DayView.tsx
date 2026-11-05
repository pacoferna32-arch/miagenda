import React, { useMemo } from 'react';
import { Task, JournalEntry, WeightEntry, CategoryKey } from '../types';
import { DIAS_SEMANA, DIAS_COMPLETOS, MESES, CATEGORY_MAP, toIsoDate, formatNumber, JOURNAL_MOODS } from '../utils/constants';
import {
  Calendar,
  Clock,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Scale,
  Sparkles,
  AlertCircle,
  CalendarCheck,
  CalendarDays,
  Pencil,
  Trash2,
} from 'lucide-react';

interface DayViewProps {
  currentDay: Date;
  onNavigateDay: (direction: number) => void;
  onSelectDayDate: (date: Date) => void;
  tasks: Task[];
  journalEntries?: JournalEntry[];
  weights?: WeightEntry[];
  onOpenTask: (task: Task) => void;
  onAddTaskForDate: (dateStr: string, defaultHour?: string) => void;
  onToggleTask: (id: number) => void;
  onDeleteTask?: (id: number) => void;
  onOpenJournalEntry?: (dateStr: string) => void;
  onOpenWeightTracker?: (dateStr?: string) => void;
  onSwitchToWeek?: () => void;
  onSwitchToMonth?: () => void;
}

// Hourly slots from 07:00 to 23:00
const HOURS = Array.from({ length: 17 }, (_, i) => {
  const h = i + 7;
  return `${String(h).padStart(2, '0')}:00`;
});

export const DayView: React.FC<DayViewProps> = ({
  currentDay,
  onNavigateDay,
  onSelectDayDate,
  tasks,
  journalEntries = [],
  weights = [],
  onOpenTask,
  onAddTaskForDate,
  onToggleTask,
  onDeleteTask,
  onOpenJournalEntry,
  onOpenWeightTracker,
  onSwitchToWeek,
  onSwitchToMonth,
}) => {
  const dateStr = toIsoDate(currentDay);
  const todayStr = toIsoDate(new Date());
  const isToday = dateStr === todayStr;

  // Day calculations
  const dayOfWeekIndex = (currentDay.getDay() + 6) % 7; // 0 = Lunes, 6 = Domingo
  const dayNameFull = DIAS_COMPLETOS[dayOfWeekIndex];
  const dayNum = currentDay.getDate();
  const monthName = MESES[currentDay.getMonth()];
  const year = currentDay.getFullYear();

  // Mini week ribbon (Mon-Sun around current day)
  const weekRibbon = useMemo(() => {
    const monday = new Date(currentDay);
    monday.setDate(currentDay.getDate() - dayOfWeekIndex);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = toIsoDate(d);
      const dayTasks = tasks.filter((t) => t.d === iso);
      days.push({
        date: d,
        iso,
        dayName: DIAS_SEMANA[i],
        dayNum: d.getDate(),
        isCurrent: iso === dateStr,
        isToday: iso === todayStr,
        tasksCount: dayTasks.length,
        pendingCount: dayTasks.filter((t) => !t.done).length,
      });
    }
    return days;
  }, [currentDay, dayOfWeekIndex, dateStr, todayStr, tasks]);

  // Tasks for this specific day
  const dayTasks = useMemo(() => {
    return tasks
      .filter((t) => t.d === dateStr)
      .sort((a, b) => (a.h || '99:99').localeCompare(b.h || '99:99'));
  }, [tasks, dateStr]);

  const completedCount = dayTasks.filter((t) => t.done).length;
  const totalCount = dayTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Check if journal entry exists for this day
  const dayJournal = useMemo(() => {
    return journalEntries.find((j) => j.date === dateStr || j.id === dateStr);
  }, [journalEntries, dateStr]);

  // Check if weight was recorded for this day
  const dayWeight = useMemo(() => {
    return weights.find((w) => w.d === dateStr);
  }, [weights, dateStr]);

  // Group tasks by hour (e.g. "08:00" -> tasks starting with "08:")
  const tasksByHour = useMemo(() => {
    const map: Record<string, Task[]> = {};
    HOURS.forEach((h) => {
      map[h] = [];
    });

    const untimed: Task[] = [];

    dayTasks.forEach((t) => {
      if (!t.h) {
        untimed.push(t);
        return;
      }
      const hourPrefix = t.h.split(':')[0] + ':00';
      if (map[hourPrefix]) {
        map[hourPrefix].push(t);
      } else {
        // Fallback for earlier/later hours
        if (!map['untimed']) map['untimed'] = [];
        map['untimed'].push(t);
      }
    });

    return { timed: map, untimed };
  }, [dayTasks]);

  // Current time marker calculation (if today)
  const now = new Date();
  const currentHourNum = now.getHours();
  const currentMinuteNum = now.getMinutes();
  const showNowLine = isToday && currentHourNum >= 7 && currentHourNum <= 23;

  return (
    <div className="space-y-5">
      {/* Top Banner: Selected Day Header & Week Quick Strip */}
      <div className="bg-white dark:bg-[#151722] p-5 sm:p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-5">
        {/* Date Title & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#e8533a] to-amber-500 text-white flex flex-col items-center justify-center shadow-md shadow-[#e8533a]/20 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
                {dayNameFull.slice(0, 3)}
              </span>
              <span className="text-xl font-bold font-serif leading-tight">
                {dayNum}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                  {dayNameFull}, {dayNum} de {monthName}
                </h1>
                {isToday && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e8533a]/10 text-[#e8533a] border border-[#e8533a]/30">
                    Hoy
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {year} · Agenda diaria y línea de tiempo horaria
              </p>
            </div>
          </div>

          {/* Quick Day Nav & CTA */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateDay(-1)}
              className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors"
              title="Día anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {!isToday && (
              <button
                type="button"
                onClick={() => onSelectDayDate(new Date())}
                className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-colors"
              >
                Ir a hoy
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigateDay(1)}
              className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors"
              title="Día siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onAddTaskForDate(dateStr, '09:00')}
              className="px-4 py-2 rounded-xl bg-[#e8533a] hover:bg-[#d4432c] active:scale-95 text-white text-xs font-semibold shadow-md shadow-[#e8533a]/20 flex items-center gap-1.5 transition-all ml-1"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Añadir tarea hoy</span>
            </button>
          </div>
        </div>

        {/* Mini 7-Day Ribbon for quick switching */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {weekRibbon.map((d) => (
              <button
                key={d.iso}
                type="button"
                onClick={() => onSelectDayDate(d.date)}
                className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center text-center transition-all ${
                  d.isCurrent
                    ? 'bg-[#e8533a] text-white shadow-sm font-bold scale-[1.03]'
                    : d.isToday
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-[#e8533a]/40 font-semibold'
                    : 'bg-[#faf8f5] dark:bg-[#12141f] hover:bg-neutral-100 dark:hover:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-800/60'
                }`}
              >
                <span className={`text-[10px] uppercase tracking-wider ${d.isCurrent ? 'text-white/80' : 'text-neutral-400'}`}>
                  {d.dayName}
                </span>
                <span className="text-sm font-bold mt-0.5">{d.dayNum}</span>
                {d.tasksCount > 0 && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1 ${
                      d.isCurrent
                        ? 'bg-white'
                        : d.pendingCount > 0
                        ? 'bg-[#e8533a]'
                        : 'bg-emerald-500'
                    }`}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Day Summary Stats & Linked Cards (Journal / Weight) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Progress Card */}
          <div className="p-3.5 rounded-2xl bg-[#faf8f5] dark:bg-[#12141f] border border-neutral-200/60 dark:border-neutral-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
              <span className="font-semibold">Progreso del día</span>
              <span className="font-bold text-[#e8533a] tabular-nums">
                {completedCount} / {totalCount} completadas
              </span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-neutral-400">
              <span>{progressPercent}% terminado</span>
              {totalCount > 0 && completedCount === totalCount && (
                <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> ¡Todo listo!
                </span>
              )}
            </div>
          </div>

          {/* Journal Entry Shortcut if available */}
          {dayJournal ? (
            <button
              type="button"
              onClick={() => onOpenJournalEntry && onOpenJournalEntry(dateStr)}
              className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-left hover:border-purple-400 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Diario de este día</span>
                </span>
                {dayJournal.mood && (
                  <span className="text-sm">
                    {JOURNAL_MOODS[dayJournal.mood]?.emoji || '📔'}
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mt-1 truncate">
                {dayJournal.title}
              </p>
              <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                {dayJournal.content}
              </p>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenJournalEntry && onOpenJournalEntry(dateStr)}
              className="p-3.5 rounded-2xl bg-[#faf8f5] dark:bg-[#12141f] border border-dashed border-neutral-300 dark:border-neutral-700 text-left hover:border-purple-400 transition-all group flex flex-col justify-center"
            >
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="font-semibold">Sin entrada en el diario</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                Haz clic para escribir una reflexión o nota de este día
              </p>
            </button>
          )}

          {/* Weight entry if logged */}
          {dayWeight ? (
            <button
              type="button"
              onClick={() => onOpenWeightTracker && onOpenWeightTracker(dateStr)}
              className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-left hover:border-sky-400 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5" />
                  <span>Peso registrado</span>
                </span>
                <span className="text-sm font-bold font-serif text-sky-800 dark:text-sky-200">
                  {formatNumber(dayWeight.kg)} kg
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                {dayWeight.notes || 'Registro diario guardado'}
              </p>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenWeightTracker && onOpenWeightTracker(dateStr)}
              className="p-3.5 rounded-2xl bg-[#faf8f5] dark:bg-[#12141f] border border-dashed border-neutral-300 dark:border-neutral-700 text-left hover:border-sky-400 transition-all group flex flex-col justify-center"
            >
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 group-hover:text-sky-600 dark:group-hover:text-sky-400">
                <Scale className="w-3.5 h-3.5" />
                <span className="font-semibold">Control de peso</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                Registrar peso corporal de esta fecha
              </p>
            </button>
          )}
        </div>
      </div>

      {/* Untimed / All-Day Tasks (if any) */}
      {tasksByHour.untimed.length > 0 && (
        <div className="bg-white dark:bg-[#151722] p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Tareas de todo el día / Sin hora fija</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {tasksByHour.untimed.map((t) => {
              const cat = CATEGORY_MAP[t.c];
              return (
                <div
                  key={t.id}
                  onClick={() => onOpenTask(t)}
                  className={`group p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                    t.done
                      ? 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800 opacity-60'
                      : 'bg-white dark:bg-[#161824] border-neutral-200/90 dark:border-neutral-700/80 hover:shadow-xs'
                  }`}
                  style={{ borderLeftWidth: '4px', borderLeftColor: cat?.c || '#e8533a' }}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleTask(t.id);
                      }}
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                        t.done ? 'bg-emerald-600 text-white' : 'border border-neutral-300 dark:border-neutral-600'
                      }`}
                    >
                      {t.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    <span className={`text-xs font-semibold truncate flex-1 ${t.done ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                      {cat?.e} {t.t}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTask(t);
                      }}
                      className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                      title="Editar tarea"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    {onDeleteTask && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTask(t.id);
                        }}
                        className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Eliminar tarea"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Hourly Timeline Schedule */}
      <div className="bg-white dark:bg-[#151722] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-neutral-200/70 dark:border-neutral-800 bg-[#faf8f5] dark:bg-[#12141f] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-300">
            <Clock className="w-4 h-4 text-[#e8533a]" />
            <span>Horario y Planificación por Horas (07:00 – 23:00)</span>
          </div>
          <span className="text-xs text-neutral-400">
            Haz clic en cualquier hora para programar una tarea
          </span>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800/70 relative">
          {HOURS.map((hourStr) => {
            const hourTasks = tasksByHour.timed[hourStr] || [];
            const hourNum = parseInt(hourStr.split(':')[0], 10);
            const isCurrentHourSlot = showNowLine && currentHourNum === hourNum;

            return (
              <div
                key={hourStr}
                className={`flex items-start group min-h-[64px] transition-colors relative ${
                  isCurrentHourSlot ? 'bg-[#e8533a]/5 dark:bg-[#e8533a]/10' : 'hover:bg-neutral-50/70 dark:hover:bg-neutral-800/30'
                }`}
              >
                {/* Current time horizontal indicator line */}
                {isCurrentHourSlot && (
                  <div
                    className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
                    style={{ top: `${(currentMinuteNum / 60) * 100}%` }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-xs ml-16 -mr-1" />
                    <div className="h-[2px] bg-red-500/80 flex-1 shadow-xs" />
                  </div>
                )}

                {/* Hour Label */}
                <div className="w-20 sm:w-24 p-3 text-right text-xs font-mono font-semibold text-neutral-400 dark:text-neutral-500 shrink-0 select-none border-r border-neutral-100 dark:border-neutral-800/80">
                  {hourStr}
                </div>

                {/* Hour Slot Content */}
                <div className="flex-1 p-2 sm:p-2.5 min-w-0">
                  {hourTasks.length > 0 ? (
                    <div className="space-y-2">
                      {hourTasks.map((t) => {
                        const cat = CATEGORY_MAP[t.c];
                        const isHighPriority = t.priority === 'alta' || t.priority === 'urgente';

                        return (
                          <div
                            key={t.id}
                            onClick={() => onOpenTask(t)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                              t.done
                                ? 'bg-neutral-100/70 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800 opacity-60'
                                : 'bg-white dark:bg-[#161824] border-neutral-200 dark:border-neutral-700 shadow-xs hover:border-[#e8533a]/50 hover:shadow-sm'
                            }`}
                            style={{
                              borderLeftWidth: '5px',
                              borderLeftColor: cat?.c || '#e8533a',
                            }}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleTask(t.id);
                                }}
                                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-transform active:scale-90 ${
                                  t.done
                                    ? 'bg-emerald-600 text-white'
                                    : 'border-2 border-neutral-300 dark:border-neutral-600 hover:border-emerald-500'
                                }`}
                              >
                                {t.done && <Check className="w-4 h-4 stroke-[3]" />}
                              </button>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`font-semibold text-xs sm:text-sm ${
                                      t.done
                                        ? 'line-through text-neutral-500 dark:text-neutral-400'
                                        : 'text-neutral-900 dark:text-neutral-100'
                                    }`}
                                  >
                                    {t.t}
                                  </span>

                                  {cat && (
                                    <span
                                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 shrink-0"
                                      style={{ backgroundColor: `${cat.c}15`, color: cat.c }}
                                    >
                                      <span>{cat.e}</span>
                                      <span>{cat.n}</span>
                                    </span>
                                  )}

                                  {isHighPriority && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 flex items-center gap-0.5 shrink-0">
                                      <AlertCircle className="w-2.5 h-2.5" />
                                      {t.priority === 'urgente' ? 'Urgente' : 'Alta'}
                                    </span>
                                  )}
                                </div>

                                {t.n && (
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                                    {t.n}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              <span className="text-xs font-mono font-medium text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md">
                                {t.h || hourStr}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenTask(t);
                                  }}
                                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                  title="Editar tarea"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                {onDeleteTask && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteTask(t.id);
                                    }}
                                    className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                    title="Eliminar tarea"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAddTaskForDate(dateStr, hourStr)}
                      className="w-full py-2.5 rounded-xl border border-transparent hover:border-dashed hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-xs font-medium flex items-center justify-start px-3 gap-2 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#e8533a]" />
                      <span>Añadir tarea a las {hourStr}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
