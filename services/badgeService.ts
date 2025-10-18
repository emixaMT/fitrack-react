// FILE: services/badgeService.ts
import { supabase } from '../config/supabaseConfig';
import { BADGE_IMAGES } from '../constantes/badgeImages';
import { getTotalHistoricalSessions, getTotalByType } from './sessionCounterService';

// ===================================
// TYPES
// ===================================

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type BadgeCategory = 'workout' | 'consistency' | 'performance' | 'special' | 'workout_type';

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  image_url: string | null; // URL de l'image personnalisée (externe ou Supabase Storage)
  image_local?: any; // Image locale (require('path/to/image.png'))
  category: BadgeCategory | null;
  rarity: BadgeRarity;
  condition_type: string | null;
  condition_value: number | null;
  points: number;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  unlocked_at: string;
  progress: number;
  is_new: boolean;
  badge?: Badge; // Badge complet (via join)
}

export interface BadgeStats {
  total_badges: number;
  total_points: number;
  common_badges: number;
  rare_badges: number;
  epic_badges: number;
  legendary_badges: number;
}

// ===================================
// RÉCUPÉRATION DES BADGES
// ===================================

/**
 * Récupère tous les badges disponibles
 */
export const getAllBadges = async (): Promise<Badge[]> => {
  try {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('rarity', { ascending: true })
      .order('points', { ascending: true });

    if (error) throw error;
    
    // Mapper les images locales aux badges
    return (data || []).map(badge => ({
      ...badge,
      image_local: BADGE_IMAGES[badge.code] || null,
    }));
  } catch (error) {
    console.error('Error fetching badges:', error);
    throw error;
  }
};

/**
 * Récupère les badges débloqués par un utilisateur
 */
export const getUserBadges = async (userId: string): Promise<UserBadge[]> => {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) throw error;
    
    // Mapper les images locales aux badges
    return (data || []).map(userBadge => ({
      ...userBadge,
      badge: userBadge.badge ? {
        ...userBadge.badge,
        image_local: BADGE_IMAGES[userBadge.badge.code] || null,
      } : undefined,
    }));
  } catch (error) {
    console.error('Error fetching user badges:', error);
    throw error;
  }
};

/**
 * Récupère les nouveaux badges (is_new = true)
 */
export const getNewBadges = async (userId: string): Promise<UserBadge[]> => {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', userId)
      .eq('is_new', true)
      .order('unlocked_at', { ascending: false });

    if (error) throw error;
    
    // Mapper les images locales aux badges
    return (data || []).map(userBadge => ({
      ...userBadge,
      badge: userBadge.badge ? {
        ...userBadge.badge,
        image_local: BADGE_IMAGES[userBadge.badge.code] || null,
      } : undefined,
    }));
  } catch (error) {
    console.error('Error fetching new badges:', error);
    throw error;
  }
};

/**
 * Récupère les statistiques des badges d'un utilisateur
 */
export const getUserBadgeStats = async (userId: string): Promise<BadgeStats | null> => {
  try {
    const badges = await getUserBadges(userId);
    
    const stats: BadgeStats = {
      total_badges: badges.length,
      total_points: 0,
      common_badges: 0,
      rare_badges: 0,
      epic_badges: 0,
      legendary_badges: 0,
    };

    badges.forEach((userBadge) => {
      if (userBadge.badge) {
        stats.total_points += userBadge.badge.points;
        
        switch (userBadge.badge.rarity) {
          case 'common':
            stats.common_badges++;
            break;
          case 'rare':
            stats.rare_badges++;
            break;
          case 'epic':
            stats.epic_badges++;
            break;
          case 'legendary':
            stats.legendary_badges++;
            break;
        }
      }
    });

    return stats;
  } catch (error) {
    console.error('Error fetching badge stats:', error);
    return null;
  }
};

// ===================================
// DÉBLOCAGE DES BADGES
// ===================================

/**
 * Débloque un badge pour un utilisateur
 */
