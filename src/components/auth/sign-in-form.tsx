import * as React from "react";
import { Link } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import type { Control } from "react-hook-form";
import { useTheme } from "@/lib/theme-context";
import type { SignInFormData } from "@/lib/form-schemas";
import { Button, ControlledInput, P, Small, View } from "@/components/ui";

type Props = {
  control: Control<SignInFormData>;
  isSubmitting: boolean;
  onSubmit: () => void;
};

export function SignInForm({
  control,
  isSubmitting,
  onSubmit,
}: Props): React.ReactElement {
  const { colors } = useTheme();

  return (
    <View className="flex-1">
      <View className="mt-16 w-full flex-1">
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
          autoComplete="password"
          autoCorrect={false}
          autoCapitalize="none"
          className="mb-4"
        />
        <Button
          onPress={onSubmit}
          label="Continue"
          loading={isSubmitting}
          disabled={isSubmitting}
          icon={<ChevronRight size={20} />}
          iconPlacement="right"
        />
        <P
          className="mt-4 px-8 text-center"
          style={{ color: colors.mutedForeground, fontSize: 14 }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/(auth)/sign-up"
            style={{ color: colors.primary, fontWeight: "600" }}
          >
            Sign Up
          </Link>
        </P>
      </View>
      <Small
        className="mt-4 px-8 pb-4 text-center"
        style={{ color: colors.mutedForeground }}
      >
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </Small>
    </View>
  );
}
