import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Dimensions, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../config/supabaseConfig';
import { useTheme } from '../contexts/ThemeContext';
import { cardShadow } from '../utils/styles';

const screenWidth = Dimensions.get('window').width;

type Seance = { id: string; nom: string; category?: string };

function getCategoryImage(cat?: string) {
  const key = (cat || '').toLowerCase();
  try {
    if (key === 'musculation') return require('../src/assets/musculation.png');
    if (key === 'crossfit')    return require('../src/assets/crossfit.png');
    if (key === 'running')     return require('../src/assets/running.png');
    if (key === 'velo')        return require('../src/assets/velo.png');
  } catch {}
  return require('../src/assets/musculation.png');
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
    let ch: any;
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
              <Image source={getCategoryImage(item.category)} style={{ width: 64, height: 64 }} resizeMode="contain" />
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600', marginTop: 8, paddingHorizontal: 8 }} numberOfLines={1}>
                {item.nom}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
