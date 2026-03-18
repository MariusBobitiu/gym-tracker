import React from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { showMessage } from "react-native-flash-message";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { Button, ControlledInput, P, View } from "@/components/ui";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/form-schemas";
import { requestPasswordReset } from "@/lib/auth/auth-api";
import { useTheme } from "@/lib/theme-context";
import { useZodForm } from "@/lib/use-zod-form";

export default function ForgotPassword(): React.ReactElement {
  const { colors, tokens } = useTheme();
  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { isSubmitting },
  } = useZodForm<ForgotPasswordFormData>(forgotPasswordSchema);

  const onSubmit = handleSubmit(async ({ email }) => {
    const result = await requestPasswordReset({ email });

    if (!result.ok) {
      const message =
        result.status === 400
          ? "Enter a valid email address to reset your password."
          : "We couldn't send the reset email right now. Please try again.";
      setError("email", {
        type: "server",
        message,
      });
      return;
    }

    reset({ email });
    showMessage({
      message: "Check your email",
      description:
        "If an account with that email exists, you should receive a password reset link shortly.",
      type: "success",
      duration: 4000,
    });
  });

  return (
    <Screen
      preset="scroll"
      keyboardAvoiding
      keyboardOffset={Platform.OS === "ios" ? 10 : 0}
    >
      <Stack.Screen
        options={headerOptions({
          title: "Reset Password",
          animation: "ios_from_right",
          animationDuration: 250,
        })}
      />
      <AppHeader title="Reset Password" />
      <View className="mt-10 flex-1">
        <P
          className="mb-6 px-1"
          style={{
            color: colors.mutedForeground,
            fontSize: tokens.typography.sizes.md,
          }}
        >
          Enter the email linked to your account and we&apos;ll send you a
          secure link to reset your password.
        </P>
        <ControlledInput
          name="email"
          control={control}
          label="Email"
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          className="mb-4"
        />
        <Button
          onPress={onSubmit}
          label="Send reset link"
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      </View>
    </Screen>
  );
}
