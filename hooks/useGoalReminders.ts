import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const GOAL_TAG = 'goal-3d';

interface ScheduledNotificationWithTag {
  identifier: string;
  content: { data?: { tag?: string } };
}

async function ensurePermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const cur = await Notifications.getPermissionsAsync();
  let ok = cur.status === Notifications.PermissionStatus.GRANTED;
  if (!ok) {
    const req = await Notifications.requestPermissionsAsync();
    ok = req.status === Notifications.PermissionStatus.GRANTED;
  }
  if (!ok) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('goal-reminders', {
      name: 'Goal Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      showBadge: false,
      vibrationPattern: [200, 200],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    });
  }
  return true;
}

async function cancelGoalReminders() {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      all
        .filter(n => (n as ScheduledNotificationWithTag)?.content?.data?.tag === GOAL_TAG)
        .map(n => Notifications.cancelScheduledNotificationAsync((n as ScheduledNotificationWithTag).identifier))
    );
  } catch {}
}

async function hasGoalReminder(): Promise<boolean> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    return all.some(n => (n as ScheduledNotificationWithTag)?.content?.data?.tag === GOAL_TAG);
  } catch {
    return false;
  }
}

async function scheduleGoalReminder() {
  const ok = await ensurePermissions();
  if (!ok) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Objectif séances',
      body: "Tu n'as pas encore atteint ton objectif mensuel. Une séance aujourd'hui ?",
      sound: 'default',
      data: { tag: GOAL_TAG },
    },
    trigger: {
      seconds: 60 * 60 * 24 * 3, // 72h
      repeats: true,
      channelId: Platform.OS === 'android' ? 'goal-reminders' : undefined,
    },
  });
}

/**
 * Gère les rappels de notification 72h quand l'objectif mensuel n'est pas atteint.
 * @param completed - true si l'objectif est atteint (annule les rappels)
 * @param monthKey - clé du mois courant (re-planifie si changement)
 */
export function useGoalReminders(completed: boolean, monthKey: string) {
  // Annule les rappels dès que l'objectif est atteint
  useEffect(() => {
    if (completed) {
      cancelGoalReminders().catch(() => void 0);
    }
  }, [completed]);

  // Planifie si nécessaire (dédoublonnage via tag)
  useEffect(() => {
    (async () => {
      if (completed) return;
      const exists = await hasGoalReminder();
      if (!exists) await scheduleGoalReminder();
    })().catch(() => void 0);
  }, [completed, monthKey]);
}

export { cancelGoalReminders };
