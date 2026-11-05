import React, { useEffect, useState } from 'react';
import { Task, Medication, UserSettings, Habit } from '../types';
import { sounds } from '../utils/audio';
import { toIsoDate } from '../utils/constants';
import { t } from '../utils/i18n';
import {
  sendTaskReminderPush,
  sendMedicationReminderPush,
  sendDailyDigestPush,
  sendEveningReviewPush,
  isInQuietHours,
} from '../utils/pushNotifications';
import { Bell, Check, Clock, X, Pill } from 'lucide-react';

interface ActiveAlert {
  id: string; // unique alert key
  type: 'task' | 'medication';
  title: string;
  subtitle: string;
  targetId: number;
  timeStr: string;
}

interface ToastAlarmsProps {
  tasks: Task[];
  medications: Medication[];
  habits?: Habit[];
  settings: UserSettings;
  onCompleteTask: (id: number) => void;
  onCompleteMedication: (id: number) => void;
  onSnoozeTask: (id: number, minutes: number) => void;
  onSnoozeMedication: (id: number, minutes: number) => void;
  onDismissAlert: (id: number, type: 'task' | 'medication') => void;
}

export const ToastAlarms: React.FC<ToastAlarmsProps> = ({
  tasks,
  medications,
  habits = [],
  settings,
  onCompleteTask,
  onCompleteMedication,
  onSnoozeTask,
  onSnoozeMedication,
  onDismissAlert,
}) => {
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);
  const currentLang = settings.language || 'es';
  const pushSettings = settings.pushNotifications;

  useEffect(() => {
    // Check for alarms every 10 seconds
    const interval = setInterval(() => {
      const now = new Date();
      const todayStr = toIsoDate(now);
      const nowMs = now.getTime();
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Check Quiet Hours
      const inQuiet = isInQuietHours(pushSettings);

      // 1. Check tasks
      tasks.forEach((tTask) => {
        if (tTask.done || tTask.fired) return;
        if (tTask.snooze && nowMs < tTask.snooze) return;

        // Determine lead minutes: task explicit alarm or user push settings default
        const leadMin = tTask.alarm !== null && tTask.alarm !== undefined
          ? tTask.alarm
          : (pushSettings?.taskReminderLeadMinutes ?? 10);

        const dueTime = new Date(`${tTask.d}T${tTask.h}:00`).getTime();
        const alertTime = tTask.snooze ? 0 : dueTime - leadMin * 60 * 1000;

        // If time reached and within reasonable window (past 3 hours)
        if (nowMs >= alertTime && nowMs <= dueTime + 3 * 3600 * 1000) {
          const alertKey = `task-${tTask.id}-${tTask.d}-${tTask.h}`;
          setActiveAlerts((prev) => {
            if (prev.some((a) => a.id === alertKey)) return prev;

            if (settings.enableSound && !inQuiet) {
              sounds.playAlarmChime();
            }

            // Web Push notification
            if (pushSettings?.enabled && pushSettings.taskRemindersEnabled) {
              sendTaskReminderPush(
                tTask.t,
                tTask.h,
                tTask.n,
                pushSettings,
                currentLang
              );
            }

            return [
              ...prev,
              {
                id: alertKey,
                type: 'task',
                title: tTask.t,
                subtitle: `${tTask.h} · ${tTask.n || t('cat.recordatorios', currentLang)}`,
                targetId: tTask.id,
                timeStr: tTask.h,
              },
            ];
          });
        }
      });

      // 2. Check medications
      medications.forEach((m) => {
        if (!m.on || m.taken[todayStr] || m.alerted[todayStr]) return;
        if (m.snooze && nowMs < m.snooze) return;

        // Lead time: medication lead or push settings lead
        const leadMin = m.lead !== undefined && m.lead !== null
          ? m.lead
          : (pushSettings?.medicationReminderLeadMinutes ?? 5);

        const dueTime = new Date(`${todayStr}T${m.h}:00`).getTime();
        const alertTime = m.snooze ? 0 : dueTime - leadMin * 60 * 1000;

        if (nowMs >= alertTime && nowMs <= dueTime + 3 * 3600 * 1000) {
          const alertKey = `med-${m.id}-${todayStr}-${m.h}`;
          setActiveAlerts((prev) => {
            if (prev.some((a) => a.id === alertKey)) return prev;

            if (settings.enableSound && !inQuiet) {
              sounds.playAlarmChime();
            }

            // Web Push notification
            if (pushSettings?.enabled && pushSettings.medicationRemindersEnabled) {
              sendMedicationReminderPush(
                m.n,
                m.dose,
                m.h,
                pushSettings,
                currentLang
              );
            }

            return [
              ...prev,
              {
                id: alertKey,
                type: 'medication',
                title: `${t('nav.medication', currentLang)}: ${m.n}`,
                subtitle: `${m.dose} · ${m.h}`,
                targetId: m.id,
                timeStr: m.h,
              },
            ];
          });
        }
      });

      // 3. Daily Morning Digest check
      if (
        pushSettings?.enabled &&
        pushSettings?.dailyDigestEnabled &&
        pushSettings.dailyDigestTime === currentHHMM
      ) {
        const digestKey = `digest-${todayStr}`;
        if (!sessionStorage.getItem(digestKey)) {
          sessionStorage.setItem(digestKey, 'sent');
          const todayTasks = tasks.filter((t) => t.d === todayStr && !t.done);
          const activeMeds = medications.filter((m) => m.on);
          sendDailyDigestPush(todayTasks.length, activeMeds.length, pushSettings, currentLang);
        }
      }

      // 4. Evening Habit Review check
      if (
        pushSettings?.enabled &&
        pushSettings?.eveningReviewEnabled &&
        pushSettings.eveningReviewTime === currentHHMM
      ) {
        const eveningKey = `evening-${todayStr}`;
        if (!sessionStorage.getItem(eveningKey)) {
          sessionStorage.setItem(eveningKey, 'sent');
          const uncompletedHabits = habits.filter((h) => !h.archived && !h.history[todayStr]);
          sendEveningReviewPush(uncompletedHabits.length, pushSettings, currentLang);
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [tasks, medications, habits, settings, pushSettings, currentLang]);

  if (activeAlerts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-md px-4 pointer-events-none">
      {activeAlerts.map((alert) => (
        <div
          key={alert.id}
          className="pointer-events-auto bg-[#1a1c29] text-white dark:bg-white dark:text-[#1a1c29] rounded-2xl p-3.5 shadow-2xl border border-neutral-700 dark:border-neutral-200 flex items-start gap-3 animate-in slide-in-from-top-4 duration-200"
        >
          <div className="p-2 rounded-xl bg-[#e8533a] text-white shrink-0 mt-0.5">
            {alert.type === 'task' ? <Bell className="w-4 h-4 animate-bounce" /> : <Pill className="w-4 h-4 animate-bounce" />}
          </div>

          <div className="flex-1 min-w-0">
            <b className="text-xs font-semibold block truncate">{alert.title}</b>
            <p className="text-[11px] opacity-80 truncate">{alert.subtitle}</p>

            <div className="flex items-center gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => {
                  if (alert.type === 'task') {
                    onCompleteTask(alert.targetId);
                  } else {
                    onCompleteMedication(alert.targetId);
                  }
                  setActiveAlerts((prev) => prev.filter((a) => a.id !== alert.id));
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition-colors"
              >
                <Check className="w-3 h-3" />
                <span>{t('common.done', currentLang)}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (alert.type === 'task') {
                    onSnoozeTask(alert.targetId, 10);
                  } else {
                    onSnoozeMedication(alert.targetId, 10);
                  }
                  setActiveAlerts((prev) => prev.filter((a) => a.id !== alert.id));
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-700/80 dark:bg-neutral-200 text-white dark:text-neutral-900 text-[11px] font-medium hover:opacity-90 transition-opacity"
              >
                <Clock className="w-3 h-3" />
                <span>+10 min</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onDismissAlert(alert.targetId, alert.type);
                  setActiveAlerts((prev) => prev.filter((a) => a.id !== alert.id));
                }}
                className="ml-auto p-1 text-neutral-400 hover:text-white dark:hover:text-neutral-900"
                title="Descartar aviso"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
