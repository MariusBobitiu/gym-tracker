import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/lib/theme-context";

export function BackgroundGradient() {
  const { isDark } = useTheme();

  return (
    <LinearGradient
      colors={
        isDark
          ? ["#0B0D10", "#101114", "#121317", "#0B0D10"]
          : ["#FFFFFF", "#F7F6F3", "#F2F0EC", "#FFFFFF"]
      }
      locations={isDark ? [0, 0.35, 0.7, 1] : [0, 0.35, 0.7, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      }}
    />
  );
}
