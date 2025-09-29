// FILE: src/constants/avatars.ts
import { ImageSourcePropType } from "react-native";

export type AvatarId = "a1" | "a2" | "a3" | "a4" | "a5" | "a6" | "a7" | "a8" | "a9";

// Fallback utilisé partout si id inconnu/absent
export const DEFAULT_AVATAR = require("../src/assets/avatar.png");

// Mapping local → require(...) (remplace par tes vrais fichiers)
export const AVATAR_POOL: Record<AvatarId, ImageSourcePropType> = {
  a1: require("../src/assets/avatar.png"),
  a2: require("../src/assets/avatar2.png"),
  a3: require("../src/assets/avatar3.png"),
  a4: require("../src/assets/avatar4.png"),
  a5: require("../src/assets/avatar5.png"),
  a6: require("../src/assets/avatar6.png"),
  a7: require("../src/assets/avatar7.png"),
  a8: require("../src/assets/avatar8.png"),
  a9: require("../src/assets/avatar9.png"),
};

// Pratique pour générer la grille
export const AVATAR_IDS = Object.keys(AVATAR_POOL) as AvatarId[];

/** Renvoie une ImageSource RN (pas une URI string). */
export function getAvatarSourceById(id?: string): ImageSourcePropType {
  if (!id) return DEFAULT_AVATAR;
  return (AVATAR_POOL as Record<string, ImageSourcePropType>)[id] ?? DEFAULT_AVATAR;
}
