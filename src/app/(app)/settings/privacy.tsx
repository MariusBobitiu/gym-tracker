import { Stack } from "expo-router";
import React from "react";
import { ScrollView } from "react-native";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { P, View as UIView } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";

const PRIVACY_CONTENT = `
Last updated: 2026-02-12

## Information We Collect

Vixe collects information you provide directly, such as when you create an account (email, password), update your profile, or contact support. We also collect workout data you log in the app, including exercises, sets, reps, and weights.

## How We Use Your Information

We use your information to provide and improve the app, sync your data across devices, and send you workout reminders if you enable them. We do not sell your personal information to third parties.

## Data Storage

Your workout and plan data is stored locally on your device. Account data is stored securely on our servers for authentication and sync.

## Data Sharing

We may share anonymized or aggregated data for analytics. We do not share your personal workout data with third parties for marketing purposes.

## Your Rights

You can access, update, or delete your data through the app. Contact us at support@vixe.app for assistance.

## Contact

For privacy questions: support@vixe.app
`.trim();

export default function PrivacySettings(): React.ReactElement {
  const { colors, tokens } = useTheme();

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["bottom", "top"]}
      contentContainerClassName="pb-24"
    >
      <Stack.Screen
        options={headerOptions({
          title: "Privacy Policy",
          animation: "ios_from_right",
          animationDuration: 300,
        })}
      />
      <AppHeader showBackButton title="Privacy Policy" />

      <ScrollView
        className="px-4 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <UIView className="gap-4">
          {PRIVACY_CONTENT.split("\n\n").map((block, i) => {
            const isHeading = block.startsWith("## ");
            const text = isHeading ? block.replace("## ", "") : block;
            return (
              <P
                key={i}
                style={{
                  color: isHeading ? colors.foreground : colors.mutedForeground,
                  fontWeight: isHeading
                    ? tokens.typography.weights.semibold
                    : tokens.typography.weights.regular,
                  fontSize: isHeading
                    ? tokens.typography.sizes.md
                    : tokens.typography.sizes.sm,
                  lineHeight: 22,
                }}
              >
                {text}
              </P>
            );
          })}
        </UIView>
      </ScrollView>
    </Screen>
  );
}
