import React, { useState, useMemo } from 'react';
import { Task } from '../types';
import { formatCurrency, toIsoDate, MESES } from '../utils/constants';
import {
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  TrendingUp,
  Trash2,
  BarChart3,
  Calendar,
  Layers,
  Building2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
} from 'recharts';

interface FinanzasViewProps {
  currentDate: Date;
  tasks: Task[];
  onAddTask: (prefilled: Partial<Task>) => void;
  onDeleteTask: (id: number) => void;
  onOpenBBVAPayout?: () => void;
}

export const FinanzasView: React.FC<FinanzasViewProps> = ({
  currentDate,
  tasks,
  onAddTask,
  onDeleteTask,
  onOpenBBVAPayout,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'gasto' | 'ingreso'>('all');
  const [chartMode, setChartMode] = useState<'compare' | 'balance'>('compare');
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  const currentYearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  // Month-specific finance tasks
  const monthFinanceTasks = useMemo(() => {
    return tasks.filter(
      (t) =>
        t &&
        t.c === 'finanzas' &&
        t.fin &&
        typeof t.d === 'string' &&
        t.d.startsWith(currentYearMonth)
    );
  }, [tasks, currentYearMonth]);

  const totalIngresos = monthFinanceTasks
    .filter((t) => t.fin === 'ingreso')
    .reduce((sum, t) => sum + (t.cant || 0), 0);

  const totalGastos = monthFinanceTasks
    .filter((t) => t.fin === 'gasto')
    .reduce((sum, t) => sum + (t.cant || 0), 0);

  const balanceNeto = totalIngresos - totalGastos;
  const tasaAhorro = totalIngresos > 0 ? Math.round(((totalIngresos - totalGastos) / totalIngresos) * 100) : 0;

  // Compute monthly data for recharts (Jan-Dec for the selected year)
  const monthlyData = useMemo(() => {
    const yearPrefix = `${selectedYear}-`;
    const yearTasks = tasks.filter(
      (t) =>
        t &&
        t.c === 'finanzas' &&
        t.fin &&
        typeof t.d === 'string' &&
        t.d.startsWith(yearPrefix)
    );

    return MESES.map((mesName, idx) => {
      const monthStr = `${selectedYear}-${String(idx + 1).padStart(2, '0')}`;
      const inMonth = yearTasks.filter(
        (t) => typeof t.d === 'string' && t.d.startsWith(monthStr)
      );

      const ingresos = inMonth
        .filter((t) => t.fin === 'ingreso')
        .reduce((sum, t) => sum + (t.cant || 0), 0);

      const gastos = inMonth
        .filter((t) => t.fin === 'gasto')
        .reduce((sum, t) => sum + (t.cant || 0), 0);

      const balance = ingresos - gastos;

      return {
        mes: mesName.slice(0, 3),
        mesCompleto: mesName,
        ingresos: Math.round(ingresos * 100) / 100,
        gastos: Math.round(gastos * 100) / 100,
        balance: Math.round(balance * 100) / 100,
      };
    });
  }, [tasks, selectedYear]);

  // Compute yearly totals
  const totalAnualIngresos = useMemo(
    () => monthlyData.reduce((acc, m) => acc + m.ingresos, 0),
    [monthlyData]
  );
  const totalAnualGastos = useMemo(
    () => monthlyData.reduce((acc, m) => acc + m.gastos, 0),
    [monthlyData]
  );
  const balanceAnual = totalAnualIngresos - totalAnualGastos;

  // Quick transaction form states
  const [quickConcept, setQuickConcept] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickType, setQuickType] = useState<'gasto' | 'ingreso'>('gasto');
  const [quickDate, setQuickDate] = useState(toIsoDate(new Date()));

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickConcept.trim() || !quickAmount) return;

    const parsedAmount = parseFloat(quickAmount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAddTask({
      t: quickConcept.trim(),
      c: 'finanzas',
      d: quickDate,
      h: '12:00',
      done: true,
      fin: quickType,
      concepto: quickConcept.trim(),
      cant: parsedAmount,
    });

    setQuickConcept('');
    setQuickAmount('');
  };

  const displayedTasks = monthFinanceTasks.filter((t) => {
    if (filterType === 'all') return true;
    return t.fin === filterType;
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Total Ingresos */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151722] border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Ingresos ({MESES[currentDate.getMonth()]})
            </span>
            <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <b className="text-xl font-serif font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            +{formatCurrency(totalIngresos)}
          </b>
        </div>

        {/* Total Gastos */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151722] border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Gastos ({MESES[currentDate.getMonth()]})
            </span>
            <div className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <b className="text-xl font-serif font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            −{formatCurrency(totalGastos)}
          </b>
        </div>

        {/* Balance Neto */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151722] border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
              Balance Neto
            </span>
            <div className="p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <b
            className={`text-xl font-serif font-bold tabular-nums ${
              balanceNeto >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(balanceNeto)}
          </b>
        </div>

        {/* Tasa de Ahorro */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151722] border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Tasa de Ahorro
            </span>
            <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <b className="text-xl font-serif font-bold text-blue-600 dark:text-blue-400 tabular-nums">
              {tasaAhorro}%
            </b>
            <span className="text-[11px] text-neutral-400">del ingreso</span>
          </div>
        </div>
      </div>

      {/* RECHARTS SECTION: Gráfico de barras de ingresos y gastos desglosado por mes */}
      <div className="bg-white dark:bg-[#151722] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-neutral-900 dark:text-neutral-100">
                Balance Mensual de Ingresos y Gastos
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Comparativa interanual y evolución financiera desglosada por mes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Year selector */}
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-xs">
              {[selectedYear - 1, selectedYear, selectedYear + 1].map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setSelectedYear(yr)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    selectedYear === yr
                      ? 'bg-white dark:bg-[#151722] text-neutral-900 dark:text-white shadow-xs font-semibold'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>

            {/* Chart mode toggle */}
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setChartMode('compare')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  chartMode === 'compare'
                    ? 'bg-white dark:bg-[#151722] text-neutral-900 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
                title="Mostrar barras de Ingresos y Gastos"
              >
                Ingresos vs Gastos
              </button>
              <button
                type="button"
                onClick={() => setChartMode('balance')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  chartMode === 'balance'
                    ? 'bg-white dark:bg-[#151722] text-neutral-900 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
                title="Mostrar balance neto mensual"
              >
                Balance Neto
              </button>
            </div>
          </div>
        </div>

        {/* Annual summary bar */}
        <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl text-xs text-neutral-600 dark:text-neutral-400">
          <div>
            <span className="block text-[10px] uppercase font-bold text-neutral-400">Total Ingresos {selectedYear}</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              +{formatCurrency(totalAnualIngresos)}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-neutral-400">Total Gastos {selectedYear}</span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
              −{formatCurrency(totalAnualGastos)}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-neutral-400">Balance Anual</span>
            <span
              className={`font-mono font-bold text-sm ${
                balanceAnual >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {balanceAnual >= 0 ? '+' : ''}
              {formatCurrency(balanceAnual)}
            </span>
          </div>
        </div>

        {/* Recharts BarChart container */}
        <div className="w-full h-72 sm:h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis
                dataKey="mes"
                stroke="#888888"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#888888', opacity: 0.2 }}
              />
              <YAxis
                stroke="#888888"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#888888', opacity: 0.2 }}
                tickFormatter={(val) => `${val}€`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-[#1a1c29] p-3 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 text-xs space-y-1">
                        <p className="font-bold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-1">
                          {data.mesCompleto} {selectedYear}
                        </p>
                        <p className="flex items-center justify-between gap-4 text-emerald-600 dark:text-emerald-400">
                          <span>Ingresos:</span>
                          <span className="font-mono font-bold">+{formatCurrency(data.ingresos)}</span>
                        </p>
                        <p className="flex items-center justify-between gap-4 text-rose-600 dark:text-rose-400">
                          <span>Gastos:</span>
                          <span className="font-mono font-bold">−{formatCurrency(data.gastos)}</span>
                        </p>
                        <p className="flex items-center justify-between gap-4 pt-1 border-t border-neutral-100 dark:border-neutral-800 font-bold">
                          <span>Balance:</span>
                          <span
                            className={`font-mono ${
                              data.balance >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {data.balance >= 0 ? '+' : ''}
                            {formatCurrency(data.balance)}
                          </span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 10, fontSize: '11px' }}
              />
              {chartMode === 'compare' ? (
                <>
                  <Bar
                    dataKey="ingresos"
                    name="Ingresos (€)"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="gastos"
                    name="Gastos (€)"
                    fill="#f43f5e"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                </>
              ) : (
                <Bar
                  dataKey="balance"
                  name="Balance Neto (€)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                >
                  {monthlyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.balance >= 0 ? '#10b981' : '#f43f5e'}
                    />
                  ))}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Add Bar */}
      <form
        onSubmit={handleQuickAdd}
        className="p-3.5 rounded-2xl bg-white dark:bg-[#151722] border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-wrap items-center gap-2.5"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          Añadir movimiento rápido:
        </span>

        <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 p-0.5 bg-[#faf8f5] dark:bg-[#12141f]">
          <button
            type="button"
            onClick={() => setQuickType('gasto')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
              quickType === 'gasto' ? 'bg-rose-600 text-white shadow-xs' : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Gasto
          </button>
          <button
            type="button"
            onClick={() => setQuickType('ingreso')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
              quickType === 'ingreso' ? 'bg-emerald-600 text-white shadow-xs' : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Ingreso
          </button>
        </div>

        <input
          type="text"
          value={quickConcept}
          onChange={(e) => setQuickConcept(e.target.value)}
          placeholder="Concepto (ej. Supermercado, Factura luz, Nómina)"
          className="flex-1 min-w-[180px] px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
          required
        />

        <div className="relative w-28">
          <input
            type="number"
            step="0.01"
            min="0"
            value={quickAmount}
            onChange={(e) => setQuickAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-2.5 py-1.5 pr-6 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs font-mono tabular-nums text-neutral-900 dark:text-neutral-100"
            required
          />
          <span className="absolute right-2 top-2 text-xs text-neutral-400">€</span>
        </div>

        <input
          type="date"
          value={quickDate}
          onChange={(e) => setQuickDate(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs text-neutral-900 dark:text-neutral-100"
        />

        <button
          type="submit"
          className="px-4 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          ＋ Guardar
        </button>
      </form>

      {/* Movements Table */}
      <div className="bg-white dark:bg-[#151722] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-serif font-bold text-sm text-neutral-900 dark:text-neutral-100">
            Movimientos de {MESES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>

          <div className="flex gap-1 p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md font-medium ${
                filterType === 'all' ? 'bg-white dark:bg-[#151722] shadow-xs text-neutral-900 dark:text-white' : 'text-neutral-500'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('gasto')}
              className={`px-2.5 py-1 rounded-md font-medium ${
                filterType === 'gasto' ? 'bg-white dark:bg-[#151722] shadow-xs text-rose-600 font-semibold' : 'text-neutral-500'
              }`}
            >
              Gastos
            </button>
            <button
              onClick={() => setFilterType('ingreso')}
              className={`px-2.5 py-1 rounded-md font-medium ${
                filterType === 'ingreso' ? 'bg-white dark:bg-[#151722] shadow-xs text-emerald-600 font-semibold' : 'text-neutral-500'
              }`}
            >
              Ingresos
            </button>
          </div>
        </div>

        {displayedTasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">
            No hay movimientos registrados en este período.
          </div>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {displayedTasks
              .slice()
              .sort((a, b) => (b.d || '').localeCompare(a.d || ''))
              .map((task) => (
                <div
                  key={task.id}
                  className="px-4 py-3 flex items-center justify-between hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                        task.fin === 'ingreso'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600'
                      }`}
                    >
                      {task.fin === 'ingreso' ? '+' : '−'}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                        {task.concepto || task.t}
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        {(task.d || '').split('-').reverse().join('/')} · {task.h || '09:00'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-mono tabular-nums font-bold ${
                        task.fin === 'ingreso' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {task.fin === 'ingreso' ? '+' : '−'}
                      {formatCurrency(task.cant || 0)}
                    </span>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1 rounded text-neutral-400 hover:text-rose-600 transition-colors"
                      title="Eliminar movimiento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
