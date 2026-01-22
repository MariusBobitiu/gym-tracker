import { Link, Stack } from 'expo-router';
import AppHeader, { headerOptions } from '@/components/app-header';
import { ThemeToggler } from '@/components/theme-toggler';
import { Screen } from '@/components/screen';
import { Button, H1 } from '@/components/ui';

export default function Profile() {

  return (
    <Screen className="pb-24">
      <Stack.Screen options={headerOptions({ title: 'Profile' })} />
      <AppHeader showBackButton={false} />
      <H1>Profile</H1>
      <ThemeToggler />
      <Link href="/profile/account" asChild>
        <Button label="Account" variant="outline" />
      </Link>
    </Screen>
  );
}
