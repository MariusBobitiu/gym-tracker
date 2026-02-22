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
      <Stack.Screen
        name="index"
        options={{
          title: "Settings",
          animation: "ios_from_right",
          animationDuration: 150,
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: "Profile",
          animation: "ios_from_right",
          animationDuration: 150,
        }}
      />
      <Stack.Screen
        name="email-password"
        options={{
          title: "Email & password",
          animation: "ios_from_right",
          animationDuration: 150,
        }}
      />
      <Stack.Screen
        name="verify-email"
        options={{
          title: "Verify email",
          animation: "ios_from_right",
          animationDuration: 150,
        }}
      />
      <Stack.Screen
        name="units"
        options={{
          title: "Units",
          animation: "ios_from_right",
          animationDuration: 150,
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: "Notifications",
          animation: "ios_from_right",
          animationDuration: 150,
        }}
      />
      <Stack.Screen
        name="apple-health"
        options={{
          title: "Apple Health",
          animation: "ios_from_right",
          animationDuration: 150,
        }}
      />
      <Stack.Screen
        name="help-faq"
        options={{
          title: "Help & FAQ",
          animation: "ios_from_right",
          animationDuration: 150,
        }}
      />
      <Stack.Screen
        name="report-bug"
        options={{
          title: "Report a bug",
          animation: "ios_from_right",
          animationDuration: 150,
        }}
      />
    </Stack>
  );
}
