// FILE: hooks/useWeightHistory.ts
import { useEffect, useState } from 'react';
import { supabase } from '../config/supabaseConfig';

type WeightEntry = { date: Date; value: number };

/**
 * Hook pour récupérer l'historique de poids de l'utilisateur connecté
 */
export function useWeightHistory(): WeightEntry[] {
  const [weights, setWeights] = useState<WeightEntry[]>([]);

  useEffect(() => {
    let realtimeChannel: any;

    const loadWeights = async (userId: string) => {
      // Charger les données initiales
      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error loading weights:', error);
        setWeights([]);
        return;
      }

      const items = (data || []).map((entry: any) => ({
        date: new Date(entry.date),
        value: Number(entry.value),
      }));
      setWeights(items);

      // Souscrire aux changements en temps réel
      realtimeChannel = supabase
        .channel(`weights-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'weight_entries',
            filter: `user_id=eq.${userId}`,
          },
          async () => {
            // Recharger les données quand il y a un changement
            const { data: updatedData } = await supabase
              .from('weight_entries')
              .select('*')
              .eq('user_id', userId)
              .order('date', { ascending: true });

            if (updatedData) {
              const items = updatedData.map((entry: any) => ({
                date: new Date(entry.date),
                value: Number(entry.value),
              }));
              setWeights(items);
            }
          }
        )
        .subscribe();
    };

    // Écouter les changements d'authentification
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadWeights(session.user.id);
      } else {
        setWeights([]);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }

      if (session?.user) {
        loadWeights(session.user.id);
      } else {
        setWeights([]);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, []);

  return weights;
}
