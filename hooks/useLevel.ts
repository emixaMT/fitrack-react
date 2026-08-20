import { useEffect, useState } from 'react';
import { supabase } from '../config/supabaseConfig';
import {
  UserLevel,
  getUserLevel,
  getLevelDisplayInfo,
  addXP as addXPService,
} from '../services/levelService';

interface UseLevelReturn {
  userLevel: UserLevel | null;
  level: number;
  currentXP: number;
  xpRequired: number;
  progressPercentage: number;
  totalXP: number;
  loading: boolean;
  addXP: (xpAmount?: number) => Promise<{ leveledUp: boolean; oldLevel: number } | null>;
  refreshLevel: () => Promise<void>;
}

/**
 * Hook pour gérer le système de niveau d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Informations et fonctions pour gérer le niveau
 */
export function useLevel(userId: string | null): UseLevelReturn {
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [loading, setLoading] = useState(true);

  // Fonction pour charger le niveau
  const loadLevel = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const level = await getUserLevel(userId);
      setUserLevel(level);
    } catch (error) {
      console.error('Error loading user level:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger le niveau au montage et lors du changement d'utilisateur
  useEffect(() => {
    loadLevel();
  }, [userId]);

  // S'abonner aux changements en temps réel
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user-level-${userId}`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_levels',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            if (payload.new) {
              setUserLevel(payload.new as UserLevel);
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  // Fonction pour ajouter de l'XP
  const addXP = async (xpAmount?: number) => {
    if (!userId) return null;

    try {
      const result = await addXPService(userId, xpAmount);
      if (result) {
        // Mise à jour immédiate locale
        setUserLevel(result.userLevel);
        return {
          leveledUp: result.leveledUp,
          oldLevel: result.oldLevel,
        };
      }
      return null;
    } catch (error) {
      console.error('Error adding XP:', error);
      return null;
    }
  };

  // Fonction pour rafraîchir manuellement le niveau
  const refreshLevel = async () => {
    await loadLevel();
  };

  // Calculer les informations d'affichage
  const displayInfo = getLevelDisplayInfo(userLevel);

  return {
    userLevel,
    level: displayInfo.level,
    currentXP: displayInfo.currentXP,
    xpRequired: displayInfo.xpRequired,
    progressPercentage: displayInfo.progressPercentage,
    totalXP: displayInfo.totalXP,
    loading,
    addXP,
    refreshLevel,
  };
}
