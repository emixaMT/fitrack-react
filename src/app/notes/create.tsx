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
import { supabase } from '../../../config/supabaseConfig';
import { checkAndUnlockBadges } from '../../../services/badgeService';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

export default function CreateNote() {
  const router = useRouter();
  const { colors } = useTheme();
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const saveNote = async () => {
    if (!content.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    try {
      setSaving(true);
      const { error } = await supabase.from('notes').insert({
        content: content.trim(),
        id_user: session.user.id,
        created_at: new Date().toISOString(),
      });
      
      if (error) throw error;

      // Vérifier et débloquer les badges automatiquement
      await checkAndUnlockBadges(session.user.id);
      
      router.push('/note');
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', "Impossible d'enregistrer la note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      className="flex-1"
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <SafeAreaView>
        {/* Header simple avec retour */}
        <Pressable
          onPress={() => router.push('/note')}
          className="p-2 rounded-full absolute top-16 left-4"
          style={{ backgroundColor: colors.divider }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>

        <View className="flex-col w-full justify-center px-4 pt-12 pb-3">
          <Text
            className="text-center px-4 text-2xl font-semibold mb-6"
            style={{ color: colors.text }}
          >
            Nouvelle note
          </Text>

          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Écris ta note ici…"
            className="border rounded-2xl p-4"
            placeholderTextColor={colors.textTertiary}
            multiline
            textAlignVertical="top"
            style={{
              minHeight: 220,
              borderColor: colors.border,
              backgroundColor: colors.divider,
              color: colors.text,
            }}
          />

          <Pressable
            onPress={saveNote}
            disabled={!content.trim() || saving}
            className="mt-6 rounded-full py-6 items-center justify-center"
            style={{
              backgroundColor:
                content.trim() && !saving ? colors.primary : colors.divider,
            }}
          >
            <Text
              className="text-center font-semibold"
              style={{ color: '#fff' }}
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
