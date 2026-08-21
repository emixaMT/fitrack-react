-- Ajouter la colonne route_data pour stocker les traces GPX
-- route_data est un JSONB contenant les points GPS + statistiques
-- Format: { "points": [{lat, lng, ele, time}], "distanceKm": number, "durationSec": number, "elevationGainM": number }

-- Ajouter la colonne si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seances' AND column_name = 'route_data'
  ) THEN
    ALTER TABLE public.seances ADD COLUMN route_data JSONB;
  END IF;
END $$;

-- Commentaire pour documenter le format
COMMENT ON COLUMN public.seances.route_data IS 'Trace GPS au format JSON: { points: [{lat,lng,ele,time}], distanceKm, durationSec, elevationGainM }';
