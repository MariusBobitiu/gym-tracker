import { Stack } from 'expo-router';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, H1, H2, H3, P, Small } from '@/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '@/lib/auth/context';
import { BackgroundGradient } from '@/components/background-gradient';
import { useTheme } from '@/lib/theme-context';

export default function Home() {
  const { signOut } = useSession();
  const { isDark } = useTheme();
  return (
    <SafeAreaView
      edges={['top']}
      className="flex flex-1 p-2 pb-24"
    >
      <BackgroundGradient />
      <Stack.Screen options={{ title: 'Home' }} />
      <H1 className='mb-4'>Home</H1>
      <Card className={`${isDark ? 'shadow-[0_0_10px_0_rgba(0,0,0,0.8)]' : 'shadow-[0_0_5px_0_rgba(0,0,0,0.15)]'}`}>
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
        className='mt-4'
      />
    </SafeAreaView>
  );
}
