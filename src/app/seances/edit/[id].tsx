import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../../../config/supabaseConfig";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../../../contexts/ThemeContext";
import { safeUUID } from "../../../../utils/validation";
import { logError } from "../../../../utils/logger";

type Exercice = { nom: string; series?: number | null; reps?: number | null; charge?: number | null };
type Seance = { nom: string; id_user: string; exercices: Exercice[] };

/** Shape of an exercice entry stored in the seances row */
interface ExerciceRow {
  nom?: string | null;
  series?: number | null;
  reps?: number | null;
  charge?: number | null;
  [key: string]: unknown;
}
export default function EditSeanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nom, setNom] = useState("");
  const [exercices, setExercices] = useState<Exercice[]>([]);

  // ---------- Auth guard ----------
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/");
    });
    return () => subscription.unsubscribe();
  }, [router]);

  // ---------- Fetch doc ----------
  useEffect(() => {
    let mounted = true;
    const safeId = safeUUID(id);
    if (!safeId) { router.back(); return; }
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.back(); return; }

        const { data, error } = await supabase
          .from("seances")
          .select("*")
          .eq("id", safeId)
          .eq("id_user", user.id)
          .single();

        if (error || !data) {
          Alert.alert("Introuvable", "Cette séance n'existe pas.");
          router.back();
          return;
        }
        if (!mounted) return;

        setNom(data.nom ?? "");
        setExercices(
          Array.isArray(data.exercices) && data.exercices.length
            ? data.exercices.map((e: ExerciceRow) => ({
                nom: e.nom ?? "",
                series: e.series ?? null,
                reps: e.reps ?? null,
                charge: e.charge ?? null,
              }))
            : [{ nom: "", series: null, reps: null, charge: null }]
        );
      } catch (e) {
        logError(e);
        Alert.alert("Erreur", "Impossible de charger la séance.");
        router.back();
      } finally {
        mounted && setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [id, router]);

  // ---------- Helpers ----------
  const updateExo = (idx: number, key: keyof Exercice, val: string) => {
    setExercices((prev) =>
      prev.map((e, i) =>
        i === idx
          ? {
              ...e,
              [key]:
                key === "nom"
                  ? val
                  : val === ""
                  ? null
                  : Number.isNaN(Number(val))
                  ? e[key]
                  : Number(val),
            }
          : e
      )
    );
  };

  const addExo = () =>
    setExercices((p) => [...p, { nom: "", series: null, reps: null, charge: null }]);
  const removeExo = (idx: number) => setExercices((p) => p.filter((_, i) => i !== idx));

  const isValid = useMemo(
    () => nom.trim().length > 0 && exercices.every((e) => e.nom.trim().length > 0),
    [nom, exercices]
  );

  // ---------- Save ----------
  const onSave = async () => {
    if (!isValid) {
      Alert.alert(
        "Champs manquants",
        "Renseigne au minimum le nom de la séance et de chaque exercice."
      );
      return;
    }
    try {
      setSaving(true);

      const cleaned = exercices.map((e) => ({
        nom: e.nom.trim(),
        ...(e.series != null ? { series: e.series } : {}),
        ...(e.reps != null ? { reps: e.reps } : {}),
        ...(e.charge != null ? { charge: e.charge } : {}),
      }));

      const { error } = await supabase
        .from("seances")
        .update({ nom: nom.trim(), exercices: cleaned })
        .eq("id", String(id));

      if (error) throw error;

      router.back();
    } catch (e) {
      logError(e);
      Alert.alert("Erreur", "Impossible d'enregistrer les modifications.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- UI ----------
  if (loading) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-3" style={{ color: colors.textTertiary }}>
          Chargement…
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      className="flex-1 h-full"
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <SafeAreaView
        className="mx-auto flex h-full items-center flex-col flex-wrap gap-3"
        style={{ backgroundColor: colors.background }}
      >
        <View className="w-full flex flex-row items-center mb-4 px-2 mt-6">
          <Pressable
            onPress={() => router.push("/workout")}
            className="absolute left-0 -translate-x-full p-2 rounded-full"
            style={{ backgroundColor: colors.primaryLight }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </Pressable>
          <Text
            className="text-xl font-semibold text-center"
            style={{ color: colors.text }}
          >
            Modifier la séance
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {/* Nom séance */}
          <View className="my-2 w-full">
            <Text className="my-2" style={{ color: colors.textSecondary }}>
              Nom de la séance
            </Text>
            <TextInput
              value={nom}
              onChangeText={setNom}
              placeholder="Ex: Upper #1"
              className="border rounded-xl px-4 py-3"
              style={{
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.divider,
              }}
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {exercices.map((exo, idx) => (
            <View
              key={idx}
              className="rounded-2xl border p-4 mb-4"
              style={{ borderColor: colors.border }}
            >
              <View className="flex-row justify-between items-center mb-3">
                <Text className="font-medium" style={{ color: colors.text }}>
                  Exercice {idx + 1}
                </Text>
                <Pressable
                  onPress={() => removeExo(idx)}
                  className="px-3 py-1 rounded-lg"
                  style={{ backgroundColor: colors.error }}
                >
                  <Text className="font-semibold" style={{ color: '#fff' }}>
                    Supprimer
                  </Text>
                </Pressable>
              </View>

              <TextInput
                value={exo.nom}
                onChangeText={(t) => updateExo(idx, "nom", t)}
                placeholder="Nom (ex: Développé couché)"
                className="border rounded-xl px-4 py-3 mb-3"
                style={{
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.divider,
                }}
                placeholderTextColor={colors.textTertiary}
              />

              <View className="flex-row justify-between">
                <View className="w-[32%]">
                  <Text className="mb-1" style={{ color: colors.textSecondary }}>
                    Séries
                  </Text>
                  <TextInput
                    keyboardType="numeric"
                    value={exo.series?.toString() ?? ""}
                    onChangeText={(t) => updateExo(idx, "series", t)}
                    placeholder="ex: 4"
                    className="border rounded-xl px-3 py-3"
                    style={{
                      borderColor: colors.border,
                      color: colors.text,
                      backgroundColor: colors.divider,
                    }}
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
                <View className="w-[32%]">
                  <Text className="mb-1" style={{ color: colors.textSecondary }}>
                    Reps
                  </Text>
                  <TextInput
                    keyboardType="numeric"
                    value={exo.reps?.toString() ?? ""}
                    onChangeText={(t) => updateExo(idx, "reps", t)}
                    placeholder="ex: 8"
                    className="border rounded-xl px-3 py-3"
                    style={{
                      borderColor: colors.border,
                      color: colors.text,
                      backgroundColor: colors.divider,
                    }}
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
                <View className="w-[32%]">
                  <Text className="mb-1" style={{ color: colors.textSecondary }}>
                    RPE
                  </Text>
                  <TextInput
                    keyboardType="numeric"
                    value={exo.charge?.toString() ?? ""}
                    onChangeText={(t) => updateExo(idx, "charge", t)}
                    placeholder="ex: 7"
                    className="border rounded-xl px-3 py-3"
                    style={{
                      borderColor: colors.border,
                      color: colors.text,
                      backgroundColor: colors.divider,
                    }}
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </View>
            </View>
          ))}

          <Pressable
            onPress={addExo}
            className="w-full mt-1 mb-6 self-start px-4 py-2 rounded-xl"
            style={{ backgroundColor: colors.primaryLight }}
          >
            <Text
              className="text-center font-semibold"
              style={{ color: colors.primary }}
            >
              + Ajouter un exercice
            </Text>
          </Pressable>

          <Pressable
            onPress={onSave}
            disabled={saving}
            className="w-full mt-2 mb-10 items-center justify-center rounded-2xl p-4"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-base font-semibold" style={{ color: '#fff' }}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
