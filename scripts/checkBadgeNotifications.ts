// Vérifier pourquoi les notifications de badges ne s'affichent pas
import { supabase } from '../config/supabaseConfig';

const USER_ID = '93b0400c-3a5e-4878-a573-6796c08cebb7';

async function checkNotifications() {
  console.log('🔍 DIAGNOSTIC DES NOTIFICATIONS DE BADGES\n');
  console.log('═══════════════════════════════════════\n');

  // 1. Vérifier les badges débloqués
  console.log('1️⃣  Badges débloqués...\n');
  const { data: badges, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badges(code, name, rarity, points)
    `)
    .eq('user_id', USER_ID)
    .order('unlocked_at', { ascending: false });

  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }

  console.log(`Total : ${badges?.length || 0} badges\n`);

  if (badges && badges.length > 0) {
    badges.forEach((ub: any, i: number) => {
      const isNew = ub.is_new ? '🆕 NOUVEAU (Modal devrait s\'afficher)' : '✓ Déjà vu';
      console.log(`${i + 1}. ${ub.badge?.name}`);
      console.log(`   Code: ${ub.badge?.code}`);
      console.log(`   Statut: ${isNew}`);
      console.log(`   Débloqué le: ${new Date(ub.unlocked_at).toLocaleString()}`);
      console.log('');
    });

    const newBadgesCount = badges.filter((b: any) => b.is_new).length;
    
    if (newBadgesCount > 0) {
      console.log(`\n⚠️  ${newBadgesCount} badge(s) avec is_new = true`);
      console.log('   → Le modal DEVRAIT s\'afficher au chargement de l\'app\n');
    } else {
      console.log(`\n❌ Aucun badge avec is_new = true`);
      console.log('   → C\'est pour ça que le modal ne s\'affiche pas !\n');
      console.log('💡 Solution : Marquer les badges comme "nouveaux"\n');
    }
  } else {
    console.log('❌ Aucun badge débloqué\n');
  }

  // 2. Test de Realtime
  console.log('2️⃣  Test de Supabase Realtime...\n');
  console.log('⏳ Configuration du listener...');

  const channel = supabase
    .channel(`test_${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'user_badges',
        filter: `user_id=eq.${USER_ID}`,
      },
      (payload) => {
        console.log('✅ Realtime fonctionne ! Nouveau badge détecté:', payload);
      }
    )
    .subscribe((status) => {
      console.log(`   Statut Realtime: ${status}`);
      
      if (status === 'SUBSCRIBED') {
        console.log('   ✅ Realtime activé et prêt\n');
      } else if (status === 'CHANNEL_ERROR') {
        console.log('   ❌ Erreur Realtime - Vérifiez la configuration Supabase\n');
      }
    });

  // Attendre 3 secondes pour voir le statut
  await new Promise(resolve => setTimeout(resolve, 3000));

  channel.unsubscribe();

  // 3. Solutions proposées
  console.log('3️⃣  Solutions possibles...\n');

  const newBadges = badges?.filter((b: any) => b.is_new);
  
  if (!newBadges || newBadges.length === 0) {
    console.log('📝 SOLUTION 1 : Marquer les badges existants comme nouveaux');
    console.log('   Exécutez ce SQL dans Supabase :\n');
    console.log('   UPDATE user_badges');
    console.log('   SET is_new = true');
    console.log(`   WHERE user_id = '${USER_ID}';`);
    console.log('\n   Puis rechargez l\'app → Les modals devraient s\'afficher\n');
  }

  console.log('📝 SOLUTION 2 : Tester avec un nouveau badge');
  console.log('   Exécutez ce SQL dans Supabase :\n');
  console.log('   INSERT INTO user_badges (user_id, badge_id, is_new)');
  console.log('   VALUES (');
  console.log(`     '${USER_ID}',`);
  console.log('     (SELECT id FROM badges WHERE code = \'first_workout\'),');
  console.log('     true');
  console.log('   ) ON CONFLICT (user_id, badge_id)');
  console.log('   DO UPDATE SET is_new = true;');
  console.log('\n   → Le modal devrait s\'afficher immédiatement (si Realtime fonctionne)\n');

  console.log('📝 SOLUTION 3 : Vérifier que le Provider est bien installé');
  console.log('   Dans src/app/_layout.tsx, vérifiez que vous avez :');
  console.log('   <BadgeUnlockProvider>');
  console.log('     <Slot />');
  console.log('   </BadgeUnlockProvider>\n');

  console.log('═══════════════════════════════════════');
}

checkNotifications()
  .then(() => {
    console.log('✅ Diagnostic terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur:', error);
    process.exit(1);
  });
