// FILE: components/LastSeancesSlider.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Dimensions, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../config/supabaseConfig';

const screenWidth = Dimensions.get('window').width;

type Seance = {
  id: string;
  nom: string;
  category?: 'musculation' | 'crossfit' | 'running' | 'velo' | string;
};

function getCategoryImage(cat?: string) {
  const key = (cat || '').toLowerCase();
  try {
    if (key === 'musculation') return require('../src/assets/musculation.png');
    if (key === 'crossfit')    return require('../src/assets/crossfit.png');
    if (key === 'running')     return require('../src/assets/running.png');
    if (key === 'velo')        return require('../src/assets/velo.png');
  } catch {
    // ignore require errors (packager/chemin)
  }
  return require('../src/assets/musculation.png');
}

export default function LastSeancesSlider() {
  const router = useRouter();
  const [seances, setSeances] = useState<Seance[]>([]);
  const [loading, setLoading] = useState(true);

  // Fonction de chargement des séances (réutilisable)
  const loadSeancesData = async (userId: string) => {
    const { data, error } = await supabase
      .from('seances')
      .select('*')
      .eq('id_user', userId)
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Error loading seances:', error);
      setSeances([]);
      setLoading(false);
      return;
    }

    const items: Seance[] = (data || []).map((d: any) => ({
      id: d.id,
      nom: d.nom ?? 'Sans titre',
      category: d.category,
    }));
    setSeances(items);
    setLoading(false);
  };

  useEffect(() => {
    let realtimeChannel: any;

    const setupRealtime = async (userId: string) => {
      // Charger initialement
      await loadSeancesData(userId);

      // Souscrire aux changements en temps réel
      realtimeChannel = supabase
        .channel(`last-seances-slider-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'seances',
            filter: `id_user=eq.${userId}`,
          },
          async (payload) => {
            console.log('🔄 [ManualSlider] Realtime update:', payload.eventType);
            await loadSeancesData(userId);
          }
        )
        .subscribe();
    };

    // Écouter les changements d'authentification
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setupRealtime(session.user.id);
      } else {
        setSeances([]);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }

      if (session?.user) {
        setLoading(true);
        setupRealtime(session.user.id);
      } else {
        setSeances([]);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, []);

  return (
    <View className="mt-2">
      {loading ? (
        <View className="py-4 flex-row">
          {[...Array(3)].map((_, i) => (
            <View
              key={i}
              className="bg-gray-200 rounded-lg mx-2"
              style={{ width: screenWidth / 3, height: 150 }}
            />
          ))}
        </View>
      ) : (
        <FlatList
          className="py-4"
          data={seances}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/seances/${item.id}`)}
              className="bg-white rounded-lg justify-center items-center"
              style={{
                width: screenWidth / 3,
                height: 150,
                shadowColor: '#4f46e5',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 8,
              }}
            >
              <Image source={getCategoryImage(item.category)} className="w-24 h-24" />
              <Text className="text-indigo-600 text-lg font-bold" numberOfLines={1}>
                {item.nom}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
