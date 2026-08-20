-- SQL à exécuter dans le dashboard Supabase (SQL Editor)
-- Ajoute la colonne friend_code à la table users

-- ============================================
-- Colonne: friend_code (unique, random)
-- ============================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS friend_code TEXT;

-- Index unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_friend_code ON public.users(friend_code) WHERE friend_code IS NOT NULL;

-- RLS: un utilisateur peut voir son propre friend_code
-- (déjà couvert par les policies existantes sur users si SELECT * est autorisé)

-- Fonction pour générer un code aléatoire de 8 caractères
CREATE OR REPLACE FUNCTION generate_friend_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour auto-générer un friend_code à l'inscription
CREATE OR REPLACE FUNCTION set_friend_code_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.friend_code IS NULL THEN
    NEW.friend_code := generate_friend_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_set_friend_code ON public.users;
CREATE TRIGGER users_set_friend_code
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION set_friend_code_on_insert();
