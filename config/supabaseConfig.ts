// FILE: config/supabaseConfig.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables!\n' +
    'Please create a .env file with:\n' +
    '  EXPO_PUBLIC_SUPABASE_URL=your_url\n' +
    '  EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key\n' +
    'Then rebuild the app with: npx expo prebuild --clean && npx expo run:android'
  );
}

// HTTPS enforcement — refuser les URLs non-HTTPS
if (!supabaseUrl.startsWith('https://')) {
  throw new Error('Supabase URL must use HTTPS');
}

// Configuration du storage selon la plateforme
// - Web: undefined → Supabase utilise localStorage par défaut
// - Mobile: SecureStore (chiffré par le système — Keychain iOS / Keystore Android)
const authStorage = Platform.OS === 'web'
  ? undefined
  : {
      getItem: async (key: string) => {
        return await SecureStore.getItemAsync(key);
      },
      setItem: async (key: string, value: string) => {
        await SecureStore.setItemAsync(key, value);
      },
      removeItem: async (key: string) => {
        await SecureStore.deleteItemAsync(key);
      },
    };

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Exports pour la compatibilité avec l'ancien code Firebase
export const auth = supabase.auth;
export const db = supabase;
export const storage = supabase.storage;
