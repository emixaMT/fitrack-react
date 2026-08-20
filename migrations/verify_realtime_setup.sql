-- ===================================
-- VÉRIFICATION CONFIGURATION REALTIME
-- ===================================
-- Script pour vérifier que Realtime est correctement configuré

-- ===================================
-- 1. Vérifier que la table existe
-- ===================================
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'session_counters';

-- Résultat attendu : 1 ligne avec table_name = 'session_counters'

-- ===================================
-- 2. Vérifier que Realtime est activé
-- ===================================
SELECT 
  schemaname, 
  tablename, 
  publication_name
FROM pg_publication_tables
WHERE tablename = 'session_counters';

-- Résultat attendu : 1 ligne avec publication_name = 'supabase_realtime'
-- Si VIDE → Realtime n'est PAS activé, voir instructions ci-dessous

-- ===================================
-- 3. Vérifier les policies RLS
-- ===================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'session_counters'
ORDER BY policyname;

-- Résultat attendu : 4 policies
-- 1. Users can view own session counters (SELECT)
-- 2. Users can insert own session counters (INSERT)
-- 3. Users can update own session counters (UPDATE)
-- 4. Users can delete own session counters (DELETE)

-- ===================================
-- 4. Vérifier la fonction increment_session_counter
-- ===================================
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type,
  prosecdef as is_security_definer
FROM pg_proc
WHERE proname = 'increment_session_counter';

-- Résultat attendu : 1 fonction avec 3 arguments
-- Arguments: p_user_id uuid, p_month_key text, p_sport_type text
-- Return: integer
-- is_security_definer: true

-- ===================================
-- 5. Vérifier les index
-- ===================================
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'session_counters'
ORDER BY indexname;

-- Résultat attendu : Au moins 3 index
-- - idx_session_counters_user
-- - idx_session_counters_month
-- - idx_session_counters_user_month

-- ===================================
-- 6. Tester l'incrémentation (TEST FONCTIONNEL)
-- ===================================
-- ⚠️ Remplacez 'YOUR_USER_ID' par votre vrai user_id

-- Récupérer votre user_id
SELECT auth.uid() as my_user_id;

-- Tester l'incrémentation
SELECT increment_session_counter(
  auth.uid(), -- Votre user_id
  TO_CHAR(NOW(), 'YYYY-MM'), -- Mois actuel
  'musculation' -- Type de sport
) as new_count;

-- Résultat attendu : Un nombre (le nouveau count)

-- Vérifier que le compteur a été créé/mis à jour
SELECT 
  user_id,
  month_key,
  sport_type,
  count,
  created_at,
  updated_at
FROM session_counters
WHERE user_id = auth.uid()
ORDER BY updated_at DESC
LIMIT 5;

-- Résultat attendu : Vous voyez votre compteur avec le bon count

-- ===================================
-- 7. DIAGNOSTIC COMPLET
-- ===================================

-- Résumé de la configuration
SELECT 
  'Table exists' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'session_counters'
    ) THEN '✅ OK'
    ELSE '❌ FAILED'
  END as status

UNION ALL

SELECT 
  'Realtime enabled' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE tablename = 'session_counters'
    ) THEN '✅ OK'
    ELSE '❌ FAILED - Enable Realtime in Supabase Dashboard'
  END as status

UNION ALL

SELECT 
  'RLS Policies' as check_type,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'session_counters') >= 4 
    THEN '✅ OK'
    ELSE '❌ FAILED - Run create_session_counters_table.sql'
  END as status

UNION ALL

SELECT 
  'Function exists' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'increment_session_counter'
    ) THEN '✅ OK'
    ELSE '❌ FAILED - Run create_session_counters_table.sql'
  END as status

UNION ALL

SELECT 
  'Indexes created' as check_type,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'session_counters') >= 3 
    THEN '✅ OK'
    ELSE '❌ FAILED - Run create_session_counters_table.sql'
  END as status;

-- ===================================
-- INSTRUCTIONS SI RÉALTIME N'EST PAS ACTIVÉ
-- ===================================

/*
SI "Realtime enabled" = ❌ FAILED :

1. Aller dans le Dashboard Supabase
2. Cliquer sur "Database" dans le menu
3. Cliquer sur "Replication" en haut
4. Chercher la table "session_counters"
5. Cocher la case pour activer la réplication
6. Attendre quelques secondes
7. Ré-exécuter ce script pour vérifier

ALTERNATIVE (si l'interface ne fonctionne pas) :

-- Activer Realtime manuellement via SQL
ALTER PUBLICATION supabase_realtime ADD TABLE session_counters;

-- Vérifier
SELECT * FROM pg_publication_tables WHERE tablename = 'session_counters';
*/

-- ===================================
-- TEST DE SUBSCRIPTION (depuis l'application)
-- ===================================

/*
Dans votre application, ouvrez la console et cherchez :

📡 [WorkoutDistribution] Subscription status: SUBSCRIBED

Si vous voyez "CHANNEL_ERROR" :
- Realtime n'est pas activé → Voir instructions ci-dessus
- Problème de connexion → Vérifier le réseau
- Quotas Supabase dépassés → Vérifier votre plan

Si vous voyez "SUBSCRIBED" :
✅ Realtime est correctement configuré !

Pour tester :
1. Ouvrez User → Performances
2. Ajoutez +1 séance depuis Home
3. Le donut doit se mettre à jour automatiquement
4. Console doit afficher : 🔄 [WorkoutDistribution] Realtime update
*/

-- ===================================
-- NETTOYAGE (si besoin de reset pour test)
-- ===================================

-- ⚠️ ATTENTION : Ceci supprime toutes les données de test
-- Décommentez seulement si vous voulez nettoyer

-- DELETE FROM session_counters WHERE user_id = auth.uid();
