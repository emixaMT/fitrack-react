import { ViewStyle } from 'react-native';
import { ThemeColors } from '../contexts/ThemeContext';

export function cardShadow(colors: ThemeColors, level: 'sm' | 'md' | 'lg' = 'sm'): ViewStyle {
  // Hevy style : ombres minimales en dark, légères en light
  if (colors.background === '#121212') {
    return { elevation: level === 'lg' ? 4 : level === 'md' ? 2 : 1 };
  }
  const configs: Record<string, ViewStyle> = {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 5 },
  };
  return configs[level];
}

export function cardStyle(colors: ThemeColors, level: 'sm' | 'md' | 'lg' = 'sm'): ViewStyle {
  return {
    backgroundColor: colors.card,
    borderRadius: 16,
    ...cardShadow(colors, level),
  };
}

export function inputStyle(colors: ThemeColors): ViewStyle {
  return {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
  };
}
