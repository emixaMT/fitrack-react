// FILE: src/hooks/useHeaderAvatar.ts
import { useEffect, useState } from "react";
import type { ImageSourcePropType } from "react-native";
import { supabase } from "../config/supabaseConfig";
import { getAvatarSourceById } from "../constantes/avatars";

export function useHeaderAvatar(fallback: ImageSourcePropType) {
  const [source, setSource] = useState<ImageSourcePropType>(fallback);

  useEffect(() => {
    let realtimeChannel: any;

    const loadAvatar = async (userId: string) => {
      const { data } = await supabase
        .from('users')
        .select('avatar_id, photo_url')
        .eq('id', userId)
        .single();

      if (!data) {
        setSource(fallback);
        return;
      }

      // 1) Avatar local par id -> require(...)
      if (typeof data?.avatar_id === "string" && data.avatar_id) {
        setSource(getAvatarSourceById(data.avatar_id));
        return;
      }

      // 2) photoURL depuis la base
      if (data?.photo_url) {
        setSource({ uri: data.photo_url });
      } else {
        setSource(fallback);
      }

      // Realtime subscription
      realtimeChannel = supabase
        .channel(`avatar-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${userId}`,
          },
          (payload) => {
            const newData = payload.new as any;
            if (typeof newData?.avatar_id === "string" && newData.avatar_id) {
              setSource(getAvatarSourceById(newData.avatar_id));
            } else if (newData?.photo_url) {
              setSource({ uri: newData.photo_url });
            } else {
              setSource(fallback);
            }
          }
        )
        .subscribe();
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadAvatar(session.user.id);
      } else {
        setSource(fallback);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }

      if (session?.user) {
        loadAvatar(session.user.id);
      } else {
        setSource(fallback);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [fallback]);

  return { source };
}
