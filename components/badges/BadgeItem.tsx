// FILE: components/badges/BadgeItem.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Badge, getRarityColor, getRarityLabel } from '../../services/badgeService';

interface BadgeItemProps {
  badge: Badge;
  unlocked?: boolean;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export const BadgeItem: React.FC<BadgeItemProps> = ({
  badge,
  unlocked = false,
  onPress,
  size = 'medium',
}) => {
  const rarityColor = getRarityColor(badge.rarity);
  const sizeValue = size === 'small' ? 60 : size === 'large' ? 100 : 80;
  const iconSize = size === 'small' ? 30 : size === 'large' ? 50 : 40;
  // Taille de l'image = 90% du cercle pour le remplir au maximum
  const imageSize = sizeValue * 0.9;

  return (
    <TouchableOpacity
      style={[styles.container, { width: sizeValue + 20 }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.badgeCircle,
          {
            width: sizeValue,
            height: sizeValue,
            borderColor: rarityColor,
            opacity: unlocked ? 1 : 0.3,
          },
        ]}
      >
        {unlocked && badge.image_url ? (
          <Image
            source={{ uri: badge.image_url }}
            style={[
              styles.badgeImage,
              { width: imageSize, height: imageSize, borderRadius: imageSize / 2 },
            ]}
            resizeMode="cover"
          />
        ) : unlocked && badge.image_local ? (
          <Image
            source={badge.image_local}
            style={[
              styles.badgeImage,
              { width: imageSize, height: imageSize, borderRadius: imageSize / 2 },
            ]}
            resizeMode="cover"
          />
        ) : (
          <Text style={[styles.icon, { fontSize: iconSize }]}>
            {unlocked ? badge.icon || '🏆' : '🔒'}
          </Text>
        )}
      </View>
      
      {size !== 'small' && (
        <>
          <Text
            style={[
              styles.name,
              { opacity: unlocked ? 1 : 0.5 },
              size === 'large' && styles.nameLarge,
            ]}
            numberOfLines={2}
          >
            {badge.name}
          </Text>
          
          <View
            style={[
              styles.rarityBadge,
              { backgroundColor: rarityColor + '20', borderColor: rarityColor },
            ]}
          >
            <Text style={[styles.rarityText, { color: rarityColor }]}>
              {getRarityLabel(badge.rarity)}
            </Text>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeCircle: {
    borderRadius: 100,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    marginBottom: 8,
  },
  icon: {
    textAlign: 'center',
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F9FAFB',
    textAlign: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  nameLarge: {
    fontSize: 14,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  badgeImage: {
    // borderRadius est défini dynamiquement pour s'adapter à la taille
  },
});
