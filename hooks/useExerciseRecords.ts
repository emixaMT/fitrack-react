// hooks/useExerciseRecords.ts
// Récupère le record personnel (max charge × reps) par nom d'exercice
import { useEffect, useState } from 'react';
import { supabase } from '../config/supabaseConfig';

export type ExerciseRecord = {
  exerciseName: string;
  maxVolume: number; // charge × reps (ou juste charge si reps null)
  maxCharge: number | null;
  maxReps: number | null;
  date: string | null;
};

/** Shape of an exercice entry within a seances row */
interface ExerciceRecordRow {
  nom?: string | null;
  charge?: number | null;
  reps?: number | null;
  [key: string]: unknown;
}

/** Shape of a seances row returned by Supabase (exercices + created_at) */
interface SeanceRecordRow {
  exercices: ExerciceRecordRow[] | null;
  created_at: string | null;
  [key: string]: unknown;
}

export function useExerciseRecords(userId: string | undefined) {
  const [records, setRecords] = useState<Record<string, ExerciseRecord>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const fetchRecords = async () => {
      try {
        // Récupérer toutes les séances de l'utilisateur
        const { data, error } = await supabase
          .from('seances')
          .select('exercices, created_at')
          .eq('id_user', userId)
          .order('created_at', { ascending: false });

        if (error || !data) { setLoading(false); return; }

        const rows = data as SeanceRecordRow[];
        const recordMap: Record<string, ExerciseRecord> = {};

        for (const seance of rows) {
          if (!Array.isArray(seance.exercices)) continue;
          const date = seance.created_at;

          for (const exo of seance.exercices) {
            const name = (exo.nom || '').trim().toLowerCase();
            if (!name) continue;

            const charge = typeof exo.charge === 'number' ? exo.charge : null;
            const reps = typeof exo.reps === 'number' ? exo.reps : null;
            const volume = charge != null && reps != null ? charge * reps : charge ?? 0;

            const existing = recordMap[name];
            if (!existing || volume > existing.maxVolume) {
              recordMap[name] = {
                exerciseName: exo.nom,
                maxVolume: volume,
                maxCharge: charge,
                maxReps: reps,
                date,
              };
            }
          }
        }

        setRecords(recordMap);
      } catch {
        // Silencieux — les records sont optionnels
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [userId]);

  /** Récupère le record pour un exercice donné (par nom) */
  const getRecord = (exerciseName: string): ExerciseRecord | null => {
    const key = exerciseName.trim().toLowerCase();
    return records[key] ?? null;
  };

  return { records, getRecord, loading };
}
