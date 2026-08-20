// app/seances/create/step2.tsx
import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../config/supabaseConfig';
import { sportsMeta, SportKey } from '../../../../constants/sport';
import { checkAndUnlockBadges } from '../../../../services/badgeService';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { useExerciseRecords } from '../../../../hooks/useExerciseRecords';
import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

type Exercice = { nom: string; series?: number | null; reps?: number | null; charge?: number | null };

export default function Step2() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { getRecord, loading: recordsLoading } = useExerciseRecords(user?.id);
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

      // Vérifier et débloquer les badges automatiquement
      await checkAndUnlockBadges(session.user.id);

      // Redirection vers home pour voir le slider se rafraîchir
      router.replace('/home');
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', "Impossible d'enregistrer la séance");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      className="flex-1"
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View className="pt-12 flex-1">
        <Pressable
          onPress={() => router.push('/workout')}
          className="p-2 rounded-full absolute top-16 left-4 z-10"
          style={{ backgroundColor: colors.divider }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>

        <ScrollView
          className="flex-1 px-6 py-8"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, backgroundColor: colors.background }}
        >
          {/* header image/tag */}
          {meta && (
            <View className="items-center mb-6">
              <View style={{
                width: 80, height: 80, borderRadius: 24,
                backgroundColor: colors.primary,
                alignItems: 'center', justifyContent: 'center', marginBottom: 8,
              }}>
                <Ionicons name={meta.icon as any} size={40} color="#fff" />
              </View>
              <Text className="font-semibold text-3xl" style={{ color: colors.primary }}>{meta.label}</Text>
            </View>
          )}

        {/* nom */}
        <Text className="mb-2" style={{ color: colors.text }}>Nom de la séance</Text>
        <TextInput
          value={nomSeance}
          onChangeText={setNomSeance}
          placeholder="Ex: Upper Body #1 / Sortie tempo"
          className="border rounded-xl px-4 py-3 mb-6"
          style={{ borderColor: colors.border, backgroundColor: colors.divider }}
          placeholderTextColor={colors.textTertiary}
        />

        {isForce && (
          <View>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-semibold" style={{ color: colors.text }}>Exercices</Text>
              <Pressable
                onPress={addExo}
                className="px-3 py-2 rounded-lg"
                style={{ backgroundColor: colors.divider }}
              >
                <Text className="font-semibold" style={{ color: colors.primary }}>+ Ajouter</Text>
              </Pressable>
            </View>

            {exercices.map((exo, idx) => (
              <View
                key={idx}
                className="rounded-2xl border p-4 mb-4"
                style={{ borderColor: colors.border }}
              >
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="font-medium" style={{ color: colors.text }}>Exercice {idx + 1}</Text>
                  {exercices.length > 1 && (
                    <Pressable
                      onPress={() => removeExo(idx)}
                      className="px-3 py-1 rounded-lg"
                      style={{ backgroundColor: colors.error + '1A' }}
                    >
                      <Text className="font-semibold" style={{ color: colors.error }}>Supprimer</Text>
                    </Pressable>
                  )}
                </View>

                <Text className="mt-3 mb-1" style={{ color: colors.textSecondary }}>Nom</Text>
                <TextInput
                  value={exo.nom}
                  onChangeText={(t) => updateExo(idx, 'nom', t)}
                  placeholder="Nom (ex: Squat)"
                  className="border rounded-xl px-4 py-3 mb-1"
                  style={{ borderColor: colors.border, backgroundColor: colors.divider, color: colors.text }}
                  placeholderTextColor={colors.textTertiary}
                  maxLength={50}
                />
                {(() => {
                  const name = exo.nom.trim();
                  if (!name || recordsLoading) return null;
                  const record = getRecord(name);
                  if (!record) return null;
                  const currentVolume =
                    exo.charge != null && exo.reps != null
                      ? exo.charge * exo.reps
                      : exo.charge ?? 0;
                  const isNewRecord =
                    currentVolume > 0 && currentVolume > record.maxVolume;
                  if (isNewRecord) {
                    return (
                      <Text
                        style={{ color: '#FFD700', fontSize: 11, marginBottom: 8, marginLeft: 2 }}
                      >
                        🏆 Nouveau record !
                      </Text>
                    );
                  }
                  return (
                    <Text
                      style={{ color: colors.textTertiary, fontSize: 11, marginBottom: 8, marginLeft: 2 }}
                    >
                      Record: {record.maxCharge ?? '—'}kg × {record.maxReps ?? '—'}
                    </Text>
                  );
                })()}

                <View className="flex-row justify-between">
                  <View className="w-[32%]">
                    <Text className="mb-1" style={{ color: colors.textSecondary }}>Séries</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={exo.series?.toString() ?? ''}
                      onChangeText={(t) => updateExo(idx, 'series', t)}
                      placeholder="ex: 4"
                      className="border rounded-xl px-3 py-3"
                      style={{ borderColor: colors.border, backgroundColor: colors.divider, color: colors.text }}
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                  <View className="w-[32%]">
                    <Text className="mb-1" style={{ color: colors.textSecondary }}>Reps</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={exo.reps?.toString() ?? ''}
                      onChangeText={(t) => updateExo(idx, 'reps', t)}
                      placeholder="ex: 8"
                      className="border rounded-xl px-3 py-3"
                      style={{ borderColor: colors.border, backgroundColor: colors.divider, color: colors.text }}
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                  <View className="w-[32%]">
                    <Text className="mb-1" style={{ color: colors.textSecondary }}>RPE</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={exo.charge?.toString() ?? ''}
                      onChangeText={(t) => updateExo(idx, 'charge', t)}
                      placeholder="ex: 7"
                      className="border rounded-xl px-3 py-3"
                      style={{ borderColor: colors.border, backgroundColor: colors.divider, color: colors.text }}
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {isEndurance && (
          <View>
            <Text className="text-lg font-semibold mb-2" style={{ color: colors.text }}>Objectifs</Text>

            <Text className="mb-1" style={{ color: colors.textSecondary }}>Distance (km)</Text>
            <TextInput
              value={km}
              onChangeText={setKm}
              keyboardType="numeric"
              placeholder="ex: 10"
              className="border rounded-xl px-4 py-3 mb-3"
              style={{ borderColor: colors.border, backgroundColor: colors.divider }}
              placeholderTextColor={colors.textTertiary}
            />

            <Text className="mb-1" style={{ color: colors.textSecondary }}>Vitesse / Allure</Text>
            <TextInput
              value={vitesse}
              onChangeText={setVitesse}
              placeholder="ex: 12 km/h ou 5:00 /km"
              className="border rounded-xl px-4 py-3 mb-3"
              style={{ borderColor: colors.border, backgroundColor: colors.divider }}
              placeholderTextColor={colors.textTertiary}
            />

            <Text className="mb-1" style={{ color: colors.textSecondary }}>Dénivelé (m)</Text>
            <TextInput
              value={denivele}
              onChangeText={setDenivele}
              keyboardType="numeric"
              placeholder="ex: 150"
              className="border rounded-xl px-4 py-3 mb-3"
              style={{ borderColor: colors.border, backgroundColor: colors.divider }}
              placeholderTextColor={colors.textTertiary}
            />

            <Text className="mb-1" style={{ color: colors.textSecondary }}>Durée (optionnel)</Text>
            <TextInput
              value={duree}
              onChangeText={setDuree}
              placeholder="ex: 45 min"
              className="border rounded-xl px-4 py-3"
              style={{ borderColor: colors.border, backgroundColor: colors.divider }}
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        )}

        <View className="h-4" />

          <Pressable
            onPress={onSave}
            disabled={!isValid}
            className="rounded-2xl mb-12 py-4"
            style={{ backgroundColor: isValid ? colors.primary : colors.divider }}
          >
            <Text className="text-center font-semibold" style={{ color: '#fff' }}>Enregistrer la séance</Text>
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
