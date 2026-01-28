import { useTheme } from "@/lib/theme-context";
import { Stack } from "expo-router";
import React from "react";

export default function WorkoutLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 150,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}>
      <Stack.Screen
        name="index"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
          animationDuration: 300,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="start"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
          animationDuration: 300,
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}
