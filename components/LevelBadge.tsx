import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface LevelBadgeProps {
  level: number;
  size?: 'small' | 'medium' | 'large';
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, size = 'medium' }) => {
  const { colors } = useTheme();

  const sizeConfig = {
    small: { badge: 32, text: 14 },
    medium: { badge: 44, text: 18 },
    large: { badge: 56, text: 22 },
  };

  const config = sizeConfig[size];

  return (
    <View style={[
      styles.wrapper,
      { backgroundColor: colors.card },
    ]}>
      <View style={{
        width: config.badge, height: config.badge, borderRadius: 9999,
        backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: config.text, fontWeight: '800', color: '#fff' }}>
          {level}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { borderRadius: 9999, padding: 4, alignItems: 'center', justifyContent: 'center' },
});
