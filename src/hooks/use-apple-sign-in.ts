import * as React from "react";
import { router } from "expo-router";
import { showMessage } from "react-native-flash-message";
import { useAuth } from "@/lib/auth/context";
import { resolveErrorMessage } from "@/lib/auth/auth-errors";
import { isAppleAuthCanceled, signInWithApple } from "@/lib/auth/apple-auth";
import { getErrorDetails, logError } from "@/lib/app-logger";

type UseAppleSignInResult = {
  isSubmitting: boolean;
  onPress: () => Promise<void>;
};

export function useAppleSignIn(): UseAppleSignInResult {
  const { signIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onPress = React.useCallback(async (): Promise<void> => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const session = await signInWithApple();
      if (!session.token || !session.user) {
        throw new Error("Invalid session data received from Apple Sign-In.");
      }
      await signIn({ user: session.user, token: session.token });
      router.replace("/(app)");
    } catch (error) {
      if (isAppleAuthCanceled(error)) {
        return;
      }
      logError({
        scope: "auth.apple",
        message: "sign-in failed",
        data: getErrorDetails(error),
      });
      showMessage({
        message: resolveErrorMessage(
          error,
          "Unable to sign in with Apple. Please try again."
        ),
        type: "danger",
        duration: 3500,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, signIn]);

  return { isSubmitting, onPress };
}
