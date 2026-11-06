import React, { useState, useMemo } from 'react';
import { Habit } from '../types';
import { POPULAR_HABIT_TEMPLATES, HabitTemplate, DIAS_SEMANA, MESES, toIsoDate } from '../utils/constants';
import { sounds } from '../utils/audio';
import {
  Flame,
  Plus,
  Check,
  Trophy,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  TrendingUp,
  Award,
  Layers,
  X,
  Target,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface HabitTrackerViewProps {
  habits: Habit[];
  onAddHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => Promise<void>;
  onToggleHabit: (habitId: string, dateStr: string) => Promise<void>;
  onUpdateHabit: (habitId: string, habitData: Partial<Habit>) => Promise<void>;
  onDeleteHabit: (habitId: string) => Promise<void>;
  onRequireAuth: () => void;
}

const PRESET_COLORS = [
  '#059669', // Emerald
  '#0284c7', // Sky
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#e8533a', // Coral
  '#10b981', // Green
  '#6366f1', // Indigo
];

const PRESET_EMOJIS = ['💧', '🏃', '📚', '🧘', '🛌', '🥗', '📵', '✍️', '🍎', '🚴', '💊', '🧹', '🍵', '🎯', '💪', '🎨', '🧠', '🌿'];

export const HabitTrackerView: React.FC<HabitTrackerViewProps> = ({
  habits,
  onAddHabit,
  onToggleHabit,
  onUpdateHabit,
  onDeleteHabit,
  onRequireAuth,
}) => {
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly' | 'stats'>('weekly');
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => new Date());

  // Week navigation (Starts on Monday)
  const [currentWeekOffset, setCurrentWeekOffset] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formEmoji, setFormEmoji] = useState('🔥');
  const [formColor, setFormColor] = useState('#059669');
  const [formCategory, setFormCategory] = useState('Salud');
  const [formFrequency, setFormFrequency] = useState<'daily' | 'weekdays' | 'weekends'>('daily');
  const [formTargetCount, setFormTargetCount] = useState<number | undefined>(1);
  const [formUnit, setFormUnit] = useState('');

  const todayIso = toIsoDate(new Date());

  // Calculate current week dates (Lun - Dom)
  const weekDays = useMemo(() => {
    const today = new Date();
    const dayOfWeek = (today.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + currentWeekOffset * 7);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        date: d,
        iso: toIsoDate(d),
        dayName: DIAS_SEMANA[i],
        dayNum: d.getDate(),
        monthNum: d.getMonth(),
        isToday: toIsoDate(d) === todayIso,
      });
    }
    return days;
  }, [currentWeekOffset, todayIso]);

  // Streak calculation helper
  const calculateStreak = (habit: Habit) => {
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    // Check back up to 365 days
    const checkDate = new Date();
    // If today is completed, count it; if not, check from yesterday
    const isTodayDone = !!habit.history?.[todayIso];
    if (!isTodayDone) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    let checkingCurrent = true;
    for (let i = 0; i < 365; i++) {
      const d = new Date(checkDate);
      d.setDate(checkDate.getDate() - i);
      const iso = toIsoDate(d);

      if (habit.history?.[iso]) {
        if (checkingCurrent) {
          currentStreak++;
        }
      } else {
        checkingCurrent = false;
        break;
      }
    }

    // Best streak calculation across all history keys
    const sortedDates = Object.keys(habit.history || {})
      .filter((k) => habit.history[k])
      .sort();

    if (sortedDates.length > 0) {
      tempStreak = 1;
      bestStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));

        if (diffDays === 1) {
          tempStreak++;
          if (tempStreak > bestStreak) bestStreak = tempStreak;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
    }

    return {
      currentStreak,
      bestStreak: Math.max(bestStreak, currentStreak),
    };
  };

  // Today summary stats
  const todayStats = useMemo(() => {
    if (habits.length === 0) return { total: 0, completed: 0, percentage: 0 };
    const completed = habits.filter((h) => h.history?.[todayIso]).length;
    const total = habits.length;
    const percentage = Math.round((completed / total) * 100);
    return { total, completed, percentage };
  }, [habits, todayIso]);

  const handleOpenAddModal = (template?: HabitTemplate) => {
    setEditingHabit(null);
    if (template) {
      setFormName(template.name);
      setFormDescription(template.description);
      setFormEmoji(template.emoji);
      setFormColor(template.color);
      setFormCategory(template.category);
      setFormFrequency(template.frequency);
      setFormTargetCount(template.targetCount);
      setFormUnit(template.unit || '');
    } else {
      setFormName('');
      setFormDescription('');
      setFormEmoji('🔥');
      setFormColor('#059669');
      setFormCategory('Salud');
      setFormFrequency('daily');
      setFormTargetCount(1);
      setFormUnit('');
    }
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setFormName(habit.name);
    setFormDescription(habit.description || '');
    setFormEmoji(habit.emoji);
    setFormColor(habit.color);
    setFormCategory(habit.category || 'Salud');
    setFormFrequency(habit.frequency);
    setFormTargetCount(habit.targetCount || 1);
    setFormUnit(habit.unit || '');
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingHabit) {
      await onUpdateHabit(editingHabit.id, {
        name: formName.trim(),
        description: formDescription.trim(),
        emoji: formEmoji,
        color: formColor,
        category: formCategory,
        frequency: formFrequency,
        targetCount: formTargetCount,
        unit: formUnit.trim(),
      });
    } else {
      await onAddHabit({
        name: formName.trim(),
        description: formDescription.trim(),
        emoji: formEmoji,
        color: formColor,
        category: formCategory,
        frequency: formFrequency,
        targetCount: formTargetCount,
        unit: formUnit.trim(),
        history: {},
        archived: false,
      });
    }

    setIsModalOpen(false);
  };

  const handleToggle = async (habitId: string, dateStr: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const isCurrentlyDone = !!habit.history?.[dateStr];
    if (!isCurrentlyDone) {
      sounds.playCompleteChime();
      if (dateStr === todayIso) {
        // Trigger small confetti
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.75 },
          colors: [habit.color, '#10b981', '#3b82f6', '#f59e0b'],
        });
      }
    }

    await onToggleHabit(habitId, dateStr);
  };

  // Days in month for monthly view
  const monthCalendarDays = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      days.push({
        dayNum: d,
        iso: toIsoDate(dateObj),
        date: dateObj,
      });
    }
    return days;
  }, [selectedMonth]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Stats */}
      <div className="bg-white dark:bg-[#151722] p-5 sm:p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 text-2xl">
              🔥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                  Habit Tracker
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {habits.length} hábitos activos
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Construye rutinas saludables y mantén rachas de constancia día a día
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsTemplateModalOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Plantillas Populares</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo Hábito</span>
            </button>
          </div>
        </div>

        {/* Progress & Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-neutral-100 dark:border-neutral-800/80">
          {/* Card 1: Progreso de Hoy */}
          <div className="p-3.5 rounded-2xl bg-[#faf8f5] dark:bg-[#12141f] border border-neutral-200/60 dark:border-neutral-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              <span className="font-medium">Completados Hoy</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {todayStats.completed} / {todayStats.total}
              </span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${todayStats.percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-neutral-400">
              <span>{todayStats.percentage}% completado</span>
              {todayStats.percentage === 100 && (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ¡Objetivo alcanzado!
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Mejor racha activa */}
          <div className="p-3.5 rounded-2xl bg-[#faf8f5] dark:bg-[#12141f] border border-neutral-200/60 dark:border-neutral-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400">
                Mejor Racha Actual
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold font-serif text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {Math.max(0, ...habits.map((h) => calculateStreak(h).currentStreak))}
                </span>
                <span className="text-xs text-neutral-500">días consecutivos</span>
              </div>
            </div>
          </div>

          {/* Card 3: Récord Histórico */}
          <div className="p-3.5 rounded-2xl bg-[#faf8f5] dark:bg-[#12141f] border border-neutral-200/60 dark:border-neutral-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400">
                Récord Histórico
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold font-serif text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {Math.max(0, ...habits.map((h) => calculateStreak(h).bestStreak))}
                </span>
                <span className="text-xs text-neutral-500">días alcanzados</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-view Switcher (Semanal vs Mensual vs Estadísticas) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/80 border border-neutral-300/60 dark:border-neutral-700/60 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('weekly')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
              viewMode === 'weekly'
                ? 'bg-white dark:bg-[#151722] text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Matriz Semanal</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('monthly')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
              viewMode === 'monthly'
                ? 'bg-white dark:bg-[#151722] text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Vista Mes Completo</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('stats')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
              viewMode === 'stats'
                ? 'bg-white dark:bg-[#151722] text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Estadísticas</span>
          </button>
        </div>

        {/* View Mode controls */}
        {viewMode === 'weekly' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
              className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#151722] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 px-1">
              {weekDays[0].dayNum} {MESES[weekDays[0].monthNum]} - {weekDays[6].dayNum} {MESES[weekDays[6].monthNum]}
            </span>

            <button
              type="button"
              onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
              className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#151722] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors"
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {currentWeekOffset !== 0 && (
              <button
                type="button"
                onClick={() => setCurrentWeekOffset(0)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-200/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors ml-1"
              >
                Esta semana
              </button>
            )}
          </div>
        )}

        {viewMode === 'monthly' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1))
              }
              className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#151722] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 px-1">
              {MESES[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
            </span>

            <button
              type="button"
              onClick={() =>
                setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1))
              }
              className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#151722] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {viewMode === 'weekly' && (
        <div className="bg-white dark:bg-[#151722] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs overflow-hidden">
          {/* Table Header */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-neutral-200/70 dark:border-neutral-800 bg-[#faf8f5] dark:bg-[#12141f]">
                  <th className="py-3.5 px-4 text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider w-[280px]">
                    Hábito & Racha
                  </th>
                  {weekDays.map((d) => (
                    <th
                      key={d.iso}
                      className={`py-3 px-2 text-center text-xs font-medium ${
                        d.isToday
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border-b-2 border-emerald-500'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-[11px] uppercase tracking-wider">{d.dayName}</span>
                        <span
                          className={`w-7 h-7 mt-0.5 rounded-full flex items-center justify-center font-bold text-xs ${
                            d.isToday
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          {d.dayNum}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-[80px]">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                {habits.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-neutral-400 dark:text-neutral-500">
                      <div className="max-w-sm mx-auto space-y-3">
                        <div className="text-4xl">🌱</div>
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Aún no has añadido ningún hábito diario
                        </p>
                        <p className="text-xs">
                          Comienza con un hábito sencillo como beber agua o leer 15 páginas al día.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsTemplateModalOpen(true)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                        >
                          Elegir plantilla recomendada
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  habits.map((habit) => {
                    const { currentStreak, bestStreak } = calculateStreak(habit);

                    return (
                      <tr
                        key={habit.id}
                        className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/30 transition-colors group"
                      >
                        {/* Habit Title Column */}
                        <td className="py-3.5 px-4 align-middle">
                          <div className="flex items-center gap-3">
                            <span
                              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-2xs"
                              style={{
                                backgroundColor: `${habit.color}15`,
                                border: `1px solid ${habit.color}35`,
                              }}
                            >
                              {habit.emoji}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                                  {habit.name}
                                </h3>
                                {habit.category && (
                                  <span
                                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
                                    style={{
                                      backgroundColor: `${habit.color}15`,
                                      color: habit.color,
                                    }}
                                  >
                                    {habit.category}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                                <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-semibold">
                                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                  <span>{currentStreak}d</span>
                                </span>
                                <span>•</span>
                                <span className="text-[11px] text-neutral-400 truncate">
                                  {habit.targetCount ? `${habit.targetCount} ${habit.unit || ''}` : 'Diario'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 7 Daily Toggle Checkboxes */}
                        {weekDays.map((d) => {
                          const isDone = !!habit.history?.[d.iso];

                          return (
                            <td
                              key={d.iso}
                              className={`py-3 px-2 text-center align-middle ${
                                d.isToday ? 'bg-emerald-500/5' : ''
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleToggle(habit.id, d.iso)}
                                title={`${habit.name} el ${d.dayNum} (${isDone ? 'Completado' : 'Pendiente'})`}
                                className={`w-9 h-9 mx-auto rounded-xl flex items-center justify-center transition-all transform active:scale-90 ${
                                  isDone
                                    ? 'shadow-xs text-white'
                                    : 'border-2 border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 bg-white dark:bg-[#161824]'
                                }`}
                                style={{
                                  backgroundColor: isDone ? habit.color : undefined,
                                  borderColor: isDone ? habit.color : undefined,
                                }}
                              >
                                {isDone ? (
                                  <Check className="w-5 h-5 stroke-[3]" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600 group-hover:scale-125 transition-transform" />
                                )}
                              </button>
                            </td>
                          );
                        })}

                        {/* Actions (Edit / Delete) */}
                        <td className="py-3 px-3 text-center align-middle">
                          <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(habit)}
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors"
                              title="Editar hábito"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteHabit(habit.id);
                              }}
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                              title="Eliminar hábito"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly Heatmap View */}
      {viewMode === 'monthly' && (
        <div className="bg-white dark:bg-[#151722] p-5 sm:p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold font-serif text-neutral-900 dark:text-neutral-100">
              Mapa de Hábitos · {MESES[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
            </h2>
            <div className="flex items-center gap-3 text-xs text-neutral-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-neutral-200 dark:bg-neutral-800 inline-block" />
                <span>0%</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-300 dark:bg-emerald-900 inline-block" />
                <span>50%</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-600 inline-block" />
                <span>100%</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {monthCalendarDays.map((d) => {
              const totalHabits = habits.length;
              const completedCount = habits.filter((h) => h.history?.[d.iso]).length;
              const ratio = totalHabits > 0 ? completedCount / totalHabits : 0;
              const isToday = d.iso === todayIso;

              let bgClass = 'bg-neutral-100 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400';
              if (ratio === 1) {
                bgClass = 'bg-emerald-600 text-white font-bold shadow-xs';
              } else if (ratio >= 0.75) {
                bgClass = 'bg-emerald-500 text-white font-semibold';
              } else if (ratio >= 0.5) {
                bgClass = 'bg-emerald-300 dark:bg-emerald-800 text-emerald-950 dark:text-emerald-100';
              } else if (ratio > 0) {
                bgClass = 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300';
              }

              return (
                <div
                  key={d.iso}
                  className={`p-3 rounded-2xl border transition-all ${
                    isToday ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-[#151722]' : ''
                  } ${bgClass} border-transparent`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">{d.dayNum}</span>
                    <span className="text-[10px] opacity-80">
                      {completedCount}/{totalHabits}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    {habits.map((h) => {
                      const done = !!h.history?.[d.iso];
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => handleToggle(h.id, d.iso)}
                          title={`${h.name} (${done ? 'Hecho' : 'Pendiente'})`}
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] transition-transform hover:scale-125 ${
                            done ? 'opacity-100 ring-1 ring-white/40' : 'opacity-25 grayscale'
                          }`}
                        >
                          {h.emoji}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Statistics & Analytics View */}
      {viewMode === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.map((habit) => {
            const { currentStreak, bestStreak } = calculateStreak(habit);
            const totalCompletions = Object.values(habit.history || {}).filter(Boolean).length;

            return (
              <div
                key={habit.id}
                className="bg-white dark:bg-[#151722] p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${habit.color}15`, border: `1px solid ${habit.color}30` }}
                    >
                      {habit.emoji}
                    </span>
                    <div>
                      <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">{habit.name}</h3>
                      <p className="text-xs text-neutral-500">{habit.description || 'Hábito diario regular'}</p>
                    </div>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
                  >
                    {habit.category || 'Hábito'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 text-center">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                      Racha actual
                    </span>
                    <span className="text-xl font-bold font-serif text-amber-600 dark:text-amber-400 mt-1 block">
                      🔥 {currentStreak}d
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 text-center">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                      Récord
                    </span>
                    <span className="text-xl font-bold font-serif text-violet-600 dark:text-violet-400 mt-1 block">
                      🏆 {bestStreak}d
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 text-center">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                      Total días
                    </span>
                    <span className="text-xl font-bold font-serif text-emerald-600 dark:text-emerald-400 mt-1 block">
                      ✅ {totalCompletions}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Habit Builder / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#161824] rounded-3xl max-w-md w-full p-6 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-serif text-neutral-900 dark:text-neutral-100">
                {editingHabit ? 'Editar Hábito' : 'Crear Nuevo Hábito'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Emoji & Name row */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Nombre del hábito
                </label>
                <div className="flex gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      className="w-12 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xl flex items-center justify-center"
                    >
                      {formEmoji}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej. Beber 2L de agua, Caminar 30m..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#12141f] text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Emoji quick selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Elige un icono
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {PRESET_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setFormEmoji(em)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all ${
                        formEmoji === em
                          ? 'bg-emerald-500/20 ring-2 ring-emerald-500 scale-110'
                          : 'bg-neutral-100 dark:bg-neutral-800 hover:scale-105'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Descripción u objetivo (opcional)
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ej. Para mantenerme activo y con energía"
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#12141f] text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Category & Frequency */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Categoría
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#12141f] text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Salud">Salud</option>
                    <option value="Fitness">Fitness / Deporte</option>
                    <option value="Mente">Mente & Lectura</option>
                    <option value="Bienestar">Bienestar</option>
                    <option value="Nutrición">Nutrición</option>
                    <option value="Productividad">Productividad</option>
                    <option value="Descanso">Descanso</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Frecuencia
                  </label>
                  <select
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#12141f] text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="daily">Todos los días</option>
                    <option value="weekdays">Lunes a Viernes</option>
                    <option value="weekends">Fines de semana</option>
                  </select>
                </div>
              </div>

              {/* Target & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Meta numérica
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formTargetCount || ''}
                    onChange={(e) => setFormTargetCount(Number(e.target.value) || undefined)}
                    placeholder="1"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#12141f] text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Unidad
                  </label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="ej. litros, min, págs"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#12141f] text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Color Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Color distintivo
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        formColor === c ? 'scale-125 ring-2 ring-neutral-400 ring-offset-2' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
                >
                  {editingHabit ? 'Guardar Cambios' : 'Crear Hábito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recommended Templates Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#161824] rounded-3xl max-w-xl w-full p-6 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold font-serif text-neutral-900 dark:text-neutral-100">
                  Plantillas de Hábitos Populares
                </h2>
                <p className="text-xs text-neutral-500">
                  Elige un hábito ya configurado para añadirlo en 1 clic
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {POPULAR_HABIT_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.name}
                  className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/50 bg-[#faf8f5] dark:bg-[#12141f] flex flex-col justify-between gap-3 group transition-all"
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-2xs"
                      style={{ backgroundColor: `${tmpl.color}20` }}
                    >
                      {tmpl.emoji}
                    </span>
                    <div>
                      <h4 className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">{tmpl.name}</h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">{tmpl.description}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsTemplateModalOpen(false);
                      handleOpenAddModal(tmpl);
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-white dark:bg-[#161824] border border-neutral-200 dark:border-neutral-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 text-neutral-700 dark:text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Usar esta plantilla</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
