-- ═══════════════════════════════════════════════════════════════════
-- Script SQL pour ajouter la colonne monthly_goal à la table users
-- ═══════════════════════════════════════════════════════════════════
-- Cette colonne est nécessaire pour les badges d'objectifs mensuels
-- ⚠️  À exécuter dans le SQL Editor de Supabase
-- ═══════════════════════════════════════════════════════════════════

-- Ajouter la colonne monthly_goal si elle n'existe pas
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS monthly_goal INTEGER DEFAULT 12;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN users.monthly_goal IS 'Objectif mensuel de séances pour l''utilisateur';

-- Définir un objectif par défaut pour les utilisateurs existants
UPDATE users 
SET monthly_goal = 12 
WHERE monthly_goal IS NULL;

-- Définir l'objectif pour votre utilisateur de test
UPDATE users 
SET monthly_goal = 12 
WHERE id = '93b0400c-3a5e-4878-a573-6796c08cebb7';

-- Vérification
SELECT id, monthly_goal 
FROM users 
WHERE id = '93b0400c-3a5e-4878-a573-6796c08cebb7';
