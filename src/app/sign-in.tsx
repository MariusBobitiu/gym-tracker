
import { View } from 'react-native';

import { Button } from '@/components/ui';
import { useSession } from '@/lib/auth/context';
import { BackgroundGradient } from '@/components/background-gradient';

export default function SignIn() {
  const { signIn } = useSession();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <BackgroundGradient />
      <Button
        onPress={() => {
          signIn();
        }}
        label="Sign In"
      />
    </View>
  );
}
