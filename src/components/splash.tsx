import { SplashScreen } from 'expo-router';
import { useSession } from '@/lib/auth/context';

SplashScreen.preventAutoHideAsync();

export function SplashScreenController() {
  const { status } = useSession();
  const isLoading = status === 'loading';

  if (!isLoading) {
    SplashScreen.hide();
  }

  return null;
}
