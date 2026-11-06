import React, { useState, useEffect, useRef } from 'react';
import { UserSettings, AppLanguage, PushNotificationSettings } from '../types';
import { DEFAULT_PUSH_SETTINGS } from '../utils/constants';
import { SUPPORTED_LANGUAGES, t } from '../utils/i18n';
import {
  isPushNotificationSupported,
  getNotificationPermissionStatus,
  requestNotificationPermission,
  sendTestPushNotification,
  subscribeToPushService,
  unsubscribeFromPushService,
  getExistingPushSubscription,
  WebPushSubscriptionData,
  PushPermissionStatus,
} from '../utils/pushNotifications';
import { useAuth } from '../context/AuthContext';
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
  Radio,
  Copy,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Key,
  User,
  Camera,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { PRESET_AVATARS, getTimeGreeting } from '../utils/motivationalQuotes';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onExportBackup?: () => void;
  onImportBackup?: (jsonStr: string) => void;
  onResetData?: () => void;
  onOpenPinModal?: () => void;
  initialTab?: 'profile' | 'push' | 'language' | 'general' | 'security';
  onOpenWelcomeView?: () => void;
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
  onOpenWelcomeView,
}) => {
  const currentLang = settings.language || 'es';
  const [activeTab, setActiveTab] = useState<'profile' | 'push' | 'language' | 'general' | 'security'>(
    initialTab || 'profile'
  );
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const { user } = useAuth();

  // Push notifications state
  const pushSettings: PushNotificationSettings = settings.pushNotifications || DEFAULT_PUSH_SETTINGS;
  const [permStatus, setPermStatus] = useState<PushPermissionStatus>('default');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isTestingPush, setIsTestingPush] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<WebPushSubscriptionData | null>(null);
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);
  const [showSubscriptionDetails, setShowSubscriptionDetails] = useState<boolean>(false);
  const [copiedSub, setCopiedSub] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      const supported = isPushNotificationSupported();
      setIsSupported(supported);
      setPermStatus(getNotificationPermissionStatus());
      setTestResult(null);

      // Fetch active Web Push subscription from PushManager / localStorage
      getExistingPushSubscription().then((sub) => {
        setActiveSubscription(sub);
      }).catch((err) => {
        console.warn('Error fetching existing push subscription:', err);
      });
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

  const handleSubscribePushService = async () => {
    setIsSubscribing(true);
    setTestResult(null);
    try {
      const sub = await subscribeToPushService(user?.uid);
      if (sub) {
        setActiveSubscription(sub);
        updatePush({ enabled: true, subscription: sub });
        setPermStatus(getNotificationPermissionStatus());
        sounds.playSuccessChime();
        setTestResult({
          success: true,
          msg: '¡Suscripción Web Push activada con éxito para recordatorios diarios de tareas!',
        });
      } else {
        setPermStatus(getNotificationPermissionStatus());
        setTestResult({
          success: false,
          msg: 'No se pudo completar la suscripción. Verifica que diste permiso a las notificaciones.',
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        msg: e?.message || 'Error al suscribirse al servicio Web Push.',
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleUnsubscribePushService = async () => {
    setIsSubscribing(true);
    setTestResult(null);
    try {
      await unsubscribeFromPushService(user?.uid);
      setActiveSubscription(null);
      updatePush({ subscription: undefined });
      setPermStatus(getNotificationPermissionStatus());
      setTestResult({
        success: true,
        msg: 'Te has desuscrito correctamente del servicio Web Push.',
      });
    } catch (e: any) {
      setTestResult({
        success: false,
        msg: e?.message || 'Error al desuscribir el servicio Web Push.',
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleCopySubscription = () => {
    if (!activeSubscription) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(activeSubscription, null, 2));
      setCopiedSub(true);
      setTimeout(() => setCopiedSub(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
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

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona un archivo de imagen (JPG, PNG o WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 280;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onUpdateSettings({
            userAvatar: compressedDataUrl,
            userAvatarType: 'upload',
          });
          sounds.playSuccessChime();
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSelectPresetAvatar = (presetId: string) => {
    onUpdateSettings({
      userAvatar: presetId,
      userAvatarType: 'preset',
    });
    sounds.playClick();
  };

  const handleSelectEmojiAvatar = (emoji: string) => {
    onUpdateSettings({
      userAvatar: emoji,
      userAvatarType: 'emoji',
    });
    sounds.playClick();
  };

  const handleClearAvatar = () => {
    onUpdateSettings({
      userAvatar: 'preset:sparkle',
      userAvatarType: 'preset',
    });
    sounds.playClick();
  };

  const currentUserName = settings.userName?.trim() || 'Paco';
  const greetingPreview = getTimeGreeting(currentUserName);

  const EMOJI_OPTIONS = ['😊', '😎', '🎯', '🚀', '💡', '🦁', '🌟', '🧘', '☕', '🌸', '🦊', '⚡'];

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
          {/* TAB: Perfil & Bienvenida */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              sounds.playClick();
            }}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-[#e8533a] text-[#e8533a]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Perfil & Bienvenida</span>
          </button>

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
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 0: PERFIL Y PÁGINA DE BIENVENIDA */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Profile Avatar & Greeting Preview */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-50/70 via-amber-50/40 to-neutral-50 dark:from-neutral-800/80 dark:via-[#1c1f2e] dark:to-neutral-900 border border-orange-200/70 dark:border-neutral-700/80 space-y-5 shadow-xs">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  {/* Avatar Preview */}
                  <div className="relative group shrink-0">
                    <UserAvatar
                      avatar={settings.userAvatar}
                      avatarType={settings.userAvatarType}
                      userName={currentUserName}
                      size="xl"
                      className="ring-4 ring-[#e8533a]/30 shadow-lg"
                    />

                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-2 rounded-full bg-[#e8533a] hover:bg-[#d4432c] text-white shadow-md transition-all active:scale-95 cursor-pointer"
                      title="Subir fotografía"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Greeting Live Preview */}
                  <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                      <Sparkles className="w-3 h-3" />
                      <span>Vista previa de tu bienvenida</span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white">
                      {greetingPreview.greeting}
                    </h3>

                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      Personaliza tu foto o avatar y el nombre que aparecerá en tu página de bienvenida diaria.
                    </p>
                  </div>
                </div>

                {/* Direct Action: Open Welcome Page */}
                {onOpenWelcomeView && (
                  <div className="pt-3 border-t border-orange-200/50 dark:border-neutral-700/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      ¿Quieres ver cómo luce tu página de bienvenida completa?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenWelcomeView();
                      }}
                      className="px-4 py-2 rounded-xl bg-[#e8533a] hover:bg-[#d4432c] text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ver Página de Bienvenida</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 1. Nombre de usuario */}
              <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1a1c29] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-[#e8533a]" />
                      <span>Nombre de Usuario</span>
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      El nombre con el que te saludará la app cada día.
                    </p>
                  </div>

                  {user?.displayName && settings.userName !== user.displayName && (
                    <button
                      type="button"
                      onClick={() => onUpdateSettings({ userName: user.displayName || '' })}
                      className="text-xs text-[#e8533a] hover:underline font-semibold cursor-pointer shrink-0"
                    >
                      Usar nombre de Google
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={settings.userName || ''}
                    onChange={(e) => onUpdateSettings({ userName: e.target.value })}
                    placeholder="Escribe tu nombre (ej. Paco, María...)"
                    maxLength={35}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e8533a]"
                  />
                  {settings.userName && (
                    <button
                      type="button"
                      onClick={() => onUpdateSettings({ userName: '' })}
                      className="px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-xs font-medium cursor-pointer"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Fotografía o Avatar */}
              <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1a1c29] space-y-4 shadow-2xs">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#e8533a]" />
                    <span>Fotografía o Avatar</span>
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Sube una foto personal desde tu dispositivo o elige uno de los avatares prediseñados.
                  </p>
                </div>

                {/* Subir Fotografía Personal */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 text-xs font-bold shadow-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Foto Personal</span>
                  </button>

                  {user?.photoURL && (
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateSettings({
                          userAvatar: user.photoURL || '',
                          userAvatarType: 'upload',
                        });
                        sounds.playSuccessChime();
                      }}
                      className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2 cursor-pointer"
                    >
                      <img
                        src={user.photoURL}
                        alt="Google"
                        className="w-4 h-4 rounded-full"
                        referrerPolicy="no-referrer"
                      />
                      <span>Usar foto de Google</span>
                    </button>
                  )}

                  {settings.userAvatar && (
                    <button
                      type="button"
                      onClick={handleClearAvatar}
                      className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-neutral-500 hover:text-rose-600 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Restablecer</span>
                    </button>
                  )}
                </div>

                {/* Colección de Avatares Predefinidos */}
                <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    O elige un avatar temático con estilo:
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {PRESET_AVATARS.map((preset) => {
                      const isSelected =
                        settings.userAvatar === preset.id &&
                        settings.userAvatarType === 'preset';
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPresetAvatar(preset.id)}
                          className={`p-2 rounded-2xl flex flex-col items-center gap-1 transition-all cursor-pointer ${
                            isSelected
                              ? 'ring-2 ring-[#e8533a] bg-orange-50 dark:bg-orange-950/40 scale-105'
                              : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/80 opacity-80 hover:opacity-100'
                          }`}
                          title={preset.label}
                        >
                          <div
                            className={`w-10 h-10 rounded-full bg-gradient-to-tr ${preset.gradient} flex items-center justify-center text-lg shadow-xs`}
                          >
                            <span>{preset.emoji}</span>
                          </div>
                          <span className="text-[10px] text-neutral-600 dark:text-neutral-400 truncate max-w-full font-medium">
                            {preset.label.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Emojis Rápidos */}
                <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    O elige un emoji para tu perfil:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {EMOJI_OPTIONS.map((em) => {
                      const isSelected =
                        settings.userAvatar === em && settings.userAvatarType === 'emoji';
                      return (
                        <button
                          key={em}
                          type="button"
                          onClick={() => handleSelectEmojiAvatar(em)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-transform cursor-pointer ${
                            isSelected
                              ? 'ring-2 ring-[#e8533a] bg-orange-100 dark:bg-orange-950/60 scale-110 shadow-xs'
                              : 'bg-neutral-100 dark:bg-neutral-800 hover:scale-105'
                          }`}
                        >
                          <span>{em}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3. Opciones de Pantalla de Bienvenida */}
              <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1a1c29] flex items-center justify-between gap-4 shadow-2xs">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Mostrar bienvenida al abrir la app
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Inicia siempre mostrando tu página de bienvenida con tu saludo y la frase motivadora del día.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.showWelcomeOnStartup ?? true}
                    onChange={(e) => onUpdateSettings({ showWelcomeOnStartup: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e8533a]"></div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 1: PUSH NOTIFICATIONS */}
          {activeTab === 'push' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Web Push Subscription Service Hero Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-white dark:from-neutral-800/90 dark:via-neutral-800/60 dark:to-neutral-900 border border-orange-200/80 dark:border-neutral-700 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#e8533a] text-white shadow-xs">
                      <Radio className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <span>Servicio de Suscripción Web Push</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 font-bold border border-orange-200 dark:border-orange-800">
                          Web Push API
                        </span>
                      </h3>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                        Recordatorios diarios automáticos de tareas, resumen matutino y revisión nocturna con Service Worker.
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {activeSubscription ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Suscripción Activa
                      </span>
                    ) : permStatus === 'granted' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800 shadow-2xs">
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Permiso concedido
                      </span>
                    ) : permStatus === 'denied' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-2xs">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        {t('push.permDenied', currentLang)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-2xs">
                        <Info className="w-3.5 h-3.5 text-amber-600" />
                        No suscrito
                      </span>
                    )}
                  </div>
                </div>

                {/* Subscription Action & State */}
                {!isSupported ? (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                    ⚠️ {t('push.statusUnsupported', currentLang)}
                  </div>
                ) : (
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-orange-200/60 dark:border-neutral-700/60">
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">
                      {activeSubscription ? (
                        <p className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          Tu dispositivo está suscrito y listo para recibir recordatorios diarios de tareas.
                        </p>
                      ) : permStatus === 'denied' ? (
                        <p className="text-rose-600 dark:text-rose-400">
                          {t('push.deniedHelp', currentLang)}
                        </p>
                      ) : (
                        <p>
                          Activa el servicio Web Push para recibir notificaciones automáticas incluso con la pestaña en segundo plano.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {activeSubscription ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowSubscriptionDetails(!showSubscriptionDetails)}
                            className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Key className="w-3.5 h-3.5 text-neutral-500" />
                            <span>Detalles</span>
                            {showSubscriptionDetails ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={handleUnsubscribePushService}
                            disabled={isSubscribing}
                            className="px-3.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isSubscribing ? 'Procesando...' : 'Desuscribirse'}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSubscribePushService}
                          disabled={isSubscribing || permStatus === 'denied'}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#e8533a] hover:bg-[#d4432c] text-white text-xs font-bold shadow-md transition-all shrink-0 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Radio className="w-4 h-4" />
                          <span>{isSubscribing ? 'Suscribiendo...' : 'Suscribirse al Servicio Push'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Collapsible Subscription Technical Details Box */}
                {showSubscriptionDetails && activeSubscription && (
                  <div className="p-3.5 rounded-xl bg-neutral-900 text-neutral-200 text-xs font-mono space-y-2 border border-neutral-700">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                        Credenciales de la suscripción (VAPID / Web Push)
                      </span>
                      <button
                        type="button"
                        onClick={handleCopySubscription}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-sans font-medium transition-all cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedSub ? '¡Copiado!' : 'Copiar JSON'}</span>
                      </button>
                    </div>
                    <div className="space-y-1 overflow-x-auto text-[11px]">
                      <div>
                        <span className="text-amber-400">Endpoint:</span>{' '}
                        <span className="text-neutral-300 break-all">{activeSubscription.endpoint}</span>
                      </div>
                      <div>
                        <span className="text-emerald-400">Auth Key:</span>{' '}
                        <span className="text-neutral-300">{activeSubscription.keys?.auth}</span>
                      </div>
                      <div>
                        <span className="text-blue-400">p256dh Key:</span>{' '}
                        <span className="text-neutral-300 break-all">{activeSubscription.keys?.p256dh}</span>
                      </div>
                      {activeSubscription.createdAt && (
                        <div className="text-[10px] text-neutral-500 pt-1 border-t border-neutral-800">
                          Suscripción registrada: {new Date(activeSubscription.createdAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                      if (e.target.checked && !activeSubscription && permStatus !== 'granted') {
                        handleSubscribePushService();
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
                {/* 1. Task Reminders with Active Days Selector */}
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
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
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

                      <div className="flex items-center justify-between gap-4 flex-wrap pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
                        <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                          Días activos para recordatorios diarios:
                        </span>
                        <select
                          value={pushSettings.activeDays || 'all'}
                          onChange={(e) => updatePush({ activeDays: e.target.value as 'all' | 'weekdays' })}
                          className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200"
                        >
                          <option value="all">Todos los días (Lunes a Domingo)</option>
                          <option value="weekdays">Solo días laborables (Lunes a Viernes)</option>
                        </select>
                      </div>
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
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end bg-neutral-50/50 dark:bg-[#1a1c29]/50 shrink-0">
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
