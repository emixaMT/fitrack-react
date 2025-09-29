// FILE: config/firebaseConfig.ts
import { Platform } from 'react-native';
import { getApps, getApp, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  getAuth,
  initializeAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  type Auth,
} from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!, // ex: "myapp.appspot.com" (sans gs://)
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createAuth(): Auth {
  if (Platform.OS === 'web') {
    const a = getAuth(app);
    setPersistence(a, browserLocalPersistence).catch(() => void 0);
    return a;
  }
  try {
    return initializeAuth(app); // persistance mémoire, compile partout
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();
export const db = getFirestore(app);

// ✅ Laisse le SDK déduire le bucket depuis firebaseConfig (évite les erreurs storage/unknown)
export const storage = getStorage(app);

/** ------- Shim compat pour du code legacy: auth.onAuthStateChanged(...) ------- */
type OnAuthCb = Parameters<typeof onAuthStateChanged>[1];
if (!(auth as any).onAuthStateChanged) {
  (auth as any).onAuthStateChanged = (nextOrObserver: OnAuthCb, error?: any, completed?: any) =>
    onAuthStateChanged(auth, nextOrObserver as any, error, completed);
}

/** Nouvelle API recommandée */
export const listenAuth = (cb: OnAuthCb) => onAuthStateChanged(auth, cb);
