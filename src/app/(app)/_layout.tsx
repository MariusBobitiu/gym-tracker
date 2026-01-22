import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View } from '@/components/ui';
import { BottomNavigation } from '@/components/bottom-navigation';
import { BackgroundGradient } from '@/components/background-gradient';

export default function Layout() {
  return (
      <View className="flex-1">
        <BackgroundGradient />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            animationDuration: 150,
            contentStyle: {
              backgroundColor: 'transparent',
            }
          }}
        />
        <BottomNavigation />
      </View>
  );
}
