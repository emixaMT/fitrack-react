import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabaseConfig';
import {
  UserLevel,
  getUserLevel,
  getLevelDisplayInfo,
  addXP as addXPService,
} from '../services/levelService';

interface LevelContextType {
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

const LevelContext = createContext<LevelContextType | undefined>(undefined);

export const LevelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Récupérer l'ID utilisateur
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
        setUserLevel(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fonction pour charger le niveau
  const loadLevel = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const level = await getUserLevel(userId);
      setUserLevel(level);
      console.log('🔄 Level loaded:', level);
    } catch (error) {
      console.error('Error loading user level:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger le niveau quand l'utilisateur change
  useEffect(() => {
    if (userId) {
      console.log('🔄 Loading level for user:', userId);
      loadLevel();
    }
  }, [userId]);

  // S'abonner aux changements en temps réel
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user-level-global-${userId}`, {
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
          console.log('⭐ Level changed (Realtime Global):', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            if (payload.new) {
              setUserLevel(payload.new as UserLevel);
              console.log('✅ Level updated globally:', payload.new);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('🔌 Global Realtime subscription status:', status);
      });

    return () => {
      console.log('🔌 Unsubscribing from global level channel');
      channel.unsubscribe();
    };
  }, [userId]);

  // Fonction pour ajouter de l'XP
  const addXP = async (xpAmount?: number) => {
    if (!userId) return null;

    try {
      const result = await addXPService(userId, xpAmount);
      if (result) {
        // Mise à jour immédiate locale pour tous les composants
        setUserLevel(result.userLevel);
        console.log('💪 XP added globally:', {
          level: result.userLevel.level,
          currentXP: result.userLevel.current_xp,
          totalXP: result.userLevel.total_xp,
          leveledUp: result.leveledUp,
        });
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

  return (
    <LevelContext.Provider
      value={{
        userLevel,
        level: displayInfo.level,
        currentXP: displayInfo.currentXP,
        xpRequired: displayInfo.xpRequired,
        progressPercentage: displayInfo.progressPercentage,
        totalXP: displayInfo.totalXP,
        loading,
        addXP,
        refreshLevel,
      }}
    >
      {children}
    </LevelContext.Provider>
  );
};

export const useLevel = () => {
  const context = useContext(LevelContext);
  if (!context) {
    throw new Error('useLevel doit être utilisé dans un LevelProvider');
  }
  return context;
};
