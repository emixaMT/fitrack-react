// FILE: src/badges.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '../config/supabaseConfig';
import { useBadges } from '../hooks/useBadges';
import { Badge, BadgeRarity } from '../services/badgeService';
import { BadgeGrid, BadgeModal, BadgeNotification } from '../components/badges';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';

export default function BadgesScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [selectedBadgeUnlocked, setSelectedBadgeUnlocked] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [notificationBadge, setNotificationBadge] = useState<Badge | null>(null);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { allBadges, userBadges, badgeStats, loading, refresh, checkBadges } = useBadges(userId);

  // Récupérer l'utilisateur connecté
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Vérifier les badges au chargement
  useEffect(() => {
    if (userId) {
      checkNewBadges();
    }
  }, [userId]);

  const checkNewBadges = async () => {
    const newBadges = await checkBadges();
    if (newBadges.length > 0) {
      // Afficher une notification pour le premier badge débloqué
      const firstBadge = newBadges[0].badge;
      if (firstBadge) {
        setNotificationBadge(firstBadge);
        setNotificationVisible(true);
      }
    }
  };

  const handleBadgePress = (badge: Badge, unlocked: boolean) => {
    setSelectedBadge(badge);
    setSelectedBadgeUnlocked(unlocked);
    setModalVisible(true);
  };

  const categories = [
    { id: 'all', label: 'Tous', icon: '🏆' },
    { id: 'workout', label: 'Entraînement', icon: '💪' },
    { id: 'consistency', label: 'Régularité', icon: '🔥' },
    { id: 'performance', label: 'Performance', icon: '⭐' },
    { id: 'special', label: 'Spéciaux', icon: '🎯' },
  ];

  const filteredBadges =
    selectedCategory === 'all'
      ? allBadges
      : allBadges.filter((b) => b.category === selectedCategory);

  const rarityOrder: Record<BadgeRarity, number> = {
    common: 1,
    rare: 2,
    epic: 3,
    legendary: 4,
  };

  // Séparer les badges débloqués et bloqués
  const unlockedBadgeIds = new Set(userBadges.map((ub) => ub.badge_id));
  const unlockedBadges: Badge[] = [];
  const lockedBadges: Badge[] = [];

  filteredBadges.forEach((badge) => {
    if (unlockedBadgeIds.has(badge.id)) {
      unlockedBadges.push(badge);
    } else {
      lockedBadges.push(badge);
    }
  });

  // Trier les DÉBLOQUÉS : legendary → epic → rare → common (décroissant)
  unlockedBadges.sort((a, b) => {
    const orderA = rarityOrder[a.rarity] || 0;
    const orderB = rarityOrder[b.rarity] || 0;
    if (orderB !== orderA) {
      return orderB - orderA; // Ordre décroissant
    }
    return b.points - a.points; // Points décroissants
  });

  // Trier les BLOQUÉS : common → rare → epic → legendary (croissant)
  lockedBadges.sort((a, b) => {
    const orderA = rarityOrder[a.rarity] || 999;
    const orderB = rarityOrder[b.rarity] || 999;
    if (orderA !== orderB) {
      return orderA - orderB; // Ordre croissant
    }
    return a.points - b.points; // Points croissants
  });

  // Combiner : débloqués en premier, puis bloqués
  const sortedBadges = [...unlockedBadges, ...lockedBadges];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Badges</Text>
        {badgeStats && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{badgeStats.total_badges}</Text>
              <Text style={styles.statLabel}>Débloqués</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{badgeStats.total_points}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>
        )}
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text
              style={[
                styles.categoryLabel,
                selectedCategory === category.id && styles.categoryLabelActive,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Badge Grid */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.text} />
        }
      >
        <Text style={styles.sectionTitle}>
          {sortedBadges.length} badge{sortedBadges.length > 1 ? 's' : ''}
        </Text>
        
        <BadgeGrid
          allBadges={sortedBadges}
          userBadges={userBadges}
          onBadgePress={handleBadgePress}
          numColumns={3}
          size="medium"
        />

        {/* Rarity Legend */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Raretés</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#9CA3AF' }]} />
              <Text style={styles.legendLabel}>Commun</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.legendLabel}>Rare</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#A855F7' }]} />
              <Text style={styles.legendLabel}>Épique</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendLabel}>Légendaire</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal */}
      <BadgeModal
        visible={modalVisible}
        badge={selectedBadge}
        unlocked={selectedBadgeUnlocked}
        onClose={() => setModalVisible(false)}
      />

      {/* Notification */}
      <BadgeNotification
        badge={notificationBadge}
        visible={notificationVisible}
        onDismiss={() => {
          setNotificationVisible(false);
          setNotificationBadge(null);
        }}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  categoriesContainer: {
    maxHeight: 60,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryLabelActive: {
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  legendContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginTop: 20,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
