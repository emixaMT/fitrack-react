import React from "react";
import { Image, View, ViewStyle } from "react-native";
import { useHeaderAvatar } from "../hooks/useHeaderAvatar";

const FALLBACK = require("../src/assets/fallback.png"); 

type HeaderProps = { size?: number; style?: ViewStyle };
type HeroProps = { top?: number; size?: number; style?: ViewStyle };

/** Petit avatar pour le header (pas d'absolu). */
export default function HeaderAvatar({ size = 28, style }: HeaderProps) {
  const { source } = useHeaderAvatar(FALLBACK);
  return (
    <View style={[{ paddingRight: 12 }, style]}>
      <Image
        source={source}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    </View>
  );
}

/** Grand avatar centré, en premier plan (absolu). */
export function HeroAvatar({ top = 60, size = 144, style }: HeroProps) {
  const { source } = useHeaderAvatar(FALLBACK);

  // Why: zIndex + elevation -> top sur iOS/Android; box-none -> ne bloque pas les touches
  return (
    <View
      pointerEvents="box-none"
      style={[
        {
          position: "absolute",
          left: 0,
          right: 0,
          top,
          alignItems: "center",
          zIndex: 9999,         // iOS/Android (avec position)
          elevation: 24,        // Android: au-dessus des siblings
        },
        style,
      ]}
    >
      <Image
        source={source}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 4,
          borderColor: "white",
        }}
        resizeMode="cover"
        className="bg-indigo-300"
      />
    </View>
  );
}