export const unlockBadge = async (userId: string, badgeCode: string): Promise<UserBadge | null> => {
  try {
    // Récupérer l'ID du badge
    const { data: badge, error: badgeError } = await supabase
      .from('badges')
      .select('id')
      .eq('code', badgeCode)
      .single();

    if (badgeError || !badge) {
      console.error('Badge not found:', badgeCode);
      return null;
    }

    // Insérer le badge pour l'utilisateur
    const { data, error } = await supabase
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_id: badge.id,
        is_new: true,
      })
      .select(`
        *,
        badge:badges(*)
      `)
      .single();

    if (error) {
      // Si le badge existe déjà (contrainte unique), on ignore l'erreur
      if (error.code === '23505') {
        console.log('Badge already unlocked:', badgeCode);
        return null;
      }
      throw error;
    }

    console.log('Badge unlocked:', badgeCode);
    
    // Mapper l'image locale au badge
    if (data && data.badge) {
      return {
        ...data,
        badge: {
          ...data.badge,
          image_local: BADGE_IMAGES[data.badge.code] || null,
        },
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error unlocking badge:', error);
    throw error;
  }
};

/**
 * Marque un badge comme vu (is_new = false)
 */
export const markBadgeAsSeen = async (userBadgeId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_badges')
      .update({ is_new: false })
      .eq('id', userBadgeId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking badge as seen:', error);
    throw error;
  }
};

/**
 * Marque tous les nouveaux badges comme vus
 */
export const markAllBadgesAsSeen = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_badges')
      .update({ is_new: false })
      .eq('user_id', userId)
      .eq('is_new', true);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking all badges as seen:', error);
    throw error;
  }
};

// ===================================
// FONCTIONS HELPER POUR LES CONDITIONS
// ===================================

/**
 * Vérifie si l'utilisateur a un streak de jours consécutifs
 */
const checkConsecutiveDays = async (seances: any[], requiredDays: number): Promise<boolean> => {
  if (!seances || seances.length === 0) return false;

  // Grouper les séances par date (YYYY-MM-DD)
  const dateMap = new Map<string, boolean>();
  seances.forEach(seance => {
    const date = new Date(seance.created_at);
    const dateKey = date.toISOString().split('T')[0];
    dateMap.set(dateKey, true);
  });

  // Convertir en tableau trié
  const uniqueDates = Array.from(dateMap.keys()).sort();
  
  // Vérifier les jours consécutifs
  let maxStreak = 0;
  let currentStreak = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i - 1]);
    const currDate = new Date(uniqueDates[i]);
    const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak >= requiredDays;
};

/**
 * Vérifie si l'utilisateur a atteint son objectif mensuel ce mois-ci
 */
const checkMonthlyGoal = async (userId: string): Promise<boolean> => {
  try {
    // Récupérer l'objectif mensuel de l'utilisateur
    const { data: user } = await supabase
      .from('users')
      .select('monthly_target')
      .eq('id', userId)
      .single();

    if (!user || !user.monthly_target) return false;

    const monthlyGoal = user.monthly_target;

    // Compter les séances du mois actuel
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data: seances } = await supabase
      .from('seances')
      .select('*')
      .eq('id_user', userId)
      .gte('created_at', firstDayOfMonth.toISOString())
      .lte('created_at', lastDayOfMonth.toISOString());

    const seanceCount = seances?.length || 0;
    return seanceCount >= monthlyGoal;
  } catch (error) {
    console.error('Error checking monthly goal:', error);
    return false;
  }
};

/**
 * Vérifie si l'utilisateur a atteint son objectif mensuel pendant N mois consécutifs
 */
