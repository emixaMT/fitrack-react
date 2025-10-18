import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface LevelBarProps {
  level: number;
  currentXP: number;
  xpRequired: number;
  progressPercentage: number;
  totalXP?: number;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
}

export const LevelBar: React.FC<LevelBarProps> = ({
  level,
  currentXP,
  xpRequired,
  progressPercentage,
  totalXP,
  size = 'medium',
  showDetails = true,
}) => {
  const { colors, isDarkMode } = useTheme();

  const sizeStyles = {
    small: {
      containerPadding: { paddingVertical: 12, paddingHorizontal: 16 },
      levelBadge: { width: 40, height: 40 },
      levelText: { fontSize: 16 },
      barHeight: 8,
      xpText: { fontSize: 12 },
    },
    medium: {
      containerPadding: { paddingVertical: 16, paddingHorizontal: 20 },
      levelBadge: { width: 48, height: 48 },
      levelText: { fontSize: 18 },
      barHeight: 12,
      xpText: { fontSize: 14 },
    },
    large: {
      containerPadding: { paddingVertical: 20, paddingHorizontal: 24 },
      levelBadge: { width: 64, height: 64 },
      levelText: { fontSize: 24 },
      barHeight: 16,
      xpText: { fontSize: 16 },
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={{
        backgroundColor: colors.card,        
        elevation: 4,
        ...currentSize.containerPadding,
      }}
    >
      {/* Header avec niveau */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {/* Badge de niveau */}
          <LinearGradient
            colors={['#818cf8', '#4f46e5']}
            style={{
              ...currentSize.levelBadge,
              borderRadius: 100,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{
              ...currentSize.levelText,
              fontWeight: 'bold',
              color: '#ffffff',
            }}>{level}</Text>
          </LinearGradient>

          {/* Texte niveau */}
          <View>
            <Text className='text-xl font-bold text-indigo-600'>
              Niveau {level}
            </Text>
            {showDetails && totalXP !== undefined && (
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                {totalXP} XP total
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Barre de progression */}
      <View style={{ marginBottom: 8 }}>
        <View
          style={{
            backgroundColor: isDarkMode ? '#3d3d3d' : '#e5e7eb',
            width: '100%',
            height: currentSize.barHeight,
            borderRadius: 100,
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            colors={['#818cf8', '#4f46e5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              width: `${progressPercentage}%`,
              height: '100%',
            }}
          />
        </View>
      </View>

      {/* Détails XP */}
      {showDetails && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary, ...currentSize.xpText }}>
            {currentXP} / {xpRequired} XP
          </Text>
          <Text style={{ color: colors.indigo, fontWeight: '600', ...currentSize.xpText }}>
            {progressPercentage}%
          </Text>
        </View>
      )}
    </View>
  );
};

export default LevelBar;
