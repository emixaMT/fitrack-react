import { useEffect, useState } from 'react';
import { supabase } from '../config/supabaseConfig';

/**
 * Hook pour calculer la streak (jours consécutifs d'incrémentation de monthly_sessions)
 * La streak est basée sur l'historique des dates où l'utilisateur a incrémenté son compteur.
 * Cela évite le spam de séances le même jour et garantit un comptage fiable.
 */
export const useStreak = (userId: string | null) => {
  const [streakDays, setStreakDays] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const calculateStreak = async () => {
      try {
        // Récupérer l'historique des dates d'incrémentation
        const { data: streakHistory, error } = await supabase
          .from('streak_history')
          .select('date')
          .eq('user_id', userId)
          .order('date', { ascending: false });

        if (error) throw error;

        if (!streakHistory || streakHistory.length === 0) {
          setStreakDays(0);
          setLoading(false);
          return;
        }

        // Les dates sont déjà uniques grâce à la contrainte UNIQUE(user_id, date)
        const sortedDates = streakHistory.map((entry) => entry.date).sort().reverse();

        // Calculer la streak
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let currentDate = new Date(today);

        for (const dateString of sortedDates) {
          const seanceDate = new Date(dateString);
          seanceDate.setHours(0, 0, 0, 0);

          // Calculer la différence en jours
          const diffTime = currentDate.getTime() - seanceDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          // Si c'est aujourd'hui ou hier, continuer la streak
          if (diffDays === 0 || diffDays === 1) {
            streak++;
            currentDate = new Date(seanceDate);
            currentDate.setDate(currentDate.getDate() - 1); // Passer au jour précédent attendu
          } else if (diffDays > 1) {
            // Streak cassée
            break;
          }
        }

        setStreakDays(streak);
      } catch (error) {
        console.error('Error calculating streak:', error);
        setStreakDays(0);
      } finally {
        setLoading(false);
      }
    };

    calculateStreak();

    // S'abonner aux changements de streak_history pour mettre à jour la streak
    const channel = supabase
      .channel(`streak-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'streak_history',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔥 Streak Realtime update:', payload.eventType);
          calculateStreak();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  return { streakDays, loading };
};
