import React, { useState, useEffect, useRef } from 'react';
import { Task, Medication, WeightEntry, UserSettings, CategoryKey, JournalEntry, Habit, PremiumSubscription } from './types';
import {
  INITIAL_TASKS,
  INITIAL_MEDICATIONS,
  INITIAL_WEIGHTS,
  INITIAL_SETTINGS,
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_HABITS,
  CATEGORY_MAP,
  MESES,
  MEAL_HOURS,
  toIsoDate,
} from './utils/constants';
import { sounds } from './utils/audio';
import { Sidebar } from './components/Sidebar';
import { MonthView } from './components/MonthView';
import { DayView } from './components/DayView';
import { WeekCalendarView } from './components/WeekCalendarView';
import { ListView } from './components/ListView';
import { WeekView } from './components/WeekView';
import { FinanzasView } from './components/FinanzasView';
import { MedicationView } from './components/MedicationView';
import { WeightTrackerView } from './components/WeightTrackerView';
import { ShoppingView } from './components/ShoppingView';
import { JournalView } from './components/JournalView';
import { HabitTrackerView } from './components/HabitTrackerView';
import { WelcomeView } from './components/WelcomeView';
import { TaskModal } from './components/TaskModal';
import { ToastAlarms } from './components/ToastAlarms';
import { AndroidInstallModal } from './components/AndroidInstallModal';
import { IOSInstallModal } from './components/IOSInstallModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AuthModal } from './components/AuthModal';
import { TabNotesSection } from './components/TabNotesSection';
import { DiaryPinModal } from './components/DiaryPinModal';
import { UserSettingsModal } from './components/UserSettingsModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AdBanner } from './components/AdBanner';
import { WeatherWidget, WeatherWeekBanner } from './components/WeatherWidget';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useAuth } from './context/AuthContext';
import { db, handleFirestoreError, OperationType, cleanFirestoreData } from './utils/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import {
  t,
  getCategoryLocalizedName,
  getLocalizedMonthName,
  getLocalizedDayName,
} from './utils/i18n';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  Clock,
  List,
  Plus,
  LogOut,
  Settings,
  Globe,
  Crown,
  Sparkles,
} from 'lucide-react';

const INITIAL_TASKS_BY_ID = new Map<number, Task>(INITIAL_TASKS.map((item) => [item.id, item]));
const INITIAL_MEDS_BY_ID = new Map<number, Medication>(INITIAL_MEDICATIONS.map((m) => [m.id, m]));
const INITIAL_WEIGHTS_BY_DATE = new Map<string, WeightEntry>(INITIAL_WEIGHTS.map((w) => [w.d, w]));
const INITIAL_JOURNAL_BY_KEY = new Map<string, JournalEntry>(
  INITIAL_JOURNAL_ENTRIES.map((j) => [j.id || j.date, j])
);
const INITIAL_HABITS_BY_ID = new Map<string, Habit>(INITIAL_HABITS.map((h) => [h.id, h]));

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}/;

function isValidIsoDateString(val: unknown): val is string {
  return typeof val === 'string' && ISO_DATE_REGEX.test(val.trim());
}

export function normalizeTask(
  raw: unknown,
  fallback?: Task,
  docId?: string
): Task | null {
  if (!raw || typeof raw !== 'object') {
    return fallback ? { ...fallback } : null;
  }

  const obj = raw as Record<string, unknown>;
  const rawId =
    typeof obj.id === 'number' && Number.isFinite(obj.id)
      ? obj.id
      : typeof obj.id === 'string' && obj.id.trim() !== '' && Number.isFinite(Number(obj.id))
      ? Number(obj.id)
      : docId && Number.isFinite(Number(docId))
      ? Number(docId)
      : fallback?.id;

  if (typeof rawId !== 'number' || !Number.isFinite(rawId)) {
    return null;
  }

  const base = fallback || INITIAL_TASKS_BY_ID.get(rawId);

  const rawDate = typeof obj.d === 'string' ? obj.d.trim().slice(0, 10) : '';
  const validDate = isValidIsoDateString(rawDate)
    ? rawDate
    : base?.d && isValidIsoDateString(base.d)
    ? base.d
    : '';

  const rawTitle =
    typeof obj.t === 'string' && obj.t.trim()
      ? obj.t.trim()
      : typeof obj.concepto === 'string' && obj.concepto.trim()
      ? obj.concepto.trim()
      : typeof obj.plato === 'string' && obj.plato.trim()
      ? obj.plato.trim()
      : base?.t || '';

  // Discard orphan partial objects (e.g. { done: true }) that have no title, no date, and no matching base task
  if (!validDate || !rawTitle) {
    return base ? { ...base, done: typeof obj.done === 'boolean' ? obj.done : base.done } : null;
  }

  const rawCat = typeof obj.c === 'string' ? (obj.c as CategoryKey) : undefined;
  const validCat: CategoryKey =
    rawCat && CATEGORY_MAP[rawCat]
      ? rawCat
      : base?.c && CATEGORY_MAP[base.c]
      ? base.c
      : 'recordatorios';

  const rawTime = typeof obj.h === 'string' ? obj.h.trim() : '';
  const validTime = TIME_REGEX.test(rawTime)
    ? rawTime.slice(0, 5)
    : base?.h && TIME_REGEX.test(base.h)
    ? base.h.slice(0, 5)
    : '09:00';

  const merged: Task = {
    ...(base || {}),
    ...(obj as Partial<Task>),
    id: rawId,
    t: rawTitle,
    c: validCat,
    d: validDate,
    h: validTime,
    done: typeof obj.done === 'boolean' ? obj.done : Boolean(base?.done),
    n: typeof obj.n === 'string' ? obj.n : base?.n || '',
  };

  if (Array.isArray(merged.items)) {
    merged.items = merged.items
      .filter((item) => item && typeof item === 'object' && typeof item.x === 'string')
      .map((item, idx) => ({
        id: typeof item.id === 'string' && item.id ? item.id : `item-${rawId}-${idx}`,
        x: String(item.x),
        d: Boolean(item.d),
      }));
  }

  return merged;
}

export function normalizeMedication(
  raw: unknown,
  fallback?: Medication,
  docId?: string
): Medication | null {
  if (!raw || typeof raw !== 'object') {
    return fallback ? { ...fallback } : null;
  }

  const obj = raw as Record<string, unknown>;
  const rawId =
    typeof obj.id === 'number' && Number.isFinite(obj.id)
      ? obj.id
      : typeof obj.id === 'string' && obj.id.trim() !== '' && Number.isFinite(Number(obj.id))
      ? Number(obj.id)
      : docId && Number.isFinite(Number(docId))
      ? Number(docId)
      : fallback?.id;

  if (typeof rawId !== 'number' || !Number.isFinite(rawId)) {
    return null;
  }

  const base = fallback || INITIAL_MEDS_BY_ID.get(rawId);
  const name =
    typeof obj.n === 'string' && obj.n.trim()
      ? obj.n.trim()
      : base?.n || '';

  if (!name) {
    return null;
  }

  const rawTime = typeof obj.h === 'string' ? obj.h.trim() : '';
  const validTime = TIME_REGEX.test(rawTime)
    ? rawTime.slice(0, 5)
    : base?.h && TIME_REGEX.test(base.h)
    ? base.h.slice(0, 5)
    : '09:00';

  const takenObj =
    obj.taken && typeof obj.taken === 'object' && !Array.isArray(obj.taken)
      ? (obj.taken as Record<string, boolean>)
      : base?.taken || {};

  const alertedObj =
    obj.alerted && typeof obj.alerted === 'object' && !Array.isArray(obj.alerted)
      ? (obj.alerted as Record<string, boolean>)
      : base?.alerted || {};

  return {
    ...(base || {}),
    ...(obj as Partial<Medication>),
    id: rawId,
    n: name,
    dose:
      typeof obj.dose === 'string' && obj.dose.trim()
        ? obj.dose.trim()
        : base?.dose || '1 toma diaria',
    h: validTime,
    on: typeof obj.on === 'boolean' ? obj.on : base?.on ?? true,
    lead:
      typeof obj.lead === 'number' && Number.isFinite(obj.lead)
        ? obj.lead
        : base?.lead ?? 5,
    taken: { ...(base?.taken || {}), ...takenObj },
    alerted: { ...(base?.alerted || {}), ...alertedObj },
    notes: typeof obj.notes === 'string' ? obj.notes : base?.notes,
  };
}

