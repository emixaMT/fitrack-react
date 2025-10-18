import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

interface StreakFlameProps {
  streakDays: number;
  size?: 'small' | 'medium' | 'large';
}

export const StreakFlame: React.FC<StreakFlameProps> = ({ streakDays, size = 'medium' }) => {
  const lottieRef = useRef<LottieView>(null);

  const sizeConfig = {
    small: { flame: 35, text: 10, container: 60 },
    medium: { flame: 50, text: 12, container: 80 },
    large: { flame: 65, text: 14, container: 100 },
  };

  const config = sizeConfig[size];

  if (streakDays === 0) {
    return (
      <View style={[styles.wrapper]}>
        <View style={styles.flameContainer}>
          <LottieView
            source={require('../assets/animations/flame.json')}
            style={{
              width: config.flame,
              height: config.flame,
              opacity: 0.3,
            }}
            autoPlay={false}
          />
        </View>
        <Text style={[styles.streakText, { fontSize: config.text }]}>0 jour</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.flameContainer}>
        <LottieView
          ref={lottieRef}
          source={require('../assets/animations/flame.json')}
          style={{
            width: config.flame,
            height: config.flame,
          }}
          autoPlay={true}
          loop={true}
          speed={1}
        />
      </View>
      <Text style={[styles.streakText, { fontSize: config.text }]}>
        {streakDays} jour{streakDays > 1 ? 's' : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  flameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -8,
  },
  streakText: {
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 0,
  },
});
