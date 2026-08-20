import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

type SportKey = 'musculation' | 'crossfit' | 'running' | 'velo' | string;

const SPORT_ICONS: Record<string, { icon: string; label: string }> = {
  musculation: { icon: 'barbell', label: 'Musculation' },
  crossfit:    { icon: 'flame',   label: 'Crossfit' },
  running:     { icon: 'footsteps', label: 'Running' },
  velo:        { icon: 'bicycle', label: 'Vélo' },
};

interface SportIconProps {
  sport?: SportKey;
  size?: number;
  color?: string;
  style?: ViewStyle;
  showBackground?: boolean;
}

/**
 * Icône de sport monochrome flat — remplace les PNG colorés.
 */
export const SportIcon: React.FC<SportIconProps> = ({
  sport, size = 48, color, style, showBackground = true,
}) => {
  const { colors } = useTheme();
  const config = SPORT_ICONS[(sport || '').toLowerCase()] || { icon: 'fitness', label: 'Autre' };
  const iconColor = color || colors.primary;

  if (!showBackground) {
    return <Ionicons name={config.icon as any} size={size} color={iconColor} style={style} />;
  }

  return (
    <View style={[
      {
        width: size, height: size, borderRadius: size * 0.28,
        backgroundColor: colors.divider,
        alignItems: 'center', justifyContent: 'center',
      },
      style,
    ]}>
      <Ionicons name={config.icon as any} size={size * 0.55} color={iconColor} />
    </View>
  );
};

/**
 * Grande icône de sport pour les sélecteurs (step1, SessionTypeModal).
 */
export const SportIconLarge: React.FC<{ sport?: SportKey; size?: number; color?: string }> = ({
  sport, size = 56, color,
}) => {
  const { colors } = useTheme();
  const config = SPORT_ICONS[(sport || '').toLowerCase()] || { icon: 'fitness', label: 'Autre' };
  const iconColor = color || colors.primary;

  return (
    <View style={{
      width: size, height: size,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Ionicons name={config.icon as any} size={size} color={iconColor} />
    </View>
  );
};

export default SportIcon;
