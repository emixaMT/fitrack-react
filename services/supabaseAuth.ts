// services/supabaseAuth.ts
import { supabase } from "../config/supabaseConfig";

// Connexion
export const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  
  // Format compatible avec Firebase pour la compatibilité
  return {
    user: {
      uid: data.user?.id || '',
      email: data.user?.email || '',
      ...data.user,
    },
  };
};

// Inscription
export const register = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  
  // Format compatible avec Firebase pour la compatibilité
  return {
    user: {
      uid: data.user?.id || '',
      email: data.user?.email || '',
      ...data.user,
    },
  };
};

// Déconnexion
export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
