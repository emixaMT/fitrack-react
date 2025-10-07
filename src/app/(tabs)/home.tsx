// FILE: src/app/(tabs)/home.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import { supabase } from '../../../config/supabaseConfig';

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
    let realtimeChannel: any;

    const setupUser = async (userId: string, userEmail: string | undefined) => {
      const currentKey = monthKeyNow();

      // Récupérer ou créer l'utilisateur
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching user:', fetchError);
        return;
      }

      if (!existingUser) {
        // Créer un nouveau profil utilisateur
        await supabase.from('users').insert({
          id: userId,
          name: userEmail?.split('@')[0] ?? '',
          monthly_sessions: 0,
          monthly_target: MONTHLY_TARGET_DEFAULT,
          month_key: currentKey,
        });
      } else {
        // Vérifier si le mois a changé
        if (existingUser.month_key !== currentKey) {
          await supabase
            .from('users')
            .update({
              month_key: currentKey,
              monthly_sessions: 0,
              monthly_target: existingUser.monthly_target ?? MONTHLY_TARGET_DEFAULT,
            })
            .eq('id', userId);
          await cancelGoalReminders().catch(() => void 0);
        }
      }

      // Charger les données initiales
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userData) {
        setUserName(userData.name || userEmail?.split('@')[0] || '');
        setSessions(userData.monthly_sessions ?? 0);
        setTarget(userData.monthly_target ?? MONTHLY_TARGET_DEFAULT);
        setMonthKey(userData.month_key ?? monthKeyNow());
      }

      // Souscrire aux changements en temps réel
      realtimeChannel = supabase
        .channel(`user-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${userId}`,
          },
          (payload) => {
            const d = payload.new as any;
            setUserName(d?.name || userEmail?.split('@')[0] || '');
            setSessions(d?.monthly_sessions ?? 0);
            setTarget(d?.monthly_target ?? MONTHLY_TARGET_DEFAULT);
            setMonthKey(d?.month_key ?? monthKeyNow());
          }
        )
        .subscribe();
    };

    // Écouter les changements d'authentification
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setupUser(session.user.id, session.user.email);
      } else {
        cancelGoalReminders().catch(() => void 0);
        setUserName('');
        setSessions(0);
        setTarget(MONTHLY_TARGET_DEFAULT);
        setProgress(0);
        router.replace('/');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setupUser(session.user.id, session.user.email);
      } else {
        cancelGoalReminders().catch(() => void 0);
        setUserName('');
        setSessions(0);
        setTarget(MONTHLY_TARGET_DEFAULT);
        setProgress(0);
        router.replace('/');
      }
    });

    return () => {
      subscription.unsubscribe();
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [router]);

  // ✅ Arrêt immédiat des rappels dès que l'objectif est atteint
  const completed = sessions >= target;
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      if (completed) {
        cancelGoalReminders().catch(() => void 0);
      }
    });
  }, [completed]);

  // Planifie si nécessaire; ne replanifie pas à chaque +1 (dédoublonnage via tag)
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      if (completed) return;
      const exists = await hasGoalReminder();
      if (!exists) await scheduleGoalReminder();
    })().catch(() => void 0);
  }, [completed, monthKey]);

  // +1 séance (persistant + reset auto)
  async function handleAddSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      Alert.alert('Session requise', 'Veuillez vous reconnecter.');
      return;
    }
    const currentKey = monthKeyNow();

    try {
      // Récupérer les données actuelles
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (fetchError) throw fetchError;

      const prevKey = userData?.month_key;
      const prev = userData?.monthly_sessions ?? 0;
      const tgt = userData?.monthly_target ?? MONTHLY_TARGET_DEFAULT;

      // Optimistic update : mise à jour immédiate de l'UI
      if (prevKey !== currentKey) {
        setSessions(1);
        setMonthKey(currentKey);
      } else {
        setSessions(prev + 1);
      }

      // Mettre à jour dans la base
      if (prevKey !== currentKey) {
        await supabase
          .from('users')
          .update({
            month_key: currentKey,
            monthly_sessions: 1,
            monthly_target: tgt,
          })
          .eq('id', session.user.id);
      } else {
        await supabase
          .from('users')
          .update({
            monthly_sessions: prev + 1,
          })
          .eq('id', session.user.id);
      }
      // Si la cible est atteinte, l'effet [completed] arrêtera les rappels
    } catch (e: any) {
      console.error("Add session error:", e);
      Alert.alert('Erreur', e?.message ?? "Impossible d'incrémenter l'objectif.");
      // Recharger en cas d'erreur
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (userData) {
        setSessions(userData.monthly_sessions ?? 0);
        setMonthKey(userData.month_key ?? currentKey);
      }
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
