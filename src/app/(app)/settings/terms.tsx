import { Stack } from "expo-router";
import React from "react";
import { ScrollView } from "react-native";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { P, View as UIView } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";

const TERMS_CONTENT = `
Last updated: 2026-02-12

## Acceptance of Terms

By using Vixe, you agree to these Terms and Conditions. If you do not agree, do not use the app.

## Use of the App

Vixe is a fitness tracking app. You must be at least 13 years old to use the service. You are responsible for the accuracy of the workout data you enter and for using the app in a lawful manner.

## Account

You must provide accurate information when creating an account. You are responsible for keeping your login credentials secure.

## Subscription and Payments

[Add subscription/payment terms if applicable]

## Intellectual Property

Vixe and its content, features, and functionality are owned by us and are protected by copyright and other intellectual property laws.

## Disclaimers

Vixe is not a medical or fitness advice service. Consult a healthcare professional before starting any workout program. We do not guarantee specific results.

## Limitation of Liability

To the fullest extent permitted by law, Vixe shall not be liable for any indirect, incidental, or consequential damages arising from your use of the app.

## Changes

We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the new terms.

## Contact

For questions: support@vixe.app
`.trim();

export default function TermsSettings(): React.ReactElement {
  const { colors, tokens } = useTheme();

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["bottom", "top"]}
      contentContainerClassName="pb-24"
    >
      <Stack.Screen
        options={headerOptions({
          title: "Terms & Conditions",
          animation: "ios_from_right",
          animationDuration: 300,
        })}
      />
      <AppHeader showBackButton title="Terms & Conditions" />

      <ScrollView
        className="px-4 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <UIView className="gap-4">
          {TERMS_CONTENT.split("\n\n").map((block, i) => {
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
