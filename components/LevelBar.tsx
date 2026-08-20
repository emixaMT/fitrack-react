import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { cardStyle } from '../utils/styles';

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
  level, currentXP, xpRequired, progressPercentage, totalXP,
  size = 'medium', showDetails = true,
}) => {
  const { colors } = useTheme();

  const sizeStyles = {
    small: { pad: { paddingVertical: 14, paddingHorizontal: 16 }, badge: 36, barH: 6, title: 15, xp: 12 },
    medium: { pad: { paddingVertical: 16, paddingHorizontal: 18 }, badge: 44, barH: 8, title: 17, xp: 13 },
    large: { pad: { paddingVertical: 20, paddingHorizontal: 22 }, badge: 52, barH: 10, title: 20, xp: 15 },
  };

  const s = sizeStyles[size];

  return (
    <View style={[cardStyle(colors, 'sm'), s.pad]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <View style={{
          width: s.badge, height: s.badge, borderRadius: 9999,
          backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: s.title, fontWeight: '800', color: '#fff' }}>{level}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: s.title, fontWeight: '700', color: colors.text }}>Niveau {level}</Text>
          {showDetails && totalXP !== undefined && (
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{totalXP} XP total</Text>
          )}
        </View>
      </View>

      <View style={{ marginBottom: 8 }}>
        <View style={{ backgroundColor: colors.divider, width: '100%', height: s.barH, borderRadius: 4, overflow: 'hidden' }}>
          <View style={{ width: `${progressPercentage}%`, height: '100%', backgroundColor: colors.primary, borderRadius: 4 }} />
        </View>
      </View>

      {showDetails && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary, fontSize: s.xp }}>{currentXP} / {xpRequired} XP</Text>
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: s.xp }}>{progressPercentage}%</Text>
        </View>
      )}
    </View>
  );
};

export default LevelBar;
