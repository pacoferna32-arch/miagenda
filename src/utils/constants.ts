import { CategoryInfo, CategoryKey, Task, Medication, WeightEntry, UserSettings, JournalEntry, JournalMood, Habit, PushNotificationSettings } from '../types';

export const CATEGORIES: CategoryInfo[] = [
  { k: 'recordatorios', n: 'Recordatorios', e: '🔔', c: '#e8533a', bgLight: '#fdf2ef', textLight: '#c2331c' },
  { k: 'medicas', n: 'Salud y Citas', e: '🩺', c: '#d6336c', bgLight: '#fdf2f7', textLight: '#ab1d50' },
  { k: 'personales', n: 'Citas personales', e: '👥', c: '#8e4ec6', bgLight: '#f7f2fc', textLight: '#6d31a5' },
  { k: 'trabajo', n: 'Trabajo y Turnos', e: '💼', c: '#3b6cb5', bgLight: '#f0f5fc', textLight: '#244d8b' },
  { k: 'compras', n: 'Compras', e: '🛒', c: '#d98200', bgLight: '#fef8ee', textLight: '#a35f00' },
  { k: 'menus', n: 'Menús diarios', e: '🍽️', c: '#e66822', bgLight: '#fdf4ee', textLight: '#b5480a' },
  { k: 'actividades', n: 'Actividades y Ocio', e: '🎯', c: '#1e88e5', bgLight: '#edf6fd', textLight: '#1163aa' },
  { k: 'finanzas', n: 'Finanzas', e: '💰', c: '#238654', bgLight: '#edf7f1', textLight: '#15613c' },
  { k: 'diario', n: 'Diario Personal', e: '📔', c: '#8b5cf6', bgLight: '#f5f3ff', textLight: '#6d28d9' },
  { k: 'habitos', n: 'Habit Tracker', e: '🔥', c: '#059669', bgLight: '#ecfdf5', textLight: '#047857' },
];

export const CATEGORY_MAP: Record<CategoryKey, CategoryInfo> = Object.fromEntries(
  CATEGORIES.map((c) => [c.k, c])
) as Record<CategoryKey, CategoryInfo>;

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const DIAS_COMPLETOS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const MEAL_HOURS: Record<string, string> = {
  desayuno: '08:30',
  almuerzo: '14:00',
  merienda: '18:00',
  cena: '21:00',
};

export const MEAL_NAMES: Record<string, string> = {
  desayuno: '☕ Desayuno',
  almuerzo: '🍽️ Almuerzo',
  merienda: '🥪 Merienda',
  cena: '🌙 Cena',
};

export const SHOP_TYPES: Record<string, string> = {
  super: 'Supermercado',
  ropa: 'Ropa y Calzado',
  higiene: 'Higiene y Cuidado',
  menaje: 'Hogar y Cocina',
  farmacia: 'Farmacia',
};

export const ACTIVITY_TYPES: Record<string, { label: string; icon: string }> = {
  gimnasio: { label: 'Gimnasio / Fitness', icon: '🏋️' },
  aire: { label: 'Deporte al aire libre', icon: '🌳' },
  agua: { label: 'Playa / Natación', icon: '🏖️' },
  cine: { label: 'Cine / Teatro', icon: '🎭' },
  cultural: { label: 'Museo / Excursión', icon: '🏛️' },
};

export const SHIFT_TYPES: Record<string, { label: string; icon: string }> = {
  manana: { label: 'Turno Mañana (07:00 - 15:00)', icon: '🌅' },
  tarde: { label: 'Turno Tarde (15:00 - 23:00)', icon: '🌇' },
  noche: { label: 'Turno Noche (23:00 - 07:00)', icon: '🌙' },
  partido: { label: 'Turno Partido', icon: '⏱️' },
};

export const APPOINTMENT_TYPES: Record<string, { label: string; icon: string }> = {
  trabajo: { label: 'Reunión laboral', icon: '💼' },
  almuerzo: { label: 'Comida de trabajo o amigos', icon: '🍽️' },
  cena: { label: 'Cena o velada', icon: '🌙' },
  amigos: { label: 'Quedada con amigos', icon: '🎉' },
  pareja: { label: 'Plan en pareja', icon: '❤️' },
  tramite: { label: 'Gestión o trámite oficial', icon: '📄' },
};

