// components/SwipeableRow.tsx
// Row avec swipe vers la gauche pour reveler une action de suppression
import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Ionicons from '@expo/vector-icons/Ionicons';

type SwipeableRowProps = {
  children: React.ReactNode;
  onDelete: () => void;
  deleteLabel?: string;
};

export const SwipeableRow: React.FC<SwipeableRowProps> = ({ children, onDelete, deleteLabel = 'Supprimer' }) => {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = () => (
    <Pressable
      onPress={() => {
        swipeableRef.current?.close();
        onDelete();
      }}
      style={styles.deleteAction}
    >
      <View style={styles.deleteContent}>
        <Ionicons name="trash-outline" size={22} color="#fff" />
        <Text style={styles.deleteText}>{deleteLabel}</Text>
      </View>
    </Pressable>
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      rightThreshold={60}
      friction={2}
    >
      {children}
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  deleteAction: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    marginBottom: 10,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  deleteContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
