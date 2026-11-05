import React, { useState, useEffect } from 'react';
import { Task, Medication, WeightEntry, UserSettings, CategoryKey, JournalEntry, Habit, PremiumSubscription } from './types';
import {
  INITIAL_TASKS,
  INITIAL_MEDICATIONS,
  INITIAL_WEIGHTS,
  INITIAL_SETTINGS,
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_HABITS,
  CATEGORIES,
  CATEGORY_MAP,
  MESES,
  DIAS_COMPLETOS,
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
import { TaskModal } from './components/TaskModal';
import { ToastAlarms } from './components/ToastAlarms';
import { AndroidInstallModal } from './components/AndroidInstallModal';
import { IOSInstallModal } from './components/IOSInstallModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AuthModal } from './components/AuthModal';
import { AuthPortal } from './components/AuthPortal';
import { TabNotesSection } from './components/TabNotesSection';
import { DiaryPinModal } from './components/DiaryPinModal';
import { UserSettingsModal } from './components/UserSettingsModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AdBanner } from './components/AdBanner';
import { WeatherWidget, WeatherWeekBanner } from './components/WeatherWidget';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useAuth } from './context/AuthContext';
import { db, handleFirestoreError, OperationType } from './utils/firebase';
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
} from 'lucide-react';

export default function App() {
  // Persistence state loaders
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('tareas-v2');
      if (saved) return JSON.parse(saved);
      const legacy = localStorage.getItem('tareas-v1');
      if (legacy) return JSON.parse(legacy);
    } catch {}
    return INITIAL_TASKS;
  });

  const [medications, setMedications] = useState<Medication[]>(() => {
    try {
      const saved = localStorage.getItem('meds-v2');
      if (saved) return JSON.parse(saved);
      const legacy = localStorage.getItem('meds-v1');
      if (legacy) return JSON.parse(legacy);
    } catch {}
    return INITIAL_MEDICATIONS;
  });

  const [weights, setWeights] = useState<WeightEntry[]>(() => {
    try {
      const saved = localStorage.getItem('peso-v2');
      if (saved) return JSON.parse(saved);
      const legacy = localStorage.getItem('peso-v1');
      if (legacy) return JSON.parse(legacy);
    } catch {}
    return INITIAL_WEIGHTS;
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('settings-v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SETTINGS;
  });

  // Navigation & View state
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [currentDayDate, setCurrentDayDate] = useState<Date>(() => new Date());

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = (now.getDay() + 6) % 7; // 0 is Monday
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    return start;
  });

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem('diario-v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_JOURNAL_ENTRIES;
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const saved = localStorage.getItem('habitos-v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_HABITS;
  });

  const [currentCategory, setCurrentCategory] = useState<CategoryKey | 'all'>('all');
  const [activeView, setActiveView] = useState<
    'month' | 'week' | 'day' | 'list' | 'menus' | 'finanzas' | 'medication' | 'weight' | 'shopping' | 'journal' | 'habits'
  >('month');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
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

  // Helper to get descriptive title for Tab Notes
  const getTabTitle = (view: string, cat: CategoryKey | 'all'): string => {
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

  // Firestore Real-time Multi-Device Sync when logged in
  useEffect(() => {
    if (!user) return;

    let isFirstTasksLoad = true;
    const tasksCol = collection(db, 'users', user.uid, 'tasks');
    const unsubscribeTasks = onSnapshot(
      tasksCol,
      (snapshot) => {
        const alreadySeeded = localStorage.getItem(`tareas-seeded-${user.uid}`) === '1';
        if (snapshot.empty && isFirstTasksLoad && !alreadySeeded) {
          isFirstTasksLoad = false;
          localStorage.setItem(`tareas-seeded-${user.uid}`, '1');
          const seedList = tasks.length > 0 ? tasks : INITIAL_TASKS;
          seedList.forEach((t) => {
            setDoc(doc(db, 'users', user.uid, 'tasks', String(t.id)), t).catch((err) =>
              handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/tasks/${t.id}`)
            );
          });
          return;
        }
        isFirstTasksLoad = false;
        localStorage.setItem(`tareas-seeded-${user.uid}`, '1');
        const cloudTasks: Task[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as Task;
          cloudTasks.push({
            ...data,
            id: typeof data.id === 'number' ? data.id : Number(d.id) || Date.now(),
          });
        });
        setTasks(cloudTasks);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/tasks`);
      }
    );

    let isFirstMedsLoad = true;
    const medsCol = collection(db, 'users', user.uid, 'medications');
    const unsubscribeMeds = onSnapshot(
      medsCol,
      (snapshot) => {
        if (snapshot.empty && isFirstMedsLoad) {
          isFirstMedsLoad = false;
          INITIAL_MEDICATIONS.forEach((m) => {
            setDoc(doc(db, 'users', user.uid, 'medications', String(m.id)), m).catch((err) =>
              handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/medications/${m.id}`)
            );
          });
          return;
        }
        isFirstMedsLoad = false;
        const cloudMeds: Medication[] = [];
        snapshot.forEach((d) => cloudMeds.push(d.data() as Medication));
        setMedications(cloudMeds);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/medications`);
      }
    );

    let isFirstWeightsLoad = true;
    const weightsCol = collection(db, 'users', user.uid, 'weights');
    const unsubscribeWeights = onSnapshot(
      weightsCol,
      (snapshot) => {
        if (snapshot.empty && isFirstWeightsLoad) {
          isFirstWeightsLoad = false;
          INITIAL_WEIGHTS.forEach((w) => {
            setDoc(doc(db, 'users', user.uid, 'weights', w.d), w).catch((err) =>
              handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/weights/${w.d}`)
            );
          });
          return;
        }
        isFirstWeightsLoad = false;
        const cloudWeights: WeightEntry[] = [];
        snapshot.forEach((d) => cloudWeights.push(d.data() as WeightEntry));
        setWeights(cloudWeights);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/weights`);
      }
    );

    let isFirstJournalLoad = true;
    const journalCol = collection(db, 'users', user.uid, 'journal');
    const unsubscribeJournal = onSnapshot(
      journalCol,
      (snapshot) => {
        if (snapshot.empty && isFirstJournalLoad) {
          isFirstJournalLoad = false;
          INITIAL_JOURNAL_ENTRIES.forEach((entry) => {
            setDoc(doc(db, 'users', user.uid, 'journal', entry.id), entry).catch(() => {});
          });
          return;
        }
        isFirstJournalLoad = false;
        const cloudJournal: JournalEntry[] = [];
        snapshot.forEach((d) => cloudJournal.push(d.data() as JournalEntry));
        setJournalEntries(cloudJournal);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/journal`);
      }
    );

    let isFirstHabitsLoad = true;
    const habitsCol = collection(db, 'users', user.uid, 'habits');
    const unsubscribeHabits = onSnapshot(
      habitsCol,
      (snapshot) => {
        if (snapshot.empty && isFirstHabitsLoad) {
          isFirstHabitsLoad = false;
          INITIAL_HABITS.forEach((h) => {
            setDoc(doc(db, 'users', user.uid, 'habits', h.id), h).catch(() => {});
          });
          return;
        }
        isFirstHabitsLoad = false;
        const cloudHabits: Habit[] = [];
        snapshot.forEach((d) => cloudHabits.push(d.data() as Habit));
        setHabits(cloudHabits);
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
          setDoc(settingsDocRef, settings, { merge: true }).catch(() => {});
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

  // Persist to local storage for offline fast view
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
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    const nextDone = !target.done;
    if (nextDone) {
      sounds.playCompleteChime();
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: nextDone } : t))
    );

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'tasks', String(id)), { done: nextDone }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/tasks/${id}`);
      }
    }
  };

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'done'>, editId?: number) => {
    requestNotificationPermission();

    let taskToSave: Task;
    if (editId) {
      const existing = tasks.find((t) => t.id === editId);
      taskToSave = {
        id: editId,
        done: existing ? existing.done : false,
        ...taskData,
        fired: existing && existing.alarm === taskData.alarm && existing.d === taskData.d && existing.h === taskData.h ? existing.fired : false,
        snooze: null,
      };
      setTasks((prev) => prev.map((t) => (t.id === editId ? taskToSave : t)));
    } else {
      const nextId = Math.max(100, ...tasks.map((t) => t.id + 1), Date.now() % 100000);
      taskToSave = {
        id: nextId,
        done: false,
        ...taskData,
      };
      setTasks((prev) => [...prev, taskToSave]);
    }

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'tasks', String(taskToSave.id)), taskToSave);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/tasks/${taskToSave.id}`);
      }
    }
  };

  const handleDeleteTask = async (id: number) => {
    const removedTask = tasks.find((t) => t.id === id) || null;
    if (removedTask) {
      setDeletedTaskToast(removedTask);
    }

    setTasks((prev) => prev.filter((t) => t.id !== id));

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
    setDeletedTaskToast(null);
    setTasks((prev) => (prev.some((t) => t.id === taskToRestore.id) ? prev : [...prev, taskToRestore]));
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'tasks', String(taskToRestore.id)), taskToRestore);
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
    if (!user) {
      setAuthRequiredPrompt('Debes registrarte o iniciar sesión con Google, Apple o tu correo para marcar tomas de medicación.');
      setIsAuthModalOpen(true);
      return;
    }

    const todayStr = toIsoDate(new Date());
    const target = medications.find((m) => m.id === id);
    if (!target) return;

    const currentTaken = !!target.taken[todayStr];
    const nextTaken = {
      ...target.taken,
      [todayStr]: !currentTaken,
    };

    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, taken: nextTaken } : m))
    );

    try {
      await setDoc(doc(db, 'users', user.uid, 'medications', String(id)), { taken: nextTaken }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/medications/${id}`);
    }
  };

  const handleAddMedication = async (med: Omit<Medication, 'id' | 'taken' | 'alerted'>) => {
    if (!user) {
      setAuthRequiredPrompt('Debes registrarte o iniciar sesión para guardar medicación.');
      setIsAuthModalOpen(true);
      return;
    }

    const newMed: Medication = {
      id: Date.now(),
      taken: {},
      alerted: {},
      ...med,
    };
    setMedications((prev) => [...prev, newMed]);

    try {
      await setDoc(doc(db, 'users', user.uid, 'medications', String(newMed.id)), newMed);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/medications/${newMed.id}`);
    }
  };

  const handleDeleteMedication = async (id: number) => {
    if (!user) {
      setAuthRequiredPrompt('Debes registrarte o iniciar sesión para gestionar medicación.');
      setIsAuthModalOpen(true);
      return;
    }

    setMedications((prev) => prev.filter((m) => m.id !== id));
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'medications', String(id)));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/medications/${id}`);
    }
  };

  const handleUpdateMedication = async (updatedMed: Medication) => {
    if (!user) {
      setAuthRequiredPrompt('Debes registrarte o iniciar sesión para actualizar medicación y anotaciones.');
      setIsAuthModalOpen(true);
      return;
    }

    setMedications((prev) =>
      prev.map((m) => (m.id === updatedMed.id ? updatedMed : m))
    );

    try {
      await setDoc(doc(db, 'users', user.uid, 'medications', String(updatedMed.id)), updatedMed);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/medications/${updatedMed.id}`);
    }
  };

  // Journal handlers
  const handleSaveJournalEntry = async (entry: JournalEntry) => {
    if (!user) {
      setAuthRequiredPrompt('Debes registrarte o iniciar sesión para guardar tus reflexiones en el diario.');
      setIsAuthModalOpen(true);
      return;
    }

    setJournalEntries((prev) => {
      const filtered = prev.filter((e) => e.id !== entry.id && e.date !== entry.date);
      return [entry, ...filtered];
    });

    try {
      await setDoc(doc(db, 'users', user.uid, 'journal', entry.id), entry);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/journal/${entry.id}`);
    }

    if (entry.date) {
      const [y, m, d] = entry.date.split('-').map(Number);
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
    if (!user) {
      setAuthRequiredPrompt('Debes registrarte o iniciar sesión para gestionar tu diario.');
      setIsAuthModalOpen(true);
      return;
    }

    setJournalEntries((prev) => prev.filter((e) => e.id !== idOrDate && e.date !== idOrDate));

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'journal', idOrDate));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/journal/${idOrDate}`);
    }
  };

  // Weight handlers
  const handleAddWeight = async (entry: WeightEntry) => {
    if (!user) {
      setAuthRequiredPrompt('Debes registrarte o iniciar sesión para registrar y sincronizar tu peso.');
      setIsAuthModalOpen(true);
      return;
    }

    setWeights((prev) => {
      const filtered = prev.filter((w) => w.d !== entry.d);
      return [...filtered, entry].sort((a, b) => a.d.localeCompare(b.d));
    });

    try {
      await setDoc(doc(db, 'users', user.uid, 'weights', entry.d), entry);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/weights/${entry.d}`);
    }
  };

  const handleDeleteWeight = async (dateStr: string) => {
    if (!user) {
      setAuthRequiredPrompt('Debes registrarte o iniciar sesión para gestionar registros de peso.');
      setIsAuthModalOpen(true);
      return;
    }

    setWeights((prev) => prev.filter((w) => w.d !== dateStr));
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'weights', dateStr));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/weights/${dateStr}`);
    }
  };

  // Habit Handlers
  const handleAddHabit = async (habitData: Omit<Habit, 'id' | 'createdAt'>) => {
    if (!user) {
      setAuthRequiredPrompt('Debes registrarte o iniciar sesión con Google, Apple o tu correo para crear nuevos hábitos.');
      setIsAuthModalOpen(true);
      return;
    }

    const newHabit: Habit = {
      ...habitData,
      id: `habit-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setHabits((prev) => [newHabit, ...prev]);

    try {
      await setDoc(doc(db, 'users', user.uid, 'habits', newHabit.id), newHabit);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/habits/${newHabit.id}`);
    }
  };

  const handleToggleHabit = async (habitId: string, dateStr: string) => {
    if (!user) {
      setAuthRequiredPrompt('Debes registrarte o iniciar sesión con Google, Apple o tu correo para marcar tus hábitos.');
      setIsAuthModalOpen(true);
      return;
    }

    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const nextVal = !habit.history?.[dateStr];
    const updatedHistory = { ...(habit.history || {}), [dateStr]: nextVal };

    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, history: updatedHistory } : h))
    );

    try {
      await setDoc(
        doc(db, 'users', user.uid, 'habits', habitId),
        { history: updatedHistory },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/habits/${habitId}`);
    }
  };

  const handleUpdateHabit = async (habitId: string, habitData: Partial<Habit>) => {
    if (!user) {
      setAuthRequiredPrompt('Debes registrarte o iniciar sesión para editar tus hábitos.');
      setIsAuthModalOpen(true);
      return;
    }

    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, ...habitData } : h))
    );

    try {
      await setDoc(doc(db, 'users', user.uid, 'habits', habitId), habitData, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/habits/${habitId}`);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!user) {
      setAuthRequiredPrompt('Debes registrarte o iniciar sesión para eliminar hábitos.');
      setIsAuthModalOpen(true);
      return;
    }

    setHabits((prev) => prev.filter((h) => h.id !== habitId));

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'habits', habitId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/habits/${habitId}`);
    }
  };

  // Alarm Toast actions
  const handleSnoozeTask = (id: number, minutes: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, snooze: Date.now() + minutes * 60 * 1000 } : t))
    );
  };

  const handleSnoozeMedication = (id: number, minutes: number) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, snooze: Date.now() + minutes * 60 * 1000 } : m))
    );
  };

  const handleDismissAlert = (id: number, type: 'task' | 'medication') => {
    if (type === 'task') {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, fired: true } : t)));
    } else {
      const todayStr = toIsoDate(new Date());
      setMedications((prev) =>
        prev.map((m) => (m.id === id ? { ...m, alerted: { ...m.alerted, [todayStr]: true } } : m))
      );
    }
  };

  // Backup & Restore
  const handleExportBackup = () => {
    const backupData = {
      version: '2.0',
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
      if (data.tasks) setTasks(data.tasks);
      if (data.medications) setMedications(data.medications);
      if (data.weights) setWeights(data.weights);
      if (data.settings) setSettings(data.settings);
      if (data.journal) setJournalEntries(data.journal);
      if (data.habits) setHabits(data.habits);
    } catch {}
  };

  const handleResetData = () => {
    setTasks(INITIAL_TASKS);
    setMedications(INITIAL_MEDICATIONS);
    setWeights(INITIAL_WEIGHTS);
    setSettings(INITIAL_SETTINGS);
    setHabits(INITIAL_HABITS);
  };

  const handleUpdateSettings = async (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'settings', 'config'), newSettings, { merge: true });
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

  // Filter tasks by active category
  const visibleTasks =
    currentCategory === 'all' ? tasks : tasks.filter((t) => t.c === currentCategory);

  // Month stats
  const currentYearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const todayStr = toIsoDate(new Date());

  const monthTasks = visibleTasks.filter((t) => t.d.startsWith(currentYearMonth));
  const doneMonthCount = monthTasks.filter((t) => t.done).length;
  const pendingMonthCount = monthTasks.filter((t) => !t.done).length;
  const todayPendingCount = visibleTasks.filter((t) => t.d === todayStr && !t.done).length;

  // 1. Session verification & sync loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf8f5] dark:bg-[#0f111a] p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-linear-to-tr from-[#e8533a] to-amber-500 flex items-center justify-center text-white shadow-xl shadow-[#e8533a]/25 mb-5 animate-pulse">
          <Calendar className="w-8 h-8" />
        </div>
        <div className="w-8 h-8 border-3 border-[#e8533a] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-serif font-bold text-neutral-900 dark:text-neutral-100 mb-1">
          Iniciando sesión segura
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm">
          Sincronizando tus tareas, medicamentos, diario y notas con la base de datos en tiempo real...
        </p>
      </div>
    );
  }

  // 2. Mandatory Authentication Gate: require user registration/login to enter the application
  if (!user) {
    return <AuthPortal />;
  }

  return (
    <div className="min-h-screen flex bg-[#faf8f5] dark:bg-[#0f111a] text-[#1a1c29] dark:text-[#f0f2f8]">
      {/* Toast Alarms in Foreground */}
      <ToastAlarms
        tasks={tasks}
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
          } else if (activeView === 'menus' || activeView === 'journal' || activeView === 'habits') {
            setActiveView('month');
          }
        }}
        activeView={activeView}
        onSelectView={(view) => {
          setActiveView(view);
          if (view === 'journal') {
            setCurrentCategory('diario');
            if (!isDiaryUnlocked) {
              setDiaryPinModalMode('unlock');
              setIsDiaryPinModalOpen(true);
            }
          } else if (view === 'habits') {
            setCurrentCategory('habitos');
            setIsDiaryUnlocked(false);
          } else if (view === 'menus') {
            setCurrentCategory('menus');
            setIsDiaryUnlocked(false);
          } else {
            if (currentCategory === 'diario' || currentCategory === 'habitos' || currentCategory === 'menus') {
              setCurrentCategory('all');
            }
            setIsDiaryUnlocked(false);
          }
        }}
        tasks={tasks}
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
        onOpenSettings={() => setIsSettingsModalOpen(true)}
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
                  ? activeView === 'journal'
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
                  : `${CATEGORY_MAP[currentCategory].e} ${getCategoryLocalizedName(currentCategory, currentLang)}`}
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {activeView === 'day'
                  ? `${getLocalizedDayName((currentDayDate.getDay() + 6) % 7, true, currentLang)}, ${currentDayDate.getDate()} de ${getLocalizedMonthName(currentDayDate.getMonth(), currentLang)} ${currentDayDate.getFullYear()}`
                  : `${getLocalizedMonthName(currentDate.getMonth(), currentLang)} ${currentDate.getFullYear()} · ${t('header.subtitle', currentLang)}`}
              </p>
            </div>
          </div>

          {/* Right Zone: View switchers & CTA button */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Calendar mode switcher buttons: Día, Semana, Mes, Lista */}
            <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800/90 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveView('day')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-colors shadow-2xs"
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
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold transition-all shrink-0"
                title="Instalar como app nativa en Android (APK / Capacitor)"
              >
                <span>🤖</span>
                <span className="hidden sm:inline">Instalar en Android</span>
                <span className="sm:hidden">Android</span>
              </button>
            )}

            {/* Install in iOS (iPhone / iPad) CTA */}
            {!isInstalled && (
              <button
                type="button"
                onClick={() => setIsIOSModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600/10 hover:bg-sky-600/20 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 text-xs font-semibold transition-all shrink-0"
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
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 text-xs font-semibold transition-all shrink-0"
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
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#161824] hover:bg-neutral-50 dark:hover:bg-neutral-800/80 text-xs font-semibold transition-all shadow-2xs"
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition-colors shadow-2xs shrink-0"
                title="Suscripción Premium Vitalicia Activa"
              >
                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="hidden md:inline">Premium Vitalicio</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs font-bold transition-all shadow-xs shrink-0 active:scale-95"
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
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#161824] hover:bg-neutral-50 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 transition-all shadow-2xs relative"
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#e8533a] hover:bg-[#d4432c] text-white text-xs font-semibold shadow-md active:scale-95 transition-all shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{t('header.newTask', currentLang)}</span>
            </button>

            {/* Authenticated User Pill with Quick Logout */}
            <div className="flex items-center gap-1.5 p-1 pl-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#161824] shadow-2xs">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 pr-2 hover:opacity-85 transition-opacity text-left"
                title="Ver mi cuenta y detalles de sincronización"
              >
                <div className="w-6 h-6 rounded-full bg-[#e8533a] text-white flex items-center justify-center font-bold text-[10px] overflow-hidden shrink-0 shadow-2xs">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    (user.displayName || user.email || 'U')[0].toUpperCase()
                  )}
                </div>
                <div className="hidden sm:block leading-tight">
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block max-w-[110px] truncate">
                    {user.displayName || user.email?.split('@')[0] || 'Usuario'}
                  </span>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    En línea
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirm('¿Deseas cerrar tu sesión?')) {
                    await logout();
                  }
                }}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
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
                    className="w-8 h-8 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
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
                    className="w-8 h-8 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    title="Siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleGoToToday}
                  className="px-3.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs font-semibold hover:border-neutral-400 transition-colors"
                >
                  Hoy
                </button>
              </div>
            </>
          )}

          {/* Dynamic Viewport View */}
          {activeView === 'month' && (
            <MonthView
              currentDate={currentDate}
              tasks={visibleTasks}
              weights={weights}
              journalEntries={journalEntries}
              onOpenTask={handleEditTask}
              onAddTaskForDate={(dStr) => handleOpenNewTask(dStr, currentCategory === 'all' ? undefined : currentCategory)}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onOpenJournalEntry={handleOpenJournalForDate}
              onOpenWeightTracker={(dateStr) => {
                setCurrentCategory('medicas');
                setActiveView('weight');
                if (dateStr) {
                  const [y, m, d] = dateStr.split('-').map(Number);
                  setCurrentDate(new Date(y, m - 1, d || 1));
                }
              }}
              onOpenDayView={(dateStr) => {
                const [y, m, d] = dateStr.split('-').map(Number);
                handleSelectDayDate(new Date(y, m - 1, d || 1));
                setActiveView('day');
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
              onAddTaskForDate={(dStr) => handleOpenNewTask(dStr, currentCategory === 'all' ? undefined : currentCategory)}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onOpenJournalEntry={handleOpenJournalForDate}
              onOpenWeightTracker={(dateStr) => {
                setCurrentCategory('medicas');
                setActiveView('weight');
                if (dateStr) {
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
              onAddTaskForDate={(dStr) => handleOpenNewTask(dStr, currentCategory === 'all' ? undefined : currentCategory)}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onOpenJournalEntry={handleOpenJournalForDate}
              onOpenWeightTracker={(dateStr) => {
                setCurrentCategory('medicas');
                setActiveView('weight');
                if (dateStr) {
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
              tasks={tasks}
              onSaveMeal={async (dStr, mealKey, dishText) => {
                if (!user) {
                  setAuthRequiredPrompt('Debes registrarte o iniciar sesión con Google, Apple o tu correo para planificar y guardar menús.');
                  setIsAuthModalOpen(true);
                  return;
                }

                const existing = tasks.find(
                  (t) => t.c === 'menus' && t.d === dStr && t.meal === mealKey
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
                const existingShop = tasks.find((t) => t.c === 'compras');
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
              tasks={tasks}
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
            <MedicationView
              medications={medications}
              onToggleMedication={handleToggleMedication}
              onAddMedication={handleAddMedication}
              onUpdateMedication={handleUpdateMedication}
              onDeleteMedication={handleDeleteMedication}
            />
          )}

          {activeView === 'weight' && (
            <WeightTrackerView
              currentDate={currentDate}
              weights={weights}
              settings={settings}
              onAddWeight={handleAddWeight}
              onDeleteWeight={handleDeleteWeight}
              onUpdateSettings={handleUpdateSettings}
            />
          )}

          {activeView === 'shopping' && (
            <ShoppingView
              tasks={tasks}
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
          const updated = { ...settings, diaryPin: newPin || undefined };
          setSettings(updated);
          try {
            localStorage.setItem('settings-v2', JSON.stringify(updated));
          } catch {}
          if (user) {
            setDoc(doc(db, 'users', user.uid, 'settings', 'config'), updated, { merge: true }).catch(() => {});
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

      {/* User Settings & Web Push Modal */}
      <UserSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onResetData={handleResetData}
        onOpenPinModal={() => {
          setDiaryPinModalMode('change');
          setIsDiaryPinModalOpen(true);
        }}
      />

      {/* Lifetime Premium Subscription & Ad Removal Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        settings={settings}
        onActivatePremium={handleActivatePremium}
      />

      {/* Deleted Task Undo Toast */}
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
