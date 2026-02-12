import { Stack } from "expo-router";
import React from "react";

export default function NotificationsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "ios_from_right",
        animationDuration: 150,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Notifications",
          animation: "ios_from_right",
          animationDuration: 300,
        }}
      />
    </Stack>
  );
}
