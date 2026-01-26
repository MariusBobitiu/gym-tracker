import * as React from "react";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { View } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";

export function AmbientBackground(): React.ReactElement {
  const { colors } = useTheme();

  return (
    <View className="absolute inset-0 -z-10" pointerEvents="none">
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="glow" cx="0%" cy="0%" rx="70%" ry="70%">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.18" />
            <Stop offset="40%" stopColor={colors.primary} stopOpacity="0.08" />
            <Stop offset="100%" stopColor={colors.background} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="vignette" cx="50%" cy="50%" rx="65%" ry="65%">
            <Stop offset="0%" stopColor={colors.background} stopOpacity="0" />
            <Stop offset="70%" stopColor={colors.secondary} stopOpacity="0.12" />
            <Stop offset="100%" stopColor={colors.secondary} stopOpacity="0.22" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={colors.background} />
        <Rect width="100%" height="100%" fill="url(#glow)" />
        <Rect width="100%" height="100%" fill="url(#vignette)" />
      </Svg>
    </View>
  );
}
