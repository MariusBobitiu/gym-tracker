import { Stack } from "expo-router";
import { View } from "react-native";
import { BackgroundGradient } from "@/components/background-gradient";

export default function OnboardingLayout() {
  return (
    <View className="flex-1">
      <BackgroundGradient />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
    </View>
  );
}
