import { useEffect, useState } from 'react';
import { supabase } from '../config/supabaseConfig';
import { Badge } from '../services/badgeService';

interface UserBadge {
  id: string;
  badge_id: string;
  is_new: boolean;
  unlocked_at: string;
  badge?: Badge;
}

/**
 * Hook pour gérer les notifications de badges débloqués
 * Écoute les nouveaux badges en temps réel et retourne le badge à afficher
 */
export const useBadgeUnlockNotification = (userId: string | null) => {
  const [badgeToShow, setBadgeToShow] = useState<Badge | null>(null);
  const [queue, setQueue] = useState<Badge[]>([]);

  useEffect(() => {
    if (!userId) return;

    // Charger les badges non vus au démarrage
    const loadNewBadges = async () => {
      const { data } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('user_id', userId)
        .eq('is_new', true)
        .order('unlocked_at', { ascending: true });

      if (data && data.length > 0) {
        const badges = data
          .map((ub: any) => ub.badge)
          .filter((b: any) => b !== null) as Badge[];
        
        if (badges.length > 0) {
          setQueue(badges);
          setBadgeToShow(badges[0]);
        }
      }
    };

    loadNewBadges();

    // Écouter les nouveaux badges en temps réel
    const subscription = supabase
      .channel(`badge_unlocks:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_badges',
          filter: `user_id=eq.${userId}`,
        },
        async (payload: any) => {
          // Récupérer les détails du badge
          const { data: userBadge } = await supabase
            .from('user_badges')
            .select(`
              *,
              badge:badges(*)
            `)
            .eq('id', payload.new.id)
            .single();

          if (userBadge?.badge) {
            setQueue((prev) => [...prev, userBadge.badge]);
            
            // Si aucun badge n'est affiché, afficher celui-ci
            if (!badgeToShow) {
              setBadgeToShow(userBadge.badge);
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, badgeToShow]);

  const dismissCurrentBadge = async () => {
    if (!badgeToShow || !userId) return;

    // Marquer le badge comme vu
    await supabase
      .from('user_badges')
      .update({ is_new: false })
      .eq('user_id', userId)
      .eq('badge_id', badgeToShow.id);

    // Retirer de la queue et afficher le suivant
    const newQueue = queue.slice(1);
    setQueue(newQueue);
    setBadgeToShow(newQueue.length > 0 ? newQueue[0] : null);
  };

  return {
    badge: badgeToShow,
    dismissBadge: dismissCurrentBadge,
    hasPendingBadges: queue.length > 0,
    pendingCount: queue.length,
  };
};
