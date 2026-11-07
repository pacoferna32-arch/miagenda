import React, { useState } from 'react';
import { CategoryKey, Task } from '../types';
import { CATEGORIES } from '../utils/constants';
import { sounds } from '../utils/audio';
import {
  Tag,
  ChevronRight,
  ChevronLeft,
  X,
  Layers,
  Sparkles,
  Check,
} from 'lucide-react';

interface RightCategoryBarProps {
  currentCategory: CategoryKey | 'all';
  onSelectCategory: (cat: CategoryKey | 'all') => void;
  tasks: Task[];
  currentDate?: Date;
  activeView: string;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  className?: string;
}

export const RightCategoryBar: React.FC<RightCategoryBarProps> = ({
  currentCategory,
  onSelectCategory,
  tasks,
  currentDate,
  activeView,
  isOpenMobile = false,
  onCloseMobile,
  className = '',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter tasks for current month or all active tasks
  const currentYearMonth = currentDate
    ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    : '';

  const activeTasks = tasks.filter(
    (t) =>
      t &&
      !t.done &&
      (!currentYearMonth || (typeof t.d === 'string' && t.d.startsWith(currentYearMonth)))
  );

  const getCategoryCount = (key: CategoryKey) => {
    return activeTasks.filter((t) => t.c === key).length;
  };

  const totalActiveCount = activeTasks.length;

  const handleTabClick = (key: CategoryKey | 'all') => {
    sounds.playClick();
    onSelectCategory(key);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-neutral-950/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
        />
      )}

      {/* Right Category Bar Container */}
      <aside
        className={`fixed lg:sticky top-0 right-0 h-screen z-40 transition-all duration-300 ease-in-out flex flex-col bg-white dark:bg-[#161824] border-l border-neutral-200/90 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xl lg:shadow-none ${
          isCollapsed ? 'w-16' : 'w-64'
        } ${
          isOpenMobile
            ? 'translate-x-0 w-72'
            : 'translate-x-full lg:translate-x-0'
        } ${className}`}
        aria-label="Pestañas por categoría"
      >
        {/* Header Bar */}
        <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2 shrink-0 bg-neutral-50/70 dark:bg-[#12141e]/70">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#e8533a] to-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            {(!isCollapsed || isOpenMobile) && (
              <div className="min-w-0">
                <h3 className="text-xs font-serif font-bold text-neutral-900 dark:text-white uppercase tracking-wider truncate">
                  Pestañas
                </h3>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                  Por Categoría
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Desktop Collapse / Expand Toggle */}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title={isCollapsed ? 'Expandir pestañas (Mostrar nombres)' : 'Plegar pestañas (Solo iconos)'}
            >
              {isCollapsed ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {/* Mobile Close Button */}
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Cerrar panel de pestañas"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Tabs List (Notebook divider style) */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {/* "TODAS" Tab */}
          <button
            type="button"
            onClick={() => handleTabClick('all')}
            className={`w-full group flex items-center gap-2.5 p-2 rounded-xl text-xs transition-all relative cursor-pointer ${
              currentCategory === 'all'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold shadow-xs'
                : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/80'
            }`}
            title="Ver todas las categorías"
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm transition-transform group-hover:scale-105 ${
                currentCategory === 'all'
                  ? 'bg-white/20 dark:bg-neutral-900/10'
                  : 'bg-neutral-100 dark:bg-neutral-800'
              }`}
            >
              <span>📌</span>
            </div>

            {(!isCollapsed || isOpenMobile) && (
              <div className="flex-1 min-w-0 flex items-center justify-between gap-1 text-left">
                <span className="truncate">Todas las Tareas</span>
                {totalActiveCount > 0 && (
                  <span
                    className={`text-[10px] tabular-nums font-mono px-1.5 py-0.5 rounded-full ${
                      currentCategory === 'all'
                        ? 'bg-white/25 dark:bg-black/20 text-white dark:text-neutral-900 font-bold'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {totalActiveCount}
                  </span>
                )}
              </div>
            )}
          </button>

          {/* Divider with label when expanded */}
          {(!isCollapsed || isOpenMobile) && (
            <div className="pt-2 pb-1 px-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Categorías Divisoras
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">
                {CATEGORIES.length}
              </span>
            </div>
          )}

          {/* Individual Category Tabs */}
          {CATEGORIES.map((cat) => {
            const count = getCategoryCount(cat.k);
            const isSelected =
              currentCategory === cat.k &&
              (activeView === 'month' ||
                activeView === 'week' ||
                activeView === 'day' ||
                activeView === 'list' ||
                (cat.k === 'menus' && activeView === 'menus') ||
                (cat.k === 'finanzas' && activeView === 'finanzas') ||
                (cat.k === 'diario' && activeView === 'journal') ||
                (cat.k === 'habitos' && activeView === 'habits'));

            return (
              <button
                key={cat.k}
                type="button"
                onClick={() => handleTabClick(cat.k)}
                className={`w-full group flex items-center gap-2.5 p-2 rounded-xl text-xs transition-all relative text-left cursor-pointer ${
                  isSelected
                    ? 'ring-2 font-bold shadow-xs scale-[1.01]'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300'
                }`}
                style={{
                  backgroundColor: isSelected
                    ? `${cat.c}18`
                    : undefined,
                  borderColor: isSelected ? cat.c : 'transparent',
                }}
                title={`${cat.n} (${count} pendientes)`}
              >
                {/* Active Indicator Pip (Pointing towards content) */}
                {isSelected && (
                  <span
                    className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-r-full"
                    style={{ backgroundColor: cat.c }}
                  />
                )}

                {/* Color Tab Edge Dot / Box */}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm transition-transform group-hover:scale-110 shadow-2xs relative"
                  style={{
                    backgroundColor: `${cat.c}25`,
                    color: cat.c,
                  }}
                >
                  <span className="text-sm">{cat.e}</span>
                  <span
                    className="w-2 h-2 rounded-full absolute -top-0.5 -right-0.5 border-2 border-white dark:border-[#161824]"
                    style={{ backgroundColor: cat.c }}
                  />
                </div>

                {/* Expanded Details */}
                {(!isCollapsed || isOpenMobile) && (
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                    <span
                      className="truncate font-medium"
                      style={{
                        color: isSelected ? cat.c : undefined,
                        fontWeight: isSelected ? 700 : 500,
                      }}
                    >
                      {cat.n}
                    </span>

                    {count > 0 && (
                      <span
                        className="text-[10px] tabular-nums font-mono px-1.5 py-0.5 rounded-full font-bold shrink-0"
                        style={{
                          backgroundColor: `${cat.c}25`,
                          color: cat.c,
                        }}
                      >
                        {count}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info in right bar */}
        {(!isCollapsed || isOpenMobile) && (
          <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 text-[10px] text-neutral-400 dark:text-neutral-500 text-center bg-neutral-50/50 dark:bg-[#12141e]/50">
            <span>Filtra y organiza tus tareas por pestañas</span>
          </div>
        )}
      </aside>
    </>
  );
};
