// FILE: src/app/(tabs)/home.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import { supabase } from '../../../config/supabaseConfig';
import { checkAndUnlockBadges } from '../../../services/badgeService';
import { incrementSessionCounter, getMonthlyTotal } from '../../../services/sessionCounterService';

import ProgressBar from '../../../components/progressBar';
import ManualSlider from 'components/manualSlider';
import StepCounter from 'components/podo';
import { HeroAvatar } from 'components/HeaderAvatar';
import { useStreak } from '../../../hooks/useStreak';
import { StreakFlame } from '../../../components/StreakFlame';
import { LevelBadge } from '../../../components/LevelBadge';
import { getChallengeDetailsForDay, getDayOfYear } from '../../../constants/challengeDetails';
import { DailyChallengeModal } from '../../../components/DailyChallengeModal';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLevel } from '../../../contexts/LevelContext';
import { SessionTypeModal } from '../../../components/SessionTypeModal';
import { SportKey } from '../../../constantes/sport';

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
  const { addXP, level } = useLevel();

  const [userName, setUserName] = useState('');
  const [sessions, setSessions] = useState(0);
  const [target, setTarget] = useState(MONTHLY_TARGET_DEFAULT);
  const [progress, setProgress] = useState(0);
  const [monthKey, setMonthKey] = useState(monthKeyNow());
  const [userId, setUserId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [sessionTypeModalVisible, setSessionTypeModalVisible] = useState(false);
  
  const { streakDays = 0 } = useStreak(userId) || {};
  const { colors } = useTheme();

  useEffect(() => {
    setProgress(target > 0 ? Math.min(sessions / target, 1) : 0);
  }, [sessions, target]);

  // Vérifier si le défi du jour est déjà complété
  useEffect(() => {
    if (!userId) return;

    const checkChallengeCompleted = async () => {
      const dayOfYear = getDayOfYear();
      const currentYear = new Date().getFullYear();

      const { data, error } = await supabase
        .from('completed_challenges')
        .select('id')
        .eq('user_id', userId)
        .eq('day_of_year', dayOfYear)
        .eq('year', currentYear)
        .maybeSingle();

      if (!error && data) {
        setChallengeCompleted(true);
      } else {
        setChallengeCompleted(false);
      }
    };

    checkChallengeCompleted();
  }, [userId]);

  // Auth + init doc + reset mensuel + sync en live
  useEffect(() => {
    let realtimeChannel: any;

    const setupUser = async (userId: string, userEmail: string | undefined) => {
      const currentKey = monthKeyNow();
      
      // Mettre à jour le userId pour les hooks
      setUserId(userId);

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
        setUserId(null);
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
        setUserId(null);
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

  // Ouvrir le modal de sélection du type de séance
  const handleAddSession = () => {
    // Ouvrir la modal pour sélectionner le type de séance
    setSessionTypeModalVisible(true);
  };

  // Créer une séance avec le type sélectionné
  async function handleCreateSession(category: SportKey) {
    console.log('🚀 handleCreateSession: START with category:', category);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      Alert.alert('Session requise', 'Veuillez vous reconnecter.');
      return;
    }
    console.log('✅ User authenticated:', session.user.id);
    const currentKey = monthKeyNow();

    try {
      // Récupérer les données actuelles
      console.log('📊 Fetching user data...');
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching user:', fetchError);
        throw fetchError;
      }
      console.log('✅ User data fetched:', { monthly_sessions: userData?.monthly_sessions });

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
      console.log('💾 Updating monthly_sessions...');
      if (prevKey !== currentKey) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            month_key: currentKey,
            monthly_sessions: 1,
            monthly_target: tgt,
          })
          .eq('id', session.user.id);
        if (updateError) {
          console.error('❌ Error updating user (new month):', updateError);
          throw updateError;
        }
      } else {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            monthly_sessions: prev + 1,
          })
          .eq('id', session.user.id);
        if (updateError) {
          console.error('❌ Error updating user:', updateError);
          throw updateError;
        }
      }
      console.log('✅ monthly_sessions updated successfully');
      
      // Incrémenter le compteur pour ce type de séance
      console.log('💪 Incrementing session counter for category:', category);
      const newCount = await incrementSessionCounter(session.user.id, category);
      console.log(`✅ Counter incremented to ${newCount} for ${category}`);
      
      // Vérifier et débloquer les badges
      console.log('🏆 Checking for badge unlocks...');
      try {
        await checkAndUnlockBadges(session.user.id);
        console.log('✅ Badge check completed');
      } catch (badgeError) {
        console.error('❌ Error checking badges:', badgeError);
        // Ne pas bloquer si les badges échouent
      }
      
      // Enregistrer la date du jour dans streak_history (INSERT OR IGNORE grâce à UNIQUE)
      console.log('🔥 Inserting into streak_history...');
      const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
      console.log('📅 Today date:', today, 'User ID:', session.user.id);
      
      const { data: streakData, error: streakError } = await supabase
        .from('streak_history')
        .insert({ 
          user_id: session.user.id, 
          date: today 
        });
      
      if (streakError) {
        // Code 23505 = violation de contrainte UNIQUE (date déjà enregistrée aujourd'hui)
        if (streakError.code === '23505') {
          console.log('ℹ️ Date already recorded for today (expected behavior)');
        } else {
          console.error('❌ Streak history error:', JSON.stringify(streakError, null, 2));
          console.error('❌ Error details:', streakError.message, streakError.details, streakError.hint);
        }
        // Ne pas bloquer l'incrémentation si streak_history échoue
      } else {
        console.log('✅ Streak history inserted for date:', today);
        console.log('✅ Streak data returned:', streakData);
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

  // Compléter le défi du jour
  async function handleCompleteChallenge() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      Alert.alert('Session requise', 'Veuillez vous reconnecter.');
      return;
    }

    try {
      const dayOfYear = getDayOfYear();
      const challengeDetails = getChallengeDetailsForDay(dayOfYear);
      const challenge = challengeDetails?.titre || 'Défi du jour';
      const currentYear = new Date().getFullYear();

      const { error } = await supabase
        .from('completed_challenges')
        .insert({
          user_id: session.user.id,
          day_of_year: dayOfYear,
          year: currentYear,
          challenge_text: challenge,
        });

      if (error) {
        // Code 23505 = déjà complété (contrainte UNIQUE)
        if (error.code === '23505') {
          console.log('ℹ️ Défi déjà complété aujourd\'hui');
        } else {
          console.error('❌ Error completing challenge:', error);
          Alert.alert('Erreur', 'Impossible d\'enregistrer le défi');
          return;
        }
      } else {
        // Ajouter de l'XP pour le défi complété (20 XP par défaut)
        const xpResult = await addXP();
        if (xpResult?.leveledUp) {
          const newLevel = xpResult.oldLevel + 1;
          console.log(`🎊 Level Up! Niveau ${xpResult.oldLevel} → ${newLevel}`);
          Alert.alert(
            'Félicitations ! 🎊',
            `Tu as atteint le niveau ${newLevel} !\n+20 XP pour le défi complété`,
            [{ text: 'Super !' }]
          );
        } else {
          Alert.alert('Bravo ! 🎉', 'Défi relevé avec succès !\n+20 XP', [{ text: 'OK' }]);
        }
      }

      setChallengeCompleted(true);
      setModalVisible(false);
      console.log('✅ Défi complété:', challenge);
    } catch (e: any) {
      console.error('Error completing challenge:', e);
      Alert.alert('Erreur', e?.message ?? 'Impossible d\'enregistrer le défi');
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
    <ScrollView style={{ flex: 1, position: 'relative', backgroundColor: colors.background }}>
      {/* Bandeau */}
      <View>
        <LinearGradient
          colors={['#818cf8', '#4f46e5']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 168, zIndex: 0 }}
        />
      </View>

      {/* Avatar (hero) */}
      <HeroAvatar />
      
      {/* Streak Badge - Gauche */}
      <View className="absolute top-24 left-6">
        <StreakFlame streakDays={streakDays} size="medium" />
      </View>
      
      {/* Level Badge - Droite */}
      <View className="absolute top-24 right-6">
        <LevelBadge level={level} size="large" />
      </View>

      <View style={{ flex: 1, paddingTop: 48, paddingHorizontal: 24, backgroundColor: colors.background, marginTop: 192 }}>

        {/* Défi du jour */}
        <Pressable onPress={() => setModalVisible(true)} className="mt-6 rounded-xl shadow-lg overflow-hidden active:opacity-90">
          <LinearGradient
            colors={['#4f46e5', '#7c3aed']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ padding: 24 }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Ionicons name="trophy" size={24} color="#FFD700" />
                <Text className="text-lg font-bold text-white">Défi du jour</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9999 }}>
                <Text className="text-white font-semibold text-xs">Jour {getDayOfYear()}/365</Text>
              </View>
            </View>
            <Text className="text-2xl font-bold text-white text-center mb-2">
              {getChallengeDetailsForDay(getDayOfYear())?.titre || 'Défi du jour'}
            </Text>
            {challengeCompleted && (
              <View className="mt-3 py-2 bg-green-600 rounded-lg flex-row items-center justify-center gap-1">
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text className="text-white font-bold">Défi relevé !</Text>
              </View>
            )}
            {!challengeCompleted && (
              <View className="mt-3 py-2 bg-white/20 rounded-lg">
                <Text className="text-white font-semibold text-center">Toucher pour voir les détails →</Text>
              </View>
            )}
          </LinearGradient>
        </Pressable>

        <View className="flex-row mt-12 items-start">
          {/* Bloc Objectif de séance */}
          <View className="flex-1 flex-col items-center pr-4">
            <Text style={{ fontSize: 18, color: colors.indigo, textAlign: 'center' }}>Objectif de séance par mois</Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.indigo, marginBottom: 16, textAlign: 'center' }}>
              {sessions}/{target}
            </Text>
            <ProgressBar progress={progress} completed={completed} />

            <View className="flex-row gap-3 mt-4">
              <Pressable onPress={handleAddSession} className="px-5 py-3 rounded-xl bg-indigo-600 active:opacity-90">
                <Text className="text-white font-semibold">+1 séance</Text>
              </Pressable>
            </View>
          </View>

          {/* Séparateur vertical */}
          <View className="w-px bg-gray-300 self-stretch mx-2" />

          {/* StepCounter */}
          <View className="flex-1 pl-4">
            <StepCounter />
          </View>
        </View>

        <View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.indigo, marginTop: 24 }}>Tes dernières séances</Text>
          <ManualSlider />
        </View>
      </View>

      {/* Modal du défi */}
      <DailyChallengeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        challenge={getChallengeDetailsForDay(getDayOfYear())?.titre || 'Défi du jour'}
        dayOfYear={getDayOfYear()}
        onComplete={handleCompleteChallenge}
        isCompleted={challengeCompleted}
      />

      {/* Modal de sélection du type de séance */}
      <SessionTypeModal
        visible={sessionTypeModalVisible}
        onSelect={handleCreateSession}
        onClose={() => setSessionTypeModalVisible(false)}
      />
    </ScrollView>
  );
}
