-- ═══════════════════════════════════════════════════════════════════
-- Script SQL pour débloquer tous les badges pour un utilisateur
-- ═══════════════════════════════════════════════════════════════════
-- Utilisateur: 93b0400c-3a5e-4878-a573-6796c08cebb7
-- 
-- ⚠️  À exécuter dans le SQL Editor de Supabase
-- ═══════════════════════════════════════════════════════════════════

-- Définir l'utilisateur cible
DO $$
DECLARE
  target_user_id UUID := '93b0400c-3a5e-4878-a573-6796c08cebb7';
  badge_record RECORD;
  inserted_count INTEGER := 0;
  already_exists_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🎯 Déblocage de tous les badges pour l''utilisateur: %', target_user_id;
  RAISE NOTICE '';

  -- Parcourir tous les badges
  FOR badge_record IN 
    SELECT id, code, name FROM badges ORDER BY created_at
  LOOP
    -- Tenter d'insérer le badge pour l'utilisateur
    BEGIN
      INSERT INTO user_badges (user_id, badge_id, is_new)
      VALUES (target_user_id, badge_record.id, true);
      
      inserted_count := inserted_count + 1;
      RAISE NOTICE '✅ Badge débloqué: % (ID: %)', badge_record.name, badge_record.code;
      
    EXCEPTION
      WHEN unique_violation THEN
        already_exists_count := already_exists_count + 1;
        RAISE NOTICE 'ℹ️  Badge déjà débloqué: % (ID: %)', badge_record.name, badge_record.code;
    END;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '📊 RÉSUMÉ DU DÉBLOCAGE';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '✅ Nouveaux badges débloqués: %', inserted_count;
  RAISE NOTICE 'ℹ️  Badges déjà débloqués: %', already_exists_count;
  RAISE NOTICE '📦 Total traité: %', inserted_count + already_exists_count;
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Terminé!';
END $$;


-- ═══════════════════════════════════════════════════════════════════
-- ALTERNATIVE: Insertion directe (plus rapide)
-- ═══════════════════════════════════════════════════════════════════
-- Décommentez cette section si vous préférez une méthode plus rapide

/*
INSERT INTO user_badges (user_id, badge_id, is_new)
SELECT 
  '93b0400c-3a5e-4878-a573-6796c08cebb7'::UUID,
  id,
  true
FROM badges
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- Compter les résultats
SELECT 
  COUNT(*) as total_badges,
  SUM(CASE WHEN is_new THEN 1 ELSE 0 END) as nouveaux_badges
FROM user_badges
WHERE user_id = '93b0400c-3a5e-4878-a573-6796c08cebb7';
*/


-- ═══════════════════════════════════════════════════════════════════
-- VÉRIFICATION: Voir tous les badges de l'utilisateur
-- ═══════════════════════════════════════════════════════════════════

SELECT 
  ub.unlocked_at,
  b.name,
  b.code,
  b.rarity,
  b.points,
  ub.is_new
FROM user_badges ub
JOIN badges b ON b.id = ub.badge_id
WHERE ub.user_id = '93b0400c-3a5e-4878-a573-6796c08cebb7'
ORDER BY ub.unlocked_at DESC;


-- ═══════════════════════════════════════════════════════════════════
-- STATISTIQUES: Points totaux et badges par rareté
-- ═══════════════════════════════════════════════════════════════════

SELECT 
  COUNT(*) as total_badges,
  SUM(b.points) as total_points,
  COUNT(*) FILTER (WHERE b.rarity = 'common') as communs,
  COUNT(*) FILTER (WHERE b.rarity = 'rare') as rares,
  COUNT(*) FILTER (WHERE b.rarity = 'epic') as epiques,
  COUNT(*) FILTER (WHERE b.rarity = 'legendary') as legendaires
FROM user_badges ub
JOIN badges b ON b.id = ub.badge_id
WHERE ub.user_id = '93b0400c-3a5e-4878-a573-6796c08cebb7';


-- ═══════════════════════════════════════════════════════════════════
-- NETTOYAGE (OPTIONNEL): Supprimer tous les badges de l'utilisateur
-- ═══════════════════════════════════════════════════════════════════
-- ⚠️  ATTENTION: Décommentez uniquement si vous voulez tout supprimer

/*
DELETE FROM user_badges 
WHERE user_id = '93b0400c-3a5e-4878-a573-6796c08cebb7';

SELECT 'Tous les badges ont été supprimés pour cet utilisateur' as resultat;
*/
