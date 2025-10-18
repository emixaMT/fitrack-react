// FILE: src/app/(tabs)/edit-performances.tsx
import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, ScrollView, Pressable, Alert,
  KeyboardAvoidingView, Platform, Image
} from "react-native";
import type { ImageSourcePropType } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../config/supabaseConfig";
import { checkAndUnlockBadges } from "../../../services/badgeService";
import { router } from "expo-router";

/* Avatars locaux (on stocke uniquement l'id en base). 
   Remplace les require(...) par tes vrais fichiers si tu en as 9 différents. */
const AVATAR_POOL: { id: string; src: ImageSourcePropType }[] = [
  { id: "a1", src: require("../../assets/avatar.png") },
  { id: "a2", src: require("../../assets/avatar2.png") },
  { id: "a3", src: require("../../assets/avatar3.png") },
  { id: "a4", src: require("../../assets/avatar4.png") },
  { id: "a5", src: require("../../assets/avatar5.png") },
  { id: "a6", src: require("../../assets/avatar6.png") },
  { id: "a7", src: require("../../assets/avatar7.png") },
  { id: "a8", src: require("../../assets/avatar8.png") },
  { id: "a9", src: require("../../assets/avatar9.png") },
];
const DEFAULT_AVATAR = require("../../assets/avatar.png");
const getAvatarSourceById = (id?: string): ImageSourcePropType =>
  AVATAR_POOL.find((a) => a.id === id)?.src ?? DEFAULT_AVATAR;

type RunningPerf = { label: string; value: string };
type HyroxPerf = { label: string; value: string; type: "solo" | "double" };

