// src/app/(tabs)/amis.tsx
// Page amis + classement
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, TextInput, ActivityIndicator,
  RefreshControl, Image, Alert, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  getFriends, sendFriendRequest, acceptFriendRequest, removeFriend, getLeaderboard,
  type Friend, type LeaderboardEntry,
} from '../../../services/friendsService';
import { getAvatarSourceById } from '../../../constantes/avatars';

const FALLBACK = require('../../../src/assets/fallback.png');

export default function AmisScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<Friend[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'classement' | 'amis'>('classement');

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const { friends: f, pending: p } = await getFriends(user.id);
      setFriends(f);
      setPending(p);
      const lb = await getLeaderboard(user.id);
      setLeaderboard(lb);
    } catch {
      // Silencieux
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSendRequest = async () => {
    if (!user || !searchEmail.trim()) return;
    setSending(true);
    const result = await sendFriendRequest(user.id, searchEmail.trim());
    Alert.alert(result.success ? 'Succès' : 'Erreur', result.message);
    if (result.success) {
      setSearchEmail('');
      loadData();
    }
    setSending(false);
  };

  const handleAccept = async (friendId: string) => {
    if (!user) return;
    const success = await acceptFriendRequest(user.id, friendId);
    if (success) {
      Alert.alert('Succès', 'Ami ajouté.');
      loadData();
    } else {
      Alert.alert('Erreur', 'Impossible d\'accepter la demande.');
    }
  };

  const handleRemove = (friendId: string, name: string) => {
    Alert.alert('Retirer', `Retirer ${name} de tes amis ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Retirer', style: 'destructive', onPress: async () => {
          if (!user) return;
          await removeFriend(user.id, friendId);
          loadData();
        }
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Chargement…</Text>
      </View>
    );
  }

  const renderLeaderboardEntry = (entry: LeaderboardEntry) => {
    const isMe = entry.id === user?.id;
    const medalColor = entry.rank === 1 ? '#FFD700' : entry.rank === 2 ? '#C0C0C0' : entry.rank === 3 ? '#CD7F32' : colors.textTertiary;
    return (
      <View key={entry.id} style={{
        flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 8,
        backgroundColor: isMe ? colors.primary + '15' : colors.card, borderRadius: 14,
      }}>
        {/* Rank */}
        <View style={{ width: 36, alignItems: 'center' }}>
          {entry.rank <= 3 ? (
            <Ionicons name="medal" size={22} color={medalColor} />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textTertiary }}>#{entry.rank}</Text>
          )}
        </View>

        {/* Avatar */}
        <View style={{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden', marginLeft: 8, backgroundColor: colors.divider }}>
          {entry.photoURL ? (
            <Image source={{ uri: entry.photoURL }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Image source={FALLBACK} style={{ width: '100%', height: '100%' }} />
          )}
        </View>

        {/* Name + stats */}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
            {entry.name} {isMe && '(Toi)'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Ionicons name="trophy-outline" size={12} color={colors.textTertiary} />
              <Text style={{ fontSize: 12, color: colors.textTertiary }}>{entry.badgeCount}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Ionicons name="barbell-outline" size={12} color={colors.textTertiary} />
              <Text style={{ fontSize: 12, color: colors.textTertiary }}>{entry.monthlySessions} séances</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderFriend = (friend: Friend) => (
    <View key={friend.id} style={{
      flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 8,
      backgroundColor: colors.card, borderRadius: 14,
    }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.divider }}>
        {friend.photoURL ? (
          <Image source={{ uri: friend.photoURL }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Image source={FALLBACK} style={{ width: '100%', height: '100%' }} />
        )}
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{friend.name}</Text>
        <Text style={{ fontSize: 12, color: colors.textTertiary }}>{friend.monthlySessions} séances ce mois</Text>
      </View>
      <Pressable onPress={() => handleRemove(friend.id, friend.name)} hitSlop={8}>
        <Ionicons name="close-outline" size={22} color={colors.textTertiary} />
      </Pressable>
    </View>
  );

  const renderPending = (friend: Friend) => (
    <View key={friend.id} style={{
      flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 8,
      backgroundColor: colors.card, borderRadius: 14,
    }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.divider }}>
        <Image source={FALLBACK} style={{ width: '100%', height: '100%' }} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{friend.name}</Text>
        <Text style={{ fontSize: 12, color: colors.textTertiary }}>Demande d'ami</Text>
      </View>
      <Pressable
        onPress={() => handleAccept(friend.id)}
        style={{ backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginRight: 8 }}
      >
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Accepter</Text>
      </Pressable>
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 }}>
        <Text style={{ fontSize: 30, fontWeight: '800', color: colors.text }}>Amis</Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
          Classement et défis entre amis
        </Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 8 }}>
        <Pressable
          onPress={() => setActiveTab('classement')}
          style={{
            flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
            backgroundColor: activeTab === 'classement' ? colors.primary : colors.card,
          }}
        >
          <Text style={{ color: activeTab === 'classement' ? '#fff' : colors.textSecondary, fontWeight: '600', fontSize: 14 }}>
            Classement
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('amis')}
          style={{
            flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
            backgroundColor: activeTab === 'amis' ? colors.primary : colors.card,
          }}
        >
          <Text style={{ color: activeTab === 'amis' ? '#fff' : colors.textSecondary, fontWeight: '600', fontSize: 14 }}>
            Mes amis ({friends.length})
          </Text>
        </Pressable>
      </View>

      {/* Add friend */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
          Ajouter un ami
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={searchEmail}
            onChangeText={setSearchEmail}
            placeholder="Email de l'ami"
            placeholderTextColor={colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={100}
            style={{
              flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12,
              paddingHorizontal: 14, paddingVertical: 10, color: colors.text, backgroundColor: colors.card,
            }}
          />
          <Pressable
            onPress={handleSendRequest}
            disabled={sending || !searchEmail.trim()}
            style={{
              backgroundColor: sending || !searchEmail.trim() ? colors.divider : colors.primary,
              paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
              flexDirection: 'row', alignItems: 'center', gap: 4,
            }}
          >
            <Ionicons name="person-add-outline" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Ajouter</Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      {activeTab === 'classement' ? (
        <View style={{ paddingHorizontal: 20, paddingBottom: 100 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            🏆 Classement
          </Text>
          {leaderboard.length > 0 ? (
            leaderboard.map(renderLeaderboardEntry)
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
              <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>
                Ajoute des amis pour voir le classement
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={{ paddingHorizontal: 20, paddingBottom: 100 }}>
          {/* Pending requests */}
          {pending.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
                Demandes en attente ({pending.length})
              </Text>
              {pending.map(renderPending)}
            </View>
          )}

          {/* Friends list */}
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            Mes amis ({friends.length})
          </Text>
          {friends.length > 0 ? (
            friends.map(renderFriend)
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
              <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>
                Tu n'as pas encore d'amis
              </Text>
              <Text style={{ color: colors.textTertiary, marginTop: 4, fontSize: 13 }}>
                Ajoute-en avec leur email ci-dessus
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}
