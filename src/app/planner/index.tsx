import { Text, View } from '@/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useTheme } from '@/lib/theme-context';

export default function Planner() {
  const { colors } = useTheme();
  
  return (
    <SafeAreaView edges={['top']} className="flex flex-1 p-4 pb-24" style={{ backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: 'Planner' }} />
      <Text className="text-xl font-bold">Planner</Text>
    </SafeAreaView>
  );
}
