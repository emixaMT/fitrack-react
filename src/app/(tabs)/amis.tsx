// src/app/(tabs)/amis.tsx
// Page amis + classement + QR code
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, Pressable, ScrollView, TextInput, ActivityIndicator,
  RefreshControl, Image, Alert, Modal, Platform, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  getFriends, sendFriendRequest, acceptFriendRequest, removeFriend, getLeaderboard,
  getMyFriendCode, addFriendByCode,
  type Friend, type LeaderboardEntry,
} from '../../../services/friendsService';

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

  // QR / Code
  const [myCode, setMyCode] = useState<string>('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showCodeInputModal, setShowCodeInputModal] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [addingCode, setAddingCode] = useState(false);

  // Scanner
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const cameraRef = useRef<any>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const { friends: f, pending: p } = await getFriends(user.id);
      setFriends(f);
      setPending(p);
      const lb = await getLeaderboard(user.id);
      setLeaderboard(lb);
      const code = await getMyFriendCode(user.id);
      setMyCode(code);
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

  const handleAddByCode = async () => {
    if (!user || !codeInput.trim()) return;
    setAddingCode(true);
    const result = await addFriendByCode(user.id, codeInput.trim());
    Alert.alert(result.success ? 'Succès' : 'Erreur', result.message);
    if (result.success) {
      setCodeInput('');
      setShowCodeInputModal(false);
      loadData();
    }
    setAddingCode(false);
  };

  const handleScanResult = async (data: string) => {
    if (scanned || !user) return;
    setScanned(true);

    // Le QR code contient le code ami (8 caractères)
    const code = data.trim().toUpperCase();
    if (code.length === 8 && /^[A-Z0-9]+$/.test(code)) {
      const result = await addFriendByCode(user.id, code);
      Alert.alert(result.success ? 'Succès' : 'Erreur', result.message);
      if (result.success) loadData();
    } else {
      Alert.alert('Erreur', 'QR code invalide. Ce n\'est pas un code ami.');
    }

    setScanned(false);
    setShowScannerModal(false);
  };

  // Demander la permission camera quand on ouvre le scanner
  const openScanner = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Info', 'Le scanner QR n\'est pas disponible sur web. Utilise la saisie manuelle du code.');
      return;
    }
    try {
      const { BarCodeScanner } = await import('expo-barcode-scanner');
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      setShowScannerModal(true);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'accéder à la caméra.');
    }
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
        <View style={{ width: 36, alignItems: 'center' }}>
          {entry.rank <= 3 ? (
            <Ionicons name="medal" size={22} color={medalColor} />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textTertiary }}>#{entry.rank}</Text>
          )}
        </View>
        <View style={{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden', marginLeft: 8, backgroundColor: colors.divider }}>
          {entry.photoURL ? (
            <Image source={{ uri: entry.photoURL }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Image source={FALLBACK} style={{ width: '100%', height: '100%' }} />
          )}
        </View>
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
    <>
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

      {/* Mon code ami */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: colors.card, borderRadius: 16, padding: 16,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 }}>
              Mon code ami
            </Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.primary, letterSpacing: 2 }}>
              {myCode || '·······'}
            </Text>
          </View>
          <Pressable
            onPress={() => setShowQRModal(true)}
            style={{
              width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primary + '22',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons name="qr-code-outline" size={24} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Boutons d'ajout */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20, flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={openScanner}
          style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 12,
          }}
        >
          <Ionicons name="scan-outline" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Scanner</Text>
        </Pressable>
        <Pressable
          onPress={() => setShowCodeInputModal(true)}
          style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            backgroundColor: colors.card, paddingVertical: 12, borderRadius: 12,
          }}
        >
          <Ionicons name="keypad-outline" size={18} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>Saisir code</Text>
        </Pressable>
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

      {/* Add friend by email (fallback) */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textTertiary, marginBottom: 8 }}>
          Ou ajouter par email
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
            Classement
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
          {pending.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
                Demandes en attente ({pending.length})
              </Text>
              {pending.map(renderPending)}
            </View>
          )}
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
                Partage ton code ou scanne celui d'un ami
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>

    {/* Modal: Mon QR code */}
    <Modal visible={showQRModal} transparent animationType="fade" onRequestClose={() => setShowQRModal(false)}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
            Mon code ami
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 20, textAlign: 'center' }}>
            Fais scanner ce QR code par un ami
          </Text>
          {myCode ? (
            <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 16, alignItems: 'center' }}>
              <QRCode
                value={myCode}
                size={200}
                color="#000"
                backgroundColor="#fff"
              />
            </View>
          ) : (
            <ActivityIndicator size="large" color={colors.primary} />
          )}
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.primary, letterSpacing: 3, marginTop: 20 }}>
            {myCode}
          </Text>
          <Pressable
            onPress={() => setShowQRModal(false)}
            style={{ marginTop: 20, backgroundColor: colors.divider, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 }}
          >
            <Text style={{ color: colors.text, fontWeight: '600' }}>Fermer</Text>
          </Pressable>
        </View>
      </View>
    </Modal>

    {/* Modal: Scanner QR */}
    <Modal visible={showScannerModal} animationType="slide" onRequestClose={() => setShowScannerModal(false)}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {Platform.OS !== 'web' && hasPermission === true ? (
          <>
            <ScannerView onScanned={handleScanResult} scanned={scanned} />
            <View style={styles.scannerHeader}>
              <Pressable onPress={() => setShowScannerModal(false)} style={styles.scannerCloseBtn}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Scanner un code ami</Text>
            </View>
            <View style={styles.scannerFrame} pointerEvents="none">
              <View style={styles.scannerCornerTL} />
              <View style={styles.scannerCornerTR} />
              <View style={styles.scannerCornerBL} />
              <View style={styles.scannerCornerBR} />
            </View>
          </>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 16, marginBottom: 20 }}>
              {hasPermission === false ? 'Permission caméra refusée' : 'Chargement...'}
            </Text>
            <Pressable onPress={() => setShowScannerModal(false)} style={{ backgroundColor: '#333', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 }}>
              <Text style={{ color: '#fff' }}>Fermer</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>

    {/* Modal: Saisie manuelle du code */}
    <Modal visible={showCodeInputModal} transparent animationType="fade" onRequestClose={() => setShowCodeInputModal(false)}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
            Ajouter un ami
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 20, textAlign: 'center' }}>
            Saisis son code ami (8 caractères)
          </Text>
          <TextInput
            value={codeInput}
            onChangeText={(t) => setCodeInput(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
            placeholder="ABCD1234"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
            maxLength={8}
            style={{
              borderWidth: 1, borderColor: colors.border, borderRadius: 12,
              paddingHorizontal: 14, paddingVertical: 12, color: colors.text,
              backgroundColor: colors.background, fontSize: 22, fontWeight: '800',
              letterSpacing: 3, textAlign: 'center', marginBottom: 16,
            }}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => { setCodeInput(''); setShowCodeInputModal(false); }}
              style={{ flex: 1, backgroundColor: colors.divider, paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ color: colors.text, fontWeight: '600' }}>Annuler</Text>
            </Pressable>
            <Pressable
              onPress={handleAddByCode}
              disabled={addingCode || codeInput.length !== 8}
              style={{
                flex: 1, backgroundColor: addingCode || codeInput.length !== 8 ? colors.divider : colors.primary,
                paddingVertical: 12, borderRadius: 12, alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Ajouter</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
}

// Composant scanner (chargé dynamiquement sur native)
function ScannerView({ onScanned, scanned }: { onScanned: (data: string) => void; scanned: boolean }) {
  const [BarCodeScanner, setBarCodeScanner] = useState<any>(null);

  useEffect(() => {
    import('expo-barcode-scanner').then((mod) => {
      setBarCodeScanner(() => mod.BarCodeScanner);
    });
  }, []);

  if (!BarCodeScanner) return null;

  return (
    <BarCodeScanner
      onBarCodeScanned={scanned ? undefined : (result: any) => onScanned(result.data)}
      style={StyleSheet.absoluteFillObject}
      barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    minWidth: 280,
  },
  scannerHeader: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  scannerCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -120,
    marginLeft: -120,
    width: 240,
    height: 240,
  },
  scannerCornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#fff',
    borderTopLeftRadius: 8,
  },
  scannerCornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#fff',
    borderTopRightRadius: 8,
  },
  scannerCornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#fff',
    borderBottomLeftRadius: 8,
  },
  scannerCornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#fff',
    borderBottomRightRadius: 8,
  },
});
