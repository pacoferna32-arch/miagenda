import React, { useState, useEffect } from 'react';
import { Task, CategoryKey } from '../types';
import { DIAS_SEMANA, MEAL_NAMES, MEAL_HOURS, toIsoDate } from '../utils/constants';
import { Plus, ShoppingCart, Sparkles, ChevronLeft, ChevronRight, Check, Droplets } from 'lucide-react';
import { fetchWeatherData, getSavedLocation, WeatherData, DailyForecastDay } from '../utils/weather';
import { WeatherIcon } from './WeatherIcon';

interface MealCellProps {
  dateStr: string;
  mealKey: 'desayuno' | 'almuerzo' | 'merienda' | 'cena';
  initialValue: string;
  onSave: (dateStr: string, mealKey: 'desayuno' | 'almuerzo' | 'merienda' | 'cena', dishText: string) => void;
  onSuggest: () => void;
}

const MealCell: React.FC<MealCellProps> = ({
  dateStr,
  mealKey,
  initialValue,
  onSave,
  onSuggest,
}) => {
  const [val, setVal] = useState(initialValue);

  useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value;
    setVal(nextVal);
    onSave(dateStr, mealKey, nextVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Explicitly allow and isolate space key navigation/typing
    if (e.key === ' ' || e.code === 'Space') {
      e.stopPropagation();
    }
  };

  return (
    <div className="p-1.5 border-l border-neutral-200/70 dark:border-neutral-800/80 flex flex-col justify-between hover:bg-neutral-50/70 dark:hover:bg-neutral-800/30 transition-colors">
      <textarea
        rows={3}
        value={val}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Escribe el plato..."
        className="w-full h-full p-1.5 rounded-lg border border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#e8533a] bg-transparent text-xs text-neutral-900 dark:text-neutral-100 resize-none outline-none transition-colors"
      />

      {!val && (
        <button
          type="button"
          onClick={onSuggest}
          className="text-[9px] text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 self-end flex items-center gap-0.5 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Insertar sugerencia saludable"
        >
          <Sparkles className="w-2.5 h-2.5" />
          <span>Sugerir</span>
        </button>
      )}
    </div>
  );
};

interface WeekViewProps {
  currentWeekStart: Date;
  onNavigateWeek: (direction: number) => void;
  tasks: Task[];
  onSaveMeal: (dateStr: string, mealKey: 'desayuno' | 'almuerzo' | 'merienda' | 'cena', dishText: string) => void;
  onSwitchToShopping: () => void;
  onAddIngredientsToShopping: (items: string[]) => void;
}

const HEALTHY_SUGGESTIONS: Record<string, string[]> = {
  desayuno: [
    'Tostadas integrales con aguacate y huevo poché',
    'Yogur griego con frutos rojos y nueces',
    'Avena cocida con plátano y canela',
    'Tortilla francesa con espinacas y té verde',
  ],
  almuerzo: [
    'Lentejas estofadas con verduras de temporada',
    'Salmón a la plancha con espárragos y quinoa',
    'Pollo asado al limón con patatas y ensalada',
    'Garbanzos salteados con espinacas y bacalao',
    'Arroz integral con salteado de verduras y tofu',
  ],
  merienda: [
    'Manzana con crema de cacahuete',
    'Puñado de almendras y una mandarina',
    'Batido de kéfir con plátano',
  ],
  cena: [
    'Crema de calabacín y tortilla de champiñones',
    'Ensalada templada con queso feta y nueces',
    'Merluza al vapor con judías verdes',
    'Revuelto de espárragos trigueros y gambas',
  ],
};

