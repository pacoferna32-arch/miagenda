import React, { useState } from 'react';
import { Task, CategoryKey, PriorityLevel } from '../types';
import {
  CATEGORY_MAP,
  CATEGORIES,
  toIsoDate,
  formatCurrency,
} from '../utils/constants';
import { sounds } from '../utils/audio';
import {
  Inbox,
  Plus,
  Search,
  Check,
  Calendar,
  Trash2,
  Edit2,
  CalendarDays,
  CalendarPlus,
  Flame,
  AlertCircle,
  Filter,
  CheckCircle2,
  CircleDot,
  ArrowUpDown,
  Sparkles,
  ShoppingBag,
  Palette,
  X,
  ChevronDown,
} from 'lucide-react';

interface UndatedTasksViewProps {
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onToggleTask: (id: number) => void;
  onDeleteTask: (id: number) => void;
  onAddTask: (prefilled?: Partial<Task>) => void;
  onScheduleTask: (taskId: number, newDate: string, newTime?: string) => void;
  onQuickAdd: (title: string, category: CategoryKey, priority: PriorityLevel) => void;
}

export const UndatedTasksView: React.FC<UndatedTasksViewProps> = ({
  tasks,
  onOpenTask,
  onToggleTask,
  onDeleteTask,
  onAddTask,
  onScheduleTask,
  onQuickAdd,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [categoryFilter, setCategoryFilter] = useState<CategoryKey | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high_urgent'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority' | 'alphabetical'>('newest');

  // Quick Add state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState<CategoryKey>('recordatorios');
  const [quickPriority, setQuickPriority] = useState<PriorityLevel>('normal');

  // Schedule Popover state: taskId currently picking a date
  const [schedulingTaskId, setSchedulingTaskId] = useState<number | null>(null);
  const [customScheduleDate, setCustomScheduleDate] = useState<string>('');

  const todayIso = toIsoDate(new Date());

  // Calculate helper dates for quick scheduling
  const getTomorrowIso = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toIsoDate(d);
  };

  const getNextWeekendIso = () => {
    const d = new Date();
    const day = d.getDay(); // 0 is Sun, 6 is Sat
    const diff = (6 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return toIsoDate(d);
  };

  const getNextMondayIso = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = ((8 - day) % 7) || 7;
    d.setDate(d.getDate() + diff);
    return toIsoDate(d);
  };

  // Undated tasks list (d is empty, 'sin-fecha', or isUndated flag is true)
  const undatedTasks = tasks.filter(
    (t) => t.isUndated || !t.d || t.d === 'sin-fecha'
  );

  const pendingCount = undatedTasks.filter((t) => !t.done).length;
  const completedCount = undatedTasks.filter((t) => t.done).length;
  const urgentCount = undatedTasks.filter(
    (t) => !t.done && (t.priority === 'urgente' || t.priority === 'alta')
  ).length;

  // Filtered & sorted
  const filteredTasks = undatedTasks
    .filter((task) => {
      if (statusFilter === 'pending' && task.done) return false;
      if (statusFilter === 'completed' && !task.done) return false;

      if (categoryFilter !== 'all' && task.c !== categoryFilter) return false;

      if (priorityFilter === 'high_urgent' && task.priority !== 'alta' && task.priority !== 'urgente') {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (task.t || '').toLowerCase().includes(q);
        const matchNotes = (task.n || '').toLowerCase().includes(q);
        const matchCategory = (CATEGORY_MAP[task.c]?.n || '').toLowerCase().includes(q);
        return matchTitle || matchNotes || matchCategory;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return b.id - a.id;
      if (sortBy === 'oldest') return a.id - b.id;
      if (sortBy === 'alphabetical') return (a.t || '').localeCompare(b.t || '');
      if (sortBy === 'priority') {
        const weight = (p?: PriorityLevel) => (p === 'urgente' ? 3 : p === 'alta' ? 2 : 1);
        return weight(b.priority) - weight(a.priority);
      }
      return 0;
    });

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    sounds.playClick();
    onQuickAdd(quickTitle.trim(), quickCategory, quickPriority);
    setQuickTitle('');
  };

  const handleApplySchedule = (taskId: number, dateStr: string) => {
    if (!dateStr) return;
    sounds.playClick();
    onScheduleTask(taskId, dateStr, '10:00');
    setSchedulingTaskId(null);
    setCustomScheduleDate('');
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#1a1c29] via-[#242738] to-[#161824] text-white shadow-xl border border-neutral-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-orange-500/20 via-amber-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30">
                <Inbox className="w-3.5 h-3.5" />
                <span>Bandeja de Entrada & Backlog</span>
              </span>
              <span className="text-xs text-white/60">
                Para hacer cuando tengas tiempo
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-tight">
              Tareas Sin Fecha
            </h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Apunta ideas, proyectos y recordatorios sin atarte a un día concreto. Cuando decidas llevarlas a cabo, podrás <b>programarlas en el calendario con un solo clic</b>.
            </p>
          </div>

          {/* Quick Metrics & CTA */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="grid grid-cols-3 gap-2 bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/15 text-center text-xs">
              <div className="px-2">
                <span className="text-[10px] text-white/60 uppercase block">Total</span>
                <span className="text-base font-bold text-white">{undatedTasks.length}</span>
              </div>
              <div className="px-2 border-x border-white/10">
                <span className="text-[10px] text-white/60 uppercase block">Pendientes</span>
                <span className="text-base font-bold text-amber-300">{pendingCount}</span>
              </div>
              <div className="px-2">
                <span className="text-[10px] text-white/60 uppercase block">Urgentes</span>
                <span className="text-base font-bold text-rose-300">{urgentCount}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onAddTask({ isUndated: true, d: '', h: '' })}
              className="py-3 px-4 rounded-2xl bg-gradient-to-r from-[#e8533a] to-orange-500 hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Tarea Sin Fecha</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Bar */}
      <form
        onSubmit={handleQuickAddSubmit}
        className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#151722] border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row items-center gap-3"
      >
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="¿Qué tienes pendiente hacer? (ej. Pintar la habitación, pedir presupuesto, ordenar trastero)..."
            className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8533a]"
          />
          <Inbox className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          {/* Quick Category Select */}
          <select
            value={quickCategory}
            onChange={(e) => setQuickCategory(e.target.value as CategoryKey)}
            className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-medium focus:outline-none cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.k} value={cat.k}>
                {cat.e} {cat.n}
              </option>
            ))}
          </select>

          {/* Quick Priority */}
          <select
            value={quickPriority}
            onChange={(e) => setQuickPriority(e.target.value as PriorityLevel)}
            className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-medium focus:outline-none cursor-pointer"
          >
            <option value="normal">Normal</option>
            <option value="alta">Alta ⚠️</option>
            <option value="urgente">Urgente 🔥</option>
          </select>

          <button
            type="submit"
            disabled={!quickTitle.trim()}
            className="px-4 py-2 rounded-xl bg-[#e8533a] hover:bg-[#d4432c] text-white text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-40 cursor-pointer shrink-0"
          >
            Añadir
          </button>
        </div>
      </form>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#151722] border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tareas sin fecha..."
              className="w-full px-3 py-2 pl-9 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-xs focus:outline-none focus:ring-2 focus:ring-[#e8533a]"
            />
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 w-full sm:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-white dark:bg-[#161824] text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              Pendientes ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-white dark:bg-[#161824] text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              Completadas ({completedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-[#161824] text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              Todas ({undatedTasks.length})
            </button>
          </div>
        </div>

        {/* Secondary filters: Category, Priority, Sort */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
          <div className="flex items-center gap-1.5 text-neutral-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Categoría:</span>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium cursor-pointer"
          >
            <option value="all">Todas las categorías</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.k} value={cat.k}>
                {cat.e} {cat.n}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() =>
              setPriorityFilter((prev) => (prev === 'all' ? 'high_urgent' : 'all'))
            }
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              priorityFilter === 'high_urgent'
                ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold'
                : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>Solo Alta / Urgente</span>
          </button>

          <div className="ml-auto flex items-center gap-1.5 text-neutral-500">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium cursor-pointer"
            >
              <option value="newest">Más recientes</option>
              <option value="oldest">Más antiguas</option>
              <option value="priority">Mayor prioridad</option>
              <option value="alphabetical">Alfabético (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-dashed border-neutral-300 dark:border-neutral-800 bg-white/50 dark:bg-[#151722]/50 space-y-3">
            <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
              {searchQuery || categoryFilter !== 'all' || priorityFilter !== 'all'
                ? 'No hay tareas que coincidan con los filtros'
                : 'No tienes tareas sin fecha pendientes'}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
              Usa este apartado como tu bloc de pendientes o bandeja de entrada para ideas que harás cuando tengas disponibilidad.
            </p>
            <button
              type="button"
              onClick={() => onAddTask({ isUndated: true, d: '', h: '' })}
              className="px-4 py-2 rounded-xl bg-[#e8533a] hover:bg-[#d4432c] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              + Añadir primera tarea sin fecha
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const cat = CATEGORY_MAP[task.c] || CATEGORY_MAP.recordatorios;
            const isScheduling = schedulingTaskId === task.id;

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all ${
                  task.done
                    ? 'bg-neutral-50/60 dark:bg-neutral-900/40 border-neutral-200/60 dark:border-neutral-800/60 opacity-60'
                    : 'bg-white dark:bg-[#151722] border-neutral-200 dark:border-neutral-800 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Complete Checkbox */}
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      onToggleTask(task.id);
                    }}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                      task.done
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                        : 'border-neutral-300 dark:border-neutral-700 hover:border-[#e8533a]'
                    }`}
                  >
                    {task.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {/* Category Pill */}
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                        style={{ backgroundColor: cat.bgLight, color: cat.textLight }}
                      >
                        <span>{cat.e}</span>
                        <span>{cat.n}</span>
                      </span>

                      {/* Priority Badge */}
                      {task.priority === 'urgente' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          <span>Urgente</span>
                        </span>
                      )}
                      {task.priority === 'alta' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Alta</span>
                        </span>
                      )}

                      {/* Ink drawing indicator */}
                      {task.ink && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                          <Palette className="w-3 h-3" />
                          <span>Boceto</span>
                        </span>
                      )}

                      {/* Shopping items indicator */}
                      {task.items && task.items.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3" />
                          <span>{task.items.length} artículos</span>
                        </span>
                      )}
                    </div>

                    {/* Task Title */}
                    <h4
                      onClick={() => onOpenTask(task)}
                      className={`text-sm font-semibold text-neutral-900 dark:text-neutral-100 hover:text-[#e8533a] cursor-pointer transition-colors ${
                        task.done ? 'line-through text-neutral-400 dark:text-neutral-500' : ''
                      }`}
                    >
                      {task.t}
                    </h4>

                    {/* Notes Preview */}
                    {task.n && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                        {task.n}
                      </p>
                    )}

                    {/* Ink drawing thumbnail preview */}
                    {task.ink && (
                      <div className="mt-2">
                        <img
                          src={task.ink}
                          alt="Boceto"
                          className="h-16 w-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white"
                        />
                      </div>
                    )}

                    {/* Finance amount if applicable */}
                    {task.cant !== undefined && task.cant !== null && (
                      <span className="inline-block mt-1 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(task.cant)}
                      </span>
                    )}

                    {/* Quick Scheduling Drawer/Box if active for this task */}
                    {isScheduling && (
                      <div className="mt-3 p-3 rounded-2xl bg-orange-50/80 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/60 space-y-2 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-orange-900 dark:text-orange-200 flex items-center gap-1.5">
                            <CalendarPlus className="w-4 h-4 text-[#e8533a]" />
                            <span>Programar tarea en el calendario:</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setSchedulingTaskId(null)}
                            className="p-1 rounded text-orange-500 hover:text-orange-800"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Quick preset buttons */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => handleApplySchedule(task.id, todayIso)}
                            className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-orange-200 dark:border-neutral-700 hover:border-[#e8533a] font-semibold text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                          >
                            📅 Hoy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplySchedule(task.id, getTomorrowIso())}
                            className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-orange-200 dark:border-neutral-700 hover:border-[#e8533a] font-semibold text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                          >
                            ☀️ Mañana
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplySchedule(task.id, getNextWeekendIso())}
                            className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-orange-200 dark:border-neutral-700 hover:border-[#e8533a] font-semibold text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                          >
                            🏖️ Este Finde
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplySchedule(task.id, getNextMondayIso())}
                            className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-orange-200 dark:border-neutral-700 hover:border-[#e8533a] font-semibold text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                          >
                            🚀 Próx. Lunes
                          </button>
                        </div>

                        {/* Custom Date Input */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="date"
                            value={customScheduleDate}
                            onChange={(e) => setCustomScheduleDate(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e8533a]"
                          />
                          <button
                            type="button"
                            disabled={!customScheduleDate}
                            onClick={() => handleApplySchedule(task.id, customScheduleDate)}
                            className="px-3 py-1.5 rounded-xl bg-[#e8533a] hover:bg-[#d4432c] text-white text-xs font-bold disabled:opacity-40 transition-colors cursor-pointer"
                          >
                            Asignar Fecha
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Schedule Button */}
                    <button
                      type="button"
                      onClick={() => setSchedulingTaskId((prev) => (prev === task.id ? null : task.id))}
                      className="px-2.5 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Asignar fecha y mover al calendario"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Programar</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => onOpenTask(task)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
