-- ===================================
-- TABLE: session_counters
-- ===================================
-- Table pour stocker les compteurs de séances rapides (sans créer de séance complète)
-- Permet de tracker rapidement le nombre de séances par type et par mois

CREATE TABLE IF NOT EXISTS public.session_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month_key TEXT NOT NULL, -- Format: YYYY-MM (ex: '2025-10')
  sport_type TEXT NOT NULL, -- 'musculation', 'crossfit', 'running', 'velo'
  count INTEGER DEFAULT 0 NOT NULL, -- Nombre de séances pour ce type ce mois-ci
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte unique: un seul enregistrement par user/mois/type
  UNIQUE(user_id, month_key, sport_type)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_session_counters_user ON public.session_counters(user_id);
CREATE INDEX IF NOT EXISTS idx_session_counters_month ON public.session_counters(month_key);
CREATE INDEX IF NOT EXISTS idx_session_counters_user_month ON public.session_counters(user_id, month_key);

-- Enable RLS
ALTER TABLE public.session_counters ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres compteurs
CREATE POLICY "Users can view own session counters" ON public.session_counters
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent insérer leurs propres compteurs
CREATE POLICY "Users can insert own session counters" ON public.session_counters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres compteurs
CREATE POLICY "Users can update own session counters" ON public.session_counters
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent supprimer leurs propres compteurs
CREATE POLICY "Users can delete own session counters" ON public.session_counters
  FOR DELETE USING (auth.uid() = user_id);

-- ===================================
-- FONCTION: Incrémenter un compteur
-- ===================================
CREATE OR REPLACE FUNCTION public.increment_session_counter(
  p_user_id UUID,
  p_month_key TEXT,
  p_sport_type TEXT
) RETURNS INTEGER AS $$
DECLARE
  v_new_count INTEGER;
BEGIN
  -- Insérer ou mettre à jour le compteur
  INSERT INTO public.session_counters (user_id, month_key, sport_type, count, updated_at)
  VALUES (p_user_id, p_month_key, p_sport_type, 1, NOW())
  ON CONFLICT (user_id, month_key, sport_type)
  DO UPDATE SET 
    count = session_counters.count + 1,
    updated_at = NOW()
  RETURNING count INTO v_new_count;
  
  RETURN v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- VUE: Total des séances par utilisateur/mois
-- ===================================
CREATE OR REPLACE VIEW public.user_monthly_session_totals AS
SELECT 
  user_id,
  month_key,
  SUM(count) as total_sessions,
  MAX(updated_at) as last_updated
FROM public.session_counters
GROUP BY user_id, month_key;

-- Policy pour la vue
ALTER VIEW public.user_monthly_session_totals SET (security_invoker = true);

-- ===================================
-- COMMENTAIRES
-- ===================================
COMMENT ON TABLE public.session_counters IS 'Compteurs de séances rapides par type de sport et par mois';
COMMENT ON COLUMN public.session_counters.month_key IS 'Format YYYY-MM pour identifier le mois';
COMMENT ON COLUMN public.session_counters.sport_type IS 'Type de sport: musculation, crossfit, running, velo';
COMMENT ON COLUMN public.session_counters.count IS 'Nombre de séances effectuées pour ce type ce mois-ci';
