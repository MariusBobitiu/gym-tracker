import { useTheme } from '@/lib/theme-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, View } from '@/components/ui';
import BackHeader from '@/components/ui/back-header';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BackgroundGradient } from '@/components/background-gradient';

export default function Account() {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      edges={['top']}
      className="flex flex-1 p-4 pb-24"
    >
      <BackgroundGradient />
      <BackHeader elements={[
        <Text key="1" style={{ color: colors.foreground }}>Account</Text>,
        <Button
          key="2"
          variant="link"
          size='icon'
          className='p-0'
          style={{
            backgroundColor: colors.card.toString() + '20',
            borderRadius: 100,
            padding: 4,
            width: 36,
            height: 36,
            borderWidth: 1,
            borderColor: colors.border,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.1)',
            elevation: 10,
          }}
          icon={<Ionicons name="pencil" size={20} color={colors.foreground} />}
        />
      ]}/>
    </SafeAreaView>
  );
}
