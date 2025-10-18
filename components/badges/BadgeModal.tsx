// FILE: components/badges/BadgeModal.tsx
import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { Badge, getRarityColor, getRarityLabel } from '../../services/badgeService';

interface BadgeModalProps {
  visible: boolean;
  badge: Badge | null;
  unlocked: boolean;
  onClose: () => void;
}

export const BadgeModal: React.FC<BadgeModalProps> = ({
  visible,
  badge,
  unlocked,
  onClose,
}) => {
  if (!badge) return null;

  const rarityColor = getRarityColor(badge.rarity);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Icon */}
            <View
              style={[
                styles.iconCircle,
                {
                  borderColor: rarityColor,
                  opacity: unlocked ? 1 : 0.3,
                },
              ]}
            >
              {unlocked && badge.image_url ? (
                <Image
                  source={{ uri: badge.image_url }}
                  style={styles.badgeImage}
                  resizeMode="contain"
                />
              ) : unlocked && badge.image_local ? (
                <Image
                  source={badge.image_local}
                  style={styles.badgeImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.icon}>{unlocked ? badge.icon || '🏆' : '🔒'}</Text>
              )}
            </View>

            {/* Name */}
            <Text style={styles.name}>{badge.name}</Text>

            {/* Rarity */}
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

            {/* Description */}
            {badge.description && (
              <Text style={styles.description}>{badge.description}</Text>
            )}

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Points</Text>
                <Text style={styles.statValue}>{badge.points}</Text>
              </View>

              {badge.category && (
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Catégorie</Text>
                  <Text style={styles.statValue}>
                    {badge.category.charAt(0).toUpperCase() + badge.category.slice(1)}
                  </Text>
                </View>
              )}
            </View>

            {/* Condition */}
            {!unlocked && badge.condition_type && badge.condition_value && (
              <View style={styles.conditionContainer}>
                <Text style={styles.conditionLabel}>🎯 Condition de déblocage</Text>
                <Text style={styles.conditionText}>
                  {getConditionText(badge.condition_type, badge.condition_value)}
                </Text>
              </View>
            )}

            {/* Unlocked status */}
            {unlocked && (
              <View style={styles.unlockedContainer}>
                <Text style={styles.unlockedText}>✅ Badge débloqué !</Text>
              </View>
            )}
          </ScrollView>

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const getConditionText = (type: string, value: number): string => {
  const conditions: Record<string, string> = {
    workout_count: `Complétez ${value} séance${value > 1 ? 's' : ''}`,
    streak_days: `Entraînez-vous ${value} jour${value > 1 ? 's' : ''} d'affilée`,
    note_count: `Créez ${value} note${value > 1 ? 's' : ''}`,
    weight_entries: `Enregistrez votre poids ${value} fois`,
    squat_weight: `Soulevez ${value}kg au squat`,
    bench_weight: `Soulevez ${value}kg au développé couché`,
    deadlift_weight: `Soulevez ${value}kg au soulevé de terre`,
    crossfit_count: `Complétez ${value} séances de CrossFit`,
    running_count: `Complétez ${value} séances de running`,
    cycling_count: `Complétez ${value} séances de vélo`,
    monthly_target_reached: `Atteignez votre objectif mensuel`,
    monthly_target_streak: `Atteignez votre objectif ${value} mois de suite`,
  };

  return conditions[type] || `Atteignez ${value} ${type}`;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
    marginBottom: 16,
  },
  icon: {
    fontSize: 60,
  },
  badgeImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F9FAFB',
    textAlign: 'center',
    marginBottom: 12,
  },
  rarityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    marginBottom: 16,
  },
  rarityText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  conditionContainer: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  conditionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  conditionText: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  unlockedContainer: {
    backgroundColor: '#065F46',
    padding: 12,
    borderRadius: 12,
    width: '100%',
  },
  unlockedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#374151',
    padding: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    textAlign: 'center',
  },
});