const checkConsecutiveMonthlyGoals = async (userId: string, requiredMonths: number): Promise<boolean> => {
  try {
    // Récupérer l'objectif mensuel
    const { data: user } = await supabase
      .from('users')
      .select('monthly_target')
      .eq('id', userId)
      .single();

    if (!user || !user.monthly_target) return false;

    const monthlyGoal = user.monthly_target;
    const now = new Date();
    let consecutiveMonths = 0;

    // Vérifier les N derniers mois
    for (let i = 0; i < requiredMonths + 3; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const { data: seances } = await supabase
        .from('seances')
        .select('*')
        .eq('id_user', userId)
        .gte('created_at', firstDay.toISOString())
        .lte('created_at', lastDay.toISOString());

      const seanceCount = seances?.length || 0;
      
      if (seanceCount >= monthlyGoal) {
        consecutiveMonths++;
        if (consecutiveMonths >= requiredMonths) {
          return true;
        }
      } else {
        // Réinitialiser si un mois n'atteint pas l'objectif
        consecutiveMonths = 0;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking consecutive monthly goals:', error);
    return false;
  }
};

// ===================================
// VÉRIFICATION AUTOMATIQUE DES BADGES
// ===================================

/**
 * Vérifie et débloque automatiquement les badges basés sur les critères
 */
export const checkAndUnlockBadges = async (userId: string): Promise<UserBadge[]> => {
  const unlockedBadges: UserBadge[] = [];

  try {
    console.log('[Badge] 📊 Chargement des données utilisateur...');
    
    // Récupérer le total historique des séances depuis les compteurs
    const seanceCount = await getTotalHistoricalSessions(userId);

    const { data: notes } = await supabase
      .from('notes')
      .select('*')
      .eq('id_user', userId);

    const { data: weights } = await supabase
      .from('weight_entries')
      .select('*')
      .eq('user_id', userId);

    const { data: performance } = await supabase
      .from('performances')
      .select('*')
      .eq('user_id', userId)
      .single();

    const noteCount = notes?.length || 0;
    const weightCount = weights?.length || 0;

    console.log(`[Badge] ✅ Données chargées: ${seanceCount} séances (compteurs), ${noteCount} notes, ${weightCount} poids`);

    // Badge: Premier Pas (première séance)
    if (seanceCount >= 1) {
      const badge = await unlockBadge(userId, 'first_workout');
      if (badge) unlockedBadges.push(badge);
    }

    // Badge: 10 séances
    if (seanceCount >= 10) {
      const badge = await unlockBadge(userId, 'workout_10');
      if (badge) unlockedBadges.push(badge);
    }

    // Badge: 50 séances
    if (seanceCount >= 50) {
      const badge = await unlockBadge(userId, 'workout_50');
      if (badge) unlockedBadges.push(badge);
    }

    // Badge: 100 séances
    if (seanceCount >= 100) {
      const badge = await unlockBadge(userId, 'workout_100');
      if (badge) unlockedBadges.push(badge);
    }

    // Badge: 250 séances
    if (seanceCount >= 250) {
      const badge = await unlockBadge(userId, 'workout_250');
      if (badge) unlockedBadges.push(badge);
    }

    // Badge: Archiviste (première note)
    if (noteCount >= 1) {
      const badge = await unlockBadge(userId, 'note_taker');
      if (badge) unlockedBadges.push(badge);
    }

    // Badge: Maître des Notes (50 notes)
    if (noteCount >= 50) {
      const badge = await unlockBadge(userId, 'note_master');
      if (badge) unlockedBadges.push(badge);
    }

    // Badge: Suivi du Poids (10 entrées)
    if (weightCount >= 10) {
      const badge = await unlockBadge(userId, 'weight_tracker');
      if (badge) unlockedBadges.push(badge);
    }

    // Badges de performance
    if (performance) {
      if (performance.squat >= 100) {
        const badge = await unlockBadge(userId, 'heavy_lifter');
        if (badge) unlockedBadges.push(badge);
      }

      if (performance.bench >= 100) {
        const badge = await unlockBadge(userId, 'bench_king');
        if (badge) unlockedBadges.push(badge);
      }

      if (performance.deadlift >= 150) {
        const badge = await unlockBadge(userId, 'deadlift_beast');
        if (badge) unlockedBadges.push(badge);
      }
    }

    // Badges par type de séance - Regroupés par catégorie cohérente
    
    // Badge "Force" : Musculation + CrossFit (disciplines de force)
    const musculationTotal = await getTotalByType(userId, 'musculation');
    const crossfitTotal = await getTotalByType(userId, 'crossfit');
    const strengthCount = musculationTotal + crossfitTotal;
    
    if (strengthCount >= 20) {
      const badge = await unlockBadge(userId, 'strength_warrior');
      if (badge) unlockedBadges.push(badge);
    }
    
    if (strengthCount >= 50) {
      const badge = await unlockBadge(userId, 'strength_master');
      if (badge) unlockedBadges.push(badge);
    }

    // Badge "Endurance" : Running + Vélo (disciplines d'endurance)
    const runningTotal = await getTotalByType(userId, 'running');
    const veloTotal = await getTotalByType(userId, 'velo');
    const enduranceCount = runningTotal + veloTotal;
    
    if (enduranceCount >= 20) {
      const badge = await unlockBadge(userId, 'endurance_runner');
      if (badge) unlockedBadges.push(badge);
    }
    
    if (enduranceCount >= 50) {
      const badge = await unlockBadge(userId, 'endurance_beast');
      if (badge) unlockedBadges.push(badge);
    }

    // Badge "Polyvalent" : Au moins 10 séances de chaque type
    if (musculationTotal >= 10 && crossfitTotal >= 10 && 
        runningTotal >= 10 && veloTotal >= 10) {
      const badge = await unlockBadge(userId, 'versatile_athlete');
      if (badge) unlockedBadges.push(badge);
    }

    // Badge: Lève-Tôt (séance avant 8h du matin)
    // Note: Ce badge nécessite la table seances pour vérifier l'heure
    const { data: seancesForEarlyBird } = await supabase
      .from('seances')
      .select('created_at')
      .eq('id_user', userId);
    
    const earlyBirdSeance = seancesForEarlyBird?.find(s => {
      const seanceDate = new Date(s.created_at);
      return seanceDate.getHours() < 8;
    });
    if (earlyBirdSeance) {
      const badge = await unlockBadge(userId, 'early_bird');
      if (badge) unlockedBadges.push(badge);
    }

    console.log('[Badge] 🔍 Vérification des streaks...');
    // Les streaks sont maintenant gérés via streak_history, pas via les séances
    // On utilise la table streak_history pour vérifier les streaks
    const { data: streakHistory } = await supabase
      .from('streak_history')
      .select('date')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (streakHistory && streakHistory.length >= 7) {
      const badge = await unlockBadge(userId, 'streak_7');
      if (badge) unlockedBadges.push(badge);
    }
    
    if (streakHistory && streakHistory.length >= 30) {
      const badge = await unlockBadge(userId, 'streak_30');
      if (badge) unlockedBadges.push(badge);
    }

    console.log('[Badge] 🎯 Vérification des objectifs mensuels...');
    // Badge: Objectif Mensuel (vérifier si l'utilisateur a atteint son objectif ce mois-ci)
    const monthlyGoalReached = await checkMonthlyGoal(userId);
    if (monthlyGoalReached) {
      const badge = await unlockBadge(userId, 'monthly_goal');
      if (badge) unlockedBadges.push(badge);
    }

    console.log('[Badge] 🏆 Vérification des objectifs consécutifs...');
    // Badge: Triple Champion (3 mois consécutifs d'objectif atteint)
    const threeMonthsGoal = await checkConsecutiveMonthlyGoals(userId, 3);
    if (threeMonthsGoal) {
      const badge = await unlockBadge(userId, 'monthly_goal_3');
      if (badge) unlockedBadges.push(badge);
    }

    console.log(`[Badge] ✅ Vérification terminée: ${unlockedBadges.length} nouveau(x) badge(s)`);
    return unlockedBadges;
  } catch (error) {
    console.error('Error checking badges:', error);
    return unlockedBadges;
  }
};

// ===================================
// SUBSCRIPTION EN TEMPS RÉEL
// ===================================

/**
 * S'abonne aux changements de badges d'un utilisateur
 */
export const subscribeToUserBadges = (
  userId: string,
  callback: (payload: any) => void
) => {
  const subscription = supabase
    .channel(`user_badges:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_badges',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

// ===================================
// UTILITAIRES
// ===================================

/**
 * Obtient la couleur associée à une rareté
 */
export const getRarityColor = (rarity: BadgeRarity): string => {
  switch (rarity) {
    case 'common':
      return '#9CA3AF'; // gray-400
    case 'rare':
      return '#3B82F6'; // blue-500
    case 'epic':
      return '#A855F7'; // purple-500
    case 'legendary':
      return '#F59E0B'; // amber-500
    default:
      return '#9CA3AF';
  }
};

/**
 * Obtient le label en français de la rareté
 */
export const getRarityLabel = (rarity: BadgeRarity): string => {
  switch (rarity) {
    case 'common':
      return 'Commun';
    case 'rare':
      return 'Rare';
    case 'epic':
      return 'Épique';
    case 'legendary':
      return 'Légendaire';
    default:
      return 'Commun';
  }
};

/**
 * Vérifie si un utilisateur possède un badge spécifique
 */
export const hasBadge = async (userId: string, badgeCode: string): Promise<boolean> => {
  try {
    const { data: badge } = await supabase
      .from('badges')
      .select('id')
      .eq('code', badgeCode)
      .single();

    if (!badge) return false;

    const { data, error } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_id', badge.id)
      .single();

    return !error && !!data;
  } catch (error) {
    return false;
  }
};
