import { Text, View } from '@/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Stack, useLocalSearchParams } from 'expo-router';

export default function Details() {
  const { name } = useLocalSearchParams();

  return (
    <SafeAreaView edges={['top']} className={styles.container}>
      <Stack.Screen options={{ title: 'Details' }} />
      <Text className={styles.title}>{`Showing details for user ${name}`}</Text>
    </SafeAreaView>
  );
}

const styles = {
  container: 'flex flex-1 bg-white',
  title: 'text-xl font-bold',
};
