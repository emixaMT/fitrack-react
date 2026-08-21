import { supabase } from '../config/supabaseConfig';
import { logError } from './logger';

/**
 * Crée un channel realtime de façon sécurisée.
 *
 * Problème: supabase.channel(name) retourne le MÊME objet channel si appelé
 * deux fois avec le même nom. Si le premier est déjà subscribé, le deuxième
 * .on('postgres_changes') lance: "cannot add postgres_changes callbacks after subscribe()"
 *
 * Solution: supprimer tout channel existant avec le même nom avant d'en créer un nouveau.
 *
 * Usage:
 *   const channel = safeRealtimeChannel(
 *     `streak-${userId}`,
 *     { event: '*', schema: 'public', table: 'streak_history', filter: `user_id=eq.${userId}` },
 *     (payload) => { ... }
 *   );
 *   // cleanup: supabase.removeChannel(channel);
 */
export function safeRealtimeChannel(
  name: string,
  filter: {
    event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
    schema: string;
    table: string;
    filter?: string;
  },
  callback: (payload: Record<string, unknown>) => void
): ReturnType<typeof supabase.channel> | null {
  try {
    // Supprimer tout channel existant avec le même nom
    const existing = supabase.getChannels().find((c) => c.topic === name);
    if (existing) {
      supabase.removeChannel(existing);
    }

    return supabase
      .channel(name)
      .on('postgres_changes', filter, callback as never)
      .subscribe();
  } catch (e) {
    logError(`Realtime channel "${name}" failed:`, e);
    return null;
  }
}
