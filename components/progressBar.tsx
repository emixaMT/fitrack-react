import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

type Props = { progress: number; completed?: boolean };

export default function ProgressBar({ progress, completed = false }: Props) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(progress, 1));

  return (
    <View
      style={{
        width: '100%',
        height: 8,
        backgroundColor: colors.divider,
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          backgroundColor: completed ? colors.success : colors.primary,
          borderRadius: 4,
        }}
      />
    </View>
  );
}
