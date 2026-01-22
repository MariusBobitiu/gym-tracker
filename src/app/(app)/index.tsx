import { Stack, router } from 'expo-router';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, H1, H2, H3, P, Small, Text, View } from '@/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme-context';
import { useSession } from '@/lib/auth/context';

export default function Home() {
  const { colors } = useTheme();
  const { signOut } = useSession();

  return (
    <SafeAreaView
      edges={['top']}
      className="flex flex-1 p-2 pb-24"
      style={{ backgroundColor: colors.background }}
    >
      <Stack.Screen options={{ title: 'Home' }} />
      <H1 className='mb-4'>Home</H1>

      <Card>
        <CardHeader>
          <CardTitle>
            Card Title
          </CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>
          <P>Typography components</P>
          <H2>H2</H2>
          <H3>H3</H3>
          <P>P</P>
          <Small>Small</Small>
        </CardContent>
      </Card>

      <Button
        onPress={() => {
          signOut();
        }}
        label="Sign Out"
      />
    </SafeAreaView>
  );
}