export const toIsoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);
};

export const formatNumber = (num: number, decimals: number = 1): string => {
  return num.toFixed(decimals).replace('.', ',');
};

const getDayOfMonth = (dayNum: number): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  const safeDay = Math.min(Math.max(1, dayNum), lastDay);
  return toIsoDate(new Date(y, m, safeDay));
};

const getTodayIso = (): string => toIsoDate(new Date());

export const INITIAL_TASKS: Task[] = [
  {
    id: 1,
    t: 'Pagar el alquiler mensual',
    c: 'finanzas',
    d: getDayOfMonth(5),
    h: '09:00',
    done: false,
    n: 'Transferencia bancaria antes de las 12:00',
    fin: 'gasto',
    concepto: 'Alquiler de vivienda',
    cant: 850,
    alarm: 60,
  },
  {
    id: 2,
    t: 'Revisión con el médico de cabecera',
    c: 'medicas',
    d: getDayOfMonth(6),
    h: '10:30',
    done: false,
    n: 'Llevar analíticas anteriores en ayunas',
    med: 'centro',
    lugar: 'Centro de Salud Central',
    alarm: 60,
  },
  {
    id: 3,
    t: 'Reunión de coordinación semanal',
    c: 'trabajo',
    d: getDayOfMonth(3),
    h: '09:30',
    done: true,
    n: 'Revisar objetivos del sprint y entregas',
    turno: 'manana',
    lugar: 'Oficina Principal - Sala B',
  },
  {
    id: 4,
    t: 'Entregar informe trimestral',
    c: 'trabajo',
    d: getDayOfMonth(9),
    h: '17:00',
    done: false,
    n: 'Enviar PDF adjunto a dirección',
    turno: 'tarde',
    priority: 'alta',
    alarm: 120,
  },
  {
    id: 5,
    t: 'Compra semanal en el mercado',
    c: 'compras',
    d: getDayOfMonth(4),
    h: '18:00',
    done: false,
    n: 'Productos frescos de temporada',
    ctipo: 'super',
    items: [
      { id: 's1', x: 'Fruta variada (manzanas, plátanos, aguacates)', d: true },
      { id: 's2', x: 'Verdura fresca (espinacas, calabacín, tomates)', d: true },
      { id: 's3', x: 'Salmón fresco y pechuga de pollo', d: false },
      { id: 's4', x: 'Pan integral de masa madre', d: false },
      { id: 's5', x: 'Aceite de oliva virgen extra y huevos camperos', d: false },
    ],
  },
  {
    id: 6,
    t: 'Menú: lentejas estofadas con verduras',
    c: 'menus',
    d: getDayOfMonth(3),
    h: '14:00',
    done: true,
    n: 'Acompañar con ensalada mixta',
    meal: 'almuerzo',
    plato: 'Lentejas estofadas con verduras y ensalada',
  },
  {
    id: 7,
    t: 'Menú: salmón a la plancha con espárragos',
    c: 'menus',
    d: getDayOfMonth(6),
    h: '21:00',
    done: false,
    n: 'Cena ligera rica en Omega 3',
    meal: 'cena',
    plato: 'Salmón a la plancha con espárragos trigueros',
  },
  {
    id: 8,
    t: 'Entrenamiento de fuerza y cardio',
    c: 'actividades',
    d: getDayOfMonth(7),
    h: '19:00',
    done: false,
    n: 'Sesión de 60 min + estiramientos',
    acti: 'gimnasio',
    lugar: 'Club Deportivo Municipal',
    alarm: 30,
  },
  {
    id: 9,
    t: 'Cena de celebración con amigos',
    c: 'personales',
    d: getDayOfMonth(13),
    h: '21:00',
    done: false,
    n: 'Mesa reservada en terraza para 6 personas',
    ptipo: 'amigos',
    lugar: 'Restaurante La Marina',
    alarm: 60,
  },
  {
    id: 10,
    t: 'Excursión y ruta de senderismo',
    c: 'actividades',
    d: getDayOfMonth(15),
    h: '09:00',
    done: false,
    n: 'Llevar calzado de montaña, agua y frutos secos',
    acti: 'aire',
    lugar: 'Parque Rural de Doramas',
    alarm: 60,
  },
  {
    id: 11,
    t: 'Renovar seguro del automóvil',
    c: 'recordatorios',
    d: getDayOfMonth(11),
    h: '12:00',
    done: false,
    n: 'Comparar coberturas antes del vencimiento',
    priority: 'urgente',
    alarm: 1440,
  },
  {
    id: 12,
    t: 'Cobro de nómina mensual',
    c: 'finanzas',
    d: getDayOfMonth(1),
    h: '08:00',
    done: true,
    n: 'Ingreso mensual en cuenta principal',
    fin: 'ingreso',
    concepto: 'Nómina mensual',
    cant: 2450,
  },
  {
    id: 13,
    t: 'Dentista: limpieza y revisión dental',
    c: 'medicas',
    d: getDayOfMonth(18),
    h: '16:00',
    done: false,
    n: 'Revisión anual con odontólogo',
    med: 'especialista',
    esp: 'Odontología',
    lugar: 'Clínica Dental Sonrisa',
    alarm: 60,
  },
  {
    id: 14,
    t: 'Organizar armarios y donar ropa de temporada',
    c: 'personales',
    d: '',
    h: '',
    isUndated: true,
    done: false,
    n: 'Separar prendas que ya no se usan para donación y guardar ropa de invierno',
    priority: 'normal',
  },
  {
    id: 15,
    t: 'Revisar suscripciones y servicios prescindibles',
    c: 'finanzas',
    d: '',
    h: '',
    isUndated: true,
    done: false,
    n: 'Comprobar cargos periódicos en el banco y dar de baja lo que no se use',
    priority: 'alta',
  },
];

