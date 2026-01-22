import { Stack, router } from 'expo-router';

import { Button, Text, View } from '@/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme-context';

export default function Home() {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      edges={['top']}
      className="flex flex-1 p-2 pb-24"
      style={{ backgroundColor: colors.background }}
    >
      <Stack.Screen options={{ title: 'Home' }} />
      <Text className="text-xl font-bold" style={{ color: colors.foreground }}>
        Home
      </Text>
    </SafeAreaView>
  );
}
