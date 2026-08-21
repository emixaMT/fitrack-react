// app/seances/create/step2.tsx
import { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../config/supabaseConfig';
import { sportsMeta, SportKey } from '../../../../constants/sport';
import { workoutTemplates } from '../../../../constants/workoutTemplates';
import { checkAndUnlockBadges } from '../../../../services/badgeService';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { useExerciseRecords } from '../../../../hooks/useExerciseRecords';
import { logError } from '../../../../utils/logger';
import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type Exercice = { nom: string; series?: number | null; reps?: number | null; charge?: number | null };

interface SeanceInsertPayload {
  nom: string;
  category: SportKey;
  id_user: string;
  created_at: string;
  exercices?: Exercice[];
  objectifs?: {
    km: string;
    vitesse: string;
    denivele: string;
    duree?: string;
  };
}

// Exercices communs suggérés par défaut
const COMMON_EXERCISES = [
  'Squat', 'Développé couché', 'Soulevé de terre', 'Tractions',
  'Dips', 'Fentes', 'Hip Thrust', 'Rowing barre',
  'Développé militaire', 'Curl biceps', 'Extension triceps',
  'Pompes', 'Burpees', 'Kettlebell swing', 'Box jump',
];

export default function Step2() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { getRecord, loading: recordsLoading } = useExerciseRecords(user?.id);
  const { sport, templateId } = useLocalSearchParams<{ sport: SportKey; templateId?: string }>();
  const router = useRouter();

  const meta = sport ? sportsMeta[sport] : null;
  const template = templateId ? workoutTemplates.find((t) => t.id === templateId) : null;

  // commun
  const [nomSeance, setNomSeance] = useState(template?.name ?? '');
  const nomRef = useRef<TextInput>(null);

  // force
  const [exercices, setExercices] = useState<Exercice[]>(
    template?.exercices
      ? template.exercices.map((e) => ({ nom: e.nom, series: e.series, reps: e.reps, charge: e.charge }))
      : [{ nom: '', series: null, reps: null, charge: null }]
  );

  // endurance
  const [km, setKm] = useState(template?.objectifs?.km ?? '');
  const [vitesse, setVitesse] = useState(template?.objectifs?.vitesse ?? '');
  const [denivele, setDenivele] = useState(template?.objectifs?.denivele ?? '');
  const [duree, setDuree] = useState(template?.objectifs?.duree ?? '');

  // suggestions
  const [pastExercises, setPastExercises] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeExoIdx, setActiveExoIdx] = useState<number | null>(null);

  const isForce = sport === 'musculation' || sport === 'crossfit';
  const isEndurance = sport === 'running' || sport === 'velo';

  // Auto-focus sur le nom au chargement (seulement si pas de template)
  useEffect(() => {
    if (template) return;
    const timer = setTimeout(() => {
      if (nomRef.current) nomRef.current.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, [template]);

  // Charger les exercices passés pour les suggestions
  useEffect(() => {
    if (!isForce || !user) return;
    const loadPastExercises = async () => {
      try {
        const { data } = await supabase
          .from('seances')
          .select('exercices')
          .eq('id_user', user.id)
          .order('created_at', { ascending: false })
          .limit(30);

        if (data) {
          const names = new Set<string>();
          data.forEach((seance) => {
            if (Array.isArray(seance.exercices)) {
              seance.exercices.forEach((ex: { nom?: string }) => {
                if (ex.nom?.trim()) names.add(ex.nom.trim());
              });
            }
          });
          setPastExercises(Array.from(names));
        }
      } catch (e) {
        logError('Error loading past exercises:', e);
      }
    };
    loadPastExercises();
  }, [isForce, user]);

  // Suggestions filtrées
  const filteredSuggestions = useMemo(() => {
    if (activeExoIdx === null) return [];
    const query = exercices[activeExoIdx]?.nom.trim().toLowerCase() ?? '';
    if (query.length === 0) {
      // Afficher d'abord les exercices passés, puis les communs
      const combined = [...pastExercises];
      COMMON_EXERCISES.forEach((c) => {
        if (!combined.some((p) => p.toLowerCase() === c.toLowerCase())) {
          combined.push(c);
        }
      });
      return combined.slice(0, 6);
    }
    const all = [...pastExercises, ...COMMON_EXERCISES.filter(c => !pastExercises.some(p => p.toLowerCase() === c.toLowerCase()))];
    return all.filter((name) => name.toLowerCase().includes(query)).slice(0, 6);
  }, [activeExoIdx, exercices, pastExercises]);

  const isValid = useMemo(() => {
    if (!nomSeance.trim() || !sport) return false;
    if (isForce) return exercices.every((e) => e.nom.trim().length > 0);
    if (isEndurance) return km.trim().length > 0;
    return false;
  }, [nomSeance, sport, exercices, km, isForce, isEndurance]);

  const addExo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExercices((prev) => [...prev, { nom: '', series: null, reps: null, charge: null }]);
  };
  const removeExo = (idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExercices((prev) => prev.filter((_, i) => i !== idx));
  };
  const duplicateExo = (idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExercices((prev) => {
      const copy = { ...prev[idx] };
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
    });
  };
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

  const selectSuggestion = (name: string) => {
    if (activeExoIdx === null) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateExo(activeExoIdx, 'nom', name);
    setShowSuggestions(false);
    setActiveExoIdx(null);
    Keyboard.dismiss();
  };

  const onSave = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const payload: SeanceInsertPayload = {
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      logError(e);
      Alert.alert('Erreur', "Impossible d'enregistrer la séance");
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setShowSuggestions(false);
    setActiveExoIdx(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={{ flex: 1 }}>
          {/* Header avec retour + indicateur */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={{ padding: 8, borderRadius: 12, backgroundColor: colors.divider }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 24, height: 4, borderRadius: 2, backgroundColor: colors.divider }} />
              <View style={{ width: 24, height: 4, borderRadius: 2, backgroundColor: colors.primary }} />
              <Text style={{ fontSize: 12, color: colors.textTertiary, marginLeft: 4 }}>2/2</Text>
            </View>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100 }}
          >
            {/* Header sport */}
            {meta && (
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <View style={{
                  width: 64, height: 64, borderRadius: 20,
                  backgroundColor: colors.primary,
                  alignItems: 'center', justifyContent: 'center', marginBottom: 8,
                }}>
                  <Ionicons name={meta.icon as IoniconName} size={32} color="#fff" />
                </View>
                <Text style={{ fontSize: 24, fontWeight: '700', color: colors.primary }}>{meta.label}</Text>
                {template && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.primary + '18' }}>
                    <Ionicons name="clipboard-outline" size={12} color={colors.primary} />
                    <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>{template.type}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Nom de la séance */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>
              Nom de la séance
            </Text>
            <TextInput
              ref={nomRef}
              value={nomSeance}
              onChangeText={setNomSeance}
              placeholder="Ex: Upper Body #1 / Sortie tempo"
              placeholderTextColor={colors.textTertiary}
              style={{
                borderWidth: 1, borderColor: colors.border, borderRadius: 12,
                paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20,
                color: colors.text, backgroundColor: colors.card, fontSize: 16,
              }}
              maxLength={60}
              returnKeyType="next"
            />

            {isForce && (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Exercices</Text>
                  <Pressable
                    onPress={addExo}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.primary + '18' }}
                  >
                    <Ionicons name="add" size={16} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>Ajouter</Text>
                  </Pressable>
                </View>

                {exercices.map((exo, idx) => (
                  <View
                    key={idx}
                    style={{
                      borderRadius: 16, padding: 16, marginBottom: 12,
                      backgroundColor: colors.card,
                    }}
                  >
                    {/* Header de la carte exercice */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textTertiary }}>
                        Exercice {idx + 1}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Pressable
                          onPress={() => duplicateExo(idx)}
                          hitSlop={8}
                          style={{ padding: 4, borderRadius: 8, backgroundColor: colors.divider }}
                        >
                          <Ionicons name="copy-outline" size={16} color={colors.textSecondary} />
                        </Pressable>
                        {exercices.length > 1 && (
                          <Pressable
                            onPress={() => removeExo(idx)}
                            hitSlop={8}
                            style={{ padding: 4, borderRadius: 8, backgroundColor: colors.error + '1A' }}
                          >
                            <Ionicons name="trash-outline" size={16} color={colors.error} />
                          </Pressable>
                        )}
                      </View>
                    </View>

                    {/* Nom de l'exercice */}
                    <Text style={{ fontSize: 12, color: colors.textTertiary, marginBottom: 4 }}>Nom</Text>
                    <TextInput
                      value={exo.nom}
                      onChangeText={(t) => updateExo(idx, 'nom', t)}
                      onFocus={() => { setActiveExoIdx(idx); setShowSuggestions(true); }}
                      placeholder="Nom (ex: Squat)"
                      placeholderTextColor={colors.textTertiary}
                      style={{
                        borderWidth: 1, borderColor: colors.border, borderRadius: 10,
                        paddingHorizontal: 12, paddingVertical: 10, marginBottom: 4,
                        color: colors.text, backgroundColor: colors.background, fontSize: 15,
                      }}
                      maxLength={50}
                    />

                    {/* Suggestions */}
                    {showSuggestions && activeExoIdx === idx && filteredSuggestions.length > 0 && (
                      <View style={{
                        marginBottom: 8, borderRadius: 10, overflow: 'hidden',
                        backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
                      }}>
                        {filteredSuggestions.map((name) => (
                          <Pressable
                            key={name}
                            onPress={() => selectSuggestion(name)}
                            style={({ pressed }) => ({
                              paddingHorizontal: 12, paddingVertical: 10,
                              backgroundColor: pressed ? colors.divider : 'transparent',
                              flexDirection: 'row', alignItems: 'center', gap: 8,
                            })}
                          >
                            <Ionicons name="barbell-outline" size={14} color={colors.textTertiary} />
                            <Text style={{ color: colors.text, fontSize: 14 }}>{name}</Text>
                            {pastExercises.includes(name) && (
                              <View style={{ marginLeft: 'auto', backgroundColor: colors.primary + '18', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '600' }}>Récent</Text>
                              </View>
                            )}
                          </Pressable>
                        ))}
                      </View>
                    )}

                    {/* Record indicator */}
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
                          <Text style={{ color: '#FFD700', fontSize: 11, marginBottom: 8, marginLeft: 2 }}>
                            Nouveau record !
                          </Text>
                        );
                      }
                      return (
                        <Text style={{ color: colors.textTertiary, fontSize: 11, marginBottom: 8, marginLeft: 2 }}>
                          Record: {record.maxCharge ?? '—'}kg x {record.maxReps ?? '—'}
                        </Text>
                      );
                    })()}

                    {/* Series / Reps / Charge */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, color: colors.textTertiary, marginBottom: 4 }}>Séries</Text>
                        <TextInput
                          keyboardType="numeric"
                          value={exo.series?.toString() ?? ''}
                          onChangeText={(t) => updateExo(idx, 'series', t)}
                          placeholder="ex: 4"
                          placeholderTextColor={colors.textTertiary}
                          style={{
                            borderWidth: 1, borderColor: colors.border, borderRadius: 10,
                            paddingHorizontal: 10, paddingVertical: 10,
                            color: colors.text, backgroundColor: colors.background, fontSize: 15, textAlign: 'center',
                          }}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, color: colors.textTertiary, marginBottom: 4 }}>Reps</Text>
                        <TextInput
                          keyboardType="numeric"
                          value={exo.reps?.toString() ?? ''}
                          onChangeText={(t) => updateExo(idx, 'reps', t)}
                          placeholder="ex: 8"
                          placeholderTextColor={colors.textTertiary}
                          style={{
                            borderWidth: 1, borderColor: colors.border, borderRadius: 10,
                            paddingHorizontal: 10, paddingVertical: 10,
                            color: colors.text, backgroundColor: colors.background, fontSize: 15, textAlign: 'center',
                          }}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, color: colors.textTertiary, marginBottom: 4 }}>Charge (kg)</Text>
                        <TextInput
                          keyboardType="numeric"
                          value={exo.charge?.toString() ?? ''}
                          onChangeText={(t) => updateExo(idx, 'charge', t)}
                          placeholder="ex: 80"
                          placeholderTextColor={colors.textTertiary}
                          style={{
                            borderWidth: 1, borderColor: colors.border, borderRadius: 10,
                            paddingHorizontal: 10, paddingVertical: 10,
                            color: colors.text, backgroundColor: colors.background, fontSize: 15, textAlign: 'center',
                          }}
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {isEndurance && (
              <View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 }}>Objectifs</Text>

                <Text style={{ fontSize: 12, color: colors.textTertiary, marginBottom: 4 }}>Distance (km)</Text>
                <TextInput
                  value={km}
                  onChangeText={setKm}
                  keyboardType="numeric"
                  placeholder="ex: 10"
                  placeholderTextColor={colors.textTertiary}
                  style={{
                    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
                    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12,
                    color: colors.text, backgroundColor: colors.card, fontSize: 16,
                  }}
                />

                <Text style={{ fontSize: 12, color: colors.textTertiary, marginBottom: 4 }}>Vitesse / Allure</Text>
                <TextInput
                  value={vitesse}
                  onChangeText={setVitesse}
                  placeholder="ex: 12 km/h ou 5:00 /km"
                  placeholderTextColor={colors.textTertiary}
                  style={{
                    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
                    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12,
                    color: colors.text, backgroundColor: colors.card, fontSize: 16,
                  }}
                />

                <Text style={{ fontSize: 12, color: colors.textTertiary, marginBottom: 4 }}>Dénivelé (m)</Text>
                <TextInput
                  value={denivele}
                  onChangeText={setDenivele}
                  keyboardType="numeric"
                  placeholder="ex: 150"
                  placeholderTextColor={colors.textTertiary}
                  style={{
                    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
                    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12,
                    color: colors.text, backgroundColor: colors.card, fontSize: 16,
                  }}
                />

                <Text style={{ fontSize: 12, color: colors.textTertiary, marginBottom: 4 }}>Durée (optionnel)</Text>
                <TextInput
                  value={duree}
                  onChangeText={setDuree}
                  placeholder="ex: 45 min"
                  placeholderTextColor={colors.textTertiary}
                  style={{
                    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
                    paddingHorizontal: 14, paddingVertical: 12,
                    color: colors.text, backgroundColor: colors.card, fontSize: 16,
                  }}
                />
              </View>
            )}
          </ScrollView>

          {/* Barre sticky en bas */}
          <View style={{
            paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16,
            backgroundColor: colors.background,
            borderTopWidth: 1, borderTopColor: colors.border,
          }}>
            <Pressable
              onPress={onSave}
              disabled={!isValid}
              style={{
                borderRadius: 14, paddingVertical: 16, alignItems: 'center',
                backgroundColor: isValid ? colors.primary : colors.divider,
              }}
            >
              <Text style={{ color: isValid ? '#fff' : colors.textTertiary, fontWeight: '700', fontSize: 16 }}>
                Enregistrer la séance
              </Text>
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
