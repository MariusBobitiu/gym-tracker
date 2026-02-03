import * as React from "react";
import { router } from "expo-router";
import { showMessage } from "react-native-flash-message";
import { useAuth } from "@/lib/auth/context";
import { resolveErrorMessage } from "@/lib/auth/auth-errors";
import { isAppleAuthCanceled, signInWithApple } from "@/lib/auth/apple-auth";

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
      await signIn({ user: session.user, token: session.token });
      router.replace("/(app)");
    } catch (error) {
      if (isAppleAuthCanceled(error)) return;
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
