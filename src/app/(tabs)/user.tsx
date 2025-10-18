// FILE: src/app/(tabs)/user.tsx
import React, { useEffect, useState, useRef } from 'react';
import { Image, Pressable, View, Text, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { router, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../config/supabaseConfig';
import { getUserProfile } from '../../../services/userService'; // <-- adapte le chemin si besoin
import WeightChart from 'components/weightChart';
import HeaderAvatar, { HeroAvatar } from '../../../components/HeaderAvatar';
import { useBadges } from '../../../hooks/useBadges';
import { BadgeItem } from '../../../components/badges';
import { Badge } from '../../../services/badgeService';
import { useStreak } from '../../../hooks/useStreak';
import { StreakFlame } from '../../../components/StreakFlame';
import { ChallengeCalendar } from '../../../components/ChallengeCalendar';
import { useTheme } from '../../../contexts/ThemeContext';
import { BadgeTooltipModal } from '../../../components/badges/BadgeTooltipModal';
import { useLevel } from '../../../contexts/LevelContext';
import LevelBar from '../../../components/LevelBar';
import WorkoutDistributionChart from '../../../components/WorkoutDistributionChart';

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
  const [userId, setUserId] = useState<string | null>(null);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [isBadgeUnlocked, setIsBadgeUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<'performances' | 'success'>('performances');
  
  // Animation pour le swipe entre onglets
  const slideAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;

  const { allBadges, userBadges, badgeStats } = useBadges(userId);
  const { streakDays = 0 } = useStreak(userId) || {};
  const { isDarkMode, toggleDarkMode, colors } = useTheme();
  const { level, currentXP, xpRequired, progressPercentage, totalXP, loading: levelLoading } = useLevel();

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
        setUserId(session.user.id);
        loadUserData(session.user.id, session.user.email);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setLoading(true);
        loadUserData(session.user.id, session.user.email);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Animation lors du changement d'onglet
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeTab === 'performances' ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  }, [activeTab]);

  const handleTabChange = (tab: 'performances' | 'success') => {
    setActiveTab(tab);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              router.replace('/');
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Chargement…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, position: 'relative', backgroundColor: colors.background }}>
      <View>
        <LinearGradient
          colors={['#818cf8', '#4f46e5']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 168, zIndex: 0 }}
        />
      </View>

      <HeroAvatar />

      {/* Boutons réglages et dark mode */}
      <View className="absolute top-16 right-6 flex-row gap-3">
        {/*<TouchableOpacity onPress={toggleDarkMode} className="p-1">
          <Ionicons name={isDarkMode ? "sunny" : "moon"} size={24} color="white" />
        </TouchableOpacity>*/}
        <Pressable onPress={() => router.push('/compte/edit-perfs')}>
          <Ionicons size={24} name="settings" color="white" />
        </Pressable>
      </View>
      
      {/* Streak Badge */}
      <View className="absolute top-24 left-6">
        <StreakFlame streakDays={streakDays} size="medium" />
      </View>

      <View style={{ flex: 1, paddingTop: 12, paddingHorizontal: 24, backgroundColor: colors.background, marginTop: 192 }}>
        
        {/* Système d'onglets */}
        <View style={{ 
          backgroundColor: colors.card,
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
          overflow: 'hidden',
        }}>
          <View style={{ flexDirection: 'row' }}>
            {/* Onglet Performances */}
            <Pressable
              onPress={() => handleTabChange('performances')}
              style={{
                flex: 1,
                paddingVertical: 16,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <Ionicons 
                name="barbell" 
                size={20} 
                color={activeTab === 'performances' ? '#4f46e5' : '#c4b4ff'}
              />
              <Text style={{
                fontWeight: activeTab === 'performances' ? '700' : '600',
                fontSize: 15,
                color: activeTab === 'performances' ? '#4f46e5' : '#c4b4ff',
              }}>Performances</Text>
              
              {/* Barre indicatrice */}
              {activeTab === 'performances' && (
                <View style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  backgroundColor: '#4f46e5',
                  borderTopLeftRadius: 2,
                  borderTopRightRadius: 2,
                }} />
              )}
            </Pressable>

            {/* Séparateur */}
            <View style={{
              width: 1,
              backgroundColor: isDarkMode ? '#3d3d3d' : '#e5e7eb',
              marginVertical: 12,
            }} />

            {/* Onglet Succès */}
            <Pressable
              onPress={() => handleTabChange('success')}
              style={{
                flex: 1,
                paddingVertical: 16,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <Ionicons 
                name="trophy" 
                size={20} 
                color={activeTab === 'success' ? '#4f46e5' : '#c4b4ff'}
              />
              <Text style={{
                fontWeight: activeTab === 'success' ? '700' : '600',
                fontSize: 15,
                color: activeTab === 'success' ? '#4f46e5' : '#c4b4ff',
              }}>Succès</Text>
              
              {/* Barre indicatrice */}
              {activeTab === 'success' && (
                <View style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  backgroundColor: '#4f46e5',
                  borderTopLeftRadius: 2,
                  borderTopRightRadius: 2,
                }} />
              )}
            </Pressable>
          </View>
        </View>

        {/* Volet Succès */}
        {activeTab === 'success' && (
          <View>
            {/* Section Niveau */}
            {!levelLoading && (
              <LevelBar
                level={level}
                currentXP={currentXP}
                xpRequired={xpRequired}
                progressPercentage={progressPercentage}
                totalXP={totalXP}
                size="medium"
                showDetails={true}
              />
            )}

            <Text className="text-center text-3xl font-bold text-indigo-600 mt-6">Mes succès</Text>

        {/* Section Badges */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, padding: 20, marginVertical: 24 }}>
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center gap-2">
              <Text className="text-xl font-bold text-indigo-600">Badges</Text>
              {badgeStats && (
                <View className="bg-indigo-100 px-3 py-1 rounded-full">
                  <Text className="text-indigo-700 font-semibold text-xs">
                    {badgeStats.total_badges} / {allBadges.length}
                  </Text>
                </View>
              )}
            </View>
            {badgeStats && (
              <View className="items-end">
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Points</Text>
                <Text style={{ color: colors.indigo, fontWeight: 'bold', fontSize: 16 }}>{badgeStats.total_points}</Text>
              </View>
            )}
          </View>

          {/* Badges Grid */}
          <View className="flex-row flex-wrap justify-center">
            {(() => {
              // Créer un Set des badge_id débloqués
              const unlockedBadgeIds = new Set(userBadges.map((ub) => ub.badge_id));

              // Définir l'ordre des raretés
              const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };

              // Séparer les badges en débloqués et bloqués
              const unlockedBadges: Badge[] = [];
              const lockedBadges: Badge[] = [];

              allBadges.forEach((badge) => {
                if (unlockedBadgeIds.has(badge.id)) {
                  unlockedBadges.push(badge);
                } else {
                  lockedBadges.push(badge);
                }
              });

              // Trier les DÉBLOQUÉS : legendary → epic → rare → common (décroissant)
              const sortUnlockedByRarity = (a: Badge, b: Badge) => {
                const orderA = rarityOrder[a.rarity] || 0;
                const orderB = rarityOrder[b.rarity] || 0;
                return orderB - orderA; // Ordre décroissant
              };

              // Trier les BLOQUÉS : common → rare → epic → legendary (croissant)
              const sortLockedByRarity = (a: Badge, b: Badge) => {
                const orderA = rarityOrder[a.rarity] || 999;
                const orderB = rarityOrder[b.rarity] || 999;
                return orderA - orderB; // Ordre croissant
              };

              unlockedBadges.sort(sortUnlockedByRarity);
              lockedBadges.sort(sortLockedByRarity);

              // Combiner : débloqués en premier, puis bloqués
              const sortedBadges = [...unlockedBadges, ...lockedBadges];

              // Limiter à 3 badges si le toggle n'est pas activé
              const badgesToShow = showAllBadges ? sortedBadges : sortedBadges.slice(0, 3);

              return badgesToShow.map((badge) => {
                const isUnlocked = unlockedBadgeIds.has(badge.id);
                return (
                  <View key={badge.id} style={{ width: '33.33%', alignItems: 'center' }}>
                    <BadgeItem 
                      badge={badge} 
                      unlocked={isUnlocked} 
                      size="small"
                      onPress={() => {
                        setSelectedBadge(badge);
                        setIsBadgeUnlocked(isUnlocked);
                        setBadgeModalVisible(true);
                      }}
                    />
                  </View>
                );
              });
            })()}
          </View>

          {/* Toggle Button */}
          {allBadges.length > 3 && (
            <TouchableOpacity
              onPress={() => setShowAllBadges(!showAllBadges)}
              className="mt-4 py-2 px-4 bg-indigo-50 rounded-lg flex-row items-center justify-center gap-2"
            >
              <Text className="text-indigo-600 font-semibold text-sm">
                {showAllBadges ? 'Voir moins' : `Voir tous les badges (${allBadges.length})`}
              </Text>
              <Ionicons
                name={showAllBadges ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#4f46e5"
              />
            </TouchableOpacity>
          )}
        </View>
        
            {/* Section Défis */}
            <ChallengeCalendar userId={userId} />
          </View>
        )}

        {/* Volet Performances */}
        {activeTab === 'performances' && (
          <View>
            <Text className="text-center text-3xl font-bold text-indigo-600 mb-6">Mon évolution</Text>
            
            <View style={{ backgroundColor: colors.card, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, padding: 20, marginBottom: 24 }}>
              <WeightChart />
            </View>

            {/* Graphique de répartition des séances */}
            <WorkoutDistributionChart userId={userId} />

            <Text className="text-center text-3xl font-bold text-indigo-600 mb-6">Mes performances</Text>

            <View className="py-6 space-y-6 flex flex-col gap-8">
          {/* SBD */}
          <View style={{ backgroundColor: colors.card, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, padding: 20 }}>
            <Image source={require('../../assets/sbd.png')} className="w-36 h-16 mb-6 mx-auto" />
            <View className="flex-row justify-between">
              <Text style={{ color: colors.textSecondary }}>Squat</Text>
              <Text style={{ color: colors.indigo, fontWeight: 'bold' }}>{perfs?.squat ?? '-'} kg</Text>
            </View>
            <View className="flex-row justify-between">
              <Text style={{ color: colors.textSecondary }}>Dév. couché</Text>
              <Text style={{ color: colors.indigo, fontWeight: 'bold' }}>{perfs?.bench ?? '-'} kg</Text>
            </View>
            <View className="flex-row justify-between">
              <Text style={{ color: colors.textSecondary }}>Soulevé de terre</Text>
              <Text style={{ color: colors.indigo, fontWeight: 'bold' }}>{perfs?.deadlift ?? '-'} kg</Text>
            </View>
            <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: isDarkMode ? '#3d3d3d' : '#e5e7eb', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Total</Text>
              <Text style={{ color: colors.indigo, fontWeight: '600' }}>
                {(perfs?.squat ?? 0) + (perfs?.bench ?? 0) + (perfs?.deadlift ?? 0)} kg
              </Text>
            </View>
          </View>

          {/* Running */}
          {!!perfs?.running?.length && (
            <View style={{ backgroundColor: colors.card, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, padding: 20 }}>
              <Image source={require('../../assets/finishers.png')} className="w-full h-8 mb-6 mx-auto" />
              {perfs!.running!.map((r, i) => (
                <View key={i} className="flex-row justify-between">
                  <Text style={{ color: colors.textSecondary }}>{r.label}</Text>
                  <Text style={{ color: colors.indigo, fontWeight: 'bold' }}>{r.value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Hyrox */}
          {!!perfs?.hyrox?.length && (
            <View style={{ backgroundColor: colors.card, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, padding: 20 }}>
              <Image source={require('../../assets/hyrox.webp')} className="w-48 h-16 mb-6 mx-auto" />
              {perfs!.hyrox!.map((h, i) => (
                <View key={i} className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-2">
                    <Text style={{ color: colors.textSecondary }}>{h.label}</Text>
                    <View className={`px-2 py-1 rounded-full ${h.type === 'solo' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                      <Text className={`text-xs font-semibold ${h.type === 'solo' ? 'text-purple-700' : 'text-blue-700'}`}>
                        {h.type === 'solo' ? 'Solo' : 'Double'}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: colors.indigo, fontWeight: 'bold' }}>{h.value}</Text>
                </View>
              ))}
            </View>
          )}
            </View>
          </View>
        )}

        {/* Bouton de déconnexion (toujours visible) */}
        <Pressable
          onPress={handleLogout}
          className="bg-red-50 rounded-2xl p-4 flex-row items-center justify-center gap-3 mb-8 mt-8"
        >
          <Ionicons name="log-out-outline" size={24} color="#dc2626" />
          <Text className="text-red-600 font-semibold text-base">Se déconnecter</Text>
        </Pressable>
      </View>

      {/* Modal de tooltip des badges */}
      <BadgeTooltipModal
        visible={badgeModalVisible}
        badge={selectedBadge}
        unlocked={isBadgeUnlocked}
        onClose={() => setBadgeModalVisible(false)}
      />
    </ScrollView>
  );
}
