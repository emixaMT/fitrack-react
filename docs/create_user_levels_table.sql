-- Table pour stocker les niveaux et l'expérience des utilisateurs
CREATE TABLE IF NOT EXISTS user_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  current_xp INTEGER NOT NULL DEFAULT 0,
  total_xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un seul enregistrement par utilisateur
  UNIQUE(user_id)
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_user_levels_user_id ON user_levels(user_id);

-- RLS (Row Level Security) pour sécuriser les données
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;

-- Politique: les utilisateurs peuvent voir leur propre niveau
CREATE POLICY "Users can view own level"
  ON user_levels
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique: les utilisateurs peuvent insérer leur propre niveau
CREATE POLICY "Users can insert own level"
  ON user_levels
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique: les utilisateurs peuvent mettre à jour leur propre niveau
CREATE POLICY "Users can update own level"
  ON user_levels
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement updated_at
DROP TRIGGER IF EXISTS update_user_levels_updated_at ON user_levels;
CREATE TRIGGER update_user_levels_updated_at
  BEFORE UPDATE ON user_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour initialiser le niveau d'un nouvel utilisateur
CREATE OR REPLACE FUNCTION init_user_level()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_levels (user_id, level, current_xp, total_xp)
  VALUES (NEW.id, 1, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour initialiser automatiquement le niveau lors de l'inscription
DROP TRIGGER IF EXISTS on_auth_user_created_init_level ON auth.users;
CREATE TRIGGER on_auth_user_created_init_level
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION init_user_level();
