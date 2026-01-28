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
import { Screen } from "@/components/screen";
import { View } from "@/components/ui";
import { LoadingState } from "@/components/feedback-states";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function Root() {
  // Set up the auth context and render your layout inside of it.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SessionProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <SplashScreenController />
              <RootNavigator />
            </ThemeProvider>
          </QueryClientProvider>
        </SessionProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

// Create a new component that can access the SessionProvider context later.
function RootNavigator() {
  const { status } = useSession();
  const isAuthed = status === "authed";
  const isGuest = status === "guest";
  const isLoading = status === "loading";

  useEffect(() => {
    runStorageMigrations();
    loadSelectedTheme();
  }, []);

  if (isLoading) {
    return (
      <Screen className="pb-24">
        <View className="flex-1 items-center justify-center">
          <LoadingState label="Loading History..." style={{ marginTop: 48 }} />
        </View>
      </Screen>
    );
  }

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
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
