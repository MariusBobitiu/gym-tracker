import * as React from "react";
import Svg, { Defs, Pattern, RadialGradient, Rect, Stop } from "react-native-svg";
import { View } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";
import { Image } from "expo-image";

export function NoiseOverlay() {
  const { isDark } = useTheme();

  return (
    <Image
      source={require("../../assets/noise.jpg")}
      style={{ position: "absolute", inset: 0, opacity: isDark ? 0.03 : 0.05 }}
      contentFit="cover"
      pointerEvents="none"
    />
  );
}

export function AmbientBackground(): React.ReactElement {
  const { colors, isDark } = useTheme();

  return (
    <View className="absolute inset-0 -z-10" pointerEvents="none">
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="glow" cx="0%" cy="0%" rx="80%" ry="90%">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity={isDark ? 0.12 : 0.3} />
            <Stop offset="60%" stopColor={colors.primary} stopOpacity={isDark ? 0.04 : 0.1} />
            <Stop offset="100%" stopColor={colors.background} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="vignette" cx="50%" cy="50%" rx="75%" ry="75%">
            <Stop offset="0%" stopColor={colors.background} stopOpacity="0" />
            <Stop offset="80%" stopColor={colors.secondary} stopOpacity={isDark ? 0.08 : 0.08} />
            <Stop offset="100%" stopColor={colors.secondary} stopOpacity={isDark ? 0.15 : 0.15} />
          </RadialGradient>
          <Pattern id="noise" patternUnits="userSpaceOnUse" width="200" height="200">
            <Rect width="200" height="200" fill="transparent" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={colors.background} />
        <Rect width="100%" height="100%" fill="url(#glow)" />
        <Rect width="100%" height="100%" fill="url(#vignette)" />
        <Rect width="100%" height="100%" fill="url(#noise)" opacity={0.05} />
      </Svg>
    </View>
  );
}
