-- ===================================
-- AJOUT DU SUPPORT DES IMAGES PERSONNALISÉES POUR LES BADGES
-- ===================================
-- Ce script ajoute le champ image_url à la table badges
-- pour permettre l'utilisation d'images personnalisées

-- Ajouter la colonne image_url si elle n'existe pas
ALTER TABLE public.badges 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN public.badges.image_url IS 'URL de l''image personnalisée du badge (Supabase Storage, URL externe, ou null pour utiliser l''emoji icon)';

-- ===================================
-- EXEMPLES D'UTILISATION
-- ===================================

-- Exemple 1: Mettre à jour un badge existant avec une image Supabase Storage
-- UPDATE public.badges 
-- SET image_url = 'https://votre-projet.supabase.co/storage/v1/object/public/badges/first_workout.png'
-- WHERE code = 'first_workout';

-- Exemple 2: Créer un nouveau badge avec une image
-- INSERT INTO public.badges (code, name, description, icon, image_url, category, rarity, condition_type, condition_value, points)
-- VALUES (
--   'custom_badge',
--   'Badge Personnalisé',
--   'Un badge avec une image cool',
--   '🎨', -- Fallback emoji si l'image ne charge pas
--   'https://example.com/badge-image.png',
--   'special',
--   'epic',
--   'custom_action',
--   1,
--   100
-- );

-- ===================================
-- CRÉER UN BUCKET STORAGE POUR LES BADGES (Optionnel)
-- ===================================
-- Si vous souhaitez héberger vos images de badges sur Supabase Storage,
-- vous pouvez créer un bucket public pour les stocker.

-- Dans le Supabase Dashboard:
-- 1. Allez dans Storage
-- 2. Créez un nouveau bucket nommé "badges"
-- 3. Rendez-le public (Public bucket)
-- 4. Uploadez vos images de badges

-- L'URL sera alors:
-- https://votre-projet.supabase.co/storage/v1/object/public/badges/nom-du-fichier.png

-- ===================================
-- POLICY POUR LE BUCKET BADGES (Si vous créez le bucket)
-- ===================================

-- Autoriser la lecture publique des images de badges
-- CREATE POLICY "Public badge images"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'badges');

-- Autoriser les admins à uploader des images (optionnel)
-- CREATE POLICY "Admins can upload badge images"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'badges' AND auth.role() = 'authenticated');
