import '../../global.css';

import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View } from '@/components/ui';
import { BottomNavigation } from '@/components/bottom-navigation';
import { loadSelectedTheme } from '@/lib/hooks/use-selected-theme';
import { ThemeProvider } from '@/lib/theme-context';

export default function Layout() {
  useEffect(() => {
    loadSelectedTheme();
  }, []);

  return (
    <ThemeProvider>
      <View className="flex-1 bg-background">
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            animationDuration: 150,
          }}
        />
        <BottomNavigation />
      </View>
    </ThemeProvider>
  );
}
