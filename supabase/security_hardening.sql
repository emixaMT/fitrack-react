-- SQL à exécuter dans le dashboard Supabase (SQL Editor)
-- Durcissement sécurité (audit 2026-11) — idempotent, safe à ré-exécuter.
-- À exécuter APRÈS rls_core_tables.sql, friends_schema.sql et
-- migrations/create_session_counters_table.sql.
--
--  1. increment_session_counter : ne peut plus agir que pour auth.uid()
--  2. users : lecture limitée à soi + personnes liées (amis / demandes)
--     + RPC de recherche par code ami / email qui ne renvoient que id + nom
--  3. monthly_sessions : incrément atomique côté serveur, plus d'écriture
--     arbitraire depuis le client
--  4. friends : seul le destinataire peut accepter, insertion forcée en 'pending'
--  5. Classement : les amis acceptés peuvent lire badges et niveau l'un de l'autre

-- ============================================
-- Helper : deux utilisateurs sont-ils liés ?
-- SECURITY DEFINER pour éviter toute récursion RLS.
-- ============================================
CREATE OR REPLACE FUNCTION public.is_friend_of(p_other UUID, p_accepted_only BOOLEAN DEFAULT TRUE)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friends f
    WHERE ((f.user_id = auth.uid() AND f.friend_id = p_other)
        OR (f.friend_id = auth.uid() AND f.user_id = p_other))
      AND (CASE WHEN p_accepted_only THEN f.status = 'accepted'
                ELSE f.status IN ('pending', 'accepted') END)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_friend_of(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_friend_of(UUID, BOOLEAN) TO authenticated;

-- ============================================
-- 1. increment_session_counter
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_session_counter(
  p_user_id UUID,
  p_month_key TEXT,
  p_sport_type TEXT
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_count INTEGER;
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;
  IF p_month_key !~ '^\d{4}-\d{2}$' THEN
    RAISE EXCEPTION 'invalid month key' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.session_counters (user_id, month_key, sport_type, count, updated_at)
  VALUES (auth.uid(), p_month_key, p_sport_type, 1, NOW())
  ON CONFLICT (user_id, month_key, sport_type)
  DO UPDATE SET count = session_counters.count + 1, updated_at = NOW()
  RETURNING count INTO v_new_count;

  RETURN v_new_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_session_counter(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_session_counter(UUID, TEXT, TEXT) TO authenticated;

-- ============================================
-- 2. users : lecture restreinte
-- ============================================
DROP POLICY IF EXISTS "Authenticated can view users" ON public.users;
DROP POLICY IF EXISTS "Users can view own or related profiles" ON public.users;
CREATE POLICY "Users can view own or related profiles"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_friend_of(id, FALSE));

-- Recherche par code ami : ne renvoie que id + nom
CREATE OR REPLACE FUNCTION public.find_user_by_friend_code(p_code TEXT)
RETURNS TABLE (id UUID, name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.name FROM public.users u
  WHERE auth.uid() IS NOT NULL
    AND u.friend_code = upper(trim(p_code))
  LIMIT 1;
$$;

-- Recherche par email exact : ne renvoie que id + nom
CREATE OR REPLACE FUNCTION public.find_user_by_email(p_email TEXT)
RETURNS TABLE (id UUID, name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.name FROM public.users u
  WHERE auth.uid() IS NOT NULL
    AND lower(u.email) = lower(trim(p_email))
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.find_user_by_friend_code(TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.find_user_by_email(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_user_by_friend_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_user_by_email(TEXT) TO authenticated;

-- ============================================
-- 3. monthly_sessions : incrément serveur uniquement
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_monthly_session(p_month_key TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;
  IF p_month_key !~ '^\d{4}-\d{2}$' THEN
    RAISE EXCEPTION 'invalid month key' USING ERRCODE = '22023';
  END IF;

  UPDATE public.users
  SET monthly_sessions = CASE WHEN month_key = p_month_key
                              THEN COALESCE(monthly_sessions, 0) + 1
                              ELSE 1 END,
      month_key = p_month_key
  WHERE id = auth.uid()
  RETURNING monthly_sessions INTO v_new;

  IF v_new IS NULL THEN
    RAISE EXCEPTION 'profile not found' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_new;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_monthly_session(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_monthly_session(TEXT) TO authenticated;

-- Le client (rôles anon/authenticated) ne peut que remettre le compteur à 0
-- (changement de mois). Les incréments passent par increment_monthly_session,
-- qui s'exécute en tant que propriétaire et n'est donc pas bloqué ici.
CREATE OR REPLACE FUNCTION public.protect_users_counters()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.monthly_sessions := 0;
    ELSIF NEW.monthly_sessions IS DISTINCT FROM OLD.monthly_sessions
          AND COALESCE(NEW.monthly_sessions, 0) <> 0 THEN
      RAISE EXCEPTION 'monthly_sessions is read-only, use increment_monthly_session()'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_protect_counters ON public.users;
CREATE TRIGGER users_protect_counters
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_users_counters();

-- ============================================
-- 4. friends : insertion et acceptation
-- ============================================
DROP POLICY IF EXISTS "Users can insert friend requests" ON public.friends;
CREATE POLICY "Users can insert friend requests"
  ON public.friends FOR INSERT
  WITH CHECK (auth.uid() = user_id AND friend_id <> user_id AND status = 'pending');

DROP POLICY IF EXISTS "Users can update own friendships" ON public.friends;
DROP POLICY IF EXISTS "Recipient can answer friend requests" ON public.friends;
CREATE POLICY "Recipient can answer friend requests"
  ON public.friends FOR UPDATE
  USING (auth.uid() = friend_id AND status = 'pending')
  WITH CHECK (auth.uid() = friend_id AND status IN ('accepted', 'blocked'));

-- ============================================
-- 5. Classement : lecture des badges / niveaux des amis acceptés
-- ============================================
DROP POLICY IF EXISTS "Friends can view badges" ON public.user_badges;
CREATE POLICY "Friends can view badges"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (public.is_friend_of(user_id));

ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own level" ON public.user_levels;
CREATE POLICY "Users can view own level"
  ON public.user_levels FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Friends can view level" ON public.user_levels;
CREATE POLICY "Friends can view level"
  ON public.user_levels FOR SELECT
  TO authenticated
  USING (public.is_friend_of(user_id));

DROP POLICY IF EXISTS "Users can insert own level" ON public.user_levels;
CREATE POLICY "Users can insert own level"
  ON public.user_levels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own level" ON public.user_levels;
CREATE POLICY "Users can update own level"
  ON public.user_levels FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
