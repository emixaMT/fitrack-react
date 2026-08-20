// FILE: src/app/(tabs)/user.tsx
import React, { useEffect, useState, useRef } from 'react';
import { Image, Pressable, View, Text, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { router, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../config/supabaseConfig';
import { getUserProfile } from '../../../services/userService';
import WeightChart from '../../../components/weightChart';
import HeaderAvatar, { HeroAvatar } from '../../../components/HeaderAvatar';
import { useHeaderAvatar } from '../../../hooks/useHeaderAvatar';
import { useBadges } from '../../../hooks/useBadges';
import { BadgeItem } from '../../../components/badges';
import { Badge } from '../../../services/badgeService';
import { useStreak } from '../../../hooks/useStreak';
import { StreakFlame } from '../../../components/StreakFlame';
import { ChallengeCalendar } from '../../../components/ChallengeCalendar';
import { useTheme, COLOR_SCHEMES, ColorScheme } from '../../../contexts/ThemeContext';
import { BadgeTooltipModal } from '../../../components/badges/BadgeTooltipModal';
import { useLevel } from '../../../contexts/LevelContext';
import { useAuth } from '../../../contexts/AuthContext';
import { cardStyle } from '../../../utils/styles';
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

const FALLBACK = require('../../../src/assets/fallback.png');

function HeroAvatarInline({ size = 56 }: { size?: number }) {
  const { source } = useHeaderAvatar(FALLBACK);
  return (
    <Image source={source} style={{ width: size, height: size, borderRadius: size / 2 }} resizeMode="cover" />
  );
}

export default function UserScreen() {
  const { user, signOut } = useAuth();
  const [userName, setUserName] = useState('');
  const [perfs, setPerfs] = useState<Performances | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [isBadgeUnlocked, setIsBadgeUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<'performances' | 'success'>('performances');
  const screenWidth = Dimensions.get('window').width;

  const { allBadges, userBadges, badgeStats } = useBadges(user?.id ?? null);
  const { streakDays = 0 } = useStreak(user?.id ?? null) || {};
  const { isDarkMode, toggleDarkMode, colors, colorScheme, setColorScheme } = useTheme();
  const { level, currentXP, xpRequired, progressPercentage, totalXP, loading: levelLoading } = useLevel();

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    const loadUserData = async (userId: string, userEmail: string | undefined) => {
      const profile = await getUserProfile(userId);
      if (!mounted) return;
      const fallback = userEmail?.split('@')[0] ?? '';
      setUserName(typeof profile?.name === 'string' && profile.name.trim() ? profile.name : fallback);

      // Charger les performances
      const { data: perfData } = await supabase
        .from('performances')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!mounted) return;
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

    setLoading(true);
    loadUserData(user.id, user.email);

    return () => { mounted = false; };
  }, [user?.id]);

  const handleTabChange = (tab: 'performances' | 'success') => {
    setActiveTab(tab);
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: () => signOut().catch(() => Alert.alert('Erreur', 'Impossible de se déconnecter')),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Chargement…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
      {/* Header with blobs */}
      <View style={{ backgroundColor: colors.primary, paddingTop: 50, paddingHorizontal: 20, paddingBottom: 60, overflow: 'hidden', position: 'relative' }}>
        {/* Decorative blobs */}
        <View style={{
          position: 'absolute', top: -20, left: -30, width: 130, height: 130,
          borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.08)',
        }} />
        <View style={{
          position: 'absolute', top: 30, left: 70, width: 70, height: 70,
          borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.06)',
        }} />
        <View style={{
          position: 'absolute', bottom: -50, right: -20, width: 150, height: 150,
          borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.05)',
        }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, zIndex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <HeroAvatarInline size={56} />
            <View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>{userName || 'Athlète'}</Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Niveau {level} · {totalXP} XP</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={toggleDarkMode}
              style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name={isDarkMode ? "sunny" : "moon"} size={18} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => router.push('/compte/edit-perfs')}
              style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons size={18} name="settings-outline" color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Stats grid 2x2 inside header */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ionicons name="flame" size={12} color="#FFD700" />
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>Streak</Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>{streakDays}<Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}> j</Text></Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ionicons name="trophy" size={12} color="rgba(255,255,255,0.8)" />
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>Niveau</Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>{level}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ionicons name="star" size={12} color="rgba(255,255,255,0.8)" />
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>XP total</Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>{totalXP}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ionicons name="medal" size={12} color="rgba(255,255,255,0.8)" />
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>Badges</Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>{badgeStats?.total_badges ?? 0}</Text>
          </View>
        </View>
      </View>

      {/* Content overlapping header */}
      <View style={{ paddingHorizontal: 16, marginTop: -32 }}>

        {/* Système d'onglets */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.divider,
            borderRadius: 14,
            padding: 4,
            marginBottom: 24,
          }}
        >
          {/* Onglet Performances */}
          <Pressable
            onPress={() => handleTabChange('performances')}
            style={{
              flex: 1,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: activeTab === 'performances' ? colors.card : 'transparent',
              borderRadius: 10,
            }}
          >
            <Ionicons name="barbell" size={18} color={activeTab === 'performances' ? colors.primary : colors.textTertiary} />
            <Text style={{
              fontWeight: activeTab === 'performances' ? '700' : '600',
              fontSize: 14,
              color: activeTab === 'performances' ? colors.primary : colors.textTertiary,
            }}>Performances</Text>
          </Pressable>

          {/* Onglet Succès */}
          <Pressable
            onPress={() => handleTabChange('success')}
            style={{
              flex: 1,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: activeTab === 'success' ? colors.card : 'transparent',
              borderRadius: 10,
            }}
          >
            <Ionicons name="trophy" size={18} color={activeTab === 'success' ? colors.primary : colors.textTertiary} />
            <Text style={{
              fontWeight: activeTab === 'success' ? '700' : '600',
              fontSize: 14,
              color: activeTab === 'success' ? colors.primary : colors.textTertiary,
            }}>Succès</Text>
          </Pressable>
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

            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center', marginTop: 24, marginBottom: 16 }}>Mes succès</Text>

        {/* Section Badges */}
        <View style={[cardStyle(colors, 'sm'), { padding: 20, marginVertical: 16 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Badges</Text>
              {badgeStats && (
                <View style={{ backgroundColor: colors.divider, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 }}>
                  <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12 }}>
                    {badgeStats.total_badges} / {allBadges.length}
                  </Text>
                </View>
              )}
            </View>
            {badgeStats && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Points</Text>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>{badgeStats.total_points}</Text>
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
              style={{
                marginTop: 16,
                paddingVertical: 10,
                paddingHorizontal: 16,
                backgroundColor: colors.divider,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>
                {showAllBadges ? 'Voir moins' : `Voir tous les badges (${allBadges.length})`}
              </Text>
              <Ionicons
                name={showAllBadges ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
        
            {/* Section Défis */}
            <ChallengeCalendar userId={user?.id ?? null} />
          </View>
        )}

        {/* Volet Performances */}
        {activeTab === 'performances' && (
          <View>
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 20 }}>Mon évolution</Text>

            <View style={[cardStyle(colors, 'sm'), { padding: 20, marginBottom: 20 }]}>
              <WeightChart />
            </View>

            {/* Graphique de répartition des séances */}
            <WorkoutDistributionChart userId={user?.id ?? null} />

            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center', marginTop: 24, marginBottom: 20 }}>Mes performances</Text>

            <View className="py-6 space-y-6 flex flex-col gap-6">
          {/* SBD */}
          <View style={[cardStyle(colors, 'sm'), { padding: 20 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.divider, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="barbell" size={22} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Force (SBD)</Text>
            </View>
            <View className="flex-row justify-between">
              <Text style={{ color: colors.textSecondary }}>Squat</Text>
              <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{perfs?.squat ?? '-'} kg</Text>
            </View>
            <View className="flex-row justify-between">
              <Text style={{ color: colors.textSecondary }}>Dév. couché</Text>
              <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{perfs?.bench ?? '-'} kg</Text>
            </View>
            <View className="flex-row justify-between">
              <Text style={{ color: colors.textSecondary }}>Soulevé de terre</Text>
              <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{perfs?.deadlift ?? '-'} kg</Text>
            </View>
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.divider, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Total</Text>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>
                {(perfs?.squat ?? 0) + (perfs?.bench ?? 0) + (perfs?.deadlift ?? 0)} kg
              </Text>
            </View>
          </View>

          {/* Running */}
          {!!perfs?.running?.length && (
            <View style={[cardStyle(colors, 'sm'), { padding: 20 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.divider, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="footsteps" size={22} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Running</Text>
              </View>
              {perfs!.running!.map((r, i) => (
                <View key={i} className="flex-row justify-between">
                  <Text style={{ color: colors.textSecondary }}>{r.label}</Text>
                  <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{r.value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Hyrox */}
          {!!perfs?.hyrox?.length && (
            <View style={[cardStyle(colors, 'sm'), { padding: 20 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.divider, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="timer" size={22} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Hyrox</Text>
              </View>
              {perfs!.hyrox!.map((h, i) => (
                <View key={i} className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-2">
                    <Text style={{ color: colors.textSecondary }}>{h.label}</Text>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999, backgroundColor: h.type === 'solo' ? 'rgba(124,58,237,0.15)' : 'rgba(59,130,246,0.15)' }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: h.type === 'solo' ? '#0D9488' : '#3b82f6' }}>
                        {h.type === 'solo' ? 'Solo' : 'Double'}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{h.value}</Text>
                </View>
              ))}
            </View>
          )}
            </View>
          </View>
        )}

        {/* Personnalisation */}
        <View style={[cardStyle(colors, 'sm'), { padding: 20, marginBottom: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Apparence</Text>
          </View>

          {/* Dark mode toggle */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name={isDarkMode ? "moon" : "sunny"} size={20} color={colors.textSecondary} />
              <Text style={{ fontSize: 15, color: colors.text }}>Mode sombre</Text>
            </View>
            <Pressable
              onPress={toggleDarkMode}
              style={{
                width: 52, height: 30, borderRadius: 15,
                backgroundColor: isDarkMode ? colors.primary : colors.divider,
                padding: 3, justifyContent: 'center',
              }}
            >
              <View style={{
                width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff',
                transform: [{ translateX: isDarkMode ? 22 : 0 }],
              }} />
            </Pressable>
          </View>

          {/* Color scheme picker */}
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 12 }}>Couleur principale</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 4 }}>
            {COLOR_SCHEMES.map((s) => {
              const active = colorScheme === s.key;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => setColorScheme(s.key as ColorScheme)}
                  style={{ alignItems: 'center', gap: 6 }}
                >
                  <View style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: s.color,
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: active ? 3 : 0,
                    borderColor: colors.text,
                  }}>
                    {active && <Ionicons name="checkmark" size={20} color="#fff" />}
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: active ? colors.text : colors.textTertiary }}>
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Bouton de déconnexion */}
        <Pressable
          onPress={handleLogout}
          style={{
            backgroundColor: colors.divider,
            borderRadius: 16,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginBottom: 32,
            marginTop: 24,
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={{ color: colors.error, fontWeight: '600', fontSize: 15 }}>Se déconnecter</Text>
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
