import { supabase } from '../config/supabaseConfig';
import { logError } from './logger';

/**
 * Crée un channel realtime de façon sécurisée.
 *
 * Problème: supabase.channel(name) retourne le MÊME objet channel si appelé
 * deux fois avec le même nom. Si le premier est déjà subscribé, le deuxième
 * .on('postgres_changes') lance: "cannot add postgres_changes callbacks after subscribe()"
 *
 * removeChannel() est async — le channel n'est pas retiré immédiatement du cache,
 * donc supabase.channel(name) peut retourner l'ancien channel déjà subscribé.
 *
 * Solution: utiliser un nom unique (avec compteur) pour chaque channel.
 * Plus aucun collision possible. Les anciens channels sont nettoyés par
 * le useEffect cleanup (supabase.removeChannel) du composant appelant.
 *
 * Usage:
 *   const channel = safeRealtimeChannel(
 *     `streak-${userId}`,
 *     { event: '*', schema: 'public', table: 'streak_history', filter: `user_id=eq.${userId}` },
 *     (payload) => { ... }
 *   );
 *   // cleanup: if (channel) supabase.removeChannel(channel);
 */
let channelCounter = 0;

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
    // Nom unique pour éviter tout collision avec un channel existant
    const uniqueName = `${name}-${++channelCounter}`;

    return supabase
      .channel(uniqueName)
      .on('postgres_changes', filter, callback as never)
      .subscribe();
  } catch (e) {
    logError(`Realtime channel "${name}" failed:`, e);
    return null;
  }
}
