-- SQL à exécuter dans le dashboard Supabase (SQL Editor)
-- Crée la table streak_history si elle n'existe pas
-- + l'ajoute à la publication realtime

CREATE TABLE IF NOT EXISTS public.streak_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.streak_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own streak history" ON public.streak_history;
CREATE POLICY "Users can view own streak history"
  ON public.streak_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own streak history" ON public.streak_history;
CREATE POLICY "Users can insert own streak history"
  ON public.streak_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own streak history" ON public.streak_history;
CREATE POLICY "Users can delete own streak history"
  ON public.streak_history FOR DELETE
  USING (auth.uid() = user_id);

-- Ajouter à la publication realtime si pas déjà fait
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'streak_history') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.streak_history;
  END IF;
END $$;
