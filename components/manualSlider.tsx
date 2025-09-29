// FILE: components/LastSeancesSlider.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Dimensions, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';

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

  useEffect(() => {
    let unsubFS: undefined | (() => void);

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // stop previous FS listener if user changes
      if (unsubFS) {
        unsubFS();
        unsubFS = undefined;
      }

      if (!user) {
        setSeances([]);
        setLoading(false);
        return;
      }

      // Dernières 6 séances de l'utilisateur (nécessite peut-être un index composite)
      const q = query(
        collection(db, 'Seances'),
        where('id_user', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(6)
      );

      unsubFS = onSnapshot(
        q,
        (snap) => {
          const items: Seance[] = snap.docs.map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              nom: data?.nom ?? 'Sans titre',
              category: data?.category,
            };
          });
          setSeances(items);
          setLoading(false);
        },
        () => setLoading(false)
      );
    });

    return () => {
      unsubAuth();
      if (unsubFS) unsubFS();
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
