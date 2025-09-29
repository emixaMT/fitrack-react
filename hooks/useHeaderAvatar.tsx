// FILE: src/hooks/useHeaderAvatar.ts
import { useEffect, useState } from "react";
import type { ImageSourcePropType } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../config/firebaseConfig";
import { getAvatarSourceById } from "../constantes/avatars";

export function useHeaderAvatar(fallback: ImageSourcePropType) {
  const [source, setSource] = useState<ImageSourcePropType>(fallback);

  useEffect(() => {
    let unsubDoc: undefined | (() => void);

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubDoc) { unsubDoc(); unsubDoc = undefined; }

      if (!user) {
        setSource(fallback);
        return;
      }

      const ref = doc(db, "Users", user.uid);
      unsubDoc = onSnapshot(
        ref,
        (snap) => {
          const data = (snap.data() as any) ?? {};

          // 1) Avatar local par id -> require(...)
          if (typeof data?.avatarId === "string" && data.avatarId) {
            setSource(getAvatarSourceById(data.avatarId));
            return;
          }

          // 2) photoURL Firestore ou Auth -> { uri }
          const fsUrl: string | undefined =
            typeof data?.photoURL === "string" ? data.photoURL : undefined;
          const authUrl: string | null | undefined = user.photoURL;

          if (fsUrl || authUrl) {
            setSource({ uri: (fsUrl ?? authUrl)! });
          } else {
            setSource(fallback);
          }
        },
        () => {
          setSource(user.photoURL ? { uri: user.photoURL } : fallback);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubDoc) unsubDoc();
    };
  }, [fallback]);

  return { source };
}
