// FILE: src/app/(tabs)/home.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import { auth, db } from '../../../config/firebaseConfig';
import { doc, getDoc, onSnapshot, runTransaction, setDoc } from 'firebase/firestore';

import ProgressBar from '../../../components/progressBar';
import ManualSlider from 'components/manualSlider';
import StepCounter from 'components/podo';
import { HeroAvatar } from 'components/HeaderAvatar';

// ---------- Notifs: utils ----------
const GOAL_TAG = 'goal-3d';

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

// Annule toutes les notifs marquées goal-3d
async function cancelGoalReminders() {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      all
        .filter(n => (n as any)?.content?.data?.tag === GOAL_TAG)
        .map(n => Notifications.cancelScheduledNotificationAsync((n as any).identifier))
    );
  } catch {}
}

// Vérifie s'il existe déjà un rappel "goal-3d" planifié
async function hasGoalReminder() {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    return all.some(n => (n as any)?.content?.data?.tag === GOAL_TAG);
  } catch {
    return false;
  }
}

// Planifie une notif répétée 72h si objectif non atteint
async function scheduleGoalReminder() {
  const ok = await ensurePermissions();
  if (!ok) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Objectif séances',
      body: "Tu n’as pas encore atteint ton objectif mensuel. Une séance aujourd’hui ?",
      sound: 'default',
      data: { tag: GOAL_TAG },
    },
    trigger: {
      seconds: 60 * 60 * 24 * 3, // 72h
      repeats: true,             // iOS: OK (>= 60s)
      channelId: Platform.OS === 'android' ? 'goal-reminders' : undefined,
    },
  });
}

