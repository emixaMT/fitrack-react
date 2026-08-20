-- ═══════════════════════════════════════════════════════════════════
-- Script SQL pour SUPPRIMER tous les badges d'un utilisateur
-- ═══════════════════════════════════════════════════════════════════
-- Utilisateur: 93b0400c-3a5e-4878-a573-6796c08cebb7
-- 
-- ⚠️  À exécuter dans le SQL Editor de Supabase
-- ═══════════════════════════════════════════════════════════════════

-- MÉTHODE 1: Suppression simple
DELETE FROM user_badges 
WHERE user_id = '93b0400c-3a5e-4878-a573-6796c08cebb7';

-- Vérifier que tout a été supprimé
SELECT COUNT(*) as badges_restants
FROM user_badges
WHERE user_id = '93b0400c-3a5e-4878-a573-6796c08cebb7';

-- Devrait retourner: badges_restants = 0


-- ═══════════════════════════════════════════════════════════════════
-- MÉTHODE 2: Suppression avec confirmation
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  target_user_id UUID := '93b0400c-3a5e-4878-a573-6796c08cebb7';
  deleted_count INTEGER;
BEGIN
  -- Compter avant suppression
  SELECT COUNT(*) INTO deleted_count
  FROM user_badges
  WHERE user_id = target_user_id;
  
  RAISE NOTICE '🗑️  Badges à supprimer: %', deleted_count;
  
  -- Supprimer
  DELETE FROM user_badges 
  WHERE user_id = target_user_id;
  
  RAISE NOTICE '✅ Tous les badges ont été supprimés!';
  RAISE NOTICE '';
  
  -- Vérifier
  SELECT COUNT(*) INTO deleted_count
  FROM user_badges
  WHERE user_id = target_user_id;
  
  RAISE NOTICE '📊 Badges restants: %', deleted_count;
END $$;


-- ═══════════════════════════════════════════════════════════════════
-- VÉRIFICATION FINALE
-- ═══════════════════════════════════════════════════════════════════

-- Doit retourner 0 lignes
SELECT * FROM user_badges
WHERE user_id = '93b0400c-3a5e-4878-a573-6796c08cebb7';
