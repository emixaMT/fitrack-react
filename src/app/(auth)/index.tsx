// FILE: app/(auth)/login.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';

import { login } from '../../../services/firebaseAuth';           // doit appeler signInWithEmailAndPassword(auth, ...)
import { checkUserExists } from '../../../services/userService';  // doit renvoyer un boolean
import { auth } from '../../../config/firebaseConfig';            // export { auth } depuis config modulaire
import { checkUserStatus } from '../../../services/userService';


export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Why: redirige si une session Firebase existe déjà (évite currentUser undefined/obsolète)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.replace('/home');
    });
    return unsub;
  }, [router]);

  async function handleLogin() {
  const e = email.trim();
  const p = password;
  if (!e || !p) {
    Alert.alert('Champs requis', 'Email et mot de passe sont obligatoires.');
    return;
  }
  setSubmitting(true);
  try {
    const cred = await login(e, p);
    const uid = cred.user.uid;

    const status = await checkUserStatus(uid);

    if (!status.exists) {
      // Ton compte de dev est peut-être dans "users" ou avec un champ "uid" différent ; maintenant couvert.
      Alert.alert('Profil introuvable', 'Aucun profil Firestore associé à ce compte.');
      return;
    }
    if (status.active === false) {
      Alert.alert('Compte non activé', 'Ce compte existe mais n’est pas encore activé.');
      return;
    }

    // OK: existe et pas explicitement désactivé
    router.replace('/home');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Authentification échouée';
    Alert.alert('Erreur', msg);
  } finally {
    setSubmitting(false);
  }
}

  async function handleBiometricLogin() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !enrolled) {
        Alert.alert('Non disponible', 'Aucune méthode biométrique n’est configurée.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authentifiez-vous',
        fallbackLabel: 'Utiliser le mot de passe',
      });
      if (!result.success) {
        Alert.alert('Échec', 'Authentification biométrique annulée.');
        return;
      }

      // Why: la biométrie ne connecte pas à Firebase, elle déverrouille seulement l’accès local ;
      // on exige donc une session Firebase existante.
      const user = auth.currentUser;
      if (!user) {
        Alert.alert(
          'Session requise',
          'Aucune session existante. Connectez-vous une première fois avec email/mot de passe.'
        );
        return;
      }

      const exists = await checkUserExists(user.uid);
      if (!exists) {
        Alert.alert('Erreur', 'Ce compte n’a pas encore été activé.');
        return;
      }

      router.replace('/home');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur biométrique';
      Alert.alert('Erreur', message);
    }
  }

  return (
    <View className="flex-1 justify-center p-4 bg-white">
      <Image
        source={require('../../assets/logo.png')}
        className="w-24 h-24 mx-auto mb-6"
        resizeMode="contain"
      />
      <Text className="text-indigo-600 text-2xl font-bold mb-6 text-center">Connexion</Text>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TextInput
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          className="mb-4 p-3 rounded bg-gray-100 text-indigo-900"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <TextInput
          placeholder="Mot de passe"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          className="mb-6 p-3 rounded bg-gray-100 text-indigo-900"
          secureTextEntry
          autoComplete="password"
          textContentType="password"
        />
      </KeyboardAvoidingView>

      <View className="flex flex-col gap-4">
        <Pressable
          className="flex mx-auto justify-center bg-indigo-600 py-4 px-6 rounded-lg opacity-100"
          onPress={handleLogin}
          disabled={submitting}
        >
          <Text className="text-white">{submitting ? 'Connexion…' : 'Se connecter'}</Text>
        </Pressable>

        <Pressable className="flex mx-auto justify-center" onPress={handleBiometricLogin}>
          <Text className="text-indigo-600">Se connecter avec Face ID / Touch ID</Text>
        </Pressable>

        <Pressable className="flex mx-auto justify-center" onPress={() => router.push('/register')}>
          <Text className="text-indigo-600">Pas encore inscrit ?</Text>
        </Pressable>
      </View>
    </View>
  );
}
