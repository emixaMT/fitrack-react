import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme === 'dark') setIsDarkMode(true);
    } catch (error) {
      console.error('Erreur lors du chargement du thème:', error);
    }
  };

  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      await AsyncStorage.setItem('theme', newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du thème:', error);
    }
  };

  // Cyan/Teal palette — high contrast
  const colors: ThemeColors = isDarkMode
    ? {
        background: '#0d0d0f',
        surface: '#1a1a1e',
        card: '#232328',
        cardElevated: '#2e2e34',
        text: '#ffffff',
        textSecondary: '#9a9aa0',
        textTertiary: '#5e5e64',
        primary: '#22D3EE',
        primaryLight: '#67E8F9',
        primaryDark: '#0891B2',
        accent: '#2DD4BF',
        success: '#34c759',
        warning: '#ff9f0a',
        error: '#ff453a',
        border: '#2e2e34',
        divider: '#2a2a30',
        shadowColor: '#000000',
        gradientStart: '#06B6D4',
        gradientEnd: '#14B8A6',
        gradientAccentStart: '#0891B2',
        gradientAccentEnd: '#2DD4BF',
        indigo: '#22D3EE',
      }
    : {
        background: '#ececf0',
        surface: '#ffffff',
        card: '#ffffff',
        cardElevated: '#ffffff',
        text: '#0a0a0c',
        textSecondary: '#5a5a62',
        textTertiary: '#9a9aa2',
        primary: '#0891B2',
        primaryLight: '#06B6D4',
        primaryDark: '#0E7490',
        accent: '#14B8A6',
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
        border: '#d4d4dc',
        divider: '#d8d8de',
        shadowColor: '#000000',
        gradientStart: '#06B6D4',
        gradientEnd: '#14B8A6',
        gradientAccentStart: '#0891B2',
        gradientAccentEnd: '#14B8A6',
        indigo: '#0891B2',
      };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors }}>
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
