import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '../contexts/ThemeContext';

interface StreakFlameProps {
  streakDays: number;
  size?: 'small' | 'medium' | 'large';
}

export const StreakFlame: React.FC<StreakFlameProps> = ({ streakDays, size = 'medium' }) => {
  const lottieRef = useRef<LottieView>(null);
  const { colors } = useTheme();

  const sizeConfig = {
    small: { flame: 26, text: 10, container: 48 },
    medium: { flame: 38, text: 12, container: 64 },
    large: { flame: 50, text: 14, container: 80 },
  };

  const config = sizeConfig[size];

  if (streakDays === 0) {
    return (
      <View style={[styles.wrapper, { backgroundColor: colors.card, width: config.container }]}>
        <View style={styles.flameContainer}>
          <LottieView
            source={require('../assets/animations/flame.json')}
            style={{ width: config.flame, height: config.flame, opacity: 0.2 }}
            autoPlay={false}
          />
        </View>
        <Text style={[styles.streakText, { fontSize: config.text, color: colors.textTertiary }]}>0 j</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.card, width: config.container }]}>
      <View style={styles.flameContainer}>
        <LottieView
          ref={lottieRef}
          source={require('../assets/animations/flame.json')}
          style={{ width: config.flame, height: config.flame }}
          autoPlay loop speed={1}
        />
      </View>
      <Text style={[styles.streakText, { fontSize: config.text, color: colors.text }]}>
        {streakDays} j
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { borderRadius: 9999, paddingVertical: 6, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  flameContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: -2 },
  streakText: { fontWeight: '700', textAlign: 'center' },
});
