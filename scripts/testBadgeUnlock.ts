// Script de test pour vérifier le déblocage automatique des badges
import { supabase } from '../config/supabaseConfig';
import { checkAndUnlockBadges } from '../services/badgeService';

const USER_ID = '93b0400c-3a5e-4878-a573-6796c08cebb7';

async function testBadgeUnlock() {
  console.log('🔍 TEST DE DÉBLOCAGE AUTOMATIQUE\n');
  console.log('═══════════════════════════════════════\n');

  // 1. Vérifier l'objectif mensuel
  console.log('1️⃣  Vérification de l\'objectif mensuel...');
  const { data: user } = await supabase
    .from('users')
    .select('monthly_target')
    .eq('id', USER_ID)
    .single();

  if (!user) {
    console.log('❌ Utilisateur non trouvé !');
    return;
  }

  console.log(`✅ Objectif mensuel : ${user.monthly_target || 'NON DÉFINI'}\n`);

  // 2. Compter les séances du mois
  console.log('2️⃣  Comptage des séances du mois...');
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { data: seances } = await supabase
    .from('seances')
    .select('*')
    .eq('id_user', USER_ID)
    .gte('created_at', firstDayOfMonth.toISOString())
    .lte('created_at', lastDayOfMonth.toISOString());

  const seanceCount = seances?.length || 0;
  console.log(`✅ Séances trouvées : ${seanceCount}`);

  if (user.monthly_target) {
    if (seanceCount >= user.monthly_target) {
      console.log(`✅ Objectif atteint ! ${seanceCount}/${user.monthly_target}\n`);
    } else {
      console.log(`⚠️  Objectif non atteint : ${seanceCount}/${user.monthly_target}\n`);
    }
  } else {
    console.log(`⚠️  monthly_target non défini - impossible de vérifier l'objectif\n`);
  }

  // 3. Vérifier les badges déjà débloqués
  console.log('3️⃣  Badges actuellement débloqués...');
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badges(code, name)
    `)
    .eq('user_id', USER_ID);

  console.log(`✅ Total badges débloqués : ${userBadges?.length || 0}`);
  
  if (userBadges && userBadges.length > 0) {
    userBadges.forEach((ub: any) => {
      console.log(`   - ${ub.badge?.name} (${ub.badge?.code}) - ${ub.is_new ? '🆕 NOUVEAU' : '✓ Vu'}`);
    });
  }
  console.log('');

  // 4. Lancer la vérification automatique
  console.log('4️⃣  Lancement de checkAndUnlockBadges()...');
  console.log('⏳ Vérification en cours...\n');

  try {
    const newBadges = await checkAndUnlockBadges(USER_ID);
    
    if (newBadges.length > 0) {
      console.log(`🎉 ${newBadges.length} NOUVEAU(X) BADGE(S) DÉBLOQUÉ(S) !\n`);
      
      newBadges.forEach((userBadge) => {
        if (userBadge.badge) {
          console.log(`✨ ${userBadge.badge.name}`);
          console.log(`   Code: ${userBadge.badge.code}`);
          console.log(`   Points: +${userBadge.badge.points}`);
          console.log(`   Rareté: ${userBadge.badge.rarity}`);
          console.log('');
        }
      });
    } else {
      console.log('ℹ️  Aucun nouveau badge débloqué\n');
      console.log('💡 Raisons possibles :');
      console.log('   - Les conditions ne sont pas encore remplies');
      console.log('   - Les badges sont déjà débloqués');
      console.log('   - Le monthly_target n\'est pas défini\n');
    }

    // 5. Vérifier à nouveau les badges
    console.log('5️⃣  État final des badges...');
    const { data: finalBadges } = await supabase
      .from('user_badges')
      .select(`
        *,
        badge:badges(code, name, points)
      `)
      .eq('user_id', USER_ID);

    console.log(`✅ Total badges : ${finalBadges?.length || 0}\n`);

    // 6. Vérifier spécifiquement le badge monthly_goal
    const monthlyGoalBadge = finalBadges?.find((b: any) => b.badge?.code === 'monthly_goal');
    
    if (user.monthly_target && seanceCount >= user.monthly_target) {
      if (monthlyGoalBadge) {
        console.log(`✅ Badge "Objectif Mensuel" : DÉBLOQUÉ`);
        console.log(`   Date: ${new Date(monthlyGoalBadge.unlocked_at).toLocaleString()}`);
        console.log(`   Nouveau: ${monthlyGoalBadge.is_new ? 'Oui 🆕' : 'Non'}\n`);
      } else {
        console.log(`❌ Badge "Objectif Mensuel" : PAS DÉBLOQUÉ`);
        console.log(`   Pourtant, objectif atteint (${seanceCount}/${user.monthly_target})`);
        console.log(`   → Problème détecté !\n`);
      }
    }

  } catch (error) {
    console.error('💥 Erreur lors de la vérification :', error);
  }

  console.log('═══════════════════════════════════════');
  console.log('✅ Test terminé\n');
}

testBadgeUnlock()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
