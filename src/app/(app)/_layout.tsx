import { Stack } from "expo-router";
import { View } from "@/components/ui";
import { BottomNavigation } from "@/components/bottom-navigation";
import { BackgroundGradient } from "@/components/background-gradient";
import { useTheme } from "@/lib/theme-context";

export default function Layout() {
  const { colors } = useTheme();
  return (
    <View className="flex-1">
      <BackgroundGradient />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          animationDuration: 150,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen
          name="workout"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            animationDuration: 300,
          }}
        />
      </Stack>
      <BottomNavigation />
    </View>
  );
}