export function normalizeWeight(
  raw: unknown,
  fallback?: WeightEntry,
  docId?: string
): WeightEntry | null {
  if (!raw || typeof raw !== 'object') {
    return fallback ? { ...fallback } : null;
  }

  const obj = raw as Record<string, unknown>;
  const candidateDate =
    typeof obj.d === 'string' && isValidIsoDateString(obj.d.trim().slice(0, 10))
      ? obj.d.trim().slice(0, 10)
      : docId && isValidIsoDateString(docId.trim().slice(0, 10))
      ? docId.trim().slice(0, 10)
      : fallback?.d || '';

  if (!isValidIsoDateString(candidateDate)) {
    return null;
  }

  const base = fallback || INITIAL_WEIGHTS_BY_DATE.get(candidateDate);
  const parsedKg =
    typeof obj.kg === 'number'
      ? obj.kg
      : typeof obj.kg === 'string'
      ? parseFloat(obj.kg.replace(',', '.'))
      : base?.kg ?? NaN;

  if (!Number.isFinite(parsedKg) || parsedKg <= 0) {
    return null;
  }

  return {
    d: candidateDate,
    kg: Math.round(parsedKg * 10) / 10,
    notes: typeof obj.notes === 'string' ? obj.notes : base?.notes,
  };
}

export function normalizeJournalEntry(
  raw: unknown,
  fallback?: JournalEntry,
  docId?: string
): JournalEntry | null {
  if (!raw || typeof raw !== 'object') {
    return fallback ? { ...fallback } : null;
  }

  const obj = raw as Record<string, unknown>;
  const rawDate =
    typeof obj.date === 'string' && isValidIsoDateString(obj.date.trim().slice(0, 10))
      ? obj.date.trim().slice(0, 10)
      : docId && isValidIsoDateString(docId.trim().slice(0, 10))
      ? docId.trim().slice(0, 10)
      : fallback?.date || '';

  if (!isValidIsoDateString(rawDate)) {
    return null;
  }

  const id =
    typeof obj.id === 'string' && obj.id.trim()
      ? obj.id.trim()
      : docId || fallback?.id || `journal-${rawDate}`;

  const base = fallback || INITIAL_JOURNAL_BY_KEY.get(id) || INITIAL_JOURNAL_BY_KEY.get(rawDate);
  const nowIso = new Date().toISOString();

  return {
    ...(base || {}),
    ...(obj as Partial<JournalEntry>),
    id,
    date: rawDate,
    title: typeof obj.title === 'string' ? obj.title : base?.title || 'Entrada del diario',
    content: typeof obj.content === 'string' ? obj.content : base?.content || '',
    tags: Array.isArray(obj.tags)
      ? obj.tags.filter((tag): tag is string => typeof tag === 'string')
      : base?.tags || [],
    voiceNotes: Array.isArray(obj.voiceNotes) ? obj.voiceNotes : base?.voiceNotes || [],
    attachments: Array.isArray(obj.attachments) ? obj.attachments : base?.attachments || [],
    favorite: typeof obj.favorite === 'boolean' ? obj.favorite : Boolean(base?.favorite),
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : base?.createdAt || nowIso,
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : base?.updatedAt || nowIso,
  };
}

export function normalizeHabit(
  raw: unknown,
  fallback?: Habit,
  docId?: string
): Habit | null {
  if (!raw || typeof raw !== 'object') {
    return fallback ? { ...fallback } : null;
  }

  const obj = raw as Record<string, unknown>;
  const id =
    typeof obj.id === 'string' && obj.id.trim()
      ? obj.id.trim()
      : docId || fallback?.id || '';

  if (!id) {
    return null;
  }

  const base = fallback || INITIAL_HABITS_BY_ID.get(id);
  const name =
    typeof obj.name === 'string' && obj.name.trim()
      ? obj.name.trim()
      : base?.name || '';

  if (!name) {
    return null;
  }

  const rawHistory =
    obj.history && typeof obj.history === 'object' && !Array.isArray(obj.history)
      ? (obj.history as Record<string, boolean>)
      : {};

  const freq = obj.frequency;
  const validFrequency: 'daily' | 'weekdays' | 'weekends' =
    freq === 'daily' || freq === 'weekdays' || freq === 'weekends'
      ? freq
      : base?.frequency || 'daily';

  return {
    ...(base || {}),
    ...(obj as Partial<Habit>),
    id,
    name,
    description: typeof obj.description === 'string' ? obj.description : base?.description,
    emoji: typeof obj.emoji === 'string' && obj.emoji.trim() ? obj.emoji : base?.emoji || '🔥',
    color: typeof obj.color === 'string' && obj.color.trim() ? obj.color : base?.color || '#059669',
    category: typeof obj.category === 'string' ? obj.category : base?.category || 'Salud',
    frequency: validFrequency,
    history: { ...(base?.history || {}), ...rawHistory },
    createdAt:
      typeof obj.createdAt === 'string' && obj.createdAt
        ? obj.createdAt
        : base?.createdAt || new Date().toISOString(),
  };
}

function loadInitialTasks(): Task[] {
  const map = new Map<number, Task>(INITIAL_TASKS.map((item) => [item.id, item]));
  try {
    localStorage.removeItem('ai_samples_purged_v1');
    localStorage.removeItem('ai_samples_purged_v2');
    const saved = localStorage.getItem('tareas-v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        parsed.forEach((rawItem) => {
          const existingId =
            rawItem && typeof rawItem === 'object' && typeof rawItem.id === 'number'
              ? rawItem.id
              : undefined;
          const fallback = existingId !== undefined ? map.get(existingId) : undefined;
          const normalized = normalizeTask(rawItem, fallback);
          if (normalized) {
            map.set(normalized.id, normalized);
          }
        });
      }
    }
  } catch {}
  return Array.from(map.values());
}

function loadInitialMedications(): Medication[] {
  const map = new Map<number, Medication>(INITIAL_MEDICATIONS.map((m) => [m.id, m]));
  try {
    const saved = localStorage.getItem('meds-v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        parsed.forEach((rawMed) => {
          const existingId =
            rawMed && typeof rawMed === 'object' && typeof rawMed.id === 'number'
              ? rawMed.id
              : undefined;
          const fallback = existingId !== undefined ? map.get(existingId) : undefined;
          const normalized = normalizeMedication(rawMed, fallback);
          if (normalized) {
            map.set(normalized.id, normalized);
          }
        });
      }
    }
  } catch {}
  return Array.from(map.values());
}

function loadInitialWeights(): WeightEntry[] {
  const map = new Map<string, WeightEntry>(INITIAL_WEIGHTS.map((w) => [w.d, w]));
  try {
    const saved = localStorage.getItem('peso-v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        parsed.forEach((rawWeight) => {
          const normalized = normalizeWeight(rawWeight);
          if (normalized) {
            map.set(normalized.d, normalized);
          }
        });
      }
    }
  } catch {}
  return Array.from(map.values()).sort((a, b) => (a.d || '').localeCompare(b.d || ''));
}

function loadInitialJournal(): JournalEntry[] {
  const map = new Map<string, JournalEntry>(
    INITIAL_JOURNAL_ENTRIES.map((j) => [j.id || j.date, j])
  );
  try {
    const saved = localStorage.getItem('diario-v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        parsed.forEach((rawEntry) => {
          const key =
            rawEntry && typeof rawEntry === 'object'
              ? (rawEntry.id as string) || (rawEntry.date as string)
              : undefined;
          const fallback = key ? map.get(key) : undefined;
          const normalized = normalizeJournalEntry(rawEntry, fallback);
          if (normalized) {
            map.set(normalized.id || normalized.date, normalized);
          }
        });
      }
    }
  } catch {}
  return Array.from(map.values());
}

function loadInitialHabits(): Habit[] {
  const map = new Map<string, Habit>(INITIAL_HABITS.map((h) => [h.id, h]));
  try {
    const saved = localStorage.getItem('habitos-v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        parsed.forEach((rawHabit) => {
          const id =
            rawHabit && typeof rawHabit === 'object' && typeof rawHabit.id === 'string'
              ? rawHabit.id
              : undefined;
          const fallback = id ? map.get(id) : undefined;
          const normalized = normalizeHabit(rawHabit, fallback);
          if (normalized) {
            map.set(normalized.id, normalized);
          }
        });
      }
    }
  } catch {}
  return Array.from(map.values());
}

