import { useEffect, useState, useCallback, useRef } from "react";
import {
  View, Text, Pressable, ActivityIndicator, Modal, Alert,
  FlatList, RefreshControl, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { supabase } from "../../../config/supabaseConfig";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { cardStyle } from "../../../utils/styles";
import React from "react";

const PAGE_SIZE = 20;

type Note = { id: string; content: string; createdAt?: string; id_user: string };

export default function NotesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const notesCountRef = useRef(0);

  const mapNote = (d: any): Note => ({ id: d.id, content: d.content, createdAt: d.created_at, id_user: d.id_user });

  const loadNotes = useCallback(async (userId: string, reset = false) => {
    const offset = reset ? 0 : notesCountRef.current;
    const { data, error } = await supabase
      .from('notes').select('*').eq('id_user', userId)
      .order('created_at', { ascending: false }).range(offset, offset + PAGE_SIZE - 1);
    if (error) {
      if (reset) setNotes([]);
      setLoading(false); setRefreshing(false); setLoadingMore(false); return;
    }
    const items = (data || []).map(mapNote);
    setHasMore(items.length === PAGE_SIZE);
    setNotes(prev => {
      if (reset) { notesCountRef.current = items.length; return items; }
      const seen = new Set(prev.map(n => n.id));
      const merged = [...prev, ...items.filter(n => !seen.has(n.id))];
      notesCountRef.current = merged.length;
      return merged;
    });
    setLoading(false); setRefreshing(false); setLoadingMore(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    let ch: ReturnType<typeof supabase.channel> | null = null;
    loadNotes(user.id, true);
    ch = supabase.channel(`notes-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `id_user=eq.${user.id}` },
        () => loadNotes(user.id, true))
      .subscribe();
    return () => { if (ch) supabase.removeChannel(ch); };
  }, [user?.id]);

  const handleRefresh = () => { if (!user) return; setRefreshing(true); loadNotes(user.id, true); };
  const handleLoadMore = () => { if (!user || loadingMore || !hasMore) return; setLoadingMore(true); loadNotes(user.id, false); };

  const parseDate = (ts?: string) => {
    if (!ts) return { day: '', month: '', full: '' };
    const d = new Date(ts);
    return {
      day: d.getDate().toString().padStart(2, '0'),
      month: d.toLocaleDateString(undefined, { month: 'short' }).replace('.', ''),
      full: d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }),
    };
  };

  const openNote = (note: Note) => { setSelectedNote(note); setModalVisible(true); };
  const closeModal = () => { setModalVisible(false); setSelectedNote(null); };

  const handleDelete = (noteId: string) => {
    Alert.alert("Supprimer", "Définitif ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) { Alert.alert("Session requise", "Veuillez vous reconnecter."); return; }
          const { error } = await supabase.from('notes').delete().eq('id', noteId).eq('id_user', user.id);
          if (error) throw error;
          closeModal();
          setNotes(prev => { const n = prev.filter(note => note.id !== noteId); notesCountRef.current = n.length; return n; });
          if (user) { const { checkAndUnlockBadges } = await import('../../../services/badgeService'); await checkAndUnlockBadges(user.id); }
        } catch { Alert.alert("Erreur", "Impossible de supprimer."); }
      }},
    ]);
  };

  const renderNote = ({ item: n }: { item: Note }) => {
    const d = parseDate(n.createdAt);
    return (
      <Pressable
        onPress={() => openNote(n)}
        onLongPress={() => handleDelete(n.id)}
        delayLongPress={400}
        style={[cardStyle(colors, 'sm'), { padding: 16, marginBottom: 10, flexDirection: 'row', gap: 14 }]}
      >
        {/* Date badge */}
        <View style={{ width: 48, alignItems: 'center' }}>
          <View style={{
            backgroundColor: colors.divider, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 6,
            alignItems: 'center', width: '100%',
          }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{d.day}</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>{d.month}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22 }} numberOfLines={3}>{n.content}</Text>
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={{ alignItems: 'center', paddingVertical: 60 }}>
        <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: colors.divider, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Ionicons name="document-text" size={28} color={colors.textTertiary} />
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 15, marginBottom: 16 }}>Aucune note</Text>
        <Pressable
          onPress={() => router.push("/notes/create")}
          style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '600' }}>Créer une note</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={renderNote}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 16, paddingTop: 56, marginBottom: 16 }}>
            <Text style={{ fontSize: 30, fontWeight: '800', color: colors.text }}>Notes</Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
              {notes.length} note{notes.length > 1 ? 's' : ''}
            </Text>
            {loading && (
              <View style={{ marginTop: 16, gap: 10 }}>
                {[...Array(3)].map((_, i) => (
                  <View key={i} style={{ height: 80, backgroundColor: colors.divider, borderRadius: 16 }} />
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
        onPress={() => router.push("/notes/create")}
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

      <Modal transparent animationType="fade" visible={modalVisible} onRequestClose={closeModal}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 24 }} onPress={closeModal}>
          <Pressable
            style={[cardStyle(colors, 'lg'), { padding: 20, maxHeight: '70%' }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>
                {selectedNote ? parseDate(selectedNote.createdAt).full : ""}
              </Text>
              <Pressable onPress={closeModal} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView>
              <Text style={{ color: colors.text, fontSize: 16, lineHeight: 24 }}>{selectedNote?.content}</Text>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
