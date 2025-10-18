-- ===================================
-- MISE À JOUR COMPLÈTE DES BADGES
-- ===================================
-- Script SQL pour mettre à jour et ajouter tous les nouveaux trophées
-- Exécuter ce script dans l'éditeur SQL Supabase

-- ===================================
-- 1. SUPPRESSION DES BADGES OBSOLÈTES
-- ===================================
DELETE FROM badges WHERE code IN ('crossfit_lover', 'runner', 'cyclist');

-- ===================================
-- 2. MISE À JOUR ET AJOUT DES BADGES
-- ===================================

-- ===================================
-- BADGES COMMUNS (Common)
-- ===================================

-- Badge: Premier Pas
INSERT INTO badges (code, name, description, icon, category, rarity, condition_type, condition_value, points)
VALUES (
  'first_workout',
  'Premier Pas',
  'Complétez votre première séance d''entraînement',
  '🎯',
  'workout',
  'common',
  'workout_count',
  1,
  10
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value,
  points = EXCLUDED.points;

-- Badge: Archiviste
INSERT INTO badges (code, name, description, icon, category, rarity, condition_type, condition_value, points)
VALUES (
  'note_taker',
  'Archiviste',
  'Créez votre première note',
  '📝',
  'special',
  'common',
  'note_count',
  1,
  10
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value,
  points = EXCLUDED.points;

-- Badge: Suivi du Poids
INSERT INTO badges (code, name, description, icon, category, rarity, condition_type, condition_value, points)
VALUES (
  'weight_tracker',
  'Suivi du Poids',
  'Enregistrez votre poids 10 fois',
  '⚖️',
  'special',
  'common',
  'weight_entries',
  10,
  25
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value,
  points = EXCLUDED.points;

-- Badge: Objectif Mensuel
INSERT INTO badges (code, name, description, icon, category, rarity, condition_type, condition_value, points)
VALUES (
  'monthly_goal',
  'Objectif Mensuel',
  'Atteignez votre objectif mensuel',
  '🎯',
  'consistency',
  'common',
  'monthly_target_reached',
  1,
  50
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value,
  points = EXCLUDED.points;

-- Badge: Débutant Motivé
INSERT INTO badges (code, name, description, icon, category, rarity, condition_type, condition_value, points)
VALUES (
  'workout_10',
  'Débutant Motivé',
  'Complétez 10 séances d''entraînement',
  '💪',
  'workout',
  'common',
  'workout_count',
  10,
  50
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value,
  points = EXCLUDED.points;

-- ===================================
-- BADGES RARES (Rare)
-- ===================================

-- Badge: Athlète Régulier
INSERT INTO badges (code, name, description, icon, category, rarity, condition_type, condition_value, points)
VALUES (
  'workout_50',
  'Athlète Régulier',
  'Complétez 50 séances d''entraînement',
  '🏋️',
  'workout',
  'rare',
  'workout_count',
  50,
  100
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value,
  points = EXCLUDED.points;

-- Badge: Lève-Tôt
INSERT INTO badges (code, name, description, icon, category, rarity, condition_type, condition_value, points)
VALUES (
  'early_bird',
  'Lève-Tôt',
  'Complétez une séance avant 8h du matin',
  '🌅',
  'special',
  'rare',
  'early_workout',
  1,
  25
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value,
  points = EXCLUDED.points;

-- Badge: Force Brute
INSERT INTO badges (code, name, description, icon, category, rarity, condition_type, condition_value, points)
VALUES (
  'heavy_lifter',
  'Force Brute',
  'Soulevez plus de 100kg au squat',
  '🦍',
  'performance',
  'rare',
  'squat_weight',
  100,
  100
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value,
  points = EXCLUDED.points;

-- Badge: Roi du Développé
INSERT INTO badges (code, name, description, icon, category, rarity, condition_type, condition_value, points)
VALUES (
  'bench_king',
  'Roi du Développé',
  'Soulevez plus de 100kg au développé couché',
  '👑',
  'performance',
  'rare',
  'bench_weight',
  100,
  100
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value,
  points = EXCLUDED.points;

-- Badge: Maître des Notes
INSERT INTO badges (code, name, description, icon, category, rarity, condition_type, condition_value, points)
VALUES (
  'note_master',
  'Maître des Notes',
  'Créez 50 notes',
  '📚',
  'special',
  'rare',
  'note_count',
  50,
  75
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value,
  points = EXCLUDED.points;

-- Badge: Guerrier de la Force
INSERT INTO badges (code, name, description, icon, category, rarity, condition_type, condition_value, points)
VALUES (
  'strength_warrior',
  'Guerrier de la Force',
  'Complétez 20 séances de musculation ou CrossFit',
  '💪',
  'workout_type',
  'rare',
  'strength_count',
  20,
  75
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value,
  points = EXCLUDED.points;

-- Badge: Champion d'Endurance
INSERT INTO badges (code, name, description, icon, category, rarity, condition_type, condition_value, points)
VALUES (
  'endurance_runner',
  'Champion d''Endurance',
  'Complétez 20 séances de course à pied ou vélo',
  '🏃',
  'workout_type',
  'rare',
  'endurance_count',
  20,
  75
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value,
  points = EXCLUDED.points;

-- Badge: Semaine Parfaite
INSERT INTO badges (code, name, description, icon, category, rarity, condition_type, condition_value, points)
VALUES (
  'streak_7',
  'Semaine Parfaite',
  'Entraînez-vous 7 jours d''affilée',
  '🔥',
  'consistency',
  'rare',
  'streak_days',
  7,
  75
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value,
  points = EXCLUDED.points;

-- ===================================
-- BADGES ÉPIQUES (Epic)
-- ===================================

-- Badge: Centurion
INSERT INTO badges (code, name, description, icon, category, rarity, condition_type, condition_value, points)
VALUES (
  'workout_100',
  'Centurion',
  'Complétez 100 séances d''entraînement',
  '⭐',
  'workout',
  'epic',
  'workout_count',
  100,
  250
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value,
  points = EXCLUDED.points;

-- Badge: Un Mois de Fer
INSERT INTO badges (code, name, description, icon, category, rarity, condition_type, condition_value, points)
VALUES (
  'streak_30',
  'Un Mois de Fer',
  'Entraînez-vous 30 jours d''affilée',
  '🔥🔥',
  'consistency',
  'epic',
  'streak_days',
  30,
  200
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value,
  points = EXCLUDED.points;

-- Badge: Bête de Soulevé
INSERT INTO badges (code, name, description, icon, category, rarity, condition_type, condition_value, points)
VALUES (
  'deadlift_beast',
  'Bête de Soulevé',
  'Soulevez plus de 150kg au soulevé de terre',
  '🦬',
  'performance',
  'epic',
  'deadlift_weight',
  150,
  150
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value,
  points = EXCLUDED.points;

-- Badge: Triple Champion
INSERT INTO badges (code, name, description, icon, category, rarity, condition_type, condition_value, points)
VALUES (
  'monthly_goal_3',
  'Triple Champion',
  'Atteignez votre objectif mensuel 3 mois de suite',
  '🏆',
  'consistency',
  'epic',
  'monthly_target_streak',
  3,
  150
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value,
  points = EXCLUDED.points;

-- Badge: Maître de la Force
INSERT INTO badges (code, name, description, icon, category, rarity, condition_type, condition_value, points)
VALUES (
  'strength_master',
  'Maître de la Force',
  'Complétez 50 séances de musculation ou CrossFit',
  '🏋️',
  'workout_type',
  'epic',
  'strength_count',
  50,
  150
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value,
  points = EXCLUDED.points;

-- Badge: Bête d'Endurance
INSERT INTO badges (code, name, description, icon, category, rarity, condition_type, condition_value, points)
VALUES (
  'endurance_beast',
  'Bête d''Endurance',
  'Complétez 50 séances de course à pied ou vélo',
  '🚴',
  'workout_type',
  'epic',
  'endurance_count',
  50,
  150
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value,
  points = EXCLUDED.points;

-- ===================================
-- BADGES LÉGENDAIRES (Legendary)
-- ===================================

-- Badge: Légende
INSERT INTO badges (code, name, description, icon, category, rarity, condition_type, condition_value, points)
VALUES (
  'workout_250',
  'Légende',
  'Complétez 250 séances d''entraînement',
  '👑',
  'workout',
  'legendary',
  'workout_count',
  250,
  500
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value,
  points = EXCLUDED.points;

-- Badge: Athlète Polyvalent
INSERT INTO badges (code, name, description, icon, category, rarity, condition_type, condition_value, points)
VALUES (
  'versatile_athlete',
  'Athlète Polyvalent',
  'Complétez au moins 10 séances de chaque discipline (Musculation, CrossFit, Course, Vélo)',
  '🌟',
  'workout_type',
  'legendary',
  'versatile',
  10,
  250
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value,
  points = EXCLUDED.points;

-- ===================================
-- 3. VÉRIFICATION DES BADGES
-- ===================================

-- Afficher tous les badges par rareté
SELECT 
  code, 
  name, 
  description, 
  icon,
  rarity, 
  points,
  category,
  condition_type,
  condition_value
FROM badges 
ORDER BY 
  CASE rarity
    WHEN 'common' THEN 1
    WHEN 'rare' THEN 2
    WHEN 'epic' THEN 3
    WHEN 'legendary' THEN 4
  END,
  points;

-- ===================================
-- 4. STATISTIQUES
-- ===================================

-- Nombre de badges par rareté
SELECT 
  rarity,
  COUNT(*) as count,
  SUM(points) as total_points
FROM badges
GROUP BY rarity
ORDER BY 
  CASE rarity
    WHEN 'common' THEN 1
    WHEN 'rare' THEN 2
    WHEN 'epic' THEN 3
    WHEN 'legendary' THEN 4
  END;

-- Nombre de badges par catégorie
SELECT 
  category,
  COUNT(*) as count,
  SUM(points) as total_points
FROM badges
GROUP BY category
ORDER BY count DESC;
