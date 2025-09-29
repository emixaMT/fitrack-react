// components/ExerciseSearchDropdown.tsx
import React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View, TextInput, Text, Pressable, ActivityIndicator } from 'react-native';

type WgerExercise = {
  id: number;
  name: string;
  description?: string;
};

type Props = {
  placeholder?: string;
  onPick: (exercise: { id: number; name: string }) => void;
  // "musculation" | "crossfit" — tu peux l'utiliser plus tard pour affiner le filtre si tu veux
  sport?: 'musculation' | 'crossfit';
};

export default function ExerciseSearchDropdown({ placeholder = 'Rechercher un exercice…', onPick }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<WgerExercise[]>([]);
  const [open, setOpen] = useState(false);
  const controller = useRef<AbortController | null>(null);

  // petit debounce
useEffect(() => {
  if (query.trim().length < 2) {
    setResults([]);
    setOpen(false);
    return;
  }

  setLoading(true);
  setOpen(true);

  if (controller.current) controller.current.abort();
  controller.current = new AbortController();

  const timer = setTimeout(async () => {
    try {
      const q = encodeURIComponent(query.trim());

      // 1) Tentative avec ?search= (DRF SearchFilter)
      let res = await fetch(
        `https://wger.de/api/v2/exercise/?language=2&status=2&limit=20&search=${q}`,
        { signal: controller.current?.signal, headers: { Accept: 'application/json' } }
      );
      let json = await res.json();

      // 2) Si vide, tenter l’endpoint /exercise/search/
      if (!json?.results?.length) {
        res = await fetch(
          `https://wger.de/api/v2/exercise/search/?term=${q}&language=2`,
          { signal: controller.current?.signal, headers: { Accept: 'application/json' } }
        );
        json = await res.json();
        // cet endpoint renvoie parfois { suggestions: [{id, name}, ...] }
        if (json?.suggestions) {
          setResults(json.suggestions.map((s: any) => ({ id: s.id, name: s.name })));
          return;
        }
      }

      // 3) Dernière chance : sans filtre de langue
      if (!json?.results?.length) {
        res = await fetch(
          `https://wger.de/api/v2/exercise/?status=2&limit=20&search=${q}`,
          { signal: controller.current?.signal, headers: { Accept: 'application/json' } }
        );
        json = await res.json();
      }

      const list = json?.results?.map((e: any) => ({ id: e.id, name: e.name })) ?? [];

      // 4) Fallback UI: montrer qq exemples si tout est vide (permet de tester l’UI)
      setResults(
        list.length
          ? list
          : [
              { id: -1, name: 'Squat' },
              { id: -2, name: 'Développé couché' },
              { id: -3, name: 'Burpees' },
            ]
      );
    } catch (e) {
      // En cas d’erreur, afficher mock pour vérifier que la dropdown s’ouvre
      setResults([
        { id: -1, name: 'Squat' },
        { id: -2, name: 'Développé couché' },
        { id: -3, name: 'Burpees' },
      ]);
    } finally {
      setLoading(false);
    }
  }, 350);

  return () => {
    clearTimeout(timer);
    controller.current?.abort();
  };
}, [query]);

  return (
    <View className="relative">
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        className="border border-gray-300 rounded-xl px-4 py-3 bg-gray-50"
        placeholderTextColor="#9CA3AF"
        onFocus={() => {
          if (results.length > 0) setOpen(true);
        }}
      />
      {loading && (
        <View className="absolute right-3 top-3">
          <ActivityIndicator />
        </View>
      )}

      {open && results.length > 0 && (
        <View className="absolute left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 w-full" style={{ maxHeight: 220, zIndex: 50 }}>
          <View className="py-2" style={{ maxHeight: 220 }}>
            {results.map((ex) => (
              <Pressable
                key={ex.id}
                onPress={() => {
                  onPick({ id: ex.id, name: ex.name });
                  setQuery(ex.name);
                  setOpen(false);
                }}
                className="px-4 py-3 active:bg-gray-100"
              >
                <Text className="text-gray-800">{ex.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
