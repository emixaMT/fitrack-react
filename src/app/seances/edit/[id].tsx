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
import { auth, db } from "../../../../config/firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import Ionicons from "@expo/vector-icons/Ionicons";

type Exercice = { nom: string; series?: number | null; reps?: number | null; charge?: number | null };
type Seance = { nom: string; id_user: string; exercices: Exercice[] };

export default function EditSeanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nom, setNom] = useState("");
  const [exercices, setExercices] = useState<Exercice[]>([]);

  // ---------- Auth guard ----------
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) router.replace("/");
    });
    return unsub;
  }, [router]);

  // ---------- Fetch doc ----------
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const ref = doc(db, "Seances", String(id));
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          Alert.alert("Introuvable", "Cette séance n'existe pas.");
          router.back();
          return;
        }
        const data = snap.data() as Seance;
        if (!mounted) return;

        setNom(data.nom ?? "");
        setExercices(
          Array.isArray(data.exercices) && data.exercices.length
            ? data.exercices.map((e) => ({
                nom: e.nom ?? "",
                series: e.series ?? null,
                reps: e.reps ?? null,
                charge: e.charge ?? null,
              }))
            : [{ nom: "", series: null, reps: null, charge: null }]
        );
      } catch (e) {
        console.error(e);
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
      const ref = doc(db, "Seances", String(id));

      const cleaned = exercices.map((e) => ({
        nom: e.nom.trim(),
        ...(e.series != null ? { series: e.series } : {}),
        ...(e.reps != null ? { reps: e.reps } : {}),
        ...(e.charge != null ? { charge: e.charge } : {}),
      }));

      await updateDoc(ref, { nom: nom.trim(), exercices: cleaned });

      Alert.alert("Sauvegardé ✅", "La séance a été mise à jour.", [
        { text: "Ok", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible d'enregistrer les modifications.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- UI ----------
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="text-gray-500 mt-3">Chargement…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 h-full bg-white"
    >
      <SafeAreaView className="mx-auto flex h-full items-center bg-white flex-col flex-wrap gap-3">
        <View className="w-full flex flex-row items-center mb-4 px-2 mt-6">
          <Pressable
            onPress={() => router.push("/workout")}
            className="absolute left-0 -translate-x-full p-2 rounded-full bg-indigo-50"
          >
            <Ionicons name="arrow-back" size={24} color="#4f46e5" />
          </Pressable>
          <Text className="text-xl font-semibold text-gray-800 text-center">
            Modifier la séance
          </Text>
        </View>

        <ScrollView>
          {/* Nom séance */}
          <View className="my-2 w-full">
            <Text className="text-gray-600 my-2">Nom de la séance</Text>
            <TextInput
              value={nom}
              onChangeText={setNom}
              placeholder="Ex: Upper #1"
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
              placeholderTextColor="#4f46e5"
            />
          </View>

          {exercices.map((exo, idx) => (
            <View key={idx} className="rounded-2xl border border-gray-200 p-4 mb-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-gray-700 font-medium">Exercice {idx + 1}</Text>
                <Pressable
                  onPress={() => removeExo(idx)}
                  className="px-3 py-1 rounded-lg bg-red-50"
                >
                  <Text className="text-red-600 font-semibold">Supprimer</Text>
                </Pressable>
              </View>

              <TextInput
                value={exo.nom}
                onChangeText={(t) => updateExo(idx, "nom", t)}
                placeholder="Nom (ex: Développé couché)"
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50 mb-3"
                placeholderTextColor="#4f46e5"
              />

              <View className="flex-row justify-between">
                <View className="w-[32%]">
                  <Text className="text-gray-600 mb-1">Séries</Text>
                  <TextInput
                    keyboardType="numeric"
                    value={exo.series?.toString() ?? ""}
                    onChangeText={(t) => updateExo(idx, "series", t)}
                    placeholder="ex: 4"
                    className="border border-gray-300 rounded-xl px-3 py-3 bg-gray-50 text-gray-900"
                    placeholderTextColor="#4f46e5"
                  />
                </View>
                <View className="w-[32%]">
                  <Text className="text-gray-600 mb-1">Reps</Text>
                  <TextInput
                    keyboardType="numeric"
                    value={exo.reps?.toString() ?? ""}
                    onChangeText={(t) => updateExo(idx, "reps", t)}
                    placeholder="ex: 8"
                    className="border border-gray-300 rounded-xl px-3 py-3 bg-gray-50 text-gray-900"
                    placeholderTextColor="#4f46e5"
                  />
                </View>
                <View className="w-[32%]">
                  <Text className="text-gray-600 mb-1">Charge (kg)</Text>
                  <TextInput
                    keyboardType="numeric"
                    value={exo.charge?.toString() ?? ""}
                    onChangeText={(t) => updateExo(idx, "charge", t)}
                    placeholder="ex: 60"
                    className="border border-gray-300 rounded-xl px-3 py-3 bg-gray-50 text-gray-900"
                    placeholderTextColor="#4f46e5"
                  />
                </View>
              </View>
            </View>
          ))}

          <Pressable
            onPress={addExo}
            className="w-full mt-1 mb-6 self-start px-4 py-2 rounded-xl bg-indigo-50"
          >
            <Text className="text-center text-indigo-600 font-semibold">
              + Ajouter un exercice
            </Text>
          </Pressable>

          <Pressable
            onPress={onSave}
            disabled={saving}
            className="w-full mt-2 mb-10 items-center justify-center rounded-2xl bg-indigo-600 p-4"
          >
            <Text className="text-white text-base font-semibold">
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
