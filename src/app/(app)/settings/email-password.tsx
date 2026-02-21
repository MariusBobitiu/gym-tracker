import { Stack } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { showMessage } from "react-native-flash-message";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { ControlledTextField, FormField } from "@/components/forms";
import { Button, H2, Input, P, View as UIView } from "@/components/ui";
import { requestEmailChange, updatePassword } from "@/lib/auth/auth-api";
import { applyFieldErrors } from "@/lib/auth/auth-errors";
import { useSession } from "@/lib/auth/context";
import {
  type UpdateEmailFormData,
  type UpdatePasswordFormData,
  updateEmailSchema,
  updatePasswordSchema,
} from "@/lib/form-schemas";
import { showQueryError } from "@/lib/query/query-error";
import { useTheme } from "@/lib/theme-context";
import { useZodForm } from "@/lib/use-zod-form";

export default function EmailPasswordSettings(): React.ReactElement {
  const { colors, tokens } = useTheme();
  const { user } = useSession();
  const {
    control: emailControl,
    handleSubmit: handleEmailSubmit,
    setError: setEmailError,
    formState: { isSubmitting: isEmailSubmitting },
    reset: resetEmail,
  } = useZodForm<UpdateEmailFormData>(updateEmailSchema, {
    defaultValues: { newEmail: "" },
  });
  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    setError: setPasswordError,
    formState: { isSubmitting: isPasswordSubmitting },
    reset: resetPassword,
  } = useZodForm<UpdatePasswordFormData>(updatePasswordSchema, {
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const handleEmailUpdate = handleEmailSubmit(async (data) => {
    try {
      const result = await requestEmailChange({
        newEmail: data.newEmail.trim(),
      });
      if (!result.ok) {
        const applied = applyFieldErrors<UpdateEmailFormData>(
          result.error,
          ["newEmail"],
          setEmailError
        );
        if (!applied) showQueryError(result.error);
        return;
      }
      showMessage({
        message: "Verification email sent",
        description: "Check your inbox to confirm the new address.",
        type: "success",
        duration: 3500,
      });
      resetEmail();
    } catch (error) {
      showQueryError(error);
    }
  });

  const handlePasswordUpdate = handlePasswordSubmit(async (data) => {
    try {
      const result = await updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      if (!result.ok) {
        const applied = applyFieldErrors<UpdatePasswordFormData>(
          result.error,
          ["currentPassword", "newPassword", "confirmNewPassword"],
          setPasswordError
        );
        if (!applied) showQueryError(result.error);
        return;
      }
      showMessage({
        message: "Password updated",
        type: "success",
        duration: 3000,
      });
      resetPassword();
    } catch (error) {
      showQueryError(error);
    }
  });

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["bottom", "top"]}
      contentContainerClassName="pb-24"
      keyboardAvoiding
      keyboardOffset={Platform.OS === "ios" ? 10 : 0}
    >
      <Stack.Screen options={headerOptions({ title: "Email & password" })} />
      <AppHeader showBackButton title="Email & password" />

      <H2 className="mt-6">Email</H2>
      <UIView className="gap-4 px-2 pt-4">
        <FormField
          label="Current email"
          helper="Change your email address below."
        >
          <Input
            placeholder="email@example.com"
            editable={false}
            value={user?.email ?? ""}
          />
        </FormField>
        <ControlledTextField
          name="newEmail"
          control={emailControl}
          label="New email"
          helper="We'll send a verification link to your new email."
          placeholder="New email"
          keyboardType="email-address"
          autoCorrect={false}
          autoComplete="email"
        />
        <Button
          label="Send verification email"
          variant="outline"
          onPress={handleEmailUpdate}
          loading={isEmailSubmitting}
          disabled={isEmailSubmitting}
        />
        <P
          style={{
            color: colors.mutedForeground,
            fontSize: tokens.typography.sizes.sm,
          }}
        >
          You will keep using your current email until you confirm the change.
        </P>
      </UIView>
      <H2 className="mt-6">Password</H2>
      <UIView className="gap-4 px-2 pt-4">
        <ControlledTextField
          name="currentPassword"
          control={passwordControl}
          label="Current password"
          placeholder="Current password"
          secureTextEntry
          autoComplete="password"
          autoCorrect={false}
        />
        <ControlledTextField
          name="newPassword"
          control={passwordControl}
          label="New password"
          placeholder="New password"
          secureTextEntry
          autoComplete="password-new"
          autoCorrect={false}
        />
        <ControlledTextField
          name="confirmNewPassword"
          control={passwordControl}
          label="Confirm new password"
          placeholder="Confirm new password"
          secureTextEntry
          autoComplete="password-new"
          autoCorrect={false}
        />
        <Button
          label="Update password"
          variant="outline"
          className="mt-4"
          onPress={handlePasswordUpdate}
          loading={isPasswordSubmitting}
          disabled={isPasswordSubmitting}
        />
      </UIView>
    </Screen>
  );
}
