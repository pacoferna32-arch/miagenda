import React, { useState, useEffect, useMemo } from 'react';
import { Task, AppLanguage, CategoryKey } from '../types';
import { CATEGORY_MAP, toIsoDate } from '../utils/constants';
import { getLocalizedMonthName } from '../utils/i18n';
import { sounds } from '../utils/audio';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';

interface MiniMonthlyCalendarProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  currentDayDate?: Date;
  onSelectDay: (date: Date) => void;
  tasks: Task[];
  language?: AppLanguage;
  onSelectView?: (view: 'month' | 'day') => void;
  className?: string;
}

export const MiniMonthlyCalendar: React.FC<MiniMonthlyCalendarProps> = ({
  currentDate,
  onSelectDate,
  currentDayDate,
  onSelectDay,
  tasks,
  language = 'es',
  onSelectView,
  className = '',
}) => {
  // Local browsing month/year
  const [viewDate, setViewDate] = useState<Date>(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sync when parent currentDate changes meaningfully
  useEffect(() => {
    if (
      currentDate.getFullYear() !== viewDate.getFullYear() ||
      currentDate.getMonth() !== viewDate.getMonth()
    ) {
      setViewDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    }
  }, [currentDate]);

  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => toIsoDate(today), [today]);

  const selectedDayIso = useMemo(() => {
    return currentDayDate ? toIsoDate(currentDayDate) : todayIso;
  }, [currentDayDate, todayIso]);

  // Fast task lookup map by ISO date string (YYYY-MM-DD) -> Array of CategoryKeys
  const taskCategoriesByDate = useMemo(() => {
    const map = new Map<string, CategoryKey[]>();
    for (const t of tasks) {
      if (t && t.d && typeof t.d === 'string' && t.d !== 'sin-fecha' && !t.done) {
        const existing = map.get(t.d) || [];
        if (!existing.includes(t.c) && existing.length < 3) {
          existing.push(t.c);
        }
        map.set(t.d, existing);
      }
    }
    return map;
  }, [tasks]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // First day of current month (Monday = 0, Sunday = 6)
  const firstDay = new Date(year, month, 1);
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

  // Total days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Total days in previous month
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Day initials: L, M, X, J, V, S, D
  const dayInitials = useMemo(() => {
    if (language === 'en') return ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    if (language === 'fr') return ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    if (language === 'de') return ['M', 'D', 'M', 'D', 'F', 'S', 'S'];
    return ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  }, [language]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    const newMonth = new Date(year, month - 1, 1);
    setViewDate(newMonth);
    onSelectDate(newMonth);
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    const newMonth = new Date(year, month + 1, 1);
    setViewDate(newMonth);
    onSelectDate(newMonth);
  };

  const handleJumpToToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    setViewDate(startOfMonth);
    onSelectDate(startOfMonth);
    onSelectDay(now);
  };

  const handleDayClick = (targetDate: Date) => {
    sounds.playClick();
    onSelectDay(targetDate);
    // If not same month, update viewDate
    if (targetDate.getMonth() !== month || targetDate.getFullYear() !== year) {
      const newMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      setViewDate(newMonth);
      onSelectDate(newMonth);
    }
  };

  const handleMonthTitleClick = () => {
    sounds.playClick();
    onSelectDate(new Date(year, month, 1));
    if (onSelectView) {
      onSelectView('month');
    }
  };

  // Build grid of days (prev month filler, current month, next month filler)
  const calendarCells = useMemo(() => {
    const cells: {
      date: Date;
      dayNumber: number;
      isCurrentMonth: boolean;
      iso: string;
      isToday: boolean;
      isSelected: boolean;
      taskCategories: CategoryKey[];
    }[] = [];

    // 1. Previous month trailing days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const cellDate = new Date(year, month - 1, dayNum);
      const iso = toIsoDate(cellDate);
      cells.push({
        date: cellDate,
        dayNumber: dayNum,
        isCurrentMonth: false,
        iso,
        isToday: iso === todayIso,
        isSelected: iso === selectedDayIso,
        taskCategories: taskCategoriesByDate.get(iso) || [],
      });
    }

    // 2. Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(year, month, d);
      const iso = toIsoDate(cellDate);
      cells.push({
        date: cellDate,
        dayNumber: d,
        isCurrentMonth: true,
        iso,
        isToday: iso === todayIso,
        isSelected: iso === selectedDayIso,
        taskCategories: taskCategoriesByDate.get(iso) || [],
      });
    }

    // 3. Next month leading days to complete grid to multiple of 7 (35 or 42 cells)
    const totalSlots = cells.length > 35 ? 42 : 35;
    const remainingSlots = totalSlots - cells.length;
    for (let d = 1; d <= remainingSlots; d++) {
      const cellDate = new Date(year, month + 1, d);
      const iso = toIsoDate(cellDate);
      cells.push({
        date: cellDate,
        dayNumber: d,
        isCurrentMonth: false,
        iso,
        isToday: iso === todayIso,
        isSelected: iso === selectedDayIso,
        taskCategories: taskCategoriesByDate.get(iso) || [],
      });
    }

    return cells;
  }, [year, month, startingDayOfWeek, daysInMonth, daysInPrevMonth, todayIso, selectedDayIso, taskCategoriesByDate]);

  const monthName = getLocalizedMonthName(month, language);

  return (
    <div
      className={`rounded-2xl bg-white/[0.04] border border-white/10 p-2.5 transition-all shadow-xs ${className}`}
    >
      {/* Calendar Header */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <button
          type="button"
          onClick={handleMonthTitleClick}
          className="flex items-center gap-1.5 text-xs font-bold text-white/90 hover:text-white hover:bg-white/10 px-1.5 py-1 rounded-lg transition-colors cursor-pointer group text-left"
          title={`Ir a vista mensual de ${monthName} ${year}`}
        >
          <CalendarIcon className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="capitalize">{monthName}</span>
          <span className="text-white/50 text-[11px] font-mono">{year}</span>
        </button>

        <div className="flex items-center gap-0.5">
          {/* Jump to Today Button */}
          <button
            type="button"
            onClick={handleJumpToToday}
            className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Ir a Hoy"
          >
            Hoy
          </button>

          {/* Prev Month */}
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Mes anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Next Month */}
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Mes siguiente"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors cursor-pointer ml-0.5"
            title={isCollapsed ? 'Expandir calendario' : 'Plegar calendario'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="animate-in fade-in duration-150">
          {/* Weekday Initials Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {dayInitials.map((initial, idx) => (
              <span
                key={`${initial}-${idx}`}
                className={`text-[10px] font-bold ${
                  idx >= 5 ? 'text-amber-400/70' : 'text-white/40'
                }`}
              >
                {initial}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell) => {
              const hasTasks = cell.taskCategories.length > 0;

              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => handleDayClick(cell.date)}
                  className={`h-7 w-full rounded-lg flex flex-col items-center justify-center relative text-[11px] transition-all cursor-pointer ${
                    cell.isSelected
                      ? 'bg-[#e8533a] text-white font-bold shadow-xs scale-105 z-10'
                      : cell.isToday
                      ? 'ring-1 ring-amber-400 text-amber-300 font-bold bg-amber-400/10 hover:bg-white/15'
                      : cell.isCurrentMonth
                      ? 'text-white/85 hover:bg-white/10 hover:text-white'
                      : 'text-white/20 hover:text-white/40 hover:bg-white/5'
                  }`}
                  title={`${cell.dayNumber} de ${getLocalizedMonthName(cell.date.getMonth(), language)} · ${
                    cell.taskCategories.length > 0
                      ? `${cell.taskCategories.length} tarea(s) pendiente(s)`
                      : 'Sin tareas'
                  }`}
                >
                  <span className="leading-none">{cell.dayNumber}</span>

                  {/* Task Dots */}
                  {hasTasks && (
                    <div className="flex items-center gap-0.5 mt-0.5 absolute bottom-0.5">
                      {cell.taskCategories.map((catKey, dotIdx) => (
                        <span
                          key={dotIdx}
                          className="w-1 h-1 rounded-full shrink-0"
                          style={{
                            backgroundColor: cell.isSelected
                              ? '#ffffff'
                              : CATEGORY_MAP[catKey]?.c || '#f59e0b',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
