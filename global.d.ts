/// <reference types="nativewind/types" />

declare module 'firebase/auth/react-native' {
  // Why: shim de types pour TS quand il ne résout pas ce sous-chemin.
  import type { Persistence } from 'firebase/auth';
  export function getReactNativePersistence(
    storage: { getItem: (k: string) => Promise<string | null>; setItem: (k: string, v: string) => Promise<void>; removeItem: (k: string) => Promise<void> }
  ): Persistence;
}