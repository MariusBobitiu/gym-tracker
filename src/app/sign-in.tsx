
import { View } from 'react-native';

import { Button } from '@/components/ui';
import { useSession } from '@/lib/auth/context';

export default function SignIn() {
  const { signIn } = useSession();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button
        onPress={() => {
          signIn();
        }}
        label="Sign In"
      />
    </View>
  );
}
