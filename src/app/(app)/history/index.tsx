import { Stack } from 'expo-router';
import AppHeader, { headerOptions } from '@/components/app-header';
import { Screen } from '@/components/screen';
import { Text } from '@/components/ui';

export default function History() {

  return (
    <Screen className="pb-24">
      <Stack.Screen options={headerOptions({ title: 'History' })} />
      <AppHeader showBackButton={false} />
      <Text className="text-xl font-bold">History</Text>
    </Screen>
  );
}
