import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ColorScheme = 'cyan' | 'orange' | 'red' | 'blue' | 'green' | 'purple';

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  cardElevated: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  border: string;
  divider: string;
  shadowColor: string;
  gradientStart: string;
  gradientEnd: string;
  gradientAccentStart: string;
  gradientAccentEnd: string;
  indigo: string;
}

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  colors: ThemeColors;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Color schemes — each defines primary, primaryLight, primaryDark, accent, gradients
const SCHEMES: Record<ColorScheme, {
  primary: string; primaryLight: string; primaryDark: string; accent: string;
  gradientStart: string; gradientEnd: string;
  gradientAccentStart: string; gradientAccentEnd: string;
  indigo: string;
}> = {
  cyan: {
    primary: '#0891B2', primaryLight: '#06B6D4', primaryDark: '#0E7490',
    accent: '#14B8A6', gradientStart: '#06B6D4', gradientEnd: '#14B8A6',
    gradientAccentStart: '#0891B2', gradientAccentEnd: '#14B8A6', indigo: '#0891B2',
  },
  orange: {
    primary: '#EA580C', primaryLight: '#F97316', primaryDark: '#C2410C',
    accent: '#F59E0B', gradientStart: '#F97316', gradientEnd: '#F59E0B',
    gradientAccentStart: '#EA580C', gradientAccentEnd: '#F59E0B', indigo: '#EA580C',
  },
  red: {
    primary: '#DC2626', primaryLight: '#EF4444', primaryDark: '#B91C1C',
    accent: '#F87171', gradientStart: '#EF4444', gradientEnd: '#F87171',
    gradientAccentStart: '#DC2626', gradientAccentEnd: '#F87171', indigo: '#DC2626',
  },
  blue: {
    primary: '#2563EB', primaryLight: '#3B82F6', primaryDark: '#1D4ED8',
    accent: '#60A5FA', gradientStart: '#3B82F6', gradientEnd: '#60A5FA',
    gradientAccentStart: '#2563EB', gradientAccentEnd: '#60A5FA', indigo: '#2563EB',
  },
  green: {
    primary: '#059669', primaryLight: '#10B981', primaryDark: '#047857',
    accent: '#34D399', gradientStart: '#10B981', gradientEnd: '#34D399',
    gradientAccentStart: '#059669', gradientAccentEnd: '#34D399', indigo: '#059669',
  },
  purple: {
    primary: '#7C3AED', primaryLight: '#8B5CF6', primaryDark: '#6D28D9',
    accent: '#A78BFA', gradientStart: '#8B5CF6', gradientEnd: '#A78BFA',
    gradientAccentStart: '#7C3AED', gradientAccentEnd: '#A78BFA', indigo: '#7C3AED',
  },
};

// Dark mode overrides for primary (brighter versions)
const DARK_SCHEME_OVERRIDE: Record<ColorScheme, { primary: string; primaryLight: string; primaryDark: string; indigo: string }> = {
  cyan:    { primary: '#22D3EE', primaryLight: '#67E8F9', primaryDark: '#0891B2', indigo: '#22D3EE' },
  orange:  { primary: '#FB923C', primaryLight: '#FDBA74', primaryDark: '#EA580C', indigo: '#FB923C' },
  red:     { primary: '#F87171', primaryLight: '#FCA5A5', primaryDark: '#DC2626', indigo: '#F87171' },
  blue:    { primary: '#60A5FA', primaryLight: '#93C5FD', primaryDark: '#2563EB', indigo: '#60A5FA' },
  green:   { primary: '#34D399', primaryLight: '#6EE7B7', primaryDark: '#059669', indigo: '#34D399' },
  purple:  { primary: '#A78BFA', primaryLight: '#C4B5FD', primaryDark: '#7C3AED', indigo: '#A78BFA' },
};

export const COLOR_SCHEMES: { key: ColorScheme; label: string; color: string }[] = [
  { key: 'cyan', label: 'Cyan', color: '#06B6D4' },
  { key: 'orange', label: 'Orange', color: '#F97316' },
  { key: 'red', label: 'Rouge', color: '#EF4444' },
  { key: 'blue', label: 'Bleu', color: '#3B82F6' },
  { key: 'green', label: 'Vert', color: '#10B981' },
  { key: 'purple', label: 'Violet', color: '#8B5CF6' },
];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('cyan');

  useEffect(() => {
    (async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme === 'dark') setIsDarkMode(true);
        const savedScheme = await AsyncStorage.getItem('colorScheme');
        if (savedScheme && savedScheme in SCHEMES) setColorSchemeState(savedScheme as ColorScheme);
      } catch (e) { console.error('Theme load error:', e); }
    })();
  }, []);

  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try { await AsyncStorage.setItem('theme', newMode ? 'dark' : 'light'); } catch (e) {}
  };

  const setColorScheme = async (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    try { await AsyncStorage.setItem('colorScheme', scheme); } catch (e) {}
  };

  const scheme = SCHEMES[colorScheme];
  const darkOverride = DARK_SCHEME_OVERRIDE[colorScheme];

  const colors: ThemeColors = isDarkMode
    ? {
        background: '#0d0d0f',
        surface: '#1a1a1e',
        card: '#232328',
        cardElevated: '#2e2e34',
        text: '#ffffff',
        textSecondary: '#b0b0b8',
        textTertiary: '#7a7a82',
        primary: darkOverride.primary,
        primaryLight: darkOverride.primaryLight,
        primaryDark: darkOverride.primaryDark,
        accent: scheme.accent,
        success: '#34c759',
        warning: '#ff9f0a',
        error: '#ff453a',
        border: '#2e2e34',
        divider: '#2a2a30',
        shadowColor: '#000000',
        gradientStart: scheme.gradientStart,
        gradientEnd: scheme.gradientEnd,
        gradientAccentStart: scheme.gradientAccentStart,
        gradientAccentEnd: scheme.gradientAccentEnd,
        indigo: darkOverride.indigo,
      }
    : {
        background: '#ececf0',
        surface: '#ffffff',
        card: '#ffffff',
        cardElevated: '#ffffff',
        text: '#0a0a0c',
        textSecondary: '#4a4a52',
        textTertiary: '#8a8a92',
        primary: scheme.primary,
        primaryLight: scheme.primaryLight,
        primaryDark: scheme.primaryDark,
        accent: scheme.accent,
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
        border: '#d4d4dc',
        divider: '#d8d8de',
        shadowColor: '#000000',
        gradientStart: scheme.gradientStart,
        gradientEnd: scheme.gradientEnd,
        gradientAccentStart: scheme.gradientAccentStart,
        gradientAccentEnd: scheme.gradientAccentEnd,
        indigo: scheme.indigo,
      };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors, colorScheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé dans un ThemeProvider');
  }
  return context;
};
