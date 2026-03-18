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

function isInvalidCredentialsError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const statusCode =
    "statusCode" in error
      ? (error as { statusCode?: unknown }).statusCode
      : null;
  const message =
    "message" in error ? (error as { message?: unknown }).message : null;

  return (
    statusCode === 401 ||
    (typeof message === "string" &&
      message.toLowerCase().includes("invalid credentials"))
  );
}

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
      if (!hasFieldErrors && isInvalidCredentialsError(error)) {
        setError("password", {
          type: "server",
          message: "Incorrect email or password. Please try again.",
        });
        return;
      }
      if (!hasFieldErrors) {
        showMessage({
          message: resolveErrorMessage(
            error,
            "Unable to sign in. Please try again."
          ),
          type: "danger",
          duration: 3500,
        });
      }
    }
  });

  return (
    <Screen
      preset="scroll"
      keyboardAvoiding
      keyboardOffset={Platform.OS === "ios" ? 10 : 0}
    >
      <Stack.Screen
        options={headerOptions({
          title: "Welcome Back",
          animation: "ios_from_right",
          animationDuration: 250,
        })}
      />
      <AppHeader title="Welcome Back" />
      <SignInForm
        control={control}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
      />
    </Screen>
  );
}
