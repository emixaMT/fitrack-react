-- ===================================
-- MIGRATION DES SÉANCES EXISTANTES
-- ===================================
-- Script optionnel pour migrer les séances existantes de la table 'seances'
-- vers les nouveaux compteurs 'session_counters'
-- 
-- ⚠️ IMPORTANT : Ce script est optionnel
-- Il ne supprime PAS les séances existantes, il crée juste les compteurs correspondants

-- ===================================
-- 1. VÉRIFICATION PRÉALABLE
-- ===================================

-- Vérifier le nombre de séances à migrer
SELECT 
  COUNT(*) as total_seances,
  COUNT(DISTINCT id_user) as nombre_utilisateurs
FROM seances
WHERE category IN ('musculation', 'crossfit', 'running', 'velo');

-- Aperçu des séances par utilisateur et catégorie
SELECT 
  id_user,
  category,
  COUNT(*) as nombre_seances,
  MIN(created_at) as premiere_seance,
  MAX(created_at) as derniere_seance
FROM seances
WHERE category IN ('musculation', 'crossfit', 'running', 'velo')
GROUP BY id_user, category
ORDER BY id_user, category;

-- ===================================
-- 2. MIGRATION DES DONNÉES
-- ===================================

-- Créer les compteurs à partir des séances existantes
INSERT INTO session_counters (user_id, month_key, sport_type, count, created_at, updated_at)
SELECT 
  id_user as user_id,
  TO_CHAR(created_at, 'YYYY-MM') as month_key,
  category as sport_type,
  COUNT(*) as count,
  MIN(created_at) as created_at,
  MAX(created_at) as updated_at
FROM seances
WHERE 
  category IN ('musculation', 'crossfit', 'running', 'velo')
  AND category IS NOT NULL
  AND id_user IS NOT NULL
GROUP BY id_user, TO_CHAR(created_at, 'YYYY-MM'), category
ON CONFLICT (user_id, month_key, sport_type) 
DO UPDATE SET 
  count = session_counters.count + EXCLUDED.count,
  updated_at = GREATEST(session_counters.updated_at, EXCLUDED.updated_at);

-- ===================================
-- 3. VÉRIFICATION POST-MIGRATION
-- ===================================

-- Vérifier les compteurs créés
SELECT 
  COUNT(*) as total_compteurs,
  COUNT(DISTINCT user_id) as nombre_utilisateurs,
  SUM(count) as total_seances_comptees
FROM session_counters;

-- Détail par utilisateur
SELECT 
  user_id,
  month_key,
  sport_type,
  count,
  created_at,
  updated_at
FROM session_counters
ORDER BY user_id, month_key DESC, sport_type;

-- Comparer avec les données source (pour vérification)
SELECT 
  'seances' as source,
  COUNT(*) as total,
  COUNT(DISTINCT id_user) as users
FROM seances
WHERE category IN ('musculation', 'crossfit', 'running', 'velo')

UNION ALL

SELECT 
  'session_counters' as source,
  SUM(count) as total,
  COUNT(DISTINCT user_id) as users
FROM session_counters;

-- ===================================
-- 4. RÉSUMÉ PAR UTILISATEUR
-- ===================================

-- Vue d'ensemble par utilisateur
SELECT 
  sc.user_id,
  COUNT(DISTINCT sc.month_key) as nombre_mois_actifs,
  SUM(sc.count) as total_seances,
  SUM(CASE WHEN sc.sport_type = 'musculation' THEN sc.count ELSE 0 END) as musculation,
  SUM(CASE WHEN sc.sport_type = 'crossfit' THEN sc.count ELSE 0 END) as crossfit,
  SUM(CASE WHEN sc.sport_type = 'running' THEN sc.count ELSE 0 END) as running,
  SUM(CASE WHEN sc.sport_type = 'velo' THEN sc.count ELSE 0 END) as velo
FROM session_counters sc
GROUP BY sc.user_id
ORDER BY total_seances DESC;

-- ===================================
-- 5. COMMENTAIRES ET NOTES
-- ===================================

-- NOTES IMPORTANTES :
-- 
-- 1. Les séances dans la table 'seances' ne sont PAS supprimées
-- 2. Ce script ne fait que CRÉER les compteurs correspondants
-- 3. Les dates de création/mise à jour des compteurs correspondent aux séances migrées
-- 4. En cas de conflit (compteur déjà existant), les counts sont additionnés
-- 5. Les séances sans catégorie ou sans user_id sont ignorées
--
-- APRÈS LA MIGRATION :
--
-- ✅ Les compteurs sont créés et reflètent l'historique
-- ✅ Le graphique donut affichera les bonnes données
-- ✅ Les nouvelles séances incrémenteront les compteurs existants
-- ✅ L'ancienne table 'seances' peut être conservée pour l'historique détaillé
