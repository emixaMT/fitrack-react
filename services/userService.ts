import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export type UserProfile = {
  name?: string;
  email?: string;
  photoURL?: string;
  active?: boolean;
  isActive?: boolean;
  status?: 'active' | 'approved' | 'pending' | 'disabled' | string;
  uid?: string;
  [key: string]: any;
};

type FoundDoc =
  | { path: 'Users' | 'users'; id: string; data: UserProfile }
  | null;

async function findUserDoc(uid: string): Promise<FoundDoc> {
  // 1) Users/{uid}
  const refUsers = doc(db, 'Users', uid);
  const snapUsers = await getDoc(refUsers);
  if (snapUsers.exists()) {
    return { path: 'Users', id: uid, data: snapUsers.data() as UserProfile };
  }

  // 2) users/{uid}
  const refusers = doc(db, 'users', uid);
  const snapsusers = await getDoc(refusers);
  if (snapsusers.exists()) {
    return { path: 'users', id: uid, data: snapsusers.data() as UserProfile };
  }

  // 3) Users where uid == uid
  const q1 = query(collection(db, 'Users'), where('uid', '==', uid), limit(1));
  const r1 = await getDocs(q1);
  if (!r1.empty) {
    const d = r1.docs[0];
    return { path: 'Users', id: d.id, data: d.data() as UserProfile };
  }

  // 4) users where uid == uid
  const q2 = query(collection(db, 'users'), where('uid', '==', uid), limit(1));
  const r2 = await getDocs(q2);
  if (!r2.empty) {
    const d = r2.docs[0];
    return { path: 'users', id: d.id, data: d.data() as UserProfile };
  }

  return null;
}

function parseActive(data: UserProfile | undefined): boolean | undefined {
  if (!data) return undefined;

  if (typeof data.active === 'boolean') return data.active;
  if (typeof data.isActive === 'boolean') return data.isActive;

  const status = (data.status || '').toString().toLowerCase();
  if (status === 'active' || status === 'approved') return true;
  if (status === 'pending' || status === 'disabled') return false;

  return undefined; // inconnu → on ne bloque pas par défaut
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const found = await findUserDoc(uid);
  return found ? found.data : null;
}

/**
 * Renvoie l’état d’existence/activation du profil utilisateur.
 * exists: le doc est présent quelque part
 * active: true/false si connu, sinon undefined quand aucun flag n’est stocké
 */
export async function checkUserStatus(uid: string): Promise<{ exists: boolean; active: boolean | undefined; profile: UserProfile | null; }> {
  if (!uid) return { exists: false, active: undefined, profile: null };

  const found = await findUserDoc(uid);
  if (!found) return { exists: false, active: undefined, profile: null };

  const active = parseActive(found.data);
  return { exists: true, active, profile: found.data };
}

/** Compat: ancien nom ; garde un bool simple pour ne pas casser les imports existants. */
export async function checkUserExists(uid: string): Promise<boolean> {
  const { exists, active } = await checkUserStatus(uid);
  // Si on connaît explicitement `active === false`, alors false ; sinon on renvoie `exists`.
  return active === false ? false : exists;
}