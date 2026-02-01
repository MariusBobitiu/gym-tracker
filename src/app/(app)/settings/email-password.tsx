import { Stack } from "expo-router";
import React from "react";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { FormField } from "@/components/forms";
import { Button, H2, Input, P, View as UIView } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";

export default function EmailPasswordSettings(): React.ReactElement {
  const { colors, tokens } = useTheme();

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["bottom", "top"]}
      contentContainerClassName="pb-24"
    >
      <Stack.Screen options={headerOptions({ title: "Email & password" })} />
      <AppHeader showBackButton title="Email & password" />

      <H2 className="mt-6">Email</H2>
      <UIView className="gap-4 px-2 pt-4">
        <FormField
          label="Current email"
          helper="Change your email address below."
        >
          <Input placeholder="email@example.com" editable={false} />
        </FormField>
        <FormField
          label="New email"
          helper="We'll send a verification link to your new email."
        >
          <Input
            placeholder="New email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </FormField>
        <Button label="Send verification email" variant="outline" />
      </UIView>
      <H2 className="mt-6">Password</H2>
      <UIView className="gap-4 px-2 pt-4">
        <FormField label="Current password">
          <Input placeholder="Current password" secureTextEntry />
        </FormField>
        <FormField label="New password" className="mt-2">
          <Input placeholder="New password" secureTextEntry />
        </FormField>
        <FormField label="Confirm new password" className="mt-2">
          <Input placeholder="Confirm new password" secureTextEntry />
        </FormField>
        <Button label="Update password" variant="outline" className="mt-4" />

        <P
          className="mt-4"
          style={{
            color: colors.mutedForeground,
            fontSize: tokens.typography.sizes.sm,
          }}
        >
          Password change and email update will be available once connected to
          your backend.
        </P>
      </UIView>
    </Screen>
  );
}
