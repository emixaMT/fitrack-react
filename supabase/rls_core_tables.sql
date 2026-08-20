-- SQL à exécuter dans le dashboard Supabase (SQL Editor)
-- Active RLS sur toutes les tables core + policies par utilisateur
-- IMPORTANT: Exécuter entièrement

-- ============================================
-- Table: seances (colonne user: id_user)
-- ============================================
ALTER TABLE public.seances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own seances"
  ON public.seances FOR SELECT
  USING (auth.uid() = id_user);

CREATE POLICY "Users can insert own seances"
  ON public.seances FOR INSERT
  WITH CHECK (auth.uid() = id_user);

CREATE POLICY "Users can update own seances"
  ON public.seances FOR UPDATE
  USING (auth.uid() = id_user)
  WITH CHECK (auth.uid() = id_user);

CREATE POLICY "Users can delete own seances"
  ON public.seances FOR DELETE
  USING (auth.uid() = id_user);

-- ============================================
-- Table: notes (colonne user: id_user)
-- ============================================
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
  ON public.notes FOR SELECT
  USING (auth.uid() = id_user);

CREATE POLICY "Users can insert own notes"
  ON public.notes FOR INSERT
  WITH CHECK (auth.uid() = id_user);

CREATE POLICY "Users can update own notes"
  ON public.notes FOR UPDATE
  USING (auth.uid() = id_user)
  WITH CHECK (auth.uid() = id_user);

CREATE POLICY "Users can delete own notes"
  ON public.notes FOR DELETE
  USING (auth.uid() = id_user);

-- ============================================
-- Table: users (colonne user: id)
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Un utilisateur peut voir son propre profil ET les profils des autres (pour amis/classement)
-- On autorise SELECT pour tous les users authentifiés (nécessaire pour amis)
CREATE POLICY "Authenticated can view users"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

-- Mais un utilisateur ne peut modifier QUE son propre profil
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON public.users FOR DELETE
  USING (auth.uid() = id);

-- ============================================
-- Table: user_badges (colonne user: user_id)
-- ============================================
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own badges"
  ON public.user_badges FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own badges"
  ON public.user_badges FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Table: performances (colonne user: id_user)
-- ============================================
ALTER TABLE public.performances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own performances"
  ON public.performances FOR SELECT
  USING (auth.uid() = id_user);

CREATE POLICY "Users can insert own performances"
  ON public.performances FOR INSERT
  WITH CHECK (auth.uid() = id_user);

CREATE POLICY "Users can update own performances"
  ON public.performances FOR UPDATE
  USING (auth.uid() = id_user)
  WITH CHECK (auth.uid() = id_user);

CREATE POLICY "Users can delete own performances"
  ON public.performances FOR DELETE
  USING (auth.uid() = id_user);

-- ============================================
-- Table: weight_entries (colonne user: id_user)
-- ============================================
ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weight entries"
  ON public.weight_entries FOR SELECT
  USING (auth.uid() = id_user);

CREATE POLICY "Users can insert own weight entries"
  ON public.weight_entries FOR INSERT
  WITH CHECK (auth.uid() = id_user);

CREATE POLICY "Users can update own weight entries"
  ON public.weight_entries FOR UPDATE
  USING (auth.uid() = id_user)
  WITH CHECK (auth.uid() = id_user);

CREATE POLICY "Users can delete own weight entries"
  ON public.weight_entries FOR DELETE
  USING (auth.uid() = id_user);

-- ============================================
-- Table: badges (table publique, lecture seule)
-- ============================================
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view badges"
  ON public.badges FOR SELECT
  TO authenticated
  USING (true);

-- Seuls les admins (service_role) peuvent insérer/modifier les badges
-- Pas de policy INSERT/UPDATE/DELETE = bloqué pour les clients
