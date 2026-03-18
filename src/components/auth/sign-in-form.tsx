import * as React from "react";
import { Link } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import type { Control } from "react-hook-form";
import * as WebBrowser from "expo-web-browser";
import { showMessage } from "react-native-flash-message";
import { useTheme } from "@/lib/theme-context";
import type { SignInFormData } from "@/lib/form-schemas";
import { Button, ControlledInput, P, Small, View } from "@/components/ui";
import { resolveLegalUrl } from "@/lib/legal-links";

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
  const termsUrl = resolveLegalUrl("/terms");
  const privacyUrl = resolveLegalUrl("/privacy");

  const openLegalUrl = React.useCallback(
    async (url: string | null, label: string): Promise<void> => {
      if (!url) {
        showMessage({
          message: "Missing legal URL",
          description: "Set EXPO_PUBLIC_SITE_URL in .env to open legal pages.",
          type: "danger",
          duration: 3500,
        });
        return;
      }

      try {
        await WebBrowser.openBrowserAsync(url, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
          showTitle: true,
          enableBarCollapsing: true,
          toolbarColor: colors.background,
          controlsColor: colors.foreground,
        });
      } catch (error) {
        console.warn("[legal] openBrowserAsync failed", error);
        showMessage({
          message: `Unable to open ${label}`,
          type: "danger",
          duration: 3000,
        });
      }
    },
    [colors.background, colors.foreground]
  );

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
        />
        <Link href="/(auth)/forgot-password" asChild>
          <Button
            variant="link"
            label="Forgot password?"
            className="self-end px-0"
            size="sm"
          />
        </Link>
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
          style={{ color: colors.mutedForeground, fontSize: 16 }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/(auth)/sign-up"
            style={{ color: colors.primary, fontWeight: "600", fontSize: 16 }}
          >
            Sign Up
          </Link>
        </P>
      </View>
      <Small
        className="mt-4 px-8 pb-4 text-center"
        style={{ color: colors.mutedForeground, fontSize: 14 }}
      >
        By signing in, you agree to our{" "}
        <Small
          suppressHighlighting
          style={{ color: colors.primary, fontSize: 14, fontWeight: "600" }}
          onPress={() => void openLegalUrl(termsUrl, "Terms of Service")}
          accessibilityRole="link"
        >
          Terms of Service
        </Small>{" "}
        and{" "}
        <Small
          suppressHighlighting
          style={{ color: colors.primary, fontSize: 14, fontWeight: "600" }}
          onPress={() => void openLegalUrl(privacyUrl, "Privacy Policy")}
          accessibilityRole="link"
        >
          Privacy Policy
        </Small>
        .
      </Small>
    </View>
  );
}
