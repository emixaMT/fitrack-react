-- SQL à exécuter dans le dashboard Supabase (SQL Editor)
-- Active Realtime sur toutes les tables utilisées par l'app
-- Idempotent: safe à ré-exécuter

ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.seances;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.notes;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.user_badges;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.weight_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.session_counters;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.completed_challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.streak_history;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.user_levels;
