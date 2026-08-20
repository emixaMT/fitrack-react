import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Dimensions, Image, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import ProgressBar from '../../../components/progressBar';
import ManualSlider from '../../../components/manualSlider';
import StepCounter from '../../../components/podo';
import { useStreak } from '../../../hooks/useStreak';
import { StreakFlame } from '../../../components/StreakFlame';
import { LevelBadge } from '../../../components/LevelBadge';
import { getChallengeDetailsForDay, getDayOfYear } from '../../../constants/challengeDetails';
import { DailyChallengeModal } from '../../../components/DailyChallengeModal';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLevel } from '../../../contexts/LevelContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useHeaderAvatar } from '../../../hooks/useHeaderAvatar';
import { SessionTypeModal } from '../../../components/SessionTypeModal';
import { useMonthlyProgress } from '../../../hooks/useMonthlyProgress';
import { useGoalReminders } from '../../../hooks/useGoalReminders';
import { supabase } from '../../../config/supabaseConfig';
import { cardStyle } from '../../../utils/styles';
import WorkoutDistributionChart from '../../../components/WorkoutDistributionChart';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const { user } = useAuth();
  const { addXP, level, totalXP } = useLevel();
  const { colors } = useTheme();
  const router = useRouter();

  const { sessions, target, progress, monthKey, completed, handleCreateSession } = useMonthlyProgress();
  const { streakDays = 0 } = useStreak(user?.id ?? null) || {};

  const [modalVisible, setModalVisible] = useState(false);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [sessionTypeModalVisible, setSessionTypeModalVisible] = useState(false);

  useGoalReminders(completed, monthKey);

  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const dayOfYear = getDayOfYear();
      const { data, error } = await supabase
        .from('completed_challenges').select('id')
        .eq('user_id', user.id).eq('day_of_year', dayOfYear).eq('year', new Date().getFullYear())
        .maybeSingle();
      setChallengeCompleted(!error && !!data);
    };
    check();
  }, [user?.id]);

  const handleAddSession = useCallback(() => setSessionTypeModalVisible(true), []);

  async function handleCompleteChallenge() {
    if (!user) { Alert.alert('Erreur', 'Reconnecte-toi.'); return; }
    try {
      const dayOfYear = getDayOfYear();
      const challengeDetails = getChallengeDetailsForDay(dayOfYear);
      const challenge = challengeDetails?.titre || 'Défi du jour';
      const { error } = await supabase.from('completed_challenges').insert({
        user_id: user.id, day_of_year: dayOfYear, year: new Date().getFullYear(), challenge_text: challenge,
      });
      if (error) {
        if (error.code !== '23505') { Alert.alert('Erreur', 'Impossible d\'enregistrer'); return; }
      } else {
        const xpResult = await addXP();
        if (xpResult?.leveledUp) {
          Alert.alert('Niveau supérieur !', `Niveau ${xpResult.oldLevel + 1} !\n+20 XP`, [{ text: 'Super !' }]);
        } else {
          Alert.alert('Bravo !', 'Défi relevé !\n+20 XP', [{ text: 'OK' }]);
        }
      }
      setChallengeCompleted(true);
      setModalVisible(false);
    } catch (e: unknown) {
      Alert.alert('Erreur', 'Une erreur est survenue.');
    }
  }

  const challengeDetails = getChallengeDetailsForDay(getDayOfYear());
  const { greeting, userName } = useMemo(() => {
    const hour = new Date().getHours();
    const g = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
    const un = user?.email?.split('@')[0] ?? 'Athlète';
    return { greeting: g, userName: un };
  }, [user?.email]);
  const FALLBACK = require('../../../src/assets/fallback.png');
  const { source: avatarSource } = useHeaderAvatar(FALLBACK);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Le re-render des hooks (useStreak, useLevel, useMonthlyProgress) se fait via les subscriptions realtime
    // On force juste un délai minimal pour l'UX
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
    >
      {/* Header with blobs */}
      <View style={{ backgroundColor: colors.primary, paddingTop: 50, paddingHorizontal: 20, paddingBottom: 60, overflow: 'hidden', position: 'relative' }}>
        {/* Decorative blobs */}
        <View style={{
          position: 'absolute', top: -30, right: -20, width: 120, height: 120,
          borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)',
        }} />
        <View style={{
          position: 'absolute', top: 20, right: 60, width: 80, height: 80,
          borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.06)',
        }} />
        <View style={{
          position: 'absolute', bottom: -40, left: -30, width: 140, height: 140,
          borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.05)',
        }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, zIndex: 1 }}>
          {/* Avatar + greeting */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Image source={avatarSource} style={{ width: 48, height: 48, borderRadius: 24 }} resizeMode="cover" />
            <View>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>{greeting}</Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>{userName}</Text>
            </View>
          </View>
          <LevelBadge level={level} size="large" />
        </View>

        {/* Stats row inside header */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Ionicons name="flame" size={14} color="#FFD700" />
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>Streak</Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>{streakDays}<Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}> j</Text></Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Ionicons name="trophy" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>Niveau</Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>{level}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Ionicons name="star" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>XP</Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>{totalXP}</Text>
          </View>
        </View>
      </View>

      {/* Content overlapping header */}
      <View style={{ paddingHorizontal: 16, marginTop: -32 }}>
        {/* Monthly goal card — big, full width */}
        <View style={[cardStyle(colors, 'md'), { padding: 20 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Objectif du mois
              </Text>
              <Text style={{ fontSize: 32, fontWeight: '800', color: colors.text, marginTop: 4 }}>
                {sessions}<Text style={{ fontSize: 18, color: colors.textTertiary }}>/{target}</Text>
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <View style={{
                width: 64, height: 64, borderRadius: 32,
                backgroundColor: colors.divider, alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: completed ? colors.success : colors.primary }}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>
            </View>
          </View>
          <ProgressBar progress={progress} completed={completed} />
          <Pressable
            onPress={handleAddSession}
            style={{ marginTop: 16, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Ajouter une séance</Text>
          </Pressable>
        </View>

        {/* Daily challenge — full width, visual */}
        <Pressable
          onPress={() => setModalVisible(true)}
          style={[cardStyle(colors, 'sm'), { padding: 20, marginTop: 12 }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.divider, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20 }}>{challengeDetails?.icon || '🏆'}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>Défi du jour</Text>
                <Text style={{ fontSize: 11, color: colors.textTertiary }}>Jour {getDayOfYear()}/365</Text>
              </View>
            </View>
            {challengeCompleted ? (
              <View style={{ backgroundColor: colors.success, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>✓ Fait</Text>
              </View>
            ) : (
              <View style={{ backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>+20 XP</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 10 }} numberOfLines={2}>
            {challengeDetails?.titre || 'Défi du jour'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {challengeDetails && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.divider, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                  <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                  <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500' }}>{challengeDetails.dureeEstimee}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.divider, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                  <Ionicons name="speedometer-outline" size={12} color={colors.textSecondary} />
                  <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500' }}>{challengeDetails.difficulte}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.divider, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500' }}>{challengeDetails.categorie}</Text>
                </View>
              </>
            )}
          </View>
        </Pressable>

        {/* Steps + Distribution row */}
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 12 }}>
          <View style={[cardStyle(colors, 'sm'), { flex: 1, padding: 16 }]}>
            <StepCounter />
          </View>
        </View>

        {/* Workout distribution chart — full width */}
        <View style={[cardStyle(colors, 'sm'), { padding: 20, marginTop: 12 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Ionicons name="pie-chart-outline" size={18} color={colors.primary} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Répartition des séances</Text>
          </View>
          <WorkoutDistributionChart userId={user?.id ?? null} />
        </View>

        {/* Recent workouts — full width slider */}
        <View style={{ marginTop: 24, marginBottom: 40 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Dernières séances</Text>
            <Pressable onPress={() => router.push('/workout')}>
              <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }}>Voir tout →</Text>
            </Pressable>
          </View>
          <ManualSlider />
        </View>
      </View>

      <DailyChallengeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        challenge={challengeDetails?.titre || 'Défi du jour'}
        dayOfYear={getDayOfYear()}
        onComplete={handleCompleteChallenge}
        isCompleted={challengeCompleted}
      />

      <SessionTypeModal
        visible={sessionTypeModalVisible}
        onSelect={handleCreateSession}
        onClose={() => setSessionTypeModalVisible(false)}
      />
    </ScrollView>
  );
}
