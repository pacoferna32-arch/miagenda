import React, { useState, useEffect } from 'react';
import { Task, JournalEntry, WeightEntry } from '../types';
import { DIAS_SEMANA, CATEGORY_MAP, toIsoDate, formatCurrency, JOURNAL_MOODS, formatNumber } from '../utils/constants';
import { Check, Plus, X, Clock, MapPin, Scale, Pencil, Trash2 } from 'lucide-react';
import { fetchWeatherData, getSavedLocation, WeatherData } from '../utils/weather';
import { WeatherIcon } from './WeatherIcon';

interface MonthViewProps {
  currentDate: Date;
  tasks: Task[];
  journalEntries?: JournalEntry[];
  weights?: WeightEntry[];
  onOpenTask: (task: Task) => void;
  onAddTaskForDate: (dateStr: string) => void;
  onToggleTask: (id: number) => void;
  onDeleteTask?: (id: number) => void;
  onOpenJournalEntry?: (dateStr: string) => void;
  onOpenWeightTracker?: (dateStr?: string) => void;
  onOpenDayView?: (dateStr: string) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  tasks,
  journalEntries = [],
  weights = [],
  onOpenTask,
  onAddTaskForDate,
  onToggleTask,
  onDeleteTask,
  onOpenJournalEntry,
  onOpenWeightTracker,
  onOpenDayView,
}) => {
  const [selectedDayPopover, setSelectedDayPopover] = useState<{
    dateStr: string;
    dayNum: number;
    tasks: Task[];
  } | null>(null);

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  useEffect(() => {
    const load = (loc = getSavedLocation()) => {
      fetchWeatherData(loc, false)
        .then((data) => setWeatherData(data))
        .catch(() => {});
    };
    load();

    const handleLocationChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ location: any }>;
      if (customEvent.detail?.location) {
        load(customEvent.detail.location);
      }
    };
    window.addEventListener('clima_location_changed', handleLocationChange);
    return () => window.removeEventListener('clima_location_changed', handleLocationChange);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // 0 is Monday

  const totalGridCells = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;
  const todayStr = toIsoDate(new Date());

  const getDayTasks = (dateStr: string) => {
    return tasks
      .filter((t) => t && t.d === dateStr)
      .sort((a, b) => (a.h || '00:00').localeCompare(b.h || '00:00'));
  };

  return (
    <div className="relative">
      <div className="bg-white dark:bg-[#151722] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-800 bg-[#f8f6f0] dark:bg-[#1a1c2a]">
          {DIAS_SEMANA.map((dia, idx) => (
            <div
              key={dia}
              className={`py-2.5 text-center text-[11px] font-bold uppercase tracking-wider ${
                idx >= 5 ? 'text-[#e8533a] opacity-80' : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {dia}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-neutral-200/60 dark:divide-neutral-800/80">
          {Array.from({ length: totalGridCells }).map((_, i) => {
            const dayNum = i - firstDayIndex + 1;
            const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;

            if (!isCurrentMonth) {
              return (
                <div
                  key={i}
                  className="min-h-[105px] p-1.5 bg-[#faf8f5]/40 dark:bg-[#0f111a]/40 text-neutral-300 dark:text-neutral-700 pointer-events-none"
                />
              );
            }

            const dateStr = toIsoDate(new Date(year, month, dayNum));
            const isToday = dateStr === todayStr;
            const dayTasks = getDayTasks(dateStr);
            const dayJournal = journalEntries.find((j) => j && j.date === dateStr);
            const dayWeight = weights.find((w) => w && w.d === dateStr);
            const dayForecast = weatherData?.daily?.find((d) => d && d.date === dateStr);
            const maxTasks = dayJournal ? 2 : 3;
            const visibleTasks = dayTasks.slice(0, maxTasks);
            const overflowCount = dayTasks.length - maxTasks;

            return (
              <div
                key={i}
                onClick={() => onAddTaskForDate(dateStr)}
                className={`min-h-[110px] sm:min-h-[115px] p-1.5 sm:p-2 flex flex-col group cursor-pointer transition-colors relative ${
                  isToday
                    ? 'bg-[#fdfaf7] dark:bg-[#1b1c2b]'
                    : 'hover:bg-[#f6f3eb]/70 dark:hover:bg-[#1a1c2a]/60'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1 min-w-0 flex-wrap">
                    <span
                      onClick={(e) => {
                        if (onOpenDayView) {
                          e.stopPropagation();
                          onOpenDayView(dateStr);
                        }
                      }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold tabular-nums transition-transform shrink-0 cursor-pointer hover:ring-2 hover:ring-[#e8533a]/50 ${
                        isToday
                          ? 'bg-[#e8533a] text-white shadow-sm font-bold scale-105'
                          : 'text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                      title="Ver en vista diaria de este día"
                    >
                      {dayNum}
                    </span>

                    {/* Quick indicator icon for personal diary */}
                    {dayJournal && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenJournalEntry?.(dateStr);
                        }}
                        className="text-[11px] p-0.5 rounded-md hover:bg-violet-100 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 transition-colors shrink-0"
                        title="Día con entrada en el diario personal. Pulsa para ver o editar"
                      >
                        📖
                      </button>
                    )}

                    {/* Weight indicator for the day */}
                    {dayWeight && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenWeightTracker?.(dateStr);
                        }}
                        className="text-[9px] px-1 py-0.2 rounded-md font-mono font-bold bg-amber-50 dark:bg-amber-950/70 border border-amber-300/80 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center gap-0.5 hover:scale-105 transition-transform shrink-0 shadow-2xs"
                        title={`⚖️ Peso registrado: ${formatNumber(dayWeight.kg)} kg${dayWeight.notes ? ` · "${dayWeight.notes}"` : ''}\nPulsa para consultar en el Control de Peso`}
                      >
                        <span>⚖️</span>
                        <span className="hidden sm:inline">{formatNumber(dayWeight.kg)}</span>
                      </button>
                    )}

                    {/* Weather Forecast indicator for the day */}
                    {dayForecast && (
                      <span
                        className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-neutral-500 dark:text-neutral-400 font-medium pl-0.5 shrink-0"
                        title={`Previsión: ${dayForecast.tempMax}° / ${dayForecast.tempMin}°, prob. lluvia ${dayForecast.precipitationProbability}%`}
                      >
                        <WeatherIcon code={dayForecast.weatherCode} className="w-3 h-3" />
                        <span className="tabular-nums">{dayForecast.tempMax}°</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddTaskForDate(dateStr);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/70 dark:hover:bg-neutral-700/50 transition-opacity"
                    title="Añadir tarea en este día"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Task Chips & Journal Badge */}
                <div className="space-y-1 flex-1 overflow-hidden">
                  {/* Journal Entry Prominent Badge */}
                  {dayJournal && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenJournalEntry?.(dateStr);
                      }}
                      className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md flex items-center gap-1 font-semibold transition-all truncate border border-violet-300/80 dark:border-violet-700/70 bg-violet-50/90 dark:bg-violet-950/60 text-violet-800 dark:text-violet-200 hover:scale-[1.01] hover:shadow-2xs hover:border-violet-400 group/journal cursor-pointer"
                      title={`📖 Diario Personal: ${dayJournal.title || 'Entrada del día'}\nPulsa para ver o editar`}
                    >
                      <span className="shrink-0 text-[10px]">
                        {dayJournal.mood ? JOURNAL_MOODS[dayJournal.mood]?.emoji || '📖' : '📖'}
                      </span>
                      <span className="truncate flex-1 font-medium">
                        {dayJournal.title || 'Diario Personal'}
                      </span>
                      {dayJournal.drawing && <span className="text-[9px] shrink-0" title="Contiene trazo Pencil">✏️</span>}
                      {dayJournal.voiceNotes && dayJournal.voiceNotes.length > 0 && (
                        <span className="text-[9px] shrink-0" title="Contiene notas de voz">🎙️</span>
                      )}
                      {dayJournal.attachments && dayJournal.attachments.length > 0 && (
                        <span className="text-[9px] shrink-0" title="Contiene archivos adjuntos">📎</span>
                      )}
                    </div>
                  )}

                  {visibleTasks.map((t) => {
                    const cat = CATEGORY_MAP[t.c] || CATEGORY_MAP.recordatorios;
                    const displayLabel =
                      t.c === 'menus' && t.plato
                        ? t.plato
                        : t.c === 'finanzas' && t.concepto
                        ? `${t.concepto} ${t.cant ? (t.fin === 'gasto' ? '−' : '+') + formatCurrency(t.cant) : ''}`
                        : t.t;

                    return (
                      <div
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTask(t);
                        }}
                        className={`text-[11px] px-1.5 py-0.5 rounded-md flex items-center gap-1 font-medium transition-all truncate border group/item ${
                          t.done
                            ? 'opacity-40 line-through bg-neutral-100 dark:bg-neutral-800 border-transparent text-neutral-500'
                            : 'hover:scale-[1.01] hover:shadow-xs'
                        }`}
                        style={{
                          backgroundColor: t.done ? undefined : `${cat.c}14`,
                          borderColor: t.done ? undefined : `${cat.c}35`,
                          color: t.done ? undefined : cat.c,
                        }}
                        title={`${t.h} - ${displayLabel}`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleTask(t.id);
                          }}
                          className={`w-3 h-3 rounded-full border shrink-0 flex items-center justify-center transition-colors ${
                            t.done
                              ? 'bg-neutral-500 border-neutral-500 text-white'
                              : 'border-current opacity-70 hover:opacity-100'
                          }`}
                          title={t.done ? 'Marcar como pendiente' : 'Marcar como hecha'}
                        >
                          {t.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </button>
                        <span className="truncate flex-1">{displayLabel}</span>
                        {t.alarm !== null && t.alarm !== undefined && (
                          <span className="text-[9px] opacity-75 shrink-0">🔔</span>
                        )}
                        {t.ink && <span className="text-[9px] opacity-75 shrink-0">✍️</span>}
                        {onDeleteTask && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteTask(t.id);
                            }}
                            className="p-0.5 rounded hover:bg-rose-500 hover:text-white text-current opacity-60 hover:opacity-100 transition-colors shrink-0 ml-auto"
                            title="Eliminar tarea programada"
                          >
                            <X className="w-2.5 h-2.5 stroke-[2.5]" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {overflowCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDayPopover({ dateStr, dayNum, tasks: dayTasks });
                      }}
                      className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 pl-1"
                    >
                      +{overflowCount} más...
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Popover dialog for days with many tasks or journal */}
      {selectedDayPopover && (() => {
        const popoverJournal = journalEntries.find((j) => j.date === selectedDayPopover.dateStr);
        const popoverWeight = weights.find((w) => w.d === selectedDayPopover.dateStr);
        return (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs"
            onClick={() => setSelectedDayPopover(null)}
          >
            <div
              className="bg-white dark:bg-[#161824] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 w-full max-w-sm shadow-xl space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                <h4 className="font-serif font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  Día {selectedDayPopover.dayNum} de {currentDate.toLocaleString('es-ES', { month: 'long' })}
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedDayPopover(null)}
                  className="p-1 rounded text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Weight Card in Popover */}
              {popoverWeight && (
                <div
                  onClick={() => {
                    const dStr = selectedDayPopover.dateStr;
                    setSelectedDayPopover(null);
                    onOpenWeightTracker?.(dStr);
                  }}
                  className="p-2.5 rounded-xl border border-amber-300 dark:border-amber-700/70 bg-amber-50/90 dark:bg-amber-950/40 hover:border-amber-400 flex items-center justify-between gap-2.5 cursor-pointer transition-all group"
                  title="Pulsa para consultar detalles en el control de peso"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">⚖️</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-amber-950 dark:text-amber-100 flex items-center gap-1">
                        <span>Peso guardado: {formatNumber(popoverWeight.kg)} kg</span>
                      </p>
                      <p className="text-[10px] text-amber-700 dark:text-amber-300 truncate">
                        {popoverWeight.notes || 'Registro de peso diario'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-200 px-2.5 py-1 rounded-lg bg-white dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 shrink-0 group-hover:bg-[#e8533a] group-hover:text-white transition-colors">
                    Consultar peso
                  </span>
                </div>
              )}

              {/* Journal Entry Card in Popover */}
              {popoverJournal && (
                <div
                  onClick={() => {
                    const dStr = selectedDayPopover.dateStr;
                    setSelectedDayPopover(null);
                    onOpenJournalEntry?.(dStr);
                  }}
                  className="p-2.5 rounded-xl border border-violet-300 dark:border-violet-700/70 bg-violet-50/90 dark:bg-violet-950/40 hover:border-violet-400 flex items-center justify-between gap-2.5 cursor-pointer transition-all group"
                  title="Pulsa para abrir y editar en el diario"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">
                      {popoverJournal.mood ? JOURNAL_MOODS[popoverJournal.mood]?.emoji || '📖' : '📖'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-violet-950 dark:text-violet-100 truncate">
                        {popoverJournal.title || 'Entrada del Diario Personal'}
                      </p>
                      <p className="text-[10px] text-violet-700 dark:text-violet-300 truncate">
                        {popoverJournal.content ? popoverJournal.content.slice(0, 42) + '...' : 'Entrada registrada'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-200 px-2.5 py-1 rounded-lg bg-white dark:bg-violet-900/40 border border-violet-200 dark:border-violet-800 shrink-0 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    Ver / Editar
                  </span>
                </div>
              )}

              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {selectedDayPopover.tasks.length === 0 && !popoverJournal && !popoverWeight && (
                  <p className="text-xs text-neutral-400 text-center py-4">No hay tareas para este día.</p>
                )}
                {selectedDayPopover.tasks.map((t) => {
                  const cat = CATEGORY_MAP[t.c] || CATEGORY_MAP.recordatorios;
                  return (
                    <div
                      key={t.id}
                      className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                        t.done
                          ? 'bg-neutral-50 dark:bg-neutral-900 text-neutral-400 border-neutral-200 dark:border-neutral-800'
                          : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 hover:border-neutral-400'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTask(t.id);
                        }}
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          t.done ? 'bg-neutral-500 border-neutral-500 text-white' : 'border-neutral-400 hover:border-emerald-500'
                        }`}
                        title={t.done ? 'Marcar como pendiente' : 'Marcar como completada'}
                      >
                        {t.done && <Check className="w-3 h-3" />}
                      </button>
                      <span className="text-base shrink-0">{cat.e}</span>
                      <div
                        onClick={() => {
                          setSelectedDayPopover(null);
                          onOpenTask(t);
                        }}
                        className="flex-1 min-w-0 cursor-pointer"
                        title="Clic para editar esta tarea"
                      >
                        <p className={`text-xs font-semibold truncate ${t.done ? 'line-through text-neutral-400' : ''}`}>
                          {t.t}
                        </p>
                        <p className="text-[10px] text-neutral-500 flex items-center gap-1">
                          <span>{t.h}</span>
                          <span>·</span>
                          <span>{cat.n}</span>
                        </p>
                      </div>

                      {/* Action buttons: Edit & Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDayPopover(null);
                            onOpenTask(t);
                          }}
                          className="p-1 rounded-lg text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
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
                              setSelectedDayPopover((prev) =>
                                prev ? { ...prev, tasks: prev.tasks.filter((item) => item.id !== t.id) } : null
                              );
                            }}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Eliminar tarea"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2">
                {onOpenDayView && (
                  <button
                    type="button"
                    onClick={() => {
                      const dStr = selectedDayPopover.dateStr;
                      setSelectedDayPopover(null);
                      onOpenDayView(dStr);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    📅 Ver día completo
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const dStr = selectedDayPopover.dateStr;
                    setSelectedDayPopover(null);
                    onAddTaskForDate(dStr);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#e8533a] text-white text-xs font-semibold"
                >
                  ＋ Añadir tarea
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
