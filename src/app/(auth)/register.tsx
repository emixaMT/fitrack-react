// app/register.tsx
import { useState } from "react";
import { View, TextInput, Text, Pressable, Alert } from "react-native";
import { supabase } from "../../../config/supabaseConfig";
import { register } from "../../../services/supabaseAuth";
import React from "react";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      const userCredential = await register(email, password);
      const user = userCredential.user;

      // ✅ Créer un profil utilisateur dans Supabase
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: user.uid,
          email: user.email,
          is_active: true,
          status: 'active',
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        Alert.alert("Attention", "Compte créé mais profil non sauvegardé: " + profileError.message);
      }

      Alert.alert("Succès", "Utilisateur créé !");
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-white px-6">
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        className="border border-gray-300 w-full px-4 py-3 rounded-xl mb-4"
      />
      <TextInput
        placeholder="Mot de passe"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        className="border border-gray-300 w-full px-4 py-3 rounded-xl mb-6"
      />
      <Pressable
        onPress={handleRegister}
        className="w-full bg-indigo-600 py-4 rounded-xl"
      >
        <Text className="text-center text-white font-bold">Créer un compte</Text>
      </Pressable>
    </View>
  );
}
