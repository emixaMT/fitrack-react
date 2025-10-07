// FILE: src/app/(tabs)/user.tsx
import React, { useEffect, useState } from 'react';
import { Image, Pressable, View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { router, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../config/supabaseConfig';
import { getUserProfile } from '../../../services/userService'; // <-- adapte le chemin si besoin
import WeightChart from 'components/weightChart';
import HeaderAvatar, { HeroAvatar } from '../../../components/HeaderAvatar';

type RunningPerf = { label: string; value: string };
type HyroxPerf = { label: string; value: string; type: 'solo' | 'double' };
type Performances = {
  squat?: number;
  bench?: number;
  deadlift?: number;
  running?: RunningPerf[];
  hyrox?: HyroxPerf[];
};

export default function UserScreen() {
  const [userName, setUserName] = useState('');
  const [perfs, setPerfs] = useState<Performances | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async (userId: string, userEmail: string | undefined) => {
      const profile = await getUserProfile(userId);
      const fallback = userEmail?.split('@')[0] ?? '';
      setUserName(typeof profile?.name === 'string' && profile.name.trim() ? profile.name : fallback);

      // Charger les performances
      const { data: perfData } = await supabase
        .from('performances')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (perfData) {
        setPerfs({
          squat: perfData.squat,
          bench: perfData.bench,
          deadlift: perfData.deadlift,
          running: perfData.running,
          hyrox: perfData.hyrox,
        });
      }
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user.id, session.user.email);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setLoading(true);
        loadUserData(session.user.id, session.user.email);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="text-gray-500 mt-2">Chargement…</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex h-full relative bg-white">
      <View>
        <LinearGradient
          colors={['#818cf8', '#4f46e5']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200, zIndex: 0 }}
        />
      </View>

      <HeroAvatar />

      {/* Bouton réglages */}
      <Pressable onPress={() => router.push('/compte/edit-perfs')}>
        <Ionicons className="absolute top-16 right-6" size={24} name="settings" color="white" />
      </Pressable>

      <View className="flex flex-1 pt-12 px-6 bg-white mt-48">
        <WeightChart />

        <View className="py-6 space-y-6 flex flex-col gap-8">
          {/* SBD */}
          <View className="bg-white rounded-2xl shadow-md p-5 space-y-2">
            <Image source={require('../../assets/sbd.png')} className="w-36 h-16 mb-6 mx-auto" />
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Squat</Text>
              <Text className="text-indigo-600 font-bold">{perfs?.squat ?? '-'} kg</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Dév. couché</Text>
              <Text className="text-indigo-600 font-bold">{perfs?.bench ?? '-'} kg</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Soulevé de terre</Text>
              <Text className="text-indigo-600 font-bold">{perfs?.deadlift ?? '-'} kg</Text>
            </View>
            <View className="mt-2 border-t border-gray-200 pt-2 flex-row justify-between">
              <Text className="text-gray-500 text-sm">Total</Text>
              <Text className="text-indigo-500 font-semibold">
                {(perfs?.squat ?? 0) + (perfs?.bench ?? 0) + (perfs?.deadlift ?? 0)} kg
              </Text>
            </View>
          </View>

          {/* Running */}
          {!!perfs?.running?.length && (
            <View className="bg-white rounded-2xl shadow-md p-5 space-y-2">
              <Image source={require('../../assets/finishers.png')} className="w-full h-8 mb-6 mx-auto" />
              {perfs!.running!.map((r, i) => (
                <View key={i} className="flex-row justify-between">
                  <Text className="text-gray-600">{r.label}</Text>
                  <Text className="text-indigo-600 font-bold">{r.value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Hyrox */}
          {!!perfs?.hyrox?.length && (
            <View className="bg-white rounded-2xl shadow-md p-5 space-y-3">
              <Image source={require('../../assets/hyrox.webp')} className="w-48 h-16 mb-6 mx-auto" />
              {perfs!.hyrox!.map((h, i) => (
                <View key={i} className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-gray-600">{h.label}</Text>
                    <View className={`px-2 py-1 rounded-full ${h.type === 'solo' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                      <Text className={`text-xs font-semibold ${h.type === 'solo' ? 'text-purple-700' : 'text-blue-700'}`}>
                        {h.type === 'solo' ? 'Solo' : 'Double'}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-indigo-600 font-bold">{h.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
