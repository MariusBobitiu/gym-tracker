import { Text, View } from '@/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

export default function Progress() {
  return (
    <SafeAreaView edges={['top']} className="flex flex-1 bg-white p-4 pb-24">
      <Stack.Screen options={{ title: 'Progress' }} />
      <Text className="text-xl font-bold">Progress</Text>
    </SafeAreaView>
  );
}
