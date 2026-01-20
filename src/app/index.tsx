import { Stack, router } from 'expo-router';

import { Button, Text, View } from '@/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
  return (
    <SafeAreaView edges={['top']} className={styles.container}>
      <Stack.Screen options={{ title: 'Home' }} />
      <Text className={styles.title}>Home</Text>
      <Button label="Go to Details" onPress={() => router.push('/details')}>
        <Text>Go to Details</Text>
      </Button>
    </SafeAreaView>
  );
}

const styles = {
  container: 'flex flex-1 bg-white',
  content: 'flex-1 items-center justify-center',
  title: 'text-xl font-bold',
};
