// FILE: config/supabaseConfig.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = "https://tlcmvzbdzodrtyymimlu.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsY212emJkem9kcnR5eW1pbWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzcwMDgsImV4cCI6MjA3NTM1MzAwOH0.vaH-6E-X7o0sxQ9y5OI1VENlLCUKPPXlE-CnrinCDcQ";

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
