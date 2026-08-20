import { useEffect, useState } from 'react';
import { View, Text, Alert, Platform, ActivityIndicator } from 'react-native';
import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProgressBar from './progressBar';
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const STEPS_STORAGE_KEY = '@steps_today';
const DATE_STORAGE_KEY = '@steps_date';

export default function StepCounter() {
  const [steps, setSteps] = useState<number>(0);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);
  const { colors } = useTheme();

  useEffect(() => {
    let subscription: ReturnType<typeof Pedometer.watchStepCount> | null = null;
    const setupPedometer = async () => {
      try {
        const available = await Pedometer.isAvailableAsync();
        setIsAvailable(available);
        if (!available) { setError('Indisponible'); return; }
        if (Platform.OS === 'android' && Platform.Version >= 29) {
          const { status } = await Pedometer.requestPermissionsAsync();
          if (status !== 'granted') { setError('Permission refusée'); return; }
        }
        const today = new Date().toISOString().split('T')[0];
        const savedDate = await AsyncStorage.getItem(DATE_STORAGE_KEY);
        const savedSteps = await AsyncStorage.getItem(STEPS_STORAGE_KEY);
        if (savedDate === today && savedSteps) { setSteps(parseInt(savedSteps, 10)); }
        else { setSteps(0); await AsyncStorage.setItem(DATE_STORAGE_KEY, today); await AsyncStorage.setItem(STEPS_STORAGE_KEY, '0'); }
        if (Platform.OS === 'ios') {
          const end = new Date(); const start = new Date(); start.setHours(0, 0, 0, 0);
          const result = await Pedometer.getStepCountAsync(start, end);
          setSteps(result.steps);
          await AsyncStorage.setItem(STEPS_STORAGE_KEY, result.steps.toString());
        }
        subscription = Pedometer.watchStepCount(async (result) => {
          setSteps((prev) => { const n = prev + result.steps; AsyncStorage.setItem(STEPS_STORAGE_KEY, n.toString()); return n; });
        });
      } catch (err) { console.error('Podo:', err); setError('Erreur'); }
      finally { setInitializing(false); }
    };
    setupPedometer();
    return () => { if (subscription) subscription.remove(); };
  }, []);

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Pas
      </Text>
      {initializing ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={{ fontSize: 13, color: colors.textTertiary, marginLeft: 8 }}>Initialisation...</Text>
        </View>
      ) : error ? (
        <Text style={{ fontSize: 13, color: colors.textTertiary, textAlign: 'center' }}>{error}</Text>
      ) : (
        <>
          <Text style={{ fontSize: 32, fontWeight: '800', color: colors.text, marginBottom: 12 }}>
            {isAvailable ? steps.toLocaleString() : '...'}
          </Text>
          <ProgressBar progress={Math.min(steps / 10000, 1)} />
          <Text style={{ fontSize: 11, color: colors.textTertiary, marginTop: 6 }}>objectif 10 000</Text>
        </>
      )}
    </View>
  );
}
