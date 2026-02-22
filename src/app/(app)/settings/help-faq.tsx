import { Stack } from "expo-router";
import React from "react";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { Card, P, View as UIView } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "How do I start a workout?",
    a: "From the home screen, tap the ready-to-train card or go to Workout to start a session. Complete sets and move through exercises until you finish.",
  },
  {
    q: "Where is my history?",
    a: "Open the History tab to see past sessions. Tap a session to view details and volume.",
  },
  {
    q: "How do I change my plan?",
    a: "Go to Planner and use the Plan screen to edit your split, rotation, or session templates.",
  },
];

export default function HelpFaqSettings(): React.ReactElement {
  const { colors, tokens } = useTheme();

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["bottom", "top"]}
      contentContainerClassName="pb-24"
    >
      <Stack.Screen
        options={headerOptions({
          title: "Help & FAQ",
          animation: "ios_from_right",
          animationDuration: 300,
        })}
      />
      <AppHeader showBackButton title="Help & FAQ" />

      <UIView className="gap-4 px-2 pt-4">
        {FAQ_ITEMS.map((item, index) => (
          <Card key={index} className="gap-2">
            <P
              style={{
                color: colors.foreground,
                fontWeight: tokens.typography.weights.semibold,
                fontSize: tokens.typography.sizes.md,
              }}
            >
              {item.q}
            </P>
            <P
              style={{
                color: colors.mutedForeground,
                fontSize: tokens.typography.sizes.sm,
              }}
            >
              {item.a}
            </P>
          </Card>
        ))}
      </UIView>
    </Screen>
  );
}
