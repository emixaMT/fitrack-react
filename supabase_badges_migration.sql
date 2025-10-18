-- ===================================
-- SYSTÈME DE GAMIFICATION - BADGES
-- ===================================

-- Table: badges
-- Contient tous les badges disponibles dans l'application
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- Identifiant unique du badge (ex: 'first_workout')
  name TEXT NOT NULL, -- Nom du badge (ex: 'Premier Pas')
  description TEXT, -- Description du badge
  icon TEXT, -- Nom de l'icône ou emoji (ex: '🏆', '💪', '⭐')
  category TEXT, -- Catégorie (ex: 'workout', 'consistency', 'performance')
  rarity TEXT DEFAULT 'common', -- Rareté: 'common', 'rare', 'epic', 'legendary'
  condition_type TEXT, -- Type de condition (ex: 'workout_count', 'streak_days', 'weight_lifted')
  condition_value INTEGER, -- Valeur à atteindre pour débloquer
  points INTEGER DEFAULT 0, -- Points gagnés lors du déblocage
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_badges_category ON public.badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_code ON public.badges(code);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut voir les badges disponibles
CREATE POLICY "Anyone can view badges" ON public.badges
  FOR SELECT USING (true);

-- Policy: Seuls les admins peuvent modifier (optionnel, à ajuster selon vos besoins)
CREATE POLICY "Only admins can modify badges" ON public.badges
  FOR ALL USING (false); -- À remplacer par une vérification admin si nécessaire


