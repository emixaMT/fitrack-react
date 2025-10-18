import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LevelBadgeProps {
  level: number;
  size?: 'small' | 'medium' | 'large';
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, size = 'medium' }) => {
  const sizeConfig = {
    small: { 
      badge: 35, 
      text: 16,
    },
    medium: { 
      badge: 50, 
      text: 20,
    },
    large: { 
      badge: 65, 
      text: 24,
    },
  };

  const config = sizeConfig[size];

  return (
    <View style={styles.wrapper}>
      {/* Badge de niveau blanc avec texte violet */}
      <View 
        style={{
          width: config.badge,
          height: config.badge,
          borderRadius: 9999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFFFFF',
        }}
      >
        <Text className='text-xs font-bold text-indigo-500'>Niv.</Text>
        <Text style={[styles.levelText, { fontSize: config.text }]}>{level}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFF',
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  levelText: {
    fontWeight: 'bold',
    color: '#4f46e5',
    textAlign: 'center',
  },
});
