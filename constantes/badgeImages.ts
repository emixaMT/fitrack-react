// FILE: constantes/badgeImages.ts
// Configuration des images locales pour les badges
// Les images doivent être placées dans: src/assets/badges/

export const BADGE_IMAGES: Record<string, any> = {
  // ===================================
  // BADGES COMMUNS
  // ===================================
  first_workout: require('../src/assets/badges/first_workout.png'),
  note_taker: require('../src/assets/badges/note_taker.png'),
  weight_tracker: require('../src/assets/badges/weight_tracker.png'),
  monthly_goal: require('../src/assets/badges/monthly_goal.png'),
  workout_10: require('../src/assets/badges/workout_10.png'),


  // ===================================
  // BADGES RARES
  // ===================================
  workout_50: require('../src/assets/badges/workout_50.png'),
  early_bird: require('../src/assets/badges/early_bird.png'),
  heavy_lifter: require('../src/assets/badges/heavy_lifter.png'),
  bench_king: require('../src/assets/badges/bench_king.png'),
  note_master: require('../src/assets/badges/note_master.png'),
  strength_warrior: require('../src/assets/badges/strength_warrior.png'),
  endurance_runner: require('../src/assets/badges/endurance_runner.png'),
  streak_7: require('../src/assets/badges/streak_7.png'),

  // ===================================
  // BADGES ÉPIQUES
  // ===================================
  workout_100: require('../src/assets/badges/workout_100.png'),
  streak_30: require('../src/assets/badges/streak_30.png'),
  deadlift_beast: require('../src/assets/badges/deadlift_beast.png'),
  monthly_goal_3: require('../src/assets/badges/monthly_goal_3.png'),
  strength_master: require('../src/assets/badges/strength_master.png'),
  endurance_beast: require('../src/assets/badges/endurance_master.png'),

  // ===================================
  // BADGES LÉGENDAIRES
  // ===================================
  workout_250: require('../src/assets/badges/workout_250.png'),
  //versatile_athlete: require('../src/assets/badges/versatile_athlete.png'),
};

// Type-safe badge codes
export type BadgeCode = keyof typeof BADGE_IMAGES;

// Helper function pour obtenir une image de badge
export const getBadgeImage = (badgeCode: string) => {
  try {
    return BADGE_IMAGES[badgeCode] || null;
  } catch (error) {
    console.warn(`Image not found for badge: ${badgeCode}`);
    return null;
  }
};

// Vérifier si un badge a une image locale
export const hasBadgeImage = (badgeCode: string): boolean => {
  return badgeCode in BADGE_IMAGES;
};

// Liste de tous les codes de badges avec images
export const AVAILABLE_BADGE_IMAGES = Object.keys(BADGE_IMAGES) as BadgeCode[];
