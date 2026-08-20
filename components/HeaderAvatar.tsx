import React from "react";
import { Image, View, ViewStyle } from "react-native";
import { useHeaderAvatar } from "../hooks/useHeaderAvatar";
import { useTheme } from "../contexts/ThemeContext";

const FALLBACK = require("../src/assets/fallback.png");

type HeaderProps = { size?: number; style?: ViewStyle };
type HeroProps = { top?: number; size?: number; style?: ViewStyle };

export default function HeaderAvatar({ size = 28, style }: HeaderProps) {
  const { source } = useHeaderAvatar(FALLBACK);
  return (
    <View style={[{ paddingRight: 12 }, style]}>
      <Image source={source} style={{ width: size, height: size, borderRadius: size / 2 }} resizeMode="cover" />
    </View>
  );
}

export function HeroAvatar({ top = 60, size = 100, style }: HeroProps) {
  const { source } = useHeaderAvatar(FALLBACK);
  const { colors } = useTheme();

  return (
    <View
      pointerEvents="box-none"
      style={[{ position: "absolute", left: 0, right: 0, top, alignItems: "center", zIndex: 40, elevation: 8 }, style]}
    >
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: colors.card, overflow: 'hidden',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Image source={source} style={{ width: size, height: size, borderRadius: size / 2 }} resizeMode="cover" />
      </View>
    </View>
  );
}
