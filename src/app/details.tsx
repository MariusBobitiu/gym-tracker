import { Button, Text, View } from '@/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import Entypo from '@expo/vector-icons/Entypo';

import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Buttons } from '@/components/buttons';

export default function Details() {
  const { name } = useLocalSearchParams();

  return (
    <SafeAreaView edges={['top']} className={`${styles.container} pb-24`}>
      <View className="flex-row">
        <Button label="Go back" onPress={() => router.back()} variant='link' icon={<Entypo name="chevron-left" size={24} color="black" />} className='p-0' />
      </View>
      <Text className={styles.title}>{`Showing details for user ${name}`}</Text>
      <Buttons />
    </SafeAreaView>
  );
}

const styles = {
  container: 'flex flex-1 bg-white p-4',
  title: 'text-xl font-bold',
};
