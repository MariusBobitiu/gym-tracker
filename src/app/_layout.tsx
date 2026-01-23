import "../../global.css";

import { Stack } from "expo-router";
import { SessionProvider, useSession } from "@/lib/auth/context";
import { SplashScreenController } from "@/components/splash";
import { ThemeProvider } from "@/lib/theme-context";
import { useEffect } from "react";
import { loadSelectedTheme } from "@/hooks";
import { runStorageMigrations } from "@/lib/storage";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query/query-client";

export default function Root() {
  // Set up the auth context and render your layout inside of it.
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SplashScreenController />
          <RootNavigator />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}

// Create a new component that can access the SessionProvider context later.
function RootNavigator() {
  const { status } = useSession();
  const isAuthed = status === "authed";
  const isGuest = status === "guest";

  useEffect(() => {
    runStorageMigrations();
    loadSelectedTheme();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 150,
      }}>
      <Stack.Protected guard={isAuthed}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={isGuest}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}
