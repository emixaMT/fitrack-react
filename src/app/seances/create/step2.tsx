// app/seances/create/step2.tsx
import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../config/supabaseConfig';
import { sportsMeta, SportKey } from '../../../../constantes/sport';
import React from 'react';

type Exercice = { nom: string; series?: number | null; reps?: number | null; charge?: number | null };

export default function Step2() {
  const { sport } = useLocalSearchParams<{ sport: SportKey }>();
  const router = useRouter();

  const meta = sport ? sportsMeta[sport] : null;

  // commun
  const [nomSeance, setNomSeance] = useState('');

  // force
  const [exercices, setExercices] = useState<Exercice[]>([
    { nom: '', series: null, reps: null, charge: null },
  ]);

  // endurance
  const [km, setKm] = useState('');
  const [vitesse, setVitesse] = useState('');
  const [denivele, setDenivele] = useState('');
  const [duree, setDuree] = useState('');

  const isForce = sport === 'musculation' || sport === 'crossfit';
  const isEndurance = sport === 'running' || sport === 'velo';

  const isValid = useMemo(() => {
    if (!nomSeance.trim() || !sport) return false;
    if (isForce) return exercices.every((e) => e.nom.trim().length > 0);
    if (isEndurance) return km.trim().length > 0;
    return false;
  }, [nomSeance, sport, exercices, km, isForce, isEndurance]);

  const addExo = () =>
    setExercices((prev) => [...prev, { nom: '', series: null, reps: null, charge: null }]);
  const removeExo = (idx: number) => setExercices((prev) => prev.filter((_, i) => i !== idx));
  const updateExo = (idx: number, key: keyof Exercice, raw: string) => {
    setExercices((prev) =>
      prev.map((e, i) =>
        i === idx
          ? {
              ...e,
              [key]:
                key === 'nom'
                  ? raw
                  : raw === ''
                  ? null
                  : Number.isNaN(Number(raw))
                  ? e[key]
                  : Number(raw),
            }
          : e
      )
    );
  };

  const onSave = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    
    try {
      const payload: any = {
        nom: nomSeance.trim(),
        category: sport,
        id_user: session.user.id,
        created_at: new Date().toISOString(),
      };

      if (isForce) {
        payload.exercices = exercices.map((e) => ({
          nom: e.nom.trim(),
          ...(e.series != null ? { series: e.series } : {}),
          ...(e.reps != null ? { reps: e.reps } : {}),
          ...(e.charge != null ? { charge: e.charge } : {}),
        }));
      } else if (isEndurance) {
        payload.objectifs = {
          km: km.trim(),
          vitesse: vitesse.trim(),
          denivele: denivele.trim(),
          ...(duree ? { duree: duree.trim() } : {}),
        };
        payload.exercices = [];
      }

      const { error } = await supabase.from('seances').insert(payload);
      
      if (error) throw error;

      // Redirection vers home pour voir le slider se rafraîchir
      router.replace('/home');
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', "Impossible d'enregistrer la séance");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white mt-12"
    >
      <ScrollView
        className="flex-1 bg-white px-6 py-8"
        keyboardShouldPersistTaps="handled"
      >
        {/* header image/tag */}
        {meta && (
          <View className="items-center mb-6">
            <Image source={meta.image} className="w-32 h-32 mb-2" resizeMode="contain" />
            <Text className="text-indigo-600 font-semibold text-3xl">{meta.label}</Text>
          </View>
        )}

        {/* nom */}
        <Text className="text-gray-700 mb-2">Nom de la séance</Text>
        <TextInput
          value={nomSeance}
          onChangeText={setNomSeance}
          placeholder="Ex: Upper Body #1 / Sortie tempo"
          className="border border-gray-300 rounded-xl px-4 py-3 mb-6 bg-gray-50"
          placeholderTextColor="#4f46e5" // indigo visible
        />

        {isForce && (
          <View>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-semibold text-gray-800">Exercices</Text>
              <Pressable onPress={addExo} className="px-3 py-2 bg-indigo-50 rounded-lg">
                <Text className="text-indigo-600 font-semibold">+ Ajouter</Text>
              </Pressable>
            </View>

            {exercices.map((exo, idx) => (
              <View key={idx} className="rounded-2xl border border-gray-200 p-4 mb-4">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-gray-700 font-medium">Exercice {idx + 1}</Text>
                  {exercices.length > 1 && (
                    <Pressable
                      onPress={() => removeExo(idx)}
                      className="px-3 py-1 rounded-lg bg-red-50"
                    >
                      <Text className="text-red-600 font-semibold">Supprimer</Text>
                    </Pressable>
                  )}
                </View>

                <Text className="text-gray-600 mt-3 mb-1">Nom</Text>
                <TextInput
                  value={exo.nom}
                  onChangeText={(t) => updateExo(idx, 'nom', t)}
                  placeholder="Nom (ex: Squat)"
                  className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50 mb-3"
                  placeholderTextColor="#4f46e5"
                />

                <View className="flex-row justify-between">
                  <View className="w-[32%]">
                    <Text className="text-gray-600 mb-1">Séries</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={exo.series?.toString() ?? ''}
                      onChangeText={(t) => updateExo(idx, 'series', t)}
                      placeholder="ex: 4"
                      className="border border-gray-300 rounded-xl px-3 py-3 bg-gray-50 text-gray-900"
                      placeholderTextColor="#4f46e5"
                    />
                  </View>
                  <View className="w-[32%]">
                    <Text className="text-gray-600 mb-1">Reps</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={exo.reps?.toString() ?? ''}
                      onChangeText={(t) => updateExo(idx, 'reps', t)}
                      placeholder="ex: 8"
                      className="border border-gray-300 rounded-xl px-3 py-3 bg-gray-50 text-gray-900"
                      placeholderTextColor="#4f46e5"
                    />
                  </View>
                  <View className="w-[32%]">
                    <Text className="text-gray-600 mb-1">Charge (kg)</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={exo.charge?.toString() ?? ''}
                      onChangeText={(t) => updateExo(idx, 'charge', t)}
                      placeholder="ex: 60"
                      className="border border-gray-300 rounded-xl px-3 py-3 bg-gray-50 text-gray-900"
                      placeholderTextColor="#4f46e5"
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {isEndurance && (
          <View>
            <Text className="text-lg font-semibold text-gray-800 mb-2">Objectifs</Text>

            <Text className="text-gray-600 mb-1">Distance (km)</Text>
            <TextInput
              value={km}
              onChangeText={setKm}
              keyboardType="numeric"
              placeholder="ex: 10"
              className="border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 mb-3"
              placeholderTextColor="#4f46e5"
            />

            <Text className="text-gray-600 mb-1">Vitesse / Allure</Text>
            <TextInput
              value={vitesse}
              onChangeText={setVitesse}
              placeholder="ex: 12 km/h ou 5:00 /km"
              className="border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 mb-3"
              placeholderTextColor="#4f46e5"
            />

            <Text className="text-gray-600 mb-1">Dénivelé (m)</Text>
            <TextInput
              value={denivele}
              onChangeText={setDenivele}
              keyboardType="numeric"
              placeholder="ex: 150"
              className="border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 mb-3"
              placeholderTextColor="#4f46e5"
            />

            <Text className="text-gray-600 mb-1">Durée (optionnel)</Text>
            <TextInput
              value={duree}
              onChangeText={setDuree}
              placeholder="ex: 45 min"
              className="border border-gray-300 rounded-xl px-4 py-3 bg-gray-50"
              placeholderTextColor="#4f46e5"
            />
          </View>
        )}

        <View className="h-4" />

        <Pressable
          onPress={onSave}
          disabled={!isValid}
          className={`rounded-2xl py-4 ${isValid ? 'bg-indigo-600' : 'bg-indigo-300'}`}
        >
          <Text className="text-center text-white font-semibold">Enregistrer la séance</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
