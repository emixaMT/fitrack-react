// FILE: src/components/progressBar.tsx
import React from 'react';
import { View } from 'react-native';

type Props = {
  progress: number;        // 0..1
  completed?: boolean;     // vert si true
};

export default function ProgressBar({ progress, completed = false }: Props) {
  const clamped = Math.max(0, Math.min(progress, 1));
  const barColor = completed ? '#16a34a' /* green-600 */ : '#4f46e5' /* indigo-600 */;

  return (
    <View
      style={{
        width: '100%',
        height: 10,
        backgroundColor: '#e5e7eb', // gray-200
        borderRadius: 9999,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          backgroundColor: barColor,
        }}
      />
    </View>
  );
}
