import React from "react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { useAuth } from "@/lib/auth/context";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { Platform } from "react-native";
import { useZodForm } from "@/lib/use-zod-form";
import { router, Stack } from "expo-router";
import { SignInFormData, signInSchema } from "@/lib/form-schemas";
import { showMessage } from "react-native-flash-message";
import { applyFieldErrors, resolveErrorMessage } from "@/lib/auth/auth-errors";

export default function SignIn() {
  const { signIn } = useAuth();
  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useZodForm<SignInFormData>(signInSchema);
  const onSubmit = handleSubmit(async (data) => {
    try {
      await signIn(data);
      router.replace("/(app)");
    } catch (error) {
      const hasFieldErrors = applyFieldErrors<SignInFormData>(
        error,
        ["email", "password"],
        setError
      );
      if (!hasFieldErrors) {
        showMessage({
          message: resolveErrorMessage(error, "Unable to sign in. Please try again."),
          type: "danger",
          duration: 3500,
        });
      }
    }
  });

  return (
    <Screen preset="scroll" keyboardAvoiding keyboardOffset={Platform.OS === "ios" ? 10 : 0}>
      <Stack.Screen
        options={headerOptions({
          title: "Welcome Back",
          animation: "ios_from_right",
          animationDuration: 250,
        })}
      />
      <AppHeader title="Welcome Back" />
      <SignInForm control={control} isSubmitting={isSubmitting} onSubmit={onSubmit} />
    </Screen>
  );
}
