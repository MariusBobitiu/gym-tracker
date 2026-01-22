import { Text } from '@/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { BackgroundGradient } from '@/components/background-gradient';

export default function Planner() {
  return (
    <SafeAreaView edges={['top']} className="flex flex-1 p-4 pb-24">
      <BackgroundGradient />
      <Stack.Screen options={{ title: 'Planner' }} />
      <Text className="text-xl font-bold">Planner</Text>
    </SafeAreaView>
  );
}
