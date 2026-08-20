-- Table pour enregistrer les défis quotidiens complétés
CREATE TABLE IF NOT EXISTS completed_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_year INT NOT NULL,
  year INT NOT NULL,
  challenge_text TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day_of_year, year) -- Un seul défi par jour par an
);

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_completed_challenges_user_year 
ON completed_challenges(user_id, year, day_of_year DESC);

-- RLS (Row Level Security)
ALTER TABLE completed_challenges ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent tout faire sur leurs propres défis
CREATE POLICY "completed_challenges_policy" ON completed_challenges
FOR ALL USING (auth.uid() = user_id);
