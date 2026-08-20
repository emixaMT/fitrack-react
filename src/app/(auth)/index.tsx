import React, { useEffect, useState } from 'react';
import {
  View, TextInput, Text, Pressable, Image, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { login } from '../../../services/supabaseAuth';
import { checkUserExists } from '../../../services/userService';
import { supabase } from '../../../config/supabaseConfig';
import { checkUserStatus } from '../../../services/userService';
import { useTheme } from '../../../contexts/ThemeContext';

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/home');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) router.replace('/home');
    });
    return () => subscription.unsubscribe();
  }, [router]);

  async function handleLogin() {
    const e = email.trim();
    if (!e || !password) { Alert.alert('Champs requis', 'Email et mot de passe obligatoires.'); return; }
    setSubmitting(true);
    try {
      const cred = await login(e, password);
      const status = await checkUserStatus(cred.user.uid);
      if (!status.exists) { Alert.alert('Profil introuvable', 'Aucun profil associé.'); return; }
      if (status.active === false) { Alert.alert('Compte non activé', 'Compte non activé.'); return; }
      router.replace('/home');
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Échec');
    } finally { setSubmitting(false); }
  }

  async function handleForgotPassword() {
    const e = email.trim();
    if (!e) { Alert.alert('Email requis', 'Saisis ton email.'); return; }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(e);
      if (error) throw error;
      Alert.alert('Email envoyé', 'Vérifie ta boîte mail.');
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Échec');
    }
  }

  async function handleBiometricLogin() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !enrolled) { Alert.alert('Non disponible', 'Aucune biométrie.'); return; }
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Authentifiez-vous', fallbackLabel: 'Mot de passe' });
      if (!result.success) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { Alert.alert('Session requise', 'Connecte-toi d\'abord.'); return; }
      const exists = await checkUserExists(session.user.id);
      if (!exists) { Alert.alert('Erreur', 'Compte non activé.'); return; }
      router.replace('/home');
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Erreur biométrique');
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', paddingTop: 60, paddingBottom: 36 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 18,
            backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
          }}>
            <Image source={require('../../assets/logo.png')} style={{ width: 44, height: 44 }} resizeMode="contain" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 16 }}>Fitrack</Text>
          <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 4 }}>Bon retour</Text>
        </View>

        <View style={{ paddingHorizontal: 24 }}>
          {/* Email */}
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginLeft: 2 }}>Email</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="mail-outline" size={18} color={colors.textTertiary} style={{ position: 'absolute', left: 14, zIndex: 1 }} />
            <TextInput
              placeholder="ton@email.com"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              style={{
                flex: 1, backgroundColor: colors.card, borderRadius: 12,
                paddingLeft: 42, paddingRight: 16, paddingVertical: 15, fontSize: 16, color: colors.text,
              }}
              autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress"
            />
          </View>

          {/* Password */}
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginLeft: 2 }}>Mot de passe</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} style={{ position: 'absolute', left: 14, zIndex: 1 }} />
            <TextInput
              placeholder="••••••••"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              style={{
                flex: 1, backgroundColor: colors.card, borderRadius: 12,
                paddingLeft: 42, paddingRight: 42, paddingVertical: 15, fontSize: 16, color: colors.text,
              }}
              secureTextEntry={!showPassword} autoComplete="password" textContentType="password"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, zIndex: 1, padding: 4 }}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textTertiary} />
            </Pressable>
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={submitting}
            style={{
              backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              {submitting ? 'Connexion…' : 'Se connecter'}
            </Text>
          </Pressable>

          <View style={{ alignItems: 'center', marginTop: 20, gap: 14 }}>
            <Pressable onPress={handleForgotPassword}>
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '500' }}>Mot de passe oublié ?</Text>
            </Pressable>
            <Pressable
              onPress={handleBiometricLogin}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: colors.card, borderRadius: 10 }}
            >
              <Ionicons name="finger-print" size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>Face ID / Touch ID</Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32, marginBottom: 40, gap: 6 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Pas inscrit ?</Text>
            <Pressable onPress={() => router.push('/register')}>
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>Créer un compte</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
