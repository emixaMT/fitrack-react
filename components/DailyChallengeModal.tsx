import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
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
  visible,
  onClose,
  challenge,
  dayOfYear,
  onComplete,
  isCompleted,
}) => {
  // Récupérer les détails complets du défi
  const challengeDetails = getChallengeDetailsForDay(dayOfYear);
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1 }}>
        {/* Partie haute avec gradient violet */}
        <LinearGradient
          colors={['#4f46e5', '#7c3aed']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <SafeAreaView>
            <View style={{ padding: 24 }}>
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="trophy" size={28} color="#FFD700" />
                  <Text className="text-2xl font-bold text-white">Défi du jour</Text>
                </View>
                <Pressable onPress={onClose} className="p-2">
                  <Ionicons name="close" size={28} color="white" />
                </Pressable>
              </View>
              
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, alignSelf: 'flex-start', marginBottom: 16 }}>
                <Text className="text-white font-semibold">Jour {dayOfYear}/365</Text>
              </View>

              <Text className="text-2xl font-bold text-white text-center mb-2">
                {challengeDetails?.titre || challenge}
              </Text>
              
              {/* Badge de difficulté */}
              {challengeDetails && (
                <View className="flex-row justify-center items-center gap-2 mt-2">
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                    <Text className="text-white text-sm font-semibold">{challengeDetails.icon} {challengeDetails.difficulte}</Text>
                  </View>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                    <Text className="text-white text-sm font-semibold">⏱️ {challengeDetails.dureeEstimee}</Text>
                  </View>
                </View>
              )}
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Partie basse avec fond blanc */}
        <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 20 }}>

            {/* Détails du défi */}
            <View style={{ padding: 24 }}>
              {challengeDetails ? (
                <>
                  {/* Explication */}
                  <View className="mb-6">
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>💡 Comment faire ?</Text>
                    <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24 }}>{challengeDetails.explication}</Text>
                  </View>

                  {/* But */}
                  <View className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
                    <Text className="text-sm font-bold text-indigo-800 mb-1">🎯 Objectif</Text>
                    <Text className="text-sm text-indigo-700 leading-5">{challengeDetails.but}</Text>
                  </View>

                  {/* Muscles ciblés */}
                  <View className="mb-6">
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>💪 Muscles ciblés</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {challengeDetails.musclesCibles.map((muscle, index) => (
                        <View key={index} className="bg-gray-100 px-3 py-1 rounded-full">
                          <Text className="text-sm text-gray-700">{muscle}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Technique */}
                  <View className="mb-6">
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>📝 Technique</Text>
                    <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24 }}>{challengeDetails.technique}</Text>
                  </View>

                  {/* Matériel */}
                  <View className="mb-6">
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>🛠️ Matériel</Text>
                    <Text style={{ fontSize: 16, color: colors.text }}>{challengeDetails.materiel}</Text>
                  </View>

                  {/* Conseils */}
                  <View className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                    <View className="flex-row items-center gap-2 mb-2">
                      <Ionicons name="bulb" size={20} color="#16a34a" />
                      <Text className="font-bold text-green-700">Conseils</Text>
                    </View>
                    {challengeDetails.conseils.map((conseil, index) => (
                      <Text key={index} className="text-sm text-green-800 leading-5 mb-1">
                        • {conseil}
                      </Text>
                    ))}
                  </View>
                </>
              ) : (
                <Text style={{ fontSize: 16, color: colors.text }}>Informations détaillées en cours de chargement...</Text>
              )}
            </View>

            {/* Bouton de validation */}
            <View style={{ padding: 24, paddingTop: 0 }}>
              {isCompleted ? (
                <View className="bg-green-100 border-2 border-green-500 rounded-xl p-4 flex-row items-center justify-center gap-2">
                  <Ionicons name="checkmark-circle" size={28} color="#22c55e" />
                  <Text className="text-green-700 font-bold text-lg">Défi relevé aujourd'hui ! 🎉</Text>
                </View>
              ) : (
                <Pressable
                  onPress={onComplete}
                  className="bg-indigo-600 rounded-xl p-4 flex-row items-center justify-center gap-2 active:opacity-80"
                  style={{ shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}
                >
                  <Text className="text-white font-bold text-lg">J'ai relevé ce défi !</Text>
                  <Ionicons name="flame" size={24} color="white" />

                </Pressable>
              )}
            </View>
        </ScrollView>
      </View>
    </Modal>
  );
};
