// components/Toast.tsx
// Toast simple et leger — apparait en bas de l'ecran, disparait auto
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

type ToastProps = {
  message: string;
  visible: boolean;
  onDone: () => void;
  duration?: number;
};

export const Toast: React.FC<ToastProps> = ({ message, visible, onDone, duration = 2500 }) => {
  const { colors } = useTheme();

  useEffect(() => {
    if (visible) {
      const t = setTimeout(onDone, duration);
      return () => clearTimeout(t);
    }
  }, [visible, duration, onDone]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Pressable onPress={onDone}>
        <View style={[styles.toast, { backgroundColor: colors.card }]}>
          <Text style={[styles.text, { color: colors.text }]}>{message}</Text>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
