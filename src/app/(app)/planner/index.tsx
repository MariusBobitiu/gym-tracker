import { Stack } from 'expo-router';
import AppHeader, { headerOptions } from '@/components/app-header';
import { Screen } from '@/components/screen';
import { Text } from '@/components/ui';

export default function Planner() {
  return (
    <Screen className="pb-24">
      <Stack.Screen options={headerOptions({ title: 'Planner' })} />
      <AppHeader showBackButton={false} title="Planner" isMainScreen />
    </Screen>
  );
}
