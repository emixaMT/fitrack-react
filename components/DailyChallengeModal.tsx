import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getChallengeDetailsForDay } from '../constants/challengeDetails';
import { useTheme } from '../contexts/ThemeContext';

interface DailyChallengeModalProps {
  visible: boolean;
  onClose: () => void;
  challenge: string;
  dayOfYear: number;
  onComplete: () => void;
  isCompleted: boolean;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({
  visible, onClose, challenge, dayOfYear, onComplete, isCompleted,
}) => {
  const challengeDetails = getChallengeDetailsForDay(dayOfYear);
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header solid color */}
        <View style={{ backgroundColor: colors.primary }}>
          <SafeAreaView>
            <View style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="trophy" size={22} color="#FFD700" />
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>Défi du jour</Text>
                </View>
                <Pressable onPress={onClose} hitSlop={8}>
                  <Ionicons name="close" size={24} color="rgba(255,255,255,0.9)" />
                </Pressable>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 12 }}>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>Jour {dayOfYear}/365</Text>
              </View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 10 }}>
                {challengeDetails?.titre || challenge}
              </Text>
              {challengeDetails && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{challengeDetails.icon} {challengeDetails.difficulte}</Text>
                  </View>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>⏱️ {challengeDetails.dureeEstimee}</Text>
                  </View>
                </View>
              )}
            </View>
          </SafeAreaView>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={{ padding: 20 }}>
            {challengeDetails ? (
              <>
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 }}>Comment faire</Text>
                  <Text style={{ fontSize: 15, color: colors.textSecondary, lineHeight: 22 }}>{challengeDetails.explication}</Text>
                </View>

                <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 20 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary, marginBottom: 4 }}>Objectif</Text>
                  <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20 }}>{challengeDetails.but}</Text>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 }}>Muscles ciblés</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {challengeDetails.musclesCibles.map((m, i) => (
                      <View key={i} style={{ backgroundColor: colors.card, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                        <Text style={{ fontSize: 13, color: colors.text }}>{m}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 }}>Technique</Text>
                  <Text style={{ fontSize: 15, color: colors.textSecondary, lineHeight: 22 }}>{challengeDetails.technique}</Text>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 }}>Matériel</Text>
                  <Text style={{ fontSize: 15, color: colors.textSecondary }}>{challengeDetails.materiel}</Text>
                </View>

                <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Ionicons name="bulb" size={16} color={colors.warning} />
                    <Text style={{ fontWeight: '700', color: colors.text, fontSize: 14 }}>Conseils</Text>
                  </View>
                  {challengeDetails.conseils.map((c, i) => (
                    <Text key={i} style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 4 }}>• {c}</Text>
                  ))}
                </View>
              </>
            ) : (
              <Text style={{ fontSize: 16, color: colors.textSecondary }}>Chargement...</Text>
            )}
          </View>

          <View style={{ paddingHorizontal: 20 }}>
            {isCompleted ? (
              <View style={{ backgroundColor: colors.card, borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <Text style={{ color: colors.success, fontWeight: '700', fontSize: 16 }}>Défi relevé</Text>
              </View>
            ) : (
              <Pressable
                onPress={onComplete}
                style={{
                  backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>J'ai relevé ce défi</Text>
                <Ionicons name="flame" size={20} color="#fff" />
              </Pressable>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};
