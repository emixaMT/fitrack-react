import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Params = {
  uid: string;
  monthKey: string;   // ex: "2025-09"
  sessions: number;
  target: number;
};

const STORAGE_KEY = (uid: string) => `notif/goal/current/${uid}`; // Why: suivre id + monthKey

// iOS nécessite l'autorisation; Android → channel recommandé
async function ensurePermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const settings = await Notifications.getPermissionsAsync();
  let granted = settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.granted || req.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  }
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
  return granted;
}

async function readCurrent(uid: string): Promise<{ id: string; monthKey: string } | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY(uid));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

async function writeCurrent(uid: string, rec: { id: string; monthKey: string } | null) {
  if (!rec) { await AsyncStorage.removeItem(STORAGE_KEY(uid)); return; }
  await AsyncStorage.setItem(STORAGE_KEY(uid), JSON.stringify(rec));
}

export async function cancelGoalReminder(uid: string) {
  const cur = await readCurrent(uid);
  if (cur?.id) {
    try { await Notifications.cancelScheduledNotificationAsync(cur.id); } catch {}
  }
  await writeCurrent(uid, null);
}

/** Planifie/annule automatiquement en fonction du progrès et du mois. */
export async function scheduleOrCancelGoalReminder(p: Params) {
  const { uid, monthKey, sessions, target } = p;

  // objectif atteint → on annule si besoin
  if (sessions >= target) {
    await cancelGoalReminder(uid);
    return;
  }

  // permissions
  const ok = await ensurePermissions();
  if (!ok) return;

  // état courant
  const cur = await readCurrent(uid);

  // Mois changé → annuler ancien
  if (cur && cur.monthKey !== monthKey) {
    try { await Notifications.cancelScheduledNotificationAsync(cur.id); } catch {}
    await writeCurrent(uid, null);
  }

  // Si déjà planifié pour ce mois → ne rien faire
  const still = await readCurrent(uid);
  if (still && still.monthKey === monthKey) return;

  // Planifier une notification locale toutes les 72h (≈ 3 jours)
  // Why: simple, offline, sans backend; iOS/Android peuvent lisser le timing.
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Objectif séances",
      body: "Tu n’as pas encore atteint ton objectif mensuel. Une séance aujourd’hui ?",
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.DEFAULT,
    },
    trigger: {
      seconds: 60, // 72h
      repeats: true,
      channelId: Platform.OS === 'android' ? 'goal-reminders' : undefined,
    },
  });

  await writeCurrent(uid, { id, monthKey });
}