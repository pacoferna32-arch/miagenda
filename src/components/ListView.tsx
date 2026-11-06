import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { CATEGORY_MAP, DIAS_COMPLETOS, MESES, toIsoDate, formatCurrency } from '../utils/constants';
import { getMapsUrl } from '../utils/calendarExport';
import {
  Check,
  Search,
  Clock,
  MapPin,
  Trash2,
  Edit2,
  CheckCircle2,
  CircleDot,
  ListFilter,
  Flame,
} from 'lucide-react';

interface ListViewProps {
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onToggleTask: (id: number) => void;
  onDeleteTask: (id: number) => void;
  onAddTask: () => void;
}

export const ListView: React.FC<ListViewProps> = ({
  tasks,
  onOpenTask,
  onToggleTask,
  onDeleteTask,
  onAddTask,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>(() => {
    try {
      const saved = localStorage.getItem('listview-status-filter');
      if (saved === 'pending' || saved === 'completed' || saved === 'all') return saved;
    } catch {}
    return 'pending';
  });
  const [onlyHighPriority, setOnlyHighPriority] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('listview-status-filter', statusFilter);
    } catch {}
  }, [statusFilter]);

  const todayStr = toIsoDate(new Date());

  const pendingCount = tasks.filter((t) => !t.done).length;
  const completedCount = tasks.filter((t) => t.done).length;
  const totalCount = tasks.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (!task || typeof task.d !== 'string') return false;
    if (statusFilter === 'pending' && task.done) return false;
    if (statusFilter === 'completed' && !task.done) return false;

    if (onlyHighPriority && task.priority !== 'alta' && task.priority !== 'urgente') {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (task.t || '').toLowerCase().includes(q);
      const matchNotes = (task.n || '').toLowerCase().includes(q);
      const matchLoc = (task.lugar || '').toLowerCase().includes(q);
      const matchConcept = (task.concepto || '').toLowerCase().includes(q);
      const matchDish = (task.plato || '').toLowerCase().includes(q);
      return matchTitle || matchNotes || matchLoc || matchConcept || matchDish;
    }
    return true;
  });

  // Group by date
  const groupedTasks: Record<string, Task[]> = {};
  filteredTasks
    .slice()
    .sort((a, b) => ((a.d || '') + (a.h || '')).localeCompare((b.d || '') + (b.h || '')))
    .forEach((t) => {
      const dKey = t.d || todayStr;
      if (!groupedTasks[dKey]) groupedTasks[dKey] = [];
      groupedTasks[dKey].push(t);
    });

  const sortedDates = Object.keys(groupedTasks).sort();

  const getDateHeader = (dateStr: string) => {
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) {
      return {
        isToday: false,
        label: dateStr || 'Sin fecha',
      };
    }
    const dayOfWeek = DIAS_COMPLETOS[(d.getDay() + 6) % 7] || '';
    const dayNum = d.getDate();
    const monthName = MESES[d.getMonth()] || MESES[0];
    const year = d.getFullYear();

    const isToday = dateStr === todayStr;

    return {
      isToday,
      label: `${dayOfWeek}, ${dayNum} de ${monthName} ${year}`,
    };
  };

  return (
    <div className="space-y-4">
      {/* Active Focus Banner & Progress Bar */}
      <div className="bg-white dark:bg-[#151722] p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#e8533a]">
                <CircleDot className="w-3.5 h-3.5" />
                {statusFilter === 'pending'
                  ? 'Modo Enfoque: Tareas Pendientes'
                  : statusFilter === 'completed'
                  ? 'Historial de Tareas Completadas'
                  : 'Vista General de Tareas'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Tienes <strong className="text-neutral-900 dark:text-white">{pendingCount}</strong>{' '}
              {pendingCount === 1 ? 'tarea activa pendiente' : 'tareas activas pendientes'} y{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">{completedCount}</strong>{' '}
              {completedCount === 1 ? 'completada' : 'completadas'} ({completionPct}%)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Focus Switch for Pending Only */}
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-[#e8533a] text-white border-[#e8533a] shadow-xs'
                  : 'bg-[#faf8f5] dark:bg-[#12141f] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-[#e8533a]/50'
              }`}
            >
              <CircleDot className="w-3.5 h-3.5" />
              <span>{statusFilter === 'pending' ? 'Enfocado en pendientes' : 'Enfocar solo activas'}</span>
            </button>

            {/* High priority filter chip */}
            <button
              type="button"
              onClick={() => setOnlyHighPriority((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                onlyHighPriority
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-[#faf8f5] dark:bg-[#12141f] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-rose-400'
              }`}
              title="Mostrar solo tareas de prioridad Alta o Urgente"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Prioritarias</span>
            </button>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#e8533a] to-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${completionPct}%` }}
          />
        </div>

        {/* Search and Status Filter Tabs */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, lugar, nota o comida..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-[#faf8f5] dark:bg-[#12141f] text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-2 focus:ring-[#e8533a]/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status segmented control: Pendientes | Completadas | Todas */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800/90 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-white dark:bg-[#161824] text-[#e8533a] dark:text-[#ff6b52] shadow-xs font-bold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <CircleDot className="w-3.5 h-3.5" />
              <span>Pendientes</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  statusFilter === 'pending'
                    ? 'bg-[#e8533a]/15 text-[#e8533a]'
                    : 'bg-neutral-200/80 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {pendingCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-white dark:bg-[#161824] text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completadas</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-neutral-200/80 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {completedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-[#161824] text-neutral-900 dark:text-white shadow-xs font-bold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Todas</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-neutral-200/80 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                {totalCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Task List by Date */}
      {sortedDates.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-[#151722] rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <div className="text-4xl mb-3">
            {statusFilter === 'pending' ? '🎉' : statusFilter === 'completed' ? '📋' : '📭'}
          </div>
          <h3 className="text-base font-serif font-bold text-neutral-900 dark:text-neutral-100 mb-1">
            {statusFilter === 'pending'
              ? '¡Todo al día! No tienes tareas pendientes'
              : statusFilter === 'completed'
              ? 'Aún no hay tareas completadas'
              : 'No se encontraron tareas'}
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">
            {searchQuery || onlyHighPriority
              ? 'Prueba a cambiar los términos de búsqueda o desactivar el filtro de prioridad.'
              : statusFilter === 'pending' && completedCount > 0
              ? `Has completado todas tus tareas activas (${completedCount} hechas). Puedes ver el historial en la pestaña "Completadas".`
              : 'Empieza agregando tu primera tarea o recordatorio.'}
          </p>
          <div className="flex items-center justify-center gap-2">
            {statusFilter === 'pending' && completedCount > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Ver completadas ({completedCount})
              </button>
            )}
            <button
              type="button"
              onClick={onAddTask}
              className="px-4 py-2 bg-[#e8533a] hover:bg-[#d4432c] text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              ＋ Añadir tarea
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateStr) => {
            const { isToday, label } = getDateHeader(dateStr);
            const dateTasks = groupedTasks[dateStr];

            return (
              <div key={dateStr} className="space-y-2">
                {/* Date header */}
                <div className="flex items-center gap-2 pt-2">
                  {isToday ? (
                    <span className="text-xs font-bold uppercase tracking-wider text-[#e8533a] bg-[#e8533a]/10 px-2 py-0.5 rounded-md">
                      Hoy
                    </span>
                  ) : null}
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                    {label}
                  </h4>
                  <div className="flex-1 h-px bg-neutral-200 dark:border-neutral-800" />
                  <span className="text-[11px] text-neutral-400 tabular-nums">
                    {dateTasks.filter((t) => t.done).length}/{dateTasks.length} hechas
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {dateTasks.map((task) => {
                    const cat = CATEGORY_MAP[task.c] || CATEGORY_MAP.recordatorios;
                    const displayTitle =
                      task.c === 'menus' && task.plato
                        ? task.plato
                        : task.c === 'finanzas' && task.concepto
                        ? task.concepto
                        : task.t;

                    return (
                      <div
                        key={task.id}
                        onClick={() => onOpenTask(task)}
                        className={`group relative p-3 sm:p-4 rounded-xl border transition-all cursor-pointer flex items-start sm:items-center gap-3 ${
                          task.done
                            ? 'bg-[#faf8f5]/60 dark:bg-[#12141f]/40 border-neutral-200/60 dark:border-neutral-800/60 opacity-60'
                            : 'bg-white dark:bg-[#151722] border-neutral-200/90 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs hover:shadow-sm'
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleTask(task.id);
                          }}
                          className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all mt-0.5 sm:mt-0 ${
                            task.done
                              ? 'bg-neutral-800 border-neutral-800 text-white dark:bg-white dark:border-white dark:text-neutral-900'
                              : 'hover:scale-105'
                          }`}
                          style={{ borderColor: task.done ? undefined : cat.c }}
                        >
                          {task.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        {/* Category Icon */}
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                          style={{ backgroundColor: `${cat.c}15` }}
                        >
                          {cat.e}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3
                              className={`text-sm font-semibold truncate ${
                                task.done
                                  ? 'line-through text-neutral-500 dark:text-neutral-400'
                                  : 'text-neutral-900 dark:text-neutral-100'
                              }`}
                            >
                              {displayTitle}
                            </h3>

                            {/* Priority tag if high or urgent */}
                            {task.priority === 'urgente' && (
                              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded">
                                🔥 Urgente
                              </span>
                            )}
                            {task.priority === 'alta' && (
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">
                                ⚠️ Alta
                              </span>
                            )}

                            {/* Finance amount */}
                            {task.c === 'finanzas' && task.cant !== null && task.cant !== undefined && (
                              <span
                                className={`text-xs font-mono tabular-nums font-semibold ${
                                  task.fin === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {task.fin === 'ingreso' ? '+' : '−'}
                                {formatCurrency(task.cant)}
                              </span>
                            )}
                          </div>

                          {/* Zero-pill unboxed metadata with separators */}
                          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex-wrap">
                            <span>{cat.n}</span>

                            {task.lugar && (
                              <>
                                <span aria-hidden="true">·</span>
                                <a
                                  href={getMapsUrl('directions', task.lugar)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-0.5 hover:text-[#e8533a] underline truncate max-w-xs"
                                >
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{task.lugar}</span>
                                </a>
                              </>
                            )}

                            {task.n && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="truncate max-w-md">{task.n}</span>
                              </>
                            )}

                            {task.items && task.items.length > 0 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>
                                  🛒 {task.items.filter((i) => i.d).length}/{task.items.length} artículos
                                </span>
                              </>
                            )}

                            {task.ink && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-neutral-700 dark:text-neutral-300 font-medium">✍️ Nota a mano</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Right side: Time and Actions */}
                        <div className="flex items-center gap-3 shrink-0 self-center">
                          <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 font-mono tabular-nums">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{task.h}</span>
                            {task.alarm !== null && task.alarm !== undefined && (
                              <span title={`Alarma programada ${task.alarm} min antes`}>🔔</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenTask(task);
                              }}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                              title="Editar tarea"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTask(task.id);
                              }}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Eliminar tarea"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
