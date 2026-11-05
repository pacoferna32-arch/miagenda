import { CategoryInfo, CategoryKey, Task, Medication, WeightEntry, UserSettings, JournalEntry, JournalMood, Habit, PushNotificationSettings, AppLanguage } from '../types';

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

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth();

const getSampleDate = (dayNum: number): string => {
  return toIsoDate(new Date(currentYear, currentMonth, dayNum));
};

export const INITIAL_TASKS: Task[] = [
  {
    id: 1,
    t: 'Pagar el alquiler mensual',
    c: 'finanzas',
    d: getSampleDate(5),
    h: '09:00',
    done: false,
    n: 'Realizar transferencia bancaria antes de las 12:00',
    fin: 'gasto',
    concepto: 'Alquiler vivienda',
    cant: 850,
    finCat: 'Vivienda',
    priority: 'alta',
    alarm: 60,
  },
  {
    id: 2,
    t: 'Revisión con el médico de cabecera',
    c: 'medicas',
    d: getSampleDate(6),
    h: '10:30',
    done: false,
    n: 'Llevar los últimos análisis de sangre impresos',
    med: 'centro',
    lugar: 'Centro de Salud San Juan',
    alarm: 30,
    priority: 'alta',
  },
  {
    id: 3,
    t: 'Reunión de coordinación semanal',
    c: 'trabajo',
    d: getSampleDate(3),
    h: '09:30',
    done: true,
    n: 'Repaso de objetivos del mes y plan de entregas',
    turno: 'manana',
    lugar: 'Oficina Central / Sala B',
  },
  {
    id: 4,
    t: 'Entregar informe trimestral',
    c: 'trabajo',
    d: getSampleDate(9),
    h: '17:00',
    done: false,
    n: 'Adjuntar gráficas de rendimiento y facturación',
    priority: 'urgente',
    alarm: 120,
  },
  {
    id: 5,
    t: 'Compra semanal en el mercado',
    c: 'compras',
    d: getSampleDate(4),
    h: '18:00',
    done: false,
    n: 'Comprar producto fresco para las comidas de la semana',
    ctipo: 'super',
    items: [
      { id: '1', x: 'Plátanos y manzanas', d: true },
      { id: '2', x: 'Espinacas frescas y tomates', d: true },
      { id: '3', x: 'Filetes de salmón fresco', d: false },
      { id: '4', x: 'Aceite de oliva virgen extra', d: false },
      { id: '5', x: 'Avena integral y yogur natural', d: false },
    ],
  },
  {
    id: 6,
    t: 'Menú: lentejas estofadas con verduras',
    c: 'menus',
    d: getSampleDate(3),
    h: '14:00',
    done: true,
    n: 'Plato caliente completo con ensalada verde',
    meal: 'almuerzo',
    plato: 'Lentejas estofadas con verduras',
  },
  {
    id: 7,
    t: 'Menú: salmón a la plancha con espárragos',
    c: 'menus',
    d: getSampleDate(4),
    h: '21:00',
    done: false,
    n: 'Cena ligera proteica',
    meal: 'cena',
    plato: 'Salmón a la plancha con espárragos',
  },
  {
    id: 8,
    t: 'Entrenamiento de fuerza y cardio',
    c: 'actividades',
    d: getSampleDate(7),
    h: '19:00',
    done: false,
    n: 'Rutina de pierna y 20 min de elíptica',
    acti: 'gimnasio',
    lugar: 'Gimnasio Municipal',
  },
  {
    id: 9,
    t: 'Cena de celebración con amigos',
    c: 'personales',
    d: getSampleDate(13),
    h: '21:00',
    done: false,
    n: 'Mesa reservada para 6 personas a nombre de Paco',
    ptipo: 'amigos',
    lugar: 'Restaurante La Terraza',
    alarm: 60,
  },
  {
    id: 10,
    t: 'Excursión y ruta de senderismo',
    c: 'actividades',
    d: getSampleDate(15),
    h: '10:00',
    done: false,
    n: 'Ruta circular 9 km. Llevar agua y calzado de montaña',
    acti: 'aire',
    lugar: 'Parque Natural',
  },
  {
    id: 11,
    t: 'Renovar seguro del automóvil',
    c: 'recordatorios',
    d: getSampleDate(11),
    h: '12:00',
    done: false,
    n: 'Comparar pólizas antes del cobro automático',
    alarm: 1440,
    priority: 'alta',
  },
  {
    id: 12,
    t: 'Cobro de nómina mensual',
    c: 'finanzas',
    d: getSampleDate(1),
    h: '08:00',
    done: true,
    n: 'Ingreso mensual habitual',
    fin: 'ingreso',
    concepto: 'Nómina mensual',
    cant: 2150,
    finCat: 'Nómina',
  },
  {
    id: 13,
    t: 'Dentista: limpieza y revisión dental',
    c: 'medicas',
    d: getSampleDate(18),
    h: '16:00',
    done: false,
    n: 'Clínica Dental Dr. Morales',
    med: 'especialista',
    esp: 'Odontología general',
    lugar: 'Clínica Dental Dr. Morales, Calle Mayor 12',
    alarm: 120,
  },
];

