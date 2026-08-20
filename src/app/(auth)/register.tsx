import { useState } from "react";
import { View, TextInput, Text, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../config/supabaseConfig";
import { register } from "../../../services/supabaseAuth";
import { useTheme } from "../../../contexts/ThemeContext";
import { router } from "expo-router";
import { PASSWORD_REGEX } from '../../../utils/validation';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    const e = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(e)) { Alert.alert('Email invalide', 'Email invalide.'); return; }
    if (!PASSWORD_REGEX.test(password)) {
      Alert.alert('Mot de passe faible', 'Minimum 8 caractères avec majuscule, minuscule, chiffre et caractère spécial.');
      return;
    }
    setSubmitting(true);
    try {
      const userCredential = await register(e, password);
      const user = userCredential.user;
      const monthKeyNow = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
      const { error: profileError } = await supabase.from('users').insert({
        id: user.uid, name: e.split('@')[0], monthly_sessions: 0, monthly_target: 10, month_key: monthKeyNow(),
      });
      if (profileError) { Alert.alert("Attention", "Compte créé mais profil non sauvegardé: " + profileError.message); }
      Alert.alert("Succès", "Compte créé ! Connecte-toi.", [{ text: "OK", onPress: () => router.replace('/(auth)') }]);
    } catch (error: unknown) {
      Alert.alert("Erreur", "Une erreur est survenue. Veuillez réessayer.");
    } finally { setSubmitting(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', paddingTop: 60, paddingBottom: 36 }}>
          <View style={{ width: 72, height: 72, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="fitness" size={36} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 16 }}>Créer un compte</Text>
          <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 4 }}>Commence ton parcours</Text>
        </View>

        <View style={{ paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginLeft: 2 }}>Email</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="mail-outline" size={18} color={colors.textTertiary} style={{ position: 'absolute', left: 14, zIndex: 1 }} />
            <TextInput
              placeholder="ton@email.com"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, paddingLeft: 42, paddingRight: 16, paddingVertical: 15, fontSize: 16, color: colors.text }}
              autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress"
            />
          </View>

          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginLeft: 2 }}>Mot de passe</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} style={{ position: 'absolute', left: 14, zIndex: 1 }} />
            <TextInput
              placeholder="••••••••"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, paddingLeft: 42, paddingRight: 42, paddingVertical: 15, fontSize: 16, color: colors.text }}
              secureTextEntry={!showPassword} autoComplete="password" textContentType="password"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, zIndex: 1, padding: 4 }}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textTertiary} />
            </Pressable>
          </View>
          <Text style={{ fontSize: 12, color: colors.textTertiary, marginBottom: 24, marginLeft: 2 }}>Minimum 8 caractères</Text>

          <Pressable
            onPress={handleRegister}
            disabled={submitting}
            style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              {submitting ? 'Création…' : 'Créer mon compte'}
            </Text>
          </Pressable>

          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32, marginBottom: 40, gap: 6 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Déjà inscrit ?</Text>
            <Pressable onPress={() => router.replace('/(auth)')}>
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>Se connecter</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
