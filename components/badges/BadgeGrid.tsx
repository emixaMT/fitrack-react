// FILE: components/badges/BadgeGrid.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Badge, UserBadge } from '../../services/badgeService';
import { BadgeItem } from './BadgeItem';

interface BadgeGridProps {
  allBadges: Badge[];
  userBadges: UserBadge[];
  onBadgePress?: (badge: Badge, unlocked: boolean) => void;
  numColumns?: number;
  size?: 'small' | 'medium' | 'large';
}

export const BadgeGrid: React.FC<BadgeGridProps> = ({
  allBadges,
  userBadges,
  onBadgePress,
  numColumns = 3,
  size = 'medium',
}) => {
  const unlockedBadgeIds = new Set(userBadges.map((ub) => ub.badge_id));

  const renderBadge = ({ item }: { item: Badge }) => {
    const unlocked = unlockedBadgeIds.has(item.id);
    return (
      <BadgeItem
        badge={item}
        unlocked={unlocked}
        size={size}
        onPress={() => onBadgePress?.(item, unlocked)}
      />
    );
  };

  if (allBadges.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucun badge disponible</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={allBadges}
      renderItem={renderBadge}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      contentContainerStyle={styles.grid}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  grid: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
