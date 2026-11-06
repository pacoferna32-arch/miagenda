import React, { useState, useEffect, useRef } from 'react';
import { UserSettings, AppLanguage, PushNotificationSettings } from '../types';
import { DEFAULT_PUSH_SETTINGS } from '../utils/constants';
import { SUPPORTED_LANGUAGES, t } from '../utils/i18n';
import {
  isPushNotificationSupported,
  getNotificationPermissionStatus,
  requestNotificationPermission,
  sendTestPushNotification,
  PushPermissionStatus,
} from '../utils/pushNotifications';
import { sounds } from '../utils/audio';
import {
  X,
  Bell,
  Globe,
  Sliders,
  Lock,
  Check,
  AlertCircle,
  Clock,
  Pill,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Vibrate,
  Send,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onExportBackup?: () => void;
  onImportBackup?: (jsonStr: string) => void;
  onResetData?: () => void;
  onOpenPinModal?: () => void;
  initialTab?: 'push' | 'language' | 'general' | 'security' | 'changelog';
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
  onResetData,
  onOpenPinModal,
  initialTab,
}) => {
  const currentLang = settings.language || 'es';
  const [activeTab, setActiveTab] = useState<'push' | 'language' | 'general' | 'security' | 'changelog'>(
    initialTab || 'push'
  );
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const CHANGELOG_RELEASES = [
    {
      version: 'v2.5.0',
      date: 'Noviembre 2026',
      badge: 'Actual',
      title: 'Modo Enfoque, Eliminación Rápida con Deshacer y Registro de Cambios',
      items: [
        'Registro de cambios (Changelog) integrado dentro del menú de Ajustes para consultar todas las novedades y mejoras implementadas desde el inicio.',
        'Filtro inteligente en la Vista de Lista para alternar entre tareas Pendientes (Activas), Completadas y Prioritarias con barra de progreso en tiempo real.',
        'Eliminación directa en 1 clic desde cualquier vista del calendario (Mes, Semana, Día y Lista) sin bloqueos de confirmación.',
        'Notificación flotante con botón "Deshacer" al eliminar una tarea programada para restaurarla al instante si se borró por error.',
      ],
    },
    {
      version: 'v2.4.0',
      date: 'Noviembre 2026',
      badge: 'Mejora',
      title: 'Gráfico de Tendencia de Peso y Despliegue Android APK / iOS PWA',
      items: [
        'Visualización interactiva con Recharts en Control de Peso para seguir la curva de evolución mensual comparada con tu meta de peso.',
        'Asistente técnico integrado con comandos de Capacitor y pasos de Android Studio para empaquetar la web app en un archivo APK instalable.',
        'Guía paso a paso para añadir la aplicación a la pantalla de inicio en iOS (iPhone y iPad) desde Safari.',
      ],
    },
    {
      version: 'v2.3.0',
      date: 'Noviembre 2026',
      badge: 'PRO',
      title: 'Suscripción Vitalicia de Pago Único y Multidivisa',
      items: [
        'Suscripción de pago único (4,99 €) para desbloquear todas las herramientas de la aplicación y eliminar la publicidad para siempre.',
        'Conversión automática al tipo de cambio diario en 8 monedas (EUR, USD, GBP, MXN, COP, ARS, CLP, PEN) con pago por tarjeta o transferencia bancaria.',
      ],
    },
    {
      version: 'v2.2.0',
      date: 'Octubre 2026',
      badge: 'Sistema',
      title: 'Notificaciones Web Push y Soporte Multi-idioma',
      items: [
        'Panel de configuración Web Push con recordatorios personalizados para tareas y medicamentos, resumen matutino, revisión nocturna y modo No Molestar.',
        'Cambio de idioma instantáneo en toda la interfaz (Español, Inglés, Francés, Alemán, Portugués, Italiano, Catalán, Gallego y Euskera).',
      ],
    },
    {
      version: 'v2.1.0',
      date: 'Octubre 2026',
      badge: 'Funciones',
      title: 'Diario Personal con PIN, Habit Tracker y Previsión Meteorológica',
      items: [
        'Diario Personal protegido con clave de seguridad de 4 dígitos, estados de ánimo, fotos, notas de voz y dibujo a mano alzada.',
        'Seguimiento de hábitos diarios (Habit Tracker) con rachas, plantillas recomendadas y calendario semanal.',
        'Widget meteorológico en vivo y banner semanal del tiempo para todas las capitales de provincia e islas de España y ciudades del mundo.',
      ],
    },
    {
      version: 'v2.0.0',
      date: 'Septiembre 2026',
      badge: 'Nube',
      title: 'Sincronización en la Nube en Tiempo Real y Notas Multimedia',
      items: [
        'Sincronización multi-dispositivo en tiempo real con Firebase Auth (Google, Apple y correo electrónico) y Cloud Firestore.',
        'Sección de Notas y Archivos multimedia independiente para cada pestaña (grabadora de voz con transcripción, pizarra de dibujo, enlaces y archivos PDF/imágenes).',
      ],
    },
    {
      version: 'v1.0.0',
      date: 'Agosto 2026',
      badge: 'Lanzamiento',
      title: 'Lanzamiento Inicial de Mi Calendario de Tareas',
      items: [
        'Calendario interactivo con vistas de Mes, Semana, Día y Lista organizadas en 10 categorías especializadas.',
        'Planificador de Menús Semanales con exportación de ingredientes a la Lista de Compras, Control de Medicación Diaria, Control de Peso con IMC y Finanzas y Balance mensual.',
      ],
    },
  ];

  // Push notifications state
  const pushSettings: PushNotificationSettings = settings.pushNotifications || DEFAULT_PUSH_SETTINGS;
  const [permStatus, setPermStatus] = useState<PushPermissionStatus>('default');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isTestingPush, setIsTestingPush] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      const supported = isPushNotificationSupported();
      setIsSupported(supported);
      setPermStatus(getNotificationPermissionStatus());
      setTestResult(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const updatePush = (partial: Partial<PushNotificationSettings>) => {
    const updatedPush: PushNotificationSettings = {
      ...pushSettings,
      ...partial,
    };
    onUpdateSettings({ pushNotifications: updatedPush });
  };

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermStatus(result);
    if (result === 'granted') {
      updatePush({ enabled: true });
      sounds.playSuccessChime();
    }
  };

  const handleTestPush = async () => {
    setIsTestingPush(true);
    setTestResult(null);
    try {
      const ok = await sendTestPushNotification(pushSettings, currentLang);
      setPermStatus(getNotificationPermissionStatus());
      if (ok) {
        setTestResult({
          success: true,
          msg: t('push.testSuccess', currentLang),
        });
      } else {
        setTestResult({
          success: false,
          msg:
            permStatus === 'denied'
              ? t('push.deniedHelp', currentLang)
              : 'No se pudo enviar la notificación. Verifica los permisos de tu navegador.',
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        msg: e?.message || 'Error al disparar la notificación.',
      });
    } finally {
      setIsTestingPush(false);
    }
  };

  const handleSelectLanguage = (langCode: AppLanguage) => {
    onUpdateSettings({ language: langCode });
    document.documentElement.lang = langCode;
    sounds.playClick();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#151722] text-neutral-900 dark:text-neutral-100 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-[#1a1c29]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e8533a]/15 text-[#e8533a] flex items-center justify-center font-bold text-lg shadow-2xs">
              ⚙️
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-neutral-900 dark:text-neutral-100">
                {t('settings.title', currentLang)}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('settings.subtitle', currentLang)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title={t('common.close', currentLang)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 bg-neutral-100/60 dark:bg-[#12141e]/60 overflow-x-auto gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('push');
              sounds.playClick();
            }}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'push'
                ? 'border-[#e8533a] text-[#e8533a]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>{t('settings.tabPush', currentLang)}</span>
            {pushSettings.enabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('language');
              sounds.playClick();
            }}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'language'
                ? 'border-[#e8533a] text-[#e8533a]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>{t('settings.tabLanguage', currentLang)}</span>
            <span className="text-xs uppercase bg-neutral-200/80 dark:bg-neutral-800 px-1.5 py-0.5 rounded-md font-mono">
              {currentLang}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('general');
              sounds.playClick();
            }}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'border-[#e8533a] text-[#e8533a]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{t('settings.tabGeneral', currentLang)}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('security');
              sounds.playClick();
            }}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'border-[#e8533a] text-[#e8533a]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{t('settings.tabSecurity', currentLang)}</span>
            {settings.diaryPin && (
              <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.2 rounded">
                PIN
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('changelog');
              sounds.playClick();
            }}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'changelog'
                ? 'border-[#e8533a] text-[#e8533a]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Novedades</span>
            <span className="text-[10px] bg-[#e8533a]/15 text-[#e8533a] font-bold px-1.5 py-0.5 rounded-md">
              v2.5
            </span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: PUSH NOTIFICATIONS */}
          {activeTab === 'push' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Permission & Status Hero Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/60 dark:from-neutral-800/80 dark:to-neutral-800/40 border border-amber-200/80 dark:border-neutral-700 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-[#e8533a] text-white shadow-xs">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                        {t('push.title', currentLang)}
                      </h3>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        {t('push.desc', currentLang)}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {permStatus === 'granted' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        {t('push.permGranted', currentLang)}
                      </span>
                    ) : permStatus === 'denied' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        {t('push.permDenied', currentLang)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        <Info className="w-3.5 h-3.5 text-amber-600" />
                        {t('push.permDefault', currentLang)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Compatibility info and Permission CTA */}
                {!isSupported ? (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                    ⚠️ {t('push.statusUnsupported', currentLang)}
                  </div>
                ) : permStatus !== 'granted' ? (
                  <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-amber-200/60 dark:border-neutral-700/60">
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {permStatus === 'denied'
                        ? t('push.deniedHelp', currentLang)
                        : 'Haz clic en el botón para que el navegador te solicite permiso para recibir notificaciones.'}
                    </p>
                    {permStatus !== 'denied' && (
                      <button
                        type="button"
                        onClick={handleRequestPermission}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#e8533a] hover:bg-[#d4432c] text-white text-xs font-bold shadow-md transition-all shrink-0 active:scale-95 cursor-pointer"
                      >
                        {t('push.requestPerm', currentLang)}
                      </button>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Master Switch */}
              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1a1c29] flex items-center justify-between gap-4 shadow-2xs">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {t('push.masterToggle', currentLang)}
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t('push.masterToggleDesc', currentLang)}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={pushSettings.enabled}
                    onChange={(e) => {
                      if (e.target.checked && permStatus !== 'granted') {
                        handleRequestPermission();
                      } else {
                        updatePush({ enabled: e.target.checked });
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e8533a]"></div>
                </label>
              </div>

              {/* Specific Push Reminder Config Cards */}
              <div className="space-y-4">
                {/* 1. Task Reminders */}
                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1a1c29] space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                          {t('push.taskReminders', currentLang)}
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {t('push.taskRemindersDesc', currentLang)}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={pushSettings.taskRemindersEnabled}
                        onChange={(e) => updatePush({ taskRemindersEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#e8533a]"></div>
                    </label>
                  </div>

                  {pushSettings.taskRemindersEnabled && (
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-4 flex-wrap">
                      <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                        {t('push.leadTime', currentLang)}:
                      </span>
                      <select
                        value={pushSettings.taskReminderLeadMinutes}
                        onChange={(e) => updatePush({ taskReminderLeadMinutes: Number(e.target.value) })}
                        className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200"
                      >
                        <option value={0}>{t('push.leadExact', currentLang)}</option>
                        <option value={5}>{t('push.lead5m', currentLang)}</option>
                        <option value={10}>{t('push.lead10m', currentLang)}</option>
                        <option value={15}>{t('push.lead15m', currentLang)}</option>
                        <option value={30}>{t('push.lead30m', currentLang)}</option>
                        <option value={60}>{t('push.lead60m', currentLang)}</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* 2. Medication Reminders */}
                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1a1c29] space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                        <Pill className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                          {t('push.medReminders', currentLang)}
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {t('push.medRemindersDesc', currentLang)}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={pushSettings.medicationRemindersEnabled}
                        onChange={(e) => updatePush({ medicationRemindersEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#e8533a]"></div>
                    </label>
                  </div>

                  {pushSettings.medicationRemindersEnabled && (
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-4 flex-wrap">
                      <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                        {t('push.leadTime', currentLang)}:
                      </span>
                      <select
                        value={pushSettings.medicationReminderLeadMinutes}
                        onChange={(e) => updatePush({ medicationReminderLeadMinutes: Number(e.target.value) })}
                        className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200"
                      >
                        <option value={0}>{t('push.leadExact', currentLang)}</option>
                        <option value={5}>{t('push.lead5m', currentLang)}</option>
                        <option value={10}>{t('push.lead10m', currentLang)}</option>
                        <option value={15}>{t('push.lead15m', currentLang)}</option>
                        <option value={30}>{t('push.lead30m', currentLang)}</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* 3. Daily Morning Digest & Evening Review */}
                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1a1c29] space-y-4 shadow-2xs">
                  {/* Morning */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <span>🌅</span> {t('push.dailyDigest', currentLang)}
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {t('push.dailyDigestDesc', currentLang)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={pushSettings.dailyDigestTime || '08:00'}
                        onChange={(e) => updatePush({ dailyDigestTime: e.target.value })}
                        disabled={!pushSettings.dailyDigestEnabled}
                        className="px-2 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono font-semibold"
                      />
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={pushSettings.dailyDigestEnabled}
                          onChange={(e) => updatePush({ dailyDigestEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#e8533a]"></div>
                      </label>
                    </div>
                  </div>

                  {/* Evening */}
                  <div className="flex items-center justify-between gap-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <span>🌙</span> {t('push.eveningReview', currentLang)}
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {t('push.eveningReviewDesc', currentLang)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={pushSettings.eveningReviewTime || '21:30'}
                        onChange={(e) => updatePush({ eveningReviewTime: e.target.value })}
                        disabled={!pushSettings.eveningReviewEnabled}
                        className="px-2 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono font-semibold"
                      />
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={pushSettings.eveningReviewEnabled}
                          onChange={(e) => updatePush({ eveningReviewEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#e8533a]"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 4. Quiet Hours (Do Not Disturb) */}
                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1a1c29] space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                        {t('push.quietHours', currentLang)}
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {t('push.quietHoursDesc', currentLang)}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={pushSettings.quietHoursEnabled}
                        onChange={(e) => updatePush({ quietHoursEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#e8533a]"></div>
                    </label>
                  </div>

                  {pushSettings.quietHoursEnabled && (
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500 font-medium">{t('push.quietStart', currentLang)}:</span>
                        <input
                          type="time"
                          value={pushSettings.quietHoursStart || '23:00'}
                          onChange={(e) => updatePush({ quietHoursStart: e.target.value })}
                          className="px-2 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono font-semibold"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500 font-medium">{t('push.quietEnd', currentLang)}:</span>
                        <input
                          type="time"
                          value={pushSettings.quietHoursEnd || '07:00'}
                          onChange={(e) => updatePush({ quietHoursEnd: e.target.value })}
                          className="px-2 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono font-semibold"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Sound & Vibration Delivery */}
                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1a1c29] grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-2xs">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-[#e8533a]" />
                      <span className="text-xs font-semibold">{t('push.sound', currentLang)}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={pushSettings.soundEnabled}
                      onChange={(e) => updatePush({ soundEnabled: e.target.checked })}
                      className="accent-[#e8533a] w-4 h-4 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Vibrate className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-semibold">{t('push.vibrate', currentLang)}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={pushSettings.vibrate}
                      onChange={(e) => updatePush({ vibrate: e.target.checked })}
                      className="accent-[#e8533a] w-4 h-4 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* 6. Test Push Notification Action Button */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#161824] border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        {t('push.testButton', currentLang)}
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Comprueba que tu navegador y sistema operativo muestran las alertas correctamente.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestPush}
                      disabled={isTestingPush}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isTestingPush ? t('push.testing', currentLang) : t('push.testButton', currentLang)}</span>
                    </button>
                  </div>

                  {testResult && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        testResult.success
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {testResult.success ? (
                        <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      )}
                      <span>{testResult.msg}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LANGUAGE SELECTION */}
          {activeTab === 'language' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#1a1c29] border border-neutral-200 dark:border-neutral-800 space-y-1">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#e8533a]" />
                  <span>{t('lang.title', currentLang)}</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('lang.desc', currentLang)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wider">
                  {t('lang.switchPrompt', currentLang)}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SUPPORTED_LANGUAGES.map((langItem) => {
                    const isSelected = currentLang === langItem.code;
                    return (
                      <button
                        key={langItem.code}
                        type="button"
                        onClick={() => handleSelectLanguage(langItem.code)}
                        className={`p-3.5 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#e8533a] bg-[#e8533a]/10 dark:bg-[#e8533a]/20 shadow-xs ring-2 ring-[#e8533a]/30'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-[#161824]'
                        }`}
                      >
                        <span className="text-2xl shrink-0 drop-shadow-xs">{langItem.flag}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${isSelected ? 'text-[#e8533a]' : 'text-neutral-900 dark:text-neutral-100'}`}>
                            {langItem.nativeName}
                          </p>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                            {langItem.name} · {langItem.region}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-[#e8533a] text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GENERAL & HEALTH */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Appearance & Sound */}
              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1a1c29] space-y-4">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  {t('general.appearance', currentLang)}
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ theme: 'light' })}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      settings.theme === 'light'
                        ? 'border-[#e8533a] bg-[#e8533a]/10 text-[#e8533a]'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>{t('general.lightMode', currentLang)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ theme: 'dark' })}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      settings.theme === 'dark'
                        ? 'border-[#e8533a] bg-[#e8533a]/10 text-[#e8533a]'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-sky-400" />
                    <span>{t('general.darkMode', currentLang)}</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                      {t('general.soundEffects', currentLang)}
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      {t('general.soundEffectsDesc', currentLang)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ enableSound: !settings.enableSound })}
                    className={`p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                      settings.enableSound
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                    }`}
                  >
                    {settings.enableSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Health Anthropometry */}
              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1a1c29] space-y-4">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  {t('general.healthData', currentLang)}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-neutral-500 font-medium block mb-1">
                      {t('general.height', currentLang)}
                    </label>
                    <input
                      type="number"
                      value={settings.heightCm || 175}
                      onChange={(e) => onUpdateSettings({ heightCm: Number(e.target.value) })}
                      min={100}
                      max={250}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-semibold text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-neutral-500 font-medium block mb-1">
                      {t('general.targetWeight', currentLang)}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.targetWeightKg || 70}
                      onChange={(e) => onUpdateSettings({ targetWeightKg: Number(e.target.value) })}
                      min={30}
                      max={200}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-semibold text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Data Backup */}
              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1a1c29] space-y-3">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  {t('general.backupTitle', currentLang)}
                </h3>

                <div className="flex items-center gap-2 flex-wrap">
                  {onExportBackup && (
                    <button
                      type="button"
                      onClick={onExportBackup}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t('general.exportBackup', currentLang)}</span>
                    </button>
                  )}

                  {onImportBackup && (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{t('general.importBackup', currentLang)}</span>
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const content = ev.target?.result as string;
                            if (content) onImportBackup(content);
                          };
                          reader.readAsText(file);
                        }}
                        accept=".json"
                        className="hidden"
                      />
                    </>
                  )}

                  {onResetData &&
                    (confirmReset ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onResetData();
                            setConfirmReset(false);
                            onClose();
                          }}
                          className="px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
                        >
                          Confirmar restablecimiento
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmReset(false)}
                          className="px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmReset(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{t('general.resetData', currentLang)}</span>
                      </button>
                    ))}
                </div>
              </div>

              {/* Quick Changelog Card inside General Tab */}
              <div className="p-4 rounded-2xl border border-[#e8533a]/25 bg-gradient-to-br from-[#e8533a]/5 to-amber-500/5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#e8533a]/15 text-[#e8533a] flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                        Registro de cambios (Changelog)
                      </h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#e8533a] text-white">
                        v2.5.0
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Consulta todas las mejoras y funciones añadidas hasta la versión 2.5.0.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('changelog')}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-[#161824] border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-[#e8533a] hover:border-[#e8533a] transition-colors shrink-0 cursor-pointer"
                >
                  Ver novedades
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY (DIARY 4-DIGIT PIN) */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-[#1a1c29] border border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-purple-500" />
                      <span>{t('pin.title', currentLang)} (Diario Personal)</span>
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {t('pin.desc', currentLang)}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  {settings.diaryPin ? (
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold">
                        PIN del Diario Activo: ••••
                      </span>
                      {onOpenPinModal && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenPinModal();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer"
                        >
                          {t('pin.configure', currentLang)}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onUpdateSettings({ diaryPin: '' })}
                        className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        {t('pin.remove', currentLang)}
                      </button>
                    </div>
                  ) : (
                    <div>
                      {onOpenPinModal && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenPinModal();
                          }}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                        >
                          {t('pin.configure', currentLang)}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CHANGELOG (NOVEDADES v1.0.0 -> v2.5.0) */}
          {activeTab === 'changelog' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#e8533a]/10 via-amber-500/5 to-transparent border border-[#e8533a]/25 flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-[#e8533a] text-white shrink-0 shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                      Registro de Cambios y Novedades
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e8533a] text-white">
                      Versión 2.5.0
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                    Historial completo desde el lanzamiento inicial (v1.0.0) hasta la versión 2.5.0 de Mi Calendario de Tareas.
                  </p>
                </div>
              </div>

              <div className="relative pl-4 sm:pl-6 border-l-2 border-neutral-200 dark:border-neutral-800 space-y-6">
                {CHANGELOG_RELEASES.map((release, idx) => (
                  <div key={release.version} className="relative">
                    {/* Timeline dot */}
                    <div
                      className={`absolute -left-[21px] sm:-left-[29px] top-1.5 w-3.5 h-3.5 rounded-full border-2 ${
                        idx === 0
                          ? 'bg-[#e8533a] border-white dark:border-[#151722] ring-4 ring-[#e8533a]/20'
                          : 'bg-neutral-300 dark:bg-neutral-700 border-white dark:border-[#151722]'
                      }`}
                    />

                    <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1a1c29] shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
                            {release.version}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              idx === 0
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-[#e8533a]/10 text-[#e8533a]'
                            }`}
                          >
                            {release.badge}
                          </span>
                        </div>
                        <span className="text-[11px] text-neutral-400 font-medium">
                          {release.date}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                        {release.title}
                      </h4>

                      <ul className="space-y-1.5 pt-1">
                        {release.items.map((item, i) => (
                          <li
                            key={i}
                            className="text-xs text-neutral-600 dark:text-neutral-300 flex items-start gap-2 leading-relaxed"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-[#1a1c29]/50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('changelog')}
            className="flex items-center gap-2 text-xs text-neutral-500 hover:text-[#e8533a] transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Versión 2.5.0 · Ver registro de cambios</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#e8533a] hover:bg-[#d4432c] text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            {t('common.done', currentLang)}
          </button>
        </div>
      </div>
    </div>
  );
};
