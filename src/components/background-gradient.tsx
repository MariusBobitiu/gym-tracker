import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/lib/theme-context";

export function BackgroundGradient() {
  const { isDark } = useTheme();
  return (
    <LinearGradient
      colors={isDark ? ["#0B0D10", "#13161a", "#0B0D10"] : ["#FFFFFF", "#F7F8FA", "#FFFFFF"]}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        height: "auto",
      }}
    />
  );
}
