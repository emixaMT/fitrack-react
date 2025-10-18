-- ===================================
-- MISE À JOUR DES BADGES - Catégories cohérentes
-- ===================================
-- Exécuter ce script dans l'éditeur SQL Supabase pour mettre à jour les badges

-- 1. Supprimer les anciens badges trop spécifiques (CrossFit, Runner, Cyclist)
DELETE FROM badges WHERE code IN ('crossfit_lover', 'runner', 'cyclist');

-- 2. Ajouter les nouveaux badges regroupés

-- Badge "Guerrier de la Force" (20 séances de Force = Muscu + CrossFit)
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
  points = EXCLUDED.points;

-- Badge "Maître de la Force" (50 séances de Force)
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
  points = EXCLUDED.points;

-- Badge "Champion d'Endurance" (20 séances d'Endurance = Course + Vélo)
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
  points = EXCLUDED.points;

-- Badge "Bête d'Endurance" (50 séances d'Endurance)
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
  points = EXCLUDED.points;

-- Badge "Athlète Polyvalent" (10 séances de CHAQUE type)
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
  points = EXCLUDED.points;

-- ===================================
-- VÉRIFICATION
-- ===================================
SELECT 
  code, 
  name, 
  description, 
  rarity, 
  points,
  category
FROM badges 
WHERE category = 'workout_type'
ORDER BY 
  CASE rarity
    WHEN 'common' THEN 1
    WHEN 'rare' THEN 2
    WHEN 'epic' THEN 3
    WHEN 'legendary' THEN 4
  END,
  points;
