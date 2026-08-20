// FILE: src/app/compte/edit-perfs.tsx
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
import { useTheme } from "../../../contexts/ThemeContext";
import { AVATAR_IDS, DEFAULT_AVATAR, getAvatarSourceById } from "../../../constants/avatars";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { logError } from "../../../utils/logger";

type RunningPerf = { label: string; value: string };
type HyroxPerf = { label: string; value: string; type: "solo" | "double" };

/** Shape of a weight_entries row from Supabase */
interface WeightEntryRow {
  date: string;
  value: number;
  [key: string]: unknown;
}

/** Shape of a React Native file asset for Supabase Storage upload */
interface RNAssetFile {
  uri: string;
  type: string;
  name: string;
}

export default function EditPerformances() {
  const { colors, isDarkMode } = useTheme();
  const [saving, setSaving] = useState(false);
  const [profileName, setProfileName] = useState("");
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
        logError("Error loading performances:", e);
      }

      try {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("avatar_id, photo_url, name")
          .eq("id", user.id)
          .maybeSingle();

        if (!userError && userData) {
          setProfileName(userData.name ?? "");
          const avatarId = userData.avatar_id || userData.photo_url;
          if (avatarId) {
            setSelectedAvatarId(avatarId);
            setAvatarSource(getAvatarSourceById(avatarId));
          }
        }
      } catch (e) {
        logError("Error loading user profile:", e);
      }

      try {
        const { data: weightsData } = await supabase
          .from("weight_entries")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false });

        if (weightsData) {
          const items = weightsData.map((w: WeightEntryRow) => ({
            date: new Date(w.date),
            value: Number(w.value),
          }));
          setWeights(items);
        }
      } catch (e) {
        logError("Error loading weights:", e);
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
        logError("Avatar update error:", error);
        throw error;
      }

      setSelectedAvatarId(id);
      setAvatarSource(getAvatarSourceById(id));
      setAvatarSheetVisible(false);
      Alert.alert("Succès", "Photo mise à jour !");
    } catch (e: unknown) {
      logError("Avatar error:", e);
      Alert.alert("Erreur", "Impossible de mettre à jour l'avatar.");
    } finally { setSavingAvatar(false); }
  }

  async function handleImportPhoto() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { Alert.alert("Session requise", "Veuillez vous reconnecter."); return; }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
      return;
    }

    setSavingAvatar(true);
    try {
      const ext = pickerResult.assets[0].uri.split(".").pop() || "jpg";
      const fileName = `avatars/${user.id}.${ext}`;
      const file: RNAssetFile = {
        uri: pickerResult.assets[0].uri,
        type: `image/${ext}`,
        name: fileName,
      };

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file as unknown as Blob, { upsert: true });

      if (uploadError) {
        logError("Upload error:", uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("users")
        .update({ photo_url: publicUrl, avatar_id: publicUrl })
        .eq("id", user.id);

      if (updateError) {
        logError("Profile update error:", updateError);
        throw updateError;
      }

      setSelectedAvatarId(publicUrl);
      setAvatarSource({ uri: publicUrl });
      setAvatarSheetVisible(false);
      Alert.alert("Succès", "Photo mise à jour !");
    } catch (e: unknown) {
      logError("Import photo error:", e);
      Alert.alert("Erreur", "Impossible d'importer la photo.");
    } finally {
      setSavingAvatar(false);
    }
  }

  const addWeight = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { Alert.alert("Session requise", "Veuillez vous reconnecter."); return; }
    const value = parseFloat(newWeight);
    if (Number.isNaN(value)) { Alert.alert("Erreur", "Veuillez entrer un poids valide."); return; }
    if (value < 20 || value > 300) { Alert.alert("Erreur", "Le poids doit être entre 20 et 300 kg."); return; }
    try {
      const { error } = await supabase
        .from("weight_entries")
        .insert({ user_id: user.id, value, date: new Date().toISOString() });

      if (error) {
        logError("Weight insert error:", error);
        throw error;
      }

      setNewWeight("");

      await checkAndUnlockBadges(user.id);

      Alert.alert("Succès", "Poids ajouté !");

      const { data: weightsData } = await supabase
        .from("weight_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (weightsData) {
        setWeights(weightsData.map((w: WeightEntryRow) => ({
          date: new Date(w.date),
          value: Number(w.value),
        })));
      }
    } catch (e: unknown) {
      logError("Weight error:", e);
      Alert.alert("Erreur", "Impossible d'ajouter le poids.");
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
        logError("Performance save error:", error);
        throw error;
      }

      await checkAndUnlockBadges(user.id);

      Alert.alert("Données mises à jour.");
      router.push("/user");
    } catch (e: unknown) {
      logError("Save error:", e);
      Alert.alert("Erreur", "Impossible de sauvegarder.");
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

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
  };

  const cardStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
  };

  const primaryBtn = {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center' as const,
  };

  const smallPrimaryBtn = {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  };

  const addBtn = {
    backgroundColor: colors.divider,
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 1 : 20} style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView style={{ flex: 1, backgroundColor: colors.background, padding: 24 }}>

          {/* Bouton retour */}
          <Pressable onPress={() => router.push('/user')} style={{ padding: 8, borderRadius: 12, backgroundColor: colors.divider, alignSelf: 'flex-start', marginBottom: 16 }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>← Retour</Text>
          </Pressable>

          {/* Entête */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Image
              source={avatarSource}
              style={{ width: 112, height: 112, borderRadius: 56, borderWidth: 4, borderColor: colors.primary }}
              resizeMode="cover"
            />
            <Pressable onPress={openAvatarPicker} disabled={savingAvatar} style={{ marginTop: 12, ...smallPrimaryBtn }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{savingAvatar ? "Mise à jour..." : "Changer la photo"}</Text>
            </Pressable>
          </View>

          <Text style={{ textAlign: 'center', fontSize: 22, fontWeight: '700', color: colors.primary, marginBottom: 16 }}>Modifier mon profil</Text>

          {/* Édition du nom */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 8 }}>Nom affiché</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TextInput
                value={profileName}
                onChangeText={setProfileName}
                placeholder="Ton nom"
                placeholderTextColor={colors.textTertiary}
                style={{ ...inputStyle, flex: 1 }}
                maxLength={50}
              />
              <Pressable
                onPress={async () => {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) return;
                  const { error } = await supabase
                    .from("users")
                    .update({ name: profileName.trim() })
                    .eq("id", user.id);
                  if (error) {
                    Alert.alert("Erreur", "Impossible de sauvegarder le nom.");
                  } else {
                    Alert.alert("Sauvegardé", "Ton nom a été mis à jour.");
                  }
                }}
                style={smallPrimaryBtn}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>OK</Text>
              </Pressable>
            </View>
          </View>

          <Text style={{ textAlign: 'center', fontSize: 22, fontWeight: '700', color: colors.primary, marginBottom: 16 }}>Modifier mes performances</Text>

          {/* Poids */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 8 }}>Évolution du poids</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TextInput value={newWeight} onChangeText={setNewWeight} keyboardType="numbers-and-punctuation" placeholder="Ex: 72.5" placeholderTextColor={colors.textTertiary} style={{ ...inputStyle, flex: 1 }} />
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>kg</Text>
              <Pressable onPress={addWeight} style={smallPrimaryBtn}><Text style={{ color: '#fff', fontWeight: '600' }}>+</Text></Pressable>
            </View>
            {weights.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 13, color: colors.textTertiary, marginBottom: 4 }}>Dernières valeurs :</Text>
                {weights.slice(0, 5).map((w, i) => (
                  <Text key={i} style={{ color: colors.textSecondary }}>{w.date.toLocaleDateString("fr-FR")} → {w.value} kg</Text>
                ))}
              </View>
            )}
          </View>

          {/* SBD */}
          <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 8 }}>SBD</Text>
          <TextInput value={squat} onChangeText={setSquat} placeholder="Squat (kg)" placeholderTextColor={colors.textTertiary} style={{ ...inputStyle, marginBottom: 12 }} />
          <TextInput value={bench} onChangeText={setBench} placeholder="Bench (kg)" placeholderTextColor={colors.textTertiary} style={{ ...inputStyle, marginBottom: 12 }} />
          <TextInput value={deadlift} onChangeText={setDeadlift} placeholder="Deadlift (kg)" placeholderTextColor={colors.textTertiary} style={{ ...inputStyle, marginBottom: 24 }} />

          {/* Running */}
          <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 8 }}>Running</Text>
          {running.map((r, i) => (
            <View key={i} style={{ ...cardStyle, marginBottom: 12 }}>
              <TextInput placeholder="Nom (10 km, IronMan...)" placeholderTextColor={colors.textTertiary} value={r.label} onChangeText={(t) => updateRunning(i, "label", t)} style={{ borderWidth: 1, borderColor: colors.border, borderBottomWidth: 1, marginBottom: 8, padding: 8, color: colors.text }} />
              <TextInput placeholder="Temps / objectif" placeholderTextColor={colors.textTertiary} value={r.value} onChangeText={(t) => updateRunning(i, "value", t)} style={{ padding: 8, color: colors.text }} />
              <Pressable onPress={() => removeRunning(i)} style={{ marginTop: 8 }}><Text style={{ color: colors.error }}>Supprimer</Text></Pressable>
            </View>
          ))}
          <Pressable onPress={addRunning} style={addBtn}>
            <Text style={{ color: colors.primary, fontWeight: '600', textAlign: 'center' }}>+ Ajouter une course</Text>
          </Pressable>

          {/* Hyrox */}
          <Text style={{ fontSize: 17, fontWeight: '600', color: colors.primary, marginBottom: 8 }}>Hyrox</Text>
          {hyrox.map((h, i) => (
            <View key={i} style={{ ...cardStyle, marginBottom: 12 }}>
              <TextInput placeholder="Lieu (Paris, Berlin...)" placeholderTextColor={colors.textTertiary} value={h.label} onChangeText={(t) => updateHyrox(i, "label", t)} style={{ borderWidth: 1, borderColor: colors.border, borderBottomWidth: 1, marginBottom: 8, padding: 8, color: colors.text }} />
              <TextInput placeholder="Temps (ex: 1h05)" placeholderTextColor={colors.textTertiary} value={h.value} onChangeText={(t) => updateHyrox(i, "value", t)} style={{ borderWidth: 1, borderColor: colors.border, borderBottomWidth: 1, marginBottom: 8, padding: 8, color: colors.text }} />
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                <Pressable onPress={() => updateHyrox(i, "type", "solo")} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: h.type === "solo" ? colors.primary : colors.divider }}><Text style={{ color: h.type === "solo" ? '#fff' : colors.textSecondary }}>Solo</Text></Pressable>
                <Pressable onPress={() => updateHyrox(i, "type", "double")} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: h.type === "double" ? colors.primary : colors.divider }}><Text style={{ color: h.type === "double" ? '#fff' : colors.textSecondary }}>Double</Text></Pressable>
              </View>
              <Pressable onPress={() => removeHyrox(i)} style={{ marginTop: 8 }}><Text style={{ color: colors.error }}>Supprimer</Text></Pressable>
            </View>
          ))}
          <Pressable onPress={addHyrox} style={addBtn}>
            <Text style={{ color: colors.primary, fontWeight: '600', textAlign: 'center' }}>+ Ajouter une performance Hyrox</Text>
          </Pressable>

          <Pressable onPress={save} disabled={saving} style={{ ...primaryBtn, marginTop: 24 }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>{saving ? "Enregistrement..." : "Enregistrer"}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      {/* Avatar picker modal */}
      {avatarSheetVisible && (
        <View style={{ position: 'absolute', inset: 0 }}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setAvatarSheetVisible(false)} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: colors.primary, marginBottom: 16, textAlign: 'center' }}>Choisir un avatar</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {AVATAR_IDS.map((id) => {
                const selected = id === selectedAvatarId;
                return (
                  <Pressable
                    key={id}
                    onPress={() => handleSelectAvatar(id)}
                    style={{ width: '30%', aspectRatio: 1, marginBottom: 16, borderRadius: 999, overflow: 'hidden', borderWidth: selected ? 4 : 0, borderColor: colors.primary }}
                  >
                    <Image source={getAvatarSourceById(id)} style={{ width: '100%', height: '100%' }} />
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={handleImportPhoto}
              disabled={savingAvatar}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: colors.primary,
                paddingVertical: 14,
                borderRadius: 12,
                marginTop: 8,
                marginBottom: 12,
                opacity: savingAvatar ? 0.6 : 1,
              }}
            >
              <Ionicons name="image-outline" size={20} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                {savingAvatar ? "Mise à jour..." : "Importer depuis la galerie"}
              </Text>
            </Pressable>
            <Pressable onPress={() => setAvatarSheetVisible(false)} style={{ marginTop: 8, backgroundColor: colors.divider, paddingVertical: 12, borderRadius: 12 }}>
              <Text style={{ textAlign: 'center', color: colors.textSecondary }}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
