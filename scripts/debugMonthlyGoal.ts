// Script de débogage pour le badge Objectif Mensuel
import { supabase } from '../config/supabaseConfig';

const USER_ID = '93b0400c-3a5e-4878-a573-6796c08cebb7';

async function debugMonthlyGoal() {
  console.log('🔍 DÉBOGAGE DU BADGE OBJECTIF MENSUEL\n');
  console.log('═══════════════════════════════════════\n');

  // 1. Vérifier l'objectif mensuel
  console.log('1️⃣  Vérification de l\'objectif mensuel...');
  const { data: user } = await supabase
    .from('users')
    .select('monthly_target')
    .eq('id', USER_ID)
    .single();

  if (!user || !user.monthly_target) {
    console.log('❌ Problème : monthly_target n\'est pas défini !');
    console.log('   Solution : UPDATE users SET monthly_target = 10 WHERE id = \'...\';');
    return;
  }
  console.log(`✅ Objectif mensuel : ${user.monthly_target} séances\n`);

  // 2. Vérifier les séances du mois actuel
  console.log('2️⃣  Vérification des séances du mois...');
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  console.log(`   Période : ${firstDayOfMonth.toLocaleDateString()} → ${lastDayOfMonth.toLocaleDateString()}`);

  const { data: seances } = await supabase
    .from('seances')
    .select('*')
    .eq('id_user', USER_ID)
    .gte('created_at', firstDayOfMonth.toISOString())
    .lte('created_at', lastDayOfMonth.toISOString());

  const seanceCount = seances?.length || 0;
  console.log(`✅ Séances trouvées ce mois : ${seanceCount}`);
  
  if (seanceCount < user.monthly_target) {
    console.log(`⚠️  Vous avez ${seanceCount}/${user.monthly_target} séances`);
    console.log(`   Il manque ${user.monthly_target - seanceCount} séance(s)\n`);
  } else {
    console.log(`✅ Objectif atteint ! ${seanceCount}/${user.monthly_target}\n`);
  }

  // 3. Vérifier si le badge existe
  console.log('3️⃣  Vérification du badge en base...');
  const { data: badge } = await supabase
    .from('badges')
    .select('*')
    .eq('code', 'monthly_goal')
    .single();

  if (!badge) {
    console.log('❌ Le badge "monthly_goal" n\'existe pas en base !');
    return;
  }
  console.log(`✅ Badge trouvé : "${badge.name}" (ID: ${badge.id})\n`);

  // 4. Vérifier si le badge est déjà débloqué
  console.log('4️⃣  Vérification du déblocage...');
  const { data: userBadge } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', USER_ID)
    .eq('badge_id', badge.id)
    .maybeSingle();

  if (userBadge) {
    console.log(`✅ Badge déjà débloqué le ${new Date(userBadge.unlocked_at).toLocaleString()}\n`);
  } else {
    console.log('❌ Badge PAS débloqué\n');
  }

  // 5. Tester la condition manuellement
  console.log('5️⃣  Test de la condition...');
  const goalReached = seanceCount >= user.monthly_target;
  
  if (goalReached && !userBadge) {
    console.log('⚠️  PROBLÈME DÉTECTÉ !');
    console.log('   → La condition est remplie mais le badge n\'est pas débloqué');
    console.log('   → Vérifiez que checkAndUnlockBadges() est bien appelé après création de séance\n');
    
    console.log('💡 Solution : Appeler manuellement le déblocage');
    console.log('   Code à exécuter :');
    console.log('   import { checkAndUnlockBadges } from \'./services/badgeService\';');
    console.log(`   await checkAndUnlockBadges('${USER_ID}');\n`);
  } else if (!goalReached) {
    console.log(`❌ Objectif non atteint : ${seanceCount}/${user.monthly_target}\n`);
  } else {
    console.log('✅ Tout est OK !\n');
  }

  // 6. Lister toutes les séances du mois
  console.log('6️⃣  Liste des séances de ce mois :');
  if (seances && seances.length > 0) {
    seances.forEach((s, i) => {
      const date = new Date(s.created_at);
      console.log(`   ${i + 1}. ${s.nom || s.category} - ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
    });
  } else {
    console.log('   Aucune séance trouvée');
  }

  console.log('\n═══════════════════════════════════════');
}

debugMonthlyGoal()
  .then(() => {
    console.log('\n✅ Débogage terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur:', error);
    process.exit(1);
  });
