import { Stack } from "expo-router";
import React from "react";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { P, View as UIView } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";

export default function AppleHealthSettings(): React.ReactElement {
  const { colors, tokens } = useTheme();

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["bottom", "top"]}
      contentContainerClassName="pb-24"
    >
      <Stack.Screen options={headerOptions({ title: "Apple Health" })} />
      <AppHeader showBackButton title="Apple Health" />

      <UIView className="gap-3 px-2 pt-4">
        <P
          style={{
            color: colors.foreground,
            fontSize: tokens.typography.sizes.lg,
          }}
        >
          Coming soon
        </P>
        <P
          style={{
            color: colors.mutedForeground,
            fontSize: tokens.typography.sizes.sm,
          }}
        >
          Sync workouts and heart rate with Apple Health. This feature is not
          available yet.
        </P>
      </UIView>
    </Screen>
  );
}
