import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Dimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabaseConfig';
import { useTheme } from '../contexts/ThemeContext';
import { cardShadow } from '../utils/styles';

const screenWidth = Dimensions.get('window').width;

type Seance = { id: string; nom: string; category?: string };

const SPORT_ICONS: Record<string, string> = {
  musculation: 'barbell',
  crossfit: 'flame',
  running: 'footsteps',
  velo: 'bicycle',
};

function getSportIcon(cat?: string): string {
  return SPORT_ICONS[(cat || '').toLowerCase()] || 'fitness';
}

export default function LastSeancesSlider() {
  const router = useRouter();
  const [seances, setSeances] = useState<Seance[]>([]);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();

  const loadSeancesData = async (userId: string) => {
    const { data, error } = await supabase
      .from('seances').select('*').eq('id_user', userId)
      .order('created_at', { ascending: false }).limit(6);
    if (error) { setSeances([]); setLoading(false); return; }
    setSeances((data || []).map((d: any) => ({ id: d.id, nom: d.nom ?? 'Sans titre', category: d.category })));
    setLoading(false);
  };

  useEffect(() => {
    let ch: ReturnType<typeof supabase.channel> | null = null;
    const setup = async (userId: string) => {
      await loadSeancesData(userId);
      ch = supabase.channel(`slider-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'seances', filter: `id_user=eq.${userId}` },
          async () => { await loadSeancesData(userId); })
        .subscribe();
    };
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setup(session.user.id); else { setSeances([]); setLoading(false); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (ch) { supabase.removeChannel(ch); ch = null; }
      if (session?.user) { setLoading(true); setup(session.user.id); } else { setSeances([]); setLoading(false); }
    });
    return () => { subscription.unsubscribe(); if (ch) supabase.removeChannel(ch); };
  }, []);

  if (!loading && seances.length === 0) return null;

  return (
    <View>
      {loading ? (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {[...Array(3)].map((_, i) => (
            <View key={i} style={{ width: 130, height: 130, backgroundColor: colors.divider, borderRadius: 16 }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={seances}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/seances/${item.id}`)}
              style={{
                width: 130, height: 130, backgroundColor: colors.card, borderRadius: 16,
                justifyContent: 'center', alignItems: 'center',
                ...cardShadow(colors, 'sm'),
              }}
            >
              <View style={{
                width: 48, height: 48, borderRadius: 14,
                backgroundColor: colors.divider,
                alignItems: 'center', justifyContent: 'center', marginBottom: 8,
              }}>
                <Ionicons name={getSportIcon(item.category) as any} size={26} color={colors.primary} />
              </View>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600', paddingHorizontal: 8 }} numberOfLines={1}>
                {item.nom}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
