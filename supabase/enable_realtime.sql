-- SQL à exécuter dans le dashboard Supabase (SQL Editor)
-- Active Realtime sur toutes les tables utilisées par l'app
-- Idempotent: n'ajoute que les tables qui ne sont pas déjà dans la publication

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'seances') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.seances;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'users') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_badges') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_badges;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'weight_entries') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.weight_entries;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'session_counters') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.session_counters;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'completed_challenges') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.completed_challenges;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'streak_history') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.streak_history;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_levels') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_levels;
  END IF;
END $$;
