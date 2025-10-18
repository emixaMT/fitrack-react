// FILE: services/sessionCounterService.ts
import { supabase } from '../config/supabaseConfig';
import { SportKey } from '../constantes/sport';

export interface SessionCounter {
  id: string;
  user_id: string;
  month_key: string;
  sport_type: SportKey;
  count: number;
  created_at: string;
  updated_at: string;
}

export interface MonthlyStats {
  musculation: number;
  crossfit: number;
  running: number;
  velo: number;
  total: number;
}

/**
 * Obtient la clé du mois actuel au format YYYY-MM
 */
export const getCurrentMonthKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Incrémente le compteur pour un type de séance
 */
export const incrementSessionCounter = async (
  userId: string,
  sportType: SportKey
): Promise<number> => {
  try {
    const monthKey = getCurrentMonthKey();

    // Utiliser la fonction PostgreSQL pour incrémenter atomiquement
    const { data, error } = await supabase.rpc('increment_session_counter', {
      p_user_id: userId,
      p_month_key: monthKey,
      p_sport_type: sportType,
    });

    if (error) {
      console.error('Error incrementing session counter:', error);
      throw error;
    }

    console.log(`✅ Session counter incremented for ${sportType}: ${data}`);
    return data as number;
  } catch (error) {
    console.error('Error in incrementSessionCounter:', error);
    throw error;
  }
};

/**
 * Récupère les compteurs du mois actuel pour un utilisateur
 */
export const getMonthlyCounters = async (
  userId: string,
  monthKey?: string
): Promise<SessionCounter[]> => {
  try {
    const targetMonth = monthKey || getCurrentMonthKey();

    const { data, error } = await supabase
      .from('session_counters')
      .select('*')
      .eq('user_id', userId)
      .eq('month_key', targetMonth);

    if (error) {
      console.error('Error fetching monthly counters:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getMonthlyCounters:', error);
    return [];
  }
};

/**
 * Récupère les statistiques du mois pour un utilisateur
 */
export const getMonthlyStats = async (
  userId: string,
  monthKey?: string
): Promise<MonthlyStats> => {
  try {
    const counters = await getMonthlyCounters(userId, monthKey);

    const stats: MonthlyStats = {
      musculation: 0,
      crossfit: 0,
      running: 0,
      velo: 0,
      total: 0,
    };

    counters.forEach((counter) => {
      const type = counter.sport_type as SportKey;
      if (type in stats) {
        stats[type] = counter.count;
        stats.total += counter.count;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error in getMonthlyStats:', error);
    return {
      musculation: 0,
      crossfit: 0,
      running: 0,
      velo: 0,
      total: 0,
    };
  }
};

/**
 * Récupère tous les compteurs pour un utilisateur (tous les mois)
 */
export const getAllCounters = async (userId: string): Promise<SessionCounter[]> => {
  try {
    const { data, error } = await supabase
      .from('session_counters')
      .select('*')
      .eq('user_id', userId)
      .order('month_key', { ascending: false });

    if (error) {
      console.error('Error fetching all counters:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllCounters:', error);
    return [];
  }
};

/**
 * Récupère le total de séances du mois actuel
 */
export const getMonthlyTotal = async (userId: string): Promise<number> => {
  try {
    const stats = await getMonthlyStats(userId);
    return stats.total;
  } catch (error) {
    console.error('Error in getMonthlyTotal:', error);
    return 0;
  }
};

/**
 * Récupère le total historique de toutes les séances (tous mois confondus)
 */
export const getTotalHistoricalSessions = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('session_counters')
      .select('count')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching total historical sessions:', error);
      throw error;
    }

    const total = data?.reduce((sum, counter) => sum + counter.count, 0) || 0;
    return total;
  } catch (error) {
    console.error('Error in getTotalHistoricalSessions:', error);
    return 0;
  }
};

/**
 * Récupère le total historique par type de sport (tous mois confondus)
 */
export const getTotalByType = async (userId: string, sportType: SportKey): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('session_counters')
      .select('count')
      .eq('user_id', userId)
      .eq('sport_type', sportType);

    if (error) {
      console.error('Error fetching total by type:', error);
      throw error;
    }

    const total = data?.reduce((sum, counter) => sum + counter.count, 0) || 0;
    return total;
  } catch (error) {
    console.error('Error in getTotalByType:', error);
    return 0;
  }
};

/**
 * Réinitialise un compteur spécifique (utile pour debug)
 */
export const resetCounter = async (
  userId: string,
  sportType: SportKey,
  monthKey?: string
): Promise<void> => {
  try {
    const targetMonth = monthKey || getCurrentMonthKey();

    const { error } = await supabase
      .from('session_counters')
      .delete()
      .eq('user_id', userId)
      .eq('month_key', targetMonth)
      .eq('sport_type', sportType);

    if (error) {
      console.error('Error resetting counter:', error);
      throw error;
    }

    console.log(`✅ Counter reset for ${sportType} in ${targetMonth}`);
  } catch (error) {
    console.error('Error in resetCounter:', error);
    throw error;
  }
};
