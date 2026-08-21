import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter, useNavigation } from "expo-router";
import { supabase } from "../../../config/supabaseConfig";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme, type ThemeColors } from "../../../contexts/ThemeContext";
import {
  View, Text, Pressable, Platform, ActionSheetIOS, Alert,
  FlatList, ActivityIndicator, RefreshControl, Dimensions, ScrollView,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { cardStyle } from "../../../utils/styles";
import { logError } from "../../../utils/logger";
import { safeRealtimeChannel } from "../../../utils/realtime";
import { importSeance, readJsonFile } from "../../../services/seanceIO";
import * as DocumentPicker from "expo-document-picker";
import { Toast } from "../../../components/Toast";
import { SwipeableRow } from "../../../components/SwipeableRow";

const PAGE_SIZE = 20;
const screenWidth = Dimensions.get('window').width;

type Exercice = { nom: string; series?: number; reps?: number; charge?: number };
type Seance = { id: string; nom: string; id_user: string; category?: string; created_at?: string; exercices: Exercice[] };

/** Shape of a seances row returned by Supabase */
interface SeanceRow {
  id: string;
  nom?: string | null;
  id_user?: string | null;
  category?: string | null;
  created_at?: string | null;
  exercices?: Exercice[] | null;
}

/** Ionicons glyph name type */
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_CONFIG: Record<string, { label: string; icon: IoniconName; color: string }> = {
  musculation: { label: 'Musculation', icon: 'barbell', color: '#6366F1' },
  crossfit: { label: 'Crossfit', icon: 'flame', color: '#f59e0b' },
  running: { label: 'Running', icon: 'footsteps', color: '#34c759' },
  velo: { label: 'Vélo', icon: 'bicycle', color: '#06b6d4' },
};

function getCatConfig(cat?: string): { label: string; icon: IoniconName; color: string } {
  const key = (cat || '').toLowerCase();
  return CATEGORY_CONFIG[key] || { label: cat || 'Autre', icon: 'fitness', color: '#8e8e93' };
}

function isEndurance(cat?: string) {
  const c = (cat || "").toLowerCase();
  return c === "running" || c === "velo" || c === "vélo";
}

type Filter = 'all' | 'musculation' | 'crossfit' | 'running' | 'velo';

type SeanceCardProps = {
  item: Seance;
  colors: ThemeColors;
  formatDate: (ts?: string) => string;
  onPress: (id: string) => void;
  onLongPress: (id: string) => void;
  onDelete: (id: string) => void;
};

const SeanceCard = React.memo(function SeanceCard({ item: s, colors, formatDate, onPress, onLongPress, onDelete }: SeanceCardProps) {
  const endurance = isEndurance(s.category);
  const cat = getCatConfig(s.category);
  return (
    <SwipeableRow onDelete={() => onDelete(s.id)}>
      <Pressable
        onPress={() => onPress(s.id)}
        onLongPress={() => onLongPress(s.id)}
        delayLongPress={400}
        style={[cardStyle(colors, 'sm'), { padding: 16, marginBottom: 10 }]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          {/* Category icon */}
          <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: cat.color + '22', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={cat.icon} size={24} color={cat.color} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }} numberOfLines={1}>{s.nom}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <View style={{ backgroundColor: cat.color + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: cat.color }}>{cat.label}</Text>
              </View>
              {!endurance && (
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{s.exercices?.length ?? 0} exercice(s)</Text>
              )}
              {s.created_at && (
                <Text style={{ fontSize: 12, color: colors.textTertiary }}>{formatDate(s.created_at)}</Text>
              )}
            </View>
          </View>

          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </View>
      </Pressable>
    </SwipeableRow>
  );
});

