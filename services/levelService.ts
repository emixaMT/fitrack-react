import { supabase } from '../config/supabaseConfig';

export interface UserLevel {
  id: string;
  user_id: string;
  level: number;
  current_xp: number;
  total_xp: number;
  created_at: string;
  updated_at: string;
}

// Configuration du système de niveaux
const XP_PER_CHALLENGE = 20;

/**
 * Calcule l'XP requis pour atteindre le niveau suivant
 * Formule: 50 + (niveau * 50)
 * Niveau 1 → 2: 100 XP (5 défis)
 * Niveau 2 → 3: 150 XP (7.5 défis)
 * Niveau 3 → 4: 200 XP (10 défis)
 * etc.
 */
export function getXPRequiredForLevel(level: number): number {
  return 50 + (level * 50);
}

/**
 * Calcule le niveau basé sur l'XP total
 */
export function calculateLevelFromTotalXP(totalXP: number): { level: number; currentXP: number } {
  let level = 1;
  let remainingXP = totalXP;

  while (remainingXP >= getXPRequiredForLevel(level)) {
    remainingXP -= getXPRequiredForLevel(level);
    level++;
  }

  return {
    level,
    currentXP: remainingXP,
  };
}

/**
 * Récupère les informations de niveau d'un utilisateur
 */
export async function getUserLevel(userId: string): Promise<UserLevel | null> {
  try {
    const { data, error } = await supabase
      .from('user_levels')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Aucun enregistrement trouvé, initialiser
        return await initializeUserLevel(userId);
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user level:', error);
    return null;
  }
}

/**
 * Initialise le niveau d'un utilisateur
 */
export async function initializeUserLevel(userId: string): Promise<UserLevel | null> {
  try {
    const { data, error } = await supabase
      .from('user_levels')
      .insert({
        user_id: userId,
        level: 1,
        current_xp: 0,
        total_xp: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error initializing user level:', error);
    return null;
  }
}

/**
 * Ajoute de l'XP à un utilisateur et met à jour son niveau si nécessaire
 * @param userId - ID de l'utilisateur
 * @param xpToAdd - Montant d'XP à ajouter (par défaut: XP_PER_CHALLENGE)
 * @returns L'objet UserLevel mis à jour avec des informations supplémentaires sur le level up
 */
export async function addXP(
  userId: string,
  xpToAdd: number = XP_PER_CHALLENGE
): Promise<{ userLevel: UserLevel; leveledUp: boolean; oldLevel: number } | null> {
  try {
    // Récupérer le niveau actuel
    let userLevel = await getUserLevel(userId);
    if (!userLevel) {
      userLevel = await initializeUserLevel(userId);
      if (!userLevel) return null;
    }

    const oldLevel = userLevel.level;
    const newTotalXP = userLevel.total_xp + xpToAdd;
    
    // Calculer le nouveau niveau et l'XP actuel
    const { level: newLevel, currentXP: newCurrentXP } = calculateLevelFromTotalXP(newTotalXP);
    
    const leveledUp = newLevel > oldLevel;

    // Mettre à jour dans la base de données
    const { data, error } = await supabase
      .from('user_levels')
      .update({
        level: newLevel,
        current_xp: newCurrentXP,
        total_xp: newTotalXP,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return {
      userLevel: data,
      leveledUp,
      oldLevel,
    };
  } catch (error) {
    console.error('Error adding XP:', error);
    return null;
  }
}

/**
 * Calcule le pourcentage de progression vers le niveau suivant
 */
export function getProgressPercentage(currentXP: number, level: number): number {
  const xpRequired = getXPRequiredForLevel(level);
  return Math.min(Math.round((currentXP / xpRequired) * 100), 100);
}

/**
 * Retourne les informations d'XP pour l'affichage
 */
export function getLevelDisplayInfo(userLevel: UserLevel | null) {
  if (!userLevel) {
    return {
      level: 1,
      currentXP: 0,
      xpRequired: getXPRequiredForLevel(1),
      progressPercentage: 0,
      totalXP: 0,
    };
  }

  const xpRequired = getXPRequiredForLevel(userLevel.level);
  const progressPercentage = getProgressPercentage(userLevel.current_xp, userLevel.level);

  return {
    level: userLevel.level,
    currentXP: userLevel.current_xp,
    xpRequired,
    progressPercentage,
    totalXP: userLevel.total_xp,
  };
}
