import { supabase } from '../config/supabaseConfig';
import { isValidUUID } from '../utils/validation';

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
  [key: string]: unknown;
};

async function findUserDoc(uid: string): Promise<UserProfile | null> {
  // Valider que uid est un UUID valide pour éviter l'injection
  if (!isValidUUID(uid)) return null;

  // Recherche sécurisée: deux requêtes séparées au lieu de .or() avec template literal
  const { data: byId, error: errId } = await supabase
    .from('users')
    .select('*')
    .eq('id', uid)
    .maybeSingle();

  if (errId) {
    console.error('Error fetching user by id:', errId);
  }
  if (byId) return byId as UserProfile;

  const { data: byUid, error: errUid } = await supabase
    .from('users')
    .select('*')
    .eq('uid', uid)
    .maybeSingle();

  if (errUid) {
    console.error('Error fetching user by uid:', errUid);
    return null;
  }

  return byUid as UserProfile | null;
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