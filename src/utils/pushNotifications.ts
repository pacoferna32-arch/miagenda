import { AppLanguage, PushNotificationSettings } from '../types';
import { sounds } from './audio';
import { t } from './i18n';

export type PushPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

/**
 * Check if the current browser and device environment supports Web Push and Notifications
 */
export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window;
}

/**
 * Get current browser notification permission status
 */
export function getNotificationPermissionStatus(): PushPermissionStatus {
  if (!isPushNotificationSupported()) return 'unsupported';
  return Notification.permission as PushPermissionStatus;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<PushPermissionStatus> {
  if (!isPushNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission as PushPermissionStatus;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return Notification.permission as PushPermissionStatus;
  }
}

/**
 * Check if the current moment falls within the user's Quiet Hours / Do Not Disturb
 */
export function isInQuietHours(settings?: PushNotificationSettings): boolean {
  if (!settings || !settings.quietHoursEnabled) return false;
  try {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = (settings.quietHoursStart || '23:00').split(':').map(Number);
    const [endH, endM] = (settings.quietHoursEnd || '07:00').split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes > endMinutes) {
      // Overnight range, e.g. 23:00 to 07:00
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    } else {
      // Same day range, e.g. 14:00 to 16:00
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
  } catch {
    return false;
  }
}

export interface WebPushOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  vibrate?: number[];
  requireInteraction?: boolean;
  silent?: boolean;
}

/**
 * Send a Web Push notification using Service Worker registration if available,
 * with native Notification API fallback.
 */
export async function sendWebPushNotification(
  title: string,
  options: WebPushOptions = {},
  pushSettings?: PushNotificationSettings
): Promise<boolean> {
  if (!isPushNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  // Check Quiet Hours
  if (pushSettings && isInQuietHours(pushSettings)) {
    console.log('Push notification suppressed due to Quiet Hours (Do Not Disturb)');
    return false;
  }

  // Play audio chime if sound is enabled
  if (!pushSettings || pushSettings.soundEnabled !== false) {
    try {
      sounds.playAlarmChime();
    } catch {}
  }

  const notificationOptions: NotificationOptions = {
    body: options.body || '',
    icon: options.icon || '/pwa-192x192.png',
    badge: options.badge || '/icon.svg',
    tag: options.tag || 'calendar-app-notification',
    data: options.data || { url: window.location.href },
    requireInteraction: options.requireInteraction ?? false,
    silent: options.silent ?? false,
  };

  // Vibrate pattern if enabled
  if (pushSettings?.vibrate && 'vibrate' in navigator) {
    try {
      navigator.vibrate(options.vibrate || [200, 100, 200]);
    } catch {}
  }

  // Attempt Service Worker registration notification first (best for PWA & mobile background)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notificationOptions);
        return true;
      }
    } catch (e) {
      console.warn('Service worker showNotification failed, using Notification fallback:', e);
    }
  }

  // Fallback to standard window.Notification constructor
  try {
    const notif = new Notification(title, notificationOptions);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch (err) {
    console.error('Failed to trigger window.Notification:', err);
    return false;
  }
}

/**
 * Trigger an interactive test push notification
 */
export async function sendTestPushNotification(
  pushSettings?: PushNotificationSettings,
  lang: AppLanguage = 'es'
): Promise<boolean> {
  const perm = getNotificationPermissionStatus();
  if (perm !== 'granted') {
    const newPerm = await requestNotificationPermission();
    if (newPerm !== 'granted') return false;
  }

  const title = t('push.testTitle', lang);
  const body = t('push.testBody', lang);

  return sendWebPushNotification(
    title,
    {
      body,
      tag: 'test-push-notification',
      vibrate: [250, 120, 250],
      requireInteraction: false,
    },
    pushSettings
  );
}

/**
 * Send customized task reminder push notification
 */
export async function sendTaskReminderPush(
  taskTitle: string,
  timeStr: string,
  notes?: string,
  pushSettings?: PushNotificationSettings,
  lang: AppLanguage = 'es'
): Promise<boolean> {
  if (pushSettings && !pushSettings.taskRemindersEnabled) return false;

  const title = `🔔 ${taskTitle}`;
  const subtitle = `${timeStr} · ${notes || t('cat.recordatorios', lang)}`;

  return sendWebPushNotification(
    title,
    {
      body: subtitle,
      tag: `task-reminder-${taskTitle}-${timeStr}`,
      vibrate: [300, 100, 300],
      requireInteraction: true,
    },
    pushSettings
  );
}

/**
 * Send customized medication reminder push notification
 */
export async function sendMedicationReminderPush(
  medName: string,
  dose: string,
  timeStr: string,
  pushSettings?: PushNotificationSettings,
  lang: AppLanguage = 'es'
): Promise<boolean> {
  if (pushSettings && !pushSettings.medicationRemindersEnabled) return false;

  const title = `💊 ${t('nav.medication', lang)}: ${medName}`;
  const body = `${dose} · ${timeStr}`;

  return sendWebPushNotification(
    title,
    {
      body,
      tag: `med-reminder-${medName}-${timeStr}`,
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true,
    },
    pushSettings
  );
}

/**
 * Send daily morning digest push notification
 */
export async function sendDailyDigestPush(
  tasksCount: number,
  medsCount: number,
  pushSettings?: PushNotificationSettings,
  lang: AppLanguage = 'es'
): Promise<boolean> {
  if (pushSettings && !pushSettings.dailyDigestEnabled) return false;

  const title = `🌅 ${t('push.dailyDigest', lang)}`;
  const body = `${tasksCount} tareas programadas y ${medsCount} tomas de medicación hoy. ¡Que tengas un excelente día!`;

  return sendWebPushNotification(
    title,
    {
      body,
      tag: 'daily-morning-digest',
      vibrate: [200, 150, 200],
    },
    pushSettings
  );
}

/**
 * Send evening habit review push notification
 */
export async function sendEveningReviewPush(
  pendingHabitsCount: number,
  pushSettings?: PushNotificationSettings,
  lang: AppLanguage = 'es'
): Promise<boolean> {
  if (pushSettings && !pushSettings.eveningReviewEnabled) return false;

  const title = `🌙 ${t('push.eveningReview', lang)}`;
  const body = pendingHabitsCount > 0
    ? `Tienes ${pendingHabitsCount} hábitos pendientes de completar hoy. ¡Tómate un momento para registrarlos y reflexionar!`
    : '¡Has completado todos tus hábitos de hoy! Registra tus pensamientos en el Diario Personal.';

  return sendWebPushNotification(
    title,
    {
      body,
      tag: 'evening-habit-review',
      vibrate: [200, 100, 200],
    },
    pushSettings
  );
}
