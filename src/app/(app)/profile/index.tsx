import { Button, H1, Text } from '@/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, Stack } from 'expo-router';
import { ThemeToggler } from '@/components/theme-toggler';
import { BackgroundGradient } from '@/components/background-gradient';

export default function Profile() {

  return (
    <SafeAreaView
      edges={['top']}
      className="flex flex-1 p-4 pb-24"
    >
      <BackgroundGradient />
      <Stack.Screen options={{ title: 'Profile' }} />
      <H1>
        Profile
      </H1>
      <ThemeToggler />
			<Link href="/profile/account" asChild>
				<Button label="Account" variant="outline" />
			</Link>
    </SafeAreaView>
  );
}
