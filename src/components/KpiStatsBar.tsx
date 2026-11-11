// src/components/KpiStatsBar.tsx
import React from 'react';

interface KpiStatsBarProps {
  monthTotal: number;
  monthDone: number;
  monthPending: number;
  todayPending: number;
}

export const KpiStatsBar: React.FC<KpiStatsBarProps> = React.memo(({
  monthTotal,
  monthDone,
  monthPending,
  todayPending,
}) => {
  return (
    <section aria-label="Estadísticas del mes" className="responsive-kpi-grid grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#151722] border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          Este mes
        </span>
        <b className="text-2xl font-serif font-bold text-neutral-900 dark:text-neutral-100 tabular-nums mt-1">
          {monthTotal}
        </b>
      </div>

      <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#151722] border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Hechas
        </span>
        <b className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
          {monthDone}
        </b>
      </div>

      <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#151722] border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          Pendientes
        </span>
        <b className="text-2xl font-serif font-bold text-amber-600 dark:text-amber-400 tabular-nums mt-1">
          {monthPending}
        </b>
      </div>

      <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#151722] border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#e8533a]">
          Para hoy
        </span>
        <b className="text-2xl font-serif font-bold text-[#e8533a] tabular-nums mt-1">
          {todayPending}
        </b>
      </div>
    </section>
  );
});

KpiStatsBar.displayName = 'KpiStatsBar';
