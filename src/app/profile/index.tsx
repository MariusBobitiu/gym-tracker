import { Button, Text, View } from '@/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, Stack } from 'expo-router';
import { useTheme } from '@/lib/theme-context';
import { ThemeToggler } from '@/components/theme-toggler';

export default function Profile() {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      edges={['top']}
      className="flex flex-1 p-4 pb-24"
      style={{ backgroundColor: colors.background }}
    >
      <Stack.Screen options={{ title: 'Profile' }} />
      <Text style={{ color: colors.foreground }} className="text-xl font-bold mb-6">
        Profile
      </Text>
      <ThemeToggler />
			<Link href="/profile/account" asChild>
				<Button label="Account" />
			</Link>
    </SafeAreaView>
  );
}
