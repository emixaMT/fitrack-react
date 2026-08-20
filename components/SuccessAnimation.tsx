// components/SuccessAnimation.tsx
// Overlay modal avec animation Lottie pour le succès d'export/import
import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '../contexts/ThemeContext';

type SuccessAnimationProps = {
  visible: boolean;
  type: 'export' | 'import';
  message?: string;
  onDone: () => void;
  duration?: number;
};

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  visible,
  type,
  message,
  onDone,
  duration = 2200,
}) => {
  const { colors } = useTheme();
  const lottieRef = useRef<LottieView>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      lottieRef.current?.play();
      timerRef.current = setTimeout(() => {
        onDone();
      }, duration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, duration, onDone]);

  const source = require('../assets/animations/muscle.json');

  const defaultMessage = type === 'export' ? 'Séance exportée !' : 'Séance importée !';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDone}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <LottieView
            ref={lottieRef}
            source={source}
            style={{ width: 140, height: 140 }}
            autoPlay
            loop={false}
            speed={1}
          />
          <Text style={[styles.text, { color: colors.text }]}>
            {message ?? defaultMessage}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
});
