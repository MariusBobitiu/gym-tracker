import * as React from "react";
import * as AppleAuthentication from "expo-apple-authentication";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/cn";
import { useAppleSignIn } from "@/hooks/use-apple-sign-in";
import { useAppleSignInAvailable } from "@/hooks/use-apple-sign-in-available";
import { P, View } from "@/components/ui";

interface Props {
  className?: string;
}

export function AppleSignInButton({
  className = "",
}: Props): React.ReactElement | null {
  const { colors, isDark, tokens } = useTheme();
  const isAvailable = useAppleSignInAvailable();
  const { isSubmitting, onPress } = useAppleSignIn();

  const buttonStyle = React.useMemo(
    () =>
      isDark
        ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
        : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK,
    [isDark]
  );

  if (!isAvailable) return null;

  return (
    <View className={cn("mt-4", className)}>
      <View className="mb-4 w-full flex-row items-center justify-center px-16">
        <View
          className="h-px w-1/2"
          style={{ backgroundColor: colors.foreground, opacity: 0.2 }}
        />
        <P
          className="z-10 px-4 text-center"
          style={{ color: colors.mutedForeground, fontWeight: "600" }}
        >
          or
        </P>
        <View
          className="h-px w-1/2"
          style={{ backgroundColor: colors.foreground, opacity: 0.2 }}
        />
      </View>
      <View
        className="w-full"
        style={{ borderRadius: tokens.radius.pill, overflow: "hidden" }}
      >
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={buttonStyle}
          onPress={onPress}
          style={{
            width: "100%",
            height: 56,
            opacity: isSubmitting ? 0.8 : 1,
          }}
          accessibilityLabel="Continue with Apple"
        />
      </View>
    </View>
  );
}
