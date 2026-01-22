import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View } from '@/components/ui';
import { BottomNavigation } from '@/components/bottom-navigation';
import { loadSelectedTheme } from '@/lib/hooks/use-selected-theme';
import { useTheme } from '@/lib/theme-context';

export default function Layout() {
  const { colors } = useTheme();
  useEffect(() => {
    loadSelectedTheme();
  }, []);

  return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            animationDuration: 150,
          }}
        />
        <BottomNavigation />
      </View>
  );
}
