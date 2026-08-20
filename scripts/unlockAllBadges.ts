// Script pour débloquer tous les badges pour un utilisateur
// Usage: npx ts-node scripts/unlockAllBadges.ts

import { unlockBadge } from '../services/badgeService';

const USER_ID = '93b0400c-3a5e-4878-a573-6796c08cebb7';

// Liste de tous les badges (18 badges)
const ALL_BADGE_CODES = [
  // Badges Communs (4)
  'first_workout',
  'note_taker',
  'weight_tracker',
  'monthly_goal',
  
  // Badges Rares (10)
  'workout_10',
  'workout_50',
  'early_bird',
  'heavy_lifter',
  'bench_king',
  'note_master',
  'crossfit_lover',
  'runner',
  'cyclist',
  'streak_7',
  
  // Badges Épiques (4)
  'workout_100',
  'streak_30',
  'deadlift_beast',
  'monthly_goal_3',
  
  // Badges Légendaires (1)
  'workout_250',
];

async function unlockAllBadgesForUser() {
  console.log(`🎯 Déblocage de tous les badges pour l'utilisateur: ${USER_ID}`);
  console.log(`📦 Total de badges à débloquer: ${ALL_BADGE_CODES.length}`);
  console.log('');

  let successCount = 0;
  let alreadyUnlockedCount = 0;
  let errorCount = 0;

  for (const badgeCode of ALL_BADGE_CODES) {
    try {
      console.log(`⏳ Déblocage du badge: ${badgeCode}...`);
      const result = await unlockBadge(USER_ID, badgeCode);
      
      if (result) {
        console.log(`✅ Badge "${badgeCode}" débloqué avec succès!`);
        successCount++;
      } else {
        console.log(`ℹ️  Badge "${badgeCode}" déjà débloqué`);
        alreadyUnlockedCount++;
      }
    } catch (error: unknown) {
      console.error(`❌ Erreur pour "${badgeCode}":`, error instanceof Error ? error.message : 'Unknown error');
      errorCount++;
    }
    
    // Petite pause pour éviter de surcharger la DB
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('📊 RÉSUMÉ DU DÉBLOCAGE');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Nouveaux badges débloqués: ${successCount}`);
  console.log(`ℹ️  Badges déjà débloqués: ${alreadyUnlockedCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📦 Total traité: ${ALL_BADGE_CODES.length}`);
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('🎉 Terminé!');
}

// Exécuter le script
unlockAllBadgesForUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
