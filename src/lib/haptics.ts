import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export type HapticStyle =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error';

const impactMap: Record<Exclude<HapticStyle, 'success' | 'warning' | 'error'>, Haptics.ImpactFeedbackStyle> =
  {
    light: Haptics.ImpactFeedbackStyle.Light,
    medium: Haptics.ImpactFeedbackStyle.Medium,
    heavy: Haptics.ImpactFeedbackStyle.Heavy,
  };

const notificationMap: Record<'success' | 'warning' | 'error', Haptics.NotificationFeedbackType> =
  {
    success: Haptics.NotificationFeedbackType.Success,
    warning: Haptics.NotificationFeedbackType.Warning,
    error: Haptics.NotificationFeedbackType.Error,
  };

export async function triggerHaptic(style: HapticStyle = 'light') {
  if (Platform.OS === 'web') return;

  try {
    if (style === 'success' || style === 'warning' || style === 'error') {
      await Haptics.notificationAsync(notificationMap[style]);
      return;
    }

    await Haptics.impactAsync(impactMap[style]);
  } catch {
    // Haptics unavailable; no-op
  }
}