export const INITIAL_MEDICATIONS: Medication[] = [
  {
    id: 101,
    n: 'Omega 3 & Vitamina D3',
    dose: '1 cápsula con el desayuno',
    h: '08:30',
    on: true,
    lead: 5,
    taken: { [toIsoDate(now)]: true },
    alerted: {},
    notes: 'Tomar junto con comida que contenga algo de grasa saludable para mejor absorción.',
  },
  {
    id: 102,
    n: 'Protector gástrico (Omeprazol)',
    dose: '20 mg en ayunas',
    h: '08:00',
    on: true,
    lead: 10,
    taken: { [toIsoDate(now)]: true },
    alerted: {},
    notes: 'Tomar 30 minutos antes del desayuno con un vaso entero de agua.',
  },
  {
    id: 103,
    n: 'Magnesio quelado',
    dose: '1 comprimido antes de acostarse',
    h: '22:30',
    on: true,
    lead: 15,
    taken: {},
    alerted: {},
    notes: 'Favorece la relajación muscular nocturna. No mezclar con suplementos de calcio.',
  },
];

export const INITIAL_WEIGHTS: WeightEntry[] = [
  { d: getSampleDate(1), kg: 76.8, notes: 'Inicio de mes' },
  { d: getSampleDate(4), kg: 76.5, notes: 'Post entrenamiento' },
  { d: getSampleDate(7), kg: 76.2, notes: 'En ayunas' },
  { d: getSampleDate(10), kg: 75.9, notes: 'Progreso constante' },
  { d: getSampleDate(14), kg: 75.6, notes: 'Semana 2' },
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
    id: toIsoDate(now),
    date: toIsoDate(now),
    title: 'Reflexiones y nuevos propósitos',
    content: 'Hoy ha sido un día bastante equilibrado. He conseguido organizar las tareas pendientes de la semana con calma y dedicar un rato a cuidar de mi bienestar. Me siento con energía para seguir avanzando paso a paso sin agobiarme.',
    mood: 'inspirado',
    tags: ['reflexion', 'calma', 'organizacion'],
    favorite: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: toIsoDate(new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 1))),
    date: toIsoDate(new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 1))),
    title: 'Paseo al atardecer y desconexión',
    content: 'Salí a caminar por la tarde durante media hora después de terminar las gestiones del día. Respirar aire fresco me ha ayudado mucho a despejar la mente y descansar mejor.',
    mood: 'tranquilo',
    tags: ['salud', 'paseo', 'desconexion'],
    favorite: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
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
    color: '#0284c7', // Sky blue
    category: 'Salud',
    frequency: 'daily',
    targetCount: 2,
    unit: 'litros',
  },
  {
    name: '30 min de ejercicio o caminata',
    description: 'Mover el cuerpo para activar la circulación y liberar endorfinas',
    emoji: '🏃',
    color: '#10b981', // Emerald
    category: 'Fitness',
    frequency: 'daily',
    targetCount: 30,
    unit: 'minutos',
  },
  {
    name: 'Leer 15 páginas',
    description: 'Fomentar el hábito de lectura diaria y aprendizaje',
    emoji: '📚',
    color: '#8b5cf6', // Violet
    category: 'Mente',
    frequency: 'daily',
    targetCount: 15,
    unit: 'páginas',
  },
  {
    name: 'Meditar o respirar 10 min',
    description: 'Pausa de calma para reducir el estrés y centrar la mente',
    emoji: '🧘',
    color: '#f59e0b', // Amber
    category: 'Bienestar',
    frequency: 'daily',
    targetCount: 10,
    unit: 'minutos',
  },
  {
    name: 'Dormir 7-8 horas',
    description: 'Descanso reparador y acostarse a buena hora',
    emoji: '🛌',
    color: '#6366f1', // Indigo
    category: 'Descanso',
    frequency: 'daily',
    targetCount: 8,
    unit: 'horas',
  },
  {
    name: 'Comer ración de verdura y fruta',
    description: 'Aportar vitaminas y nutrientes frescos en las comidas',
    emoji: '🥗',
    color: '#22c55e', // Green
    category: 'Nutrición',
    frequency: 'daily',
    targetCount: 1,
    unit: 'raciones',
  },
  {
    name: 'Desconexión digital 30m noche',
    description: 'Sin pantallas ni notificaciones antes de ir a dormir',
    emoji: '📵',
    color: '#ec4899', // Pink
    category: 'Desconexión',
    frequency: 'daily',
    targetCount: 30,
    unit: 'minutos',
  },
  {
    name: 'Escribir en el diario personal',
    description: 'Anotar pensamientos, agradecimientos y reflexiones',
    emoji: '✍️',
    color: '#a855f7', // Purple
    category: 'Reflexión',
    frequency: 'daily',
    targetCount: 1,
    unit: 'entrada',
  },
];

const getPastIsoDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return toIsoDate(d);
};

export const INITIAL_HABITS: Habit[] = [
  {
    id: 'habit-water-1',
    name: 'Beber 2L de agua',
    description: 'Hidratación constante durante la jornada',
    emoji: '💧',
    color: '#0284c7',
    category: 'Salud',
    frequency: 'daily',
    targetCount: 2,
    unit: 'litros',
    history: {
      [getPastIsoDate(3)]: true,
      [getPastIsoDate(2)]: true,
      [getPastIsoDate(1)]: true,
      [getPastIsoDate(0)]: true,
    },
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    archived: false,
  },
  {
    id: 'habit-walk-2',
    name: 'Caminar 30 min',
    description: 'Paseo activo al aire libre o entrenamiento',
    emoji: '🏃',
    color: '#10b981',
    category: 'Fitness',
    frequency: 'daily',
    targetCount: 30,
    unit: 'minutos',
    history: {
      [getPastIsoDate(4)]: true,
      [getPastIsoDate(2)]: true,
      [getPastIsoDate(1)]: true,
      [getPastIsoDate(0)]: true,
    },
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    archived: false,
  },
  {
    id: 'habit-read-3',
    name: 'Leer 15 páginas',
    description: 'Capítulo de libro o lectura de desarrollo',
    emoji: '📚',
    color: '#8b5cf6',
    category: 'Mente',
    frequency: 'daily',
    targetCount: 15,
    unit: 'páginas',
    history: {
      [getPastIsoDate(2)]: true,
      [getPastIsoDate(1)]: true,
    },
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    archived: false,
  },
  {
    id: 'habit-sleep-4',
    name: 'Dormir 8 horas',
    description: 'Descanso profundo sin interrupciones',
    emoji: '🛌',
    color: '#6366f1',
    category: 'Descanso',
    frequency: 'daily',
    targetCount: 8,
    unit: 'horas',
    history: {
      [getPastIsoDate(3)]: true,
      [getPastIsoDate(2)]: true,
      [getPastIsoDate(1)]: true,
    },
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    archived: false,
  },
];

