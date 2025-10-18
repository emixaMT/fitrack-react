-- Table pour enregistrer l'historique des incrémentations de monthly_sessions
-- Utilisée pour calculer la streak basée sur les jours d'incrémentation

CREATE TABLE IF NOT EXISTS streak_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date) -- Un seul enregistrement par utilisateur par jour
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_streak_history_user_date ON streak_history(user_id, date DESC);

-- RLS (Row Level Security)
ALTER TABLE streak_history ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir leur propre historique
CREATE POLICY "Users can view their own streak history"
  ON streak_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent insérer leur propre historique
CREATE POLICY "Users can insert their own streak history"
  ON streak_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent mettre à jour leur propre historique
CREATE POLICY "Users can update their own streak history"
  ON streak_history
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent supprimer leur propre historique
CREATE POLICY "Users can delete their own streak history"
  ON streak_history
  FOR DELETE
  USING (auth.uid() = user_id);
