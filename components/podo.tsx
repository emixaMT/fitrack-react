import { useEffect, useState } from 'react';
import { View, Text, Alert, Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProgressBar from './progressBar';
import React from 'react';

const STEPS_STORAGE_KEY = '@steps_today';
const DATE_STORAGE_KEY = '@steps_date';

export default function StepCounter() {
  const [steps, setSteps] = useState<number>(0);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: any = null;

    const setupPedometer = async () => {
      try {
        // Vérifie si le podomètre est disponible sur l'appareil
        const available = await Pedometer.isAvailableAsync();
        setIsAvailable(available);

        if (!available) {
          setError('Podomètre non disponible sur cet appareil');
          return;
        }

        // Demande les permissions sur Android (Android 10+)
        if (Platform.OS === 'android' && Platform.Version >= 29) {
          const { status } = await Pedometer.requestPermissionsAsync();
          if (status !== 'granted') {
            setError('Permission refusée pour accéder au podomètre');
            Alert.alert(
              'Permission requise',
              'L\'application a besoin d\'accéder au capteur d\'activité pour compter vos pas.',
              [{ text: 'OK' }]
            );
            return;
          }
        }

        // Récupère la date du jour au format YYYY-MM-DD
        const today = new Date().toISOString().split('T')[0];
        
        // Vérifie si on a des données sauvegardées pour aujourd'hui
        const savedDate = await AsyncStorage.getItem(DATE_STORAGE_KEY);
        const savedSteps = await AsyncStorage.getItem(STEPS_STORAGE_KEY);

        if (savedDate === today && savedSteps) {
          // On est toujours le même jour, on restaure les pas
          setSteps(parseInt(savedSteps, 10));
        } else {
          // Nouveau jour, on réinitialise
          setSteps(0);
          await AsyncStorage.setItem(DATE_STORAGE_KEY, today);
          await AsyncStorage.setItem(STEPS_STORAGE_KEY, '0');
        }

        // Sur iOS, on peut utiliser getStepCountAsync
        if (Platform.OS === 'ios') {
          const end = new Date();
          const start = new Date();
          start.setHours(0, 0, 0, 0);

          const result = await Pedometer.getStepCountAsync(start, end);
          setSteps(result.steps);
          await AsyncStorage.setItem(STEPS_STORAGE_KEY, result.steps.toString());
        }

        // Écoute les mises à jour en temps réel
        subscription = Pedometer.watchStepCount(async (result) => {
          setSteps((prevSteps) => {
            const newSteps = prevSteps + result.steps;
            // Sauvegarde les pas à chaque mise à jour
            AsyncStorage.setItem(STEPS_STORAGE_KEY, newSteps.toString());
            return newSteps;
          });
        });

      } catch (err) {
        console.error('Erreur lors de l\'initialisation du podomètre:', err);
        setError('Erreur lors de l\'accès au podomètre');
      }
    };

    setupPedometer();

    // Nettoyage lors du démontage du composant
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return (
    <View className="py-4 mt-6">
      <Text className="text-lg text-center text-indigo-600">Nombre de pas aujourd'hui</Text>
      {error ? (
        <Text className="text-sm text-center text-red-500 mt-2">{error}</Text>
      ) : (
        <>
          <Text className="text-2xl font-bold text-indigo-600 mb-4 text-center">
            {isAvailable ? steps.toLocaleString() : '...'} / 10 000
          </Text>
          <ProgressBar progress={Math.min(steps / 10000, 1)} />
        </>
      )}
    </View>
  );
}