import { Link, Stack } from 'expo-router';
import AppHeader, { headerOptions } from '@/components/app-header';
import { ThemeToggler } from '@/components/theme-toggler';
import { Screen } from '@/components/screen';
import { Button, H1, View } from '@/components/ui';
import { ErrorState } from '@/components/feedback-states';

export default function Settings() {

  return (
    <Screen>
      <Stack.Screen
        options={headerOptions({
          title: "Settings",
          animation: "ios_from_right",
          animationDuration: 300,
        })}
      />
      <AppHeader showBackButton={true} title="Settings" />
      <ThemeToggler />
      <Link href="/profile/account" asChild>
        <Button label="Account" variant="outline" />
      </Link>
    </Screen>
  );
}
