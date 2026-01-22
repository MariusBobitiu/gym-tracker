import { Stack } from 'expo-router';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  H2,
  H3,
  P,
  ScrollView,
  Small,
} from '@/components/ui';
import { Buttons } from '@/components/buttons';
import AppHeader, { headerOptions } from '@/components/app-header';
import { Screen } from '@/components/screen';
import { useSession } from '@/lib/auth/context';
import { useTheme } from '@/lib/theme-context';

export default function Home() {
  const { signOut } = useSession();
  const { isDark } = useTheme();
  return (
    <Screen padding="sm" safeAreaEdges={['top', 'bottom']} preset='scroll'>
      <Stack.Screen options={headerOptions({ title: 'Home' })} />
      <AppHeader showBackButton={false} />
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

      <ScrollView className="flex-1 mt-4" contentContainerClassName="flex-1">
        <Buttons />
      </ScrollView>
      <Button
        onPress={() => {
          signOut();
        }}
        label="Sign Out"
        className="mt-4"
      />
    </Screen>
  );
}
