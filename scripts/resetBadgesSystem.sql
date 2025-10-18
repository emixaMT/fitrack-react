-- ═══════════════════════════════════════════════════════════════════
-- Script SQL pour REMETTRE À ZÉRO le système de badges
-- ═══════════════════════════════════════════════════════════════════
-- ⚠️  À exécuter dans le SQL Editor de Supabase
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- ÉTAPE 1 : Supprimer tous les badges de l'utilisateur
-- ═══════════════════════════════════════════════════════════════════

DELETE FROM user_badges 
WHERE user_id = '93b0400c-3a5e-4878-a573-6796c08cebb7';

-- Vérifier que tout est supprimé
SELECT COUNT(*) as badges_restants
FROM user_badges
WHERE user_id = '93b0400c-3a5e-4878-a573-6796c08cebb7';
-- Devrait retourner: 0


-- ═══════════════════════════════════════════════════════════════════
-- ÉTAPE 2 : Vérifier que is_new a une valeur par défaut
-- ═══════════════════════════════════════════════════════════════════

-- Vérifier la structure de la table
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_badges' 
  AND column_name = 'is_new';

-- Si is_new n'a pas de valeur par défaut, ajoutez-la :
-- ALTER TABLE user_badges 
-- ALTER COLUMN is_new SET DEFAULT true;

-- Si is_new n'existe pas, créez-la :
-- ALTER TABLE user_badges 
-- ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT true NOT NULL;


-- ═══════════════════════════════════════════════════════════════════
-- ÉTAPE 3 : S'assurer que monthly_target est défini
-- ═══════════════════════════════════════════════════════════════════

-- Vérifier votre objectif mensuel
SELECT id, monthly_target 
FROM users 
WHERE id = '93b0400c-3a5e-4878-a573-6796c08cebb7';

-- Si NULL, définir un objectif (exemple: 10 séances/mois)
UPDATE users 
SET monthly_target = 10 
WHERE id = '93b0400c-3a5e-4878-a573-6796c08cebb7'
  AND monthly_target IS NULL;


-- ═══════════════════════════════════════════════════════════════════
-- ÉTAPE 4 : OPTIONNEL - Garder vos séances mais reset les badges
-- ═══════════════════════════════════════════════════════════════════

-- Voir combien de séances vous avez
SELECT COUNT(*) as total_seances
FROM seances
WHERE id_user = '93b0400c-3a5e-4878-a573-6796c08cebb7';

-- Si vous voulez AUSSI supprimer toutes vos séances (ATTENTION !) :
-- DELETE FROM seances WHERE id_user = '93b0400c-3a5e-4878-a573-6796c08cebb7';

-- Si vous voulez AUSSI supprimer vos notes :
-- DELETE FROM notes WHERE id_user = '93b0400c-3a5e-4878-a573-6796c08cebb7';

-- Si vous voulez AUSSI supprimer vos entrées de poids :
-- DELETE FROM weight_entries WHERE user_id = '93b0400c-3a5e-4878-a573-6796c08cebb7';

-- Si vous voulez AUSSI supprimer vos performances :
-- DELETE FROM performances WHERE user_id = '93b0400c-3a5e-4878-a573-6796c08cebb7';


-- ═══════════════════════════════════════════════════════════════════
-- ÉTAPE 5 : Vérification finale
-- ═══════════════════════════════════════════════════════════════════

SELECT 
  'Badges' as type,
  COUNT(*) as total
FROM user_badges
WHERE user_id = '93b0400c-3a5e-4878-a573-6796c08cebb7'

UNION ALL

SELECT 
  'Séances' as type,
  COUNT(*) as total
FROM seances
WHERE id_user = '93b0400c-3a5e-4878-a573-6796c08cebb7'

UNION ALL

SELECT 
  'Notes' as type,
  COUNT(*) as total
FROM notes
WHERE id_user = '93b0400c-3a5e-4878-a573-6796c08cebb7'

UNION ALL

SELECT 
  'Poids' as type,
  COUNT(*) as total
FROM weight_entries
WHERE user_id = '93b0400c-3a5e-4878-a573-6796c08cebb7';


-- ═══════════════════════════════════════════════════════════════════
-- ✅ C'est fait !
-- ═══════════════════════════════════════════════════════════════════
-- Maintenant :
-- 1. Les badges sont supprimés
-- 2. monthly_target est défini
-- 3. Créez des séances dans l'app → Les badges se débloquent avec is_new = true
-- 4. Les modals s'affichent automatiquement ! 🎉
-- ═══════════════════════════════════════════════════════════════════