export const INITIAL_MEDICATIONS: Medication[] = [
  {
    id: 101,
    n: 'Omega 3 & Vitamina D3',
    dose: '1 cápsula (1000 mg)',
    h: '09:00',
    on: true,
    lead: 10,
    taken: { [getTodayIso()]: true },
    alerted: {},
    notes: 'Tomar junto con el desayuno para mejorar su absorción',
  },
  {
    id: 102,
    n: 'Protector gástrico (Omeprazol)',
    dose: '1 comprimido (20 mg)',
    h: '08:00',
    on: true,
    lead: 5,
    taken: { [getTodayIso()]: true },
    alerted: {},
    notes: 'En ayunas 20 minutos antes de desayunar',
  },
  {
    id: 103,
    n: 'Magnesio quelado',
    dose: '1 cápsula (400 mg)',
    h: '22:00',
    on: true,
    lead: 15,
    taken: {},
    alerted: {},
    notes: 'Tomar antes de dormir para favorecer el descanso muscular',
  },
];

export const INITIAL_WEIGHTS: WeightEntry[] = [
  { d: getDayOfMonth(1), kg: 76.8, notes: 'Inicio de mes' },
  { d: getDayOfMonth(3), kg: 76.5, notes: 'Post entrenamiento' },
  { d: getDayOfMonth(5), kg: 76.2, notes: 'En ayunas' },
  { d: getDayOfMonth(8), kg: 75.9, notes: 'Progreso constante' },
  { d: getDayOfMonth(12), kg: 75.6, notes: 'Semana 2' },
];

export const DEFAULT_PUSH_SETTINGS: PushNotificationSettings = {
  enabled: false,
  taskRemindersEnabled: true,
  taskReminderLeadMinutes: 10,
  medicationRemindersEnabled: true,
  medicationReminderLeadMinutes: 5,
  dailyDigestEnabled: true,
  dailyDigestTime: '08:00',
  eveningReviewEnabled: true,
  eveningReviewTime: '21:30',
  quietHoursEnabled: false,
  quietHoursStart: '23:00',
  quietHoursEnd: '07:00',
  soundEnabled: true,
  vibrate: true,
};

