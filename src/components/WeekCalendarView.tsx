import React, { useMemo } from 'react';
import { Task, JournalEntry, WeightEntry } from '../types';
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
  CalendarDays,
  ExternalLink,
  Pencil,
  Trash2,
} from 'lucide-react';

interface WeekCalendarViewProps {
  currentWeekStart: Date;
  onNavigateWeek: (direction: number) => void;
  onSelectDayDate: (date: Date) => void;
  tasks: Task[];
  journalEntries?: JournalEntry[];
  weights?: WeightEntry[];
  onOpenTask: (task: Task) => void;
  onAddTaskForDate: (dateStr: string) => void;
  onToggleTask: (id: number) => void;
  onDeleteTask?: (id: number) => void;
  onOpenJournalEntry?: (dateStr: string) => void;
  onOpenWeightTracker?: (dateStr?: string) => void;
}

export const WeekCalendarView: React.FC<WeekCalendarViewProps> = ({
  currentWeekStart,
  onNavigateWeek,
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
}) => {
  const todayStr = toIsoDate(new Date());

  // Generate 7 days of the week starting from currentWeekStart (Monday)
  const days = useMemo(() => {
    const list = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      const iso = toIsoDate(d);

      const dayTasks = tasks
        .filter((t) => t.d === iso)
        .sort((a, b) => (a.h || '99:99').localeCompare(b.h || '99:99'));

      const journal = journalEntries.find((j) => j.date === iso || j.id === iso);
      const weight = weights.find((w) => w.d === iso);

      list.push({
        date: d,
        iso,
        dayNameShort: DIAS_SEMANA[i],
        dayNameFull: DIAS_COMPLETOS[i],
        dayNum: d.getDate(),
        monthNum: d.getMonth(),
        year: d.getFullYear(),
        isToday: iso === todayStr,
        tasks: dayTasks,
        completedCount: dayTasks.filter((t) => t.done).length,
        totalCount: dayTasks.length,
        journal,
        weight,
      });
    }
    return list;
  }, [currentWeekStart, tasks, journalEntries, weights, todayStr]);

  // Total week stats
  const totalWeekTasks = useMemo(() => {
    return days.reduce((sum, d) => sum + d.totalCount, 0);
  }, [days]);

  const completedWeekTasks = useMemo(() => {
    return days.reduce((sum, d) => sum + d.completedCount, 0);
  }, [days]);

  const weekProgressPercent = totalWeekTasks > 0 ? Math.round((completedWeekTasks / totalWeekTasks) * 100) : 0;

  const firstDay = days[0];
  const lastDay = days[6];
  const weekLabel = `${firstDay.dayNum} de ${MESES[firstDay.monthNum]} - ${lastDay.dayNum} de ${MESES[lastDay.monthNum]} ${lastDay.year}`;

  return (
    <div className="space-y-5">
      {/* Week Header & Overview Banner */}
      <div className="bg-white dark:bg-[#151722] p-5 sm:p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#3b6cb5] to-sky-400 text-white flex items-center justify-center shadow-md shadow-[#3b6cb5]/20 text-xl font-bold shrink-0">
              <CalendarDays className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                  Semana: {weekLabel}
                </h1>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Vista de 7 días (Lunes a Domingo) con desglose de tareas, citas y eventos
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateWeek(-1)}
              className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const day = (now.getDay() + 6) % 7;
                const start = new Date(now);
                start.setDate(now.getDate() - day);
                onSelectDayDate(start);
              }}
              className="px-3.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-colors"
            >
              Esta semana
            </button>

            <button
              type="button"
              onClick={() => onNavigateWeek(1)}
              className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors"
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekly Completion Bar */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
            <span className="font-semibold">Resumen de la semana:</span>
            <span className="font-bold text-[#e8533a] tabular-nums">
              {completedWeekTasks} de {totalWeekTasks} tareas completadas ({weekProgressPercent}%)
            </span>
          </div>

          <div className="flex-1 max-w-xs bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${weekProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 7 Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {days.map((day) => (
          <div
            key={day.iso}
            className={`flex flex-col rounded-3xl border transition-all ${
              day.isToday
                ? 'bg-white dark:bg-[#151722] border-[#e8533a]/60 shadow-md ring-1 ring-[#e8533a]/30'
                : 'bg-white dark:bg-[#151722] border-neutral-200/80 dark:border-neutral-800 shadow-xs'
            }`}
          >
            {/* Column Header */}
            <div
              className={`p-3.5 border-b rounded-t-3xl transition-colors cursor-pointer group ${
                day.isToday
                  ? 'bg-[#e8533a]/10 dark:bg-[#e8533a]/15 border-[#e8533a]/30'
                  : 'bg-[#faf8f5] dark:bg-[#12141f] border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100/70'
              }`}
              onClick={() => onSelectDayDate(day.date)}
              title="Clic para ver este día en detalle"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200">
                    {day.dayNameShort}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className={`text-xl font-bold font-serif ${
                        day.isToday ? 'text-[#e8533a]' : 'text-neutral-900 dark:text-neutral-100'
                      }`}
                    >
                      {day.dayNum}
                    </span>
                    {day.isToday && (
                      <span className="text-[10px] font-bold text-[#e8533a]">Hoy</span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold">
                    {day.completedCount}/{day.totalCount}
                  </span>
                </div>
              </div>

              {/* Day badges (Journal / Weight) */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {day.journal && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenJournalEntry && onOpenJournalEntry(day.iso);
                    }}
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 flex items-center gap-1 hover:opacity-80"
                    title={`Diario: ${day.journal.title}`}
                  >
                    <BookOpen className="w-2.5 h-2.5" />
                    <span>Diario</span>
                  </button>
                )}

                {day.weight && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenWeightTracker && onOpenWeightTracker(day.iso);
                    }}
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 flex items-center gap-1 hover:opacity-80"
                    title={`Peso: ${formatNumber(day.weight.kg)} kg`}
                  >
                    <Scale className="w-2.5 h-2.5" />
                    <span>{formatNumber(day.weight.kg)}kg</span>
                  </button>
                )}
              </div>
            </div>

            {/* Column Body: Task list */}
            <div className="p-2.5 flex-1 space-y-2 min-h-[220px]">
              {day.tasks.length === 0 ? (
                <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-3 text-neutral-300 dark:text-neutral-600 text-xs">
                  <p className="text-[11px]">Sin tareas</p>
                </div>
              ) : (
                day.tasks.map((t) => {
                  const cat = CATEGORY_MAP[t.c];
                  const isHighPriority = t.priority === 'alta' || t.priority === 'urgente';

                  return (
                    <div
                      key={t.id}
                      onClick={() => onOpenTask(t)}
                      className={`group p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                        t.done
                          ? 'bg-neutral-100/60 dark:bg-neutral-800/40 border-neutral-200/60 dark:border-neutral-800/60 opacity-60'
                          : 'bg-white dark:bg-[#161824] border-neutral-200/90 dark:border-neutral-700/80 shadow-2xs hover:shadow-xs hover:border-[#e8533a]/40'
                      }`}
                      style={{
                        borderLeftWidth: '4px',
                        borderLeftColor: cat?.c || '#e8533a',
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleTask(t.id);
                          }}
                          className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center shrink-0 ${
                            t.done
                              ? 'bg-emerald-600 text-white'
                              : 'border border-neutral-300 dark:border-neutral-600 hover:border-emerald-500'
                          }`}
                        >
                          {t.done && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-semibold leading-tight line-clamp-2 ${
                              t.done
                                ? 'line-through text-neutral-500 dark:text-neutral-400'
                                : 'text-neutral-900 dark:text-neutral-100'
                            }`}
                          >
                            {t.t}
                          </p>

                          <div className="flex items-center justify-between gap-1 mt-1 text-[10px] text-neutral-500">
                            <div className="flex items-center gap-1">
                              {t.h && (
                                <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 py-0.2 rounded font-medium">
                                  {t.h}
                                </span>
                              )}
                              {cat && <span>{cat.e}</span>}
                              {isHighPriority && (
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Alta prioridad" />
                              )}
                            </div>

                            {/* Quick edit & delete buttons */}
                            <div className="flex items-center gap-0.5 shrink-0">
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
                                  className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                  title="Eliminar tarea"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Add Button at bottom of day column */}
            <div className="p-2 border-t border-neutral-100 dark:border-neutral-800/80">
              <button
                type="button"
                onClick={() => onAddTaskForDate(day.iso)}
                className="w-full py-1.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-[#e8533a] hover:bg-[#e8533a]/5 text-neutral-500 dark:text-neutral-400 hover:text-[#e8533a] text-xs font-semibold flex items-center justify-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Añadir</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
