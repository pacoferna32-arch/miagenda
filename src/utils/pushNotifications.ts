import { AppLanguage, PushNotificationSettings, WebPushSubscriptionData, Task } from '../types';
import { sounds } from './audio';
import { t } from './i18n';
import { db } from './firebase';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export type { WebPushSubscriptionData };
export type PushPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

/**
 * Standard VAPID Public Key for Web Push API subscription
 * (Uncompressed NIST P-256 public key, 65 bytes)
 */
export const DEFAULT_VAPID_PUBLIC_KEY =
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

/**
 * Convert a base64url string to a Uint8Array for PushManager subscription
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if the current browser and device environment supports Web Push and Notifications
 */
export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Get current browser notification permission status
 */
export function getNotificationPermissionStatus(): PushPermissionStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as PushPermissionStatus;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<PushPermissionStatus> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
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

/**
 * Retrieve existing active Web Push subscription from PushManager or local cache
 */
export async function getExistingPushSubscription(): Promise<WebPushSubscriptionData | null> {
  if (typeof window === 'undefined') return null;

  try {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const rawKey = sub.getKey ? sub.getKey('p256dh') : null;
        const key = rawKey
          ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(rawKey))))
          : '';
        const rawAuth = sub.getKey ? sub.getKey('auth') : null;
        const auth = rawAuth
          ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(rawAuth))))
          : '';

        const subData: WebPushSubscriptionData = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: key,
            auth: auth,
          },
          expirationTime: sub.expirationTime,
          userAgent: navigator.userAgent,
          createdAt: new Date().toISOString(),
        };

        localStorage.setItem('agenda_push_subscription', JSON.stringify(subData));
        return subData;
      }
    }
  } catch (err) {
    console.warn('Error reading PushManager subscription:', err);
  }

  // Fallback to local storage
  const cached = localStorage.getItem('agenda_push_subscription');
  if (cached) {
    try {
      return JSON.parse(cached) as WebPushSubscriptionData;
    } catch {
      localStorage.removeItem('agenda_push_subscription');
    }
  }

  return null;
}

/**
 * Subscribe browser to Web Push notifications service using standard VAPID public key
 * and synchronize with Firestore user document if user is authenticated.
 */
export async function subscribeToPushService(
  userId?: string,
  applicationServerKey: string = DEFAULT_VAPID_PUBLIC_KEY
): Promise<WebPushSubscriptionData | null> {
  if (!isPushNotificationSupported()) {
    throw new Error('Tu navegador o dispositivo no soporta la Web Push API.');
  }

  // 1. Ensure notification permission is granted
  let permission = getNotificationPermissionStatus();
  if (permission !== 'granted') {
    permission = await requestNotificationPermission();
  }
  if (permission !== 'granted') {
    return null;
  }

  // 2. Ensure Service Worker registration is ready
  let reg: ServiceWorkerRegistration;
  try {
    reg = await navigator.serviceWorker.ready;
  } catch {
    reg = await navigator.serviceWorker.register('/sw-push.js', { scope: '/' });
    await navigator.serviceWorker.ready;
  }

  // 3. Subscribe with PushManager
  const convertedVapidKey = urlBase64ToUint8Array(applicationServerKey);
  const pushSubscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedVapidKey as unknown as BufferSource,
  });

  const rawKey = pushSubscription.getKey ? pushSubscription.getKey('p256dh') : null;
  const keyStr = rawKey
    ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(rawKey))))
    : '';
  const rawAuth = pushSubscription.getKey ? pushSubscription.getKey('auth') : null;
  const authStr = rawAuth
    ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(rawAuth))))
    : '';

  const subData: WebPushSubscriptionData = {
    endpoint: pushSubscription.endpoint,
    keys: {
      p256dh: keyStr,
      auth: authStr,
    },
    expirationTime: pushSubscription.expirationTime,
    userAgent: navigator.userAgent,
    createdAt: new Date().toISOString(),
  };

  // Cache locally
  localStorage.setItem('agenda_push_subscription', JSON.stringify(subData));

  // 4. Save to Firestore under user's profile if authenticated
  if (userId && db) {
    try {
      // Create a deterministic subId from the endpoint tail to prevent duplicate entries
      const subId = btoa(pushSubscription.endpoint.slice(-32)).replace(/[^a-zA-Z0-9]/g, '');
      const subDocRef = doc(db, 'users', userId, 'pushSubscriptions', subId || 'default');
      await setDoc(
        subDocRef,
        {
          endpoint: subData.endpoint,
          keys: subData.keys,
          userAgent: subData.userAgent,
          createdAt: subData.createdAt,
          updatedAt: serverTimestamp(),
          active: true,
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Could not sync push subscription to Firestore:', err);
    }
  }

  return subData;
}

/**
 * Unsubscribe from Web Push service and remove credentials
 */
export async function unsubscribeFromPushService(userId?: string): Promise<boolean> {
  let unsubscribed = false;

  try {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        if (userId && db) {
          try {
            const subId = btoa(sub.endpoint.slice(-32)).replace(/[^a-zA-Z0-9]/g, '');
            const subDocRef = doc(db, 'users', userId, 'pushSubscriptions', subId || 'default');
            await deleteDoc(subDocRef);
          } catch (err) {
            console.warn('Could not delete push subscription from Firestore:', err);
          }
        }
        unsubscribed = await sub.unsubscribe();
      }
    }
  } catch (err) {
    console.warn('Error during push unsubscription:', err);
  }

  localStorage.removeItem('agenda_push_subscription');
  return unsubscribed || true;
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
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
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
    icon: options.icon || '/favicon.ico',
    badge: options.badge || '/favicon.ico',
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
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notificationOptions);
        return true;
      }
    } catch (e) {
      console.warn('Service worker showNotification fallback:', e);
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
      body: subtitleBody(dose, timeStr),
      tag: `med-reminder-${medName}-${timeStr}`,
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true,
    },
    pushSettings
  );
}

