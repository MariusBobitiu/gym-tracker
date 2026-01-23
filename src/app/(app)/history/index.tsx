import { Stack } from 'expo-router';
import AppHeader, { headerOptions } from '@/components/app-header';
import { Screen } from '@/components/screen';
import { Text, View } from '@/components/ui';
import { LoadingState } from '@/components/feedback-states';

export default function History() {

  return (
    <Screen className="pb-24">
      <Stack.Screen options={headerOptions({ title: 'History' })} />
      <AppHeader showBackButton={false} title="History" isMainScreen />
      <View className='flex-1 justify-center items-center'>
        <LoadingState
          label="Loading History..."
          style={{ marginTop: 48 }}
        />
      </View>
    </Screen>
  );
}
