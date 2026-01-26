import { Button, ControlledInput, View, P, Small } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { Platform } from "react-native";
import { useZodForm } from "@/lib/use-zod-form";
import { useTheme } from "@/lib/theme-context";
import { Link, router, Stack } from "expo-router";
import { SignInFormData, signInSchema } from "@/lib/form-schemas";
import { ChevronRight } from "lucide-react-native";

export default function SignIn() {
  const { signIn } = useAuth();
  const { control, handleSubmit } = useZodForm<SignInFormData>(signInSchema);
  const { colors } = useTheme();

  const onSubmit = async () => {
    try {
      console.log("Signing in demo user...");
      await signIn({
        user: { id: "demo-user" },
        token: { access: "demo-token", refresh: "demo-token" },
      });

      router.replace("/(app)");
    } catch (error) {
      console.error("Sign-in failed:", error);
    }
  };

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
            autoComplete="password-new"
            autoCorrect={false}
            autoCapitalize="none"
            className="mb-4"
          />
          <Button
            onPress={onSubmit}
            label="Continue"
            icon={<ChevronRight size={20} />}
            iconPlacement="right"
          />
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
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </Small>
      </View>
    </Screen>
  );
}
