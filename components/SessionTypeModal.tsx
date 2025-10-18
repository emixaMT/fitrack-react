import React from 'react';
import { Modal, View, Text, Pressable, Image } from 'react-native';
import { sportsMeta, SportKey } from '../constantes/sport';
import { Ionicons } from '@expo/vector-icons';

interface SessionTypeModalProps {
  visible: boolean;
  onSelect: (category: SportKey) => void;
  onClose: () => void;
}

export const SessionTypeModal: React.FC<SessionTypeModalProps> = ({
  visible,
  onSelect,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        className="flex-1 bg-black/50 justify-center items-center"
        onPress={onClose}
      >
        <Pressable 
          className="bg-white rounded-3xl p-6 w-[85%] max-w-md"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-2xl font-bold text-indigo-600">Type de séance</Text>
            <Pressable onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="#6b7280" />
            </Pressable>
          </View>

          <Text className="text-gray-600 mb-6 text-center">
            Sélectionne la discipline que tu viens de pratiquer
          </Text>

          {/* Grille des sports */}
          <View className="flex-row flex-wrap justify-between gap-3">
            {(Object.keys(sportsMeta) as SportKey[]).map((key) => {
              const meta = sportsMeta[key];
              return (
                <Pressable
                  key={key}
                  onPress={() => {
                    onSelect(key);
                    onClose();
                  }}
                  className="w-[48%] bg-indigo-50 rounded-2xl border-2 border-indigo-200 p-4 items-center active:opacity-80 active:scale-95"
                  style={{ 
                    shadowColor: '#4f46e5',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Image 
                    source={meta.image} 
                    className="w-16 h-16 mb-2" 
                    resizeMode="contain" 
                  />
                  <Text className="text-indigo-700 font-semibold text-center">
                    {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Bouton annuler */}
          <Pressable
            onPress={onClose}
            className="mt-6 py-3 px-6 bg-gray-100 rounded-xl active:opacity-80"
          >
            <Text className="text-center text-gray-700 font-semibold">
              Annuler
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