function loadInitialSettings(): UserSettings {
  try {
    const saved = localStorage.getItem('settings-v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return {
          ...INITIAL_SETTINGS,
          ...parsed,
          theme: parsed.theme === 'dark' ? 'dark' : 'light',
          heightCm:
            typeof parsed.heightCm === 'number' && Number.isFinite(parsed.heightCm)
              ? parsed.heightCm
              : INITIAL_SETTINGS.heightCm,
          targetWeightKg:
            typeof parsed.targetWeightKg === 'number' && Number.isFinite(parsed.targetWeightKg)
              ? parsed.targetWeightKg
              : INITIAL_SETTINGS.targetWeightKg,
        };
      }
    }
  } catch {}
  return INITIAL_SETTINGS;
}

export default function App() {
  const sessionDeletedTaskIdsRef = useRef<Set<number>>(new Set());

  const [tasks, setTasks] = useState<Task[]>(loadInitialTasks);
  const [medications, setMedications] = useState<Medication[]>(loadInitialMedications);
  const [weights, setWeights] = useState<WeightEntry[]>(loadInitialWeights);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(loadInitialJournal);
  const [habits, setHabits] = useState<Habit[]>(loadInitialHabits);
  const [settings, setSettings] = useState<UserSettings>(loadInitialSettings);

  // Navigation & View state
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [currentDayDate, setCurrentDayDate] = useState<Date>(() => new Date());

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = (now.getDay() + 6) % 7;
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    return start;
  });

  const [currentCategory, setCurrentCategory] = useState<CategoryKey | 'all'>('all');
  const [activeView, setActiveView] = useState<
    'welcome' | 'month' | 'week' | 'day' | 'list' | 'menus' | 'finanzas' | 'medication' | 'weight' | 'shopping' | 'journal' | 'habits'
  >(() => (settings.showWelcomeOnStartup ?? true ? 'welcome' : 'month'));

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<
    'profile' | 'push' | 'language' | 'general' | 'security' | undefined
  >(undefined);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);
  const [isIOSModalOpen, setIsIOSModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authRequiredPrompt, setAuthRequiredPrompt] = useState<string | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // 4-Digit Security PIN state for Diario Personal
  const [isDiaryUnlocked, setIsDiaryUnlocked] = useState(false);
  const [isDiaryPinModalOpen, setIsDiaryPinModalOpen] = useState(false);
  const [diaryPinModalMode, setDiaryPinModalMode] = useState<'unlock' | 'change'>('unlock');
  const [journalInitialDate, setJournalInitialDate] = useState<string | null>(null);
  const [pendingJournalDate, setPendingJournalDate] = useState<string | null>(null);

  const { isInstalled } = usePWAInstall();
  const { user, loading: authLoading, logout } = useAuth();
  const currentLang = settings.language || 'es';
  const isPremium = !!settings.premium?.isPremium;

  const getTabTitle = (view: string, cat: CategoryKey | 'all'): string => {
    if (view === 'welcome') return 'Inicio y Bienvenida';
    if (view === 'day') return 'Calendario Día';
    if (view === 'week') return 'Calendario Semana';
    if (view === 'menus') return 'Menús Semanales';
    if (view === 'habits') return 'Habit Tracker';
    if (view === 'journal') return 'Diario Personal';
    if (view === 'finanzas') return 'Finanzas y Balance';
    if (view === 'shopping') return 'Lista de Compras';
    if (view === 'medication') return 'Medicación Diaria';
    if (view === 'weight') return 'Control de Peso';
    if (view === 'list') return 'Lista de Tareas';
    if (cat !== 'all') return CATEGORY_MAP[cat]?.n || 'Categoría';
    return 'Calendario Mes';
  };

  const latestStateRef = useRef({
    tasks,
    medications,
    weights,
    journalEntries,
    habits,
    settings,
  });

  useEffect(() => {
    latestStateRef.current = {
      tasks,
      medications,
      weights,
      journalEntries,
      habits,
      settings,
    };
  }, [tasks, medications, weights, journalEntries, habits, settings]);

  // Firestore Real-time Multi-Device Sync when logged in
  useEffect(() => {
    if (!user) return;

    const tasksCol = collection(db, 'users', user.uid, 'tasks');
    const unsubscribeTasks = onSnapshot(
      tasksCol,
      (snapshot) => {
        const currentLocal = latestStateRef.current.tasks;
        const map = new Map<number, Task>();

        currentLocal.forEach((tItem) => {
          const validLocal = normalizeTask(tItem);
          if (validLocal && !sessionDeletedTaskIdsRef.current.has(validLocal.id)) {
            map.set(validLocal.id, validLocal);
          }
        });

        snapshot.forEach((d) => {
          const rawData = d.data();
          const candidateId =
            typeof rawData?.id === 'number'
              ? rawData.id
              : Number.isFinite(Number(d.id))
              ? Number(d.id)
              : undefined;
          const fallback =
            (candidateId !== undefined ? map.get(candidateId) : undefined) ||
            (candidateId !== undefined ? INITIAL_TASKS_BY_ID.get(candidateId) : undefined);

          const normalized = normalizeTask(rawData, fallback, d.id);
          if (normalized && !sessionDeletedTaskIdsRef.current.has(normalized.id)) {
            map.set(normalized.id, normalized);
            // Self-heal partial cloud documents that were missing d, t, c, or h
            if (typeof rawData?.d !== 'string' || typeof rawData?.t !== 'string') {
              setDoc(
                doc(db, 'users', user.uid, 'tasks', String(normalized.id)),
                cleanFirestoreData(normalized),
                { merge: true }
              ).catch(() => {});
            }
          }
        });

        const cloudIds = new Set(snapshot.docs.map((d) => Number(d.id)));
        map.forEach((tItem) => {
          if (!cloudIds.has(tItem.id)) {
            setDoc(doc(db, 'users', user.uid, 'tasks', String(tItem.id)), cleanFirestoreData(tItem)).catch(() => {});
          }
        });

        setTasks(Array.from(map.values()));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/tasks`);
      }
    );

    const medsCol = collection(db, 'users', user.uid, 'medications');
    const unsubscribeMeds = onSnapshot(
      medsCol,
      (snapshot) => {
        const currentLocal = latestStateRef.current.medications;
        const map = new Map<number, Medication>();
        currentLocal.forEach((m) => {
          const validMed = normalizeMedication(m);
          if (validMed) map.set(validMed.id, validMed);
        });

        snapshot.forEach((d) => {
          const rawMed = d.data();
          const candidateId =
            typeof rawMed?.id === 'number'
              ? rawMed.id
              : Number.isFinite(Number(d.id))
              ? Number(d.id)
              : undefined;
          const fallback =
            (candidateId !== undefined ? map.get(candidateId) : undefined) ||
            (candidateId !== undefined ? INITIAL_MEDS_BY_ID.get(candidateId) : undefined);

          const normalized = normalizeMedication(rawMed, fallback, d.id);
          if (normalized) {
            map.set(normalized.id, normalized);
          }
        });
        setMedications(Array.from(map.values()));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/medications`);
      }
    );

    const weightsCol = collection(db, 'users', user.uid, 'weights');
    const unsubscribeWeights = onSnapshot(
      weightsCol,
      (snapshot) => {
        const currentLocal = latestStateRef.current.weights;
        const map = new Map<string, WeightEntry>();
        currentLocal.forEach((w) => {
          const validW = normalizeWeight(w);
          if (validW) map.set(validW.d, validW);
        });

        snapshot.forEach((d) => {
          const rawW = d.data();
          const fallback = map.get(d.id) || INITIAL_WEIGHTS_BY_DATE.get(d.id);
          const normalized = normalizeWeight(rawW, fallback, d.id);
          if (normalized) {
            map.set(normalized.d, normalized);
          }
        });
        setWeights(Array.from(map.values()).sort((a, b) => (a.d || '').localeCompare(b.d || '')));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/weights`);
      }
    );

    const journalCol = collection(db, 'users', user.uid, 'journal');
    const unsubscribeJournal = onSnapshot(
      journalCol,
      (snapshot) => {
        const currentLocal = latestStateRef.current.journalEntries;
        const map = new Map<string, JournalEntry>();
        currentLocal.forEach((j) => {
          const validJ = normalizeJournalEntry(j);
          if (validJ) map.set(validJ.id || validJ.date, validJ);
        });

        snapshot.forEach((d) => {
          const rawJ = d.data();
          const fallback = map.get(d.id) || INITIAL_JOURNAL_BY_KEY.get(d.id);
          const normalized = normalizeJournalEntry(rawJ, fallback, d.id);
          if (normalized) {
            map.set(normalized.id || normalized.date, normalized);
          }
        });
        setJournalEntries(Array.from(map.values()));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/journal`);
      }
    );

    const habitsCol = collection(db, 'users', user.uid, 'habits');
    const unsubscribeHabits = onSnapshot(
      habitsCol,
      (snapshot) => {
        const currentLocal = latestStateRef.current.habits;
        const map = new Map<string, Habit>();
        currentLocal.forEach((h) => {
          const validH = normalizeHabit(h);
          if (validH) map.set(validH.id, validH);
        });

        snapshot.forEach((d) => {
          const rawH = d.data();
          const fallback = map.get(d.id) || INITIAL_HABITS_BY_ID.get(d.id);
          const normalized = normalizeHabit(rawH, fallback, d.id);
          if (normalized) {
            map.set(normalized.id, normalized);
          }
        });
        setHabits(Array.from(map.values()));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/habits`);
      }
    );

    const settingsDocRef = doc(db, 'users', user.uid, 'settings', 'config');
    const unsubscribeSettings = onSnapshot(
      settingsDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const cloudSettings = snapshot.data() as Partial<UserSettings>;
          setSettings((prev) => ({ ...prev, ...cloudSettings }));
        } else {
          setDoc(settingsDocRef, cleanFirestoreData(latestStateRef.current.settings), { merge: true }).catch(() => {});
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/settings/config`);
      }
    );

    return () => {
      unsubscribeTasks();
      unsubscribeMeds();
      unsubscribeWeights();
      unsubscribeJournal();
      unsubscribeHabits();
      unsubscribeSettings();
    };
  }, [user]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tareas-v2', JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('meds-v2', JSON.stringify(medications));
    } catch {}
  }, [medications]);

  useEffect(() => {
    try {
      localStorage.setItem('peso-v2', JSON.stringify(weights));
    } catch {}
  }, [weights]);

  useEffect(() => {
    try {
      localStorage.setItem('diario-v1', JSON.stringify(journalEntries));
    } catch {}
  }, [journalEntries]);

  useEffect(() => {
    try {
      localStorage.setItem('habitos-v1', JSON.stringify(habits));
    } catch {}
  }, [habits]);

  useEffect(() => {
    try {
      localStorage.setItem('settings-v2', JSON.stringify(settings));
    } catch {}

    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (settings.language) {
      document.documentElement.lang = settings.language;
    }
  }, [settings]);

  const requestNotificationPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  };

  const [deletedTaskToast, setDeletedTaskToast] = useState<Task | null>(null);

  // Task Handlers
  const handleToggleTask = async (id: number) => {
    const target = tasks.find((tItem) => tItem.id === id);
    if (!target) return;

    const nextDone = !target.done;
    if (nextDone) {
      sounds.playCompleteChime();
    }

    const updatedTask: Task = { ...target, done: nextDone };

    setTasks((prev) =>
      prev.map((tItem) => (tItem.id === id ? updatedTask : tItem))
    );

    if (user) {
      try {
        await setDoc(
          doc(db, 'users', user.uid, 'tasks', String(id)),
          cleanFirestoreData(updatedTask),
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/tasks/${id}`);
      }
    }
  };

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'done'>, editId?: number) => {
    requestNotificationPermission();

    let taskToSave: Task;
    if (editId) {
      const existing = tasks.find((tItem) => tItem.id === editId);
      const candidate: Task = {
        id: editId,
        done: existing ? existing.done : false,
        ...taskData,
        fired:
          existing &&
          existing.alarm === taskData.alarm &&
          existing.d === taskData.d &&
          existing.h === taskData.h
            ? existing.fired
            : false,
        snooze: null,
      };
      taskToSave = normalizeTask(candidate, existing) || candidate;
      setTasks((prev) => prev.map((tItem) => (tItem.id === editId ? taskToSave : tItem)));
    } else {
      const nextId = Math.max(100, ...tasks.map((tItem) => (tItem?.id || 0) + 1), Date.now() % 100000);
      const candidate: Task = {
        id: nextId,
        done: false,
        ...taskData,
      };
      taskToSave = normalizeTask(candidate) || candidate;
      setTasks((prev) => [...prev, taskToSave]);
    }

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'tasks', String(taskToSave.id)), cleanFirestoreData(taskToSave));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/tasks/${taskToSave.id}`);
      }
    }
  };

  const handleDeleteTask = async (id: number) => {
    sessionDeletedTaskIdsRef.current.add(id);
    const removedTask = tasks.find((tItem) => tItem.id === id) || null;
    if (removedTask) {
      setDeletedTaskToast(removedTask);
    }

    setTasks((prev) => prev.filter((tItem) => tItem.id !== id));

    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'tasks', String(id)));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/tasks/${id}`);
      }
    }
  };

  const handleUndoDeleteTask = async () => {
    if (!deletedTaskToast) return;
    const taskToRestore = deletedTaskToast;
    sessionDeletedTaskIdsRef.current.delete(taskToRestore.id);
    setDeletedTaskToast(null);
    setTasks((prev) =>
      prev.some((tItem) => tItem.id === taskToRestore.id) ? prev : [...prev, taskToRestore]
    );
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'tasks', String(taskToRestore.id)), cleanFirestoreData(taskToRestore));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/tasks/${taskToRestore.id}`);
      }
    }
  };

  const handleOpenNewTask = (dateStr?: string, categoryKey?: CategoryKey) => {
    setEditingTask(null);
    setModalDefaultDate(dateStr || toIsoDate(new Date()));
    if (categoryKey) setCurrentCategory(categoryKey);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  // Day navigation
  const handleNavigateDay = (direction: number) => {
    setCurrentDayDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + direction);
      setCurrentDate(new Date(next.getFullYear(), next.getMonth(), 1));
      const day = (next.getDay() + 6) % 7;
      const start = new Date(next);
      start.setDate(next.getDate() - day);
      setCurrentWeekStart(start);
      return next;
    });
  };

  const handleSelectDayDate = (d: Date) => {
    setCurrentDayDate(d);
    setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
    const day = (d.getDay() + 6) % 7;
    const start = new Date(d);
    start.setDate(d.getDate() - day);
    setCurrentWeekStart(start);
  };

  // Week navigation
  const handleNavigateWeek = (direction: number) => {
    setCurrentWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 7 * direction);
      return next;
    });
  };

  // Month navigation
  const handleNavigateMonth = (direction: number) => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const handleGoToToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setCurrentDayDate(now);
    const day = (now.getDay() + 6) % 7;
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    setCurrentWeekStart(start);
  };

  // Medication handlers
  const handleToggleMedication = async (id: number) => {
    const todayStr = toIsoDate(new Date());
    const target = medications.find((m) => m.id === id);
    if (!target) return;

    const currentTaken = !!(target.taken && target.taken[todayStr]);
    const nextTaken = {
      ...(target.taken || {}),
      [todayStr]: !currentTaken,
    };

    const updatedMed: Medication = { ...target, taken: nextTaken };

    setMedications((prev) =>
      prev.map((m) => (m.id === id ? updatedMed : m))
    );

    if (user) {
      try {
        await setDoc(
          doc(db, 'users', user.uid, 'medications', String(id)),
          cleanFirestoreData(updatedMed),
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/medications/${id}`);
      }
    }
  };

  const handleAddMedication = async (med: Omit<Medication, 'id' | 'taken' | 'alerted'>) => {
    const newMed: Medication = {
      id: Date.now(),
      taken: {},
      alerted: {},
      ...med,
    };
    setMedications((prev) => [...prev, newMed]);

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'medications', String(newMed.id)), cleanFirestoreData(newMed));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/medications/${newMed.id}`);
      }
    }
  };

  const handleDeleteMedication = async (id: number) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'medications', String(id)));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/medications/${id}`);
      }
    }
  };

  const handleUpdateMedication = async (updatedMed: Medication) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === updatedMed.id ? updatedMed : m))
    );

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'medications', String(updatedMed.id)), cleanFirestoreData(updatedMed));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/medications/${updatedMed.id}`);
      }
    }
  };

  // Journal handlers
  const handleSaveJournalEntry = async (entry: JournalEntry) => {
    const normalized = normalizeJournalEntry(entry) || entry;
    setJournalEntries((prev) => {
      const filtered = prev.filter((e) => e.id !== normalized.id && e.date !== normalized.date);
      return [normalized, ...filtered];
    });

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'journal', normalized.id), cleanFirestoreData(normalized));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/journal/${normalized.id}`);
      }
    }

    if (normalized.date && isValidIsoDateString(normalized.date)) {
      const [y, m, d] = normalized.date.split('-').map(Number);
      setCurrentDate(new Date(y, m - 1, d || 1));
    }
    setIsDiaryUnlocked(false);
    setCurrentCategory('all');
    setActiveView('month');
  };

  const handleOpenJournalForDate = (dateStr: string) => {
    setJournalInitialDate(dateStr);
    if (isDiaryUnlocked) {
      setCurrentCategory('diario');
      setActiveView('journal');
    } else {
      setPendingJournalDate(dateStr);
      setDiaryPinModalMode('unlock');
      setIsDiaryPinModalOpen(true);
    }
  };

  const handleReturnFromDiary = () => {
    setIsDiaryUnlocked(false);
    setCurrentCategory('all');
    setActiveView('month');
  };

  const handleDeleteJournalEntry = async (idOrDate: string) => {
    const target = journalEntries.find((e) => e.id === idOrDate || e.date === idOrDate);
    const targetId = target?.id || idOrDate;
    const targetDate = target?.date || (isValidIsoDateString(idOrDate) ? idOrDate : undefined);

    setJournalEntries((prev) =>
      prev.filter((e) => e.id !== targetId && (targetDate ? e.date !== targetDate : true))
    );

    // Also persist immediately to localStorage
    try {
      const stored = localStorage.getItem('diario-v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(
            (e: any) => e.id !== targetId && (targetDate ? e.date !== targetDate : true)
          );
          localStorage.setItem('diario-v1', JSON.stringify(filtered));
        }
      }
    } catch {}

    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'journal', targetId));
        if (targetDate && targetDate !== targetId) {
          try {
            await deleteDoc(doc(db, 'users', user.uid, 'journal', targetDate));
          } catch {}
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/journal/${targetId}`);
      }
    }
  };

  // Weight handlers
  const handleAddWeight = async (entry: WeightEntry) => {
    const normalized = normalizeWeight(entry);
    if (!normalized) return;

    setWeights((prev) => {
      const filtered = prev.filter((w) => w.d !== normalized.d);
      return [...filtered, normalized].sort((a, b) => (a.d || '').localeCompare(b.d || ''));
    });

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'weights', normalized.d), cleanFirestoreData(normalized));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/weights/${normalized.d}`);
      }
    }
  };

  const handleDeleteWeight = async (dateStr: string) => {
    setWeights((prev) => prev.filter((w) => w.d !== dateStr));
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'weights', dateStr));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/weights/${dateStr}`);
      }
    }
  };

  // Habit Handlers
  const handleAddHabit = async (habitData: Omit<Habit, 'id' | 'createdAt'>) => {
    const newHabit: Habit = {
      ...habitData,
      id: `habit-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setHabits((prev) => [newHabit, ...prev]);

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'habits', newHabit.id), cleanFirestoreData(newHabit));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/habits/${newHabit.id}`);
      }
    }
  };

  const handleToggleHabit = async (habitId: string, dateStr: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const nextVal = !habit.history?.[dateStr];
    const updatedHistory = { ...(habit.history || {}), [dateStr]: nextVal };
    const updatedHabit: Habit = { ...habit, history: updatedHistory };

    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? updatedHabit : h))
    );

    if (user) {
      try {
        await setDoc(
          doc(db, 'users', user.uid, 'habits', habitId),
          cleanFirestoreData(updatedHabit),
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/habits/${habitId}`);
      }
    }
  };

  const handleUpdateHabit = async (habitId: string, habitData: Partial<Habit>) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, ...habitData } : h))
    );

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'habits', habitId), cleanFirestoreData(habitData), { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/habits/${habitId}`);
      }
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));

    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'habits', habitId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/habits/${habitId}`);
      }
    }
  };

  // Alarm Toast actions
  const handleSnoozeTask = (id: number, minutes: number) => {
    setTasks((prev) =>
      prev.map((tItem) => (tItem.id === id ? { ...tItem, snooze: Date.now() + minutes * 60 * 1000 } : tItem))
    );
  };

  const handleSnoozeMedication = (id: number, minutes: number) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, snooze: Date.now() + minutes * 60 * 1000 } : m))
    );
  };

  const handleDismissAlert = (id: number, type: 'task' | 'medication') => {
    if (type === 'task') {
      setTasks((prev) => prev.map((tItem) => (tItem.id === id ? { ...tItem, fired: true } : tItem)));
    } else {
      const todayStr = toIsoDate(new Date());
      setMedications((prev) =>
        prev.map((m) => (m.id === id ? { ...m, alerted: { ...(m.alerted || {}), [todayStr]: true } } : m))
      );
    }
  };

  // Backup & Restore
  const handleExportBackup = () => {
    const backupData = {
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      tasks,
      medications,
      weights,
      settings,
      journal: journalEntries,
      habits,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mis_tareas_backup_${toIsoDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.tasks)) {
        const validTasks = data.tasks
          .map((item: unknown) => normalizeTask(item))
          .filter((item: Task | null): item is Task => item !== null);
        if (validTasks.length > 0) setTasks(validTasks);
      }
      if (Array.isArray(data.medications)) {
        const validMeds = data.medications
          .map((item: unknown) => normalizeMedication(item))
          .filter((item: Medication | null): item is Medication => item !== null);
        if (validMeds.length > 0) setMedications(validMeds);
      }
      if (Array.isArray(data.weights)) {
        const validWeights = data.weights
          .map((item: unknown) => normalizeWeight(item))
          .filter((item: WeightEntry | null): item is WeightEntry => item !== null)
          .sort((a: WeightEntry, b: WeightEntry) => (a.d || '').localeCompare(b.d || ''));
        if (validWeights.length > 0) setWeights(validWeights);
      }
      if (data.settings && typeof data.settings === 'object') {
        setSettings((prev) => ({ ...prev, ...data.settings }));
      }
      if (Array.isArray(data.journal)) {
        const validJournal = data.journal
          .map((item: unknown) => normalizeJournalEntry(item))
          .filter((item: JournalEntry | null): item is JournalEntry => item !== null);
        if (validJournal.length > 0) setJournalEntries(validJournal);
      }
      if (Array.isArray(data.habits)) {
        const validHabits = data.habits
          .map((item: unknown) => normalizeHabit(item))
          .filter((item: Habit | null): item is Habit => item !== null);
        if (validHabits.length > 0) setHabits(validHabits);
      }
    } catch {}
  };

  const handleResetData = () => {
    sessionDeletedTaskIdsRef.current.clear();
    setTasks(INITIAL_TASKS);
    setMedications(INITIAL_MEDICATIONS);
    setWeights(INITIAL_WEIGHTS);
    setJournalEntries(INITIAL_JOURNAL_ENTRIES);
    setHabits(INITIAL_HABITS);
    setSettings(INITIAL_SETTINGS);
  };

  const handleUpdateSettings = async (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'settings', 'config'), cleanFirestoreData(newSettings), { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/settings/config`);
      }
    }
  };

  const handleActivatePremium = async (premiumData: PremiumSubscription) => {
    const updatedSettings: UserSettings = {
      ...settings,
      premium: premiumData,
    };
    setSettings(updatedSettings);
    try {
      localStorage.setItem('settings-v2', JSON.stringify(updatedSettings));
    } catch {}
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'settings', 'config'), { premium: premiumData }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/settings/config`);
      }
    }
  };

  // Safely filter tasks by active category
  const safeTasks = tasks.filter(
    (tItem): tItem is Task => Boolean(tItem && typeof tItem.d === 'string' && typeof tItem.t === 'string')
  );

  const visibleTasks =
    currentCategory === 'all' ? safeTasks : safeTasks.filter((tItem) => tItem.c === currentCategory);

  // Month stats
  const currentYearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const todayStr = toIsoDate(new Date());

  const monthTasks = visibleTasks.filter(
    (tItem) => typeof tItem.d === 'string' && tItem.d.startsWith(currentYearMonth)
  );
  const doneMonthCount = monthTasks.filter((tItem) => tItem.done).length;
  const pendingMonthCount = monthTasks.filter((tItem) => !tItem.done).length;
  const todayPendingCount = visibleTasks.filter((tItem) => tItem.d === todayStr && !tItem.done).length;

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf8f5] dark:bg-[#0f111a] p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-linear-to-tr from-[#e8533a] to-amber-500 flex items-center justify-center text-white shadow-xl shadow-[#e8533a]/25 mb-5 animate-pulse">
          <Calendar className="w-8 h-8" />
        </div>
        <div className="w-8 h-8 border-3 border-[#e8533a] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-serif font-bold text-neutral-900 dark:text-neutral-100 mb-1">
          Cargando Mi Calendario de Tareas
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm">
          Sincronizando tus tareas, medicamentos, diario y notas en tiempo real...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#faf8f5] dark:bg-[#0f111a] text-[#1a1c29] dark:text-[#f0f2f8]">
      {/* Toast Alarms in Foreground */}
      <ToastAlarms
        tasks={safeTasks}
        medications={medications}
        habits={habits}
        settings={settings}
        onCompleteTask={handleToggleTask}
        onCompleteMedication={handleToggleMedication}
        onSnoozeTask={handleSnoozeTask}
        onSnoozeMedication={handleSnoozeMedication}
        onDismissAlert={handleDismissAlert}
      />

      {/* Sidebar Navigation */}
      <Sidebar
        currentCategory={currentCategory}
        onSelectCategory={(cat) => {
          setCurrentCategory(cat);
          if (cat === 'menus') setActiveView('menus');
          else if (cat === 'finanzas') setActiveView('finanzas');
          else if (cat === 'habitos') setActiveView('habits');
          else if (cat === 'diario') {
            setActiveView('journal');
            if (!isDiaryUnlocked) {
              setDiaryPinModalMode('unlock');
              setIsDiaryPinModalOpen(true);
            }
          }
        }}
        activeView={activeView}
        onSelectView={(v) => {
          if (v === 'journal' && !isDiaryUnlocked) {
            setDiaryPinModalMode('unlock');
            setIsDiaryPinModalOpen(true);
            return;
          }
          setActiveView(v);
        }}
        tasks={safeTasks}
        medications={medications}
        habitsCount={habits.length}
        currentDate={currentDate}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onResetData={handleResetData}
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
        onOpenIOSModal={() => setIsIOSModalOpen(true)}
        onOpenAuthModal={() => {
          setAuthRequiredPrompt(undefined);
          setIsAuthModalOpen(true);
        }}
        onOpenSettings={() => {
          setSettingsInitialTab('push');
          setIsSettingsModalOpen(true);
        }}
        onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Header */}
        <header className="px-4 sm:px-8 py-4 border-b border-neutral-200/90 dark:border-neutral-800 bg-white/80 dark:bg-[#151722]/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300"
              title="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                {currentCategory === 'all'
                  ? activeView === 'welcome'
                    ? 'Inicio & Bienvenida'
                    : activeView === 'journal'
                    ? t('header.journalTitle', currentLang)
                    : activeView === 'habits'
                    ? t('header.habitsTitle', currentLang)
                    : activeView === 'menus'
                    ? 'Menús Semanales'
                    : activeView === 'day'
                    ? t('header.dayTitle', currentLang)
                    : activeView === 'week'
                    ? t('header.weekTitle', currentLang)
                    : activeView === 'shopping'
                    ? t('header.shoppingTitle', currentLang)
                    : activeView === 'medication'
                    ? t('header.medicationTitle', currentLang)
                    : activeView === 'weight'
                    ? t('header.weightTitle', currentLang)
                    : activeView === 'finanzas'
                    ? t('header.financeTitle', currentLang)
                    : t('header.allTasksTitle', currentLang)
                  : `${CATEGORY_MAP[currentCategory]?.e || '📌'} ${getCategoryLocalizedName(currentCategory, currentLang)}`}
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {activeView === 'welcome'
                  ? `Hola de nuevo, ${settings.userName || 'Paco'} · Inspiración diaria y tareas`
                  : activeView === 'day'
                  ? `${getLocalizedDayName((currentDayDate.getDay() + 6) % 7, true, currentLang)}, ${currentDayDate.getDate()} de ${getLocalizedMonthName(currentDayDate.getMonth(), currentLang)} ${currentDayDate.getFullYear()}`
                  : `${getLocalizedMonthName(currentDate.getMonth(), currentLang)} ${currentDate.getFullYear()} · ${t('header.subtitle', currentLang)}`}
              </p>
            </div>
          </div>

          {/* Right Zone: View switchers & CTA buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Calendar mode switcher buttons: Día, Semana, Mes, Lista */}
            <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800/90 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveView('day')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeView === 'day'
                    ? 'bg-white dark:bg-[#161824] text-neutral-900 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">{t('view.day', currentLang)}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('week')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeView === 'week'
                    ? 'bg-white dark:bg-[#161824] text-neutral-900 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5 text-sky-500" />
                <span className="hidden sm:inline">{t('view.week', currentLang)}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('month')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeView === 'month'
                    ? 'bg-white dark:bg-[#161824] text-neutral-900 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">{t('view.month', currentLang)}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeView === 'list'
                    ? 'bg-white dark:bg-[#161824] text-neutral-900 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('view.list', currentLang)}</span>
              </button>
            </div>

            {/* Live Sync Cross-Device Badge */}
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-colors shadow-2xs cursor-pointer"
              title="Sincronización en la nube activa."
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Sincronizado en tiempo real</span>
            </button>

            {/* Install in Android CTA */}
            {!isInstalled && (
              <button
                type="button"
                onClick={() => setIsAndroidModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold transition-all shrink-0 cursor-pointer"
                title="Instalar como app nativa en Android (APK / Capacitor)"
              >
                <span>🤖</span>
                <span className="hidden sm:inline">Descargar APK Android</span>
                <span className="sm:hidden">Descargar APK</span>
              </button>
            )}

            {/* Install in iOS (iPhone / iPad) CTA */}
            {!isInstalled && (
              <button
                type="button"
                onClick={() => setIsIOSModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600/10 hover:bg-sky-600/20 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 text-xs font-semibold transition-all shrink-0 cursor-pointer"
                title="Instrucciones para instalar en iOS (iPhone / iPad)"
              >
                <span>🍏</span>
                <span className="hidden sm:inline">Instalar en iOS</span>
                <span className="sm:hidden">iOS</span>
              </button>
            )}

            {/* Quick Access to Tab Notes & Files */}
            {currentCategory !== 'diario' && activeView !== 'journal' && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('tab-notes-section');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 text-xs font-semibold transition-all shrink-0 cursor-pointer"
                title="Ir a las Notas y Archivos de esta pestaña"
              >
                <span>📂</span>
                <span className="hidden sm:inline">Notas & Archivos</span>
                <span className="sm:hidden">Notas</span>
              </button>
            )}

            {/* Weather Pill Widget */}
            <WeatherWidget />

            {/* Quick Language Switcher Pill */}
            <button
              type="button"
              onClick={() => {
                setSettingsInitialTab('language');
                setIsSettingsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#161824] hover:bg-neutral-50 dark:hover:bg-neutral-800/80 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
              title={`${t('lang.title', currentLang)} (${currentLang.toUpperCase()})`}
            >
              <Globe className="w-3.5 h-3.5 text-[#e8533a]" />
              <span className="text-xs uppercase font-mono">{currentLang}</span>
            </button>

            {/* Lifetime Subscription & Ad Removal CTA */}
            {isPremium ? (
              <button
                type="button"
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition-colors shadow-2xs shrink-0 cursor-pointer"
                title="Suscripción Premium Vitalicia Activa"
              >
                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="hidden md:inline">Premium Vitalicio</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs font-bold transition-all shadow-xs shrink-0 active:scale-95 cursor-pointer"
                title="Pago único de 4,99 €: Desbloquea todas las opciones y elimina la publicidad para siempre con tarjeta o transferencia bancaria"
              >
                <Crown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quitar anuncios (4,99 €)</span>
                <span className="sm:hidden">4,99 €</span>
              </button>
            )}



            {/* User Settings Gear CTA */}
            <button
              type="button"
              onClick={() => {
                setSettingsInitialTab('push');
                setIsSettingsModalOpen(true);
              }}
              className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#161824] hover:bg-neutral-50 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 transition-all shadow-2xs relative cursor-pointer"
              title={t('settings.title', currentLang)}
            >
              <Settings className="w-4 h-4 text-neutral-600 dark:text-neutral-300 hover:rotate-45 transition-transform duration-300" />
              {settings.pushNotifications?.enabled && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1 right-1" />
              )}
            </button>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => handleOpenNewTask()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#e8533a] hover:bg-[#d4432c] text-white text-xs font-semibold shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{t('header.newTask', currentLang)}</span>
            </button>

            {/* Authenticated User Pill */}
            <div className="flex items-center gap-1.5 p-1 pl-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#161824] shadow-2xs">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 pr-2 hover:opacity-85 transition-opacity text-left cursor-pointer"
                title="Ver mi cuenta y detalles de sincronización"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Usuario'}
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#e8533a] to-amber-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block leading-tight">
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block max-w-[110px] truncate">
                    {user?.displayName || (typeof user?.email === 'string' ? user.email.split('@')[0] : '') || 'Mi Cuenta'}
                  </span>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    {user ? 'En línea' : 'Sesión local'}
                  </span>
                </div>
              </button>
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    void logout();
                  }}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Main Body */}
        <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Ad banner (free tier only, disappears completely when user unlocks lifetime premium) */}
          <AdBanner
            isPremium={isPremium}
            onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
          />

          {(activeView === 'month' || activeView === 'list' || activeView === 'menus') && (
            <>
              {/* Stats Bar (KPI counters) */}
              <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-white dark:bg-[#151722] border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Este mes
                  </span>
                  <b className="text-2xl font-serif font-bold text-neutral-900 dark:text-neutral-100 tabular-nums mt-1">
                    {monthTasks.length}
                  </b>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#151722] border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Hechas
                  </span>
                  <b className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                    {doneMonthCount}
                  </b>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#151722] border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Pendientes
                  </span>
                  <b className="text-2xl font-serif font-bold text-amber-600 dark:text-amber-400 tabular-nums mt-1">
                    {pendingMonthCount}
                  </b>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#151722] border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#e8533a]">
                    Para hoy
                  </span>
                  <b className="text-2xl font-serif font-bold text-[#e8533a] tabular-nums mt-1">
                    {todayPendingCount}
                  </b>
                </div>
              </section>

              {/* Daily Weather Viewer & Weekly Forecast Banner */}
              <WeatherWeekBanner />

              {/* Month / Week Navigation Strip */}
              <div className="flex items-center justify-between gap-3 bg-white dark:bg-[#151722] px-4 py-2.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeView === 'menus') handleNavigateWeek(-1);
                      else handleNavigateMonth(-1);
                    }}
                    className="w-8 h-8 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="Anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <h2 className="text-base sm:text-lg font-serif font-bold text-neutral-900 dark:text-neutral-100 min-w-[170px] text-center">
                    {activeView === 'menus'
                      ? `Semana del ${currentWeekStart.getDate()} de ${MESES[currentWeekStart.getMonth()]}`
                      : `${MESES[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                  </h2>

                  <button
                    type="button"
                    onClick={() => {
                      if (activeView === 'menus') handleNavigateWeek(1);
                      else handleNavigateMonth(1);
                    }}
                    className="w-8 h-8 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="Siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleGoToToday}
                  className="px-3.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs font-semibold hover:border-neutral-400 transition-colors cursor-pointer"
                >
                  Hoy
                </button>
              </div>
            </>
          )}

          {/* Dynamic Viewport View */}
          {activeView === 'welcome' && (
            <WelcomeView
              settings={settings}
              tasks={tasks}
              medications={medications}
              habits={habits}
              onOpenSettings={(tab) => {
                setSettingsInitialTab(tab);
                setIsSettingsModalOpen(true);
              }}
              onNavigateView={(v) => {
                setCurrentCategory('all');
                setActiveView(v);
              }}
              onToggleTaskDone={handleToggleTask}
              onOpenNewTaskModal={(dStr) => handleOpenNewTask(dStr)}
              onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
            />
          )}

          {activeView === 'month' && (
            <MonthView
              currentDate={currentDate}
              tasks={visibleTasks}
              weights={weights}
              journalEntries={journalEntries}
              onOpenTask={handleEditTask}
              onAddTaskForDate={(dStr) =>
                handleOpenNewTask(dStr, currentCategory === 'all' ? undefined : currentCategory)
              }
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onOpenJournalEntry={handleOpenJournalForDate}
              onOpenWeightTracker={(dateStr) => {
                setCurrentCategory('medicas');
                setActiveView('weight');
                if (dateStr && isValidIsoDateString(dateStr)) {
                  const [y, m, d] = dateStr.split('-').map(Number);
                  setCurrentDate(new Date(y, m - 1, d || 1));
                }
              }}
              onOpenDayView={(dateStr) => {
                if (dateStr && isValidIsoDateString(dateStr)) {
                  const [y, m, d] = dateStr.split('-').map(Number);
                  handleSelectDayDate(new Date(y, m - 1, d || 1));
                  setActiveView('day');
                }
              }}
            />
          )}

          {activeView === 'week' && (
            <WeekCalendarView
              currentWeekStart={currentWeekStart}
              onNavigateWeek={handleNavigateWeek}
              onSelectDayDate={(d) => {
                handleSelectDayDate(d);
                setActiveView('day');
              }}
              tasks={visibleTasks}
              journalEntries={journalEntries}
              weights={weights}
              onOpenTask={handleEditTask}
              onAddTaskForDate={(dStr) =>
                handleOpenNewTask(dStr, currentCategory === 'all' ? undefined : currentCategory)
              }
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onOpenJournalEntry={handleOpenJournalForDate}
              onOpenWeightTracker={(dateStr) => {
                setCurrentCategory('medicas');
                setActiveView('weight');
                if (dateStr && isValidIsoDateString(dateStr)) {
                  const [y, m, d] = dateStr.split('-').map(Number);
                  setCurrentDate(new Date(y, m - 1, d || 1));
                }
              }}
            />
          )}

          {activeView === 'day' && (
            <DayView
              currentDay={currentDayDate}
              onNavigateDay={handleNavigateDay}
              onSelectDayDate={handleSelectDayDate}
              tasks={visibleTasks}
              journalEntries={journalEntries}
              weights={weights}
              onOpenTask={handleEditTask}
              onAddTaskForDate={(dStr) =>
                handleOpenNewTask(dStr, currentCategory === 'all' ? undefined : currentCategory)
              }
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onOpenJournalEntry={handleOpenJournalForDate}
              onOpenWeightTracker={(dateStr) => {
                setCurrentCategory('medicas');
                setActiveView('weight');
                if (dateStr && isValidIsoDateString(dateStr)) {
                  const [y, m, d] = dateStr.split('-').map(Number);
                  setCurrentDate(new Date(y, m - 1, d || 1));
                }
              }}
              onSwitchToWeek={() => setActiveView('week')}
              onSwitchToMonth={() => setActiveView('month')}
            />
          )}

          {activeView === 'list' && (
            <ListView
              tasks={visibleTasks}
              onOpenTask={handleEditTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onAddTask={() => handleOpenNewTask()}
            />
          )}

          {activeView === 'menus' && (
            <WeekView
              currentWeekStart={currentWeekStart}
              onNavigateWeek={handleNavigateWeek}
              tasks={safeTasks}
              onSaveMeal={async (dStr, mealKey, dishText) => {
                const existing = safeTasks.find(
                  (tItem) => tItem.c === 'menus' && tItem.d === dStr && tItem.meal === mealKey
                );

                if (!dishText || dishText.trim() === '') {
                  if (existing) {
                    handleDeleteTask(existing.id);
                  }
                  return;
                }

                if (existing) {
                  handleSaveTask(
                    {
                      ...existing,
                      t: dishText.trim(),
                      plato: dishText.trim(),
                    },
                    existing.id
                  );
                } else {
                  handleSaveTask({
                    t: dishText.trim(),
                    c: 'menus',
                    d: dStr,
                    h: MEAL_HOURS[mealKey] || '14:00',
                    n: '',
                    meal: mealKey,
                    plato: dishText.trim(),
                  });
                }
              }}
              onSwitchToShopping={() => {
                setCurrentCategory('compras');
                setActiveView('shopping');
              }}
              onAddIngredientsToShopping={(ingredients) => {
                const existingShop = safeTasks.find((tItem) => tItem.c === 'compras');
                if (existingShop) {
                  const currentItems = existingShop.items || [];
                  const newItems = ingredients.map((x, idx) => ({
                    id: `shop-${Date.now()}-${idx}`,
                    x,
                    d: false,
                  }));
                  handleSaveTask(
                    {
                      ...existingShop,
                      items: [...currentItems, ...newItems],
                    },
                    existingShop.id
                  );
                } else {
                  handleSaveTask({
                    t: 'Lista de compra semanal',
                    c: 'compras',
                    d: toIsoDate(new Date()),
                    h: '18:00',
                    n: 'Ingredientes añadidos desde el planificador de menús',
                    ctipo: 'super',
                    items: ingredients.map((x, idx) => ({
                      id: `shop-${Date.now()}-${idx}`,
                      x,
                      d: false,
                    })),
                  });
                }
              }}
            />
          )}

          {activeView === 'finanzas' && (
            <FinanzasView
              currentDate={currentDate}
              tasks={safeTasks}
              onAddTask={(prefilled) => {
                handleSaveTask({
                  t: prefilled.t || prefilled.concepto || 'Movimiento financiero',
                  c: 'finanzas',
                  d: prefilled.d || toIsoDate(new Date()),
                  h: prefilled.h || '10:00',
                  n: prefilled.n || '',
                  fin: prefilled.fin || 'gasto',
                  concepto: prefilled.concepto || prefilled.t || '',
                  cant: prefilled.cant || 0,
                });
              }}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeView === 'medication' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 flex-wrap bg-white dark:bg-[#151722] p-2 rounded-2xl border border-neutral-200 dark:border-neutral-800 w-fit">
                <button
                  type="button"
                  onClick={() => setActiveView('medication')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#e8533a] text-white text-xs font-bold cursor-pointer"
                >
                  💊 Medicación Diaria
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('weight')}
                  className="px-3.5 py-1.5 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold cursor-pointer"
                >
                  ⚖️ Control de Peso
                </button>
              </div>
              <MedicationView
                medications={medications}
                onToggleMedication={handleToggleMedication}
                onAddMedication={handleAddMedication}
                onUpdateMedication={handleUpdateMedication}
                onDeleteMedication={handleDeleteMedication}
              />
            </div>
          )}

          {activeView === 'weight' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 flex-wrap bg-white dark:bg-[#151722] p-2 rounded-2xl border border-neutral-200 dark:border-neutral-800 w-fit">
                <button
                  type="button"
                  onClick={() => setActiveView('medication')}
                  className="px-3.5 py-1.5 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold cursor-pointer"
                >
                  💊 Medicación Diaria
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('weight')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#e8533a] text-white text-xs font-bold cursor-pointer"
                >
                  ⚖️ Control de Peso
                </button>
              </div>
              <WeightTrackerView
                currentDate={currentDate}
                weights={weights}
                settings={settings}
                onAddWeight={handleAddWeight}
                onDeleteWeight={handleDeleteWeight}
                onUpdateSettings={handleUpdateSettings}
              />
            </div>
          )}

          {activeView === 'shopping' && (
            <ShoppingView
              tasks={safeTasks}
              onUpdateTask={(updatedTask) => handleSaveTask(updatedTask, updatedTask.id)}
              onAddTask={(prefilled) =>
                handleSaveTask({
                  t: prefilled.t || 'Nueva lista de compra',
                  c: 'compras',
                  d: prefilled.d || toIsoDate(new Date()),
                  h: '18:00',
                  n: '',
                  ctipo: prefilled.ctipo || 'super',
                  items: prefilled.items || [],
                })
              }
            />
          )}

          {activeView === 'journal' && (
            <JournalView
              entries={journalEntries}
              onSaveEntry={handleSaveJournalEntry}
              onDeleteEntry={handleDeleteJournalEntry}
              onRequireAuth={() => {
                setAuthRequiredPrompt('Debes registrarte o iniciar sesión para usar el Diario Personal.');
                setIsAuthModalOpen(true);
              }}
              isUnlocked={isDiaryUnlocked}
              onLock={() => setIsDiaryUnlocked(false)}
              onRequestUnlock={() => {
                setDiaryPinModalMode('unlock');
                setIsDiaryPinModalOpen(true);
              }}
              onRequestChangePin={() => {
                setDiaryPinModalMode('change');
                setIsDiaryPinModalOpen(true);
              }}
              savedPin={settings.diaryPin}
              initialDate={journalInitialDate || undefined}
              onReturnToCalendar={handleReturnFromDiary}
            />
          )}

          {activeView === 'habits' && (
            <HabitTrackerView
              habits={habits}
              onAddHabit={handleAddHabit}
              onToggleHabit={handleToggleHabit}
              onUpdateHabit={handleUpdateHabit}
              onDeleteHabit={handleDeleteHabit}
              onRequireAuth={() => {
                setAuthRequiredPrompt('Debes registrarte o iniciar sesión para gestionar tus hábitos.');
                setIsAuthModalOpen(true);
              }}
            />
          )}

          {/* Multimedia Tab Notes & Files Section */}
          {currentCategory !== 'diario' && activeView !== 'journal' && (
            <div id="tab-notes-section">
              <TabNotesSection
                tabKey={currentCategory === 'all' ? `view_${activeView}` : `cat_${currentCategory}`}
                tabTitle={getTabTitle(activeView, currentCategory)}
              />
            </div>
          )}
        </main>
      </div>

      {/* Task Creation & Edition Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        initialTask={editingTask}
        defaultCategory={currentCategory === 'all' ? 'recordatorios' : currentCategory}
        defaultDate={modalDefaultDate}
        onRequireAuth={() => {
          setAuthRequiredPrompt('Debes registrarte o iniciar sesión con Google, Apple o tu correo para guardar tareas y sincronizarlas.');
          setIsAuthModalOpen(true);
        }}
      />

      {/* Android APK / WebAPK Installation Dialog */}
      <AndroidInstallModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />

      {/* iOS Safari Installation Dialog */}
      <IOSInstallModal
        isOpen={isIOSModalOpen}
        onClose={() => setIsIOSModalOpen(false)}
      />

      {/* User Authentication & Cloud Sync Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        requiredForFeature={authRequiredPrompt}
      />

      {/* 4-Digit Security PIN Modal for Diario Personal */}
      <DiaryPinModal
        isOpen={isDiaryPinModalOpen}
        onClose={() => {
          setIsDiaryPinModalOpen(false);
          setPendingJournalDate(null);
        }}
        onSuccess={() => {
          setIsDiaryUnlocked(true);
          setIsDiaryPinModalOpen(false);
          setCurrentCategory('diario');
          setActiveView('journal');
          if (pendingJournalDate) {
            setJournalInitialDate(pendingJournalDate);
            setPendingJournalDate(null);
          }
        }}
        savedPin={settings.diaryPin}
        onSaveNewPin={(newPin) => {
          const updated = { ...settings, diaryPin: newPin || '' };
          setSettings(updated);
          try {
            localStorage.setItem('settings-v2', JSON.stringify(updated));
          } catch {}
          if (user) {
            setDoc(doc(db, 'users', user.uid, 'settings', 'config'), cleanFirestoreData(updated), { merge: true }).catch(() => {});
          }
          setIsDiaryUnlocked(true);
          setIsDiaryPinModalOpen(false);
          setCurrentCategory('diario');
          setActiveView('journal');
          if (pendingJournalDate) {
            setJournalInitialDate(pendingJournalDate);
            setPendingJournalDate(null);
          }
        }}
        mode={diaryPinModalMode}
      />

      {/* User Settings & Web Push Modal (with Changelog v2.5.0) */}
      <UserSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => {
          setIsSettingsModalOpen(false);
          setSettingsInitialTab(undefined);
        }}
        settings={settings}
        initialTab={settingsInitialTab}
        onUpdateSettings={handleUpdateSettings}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onResetData={handleResetData}
        onOpenPinModal={() => {
          setDiaryPinModalMode('change');
          setIsDiaryPinModalOpen(true);
        }}
        onOpenWelcomeView={() => {
          setCurrentCategory('all');
          setActiveView('welcome');
        }}
      />

      {/* Lifetime Premium Subscription & Ad Removal Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        settings={settings}
        onActivatePremium={handleActivatePremium}
      />

      {/* Deleted Task Undo Toast (v2.5.0) */}
      {deletedTaskToast && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-2xl border border-neutral-800 dark:border-neutral-200 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span className="text-xs sm:text-sm font-medium truncate max-w-[220px]">
            Tarea eliminada: <strong>{deletedTaskToast.t}</strong>
          </span>
          <button
            type="button"
            onClick={handleUndoDeleteTask}
            className="px-2.5 py-1 rounded-lg bg-[#e8533a] text-white text-xs font-bold hover:bg-[#d6452d] transition-colors cursor-pointer"
          >
            Deshacer
          </button>
          <button
            type="button"
            onClick={() => setDeletedTaskToast(null)}
            className="text-neutral-400 hover:text-white dark:hover:text-neutral-900 text-xs font-bold px-1 cursor-pointer"
            title="Cerrar"
          >
            ✕
          </button>
        </div>
      )}

      {/* Offline Status Toast */}
      <OfflineIndicator />
    </div>
  );
}
