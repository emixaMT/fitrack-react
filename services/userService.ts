import { supabase } from '../config/supabaseConfig';

export type UserProfile = {
  id?: string;
  name?: string;
  email?: string;
  photoURL?: string;
  photo_url?: string;
  active?: boolean;
  isActive?: boolean;
  is_active?: boolean;
  status?: 'active' | 'approved' | 'pending' | 'disabled' | string;
  uid?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
};

async function findUserDoc(uid: string): Promise<UserProfile | null> {
  // Recherche dans la table users avec l'id ou le champ uid
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`id.eq.${uid},uid.eq.${uid}`)
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = pas de ligne trouvée
    console.error('Error fetching user:', error);
    return null;
  }

  return data as UserProfile | null;
}

function parseActive(data: UserProfile | undefined): boolean | undefined {
  if (!data) return undefined;

  if (typeof data.active === 'boolean') return data.active;
  if (typeof data.isActive === 'boolean') return data.isActive;
  if (typeof data.is_active === 'boolean') return data.is_active;

  const status = (data.status || '').toString().toLowerCase();
  if (status === 'active' || status === 'approved') return true;
  if (status === 'pending' || status === 'disabled') return false;

  return undefined; // inconnu → on ne bloque pas par défaut
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  return await findUserDoc(uid);
}

/**
 * Renvoie l'état d'existence/activation du profil utilisateur.
 * exists: le doc est présent quelque part
 * active: true/false si connu, sinon undefined quand aucun flag n'est stocké
 */
export async function checkUserStatus(uid: string): Promise<{ exists: boolean; active: boolean | undefined; profile: UserProfile | null; }> {
  if (!uid) return { exists: false, active: undefined, profile: null };

  const profile = await findUserDoc(uid);
  if (!profile) return { exists: false, active: undefined, profile: null };

  const active = parseActive(profile);
  return { exists: true, active, profile };
}

/** Compat: ancien nom ; garde un bool simple pour ne pas casser les imports existants. */
export async function checkUserExists(uid: string): Promise<boolean> {
  const { exists, active } = await checkUserStatus(uid);
  // Si on connaît explicitement `active === false`, alors false ; sinon on renvoie `exists`.
  return active === false ? false : exists;
}