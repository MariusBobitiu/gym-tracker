import React, { useCallback, useMemo, useState } from "react";
import { Stack } from "expo-router";
import { showMessage } from "react-native-flash-message";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { Button, P, Text, View as UIView } from "@/components/ui";
import { requestVerifyEmail } from "@/lib/auth/auth-api";
import { getEmailVerificationStatus } from "@/lib/auth/email-verification";
import { useSession } from "@/lib/auth/context";
import { showQueryError } from "@/lib/query/query-error";
import { useTheme } from "@/lib/theme-context";

export default function VerifyEmailSettings(): React.ReactElement {
  const { colors, tokens } = useTheme();
  const { user } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const email = user?.email ?? "";
  const verificationStatus = getEmailVerificationStatus(user);
  const isVerified = verificationStatus === "verified";
  const isUnknown = verificationStatus === "unknown";

  const helper = useMemo(() => {
    if (isVerified) {
      return "Your email is verified.";
    }
    if (isUnknown) {
      return "We couldn’t confirm your verification status. You can request a new email just in case.";
    }
    return "Check your inbox and click the verification link to finish setting up your account.";
  }, [isVerified, isUnknown]);

  const handleResend = useCallback(async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      const result = await requestVerifyEmail();
      if (!result.ok) {
        showQueryError(result.error);
        return;
      }
      showMessage({
        message: "Verification email sent",
        description: "Check your inbox to verify your email address.",
        type: "success",
        duration: 3500,
      });
    } catch (error) {
      showQueryError(error);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["bottom", "top"]}
      contentContainerClassName="pb-24"
    >
      <Stack.Screen
        options={headerOptions({
          title: "Verify email",
          animation: "ios_from_right",
          animationDuration: 300,
        })}
      />
      <AppHeader showBackButton title="Verify email" />

      <UIView className="gap-4 px-2 pt-4">
        <Text
          style={{
            color: colors.foreground,
            fontSize: tokens.typography.sizes.lg,
            fontWeight: tokens.typography.weights.semibold,
          }}
        >
          Verify your email
        </Text>
        <P style={{ color: colors.mutedForeground }}>{helper}</P>
        {email.length > 0 && (
          <P style={{ color: colors.foreground, fontWeight: "600" }}>{email}</P>
        )}
        <Button
          label={isVerified ? "Verified" : "Resend verification email"}
          variant={isVerified ? "ghost" : "outline"}
          onPress={handleResend}
          loading={isSubmitting}
          disabled={isSubmitting || isVerified}
        />
      </UIView>
    </Screen>
  );
}
