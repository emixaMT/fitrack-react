// FILE: src/app/seances/[id].tsx (mets le chemin exact de ta page détail)
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, ScrollView, ActivityIndicator, Image, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../../config/supabaseConfig";
import Ionicons from "@expo/vector-icons/Ionicons";
import { sportsMeta } from "../../../constantes/sport";
import React from "react";

type Objectifs = {
  km?: number | string;
  vitesse?: number | string;   // km/h (nb/str) ou allure str "4:45/km"
  denivele?: number | string;  // en mètres
  duree?: number | string;     // "1h" / "01:05:00" / minutes/secondes nb
};

type Exercice = {
  nom: string;
  series?: number;
  reps?: number;
  charge?: number;
  km?: number;
  vitesse?: number | string;
  denivele?: number;
  duree?: number | string;
};

type Seance = {
  id: string;
  nom: string;
  category: keyof typeof sportsMeta;   // 'velo' | 'running' | 'musculation' | ...
  objectifs?: Objectifs;               // <-- pour running/velo
  exercices?: Exercice[];              // <-- pour musculation/crossfit
};

export default function SeanceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [seance, setSeance] = useState<Seance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('seances')
          .select('*')
          .eq('id', String(id))
          .single();

        if (error || !data) {
          console.error('Error loading seance:', error);
          router.back();
          return;
        }

        setSeance({
          id: data.id,
          nom: data.nom,
          category: data.category,
          objectifs: data.objectifs,
          exercices: data.exercices,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }
  if (!seance) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-500">Séance introuvable</Text>
      </View>
    );
  }

  const sport = sportsMeta[seance.category];
  const isEndurance = seance.category === "running" || seance.category === "velo";

  const objectifs = normalizeObjectifs(seance.objectifs); // Why: transformer strings → nombres utiles

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Bannière + retour */}
      <View className="h-48 w-full relative overflow-hidden">
        <LinearGradient colors={["#818cf8", "#4f46e5"]} style={{ position: "absolute", inset: 0 }} />
        <Pressable onPress={() => router.push("/workout")} className="absolute top-16 left-4 bg-white/20 rounded-full p-2">
          <Ionicons name="arrow-back" size={22} color="white" />
        </Pressable>

        <View className="flex-1 justify-center items-center">
          <View className="absolute right-6 bottom-4 opacity-20">
            <Image source={sport.image} className="w-24 h-24" resizeMode="contain" />
          </View>
          <Text className="text-white text-3xl font-bold pt-12">{seance.nom}</Text>
          <Text className="text-white/80 mt-1">{sport.label}</Text>
        </View>
      </View>

      {/* Contenu */}
      <View className="px-6 py-6">
        {/* Bloc Endurance (running / vélo) */}
        {isEndurance && objectifs ? (
          <>
            <Text className="text-lg font-semibold text-gray-800 mb-4">Objectifs</Text>
            <View className="mb-4 p-4 rounded-xl border border-gray-200 bg-gray-50">
              <Row label="Objectif" value={formatKm(objectifs.km)} />
              <Row label="Allure"   value={formatPace(objectifs.vitesse)} />
              <Row label="Dénivelé" value={formatDenivele(objectifs.denivele)} />
              <Row label="Durée"    value={formatDuration(objectifs.duree)} />
            </View>
          </>
        ) : null}

        {/* Bloc Force (muscu / crossfit) */}
        {!isEndurance && (
          <>
            <Text className="text-lg font-semibold text-gray-800 mb-4">Exercices</Text>
            {Array.isArray(seance.exercices) && seance.exercices.length > 0 ? (
              seance.exercices.map((exo, idx) => (
                <View
                  key={`${exo.nom}-${idx}`}
                  className="mb-4 p-4 rounded-xl border border-gray-200 bg-gray-50 flex-row items-center"
                >
                  <View className="w-12 h-12 mr-3 rounded-xl bg-white border border-gray-200 items-center justify-center">
                    <Ionicons name="barbell-outline" size={22} color="#4f46e5" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-indigo-600 font-medium" numberOfLines={1}>{exo.nom}</Text>
                    <Text className="text-gray-700 text-sm mt-1">
                      {exo.series ?? "-"} séries × {exo.reps ?? "-"} reps
                      {exo.charge != null ? <> • rpe {exo.charge}</> : null}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text className="text-gray-500">Aucun exercice renseigné.</Text>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

/* ---------- UI bits ---------- */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-gray-600">{label}</Text>
      <Text className="text-indigo-600 font-semibold">{value}</Text>
    </View>
  );
}

/* ---------- Helpers ---------- */
// Why: convertir "24" → 24 ; sinon undefined
function toNum(x: any): number | undefined {
  if (typeof x === "number" && !Number.isNaN(x)) return x;
  if (typeof x === "string" && x.trim() !== "" && !Number.isNaN(Number(x))) return Number(x);
  return undefined;
}
function normalizeObjectifs(obj?: Objectifs) {
  if (!obj) return undefined;
  return {
    km: toNum(obj.km) ?? obj.km,
    vitesse: toNum(obj.vitesse) ?? obj.vitesse,
    denivele: toNum(obj.denivele) ?? obj.denivele,
    duree: typeof obj.duree === "string" ? obj.duree : toNum(obj.duree),
  } as Objectifs;
}

function formatKm(km?: number | string) {
  const n = toNum(km);
  if (typeof n === "number") return `${n} km`;
  if (typeof km === "string" && km.trim()) return `${km} km`;
  return "-";
}

// Allure: si vitesse number (km/h) → min/km ; si string contenant ":" on retourne tel quel sinon km/h
function formatPace(v?: number | string) {
  const n = toNum(v);
  if (typeof n === "number" && n > 0) {
    const totalMinPerKm = 60 / n;
    const min = Math.floor(totalMinPerKm);
    const sec = Math.round((totalMinPerKm - min) * 60);
    return `${min}:${String(sec).padStart(2, "0")}/km`;
  }
  if (typeof v === "string" && v.includes(":")) return v;
  if (typeof v === "string" && v.trim()) return `${v} km/h`;
  return "-";
}

function formatDenivele(d?: number | string) {
  const n = toNum(d);
  if (typeof n === "number") return `${n} m D+`;
  if (typeof d === "string" && d.trim()) return `${d} m D+`;
  return "— m D+";
}

function formatDuration(d?: number | string) {
  if (typeof d === "string" && d.trim()) return d;
  const n = toNum(d);
  if (typeof n === "number" && n > 0) {
    // heuristique: si >= 3600 on suppose secondes, sinon minutes
    const seconds = n >= 3600 ? Math.round(n) : Math.round(n * 60);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
  }
  return "-";
}

function renderExerciseIcon(name: string) {
  const n = (name || "").toLowerCase();
  if (/(squat)/.test(n)) return <Ionicons name="fitness-outline" size={22} color="#4f46e5" />;
  if (/(bench|développé couché|développé)/.test(n)) return <Ionicons name="barbell-outline" size={22} color="#4f46e5" />;
  if (/(deadlift|soulevé de terre)/.test(n)) return <Ionicons name="cube-outline" size={22} color="#4f46e5" />;
  if (/(pull|traction)/.test(n)) return <Ionicons name="body-outline" size={22} color="#4f46e5" />;
  if (/(run|course)/.test(n)) return <Ionicons name="walk-outline" size={22} color="#4f46e5" />;
  if (/(velo|vélo|bike)/.test(n)) return <Ionicons name="bicycle-outline" size={22} color="#4f46e5" />;
  return <Ionicons name="ellipse-outline" size={22} color="#4f46e5" />;
}