-- ===================================
-- Table: user_badges
-- Contient les badges débloqués par chaque utilisateur
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER DEFAULT 0, -- Progression vers le déblocage (optionnel)
  is_new BOOLEAN DEFAULT true, -- Pour afficher une notification "nouveau badge"
  
  -- Contrainte unique: un utilisateur ne peut avoir qu'une seule fois chaque badge
  UNIQUE(user_id, badge_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_unlocked ON public.user_badges(unlocked_at DESC);

-- Enable RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres badges
CREATE POLICY "Users can view own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent insérer leurs propres badges
CREATE POLICY "Users can unlock own badges" ON public.user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres badges (ex: marquer comme vu)
CREATE POLICY "Users can update own badges" ON public.user_badges
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent supprimer leurs propres badges (optionnel)
CREATE POLICY "Users can delete own badges" ON public.user_badges
  FOR DELETE USING (auth.uid() = user_id);


-- ===================================
-- BADGES PRÉDÉFINIS
-- ===================================

-- Insertion des badges par défaut
INSERT INTO public.badges (code, name, description, icon, category, rarity, condition_type, condition_value, points) VALUES
  -- Badges de démarrage
  ('first_workout', 'Premier Pas', 'Complétez votre première séance d''entraînement', '🎯', 'workout', 'common', 'workout_count', 1, 10),
  ('early_bird', 'Lève-Tôt', 'Complétez une séance avant 8h du matin', '🌅', 'special', 'rare', 'early_workout', 1, 25),
  
  -- Badges de volume
  ('workout_10', 'Débutant Motivé', 'Complétez 10 séances d''entraînement', '💪', 'workout', 'common', 'workout_count', 10, 50),
  ('workout_50', 'Athlète Régulier', 'Complétez 50 séances d''entraînement', '🏋️', 'workout', 'rare', 'workout_count', 50, 100),
  ('workout_100', 'Centurion', 'Complétez 100 séances d''entraînement', '⭐', 'workout', 'epic', 'workout_count', 100, 250),
  ('workout_250', 'Légende', 'Complétez 250 séances d''entraînement', '👑', 'workout', 'legendary', 'workout_count', 250, 500),
  
  -- Badges de consistance
  ('streak_7', 'Semaine Parfaite', 'Entraînez-vous 7 jours d''affilée', '🔥', 'consistency', 'rare', 'streak_days', 7, 75),
  ('streak_30', 'Un Mois de Fer', 'Entraînez-vous 30 jours d''affilée', '🔥🔥', 'consistency', 'epic', 'streak_days', 30, 200),
  ('monthly_goal', 'Objectif Mensuel', 'Atteignez votre objectif mensuel', '🎯', 'consistency', 'common', 'monthly_target_reached', 1, 50),
  ('monthly_goal_3', 'Triple Champion', 'Atteignez votre objectif mensuel 3 mois de suite', '🏆', 'consistency', 'epic', 'monthly_target_streak', 3, 150),
  
  -- Badges de performance
  ('heavy_lifter', 'Force Brute', 'Soulevez plus de 100kg au squat', '🦍', 'performance', 'rare', 'squat_weight', 100, 100),
  ('bench_king', 'Roi du Développé', 'Soulevez plus de 100kg au développé couché', '👑', 'performance', 'rare', 'bench_weight', 100, 100),
  ('deadlift_beast', 'Bête de Soulevé', 'Soulevez plus de 150kg au soulevé de terre', '🦬', 'performance', 'epic', 'deadlift_weight', 150, 150),
  
  -- Badges spéciaux
  ('note_taker', 'Archiviste', 'Créez votre première note', '📝', 'special', 'common', 'note_count', 1, 10),
  ('note_master', 'Maître des Notes', 'Créez 50 notes', '📚', 'special', 'rare', 'note_count', 50, 75),
  ('weight_tracker', 'Suivi du Poids', 'Enregistrez votre poids 10 fois', '⚖️', 'special', 'common', 'weight_entries', 10, 25),
  
  -- Badges de catégories
  ('crossfit_lover', 'Addict CrossFit', 'Complétez 20 séances de CrossFit', '🏃', 'workout_type', 'rare', 'crossfit_count', 20, 75),
  ('runner', 'Coureur', 'Complétez 20 séances de running', '🏃‍♂️', 'workout_type', 'rare', 'running_count', 20, 75),
  ('cyclist', 'Cycliste', 'Complétez 20 séances de vélo', '🚴', 'workout_type', 'rare', 'cycling_count', 20, 75)
ON CONFLICT (code) DO NOTHING;


-- ===================================
-- VUES UTILES (optionnel)
-- ===================================

-- Vue: Statistiques des badges par utilisateur
CREATE OR REPLACE VIEW public.user_badge_stats AS
SELECT 
  user_id,
  COUNT(*) as total_badges,
  SUM(b.points) as total_points,
  COUNT(*) FILTER (WHERE b.rarity = 'common') as common_badges,
  COUNT(*) FILTER (WHERE b.rarity = 'rare') as rare_badges,
  COUNT(*) FILTER (WHERE b.rarity = 'epic') as epic_badges,
  COUNT(*) FILTER (WHERE b.rarity = 'legendary') as legendary_badges
FROM public.user_badges ub
JOIN public.badges b ON ub.badge_id = b.id
GROUP BY user_id;

-- Policy pour la vue
ALTER VIEW public.user_badge_stats SET (security_invoker = true);

-- ===================================
-- FONCTION: Débloquer un badge
-- ===================================

CREATE OR REPLACE FUNCTION public.unlock_badge(
  p_user_id UUID,
  p_badge_code TEXT
) RETURNS UUID AS $$
DECLARE
  v_badge_id UUID;
  v_user_badge_id UUID;
BEGIN
  -- Récupérer l'ID du badge
  SELECT id INTO v_badge_id FROM public.badges WHERE code = p_badge_code;
  
  IF v_badge_id IS NULL THEN
    RAISE EXCEPTION 'Badge not found: %', p_badge_code;
  END IF;
  
  -- Insérer le badge pour l'utilisateur (si pas déjà débloqué)
  INSERT INTO public.user_badges (user_id, badge_id)
  VALUES (p_user_id, v_badge_id)
  ON CONFLICT (user_id, badge_id) DO NOTHING
  RETURNING id INTO v_user_badge_id;
  
  RETURN v_user_badge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ===================================
-- FONCTION: Vérifier et débloquer les badges automatiquement
-- ===================================

CREATE OR REPLACE FUNCTION public.check_and_unlock_badges(p_user_id UUID)
RETURNS TABLE(badge_code TEXT, badge_name TEXT) AS $$
BEGIN
  -- Exemple: Badge "Premier Pas" - première séance
  IF NOT EXISTS (
    SELECT 1 FROM public.user_badges ub
    JOIN public.badges b ON ub.badge_id = b.id
    WHERE ub.user_id = p_user_id AND b.code = 'first_workout'
  ) THEN
    IF (SELECT COUNT(*) FROM public.seances WHERE id_user = p_user_id) >= 1 THEN
      PERFORM public.unlock_badge(p_user_id, 'first_workout');
      RETURN QUERY SELECT 'first_workout'::TEXT, 'Premier Pas'::TEXT;
    END IF;
  END IF;
  
  -- Ajouter d'autres vérifications de badges ici...
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ===================================
-- COMMENTAIRES
-- ===================================

COMMENT ON TABLE public.badges IS 'Contient tous les badges disponibles dans l''application';
COMMENT ON TABLE public.user_badges IS 'Contient les badges débloqués par chaque utilisateur';
COMMENT ON COLUMN public.badges.rarity IS 'Rareté du badge: common, rare, epic, legendary';
COMMENT ON COLUMN public.user_badges.is_new IS 'Indique si le badge vient d''être débloqué (pour afficher une notification)';
