import * as React from "react";
import { Link } from "expo-router";
import type { Control } from "react-hook-form";
import { useTheme } from "@/lib/theme-context";
import type { SignUpFormData } from "@/lib/form-schemas";
import { Button, ControlledInput, P, Small, View } from "@/components/ui";

type Props = {
  control: Control<SignUpFormData>;
  isSubmitting: boolean;
  onSubmit: () => void;
};

export function SignUpForm({
  control,
  isSubmitting,
  onSubmit,
}: Props): React.ReactElement {
  const { colors } = useTheme();

  return (
    <View className="flex-1">
      <View className="mt-6 w-full">
        <ControlledInput
          name="name"
          control={control}
          label="Full Name"
          placeholder="Enter your full name"
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="name"
          className="mb-4"
        />
        <ControlledInput
          name="username"
          control={control}
          label="Username"
          placeholder="Enter your username"
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          className="mb-4"
        />
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
        <ControlledInput
          name="password"
          control={control}
          label="Password"
          placeholder="Enter your password"
          secureTextEntry
          autoComplete="password-new"
          autoCorrect={false}
          autoCapitalize="none"
          className="mb-4"
        />
        <ControlledInput
          name="confirmPassword"
          control={control}
          label="Confirm Password"
          placeholder="Re-enter your password"
          secureTextEntry
          autoComplete="password-new"
          autoCorrect={false}
          autoCapitalize="none"
          className="mb-6"
        />
        <Button
          onPress={onSubmit}
          label="Continue"
          loading={isSubmitting}
          disabled={isSubmitting}
        />
        <P
          className="mt-4 px-8 text-center"
          style={{ color: colors.mutedForeground, fontSize: 14 }}
        >
          Already have an account?{" "}
          <Link
            href="/(auth)/sign-in"
            style={{ color: colors.primary, fontWeight: "600" }}
          >
            Sign In
          </Link>
        </P>
      </View>
      <Small
        className="mt-4 px-8 pb-4 text-center"
        style={{ color: colors.mutedForeground }}
      >
        By signing up, you agree to our Terms of Service and Privacy Policy.
      </Small>
    </View>
  );
}