export const INITIAL_SETTINGS: UserSettings = {
  theme: 'light',
  heightCm: 178,
  targetWeightKg: 74.0,
  enableSound: true,
  language: 'es',
  pushNotifications: DEFAULT_PUSH_SETTINGS,
  userName: 'Paco',
  userAvatar: 'preset:sparkle',
  userAvatarType: 'preset',
  showWelcomeOnStartup: true,
};

export const JOURNAL_MOODS: Record<JournalMood, { label: string; emoji: string; color: string; bg: string }> = {
  feliz: { label: 'Feliz y Agradecido', emoji: '😊', color: '#16a34a', bg: '#f0fdf4' },
  tranquilo: { label: 'En Paz y Calma', emoji: '😌', color: '#0284c7', bg: '#f0f9ff' },
  inspirado: { label: 'Inspirado / Creativo', emoji: '💡', color: '#d97706', bg: '#fffbeb' },
  productivo: { label: 'Productivo y Enfocado', emoji: '⚡', color: '#7c3aed', bg: '#f5f3ff' },
  cansado: { label: 'Cansado / Con Sueño', emoji: '😴', color: '#64748b', bg: '#f8fafc' },
  reflexivo: { label: 'Reflexivo / Pensativo', emoji: '🤔', color: '#ea580c', bg: '#fff7ed' },
  estres: { label: 'Estresado o Agobiado', emoji: '🌧️', color: '#dc2626', bg: '#fef2f2' },
};

export const JOURNAL_PROMPTS: string[] = [
  '¿Qué ha sido lo más especial o gratificante de tu día de hoy?',
  '¿Por qué cosas sientes gratitud y aprecio en este momento?',
  '¿Qué aprendizaje o lección valiosa te deja la jornada de hoy?',
  '¿Cómo te has sentido física y emocionalmente a lo largo del día?',
  '¿Qué conversación o detalle con otra persona te ha alegrado?',
  '¿Qué reto has afrontado hoy y qué has aprendido de él?',
  '¿Qué te gustaría hacer mañana para sentirte en paz y satisfecho?',
];

export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'journal-1',
    date: getDayOfMonth(2),
    title: 'Reflexiones y nuevos propósitos',
    content:
      'Hoy he dedicado un rato por la mañana a organizar mis prioridades del mes. Tener el calendario de tareas, las finanzas y los hábitos unificados en un mismo espacio me da mucha claridad mental. Me propongo mantener la constancia con las caminatas diarias y la lectura antes de dormir.',
    mood: 'inspirado',
    tags: ['Propósitos', 'Organización', 'Bienestar'],
    favorite: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'journal-2',
    date: getDayOfMonth(5),
    title: 'Paseo al atardecer y desconexión',
    content:
      'Después de terminar la jornada de trabajo salí a caminar sin mirar el teléfono. El aire fresco y caminar a buen ritmo me ayudaron a despejar la mente por completo y superar el objetivo diario de pasos.',
    mood: 'tranquilo',
    tags: ['Naturaleza', 'Gratitud', 'Salud'],
    favorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export interface HabitTemplate {
  name: string;
  description: string;
  emoji: string;
  color: string;
  category: string;
  frequency: 'daily' | 'weekdays' | 'weekends';
  targetCount?: number;
  unit?: string;
}

