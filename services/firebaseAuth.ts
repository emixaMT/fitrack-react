// services/firebaseAuth.ts
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../config/firebaseConfig";

// Connexion
export const login = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Inscription
export const register = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// Déconnexion
export const logout = () => {
  return signOut(auth);
};
