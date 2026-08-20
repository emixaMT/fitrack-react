// FILE: config/supabaseConfig.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// Configuration du storage selon la plateforme
const authStorage = Platform.OS === 'web' 
  ? undefined // Supabase utilise localStorage par défaut sur web
  : {
      getItem: async (key: string) => {
        return await AsyncStorage.getItem(key);
      },
      setItem: async (key: string, value: string) => {
        await AsyncStorage.setItem(key, value);
      },
      removeItem: async (key: string) => {
        await AsyncStorage.removeItem(key);
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
