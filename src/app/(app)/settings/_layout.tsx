import { Stack } from "expo-router";
import React from "react";

export default function SettingsLayout(): React.ReactElement {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "ios_from_right",
        animationDuration: 150,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Settings" }} />
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
      <Stack.Screen
        name="email-password"
        options={{ title: "Email & password" }}
      />
      <Stack.Screen name="units" options={{ title: "Units" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen name="apple-health" options={{ title: "Apple Health" }} />
      <Stack.Screen name="help-faq" options={{ title: "Help & FAQ" }} />
      <Stack.Screen name="report-bug" options={{ title: "Report a bug" }} />
    </Stack>
  );
}
