import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { supabase } from '../config/supabaseConfig';
import Ionicons from '@expo/vector-icons/Ionicons';
import ProgressBar from './progressBar';

interface ChallengeProgressProps {
  userId: string | null;
}

export const ChallengeProgress: React.FC<ChallengeProgressProps> = ({ userId }) => {
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchCompletedChallenges = async () => {
      const currentYear = new Date().getFullYear();

      const { data, error } = await supabase
        .from('completed_challenges')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('year', currentYear);

      if (!error && data) {
        setCompletedCount(data.length);
      }
      setLoading(false);
    };

    fetchCompletedChallenges();

    // S'abonner aux changements en temps réel
    const channel = supabase
      .channel(`challenges-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'completed_challenges',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchCompletedChallenges();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  const progress = completedCount / 365;
  const percentage = Math.round(progress * 100);

  if (loading) {
    return (
      <View className="bg-white rounded-2xl shadow-md p-5">
        <Text className="text-gray-500">Chargement...</Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl shadow-md p-5 my-6">
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name="trophy" size={24} color="#FFD700" />
          <Text className="text-xl font-bold text-gray-800">Défis relevés</Text>
        </View>
        <View className="bg-indigo-100 px-3 py-1 rounded-full">
          <Text className="text-indigo-700 font-semibold text-xs">{completedCount} / 365</Text>
        </View>
      </View>

      <ProgressBar progress={progress} completed={completedCount >= 365} />

      <View className="mt-4">
        <Text className="text-2xl font-bold text-indigo-600 text-center">{percentage}%</Text>
        <Text className="text-sm text-gray-600 text-center mt-1">de l'année complétée</Text>
      </View>

      {/* Milestones */}
      <View className="mt-6 space-y-2">
        <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
          <View className="flex-row items-center gap-2">
            <Ionicons 
              name={completedCount >= 7 ? "checkmark-circle" : "ellipse-outline"} 
              size={20} 
              color={completedCount >= 7 ? "#22c55e" : "#9ca3af"} 
            />
            <Text className={`${completedCount >= 7 ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
              7 jours d'affilée
            </Text>
          </View>
          <Text className="text-xs text-gray-400">{completedCount >= 7 ? '✓' : `${Math.max(0, 7 - completedCount)} restants`}</Text>
        </View>

        <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
          <View className="flex-row items-center gap-2">
            <Ionicons 
              name={completedCount >= 30 ? "checkmark-circle" : "ellipse-outline"} 
              size={20} 
              color={completedCount >= 30 ? "#22c55e" : "#9ca3af"} 
            />
            <Text className={`${completedCount >= 30 ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
              30 jours d'affilée
            </Text>
          </View>
          <Text className="text-xs text-gray-400">{completedCount >= 30 ? '✓' : `${Math.max(0, 30 - completedCount)} restants`}</Text>
        </View>

        <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
          <View className="flex-row items-center gap-2">
            <Ionicons 
              name={completedCount >= 100 ? "checkmark-circle" : "ellipse-outline"} 
              size={20} 
              color={completedCount >= 100 ? "#22c55e" : "#9ca3af"} 
            />
            <Text className={`${completedCount >= 100 ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
              100 défis
            </Text>
          </View>
          <Text className="text-xs text-gray-400">{completedCount >= 100 ? '✓' : `${Math.max(0, 100 - completedCount)} restants`}</Text>
        </View>

        <View className="flex-row items-center justify-between py-2">
          <View className="flex-row items-center gap-2">
            <Ionicons 
              name={completedCount >= 365 ? "checkmark-circle" : "ellipse-outline"} 
              size={20} 
              color={completedCount >= 365 ? "#FFD700" : "#9ca3af"} 
            />
            <Text className={`${completedCount >= 365 ? 'text-yellow-600 font-bold' : 'text-gray-500'}`}>
              365 défis - Année complète ! 🏆
            </Text>
          </View>
          <Text className="text-xs text-gray-400">{completedCount >= 365 ? '✓' : `${Math.max(0, 365 - completedCount)} restants`}</Text>
        </View>
      </View>
    </View>
  );
};
