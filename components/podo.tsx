import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Pedometer } from 'expo-sensors';
import ProgressBar from './progressBar';
import React from 'react';


export default function StepCounter() {
  const [steps, setSteps] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);

  useEffect(() => {
    // Vérifie si dispo
    Pedometer.isAvailableAsync().then(setIsAvailable);

    // Récupère les pas d’aujourd’hui
    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0); // début de la journée

    Pedometer.getStepCountAsync(start, end).then(result => {
      setSteps(result.steps);
    });
  }, []);

  return (
    <View className="py-4 mt-6">
      <Text className="text-lg text-center text-indigo-600">Nombre de pas aujourd'hui</Text>
      <Text className="text-2xl font-bold text-indigo-600 mb-4 text-center">
        {isAvailable ? steps ?? '...' : 'Indisponible'} / 10000
      </Text>
      <ProgressBar progress={Math.min(steps / 10000, 1)}></ProgressBar>
    </View>
  );
}
