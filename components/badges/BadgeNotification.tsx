// FILE: components/badges/BadgeNotification.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, Image } from 'react-native';
import { Badge, getRarityColor } from '../../services/badgeService';

interface BadgeNotificationProps {
  badge: Badge | null;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

const { width } = Dimensions.get('window');

export const BadgeNotification: React.FC<BadgeNotificationProps> = ({
  badge,
  visible,
  onDismiss,
  duration = 3000,
}) => {
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && badge) {
      // Apparition
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Disparition automatique
      const timeout = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -200,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onDismiss();
        });
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [visible, badge]);

  if (!badge) return null;

  const rarityColor = getRarityColor(badge.rarity);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View style={[styles.notification, { borderColor: rarityColor }]}>
        {/* Icon */}
        <View style={[styles.iconCircle, { borderColor: rarityColor }]}>
          {badge.image_url ? (
            <Image
              source={{ uri: badge.image_url }}
              style={styles.badgeImage}
              resizeMode="contain"
            />
          ) : badge.image_local ? (
            <Image
              source={badge.image_local}
              style={styles.badgeImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.icon}>{badge.icon || '🏆'}</Text>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>🎉 Nouveau badge !</Text>
          <Text style={styles.badgeName}>{badge.name}</Text>
          <Text style={styles.points}>+{badge.points} points</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  notification: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    borderWidth: 3,
    width: width - 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
    marginRight: 12,
  },
  icon: {
    fontSize: 30,
  },
  badgeImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 2,
  },
  points: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
});