// ---------- Home ----------
const MONTHLY_TARGET_DEFAULT = 10;
const monthKeyNow = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function HomeScreen() {
  const router = useRouter();

  const [userName, setUserName] = useState('');
  const [sessions, setSessions] = useState(0);
  const [target, setTarget] = useState(MONTHLY_TARGET_DEFAULT);
  const [progress, setProgress] = useState(0);
  const [monthKey, setMonthKey] = useState(monthKeyNow());

  useEffect(() => {
    setProgress(target > 0 ? Math.min(sessions / target, 1) : 0);
  }, [sessions, target]);

  // Auth + init doc + reset mensuel + sync en live
  useEffect(() => {
    let unsubUserDoc: undefined | (() => void);

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        await cancelGoalReminders().catch(() => void 0);
        setUserName('');
        setSessions(0);
        setTarget(MONTHLY_TARGET_DEFAULT);
        setProgress(0);
        router.replace('/');
        return;
      }

      const uref = doc(db, 'Users', user.uid);
      const currentKey = monthKeyNow();

      const snap = await getDoc(uref);
      if (!snap.exists()) {
        await setDoc(
          uref,
          {
            name: user.displayName ?? user.email?.split('@')[0] ?? '',
            monthlySessions: 0,
            monthlyTarget: MONTHLY_TARGET_DEFAULT,
            monthKey: currentKey,
          },
          { merge: true }
        );
      } else {
        const data = snap.data() as any;
        if (data?.monthKey !== currentKey) {
          await setDoc(
            uref,
            {
              monthKey: currentKey,
              monthlySessions: 0,
              monthlyTarget:
                typeof data?.monthlyTarget === 'number' ? data.monthlyTarget : MONTHLY_TARGET_DEFAULT,
            },
            { merge: true }
          );
          // Mois changé → stop anciennes notifs
          await cancelGoalReminders().catch(() => void 0);
        }
      }

      // Live sync
      unsubUserDoc = onSnapshot(uref, (ds) => {
        const d = (ds.data() as any) ?? {};
        setUserName(
          (typeof d?.name === 'string' && d.name) ||
            user.displayName ||
            user.email?.split('@')[0] ||
            ''
        );
        setSessions(typeof d?.monthlySessions === 'number' ? d.monthlySessions : 0);
        setTarget(typeof d?.monthlyTarget === 'number' ? d.monthlyTarget : MONTHLY_TARGET_DEFAULT);
        setMonthKey(typeof d?.monthKey === 'string' ? d.monthKey : monthKeyNow());
      });
    });

    return () => {
      unsubAuth();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, [router]);

  // ✅ Arrêt immédiat des rappels dès que l’objectif est atteint
  const completed = sessions >= target;
  useEffect(() => {
    if (!auth.currentUser) return;
    if (completed) {
      cancelGoalReminders().catch(() => void 0);
    }
  }, [completed]);

  // Planifie si nécessaire; ne replanifie pas à chaque +1 (dédoublonnage via tag)
  useEffect(() => {
    (async () => {
      if (!auth.currentUser) return;
      if (completed) return;
      const exists = await hasGoalReminder();
      if (!exists) await scheduleGoalReminder();
    })().catch(() => void 0);
  }, [completed, monthKey]);

  // +1 séance (persistant + reset auto)
  async function handleAddSession() {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Session requise', 'Veuillez vous reconnecter.');
      return;
    }
    const uref = doc(db, 'Users', user.uid);
    const currentKey = monthKeyNow();

    try {
      await runTransaction(db, async (trx) => {
        const snap = await trx.get(uref);
        const d = (snap.data() as any) ?? {};
        const prevKey = d?.monthKey;
        const prev = typeof d?.monthlySessions === 'number' ? d.monthlySessions : 0;
        const tgt = typeof d?.monthlyTarget === 'number' ? d.monthlyTarget : MONTHLY_TARGET_DEFAULT;

        if (prevKey !== currentKey) {
          trx.set(uref, { monthKey: currentKey, monthlySessions: 1, monthlyTarget: tgt }, { merge: true });
        } else {
          trx.set(uref, { monthlySessions: prev + 1 }, { merge: true });
        }
      });
      // Si la cible est atteinte, l'effet [completed] arrêtera les rappels
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? "Impossible d'incrémenter l'objectif.");
    }
  }

  // Bouton test: planifie une notif dans 1s
  async function testNotification() {
    const ok = await ensurePermissions();
    if (!ok) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Notification de test',
        body: 'Ceci est une notification locale.',
        sound: 'default',
        data: { tag: GOAL_TAG },
      },
      trigger: {
        seconds: 1,
        channelId: Platform.OS === 'android' ? 'goal-reminders' : undefined,
      },
    });
  }

  return (
    <ScrollView className="flex h-full relative bg-white">
      {/* Bandeau */}
      <View>
        <LinearGradient
          colors={['#818cf8', '#4f46e5']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200, zIndex: 0 }}
        />
      </View>

      {/* Avatar (hero) */}
      <HeroAvatar />

      <View className="flex h-full flex-1 pt-12 px-6 bg-white mt-48">
        <Text className="text-xl font-semibold text-indigo-700 mb-2 text-center">
          Bonjour !
        </Text>

        <Pressable
          onPress={() => router.push('/seances/create/step1')}
          className="mt-6 py-6 px-6 bg-indigo-600 rounded-lg shadow-lg flex flex-row items-center justify-center gap-2"
        >
          <Ionicons name="stopwatch-outline" size={46} color="white" />
          <Text className="text-2xl font-bold text-center text-white">Créer une séance</Text>
        </Pressable>

        <View className="flex flex-col items-center justify-center mt-12">
          <Text className="text-lg text-indigo-600">Objectifs de séance dans le mois</Text>
          <Text className="text-2xl font-bold text-indigo-600 mb-4">
            {sessions}/{target}
          </Text>
          <ProgressBar progress={progress} completed={completed} />

          <View className="flex-row gap-3 mt-4">
            <Pressable onPress={handleAddSession} className="px-5 py-3 rounded-xl bg-indigo-600 active:opacity-90">
              <Text className="text-white font-semibold">+1 séance</Text>
            </Pressable>

          </View>
        </View>

        <StepCounter />

        <View>
          <Text className="text-2xl font-bold text-indigo-600 mt-6">Tes dernières séances</Text>
          <ManualSlider />
        </View>
      </View>
    </ScrollView>
  );
}
