// FILE: src/app/(tabs)/workout.tsx
import React, { useEffect, useState } from "react";
import { useRouter, useNavigation } from "expo-router";
import { auth, db } from "../../../config/firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  ActionSheetIOS,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";

type Exercice = { nom: string; series?: number; reps?: number; charge?: number };
type Seance = {
  id: string;
  nom: string;
  id_user: string;
  category?: string;         // Why: filtrer l'affichage selon running/velo
  exercices: Exercice[];
};

function isEndurance(cat?: string) {
  const c = (cat || "").toLowerCase();
  return c === "running" || c === "velo" || c === "vélo";
}

export default function WorkoutScreen() {
  const router = useRouter();
  const navigation = useNavigation();

  const [seances, setSeances] = useState<Seance[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible] = useState(false);

  // 🔒 Auth + abonnement Firestore (API modulaire)
  useEffect(() => {
    let unsubFS: undefined | (() => void);

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubFS) {
        unsubFS();
        unsubFS = undefined;
      }

      if (!user) {
        setSeances([]);
        setLoading(false);
        router.replace("/");
        return;
      }

      setLoading(true);
      const q = query(collection(db, "Seances"), where("id_user", "==", user.uid));
      unsubFS = onSnapshot(
        q,
        (snap) => {
          const items: Seance[] = snap.docs.map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              nom: data?.nom ?? "Sans titre",
              id_user: data?.id_user ?? user.uid,
              category: data?.category,                       // ⬅️ récupère la catégorie
              exercices: Array.isArray(data?.exercices) ? data.exercices : [],
            };
          });
          setSeances(items);
          setLoading(false);
        },
        () => setLoading(false)
      );
    });

    return () => {
      unsubAuth();
      if (unsubFS) unsubFS();
    };
  }, [router]);

  // Masque la tab bar quand la modale est ouverte
  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: modalVisible ? "none" : "flex" } });
    return () => navigation.getParent()?.setOptions({ tabBarStyle: { display: "flex" } });
  }, [modalVisible, navigation]);

  async function handleDelete(seanceId: string) {
    Alert.alert("Supprimer la séance", "Cette action est définitive.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "Seances", seanceId));
          } catch {
            Alert.alert("Erreur", "La suppression a échoué.");
          }
        },
      },
    ]);
  }

  function openContextMenu(seanceId: string) {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Annuler", "Modifier", "Supprimer"],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
          userInterfaceStyle: "light",
        },
        (i) => {
          if (i === 1) router.push(`/seances/edit/${seanceId}`);
          if (i === 2) handleDelete(seanceId);
        }
      );
    } else {
      Alert.alert("Séance", "Que souhaites-tu faire ?", [
        { text: "Modifier", onPress: () => router.push(`/seances/edit/${seanceId}`) },
        { text: "Supprimer", style: "destructive", onPress: () => handleDelete(seanceId) },
        { text: "Annuler", style: "cancel" },
      ]);
    }
  }

  async function handleSaveSeance({
    nom,
    category,
    exercices,
  }: {
    nom: string;
    category: string;
    exercices: any[];
  }) {
    // Why: éviter d'écrire sans session active
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Session requise", "Veuillez vous reconnecter.");
      return;
    }
    try {
      await addDoc(collection(db, "Seances"), {
        nom,
        category,
        exercices,
        id_user: user.uid,
        createdAt: serverTimestamp(),
      });
    } catch {
      Alert.alert("Erreur", "Impossible d'ajouter la séance");
    }
  }

  return (
    <>
      <ScrollView className="flex h-full relative bg-white">
        <View className="flex relative justify-center items-center">
          <LinearGradient
            colors={["#818cf8", "#4f46e5"]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 200,
              zIndex: 0,
            }}
          />
        </View>
        <Text className="text-white top-32 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl absolute z-20 font-bold">
          Séances
        </Text>

        <View className="flex h-full pt-12 px-6 bg-white mt-48 flex-row flex-wrap justify-between gap-8">
          {loading && (
            <View className="flex-row flex-wrap justify-between gap-4">
              {[...Array(4)].map((_, i) => (
                <View key={i} className="w-[48%] h-28 bg-gray-200 rounded-2xl" />
              ))}
            </View>
          )}

          {!loading && seances.length === 0 && (
            <View className="py-10 flex-1 justify-center">
              <Text className="text-gray-500 text-center">Aucune séance pour le moment.</Text>
            </View>
          )}

          {!loading && seances.length > 0 && (
            <View className="flex-row flex-wrap justify-between gap-4 pb-20 w-full">
              {seances.map((s) => {
                const endurance = isEndurance(s.category);
                return (
                  <Pressable
                    key={s.id}
                    className="w-[45%] bg-white rounded-2xl shadow-md shadow-indigo-300 p-4 active:opacity-90"
                    onPress={() => router.push(`/seances/${s.id}`)}
                    onLongPress={() => openContextMenu(s.id)}
                    delayLongPress={300}
                  >
                    <Text className="text-indigo-600 font-semibold mb-1" numberOfLines={1}>
                      {s.nom}
                    </Text>

                    {/* Why: pour running/vélo -> rien d'autre que le nom */}
                    {!endurance && (
                      <Text className="text-gray-500 text-sm mb-2">
                        {s.exercices?.length ?? 0} exercice(s)
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable onPress={() => router.push("/seances/create/step1")}>
        <View className="absolute bottom-8 right-8 bg-indigo-600 rounded-full p-4 shadow-lg shadow-indigo-500">
          <Ionicons name="add" size={24} color="white" />
        </View>
      </Pressable>
    </>
  );
}
