import { SignUpForm } from "@/components/auth/sign-up-form";
import { useAuth } from "@/lib/auth/context";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { Platform } from "react-native";
import { useZodForm } from "@/lib/use-zod-form";
import { SignUpFormData, signUpSchema } from "@/lib/form-schemas";
import { Stack, router } from "expo-router";
import { showMessage } from "react-native-flash-message";
import { applyFieldErrors, resolveErrorMessage } from "@/lib/auth/auth-errors";
import { register } from "@/lib/auth/auth-api";

export default function SignUp(): JSX.Element {
  const { signIn } = useAuth();
  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useZodForm<SignUpFormData>(signUpSchema);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const result = await register({
        name: data.name,
        username: data.username,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      if (!result.ok) {
        throw result.error;
      }

      await signIn({ email: data.email, password: data.password });
      router.replace("/(app)");
    } catch (error) {
      const hasFieldErrors = applyFieldErrors<SignUpFormData>(
        error,
        ["name", "username", "email", "password", "confirmPassword"],
        setError
      );
      if (!hasFieldErrors) {
        showMessage({
          message: resolveErrorMessage(error, "Unable to sign up. Please try again."),
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
          title: "Create Account",
          animation: "ios_from_right",
          animationDuration: 250,
        })}
      />
      <AppHeader title="Create Account" />
      <SignUpForm control={control} isSubmitting={isSubmitting} onSubmit={onSubmit} />
    </Screen>
  );
}
