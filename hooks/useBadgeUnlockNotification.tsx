import { useEffect, useState } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../config/supabaseConfig';
import { Badge } from '../services/badgeService';
import { logError } from '../utils/logger';

interface UserBadge {
  id: string;
  badge_id: string;
  is_new: boolean;
  unlocked_at: string;
  badge?: Badge;
}

interface UserBadgeRow {
  id: string;
  badge_id: string;
  is_new: boolean;
  unlocked_at: string;
  badge?: Badge | null;
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
          .map((ub: UserBadgeRow) => ub.badge)
          .filter((b): b is Badge => b !== null);
        
        if (badges.length > 0) {
          setQueue(badges);
          setBadgeToShow(badges[0]);
        }
      }
    };

    loadNewBadges();

    // Écouter les nouveaux badges en temps réel
    // Wrap dans try/catch pour éviter le crash si la table n'est pas dans le realtime publication
    let subscription: ReturnType<typeof supabase.channel> | null = null;
    try {
      subscription = supabase
        .channel(`badge_unlocks:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_badges',
            filter: `user_id=eq.${userId}`,
          },
          async (payload: RealtimePostgresChangesPayload<{ id: string }>) => {
            // Récupérer les détails du badge
            const { data: userBadge } = await supabase
              .from('user_badges')
              .select(`
                *,
                badge:badges(*)
              `)
              .eq('id', (payload.new as { id: string }).id)
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
    } catch (e) {
      logError('Badge unlock notification realtime subscription failed:', e);
    }

    return () => {
      if (subscription) subscription.unsubscribe();
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
