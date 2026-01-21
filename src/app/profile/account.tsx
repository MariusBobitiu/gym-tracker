import { useTheme } from '@/lib/theme-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';

export default function Account() {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      edges={['top']}
      className="flex flex-1 p-4 pb-24"
      style={{ backgroundColor: colors.background }}
    >
			<Text>Account</Text>
    </SafeAreaView>
  );
}