export default function EditPerformances() {
  const [saving, setSaving] = useState(false);
  const [squat, setSquat] = useState("");
  const [bench, setBench] = useState("");
  const [deadlift, setDeadlift] = useState("");
  const [running, setRunning] = useState<RunningPerf[]>([]);
  const [hyrox, setHyrox] = useState<HyroxPerf[]>([]);
  const [newWeight, setNewWeight] = useState("");
  const [weights, setWeights] = useState<{ date: Date; value: number }[]>([]);

  // Avatar local
  const [avatarSource, setAvatarSource] = useState<ImageSourcePropType>(DEFAULT_AVATAR);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | undefined>();
  const [avatarSheetVisible, setAvatarSheetVisible] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSquat(""); setBench(""); setDeadlift("");
        setRunning([]); setHyrox([]); setWeights([]);
        setAvatarSource(DEFAULT_AVATAR); setSelectedAvatarId(undefined);
        return;
      }

      // Load performances
      try {
        const { data: perfData } = await supabase
          .from("performances")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (perfData) {
          setSquat(perfData.squat != null ? String(perfData.squat) : "");
          setBench(perfData.bench != null ? String(perfData.bench) : "");
          setDeadlift(perfData.deadlift != null ? String(perfData.deadlift) : "");
          setRunning(Array.isArray(perfData.running) ? perfData.running : []);
          setHyrox(Array.isArray(perfData.hyrox) ? perfData.hyrox : []);
        }
      } catch (e) {
        console.error("Error loading performances:", e);
      }

      // Load user profile (avatar)
      try {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("avatar_id, photo_url")
          .eq("id", user.id)
          .maybeSingle();

        if (!userError && userData) {
          const avatarId = userData.avatar_id || userData.photo_url;
          if (avatarId) {
            setSelectedAvatarId(avatarId);
            setAvatarSource(getAvatarSourceById(avatarId));
          }
        }
      } catch (e) {
        console.error("Error loading user profile:", e);
      }

      // Load weights
      try {
        const { data: weightsData } = await supabase
          .from("weight_entries")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false });

        if (weightsData) {
          const items = weightsData.map((w: any) => ({
            date: new Date(w.date),
            value: Number(w.value),
          }));
          setWeights(items);
        }
      } catch (e) {
        console.error("Error loading weights:", e);
      }
    };

    loadData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadData();
    });

    return () => subscription.unsubscribe();
  }, []);

  const openAvatarPicker = () => setAvatarSheetVisible(true);

  async function handleSelectAvatar(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { Alert.alert("Session requise", "Veuillez vous reconnecter."); return; }
    setSavingAvatar(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ avatar_id: id, photo_url: id })
        .eq("id", user.id);
      
      if (error) {
        console.error("Avatar update error:", error);
        throw error;
      }
      
      setSelectedAvatarId(id);
      setAvatarSource(getAvatarSourceById(id));
      setAvatarSheetVisible(false);
      Alert.alert("Succès", "Photo mise à jour !");
    } catch (e: any) {
      console.error("Avatar error:", e);
      Alert.alert("Erreur", e?.message ?? "Impossible de mettre à jour l'avatar.");
    } finally { setSavingAvatar(false); }
  }

  const addWeight = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { Alert.alert("Session requise", "Veuillez vous reconnecter."); return; }
    const value = parseFloat(newWeight);
    if (Number.isNaN(value)) { Alert.alert("Erreur", "Veuillez entrer un poids valide."); return; }
    try {
      const { error } = await supabase
        .from("weight_entries")
        .insert({ user_id: user.id, value, date: new Date().toISOString() });
      
      if (error) {
        console.error("Weight insert error:", error);
        throw error;
      }
      
      setNewWeight("");
      
      // Vérifier et débloquer les badges automatiquement
      await checkAndUnlockBadges(user.id);
      
      Alert.alert("Succès", "Poids ajouté !");
      
      // Reload weights
      const { data: weightsData } = await supabase
        .from("weight_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });
      
      if (weightsData) {
        setWeights(weightsData.map((w: any) => ({
          date: new Date(w.date),
          value: Number(w.value),
        })));
      }
    } catch (e: any) { 
      console.error("Weight error:", e);
      Alert.alert("Erreur", e?.message ?? "Impossible d'ajouter le poids."); 
    }
  };

  const save = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { Alert.alert("Session requise", "Veuillez vous reconnecter."); return; }
    try {
      setSaving(true);
      const { error } = await supabase
        .from("performances")
        .upsert({
          user_id: user.id,
          squat: squat ? Number(squat) : null,
          bench: bench ? Number(bench) : null,
          deadlift: deadlift ? Number(deadlift) : null,
          running,
          hyrox,
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        console.error("Performance save error:", error);
        throw error;
      }
      
      // Vérifier et débloquer les badges automatiquement
      await checkAndUnlockBadges(user.id);
      
      Alert.alert("Données mises à jour.");
      router.push("/user");
    } catch (e: any) { 
      console.error("Save error:", e);
      Alert.alert("Erreur", e?.message ?? "Impossible de sauvegarder."); 
    }
    finally { setSaving(false); }
  };

  const addRunning = () => setRunning(r => [...r, { label: "", value: "" }]);
  const updateRunning = (i: number, key: keyof RunningPerf, val: string) =>
    setRunning(r => r.map((x, idx) => (i === idx ? { ...x, [key]: val } : x)));
  const removeRunning = (i: number) => setRunning(r => r.filter((_, idx) => idx !== i));
  const addHyrox = () => setHyrox(r => [...r, { label: "", value: "", type: "solo" }]);
  const updateHyrox = (i: number, key: keyof HyroxPerf, val: string) =>
    setHyrox(r => r.map((x, idx) => (i === idx ? { ...x, [key]: val } : x)));
  const removeHyrox = (i: number) => setHyrox(r => r.filter((_, idx) => idx !== i));

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-white" keyboardVerticalOffset={Platform.OS === "ios" ? 1 : 20} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView className="flex-1 bg-white p-6">
          {/* Entête */}
          <View className="items-center mb-6">
            <Image
              source={avatarSource} // ✅ image locale
              className="w-28 h-28 rounded-full border-4 border-white bg-indigo-300"
              resizeMode="cover"
            />
            <Pressable onPress={openAvatarPicker} disabled={savingAvatar} className="mt-3 bg-indigo-600 px-4 py-2 rounded-xl">
              <Text className="text-white font-semibold">{savingAvatar ? "Mise à jour..." : "Changer la photo"}</Text>
            </Pressable>
          </View>

          <Text className="text-center text-2xl font-bold text-indigo-600 mb-4">Modifier mes performances</Text>

          <View className="mb-8">
            <Text className="text-lg font-semibold text-gray-800 mb-2">Évolution du poids</Text>
            <View className="flex-row items-center gap-3">
              <TextInput value={newWeight} onChangeText={setNewWeight} keyboardType="numbers-and-punctuation" placeholder="Ex: 72.5" placeholderTextColor="#4f46e5" className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-gray-900" />
              <Pressable onPress={addWeight} className="bg-indigo-600 px-4 py-3 rounded-xl"><Text className="text-white font-semibold">+</Text></Pressable>
            </View>
            {weights.length > 0 && (
              <View className="mt-4">
                <Text className="text-sm text-gray-500 mb-1">Dernières valeurs :</Text>
                {weights.slice(0, 5).map((w, i) => (
                  <Text key={i} className="text-gray-700">{w.date.toLocaleDateString("fr-FR")} → {w.value} kg</Text>
                ))}
              </View>
            )}
          </View>

          <Text className="text-lg font-semibold mb-2">SBD</Text>
          <TextInput value={squat} onChangeText={setSquat} placeholder="Squat (kg)" placeholderTextColor={"#888"} className="border rounded-xl p-3 mb-3" />
          <TextInput value={bench} onChangeText={setBench} placeholder="Bench (kg)" placeholderTextColor={"#888"} className="border rounded-xl p-3 mb-3" />
          <TextInput value={deadlift} onChangeText={setDeadlift} placeholder="Deadlift (kg)" placeholderTextColor={"#888"} className="border rounded-xl p-3 mb-6" />

          <Text className="text-lg font-semibold mb-2">Running</Text>
          {running.map((r, i) => (
            <View key={i} className="mb-3 border rounded-xl p-3">
              <TextInput placeholder="Nom (10 km, IronMan...)" placeholderTextColor={"#888"} value={r.label} onChangeText={(t) => updateRunning(i, "label", t)} className="border-b mb-2 p-2" />
              <TextInput placeholder="Temps / objectif" placeholderTextColor={"#888"} value={r.value} onChangeText={(t) => updateRunning(i, "value", t)} className="p-2" />
              <Pressable onPress={() => removeRunning(i)} className="mt-2"><Text className="text-red-500">Supprimer</Text></Pressable>
            </View>
          ))}
          <Pressable onPress={addRunning} className="bg-indigo-50 p-3 rounded-xl mb-6">
            <Text className="text-indigo-600 font-semibold text-center">+ Ajouter une course</Text>
          </Pressable>

          <Text className="text-lg text-indigo-600 font-semibold mb-2">Hyrox</Text>
          {hyrox.map((h, i) => (
            <View key={i} className="mb-3 border rounded-xl p-3">
              <TextInput placeholder="Lieu (Paris, Berlin...)" placeholderTextColor={"#888"} value={h.label} onChangeText={(t) => updateHyrox(i, "label", t)} className="border-b mb-2 p-2" />
              <TextInput placeholder="Temps (ex: 1h05)" placeholderTextColor={"#888"} value={h.value} onChangeText={(t) => updateHyrox(i, "value", t)} className="border-b mb-2 p-2" />
              <View className="flex-row gap-4 mt-2">
                <Pressable onPress={() => updateHyrox(i, "type", "solo")} className={`px-3 py-2 rounded-xl ${h.type === "solo" ? "bg-indigo-600" : "bg-gray-200"}`}><Text className={h.type === "solo" ? "text-white" : "text-gray-700"}>Solo</Text></Pressable>
                <Pressable onPress={() => updateHyrox(i, "type", "double")} className={`px-3 py-2 rounded-xl ${h.type === "double" ? "bg-indigo-600" : "bg-gray-200"}`}><Text className={h.type === "double" ? "text-white" : "text-gray-700"}>Double</Text></Pressable>
              </View>
              <Pressable onPress={() => removeHyrox(i)} className="mt-2"><Text className="text-red-500">Supprimer</Text></Pressable>
            </View>
          ))}
          <Pressable onPress={addHyrox} className="bg-indigo-50 p-3 rounded-xl mb-6">
            <Text className="text-indigo-600 font-semibold text-center">+ Ajouter une performance Hyrox</Text>
          </Pressable>

          <Pressable onPress={save} disabled={saving} className="bg-indigo-600 rounded-xl py-4 mt-6">
            <Text className="text-center text-white font-semibold">{saving ? "Enregistrement..." : "Enregistrer"}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      {avatarSheetVisible && (
        <View className="absolute inset-0">
          <Pressable className="flex-1 bg-black/40" onPress={() => setAvatarSheetVisible(false)} />
          <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-semibold text-indigo-700 mb-4 text-center">Choisir un avatar</Text>
            <View className="flex-row flex-wrap justify-between">
              {AVATAR_POOL.map((a) => {
                const selected = a.id === selectedAvatarId;
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => handleSelectAvatar(a.id)}
                    className={`w-[30%] aspect-square mb-4 rounded-full overflow-hidden ${selected ? "ring-4 ring-indigo-900 bg-indigo-300" : ""}`}
                  >
                    <Image source={a.src} className="w-full h-full" />
                  </Pressable>
                );
              })}
            </View>
            <Pressable onPress={() => setAvatarSheetVisible(false)} className="mt-2 bg-gray-200 py-3 rounded-xl">
              <Text className="text-center text-gray-700">Fermer</Text>
            </Pressable>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