export const WeekView: React.FC<WeekViewProps> = ({
  currentWeekStart,
  onNavigateWeek,
  tasks,
  onSaveMeal,
  onSwitchToShopping,
  onAddIngredientsToShopping,
}) => {
  const [notification, setNotification] = useState<string | null>(null);
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

  // 7 days of the week starting from currentWeekStart
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + i);
    return d;
  });

  const todayStr = toIsoDate(new Date());

  const getMealForDay = (dateStr: string, mealKey: string): Task | undefined => {
    return tasks.find((t) => t.c === 'menus' && t.d === dateStr && t.meal === mealKey);
  };

  const handleExportAllToShopping = () => {
    const weeklyMealTasks = tasks.filter(
      (t) => t.c === 'menus' && weekDays.some((d) => toIsoDate(d) === t.d) && (t.plato || t.t)
    );

    if (weeklyMealTasks.length === 0) {
      setNotification('Primero añade algunos platos en el menú semanal.');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const ingredients: string[] = [];
    weeklyMealTasks.forEach((m) => {
      const text = m.plato || m.t;
      // Extract key ingredients from common Spanish meal dishes
      ingredients.push(text);
    });

    onAddIngredientsToShopping(ingredients);
    setNotification('¡Platos e ingredientes agregados a la lista de compras!');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#151722] p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍽️</span>
          <div>
            <h3 className="font-serif font-bold text-base text-neutral-900 dark:text-neutral-100">
              Planificador de Menús Semanal
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Semana del {weekDays[0].getDate()} de{' '}
              {weekDays[0].toLocaleString('es-ES', { month: 'short' })} al {weekDays[6].getDate()} de{' '}
              {weekDays[6].toLocaleString('es-ES', { month: 'short' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportAllToShopping}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Pasar ingredientes a Compras</span>
          </button>

          <button
            type="button"
            onClick={onSwitchToShopping}
            className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Ver Lista de Compras →
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Grid Table */}
      <div className="bg-white dark:bg-[#151722] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-neutral-200 dark:border-neutral-800 bg-[#f8f6f0] dark:bg-[#1a1c2a]">
            <div className="p-2.5 text-center text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Comida
            </div>
            {weekDays.map((d, idx) => {
              const dStr = toIsoDate(d);
              const isToday = dStr === todayStr;
              const forecast = weatherData?.daily.find((item) => item.date === dStr);
              return (
                <div
                  key={dStr}
                  className={`p-2 text-center border-l border-neutral-200 dark:border-neutral-800 flex flex-col justify-between ${
                    isToday ? 'bg-[#e8533a]/10 font-bold' : ''
                  }`}
                >
                  <div>
                    <p
                      className={`text-[11px] uppercase tracking-wider ${
                        isToday ? 'text-[#e8533a] font-bold' : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {DIAS_SEMANA[idx]}
                    </p>
                    <p
                      className={`text-sm tabular-nums font-serif ${
                        isToday ? 'text-[#e8533a] font-bold' : 'text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      {d.getDate()}
                    </p>
                  </div>

                  {forecast && (
                    <div className="mt-1 pt-1 border-t border-black/5 dark:border-white/5 flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1">
                        <WeatherIcon code={forecast.weatherCode} className="w-3.5 h-3.5" />
                        <span className="text-[10px] tabular-nums font-semibold text-neutral-600 dark:text-neutral-300">
                          {forecast.tempMax}° / {forecast.tempMin}°
                        </span>
                      </div>
                      {forecast.precipitationProbability > 0 && (
                        <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-medium flex items-center gap-0.5">
                          <Droplets className="w-2 h-2" />
                          {forecast.precipitationProbability}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Meal rows: Desayuno, Almuerzo, Merienda, Cena */}
          {(['desayuno', 'almuerzo', 'merienda', 'cena'] as const).map((mealKey) => (
            <div
              key={mealKey}
              className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-neutral-200/70 dark:border-neutral-800/80 group"
            >
              <div className="p-2.5 flex flex-col justify-center items-center text-center bg-[#faf8f5]/50 dark:bg-[#12141f]/50 border-r border-neutral-200 dark:border-neutral-800">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {MEAL_NAMES[mealKey].split(' ')[0]}
                </span>
                <span className="text-[10px] text-neutral-500 capitalize">{mealKey}</span>
                <span className="text-[9px] text-neutral-400 mt-0.5">{MEAL_HOURS[mealKey]}</span>
              </div>

              {weekDays.map((d) => {
                const dateStr = toIsoDate(d);
                const mealTask = getMealForDay(dateStr, mealKey);
                const currentValue = mealTask ? mealTask.plato || mealTask.t : '';

                return (
                  <MealCell
                    key={`${dateStr}-${mealKey}`}
                    dateStr={dateStr}
                    mealKey={mealKey}
                    initialValue={currentValue}
                    onSave={onSaveMeal}
                    onSuggest={() => {
                      const options = HEALTHY_SUGGESTIONS[mealKey];
                      const randomDish = options[Math.floor(Math.random() * options.length)];
                      onSaveMeal(dateStr, mealKey, randomDish);
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        💡 <strong>Consejo:</strong> Escribe directamente en cada casilla. Los cambios se guardan al instante y se sincronizan con el calendario mensual. Puedes usar el botón «Pasar ingredientes a Compras» para generar tu lista del súper en un toque.
      </p>
    </div>
  );
};
