export type CategoryKey =
  | 'recordatorios'
  | 'medicas'
  | 'personales'
  | 'trabajo'
  | 'compras'
  | 'menus'
  | 'actividades'
  | 'finanzas'
  | 'diario'
  | 'habitos';

export interface CategoryInfo {
  k: CategoryKey;
  n: string;
  e: string;
  c: string; // Hex color
  bgLight: string;
  textLight: string;
}

export interface ShoppingItem {
  id: string;
  x: string; // Item text
  d: boolean; // Done
}

export type PriorityLevel = 'normal' | 'alta' | 'urgente';

export interface Task {
  id: number;
  t: string; // Title
  c: CategoryKey;
  d: string; // YYYY-MM-DD
  h: string; // HH:MM
  done: boolean;
  n: string; // Notes
  priority?: PriorityLevel;
  ink?: string | null; // Data URL of drawing
  alarm?: number | null; // Minutes before
  fired?: boolean;
  snooze?: number | null;

  // Category specific
  fin?: 'gasto' | 'ingreso' | null;
  concepto?: string;
  cant?: number | null;
  finCat?: string;

  acti?: 'gimnasio' | 'aire' | 'agua' | 'cine' | 'cultural' | null;
  meal?: 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | null;
  plato?: string;

  ctipo?: 'super' | 'ropa' | 'higiene' | 'menaje' | 'farmacia' | null;
  items?: ShoppingItem[] | null;

  turno?: 'manana' | 'tarde' | 'noche' | 'partido' | null;
  ptipo?: 'trabajo' | 'almuerzo' | 'cena' | 'amigos' | 'pareja' | 'tramite' | null;
  med?: 'centro' | 'especialista' | null;
  esp?: string;
  lugar?: string;
}

export interface Medication {
  id: number;
  n: string; // Name
  dose: string;
  h: string; // HH:MM
  on: boolean;
  lead: number; // Alert lead minutes
  taken: Record<string, boolean>; // date -> boolean
  alerted: Record<string, boolean>; // date -> boolean
  snooze?: number | null;
  notes?: string; // Anotaciones e instrucciones médicas
}

export interface WeightEntry {
  d: string; // YYYY-MM-DD
  kg: number;
  notes?: string;
}

export type AppLanguage = 'es' | 'en' | 'fr' | 'de' | 'it' | 'pt' | 'ca' | 'gl' | 'eu';

export interface WebPushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number | null;
  userAgent?: string;
  createdAt?: string;
}

export interface PushNotificationSettings {
  enabled: boolean;
  taskRemindersEnabled: boolean;
  taskReminderLeadMinutes: number; // 0 (exact), 5, 10, 15, 30, 60
  medicationRemindersEnabled: boolean;
  medicationReminderLeadMinutes: number; // 0 (exact), 5, 10, 15, 30
  dailyDigestEnabled: boolean;
  dailyDigestTime: string; // e.g. "08:00"
  eveningReviewEnabled: boolean;
  eveningReviewTime: string; // e.g. "21:30"
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "23:00"
  quietHoursEnd: string; // "07:00"
  soundEnabled: boolean;
  vibrate: boolean;
  activeDays?: 'all' | 'weekdays';
  subscription?: WebPushSubscriptionData;
}

export interface PremiumSubscription {
  isPremium: boolean;
  type: 'lifetime';
  purchasedAt?: string;
  paymentMethod?: 'card' | 'transfer' | 'paypal';
  currency?: string;
  amount?: number;
  transactionRef?: string;
  paypalEmail?: string;
  paypalOrderId?: string;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  heightCm: number;
  targetWeightKg: number;
  enableSound: boolean;
  diaryPin?: string; // Clave de 4 dígitos para Diario Personal
  language?: AppLanguage;
  pushNotifications?: PushNotificationSettings;
  premium?: PremiumSubscription;
  userName?: string;
  userAvatar?: string;
  userAvatarType?: 'upload' | 'preset' | 'emoji';
  showWelcomeOnStartup?: boolean;
}

export interface TabAttachment {
  id: string;
  name: string;
  type: 'image' | 'audio' | 'pdf' | 'document' | 'file';
  dataUrl: string;
  size?: number;
  mimeType?: string;
  createdAt: string;
}

export interface TabLink {
  id: string;
  title: string;
  url: string;
  createdAt: string;
}

export interface TabVoiceNote {
  id: string;
  audioUrl?: string;
  transcript?: string;
  duration?: number;
  createdAt: string;
}

export interface TabNoteData {
  tabKey: string;
  text: string;
  drawing?: string | null;
  voiceNotes: TabVoiceNote[];
  attachments: TabAttachment[];
  links: TabLink[];
  updatedAt: string;
}

export type JournalMood =
  | 'feliz'
  | 'tranquilo'
  | 'inspirado'
  | 'productivo'
  | 'cansado'
  | 'reflexivo'
  | 'estres';

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  mood?: JournalMood;
  tags?: string[];
  photoUrl?: string;
  drawing?: string | null;
  voiceNotes?: TabVoiceNote[];
  attachments?: TabAttachment[];
  favorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  emoji: string;
  color: string;
  category?: string;
  frequency: 'daily' | 'weekdays' | 'weekends';
  targetCount?: number;
  unit?: string;
  history: Record<string, boolean>; // date (YYYY-MM-DD) -> true
  createdAt: string;
  archived?: boolean;
}

