import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../../../config/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';

export default function CreateNote() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const saveNote = async () => {
    if (!content.trim()) return;
    const user = auth.currentUser;
    if (!user) return;

    try {
      setSaving(true);
      await addDoc(collection(db, 'Notes'), {
        content: content.trim(),
        id_user: user.uid,
        createdAt: serverTimestamp(),
      });
      router.push('/note'); // ✅ Corrigé : c'était "/note"
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', "Impossible d'enregistrer la note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      <SafeAreaView>
        {/* Header simple avec retour */}
        <Pressable
          onPress={() => router.push('/notes')}
          className="p-2 rounded-full bg-gray-100 absolute top-16 left-4"
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>

        <View className="flex-col w-full justify-center px-4 pt-12 pb-3">
          <Text className="text-center px-4 text-2xl font-semibold text-indigo-900 mb-6">
            Nouvelle note
          </Text>

          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Écris ta note ici…"
            className="border border-gray-200 rounded-2xl p-4 bg-gray-50 text-gray-900"
            placeholderTextColor="#4f46e5" // ✅ Indigo visible
            multiline
            textAlignVertical="top"
            style={{ minHeight: 220 }}
          />

          <Pressable
            onPress={saveNote}
            disabled={!content.trim() || saving}
            className={`mt-6 rounded-full py-6 items-center justify-center ${
              content.trim() && !saving ? 'bg-indigo-600' : 'bg-indigo-300'
            }`}
          >
            <Text className="text-center text-white font-semibold">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