function subtitleBody(dose: string, timeStr: string): string {
  return `${dose} · ${timeStr}`;
}

/**
 * Send daily morning briefing push notification for scheduled tasks
 */
export async function sendDailyTaskBriefingPush(
  tasks: Task[],
  pushSettings?: PushNotificationSettings,
  lang: AppLanguage = 'es'
): Promise<boolean> {
  if (pushSettings && !pushSettings.dailyDigestEnabled) return false;

  const count = tasks.length;
  const title = `🌅 ${t('push.dailyDigest', lang)}`;
  let body = '';

  if (count === 0) {
    body = 'Hoy no tienes tareas pendientes registradas en tu agenda. ¡Excelente día para planificar!';
  } else if (count === 1) {
    body = `Hoy tienes 1 tarea pendiente: "${tasks[0].t}". ¡A por ella!`;
  } else {
    const previewList = tasks.slice(0, 3).map((t) => t.t).join(', ');
    body = `Tienes ${count} tareas para hoy (${previewList}${count > 3 ? '...' : ''}). ¡Revisa tu agenda!`;
  }

  return sendWebPushNotification(
    title,
    {
      body,
      tag: 'daily-task-morning-briefing',
      vibrate: [200, 150, 200],
    },
    pushSettings
  );
}

/**
 * Send daily evening review push notification for pending tasks
 */
export async function sendDailyTaskEveningReviewPush(
  pendingTasks: Task[],
  pushSettings?: PushNotificationSettings,
  lang: AppLanguage = 'es'
): Promise<boolean> {
  if (pushSettings && !pushSettings.eveningReviewEnabled) return false;

  const count = pendingTasks.length;
  const title = `🌙 ${t('push.eveningReview', lang)}`;
  let body = '';

  if (count === 0) {
    body = '¡Enhorabuena! Has completado todas tus tareas de hoy. Momento perfecto para relajarte.';
  } else {
    body = `Te quedan ${count} tarea${count > 1 ? 's' : ''} pendiente${count > 1 ? 's' : ''} hoy. Revisa tu agenda para reorganizarlas para mañana.`;
  }

  return sendWebPushNotification(
    title,
    {
      body,
      tag: 'daily-task-evening-review',
      vibrate: [200, 100, 200],
    },
    pushSettings
  );
}

/**
 * Send general daily digest push notification
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
  const body =
    pendingHabitsCount > 0
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
