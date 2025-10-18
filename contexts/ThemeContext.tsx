import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  colors: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    indigo: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Charger la préférence au démarrage
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
      }
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

  const colors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',      // Noir anthracite / Blanc
    card: isDarkMode ? '#2d2d2d' : '#ffffff',            // Gris foncé / Blanc
    text: isDarkMode ? '#ffffff' : '#1f2937',            // Blanc / Gris foncé
    textSecondary: isDarkMode ? '#9ca3af' : '#6b7280',   // Gris clair / Gris moyen
    indigo: isDarkMode ? '#ffffff' : '#4f46e5',          // Blanc en dark / Indigo en light
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
