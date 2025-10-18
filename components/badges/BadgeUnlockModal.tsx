import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  Animated,
  Dimensions,
  StyleSheet,
  Image,
} from 'react-native';
import { Badge } from '../../services/badgeService';
import { getBadgeImage } from '../../constantes/badgeImages';
import { LinearGradient } from 'expo-linear-gradient';

interface BadgeUnlockModalProps {
  visible: boolean;
  badge: Badge | null;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export const BadgeUnlockModal: React.FC<BadgeUnlockModalProps> = ({
  visible,
  badge,
  onClose,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && badge) {
      // Animation d'entrée
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();

      // Animation de pulse continue
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset
      fadeAnim.setValue(0);
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [visible, badge]);

  if (!badge) return null;

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return '#9CA3AF';
      case 'rare':
        return '#3B82F6';
      case 'epic':
        return '#8B5CF6';
      case 'legendary':
        return '#F59E0B';
      default:
        return '#9CA3AF';
    }
  };

  const getRarityGradient = (rarity: string): [string, string] => {
    switch (rarity) {
      case 'common':
        return ['#6B7280', '#9CA3AF'];
      case 'rare':
        return ['#2563EB', '#60A5FA'];
      case 'epic':
        return ['#7C3AED', '#A78BFA'];
      case 'legendary':
        return ['#D97706', '#FBBF24'];
      default:
        return ['#6B7280', '#9CA3AF'];
    }
  };

  const rarityColor = getRarityColor(badge.rarity);
  const [gradientStart, gradientEnd] = getRarityGradient(badge.rarity);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Cercles animés en arrière-plan */}
        <Animated.View
          style={[
            styles.circle,
            styles.circle1,
            {
              transform: [{ rotate }, { scale: pulseAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[`${rarityColor}20`, `${rarityColor}00`]}
            style={styles.circleGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.circle,
            styles.circle2,
            {
              transform: [
                { rotate: rotate },
                { scale: pulseAnim },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[`${rarityColor}30`, `${rarityColor}00`]}
            style={styles.circleGradient}
            start={{ x: 1, y: 1 }}
            end={{ x: 0, y: 0 }}
          />
        </Animated.View>

        {/* Contenu principal */}
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#1F2937', '#111827']}
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>🎉 Badge Débloqué !</Text>
            </View>

            {/* Badge avec aura */}
            <View style={styles.badgeContainer}>
              {/* Aura animée */}
              <Animated.View
                style={[
                  styles.aura,
                  {
                    borderColor: rarityColor,
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />

              {/* Badge principal */}
              <Animated.View
                style={[
                  styles.badgeCircle,
                  {
                    borderColor: rarityColor,
                    shadowColor: rarityColor,
                  },
                ]}
              >
                <LinearGradient
                  colors={[gradientStart, gradientEnd]}
                  style={styles.badgeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {badge.image_url ? (
                    <Image
                      source={{ uri: badge.image_url }}
                      style={styles.badgeImage}
                      resizeMode="cover"
                    />
                  ) : badge.image_local || getBadgeImage(badge.code) ? (
                    <Image
                      source={badge.image_local || getBadgeImage(badge.code)}
                      style={styles.badgeImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.badgeIcon}>{badge.icon || '🏆'}</Text>
                  )}
                </LinearGradient>
              </Animated.View>
            </View>

            {/* Infos */}
            <View style={styles.info}>
              <Text style={styles.badgeName}>{badge.name}</Text>
              <Text style={styles.badgeDescription}>{badge.description}</Text>

              <View style={[styles.pointsBadge, { backgroundColor: `${rarityColor}20`, borderColor: rarityColor }]}>
                <Text style={[styles.pointsText, { color: rarityColor }]}>
                  +{badge.points} points
                </Text>
              </View>
            </View>

            {/* Bouton */}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: rarityColor },
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonText}>Continuer</Text>
            </Pressable>
          </LinearGradient>
        </Animated.View>

        {/* Particules / Confettis (optionnel) */}
        {[...Array(20)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                left: Math.random() * width,
                top: height / 2 + (Math.random() - 0.5) * 300,
                backgroundColor: i % 2 === 0 ? rarityColor : '#FFF',
                transform: [
                  { scale: fadeAnim },
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, (Math.random() - 0.5) * 200],
                    }),
                  },
                ],
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 1, 0],
                }),
              },
            ]}
          />
        ))}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.3,
  },
  circle1: {
    width: width * 1.5,
    height: width * 1.5,
    top: -width * 0.5,
    left: -width * 0.25,
  },
  circle2: {
    width: width * 1.2,
    height: width * 1.2,
    bottom: -width * 0.3,
    right: -width * 0.1,
  },
  circleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  content: {
    width: width * 0.85,
    maxWidth: 400,
  },
  card: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  badgeContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aura: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    opacity: 0.5,
  },
  badgeCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  badgeGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeIcon: {
    fontSize: 64,
    textAlign: 'center',
  },
  badgeImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  info: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badgeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  badgeDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  pointsBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
