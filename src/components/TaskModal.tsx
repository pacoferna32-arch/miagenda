import React, { useState, useEffect } from 'react';
import { Task, CategoryKey, ShoppingItem, PriorityLevel } from '../types';
import { CATEGORIES, CATEGORY_MAP, MEAL_HOURS, toIsoDate, formatCurrency } from '../utils/constants';
import { DrawingPad } from './DrawingPad';
import { getGoogleCalendarUrl, downloadIcsFile, getWhatsAppShoppingUrl, getMapsUrl } from '../utils/calendarExport';
import {
  X,
  Calendar,
  Clock,
  Trash2,
  Share2,
  MapPin,
  ExternalLink,
  Plus,
  Bell,
  Check,
  Navigation as NavIcon,
  Search,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'done'>, id?: number) => void;
  onDelete?: (id: number) => void;
  initialTask?: Task | null;
  defaultCategory?: CategoryKey;
  defaultDate?: string;
  onRequireAuth?: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialTask,
  defaultCategory = 'recordatorios',
  defaultDate,
  onRequireAuth,
}) => {
  const { user } = useAuth();
  const [category, setCategory] = useState<CategoryKey>(defaultCategory);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate || toIsoDate(new Date()));
  const [time, setTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('normal');
  const [inkData, setInkData] = useState<string | null>(null);
  const [alarmMinutes, setAlarmMinutes] = useState<number | null>(null);

  // Category specific
  const [finType, setFinType] = useState<'gasto' | 'ingreso'>('gasto');
  const [finConcept, setFinConcept] = useState('');
  const [finAmount, setFinAmount] = useState<string>('');
  const [finCategory, setFinCategory] = useState('General');

  const [actType, setActType] = useState<'gimnasio' | 'aire' | 'agua' | 'cine' | 'cultural'>('gimnasio');
  const [mealType, setMealType] = useState<'desayuno' | 'almuerzo' | 'merienda' | 'cena'>('almuerzo');
  const [mealDish, setMealDish] = useState('');

  const [shopType, setShopType] = useState<'super' | 'ropa' | 'higiene' | 'menaje' | 'farmacia'>('super');
  const [shopItems, setShopItems] = useState<ShoppingItem[]>([]);
  const [newShopItem, setNewShopItem] = useState('');

  const [workShift, setWorkShift] = useState<'manana' | 'tarde' | 'noche' | 'partido'>('manana');
  const [persType, setPersType] = useState<'trabajo' | 'almuerzo' | 'cena' | 'amigos' | 'pareja' | 'tramite'>('amigos');
  const [medType, setMedType] = useState<'centro' | 'especialista'>('centro');
  const [medSpecialty, setMedSpecialty] = useState('');
  const [location, setLocation] = useState('');

  const [activeTab, setActiveTab] = useState<'details' | 'drawing'>('details');

  useEffect(() => {
    if (initialTask) {
      setCategory(initialTask.c);
      setTitle(initialTask.t);
      setDate(initialTask.d);
      setTime(initialTask.h);
      setNotes(initialTask.n || '');
      setPriority(initialTask.priority || 'normal');
      setInkData(initialTask.ink || null);
      setAlarmMinutes(initialTask.alarm !== undefined ? initialTask.alarm : null);

      setFinType(initialTask.fin || 'gasto');
      setFinConcept(initialTask.concepto || '');
      setFinAmount(initialTask.cant ? String(initialTask.cant) : '');
      setFinCategory(initialTask.finCat || 'General');

      setActType(initialTask.acti || 'gimnasio');
      setMealType(initialTask.meal || 'almuerzo');
      setMealDish(initialTask.plato || '');

      setShopType(initialTask.ctipo || 'super');
      setShopItems(initialTask.items ? [...initialTask.items] : []);

      setWorkShift(initialTask.turno || 'manana');
      setPersType(initialTask.ptipo || 'amigos');
      setMedType(initialTask.med || 'centro');
      setMedSpecialty(initialTask.esp || '');
      setLocation(initialTask.lugar || '');
    } else {
      setCategory(defaultCategory);
      setTitle('');
      setDate(defaultDate || toIsoDate(new Date()));
      setTime(defaultCategory === 'menus' ? MEAL_HOURS.almuerzo : '10:00');
      setNotes('');
      setPriority('normal');
      setInkData(null);
      setAlarmMinutes(defaultCategory === 'recordatorios' || defaultCategory === 'medicas' ? 30 : null);

      setFinType('gasto');
      setFinConcept('');
      setFinAmount('');
      setFinCategory('General');

      setActType('gimnasio');
      setMealType('almuerzo');
      setMealDish('');

      setShopType('super');
      setShopItems([]);
      setNewShopItem('');

      setWorkShift('manana');
      setPersType('amigos');
      setMedType('centro');
      setMedSpecialty('');
      setLocation('');
    }
  }, [initialTask, defaultCategory, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleAddShopItem = () => {
    const val = newShopItem.trim();
    if (!val) return;
    setShopItems((prev) => [...prev, { id: String(Date.now()), x: val, d: false }]);
    setNewShopItem('');
  };

  const handleToggleShopItem = (id: string) => {
    setShopItems((prev) => prev.map((item) => (item.id === id ? { ...item, d: !item.d } : item)));
  };

  const handleRemoveShopItem = (id: string) => {
    setShopItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-infer title if left blank in specialized categories
    let finalTitle = title.trim();
    if (!finalTitle) {
      if (category === 'menus' && mealDish.trim()) {
        finalTitle = mealDish.trim();
      } else if (category === 'finanzas' && finConcept.trim()) {
        finalTitle = finConcept.trim();
      } else if (category === 'compras') {
        finalTitle = `Compra ${shopType}`;
      } else if (category === 'trabajo') {
        finalTitle = `Turno de ${workShift}`;
      } else if (category === 'medicas') {
        finalTitle = medType === 'especialista' ? `Cita ${medSpecialty || 'Especialista'}` : 'Consulta Centro de Salud';
      } else {
        finalTitle = 'Nueva tarea';
      }
    }

    const parsedAmount = finAmount ? parseFloat(finAmount.replace(',', '.')) : null;

    onSave(
      {
        t: finalTitle,
        c: category,
        d: date,
        h: time,
        n: notes.trim(),
        priority,
        ink: inkData,
        alarm: alarmMinutes,
        fin: category === 'finanzas' ? finType : null,
        concepto: category === 'finanzas' ? finConcept.trim() : undefined,
        cant: category === 'finanzas' ? parsedAmount : null,
        finCat: category === 'finanzas' ? finCategory : undefined,
        acti: category === 'actividades' ? actType : null,
        meal: category === 'menus' ? mealType : null,
        plato: category === 'menus' ? mealDish.trim() : undefined,
        ctipo: category === 'compras' ? shopType : null,
        items: category === 'compras' ? shopItems : null,
        turno: category === 'trabajo' ? workShift : null,
        ptipo: category === 'personales' ? persType : null,
        med: category === 'medicas' ? medType : null,
        esp: category === 'medicas' && medType === 'especialista' ? medSpecialty.trim() : '',
        lugar: location.trim(),
      },
      initialTask ? initialTask.id : undefined
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#161824] border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{CATEGORY_MAP[category].e}</span>
            <h2 className="text-lg font-serif font-bold text-neutral-900 dark:text-neutral-100">
              {initialTask ? 'Editar tarea' : 'Nueva tarea'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Optional Cloud Sync hint if not logged in */}
          {!user && (
            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-900 dark:text-emerald-200">
              <span>💾 Tu tarea se guardará en este dispositivo al instante.</span>
              {onRequireAuth && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequireAuth();
                  }}
                  className="text-[11px] font-bold text-[#e8533a] underline hover:opacity-80 shrink-0 cursor-pointer"
                >
                  Sincronizar en la nube →
                </button>
              )}
            </div>
          )}

          {/* Category Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
              Categoría
            </label>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-4">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.k;
                return (
                  <button
                    key={cat.k}
                    type="button"
                    onClick={() => {
                      setCategory(cat.k);
                      if (cat.k === 'menus') {
                        setTime(MEAL_HOURS[mealType] || '14:00');
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-800/80 shadow-sm'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <span className="text-lg">{cat.e}</span>
                    <span
                      className={`text-[11px] font-medium mt-0.5 truncate w-full ${
                        isSelected ? 'text-neutral-900 dark:text-white font-semibold' : 'text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {cat.n}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title input */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
              Título de la tarea
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                category === 'menus'
                  ? 'Ej: Salmón con verduras al horno'
                  : category === 'finanzas'
                  ? 'Ej: Pago de seguro o compra supermercado'
                  : category === 'compras'
                  ? 'Ej: Compra semanal'
                  : 'Ej: Revisión médica, reunión o llamada importante'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-[#faf8f5] dark:bg-[#12141f] text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#e8533a]/50 text-sm"
            />
          </div>

          {/* Date, Time & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                Fecha
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-[#faf8f5] dark:bg-[#12141f] text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8533a]/50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                Hora
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-[#faf8f5] dark:bg-[#12141f] text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8533a]/50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-[#faf8f5] dark:bg-[#12141f] text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8533a]/50"
              >
                <option value="normal">Normal</option>
                <option value="alta">Alta ⚠️</option>
                <option value="urgente">Urgente 🔥</option>
              </select>
            </div>
          </div>

          {/* Category Specific Sections */}
          {/* FINANZAS */}
          {category === 'finanzas' && (
            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-950/80 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                💰 Detalle Financiero
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFinType('gasto')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                    finType === 'gasto'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  📉 Gasto (−)
                </button>
                <button
                  type="button"
                  onClick={() => setFinType('ingreso')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                    finType === 'ingreso'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  📈 Ingreso (+)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={finConcept}
                  onChange={(e) => setFinConcept(e.target.value)}
                  placeholder="Concepto (ej. Alquiler, Supermercado, Factura)"
                  className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-neutral-100"
                />
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={finAmount}
                    onChange={(e) => setFinAmount(e.target.value)}
                    placeholder="Cantidad (ej. 45.50)"
                    className="w-full px-3 py-2 pr-7 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-mono tabular-nums text-neutral-900 dark:text-neutral-100"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-neutral-400">€</span>
                </div>
              </div>
            </div>
          )}

          {/* MENUS */}
          {category === 'menus' && (
            <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-950/80 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                🍽️ Planificación de Menú
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(['desayuno', 'almuerzo', 'merienda', 'cena'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMealType(m);
                      setTime(MEAL_HOURS[m]);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs capitalize font-medium transition-colors ${
                      mealType === m
                        ? 'bg-amber-600 text-white shadow-sm font-semibold'
                        : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={mealDish}
                onChange={(e) => setMealDish(e.target.value)}
                placeholder="¿Qué vas a comer? (ej. Arroz con verduras y pechuga a la plancha)"
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-neutral-100"
              />
            </div>
          )}

          {/* COMPRAS */}
          {category === 'compras' && (
            <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/15 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  🛒 Lista de la Compra
                </label>
                <a
                  href={getWhatsAppShoppingUrl(
                    title || 'Lista de compra',
                    shopType,
                    shopItems.map((i) => ({ x: i.x, d: i.d }))
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                >
                  <Share2 className="w-3 h-3" />
                  Enviar a WhatsApp
                </a>
              </div>

              <div className="flex gap-2">
                <select
                  value={shopType}
                  onChange={(e) => setShopType(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
                >
                  <option value="super">🛍️ Supermercado</option>
                  <option value="ropa">👕 Ropa y calzado</option>
                  <option value="higiene">🧴 Higiene y baño</option>
                  <option value="menaje">🍳 Menaje hogar</option>
                  <option value="farmacia">💊 Farmacia</option>
                </select>
                <div className="flex-1 flex gap-1.5">
                  <input
                    type="text"
                    value={newShopItem}
                    onChange={(e) => setNewShopItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddShopItem();
                      }
                    }}
                    placeholder="Añadir artículo a la lista..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddShopItem}
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold"
                  >
                    +
                  </button>
                </div>
              </div>

              {shopItems.length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {shopItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleShopItem(item.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          item.d
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-neutral-300 dark:border-neutral-700'
                        }`}
                      >
                        {item.d && <Check className="w-3 h-3" />}
                      </button>
                      <span className={`flex-1 ${item.d ? 'line-through opacity-50' : ''}`}>{item.x}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveShopItem(item.id)}
                        className="text-neutral-400 hover:text-rose-500 p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TRABAJO */}
          {category === 'trabajo' && (
            <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-950/80 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                💼 Turno y Ubicación Laboral
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { k: 'manana', l: '🌅 Mañana' },
                  { k: 'tarde', l: '🌇 Tarde' },
                  { k: 'noche', l: '🌙 Noche' },
                  { k: 'partido', l: '⏱️ Partido' },
                ].map((s) => (
                  <button
                    key={s.k}
                    type="button"
                    onClick={() => setWorkShift(s.k as any)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium ${
                      workShift === s.k
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    {s.l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SALUD */}
          {category === 'medicas' && (
            <div className="p-3.5 rounded-xl border border-pink-200 dark:border-pink-950/80 bg-pink-50/50 dark:bg-pink-950/20 space-y-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-pink-900 dark:text-pink-300">
                🩺 Cita de Salud
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMedType('centro')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold ${
                    medType === 'centro'
                      ? 'bg-pink-600 text-white'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  🏥 Centro de Salud
                </button>
                <button
                  type="button"
                  onClick={() => setMedType('especialista')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold ${
                    medType === 'especialista'
                      ? 'bg-pink-600 text-white'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  👨‍⚕️ Especialista
                </button>
              </div>
              {medType === 'especialista' && (
                <input
                  type="text"
                  value={medSpecialty}
                  onChange={(e) => setMedSpecialty(e.target.value)}
                  placeholder="Especialidad o médico (ej. Traumatología, Dr. García)"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-neutral-100"
                />
              )}
            </div>
          )}

          {/* ACTIVIDADES */}
          {category === 'actividades' && (
            <div className="p-3.5 rounded-xl border border-sky-200 dark:border-sky-950/80 bg-sky-50/50 dark:bg-sky-950/20 space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-sky-900 dark:text-sky-300">
                🎯 Tipo de Actividad
              </label>
              <select
                value={actType}
                onChange={(e) => setActType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
              >
                <option value="gimnasio">🏋️ Gimnasio / Fitness</option>
                <option value="aire">🌳 Deporte al aire libre / Senderismo</option>
                <option value="agua">🏖️ Playa / Piscina</option>
                <option value="cine">🎭 Cine / Teatro</option>
                <option value="cultural">🏛️ Museo / Evento cultural</option>
              </select>
            </div>
          )}

          {/* CITAS PERSONALES */}
          {category === 'personales' && (
            <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-950/80 bg-purple-50/50 dark:bg-purple-950/20 space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                👥 Tipo de Encuentro
              </label>
              <select
                value={persType}
                onChange={(e) => setPersType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
              >
                <option value="amigos">🎉 Amigos</option>
                <option value="pareja">❤️ Pareja</option>
                <option value="almuerzo">🍽️ Almuerzo / Comida</option>
                <option value="cena">🌙 Cena</option>
                <option value="trabajo">💼 Cita profesional</option>
                <option value="tramite">📄 Trámite / Papeleo</option>
              </select>
            </div>
          )}

          {/* Location field with quick Google Maps buttons */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
              📍 Lugar / Dirección
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Dirección, restaurante, hospital o sala..."
                className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-[#faf8f5] dark:bg-[#12141f] text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
              />
              {location.trim() && (
                <>
                  <a
                    href={getMapsUrl('search', location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100"
                    title="Buscar ubicación en Google Maps"
                  >
                    <Search className="w-3 h-3" />
                    <span>Maps</span>
                  </a>
                  <a
                    href={getMapsUrl('directions', location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100"
                    title="Cómo llegar (Ruta en Google Maps)"
                  >
                    <NavIcon className="w-3 h-3" />
                    <span>Ruta</span>
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Reminder Alarm & Sync with Google Calendar */}
          <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#e8533a]" />
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Aviso sonoro y exportación
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={getGoogleCalendarUrl({ t: title, d: date, h: time, n: notes, lugar: location })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  <Calendar className="w-3 h-3" />
                  Google Calendar
                </a>
                <button
                  type="button"
                  onClick={() => downloadIcsFile({ t: title, d: date, h: time, n: notes, lugar: location, id: initialTask?.id })}
                  className="text-[11px] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white underline"
                >
                  .ics (Apple/Outlook)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAlarmMinutes(alarmMinutes === null ? 30 : null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  alarmMinutes !== null
                    ? 'bg-[#e8533a] text-white shadow-sm'
                    : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {alarmMinutes !== null ? '🔔 Alarma activada' : '🔕 Sin alarma'}
              </button>

              {alarmMinutes !== null && (
                <select
                  value={alarmMinutes}
                  onChange={(e) => setAlarmMinutes(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
                >
                  <option value={0}>En el momento exacto</option>
                  <option value={5}>5 minutos antes</option>
                  <option value={15}>15 minutos antes</option>
                  <option value={30}>30 minutos antes</option>
                  <option value={60}>1 hora antes</option>
                  <option value={120}>2 horas antes</option>
                  <option value={1440}>1 día antes</option>
                  <option value={2880}>2 días antes</option>
                </select>
              )}
            </div>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
              El aviso suena con una melodía y muestra una ventana emergente interactiva para posponer o completar.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
              Notas y observaciones
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles importantes, código de reserva, instrucciones..."
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-[#faf8f5] dark:bg-[#12141f] text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-2 focus:ring-[#e8533a]/50"
            />
          </div>

          {/* Apple Pencil / Hand-drawn note */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                ✍️ Nota manuscrita / Dibujo a mano
              </label>
              {inkData && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ Dibujo adjunto
                </span>
              )}
            </div>
            <DrawingPad initialDataUrl={inkData} onChange={setInkData} />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between gap-3">
          {initialTask && onDelete ? (
            <button
              type="button"
              onClick={() => {
                onDelete(initialTask.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 rounded-xl bg-[#e8533a] hover:bg-[#d4432c] text-white text-xs font-semibold shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Guardar tarea ✓</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
