import React from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { sportsMeta, SportKey } from '../constants/sport';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { cardStyle, cardShadow } from '../utils/styles';

interface SessionTypeModalProps {
  visible: boolean;
  onSelect: (category: SportKey) => void;
  onClose: () => void;
}

export const SessionTypeModal: React.FC<SessionTypeModalProps> = ({ visible, onSelect, onClose }) => {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}
        onPress={onClose}
      >
        <Pressable
          style={[cardStyle(colors, 'lg'), { padding: 20, width: '100%', maxWidth: 380 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Type de séance</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
          <Text style={{ color: colors.textSecondary, marginBottom: 16, fontSize: 14 }}>Choisis ta discipline</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {(Object.keys(sportsMeta) as SportKey[]).map((key) => {
              const meta = sportsMeta[key];
              return (
                <Pressable
                  key={key}
                  onPress={() => { onSelect(key); onClose(); }}
                  style={{
                    width: '48%', borderRadius: 14, backgroundColor: colors.surface, padding: 14, alignItems: 'center',
                    ...cardShadow(colors, 'sm'),
                  }}
                >
                  <View style={{
                    width: 52, height: 52, borderRadius: 16,
                    backgroundColor: colors.divider,
                    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
                  }}>
                    <Ionicons name={meta.icon as any} size={26} color={colors.primary} />
                  </View>
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13, textAlign: 'center' }}>{meta.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={onClose}
            style={{ marginTop: 16, paddingVertical: 13, backgroundColor: colors.divider, borderRadius: 12, alignItems: 'center' }}
          >
            <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 15 }}>Annuler</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
