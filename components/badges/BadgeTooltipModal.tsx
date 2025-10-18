import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { Badge, getRarityColor, getRarityLabel } from '../../services/badgeService';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';

// Fonction pour formater le texte de condition de déblocage
const getUnlockConditionText = (conditionType: string, conditionValue: number): string => {
  const conditions: { [key: string]: (value: number) => string } = {
    'total_workouts': (v) => `Complète ${v} séance${v > 1 ? 's' : ''} au total`,
    'streak_days': (v) => `Maintiens une série de ${v} jour${v > 1 ? 's' : ''} consécutifs`,
    'monthly_workouts': (v) => `Complète ${v} séance${v > 1 ? 's' : ''} dans un mois`,
    'weekly_workouts': (v) => `Complète ${v} séance${v > 1 ? 's' : ''} dans une semaine`,
    'workout_type': (v) => `Complète ${v} séance${v > 1 ? 's' : ''} d'un type spécifique`,
    'challenge_days': (v) => `Complète ${v} défi${v > 1 ? 's' : ''} quotidiens`,
    'total_weight': (v) => `Soulève un total de ${v} kg`,
    'best_squat': (v) => `Atteins ${v} kg au squat`,
    'best_bench': (v) => `Atteins ${v} kg au développé couché`,
    'best_deadlift': (v) => `Atteins ${v} kg au soulevé de terre`,
  };

  return conditions[conditionType] 
    ? conditions[conditionType](conditionValue) 
    : `Atteins l'objectif : ${conditionType} = ${conditionValue}`;
};

interface BadgeTooltipModalProps {
  visible: boolean;
  badge: Badge | null;
  unlocked: boolean;
  onClose: () => void;
}

export const BadgeTooltipModal: React.FC<BadgeTooltipModalProps> = ({
  visible,
  badge,
  unlocked,
  onClose,
}) => {
  const { colors } = useTheme();
  
  if (!badge) return null;

  const rarityColor = getRarityColor(badge.rarity);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        style={styles.overlay}
        onPress={onClose}
      >
        <Pressable 
          style={[styles.container, { backgroundColor: colors.card }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* En-tête */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>
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
            </View>
            
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          {/* Statut */}
          <View style={[
            styles.statusBadge,
            { 
              backgroundColor: unlocked ? '#10b981' : '#6b7280',
            }
          ]}>
            <Ionicons 
              name={unlocked ? "checkmark-circle" : "lock-closed"} 
              size={16} 
              color="white" 
            />
            <Text style={styles.statusText}>
              {unlocked ? 'Débloqué' : 'Verrouillé'}
            </Text>
          </View>

          {/* Description */}
          <View style={[styles.section, styles.unlockSection]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🎯 Comment débloquer ?
            </Text>
            <Text style={[styles.unlockCondition, { color: colors.indigo }]}>
              {badge.description}
            </Text>
          </View>

          {/* Points */}
          <View style={styles.footer}>
            <View style={styles.pointsBadge}>
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text style={[styles.points, { color: colors.text }]}>
                {badge.points} points
              </Text>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  rarityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  unlockSection: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.3)',
  },
  unlockCondition: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  points: {
    fontWeight: '600',
    fontSize: 14,
  },
});