export default function WorkoutScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [allSeances, setAllSeances] = useState<Seance[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showImportAnim, setShowImportAnim] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const seancesCountRef = useRef(0);

  const filteredSeances = useMemo(() => filter === 'all' ? allSeances : allSeances.filter(s => (s.category || '').toLowerCase() === filter), [allSeances, filter]);

  const mapSeance = (d: SeanceRow, userId: string): Seance => ({
    id: d.id, nom: d.nom ?? "Sans titre", id_user: d.id_user ?? userId,
    category: d.category ?? undefined, created_at: d.created_at ?? undefined, exercices: Array.isArray(d.exercices) ? d.exercices : [],
  });

  const loadSeances = useCallback(async (userId: string, reset = false) => {
    const offset = reset ? 0 : seancesCountRef.current;
    const { data, error } = await supabase
      .from('seances').select('*').eq('id_user', userId)
      .order('created_at', { ascending: false }).range(offset, offset + PAGE_SIZE - 1);
    if (error) {
      if (reset) setAllSeances([]);
      setLoading(false); setRefreshing(false); setLoadingMore(false); return;
    }
    const items = (data || []).map((d: SeanceRow) => mapSeance(d, userId));
    setHasMore(items.length === PAGE_SIZE);
    setAllSeances(prev => {
      if (reset) { seancesCountRef.current = items.length; return items; }
      const seen = new Set(prev.map(s => s.id));
      const merged = [...prev, ...items.filter(s => !seen.has(s.id))];
      seancesCountRef.current = merged.length;
      return merged;
    });
    setLoading(false); setRefreshing(false); setLoadingMore(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    let ch: ReturnType<typeof supabase.channel> | null = null;
    loadSeances(user.id, true);
    ch = safeRealtimeChannel(
      `workout-${user.id}`,
      { event: '*', schema: 'public', table: 'seances', filter: `id_user=eq.${user.id}` },
      () => loadSeances(user.id, true)
    );
    return () => { if (ch) supabase.removeChannel(ch); };
  }, [user?.id]);

  const handleRefresh = () => { if (!user) return; setRefreshing(true); loadSeances(user.id, true); };
  const handleLoadMore = () => { if (!user || loadingMore || !hasMore) return; setLoadingMore(true); loadSeances(user.id, false); };

  const handleImport = useCallback(async () => {
    if (!user) { Alert.alert("Session requise", "Veuillez vous reconnecter."); return; }
    try {
      if (Platform.OS === "web") {
        // Web: trigger hidden file input
        const input = document.getElementById("import-seance-input") as HTMLInputElement | null;
        if (input) { input.value = ""; input.click(); }
        return;
      }
      // Mobile: use DocumentPicker
      const result = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      const file = result.assets[0];
      const content = await readJsonFile(file.uri);
      const res = await importSeance(content, user.id);
      if (res.success) {
        setToastMsg("Séance importée !");
        setShowImportAnim(true);
        loadSeances(user.id, true);
      } else {
        Alert.alert("Erreur", res.message);
      }
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'importer le fichier.");
    }
  }, [user, loadSeances]);

  const handleWebFilePicked = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const res = await importSeance(text, user.id);
      if (res.success) {
        setToastMsg("Séance importée !");
        setShowImportAnim(true);
        loadSeances(user.id, true);
      } else {
        Alert.alert("Erreur", res.message);
      }
    } catch {
      Alert.alert("Erreur", "Impossible de lire le fichier.");
    }
  }, [user, loadSeances]);

  async function handleDelete(id: string) {
    Alert.alert("Supprimer", "Définitif ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) { Alert.alert("Session requise", "Veuillez vous reconnecter."); return; }
          setAllSeances(prev => { const n = prev.filter(s => s.id !== id); seancesCountRef.current = n.length; return n; });
          const { error } = await supabase.from('seances').delete().eq('id', id).eq('id_user', user.id);
          if (error) throw error;
        } catch { if (user) loadSeances(user.id, true); }
      }},
    ]);
  }

  function openMenu(id: string) {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Annuler", "Modifier", "Supprimer"], destructiveButtonIndex: 2, cancelButtonIndex: 0 },
        (i) => { if (i === 1) router.push(`/seances/edit/${id}`); if (i === 2) handleDelete(id); }
      );
    } else {
      Alert.alert("Séance", "Que faire ?", [
        { text: "Modifier", onPress: () => router.push(`/seances/edit/${id}`) },
        { text: "Supprimer", style: "destructive", onPress: () => handleDelete(id) },
        { text: "Annuler", style: "cancel" },
      ]);
    }
  }

  const formatDate = useCallback((ts?: string) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
  }, []);

  const renderSeance = useCallback(({ item: s }: { item: Seance }) => (
    <SeanceCard
      item={s}
      colors={colors}
      formatDate={formatDate}
      onPress={(id) => router.push(`/seances/${id}`)}
      onLongPress={openMenu}
      onDelete={handleDelete}
    />
  ), [colors, formatDate, router]);

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={{ alignItems: 'center', paddingVertical: 60 }}>
        <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: colors.divider, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Ionicons name="fitness" size={28} color={colors.textTertiary} />
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 15, marginBottom: 16 }}>
          {filter === 'all' ? 'Aucune séance' : `Aucune séance ${getCatConfig(filter).label.toLowerCase()}`}
        </Text>
        <Pressable
          onPress={() => router.push("/seances/create/step1")}
          style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '600' }}>Créer une séance</Text>
        </Pressable>
      </View>
    );
  };

  const FILTERS: { key: Filter; label: string; icon: IoniconName }[] = [
    { key: 'all', label: 'Tout', icon: 'apps' },
    { key: 'musculation', label: 'Muscu', icon: 'barbell' },
    { key: 'crossfit', label: 'Crossfit', icon: 'flame' },
    { key: 'running', label: 'Running', icon: 'footsteps' },
    { key: 'velo', label: 'Vélo', icon: 'bicycle' },
  ];

  return (
    <>
      <FlatList
        data={filteredSeances}
        keyExtractor={(item) => item.id}
        renderItem={renderSeance}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={{ paddingBottom: 8 }}>
            {/* Title header */}
            <View style={{ paddingHorizontal: 16, paddingTop: 56, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 30, fontWeight: '800', color: colors.text }}>Séances</Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                  {allSeances.length} séance{allSeances.length > 1 ? 's' : ''} au total
                </Text>
              </View>
              <Pressable
                onPress={handleImport}
                style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primary + '22', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="cloud-download-outline" size={22} color={colors.primary} />
              </Pressable>
            </View>

            {/* Category filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 16 }}>
              {FILTERS.map((f) => {
                const active = filter === f.key;
                const catColor = f.key === 'all' ? colors.primary : (getCatConfig(f.key).color);
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setFilter(f.key)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                      paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
                      backgroundColor: active ? catColor : colors.card,
                    }}
                  >
                    <Ionicons name={f.icon} size={14} color={active ? '#fff' : colors.textSecondary} />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#fff' : colors.textSecondary }}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Loading skeletons */}
            {loading && (
              <View style={{ paddingHorizontal: 16, gap: 10 }}>
                {[...Array(4)].map((_, i) => (
                  <View key={i} style={{ height: 84, backgroundColor: colors.divider, borderRadius: 16 }} />
                ))}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={loadingMore ? <View style={{ paddingVertical: 20, alignItems: 'center' }}><ActivityIndicator size="small" color={colors.primary} /></View> : null}
        style={{ backgroundColor: colors.background, flex: 1 }}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        onPress={() => router.push("/seances/create/step1")}
        style={{ position: 'absolute', bottom: 24, right: 20, zIndex: 10 }}
      >
        <View style={{
          width: 56, height: 56, borderRadius: 16, backgroundColor: colors.primary,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
        }}>
          <Ionicons name="add" size={28} color="#fff" />
        </View>
      </Pressable>

      {Platform.OS === "web" && (
        <input
          id="import-seance-input"
          type="file"
          accept=".json,application/json"
          style={{ display: "none" }}
          onChange={handleWebFilePicked}
        />
      )}

      <Toast message={toastMsg} visible={showImportAnim} onDone={() => setShowImportAnim(false)} />
    </>
  );
}
