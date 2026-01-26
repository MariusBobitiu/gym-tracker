import { Button, ControlledInput, View, P, Small } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { Platform } from "react-native";
import { useZodForm } from "@/lib/use-zod-form";
import { SignUpFormData, signUpSchema } from "@/lib/form-schemas";
import { useTheme } from "@/lib/theme-context";
import { Link, Stack } from "expo-router";

export default function SignUp() {
  const { signIn } = useAuth();
  const { control, handleSubmit } = useZodForm<SignUpFormData>(signUpSchema);
  const { colors } = useTheme();

  const onSubmit = handleSubmit(function handleFormSubmit(data) {
    return signIn(data);
  });

  return (
    <Screen preset="scroll" keyboardAvoiding keyboardOffset={Platform.OS === "ios" ? 10 : 0}>
      <Stack.Screen
        options={headerOptions({
          title: "Create Account",
          animation: "ios_from_right",
          animationDuration: 250,
        })}
      />
      <AppHeader title="Create Account" />
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
          <Button onPress={onSubmit} label="Continue" />
          <P
            className="mt-4 px-8 text-center"
            style={{ color: colors.mutedForeground, fontSize: 14 }}>
            Already have an account?{" "}
            <Link href="/(auth)/sign-in" style={{ color: colors.primary, fontWeight: "600" }}>
              Sign In
            </Link>
          </P>
        </View>
        <Small className="mt-4 px-8 pb-4 text-center" style={{ color: colors.mutedForeground }}>
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </Small>
      </View>
    </Screen>
  );
}
