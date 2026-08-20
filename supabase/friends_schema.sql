-- SQL à exécuter dans le dashboard Supabase (SQL Editor)
-- Crée les tables nécessaires pour les fonctionnalités d'amis

-- ============================================
-- Table: friends
-- ============================================
CREATE TABLE IF NOT EXISTS public.friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Index pour les requêtes
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON public.friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON public.friends(status);

-- ============================================
-- RLS Policies pour friends
-- ============================================
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Un utilisateur peut voir les relations où il est impliqué
CREATE POLICY "Users can view own friendships"
  ON public.friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Un utilisateur peut insérer une demande d'ami
CREATE POLICY "Users can insert friend requests"
  ON public.friends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Un utilisateur peut mettre à jour les relations où il est impliqué
CREATE POLICY "Users can update own friendships"
  ON public.friends FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Un utilisateur peut supprimer les relations où il est impliqué
CREATE POLICY "Users can delete own friendships"
  ON public.friends FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ============================================
-- Trigger pour updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS friends_updated_at ON public.friends;
CREATE TRIGGER friends_updated_at
  BEFORE UPDATE ON public.friends
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
