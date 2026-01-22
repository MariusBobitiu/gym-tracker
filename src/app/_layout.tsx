import '../../global.css';

import { Stack } from 'expo-router'; 
import { SessionProvider, useSession } from '@/lib/auth/context';
import { SplashScreenController } from '@/components/splash';
import { ThemeProvider } from '@/lib/theme-context';
import { useEffect } from 'react';
import { loadSelectedTheme } from '@/hooks';
import { runStorageMigrations } from '@/lib/storage';

export default function Root() {
  // Set up the auth context and render your layout inside of it.
  return (
    <SessionProvider>
      <ThemeProvider>
        <SplashScreenController />
        <RootNavigator />
      </ThemeProvider>
    </SessionProvider>
  );
}

// Create a new component that can access the SessionProvider context later.
function RootNavigator() {
  const { session } = useSession();

  useEffect(() => {
    runStorageMigrations();
    loadSelectedTheme();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 150,
      }}
    >
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}
