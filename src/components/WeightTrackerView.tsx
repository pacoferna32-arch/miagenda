import React, { useState, useMemo } from 'react';
import { WeightEntry, UserSettings } from '../types';
import { toIsoDate, formatNumber, MESES, DIAS_SEMANA } from '../utils/constants';
import {
  Scale,
  Plus,
  TrendingDown,
  TrendingUp,
  Minus,
  Trash2,
  Target,
  Award,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Edit2,
  Check,
  X,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

interface WeightTrackerViewProps {
  currentDate: Date;
  weights: WeightEntry[];
  settings: UserSettings;
  onAddWeight: (entry: WeightEntry) => void;
  onDeleteWeight: (dateStr: string) => void;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
}

export const WeightTrackerView: React.FC<WeightTrackerViewProps> = ({
  currentDate,
  weights,
  settings,
  onAddWeight,
  onDeleteWeight,
  onUpdateSettings,
}) => {
  const todayIso = toIsoDate(new Date());

  // Sorting
  const sortedAll = useMemo(() => {
    return weights.slice().sort((a, b) => a.d.localeCompare(b.d));
  }, [weights]);

  const latestWeight = sortedAll.length > 0 ? sortedAll[sortedAll.length - 1] : null;

  // Selected date for daily consultation (defaults to today or latest recorded date)
  const [consultDate, setConsultDate] = useState<string>(() => {
    return latestWeight?.d || todayIso;
  });

  // Inline editing state for the consulted date
  const [isEditingConsulted, setIsEditingConsulted] = useState(false);
  const [editKgInput, setEditKgInput] = useState('');
  const [editNotesInput, setEditNotesInput] = useState('');

  // Form for adding new weight
  const [formDate, setFormDate] = useState(todayIso);
  const [formKg, setFormKg] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Height and Target Weight settings
  const [editingHeight, setEditingHeight] = useState(false);
  const [heightInput, setHeightInput] = useState(String(settings.heightCm || 175));
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(String(settings.targetWeightKg || 74.0));

  // Visualization mode: chart vs monthly weights calendar
  const [visTab, setVisTab] = useState<'chart' | 'calendar'>('chart');

  // Month navigation for the monthly weights calendar view
  const [calMonthOffset, setCalMonthOffset] = useState<number>(0);

  // Search and filter in history
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'month' | 'prev_month' | 'year'>('all');

  // Monthly stats
  const currentYearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const monthWeights = sortedAll.filter((w) => w.d.startsWith(currentYearMonth));

  const monthAvg =
    monthWeights.length > 0
      ? monthWeights.reduce((s, w) => s + w.kg, 0) / monthWeights.length
      : latestWeight
      ? latestWeight.kg
      : 0;

  // BMI calculation
  const heightMeters = (settings.heightCm || 175) / 100;
  const currentBmi = latestWeight ? latestWeight.kg / (heightMeters * heightMeters) : 0;

  const getBmiCategory = (bmi: number) => {
    if (bmi <= 0) return { label: 'Sin datos', color: 'text-neutral-400' };
    if (bmi < 18.5) return { label: 'Bajo peso', color: 'text-sky-600' };
    if (bmi < 25) return { label: 'Normopeso (Saludable)', color: 'text-emerald-600' };
    if (bmi < 30) return { label: 'Sobrepeso leve', color: 'text-amber-600' };
    return { label: 'Obesidad', color: 'text-rose-600' };
  };

  const bmiCat = getBmiCategory(currentBmi);

  // Consulted day weight calculation
  const consultedEntry = sortedAll.find((w) => w.d === consultDate);

  // Prior and next recorded weigh-ins relative to consultDate
  const priorRecordedEntries = sortedAll.filter((w) => w.d < consultDate);
  const nextRecordedEntries = sortedAll.filter((w) => w.d > consultDate);

  const priorEntry = priorRecordedEntries.length > 0 ? priorRecordedEntries[priorRecordedEntries.length - 1] : null;
  const nextEntry = nextRecordedEntries.length > 0 ? nextRecordedEntries[0] : null;

  // Difference vs prior recorded weigh-in
  const deltaPrior = consultedEntry && priorEntry ? Math.round((consultedEntry.kg - priorEntry.kg) * 10) / 10 : null;

  // Format full date in Spanish
  const formatFullDate = (dStr: string) => {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const dayName = DIAS_SEMANA[(d.getDay() + 6) % 7];
      const monthName = MESES[d.getMonth()];
      return `${dayName}, ${Number(parts[2])} de ${monthName} de ${parts[0]}`;
    }
    return dStr;
  };

  // Step days for consultation
  const stepConsultDay = (deltaDays: number) => {
    const parts = consultDate.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + deltaDays);
    const newDateStr = toIsoDate(d);
    setConsultDate(newDateStr);
    setIsEditingConsulted(false);
  };

  // Form submit for adding/updating weight
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedKg = parseFloat(formKg.replace(',', '.'));
    if (!formDate || isNaN(parsedKg) || parsedKg <= 0) return;

    const newEntry: WeightEntry = {
      d: formDate,
      kg: Math.round(parsedKg * 10) / 10,
      notes: formNotes.trim() || undefined,
    };

    onAddWeight(newEntry);
    setConsultDate(formDate); // focus consultation on the saved date
    setFormKg('');
    setFormNotes('');
  };

  // Inline edit submit for consulted date
  const handleSaveConsultedEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedKg = parseFloat(editKgInput.replace(',', '.'));
    if (isNaN(parsedKg) || parsedKg <= 0) return;

    onAddWeight({
      d: consultDate,
      kg: Math.round(parsedKg * 10) / 10,
      notes: editNotesInput.trim() || undefined,
    });
    setIsEditingConsulted(false);
  };

  const handleStartEditConsulted = () => {
    if (consultedEntry) {
      setEditKgInput(String(consultedEntry.kg));
      setEditNotesInput(consultedEntry.notes || '');
      setIsEditingConsulted(true);
    }
  };

  const handleSaveHeight = () => {
    const val = parseInt(heightInput, 10);
    if (val > 100 && val < 250) {
      onUpdateSettings({ heightCm: val });
    }
    setEditingHeight(false);
  };

  const handleSaveTarget = () => {
    const val = parseFloat(targetInput.replace(',', '.'));
    if (!isNaN(val) && val > 30 && val < 250) {
      onUpdateSettings({ targetWeightKg: Math.round(val * 10) / 10 });
    }
    setEditingTarget(false);
  };

  // Monthly weights calendar calculation
  const calendarBaseDate = useMemo(() => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + calMonthOffset);
    return d;
  }, [currentDate, calMonthOffset]);

  const calYear = calendarBaseDate.getFullYear();
  const calMonth = calendarBaseDate.getMonth();
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  let calFirstDayIndex = new Date(calYear, calMonth, 1).getDay();
  calFirstDayIndex = calFirstDayIndex === 0 ? 6 : calFirstDayIndex - 1; // Mon = 0
  const calTotalCells = Math.ceil((calFirstDayIndex + calDaysInMonth) / 7) * 7;

  // Filtered history list
  const filteredHistory = useMemo(() => {
    let list = sortedAll.slice().reverse();

    if (historyFilter === 'month') {
      const ym = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      list = list.filter((w) => w.d.startsWith(ym));
    } else if (historyFilter === 'prev_month') {
      const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const ym = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      list = list.filter((w) => w.d.startsWith(ym));
    } else if (historyFilter === 'year') {
      const y = String(currentDate.getFullYear());
      list = list.filter((w) => w.d.startsWith(y));
    }

    if (historySearch.trim()) {
      const query = historySearch.toLowerCase().trim();
      list = list.filter(
        (w) =>
          w.d.includes(query) ||
          w.d.split('-').reverse().join('/').includes(query) ||
          String(w.kg).includes(query) ||
          (w.notes && w.notes.toLowerCase().includes(query))
      );
    }

    return list;
  }, [sortedAll, historyFilter, historySearch, currentDate]);

  // Recharts Monthly Weight Trend Calculation
  const [chartRange, setChartRange] = useState<'month' | 'all'>('month');

  const chartData = useMemo(() => {
    const ym = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const dataset = chartRange === 'month' ? sortedAll.filter((w) => w.d.startsWith(ym)) : sortedAll;
    const target = settings.targetWeightKg || 74.0;

    return dataset.map((item) => {
      const parts = item.d.split('-');
      const dNum = parseInt(parts[2], 10);
      const mNum = parseInt(parts[1], 10);
      return {
        rawDate: item.d,
        label: `${dNum} ${MESES[mNum - 1].slice(0, 3)}`,
        fullDate: `${dNum} de ${MESES[mNum - 1]} de ${parts[0]}`,
        kg: item.kg,
        target,
        notes: item.notes || '',
        diffFromTarget: Math.round((item.kg - target) * 10) / 10,
      };
    });
  }, [sortedAll, chartRange, currentDate, settings.targetWeightKg]);

  // Chart range summary stats
  const chartKgs = chartData.map((d) => d.kg);
  const chartMinKg = chartKgs.length > 0 ? Math.min(...chartKgs) : 0;
  const chartMaxKg = chartKgs.length > 0 ? Math.max(...chartKgs) : 0;
  const chartDiff =
    chartKgs.length >= 2 ? Math.round((chartKgs[chartKgs.length - 1] - chartKgs[0]) * 10) / 10 : 0;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Current Weight */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151722] border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Último pesaje
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <b className="text-2xl font-serif font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                {latestWeight ? formatNumber(latestWeight.kg) : '—'}
              </b>
              <span className="text-sm font-semibold text-neutral-500">kg</span>
            </div>
            {latestWeight && (
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {latestWeight.d.split('-').reverse().join('/')}
              </p>
            )}
          </div>
          <div className="p-2.5 rounded-2xl bg-[#e8533a]/10 text-[#e8533a]">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        {/* IMC / BMI */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151722] border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              IMC (Altura {settings.heightCm} cm)
            </span>
            <button
              type="button"
              onClick={() => setEditingHeight(!editingHeight)}
              className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline"
            >
              Editar
            </button>
          </div>
          {editingHeight ? (
            <div className="flex items-center gap-1.5 mt-2">
              <input
                type="number"
                value={heightInput}
                onChange={(e) => setHeightInput(e.target.value)}
                className="w-16 px-2 py-1 rounded border text-xs bg-[#faf8f5] dark:bg-[#12141f] text-neutral-900 dark:text-neutral-100"
              />
              <span className="text-xs text-neutral-400">cm</span>
              <button
                type="button"
                onClick={handleSaveHeight}
                className="px-2 py-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded text-xs font-semibold"
              >
                ✓
              </button>
            </div>
          ) : (
            <div className="mt-1">
              <div className="flex items-baseline gap-1.5">
                <b className="text-2xl font-serif font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {currentBmi > 0 ? currentBmi.toFixed(1) : '—'}
                </b>
                <span className={`text-xs font-semibold ${bmiCat.color}`}>{bmiCat.label}</span>
              </div>
            </div>
          )}
        </div>

        {/* Target Weight */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151722] border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Objetivo
            </span>
            <button
              type="button"
              onClick={() => setEditingTarget(!editingTarget)}
              className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline"
            >
              Editar
            </button>
          </div>
          {editingTarget ? (
            <div className="flex items-center gap-1.5 mt-2">
              <input
                type="number"
                step="0.1"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                className="w-16 px-2 py-1 rounded border text-xs bg-[#faf8f5] dark:bg-[#12141f] text-neutral-900 dark:text-neutral-100"
              />
              <span className="text-xs text-neutral-400">kg</span>
              <button
                type="button"
                onClick={handleSaveTarget}
                className="px-2 py-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded text-xs font-semibold"
              >
                ✓
              </button>
            </div>
          ) : (
            <div className="mt-1">
              <div className="flex items-baseline gap-1">
                <b className="text-2xl font-serif font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {formatNumber(settings.targetWeightKg || 74.0)}
                </b>
                <span className="text-sm font-semibold text-neutral-500">kg</span>
              </div>
              {latestWeight && (
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {latestWeight.kg > (settings.targetWeightKg || 74.0)
                    ? `A ${(latestWeight.kg - (settings.targetWeightKg || 74.0)).toFixed(1)} kg de tu meta`
                    : `¡Meta alcanzada o superada!`}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Media del Mes */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151722] border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Media ({MESES[currentDate.getMonth()]})
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <b className="text-2xl font-serif font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                {monthAvg > 0 ? formatNumber(monthAvg) : '—'}
              </b>
              <span className="text-sm font-semibold text-neutral-500">kg</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {monthWeights.length} pesaje{monthWeights.length !== 1 ? 's' : ''} registrados
            </p>
          </div>
          <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
            <Target className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* FEATURE: DAILY WEIGHT CONSULTATION CARD (CONSULTOR DIARIO) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-white via-amber-50/20 to-orange-50/30 dark:from-[#151722] dark:via-[#191c2b] dark:to-[#171622] border-2 border-amber-500/20 dark:border-amber-500/20 shadow-md space-y-4">
        {/* Navigation & Date Picker header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#e8533a] text-white flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-serif font-bold text-neutral-900 dark:text-neutral-100">
                  Consultar peso diario guardado
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                  Ficha del día
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Selecciona cualquier fecha para consultar el pesaje exacto, variación y notas registradas.
              </p>
            </div>
          </div>

          {/* Date Picker Controls with step arrows */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => stepConsultDay(-1)}
              className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors shadow-2xs"
              title="Día anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <input
              type="date"
              value={consultDate}
              onChange={(e) => {
                setConsultDate(e.target.value);
                setIsEditingConsulted(false);
              }}
              className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1a1c2a] text-xs font-semibold text-neutral-900 dark:text-neutral-100 outline-none focus:border-[#e8533a] shadow-2xs cursor-pointer"
            />

            <button
              type="button"
              onClick={() => stepConsultDay(1)}
              className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors shadow-2xs"
              title="Día siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Quick shortcuts */}
            <button
              type="button"
              onClick={() => {
                setConsultDate(todayIso);
                setIsEditingConsulted(false);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                consultDate === todayIso
                  ? 'bg-[#e8533a] text-white shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              Hoy
            </button>

            {latestWeight && latestWeight.d !== todayIso && (
              <button
                type="button"
                onClick={() => {
                  setConsultDate(latestWeight.d);
                  setIsEditingConsulted(false);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  consultDate === latestWeight.d
                    ? 'bg-[#e8533a] text-white font-bold shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                Último pesaje
              </button>
            )}
          </div>
        </div>

        {/* Consultation Result Display */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              {formatFullDate(consultDate)}
            </span>

            {/* Stepping through actual recorded days */}
            <div className="flex items-center gap-1.5">
              {priorEntry && (
                <button
                  type="button"
                  onClick={() => {
                    setConsultDate(priorEntry.d);
                    setIsEditingConsulted(false);
                  }}
                  className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-0.5"
                  title={`Ir al pesaje previo (${priorEntry.d.split('-').reverse().join('/')})`}
                >
                  <span>← Anterior ({priorEntry.d.slice(5)})</span>
                </button>
              )}

              {nextEntry && (
                <button
                  type="button"
                  onClick={() => {
                    setConsultDate(nextEntry.d);
                    setIsEditingConsulted(false);
                  }}
                  className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-0.5 ml-2"
                  title={`Ir al pesaje posterior (${nextEntry.d.split('-').reverse().join('/')})`}
                >
                  <span>Siguiente ({nextEntry.d.slice(5)}) →</span>
                </button>
              )}
            </div>
          </div>

          {consultedEntry ? (
            /* Record exists for this date */
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1a1c2b] border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
              {isEditingConsulted ? (
                /* Inline Edit Mode */
                <form onSubmit={handleSaveConsultedEdit} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Modificar pesaje del {consultDate.split('-').reverse().join('/')}:
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingConsulted(false)}
                      className="text-neutral-400 hover:text-neutral-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <label className="text-[11px] font-semibold text-neutral-500 block mb-1">
                        Peso registrado (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="30"
                        max="300"
                        value={editKgInput}
                        onChange={(e) => setEditKgInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-sm font-mono font-bold text-neutral-900 dark:text-neutral-100 outline-none focus:border-[#e8533a]"
                        required
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-neutral-500 block mb-1">
                        Anotación o nota del día
                      </label>
                      <input
                        type="text"
                        value={editNotesInput}
                        onChange={(e) => setEditNotesInput(e.target.value)}
                        placeholder="Ej. En ayunas, tras correr..."
                        className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:border-[#e8533a]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingConsulted(false)}
                      className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-[#e8533a] hover:bg-[#d4432c] text-white text-xs font-bold shadow-xs"
                    >
                      Guardar cambios
                    </button>
                  </div>
                </form>
              ) : (
                /* Inspection View */
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl sm:text-5xl font-serif font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                        {formatNumber(consultedEntry.kg)}
                      </span>
                      <span className="text-lg font-bold text-neutral-500">kg</span>

                      {/* Variation badge compared to prior weigh-in */}
                      {deltaPrior !== null ? (
                        <span
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono flex items-center gap-1 ${
                            deltaPrior < 0
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                              : deltaPrior > 0
                              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          {deltaPrior < 0 ? (
                            <TrendingDown className="w-3.5 h-3.5" />
                          ) : deltaPrior > 0 ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : (
                            <Minus className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {deltaPrior > 0 ? '+' : ''}
                            {formatNumber(deltaPrior)} kg
                          </span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-neutral-400 font-medium">Primer pesaje registrado</span>
                      )}
                    </div>

                    {priorEntry && deltaPrior !== null && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Comparado con el pesaje anterior del {priorEntry.d.split('-').reverse().join('/')} ({formatNumber(priorEntry.kg)} kg)
                      </p>
                    )}

                    {consultedEntry.notes ? (
                      <div className="flex items-start gap-1.5 pt-1 text-xs text-neutral-700 dark:text-neutral-300 bg-[#faf8f5] dark:bg-[#131522] p-2 rounded-xl border border-neutral-200/80 dark:border-neutral-800">
                        <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>Anotación: "{consultedEntry.notes}"</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-neutral-400 italic">Sin anotaciones adicionales en este día</p>
                    )}
                  </div>

                  {/* Actions for this day */}
                  <div className="flex items-center sm:flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleStartEditConsulted}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#e8533a]" />
                      <span>Modificar peso</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`¿Eliminar el registro de ${consultedEntry.kg} kg del día ${consultDate}?`)) {
                          onDeleteWeight(consultDate);
                        }
                      }}
                      className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Eliminar este pesaje"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* No record for this date */
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1a1c2b] border border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-neutral-700 dark:text-neutral-300 font-semibold text-sm">
                  <span>Sin pesaje guardado para el {consultDate.split('-').reverse().join('/')}</span>
                </div>
                <p className="text-xs text-neutral-400">
                  {priorEntry
                    ? `Pesaje anterior más cercano: ${formatNumber(priorEntry.kg)} kg el ${priorEntry.d.split('-').reverse().join('/')}`
                    : 'Aún no se ha guardado ningún peso en o antes de esta fecha.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFormDate(consultDate);
                  const el = document.getElementById('weight-input-form');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="px-4 py-2 rounded-xl bg-[#e8533a] hover:bg-[#d4432c] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Anotar peso para este día</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TABS: EVOLUTION CHART VS MONTHLY WEIGHTS CALENDAR */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#151722] border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h4 className="font-serif font-bold text-sm text-neutral-900 dark:text-neutral-100">
              Visualización de Pesajes
            </h4>
          </div>

          <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setVisTab('chart')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                visTab === 'chart'
                  ? 'bg-white dark:bg-[#151722] text-[#e8533a] shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              Gráfica de tendencia
            </button>
            <button
              type="button"
              onClick={() => setVisTab('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                visTab === 'calendar'
                  ? 'bg-white dark:bg-[#151722] text-[#e8533a] shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              Calendario mensual de pesajes
            </button>
          </div>
        </div>

        {visTab === 'chart' ? (
          /* Recharts Monthly Weight Trend Chart */
          <div className="space-y-4">
            {/* Range Selector & Monthly KPI Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800/60 rounded-xl self-start">
                <button
                  type="button"
                  onClick={() => setChartRange('month')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    chartRange === 'month'
                      ? 'bg-white dark:bg-[#161824] text-[#e8533a] shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  Mes de {MESES[currentDate.getMonth()]}
                </button>
                <button
                  type="button"
                  onClick={() => setChartRange('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    chartRange === 'all'
                      ? 'bg-white dark:bg-[#161824] text-[#e8533a] shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  Histórico completo ({sortedAll.length})
                </button>
              </div>

              {chartData.length > 0 && (
                <div className="flex items-center gap-3 text-xs flex-wrap">
                  <div className="flex items-center gap-1 text-neutral-500">
                    <span>Mín:</span>
                    <strong className="text-neutral-800 dark:text-neutral-200 font-mono">
                      {formatNumber(chartMinKg)} kg
                    </strong>
                  </div>
                  <div className="flex items-center gap-1 text-neutral-500">
                    <span>Máx:</span>
                    <strong className="text-neutral-800 dark:text-neutral-200 font-mono">
                      {formatNumber(chartMaxKg)} kg
                    </strong>
                  </div>
                  {chartKgs.length >= 2 && (
                    <div
                      className={`flex items-center gap-1 font-semibold ${
                        chartDiff < 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : chartDiff > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-neutral-500'
                      }`}
                    >
                      <span>Evolución:</span>
                      <span className="font-mono">
                        {chartDiff > 0 ? `+${chartDiff.toFixed(1)}` : `${chartDiff.toFixed(1)}`} kg
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {chartData.length > 0 ? (
              <div className="w-full">
                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 18, right: 24, left: -10, bottom: 8 }}
                      onClick={(e: any) => {
                        if (e && e.activePayload && e.activePayload[0]) {
                          setConsultDate(e.activePayload[0].payload.rawDate);
                          setIsEditingConsulted(false);
                        }
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="currentColor"
                        strokeOpacity={0.08}
                      />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={{ stroke: 'currentColor', strokeOpacity: 0.15 }}
                        tick={{ fontSize: 11, fill: '#888' }}
                      />
                      <YAxis
                        domain={['dataMin - 1', 'dataMax + 1']}
                        tickLine={false}
                        axisLine={{ stroke: 'currentColor', strokeOpacity: 0.15 }}
                        tick={{ fontSize: 11, fill: '#888' }}
                        tickFormatter={(v) => `${v}kg`}
                      />
                      <RechartsTooltip
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const target = settings.targetWeightKg || 74.0;
                            const diff = Math.round((data.kg - target) * 10) / 10;
                            return (
                              <div className="bg-white dark:bg-[#161824] border border-neutral-200 dark:border-neutral-700/80 p-3 rounded-2xl shadow-xl space-y-1 text-xs z-50">
                                <p className="font-bold text-neutral-900 dark:text-neutral-100">
                                  {data.fullDate}
                                </p>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-base font-serif font-bold text-[#e8533a]">
                                    {formatNumber(data.kg)} kg
                                  </span>
                                  {target > 0 && (
                                    <span
                                      className={`text-[11px] font-semibold ${
                                        diff === 0
                                          ? 'text-sky-600'
                                          : diff > 0
                                          ? 'text-amber-600 dark:text-amber-400'
                                          : 'text-emerald-600 dark:text-emerald-400'
                                      }`}
                                    >
                                      ({diff > 0 ? `+${diff}` : `${diff}`} kg vs meta)
                                    </span>
                                  )}
                                </div>
                                {data.notes && (
                                  <p className="text-[11px] text-neutral-600 dark:text-neutral-300 italic pt-1 border-t border-neutral-100 dark:border-neutral-800">
                                    "{data.notes}"
                                  </p>
                                )}
                                <p className="text-[10px] text-neutral-400 pt-0.5">
                                  Pulsa en la gráfica para abrir la ficha de este día
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      {settings.targetWeightKg && (
                        <ReferenceLine
                          y={settings.targetWeightKg}
                          stroke="#0ea5e9"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          label={{
                            value: `Meta: ${settings.targetWeightKg} kg`,
                            fill: '#0ea5e9',
                            fontSize: 10,
                            position: 'insideTopRight',
                          }}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="kg"
                        name="Peso"
                        stroke="#e8533a"
                        strokeWidth={2.8}
                        dot={(dotProps: any) => {
                          const isSelected = dotProps.payload?.rawDate === consultDate;
                          return (
                            <circle
                              key={`dot-${dotProps.index}`}
                              cx={dotProps.cx}
                              cy={dotProps.cy}
                              r={isSelected ? 6 : 4}
                              fill={isSelected ? '#151722' : '#e8533a'}
                              stroke={isSelected ? '#e8533a' : '#ffffff'}
                              strokeWidth={isSelected ? 2.5 : 1.5}
                              className="cursor-pointer transition-transform hover:scale-125"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (dotProps.payload?.rawDate) {
                                  setConsultDate(dotProps.payload.rawDate);
                                  setIsEditingConsulted(false);
                                }
                              }}
                            />
                          );
                        }}
                        activeDot={{
                          r: 7,
                          fill: '#e8533a',
                          stroke: '#ffffff',
                          strokeWidth: 2,
                          className: 'cursor-pointer',
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400 px-2 mt-2 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-[#e8533a] inline-block rounded-full"></span>
                      <span>Peso registrado</span>
                    </span>
                    {settings.targetWeightKg && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 border-t border-dashed border-[#0ea5e9] inline-block"></span>
                        <span>Meta ({settings.targetWeightKg} kg)</span>
                      </span>
                    )}
                  </div>
                  <span>Haz clic en un punto de la curva para ver o editar ese pesaje</span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-neutral-400 space-y-2">
                <p>No hay registros de peso en el mes de {MESES[currentDate.getMonth()]}.</p>
                <button
                  type="button"
                  onClick={() => setChartRange('all')}
                  className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:border-[#e8533a]"
                >
                  Ver histórico completo de todos los meses ({sortedAll.length} registros)
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Monthly Weights Calendar */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCalMonthOffset((o) => o - 1)}
                  className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-serif font-bold text-neutral-900 dark:text-neutral-100 min-w-[130px] text-center">
                  {MESES[calMonth]} {calYear}
                </span>
                <button
                  type="button"
                  onClick={() => setCalMonthOffset((o) => o + 1)}
                  className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <span className="text-xs text-neutral-400">
                Toca cualquier día para consultar sus detalles
              </span>
            </div>

            {/* Calendar Grid */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-200 dark:divide-neutral-800">
              {/* Day headers */}
              <div className="grid grid-cols-7 bg-[#f8f6f0] dark:bg-[#1a1c2a] text-[11px] font-bold text-neutral-500 text-center py-2">
                {DIAS_SEMANA.map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 divide-x divide-y divide-neutral-100 dark:divide-neutral-800/60 bg-white dark:bg-[#151722]">
                {Array.from({ length: calTotalCells }).map((_, i) => {
                  const dayNum = i - calFirstDayIndex + 1;
                  const isCurrent = dayNum >= 1 && dayNum <= calDaysInMonth;

                  if (!isCurrent) {
                    return <div key={i} className="min-h-[55px] p-1 bg-neutral-50/50 dark:bg-neutral-900/30" />;
                  }

                  const cellDateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const entry = sortedAll.find((w) => w.d === cellDateStr);
                  const isSelected = consultDate === cellDateStr;
                  const isToday = cellDateStr === todayIso;

                  return (
                    <div
                      key={cellDateStr}
                      onClick={() => {
                        setConsultDate(cellDateStr);
                        setIsEditingConsulted(false);
                      }}
                      className={`min-h-[60px] sm:min-h-[65px] p-1.5 flex flex-col justify-between cursor-pointer transition-colors relative ${
                        isSelected
                          ? 'bg-amber-500/10 dark:bg-amber-500/20 ring-2 ring-[#e8533a] z-10'
                          : isToday
                          ? 'bg-[#fdfaf7] dark:bg-[#1b1c2b]'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[11px] font-semibold ${
                            isToday ? 'w-5 h-5 rounded-full bg-[#e8533a] text-white flex items-center justify-center font-bold text-[10px]' : 'text-neutral-500'
                          }`}
                        >
                          {dayNum}
                        </span>
                        {entry?.notes && <span className="text-[9px]" title={entry.notes}>📝</span>}
                      </div>

                      {entry ? (
                        <div className="mt-1">
                          <span className="text-xs font-serif font-bold text-neutral-900 dark:text-neutral-100 tabular-nums block">
                            {formatNumber(entry.kg)}
                          </span>
                          <span className="text-[9px] text-neutral-400 font-medium">kg</span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-neutral-300 dark:text-neutral-700 self-end">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Weight Entry Form */}
      <form
        id="weight-input-form"
        onSubmit={handleAddSubmit}
        className="p-4 rounded-3xl bg-white dark:bg-[#151722] border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-wrap items-center gap-3"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
          <Scale className="w-4 h-4 text-[#e8533a]" />
          <span>Añadir o actualizar pesaje:</span>
        </span>

        <input
          type="date"
          value={formDate}
          onChange={(e) => setFormDate(e.target.value)}
          className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs font-semibold text-neutral-900 dark:text-neutral-100 outline-none focus:border-[#e8533a]"
          required
        />

        <div className="relative w-32">
          <input
            type="number"
            step="0.1"
            min="30"
            max="300"
            value={formKg}
            onChange={(e) => setFormKg(e.target.value)}
            placeholder="Ej. 76.2"
            className="w-full px-3 py-2 pr-8 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs font-mono font-bold tabular-nums text-neutral-900 dark:text-neutral-100 outline-none focus:border-[#e8533a]"
            required
          />
          <span className="absolute right-2.5 top-2 text-xs text-neutral-400 font-medium">kg</span>
        </div>

        <input
          type="text"
          value={formNotes}
          onChange={(e) => setFormNotes(e.target.value)}
          placeholder="Nota opcional (ej. ayunas, tras correr, cena ligera...)"
          className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs text-neutral-900 dark:text-neutral-100 outline-none focus:border-[#e8533a]"
        />

        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-[#e8533a] hover:bg-[#d4432c] text-white text-xs font-bold shadow-xs transition-all active:scale-98"
        >
          ＋ Guardar peso
        </button>
      </form>

      {/* History table with search & filter */}
      <div className="bg-white dark:bg-[#151722] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs overflow-hidden">
        {/* Header with Search and Filter */}
        <div className="p-4 bg-[#f8f6f0] dark:bg-[#1a1c2a] border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
              Historial completo de pesajes
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-mono font-semibold">
              {filteredHistory.length}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Buscar fecha o nota..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#12141f] text-xs text-neutral-900 dark:text-neutral-100 outline-none focus:border-[#e8533a]"
              />
              {historySearch && (
                <button
                  type="button"
                  onClick={() => setHistorySearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Dropdown */}
            <select
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#12141f] text-xs text-neutral-700 dark:text-neutral-300 outline-none focus:border-[#e8533a]"
            >
              <option value="all">Todos los registros</option>
              <option value="month">Este mes</option>
              <option value="prev_month">Mes anterior</option>
              <option value="year">Este año</option>
            </select>
          </div>
        </div>

        {/* History Rows */}
        {filteredHistory.length > 0 ? (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {filteredHistory.map((entry, idx) => {
              // Delta compared to the preceding entry in chronological order
              const chronoIdx = sortedAll.findIndex((w) => w.d === entry.d);
              const prevChrono = chronoIdx > 0 ? sortedAll[chronoIdx - 1] : null;
              const delta = prevChrono ? Math.round((entry.kg - prevChrono.kg) * 10) / 10 : null;
              const isSelected = consultDate === entry.d;

              return (
                <div
                  key={entry.d}
                  onClick={() => {
                    setConsultDate(entry.d);
                    setIsEditingConsulted(false);
                    const el = document.getElementById('weight-input-form');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }}
                  className={`px-4 py-3 flex items-center justify-between text-xs transition-colors cursor-pointer group ${
                    isSelected
                      ? 'bg-amber-500/10 dark:bg-amber-500/15'
                      : 'hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-neutral-600 dark:text-neutral-400 font-semibold min-w-[75px]">
                      {entry.d.split('-').reverse().join('/')}
                    </span>

                    <b className="text-sm font-serif font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                      {formatNumber(entry.kg)} kg
                    </b>

                    {entry.notes && (
                      <span className="text-neutral-400 dark:text-neutral-400 italic truncate max-w-[200px] sm:max-w-xs">
                        · {entry.notes}
                      </span>
                    )}

                    {isSelected && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#e8533a] text-white">
                        Consultando
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {delta !== null ? (
                      <span
                        className={`font-mono font-medium flex items-center gap-0.5 ${
                          delta < 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : delta > 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-neutral-400'
                        }`}
                      >
                        {delta < 0 ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : delta > 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <Minus className="w-3 h-3" />
                        )}
                        <span>
                          {delta > 0 ? '+' : ''}
                          {formatNumber(delta)} kg
                        </span>
                      </span>
                    ) : (
                      <span className="text-neutral-400 text-[10px]">Primer registro</span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConsultDate(entry.d);
                        handleStartEditConsulted();
                      }}
                      className="p-1 rounded text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                      title="Editar pesaje"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Eliminar el pesaje de ${entry.kg} kg del ${entry.d}?`)) {
                          onDeleteWeight(entry.d);
                        }
                      }}
                      className="p-1 rounded text-neutral-400 hover:text-rose-600 transition-colors"
                      title="Eliminar pesaje"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-neutral-400 text-xs">
            No se encontraron registros de pesaje que coincidan con la búsqueda.
          </div>
        )}
      </div>
    </div>
  );
};
