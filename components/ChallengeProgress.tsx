import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { supabase } from '../config/supabaseConfig';
import Ionicons from '@expo/vector-icons/Ionicons';
import ProgressBar from './progressBar';
import { useTheme } from '../contexts/ThemeContext';

interface ChallengeProgressProps {
  userId: string | null;
}

export const ChallengeProgress: React.FC<ChallengeProgressProps> = ({ userId }) => {
  const { colors } = useTheme();
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
      <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20 }}>
        <Text style={{ color: colors.textTertiary }}>Chargement...</Text>
      </View>
    );
  }

  const milestoneStyle = (done: boolean) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  });

  const milestoneRow = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  };

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20, marginVertical: 24 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="trophy" size={24} color="#FFD700" />
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Défis relevés</Text>
        </View>
        <View style={{ backgroundColor: colors.divider, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 }}>
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12 }}>{completedCount} / 365</Text>
        </View>
      </View>

      <ProgressBar progress={progress} completed={completedCount >= 365} />

      <View style={{ marginTop: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.primary, textAlign: 'center' }}>{percentage}%</Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 4 }}>de l'année complétée</Text>
      </View>

      {/* Milestones */}
      <View style={{ marginTop: 24, gap: 0 }}>
        {[
          { count: 7, label: "7 jours d'affilée" },
          { count: 30, label: "30 jours d'affilée" },
          { count: 100, label: "100 défis" },
        ].map((m, idx) => {
          const done = completedCount >= m.count;
          return (
            <View key={idx} style={milestoneRow}>
              <View style={milestoneStyle(done)}>
                <Ionicons
                  name={done ? "checkmark-circle" : "ellipse-outline"}
                  size={20}
                  color={done ? colors.success : colors.textTertiary}
                />
                <Text style={{ color: done ? colors.success : colors.textTertiary, fontWeight: done ? '600' : '400' }}>
                  {m.label}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.textTertiary }}>{done ? '✓' : `${Math.max(0, m.count - completedCount)} restants`}</Text>
            </View>
          );
        })}

        {/* 365 - special gold */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons
              name={completedCount >= 365 ? "checkmark-circle" : "ellipse-outline"}
              size={20}
              color={completedCount >= 365 ? "#FFD700" : colors.textTertiary}
            />
            <Text style={{ color: completedCount >= 365 ? '#FFD700' : colors.textTertiary, fontWeight: completedCount >= 365 ? '700' : '400' }}>
              365 défis - Année complète ! 🏆
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.textTertiary }}>{completedCount >= 365 ? '✓' : `${Math.max(0, 365 - completedCount)} restants`}</Text>
        </View>
      </View>
    </View>
  );
};