export const POPULAR_HABIT_TEMPLATES: HabitTemplate[] = [
  {
    name: 'Beber 2 litros de agua',
    description: 'Mantenerse hidratado a lo largo del día',
    emoji: '💧',
    color: '#0284c7',
    category: 'Salud',
    frequency: 'daily',
    targetCount: 2,
    unit: 'litros',
  },
  {
    name: '30 min de ejercicio o caminata',
    description: 'Mover el cuerpo para activar la circulación y liberar endorfinas',
    emoji: '🏃',
    color: '#10b981',
    category: 'Fitness',
    frequency: 'daily',
    targetCount: 30,
    unit: 'minutos',
  },
  {
    name: 'Leer 15 páginas',
    description: 'Fomentar el hábito de lectura diaria y aprendizaje',
    emoji: '📚',
    color: '#8b5cf6',
    category: 'Mente',
    frequency: 'daily',
    targetCount: 15,
    unit: 'páginas',
  },
  {
    name: 'Meditar o respirar 10 min',
    description: 'Pausa de calma para reducir el estrés y centrar la mente',
    emoji: '🧘',
    color: '#f59e0b',
    category: 'Bienestar',
    frequency: 'daily',
    targetCount: 10,
    unit: 'minutos',
  },
  {
    name: 'Dormir 7-8 horas',
    description: 'Descanso reparador y acostarse a buena hora',
    emoji: '🛌',
    color: '#6366f1',
    category: 'Descanso',
    frequency: 'daily',
    targetCount: 8,
    unit: 'horas',
  },
  {
    name: 'Comer ración de verdura y fruta',
    description: 'Aportar vitaminas y nutrientes frescos en las comidas',
    emoji: '🥗',
    color: '#22c55e',
    category: 'Nutrición',
    frequency: 'daily',
    targetCount: 1,
    unit: 'raciones',
  },
  {
    name: 'Desconexión digital 30m noche',
    description: 'Sin pantallas ni notificaciones antes de ir a dormir',
    emoji: '📵',
    color: '#ec4899',
    category: 'Desconexión',
    frequency: 'daily',
    targetCount: 30,
    unit: 'minutos',
  },
  {
    name: 'Escribir en el diario personal',
    description: 'Anotar pensamientos, agradecimientos y reflexiones',
    emoji: '✍️',
    color: '#a855f7',
    category: 'Reflexión',
    frequency: 'daily',
    targetCount: 1,
    unit: 'entrada',
  },
];

export const INITIAL_HABITS: Habit[] = [
  {
    id: 'habit-water-1',
    name: 'Beber 2 litros de agua',
    description: 'Mantenerse bien hidratado durante toda la jornada',
    emoji: '💧',
    color: '#0284c7',
    category: 'Salud',
    frequency: 'daily',
    targetCount: 2,
    unit: 'litros',
    history: {
      [getDayOfMonth(1)]: true,
      [getDayOfMonth(2)]: true,
      [getDayOfMonth(3)]: true,
      [getDayOfMonth(4)]: true,
      [getDayOfMonth(5)]: true,
      [getTodayIso()]: true,
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-walk-2',
    name: 'Caminar 10.000 pasos',
    description: 'Alcanzar la meta diaria de actividad y movimiento',
    emoji: '👟',
    color: '#10b981',
    category: 'Fitness',
    frequency: 'daily',
    targetCount: 10000,
    unit: 'pasos',
    history: {
      [getDayOfMonth(1)]: true,
      [getDayOfMonth(2)]: true,
      [getDayOfMonth(4)]: true,
      [getDayOfMonth(5)]: true,
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-read-3',
    name: 'Leer 20 minutos antes de dormir',
    description: 'Desconectar de las pantallas con un buen libro',
    emoji: '📚',
    color: '#8b5cf6',
    category: 'Mente',
    frequency: 'daily',
    targetCount: 20,
    unit: 'minutos',
    history: {
      [getDayOfMonth(1)]: true,
      [getDayOfMonth(3)]: true,
      [getDayOfMonth(5)]: true,
      [getTodayIso()]: true,
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-sleep-4',
    name: 'Descansar 8 horas',
    description: 'Mantener un horario de sueño regular y reparador',
    emoji: '🛌',
    color: '#6366f1',
    category: 'Descanso',
    frequency: 'daily',
    targetCount: 8,
    unit: 'horas',
    history: {
      [getDayOfMonth(2)]: true,
      [getDayOfMonth(3)]: true,
      [getDayOfMonth(4)]: true,
      [getDayOfMonth(5)]: true,
    },
    createdAt: new Date().toISOString(),
  },
];

