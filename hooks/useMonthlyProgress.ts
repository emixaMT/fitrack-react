import { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../config/supabaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { incrementSessionCounter } from '../services/sessionCounterService';
import { checkAndUnlockBadges } from '../services/badgeService';
import { SportKey } from '../constantes/sport';
import { cancelGoalReminders } from './useGoalReminders';

const MONTHLY_TARGET_DEFAULT = 10;

export const monthKeyNow = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export interface MonthlyProgress {
  userName: string;
  sessions: number;
  target: number;
  progress: number;
  monthKey: string;
  completed: boolean;
  handleCreateSession: (category: SportKey) => Promise<void>;
}

export function useMonthlyProgress(): MonthlyProgress {
  const { user } = useAuth();
  const [userName, setUserName] = useState('');
  const [sessions, setSessions] = useState(0);
  const [target, setTarget] = useState(MONTHLY_TARGET_DEFAULT);
  const [monthKey, setMonthKey] = useState(monthKeyNow());

  // Auth + init doc + reset mensuel + sync en live
  useEffect(() => {
    if (!user) return;
    let realtimeChannel: any;

    const setupUser = async (userId: string, userEmail: string | undefined) => {
      const currentKey = monthKeyNow();

      // Récupérer ou créer l'utilisateur
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') return;

      if (!existingUser) {
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

    setupUser(user.id, user.email);

    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [user?.id]);

  const completed = sessions >= target;
  const progress = target > 0 ? Math.min(sessions / target, 1) : 0;

  const handleCreateSession = useCallback(async (category: SportKey) => {
    if (!user) {
      Alert.alert('Session requise', 'Veuillez vous reconnecter.');
      return;
    }
    const currentKey = monthKeyNow();

    try {
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const prevKey = userData?.month_key;
      const prev = userData?.monthly_sessions ?? 0;
      const tgt = userData?.monthly_target ?? MONTHLY_TARGET_DEFAULT;

      // Optimistic update
      if (prevKey !== currentKey) {
        setSessions(1);
        setMonthKey(currentKey);
      } else {
        setSessions(prev + 1);
      }

      // Mettre à jour dans la base
      if (prevKey !== currentKey) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            month_key: currentKey,
            monthly_sessions: 1,
            monthly_target: tgt,
          })
          .eq('id', user.id);
        if (updateError) throw updateError;
      } else {
        const { error: updateError } = await supabase
          .from('users')
          .update({ monthly_sessions: prev + 1 })
          .eq('id', user.id);
        if (updateError) throw updateError;
      }

      // Incrémenter le compteur par type
      await incrementSessionCounter(user.id, category);

      // Vérifier les badges (non bloquant)
      try {
        await checkAndUnlockBadges(user.id);
      } catch {}

      // Enregistrer dans streak_history (IGNORE si déjà présent via UNIQUE)
      const today = new Date().toISOString().split('T')[0];
      const { error: streakError } = await supabase
        .from('streak_history')
        .insert({ user_id: user.id, date: today });

      // 23505 = déjà enregistré aujourd'hui (comportement attendu)
      if (streakError && streakError.code !== '23505') {
        if (__DEV__) console.warn('Streak history error:', streakError.message);
      }
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? "Impossible d'incrémenter l'objectif.");
      // Recharger en cas d'erreur
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      if (userData) {
        setSessions(userData.monthly_sessions ?? 0);
        setMonthKey(userData.month_key ?? currentKey);
      }
    }
  }, [user]);

  return {
    userName,
    sessions,
    target,
    progress,
    monthKey,
    completed,
    handleCreateSession,
  };
}
