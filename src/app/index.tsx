import { Stack, router } from 'expo-router';

import { Button, H1, H2, H3, P, Small, Text, View } from '@/components/ui';
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
      <H1>Home</H1>
      <H2>Home</H2>
      <H3>Home</H3>
      <P>Home</P>
      <Small>Home</Small>
    </SafeAreaView>
  );
}
