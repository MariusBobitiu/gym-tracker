import * as React from "react";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { Text, View } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/cn";

/**
 * Minimal banner shown when user is signed in but offline (signedInOffline).
 * Message: "Offline — changes will sync later". Does not block navigation or local use.
 */
export function OfflineBanner(): React.ReactElement | null {
  const { connectionStatus } = useAuth();
  const { colors } = useTheme();

  if (connectionStatus !== "signedInOffline") return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOutUp.duration(150)}
      className={cn("px-4 py-2")}
      style={{ backgroundColor: colors.card }}
    >
      <View className="flex-row items-center justify-center gap-2">
        <Text className="text-sm text-muted-foreground">
          Offline — changes will sync later
        </Text>
      </View>
    </Animated.View>
  );
}
