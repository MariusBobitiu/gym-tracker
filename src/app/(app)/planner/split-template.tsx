import React, { useState } from "react";
import { Stack, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { Button, Card, CardContent, CardHeader, CardTitle, P, Text } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";
import {
  createTemplateSplit,
  createOrUpdateCycle,
  type TemplateId,
} from "@/features/planner/planner-repository";
import { startOfWeekMonday } from "@/features/planner/date-utils";

const TEMPLATE_OPTIONS: { id: TemplateId; title: string; description: string }[] = [
  {
    id: "ppl-ab",
    title: "Push / Pull / Legs (A/B)",
    description: "3 sessions per week, alternating A and B",
  },
  {
    id: "upper-lower-ab",
    title: "Upper / Lower (A/B)",
    description: "4 sessions per week, upper/lower split",
  },
  {
    id: "full-body-abc",
    title: "Full Body (A/B/C)",
    description: "3 variants, full body each day",
  },
];

export default function SplitTemplateScreen() {
  const router = useRouter();
  const { colors, tokens } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectTemplate = async (templateId: TemplateId): Promise<void> => {
    setIsSubmitting(true);
    try {
      const splitId = await createTemplateSplit(templateId);
      const anchorWeekStart = startOfWeekMonday(new Date()).toISOString();
      const rotation = templateId === "full-body-abc" ? ["A", "B", "C"] : ["A", "B"];
      await createOrUpdateCycle(splitId, rotation, anchorWeekStart);
      router.replace({ pathname: "/planner" } as never);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  const handleCustom = (): void => {
    router.push({ pathname: "/planner/split-builder" } as never);
  };

  return (
    <Screen className="pb-24">
      <Stack.Screen options={headerOptions({ title: "Choose a template" })} />
      <AppHeader title="Choose a template" showBackButton />
      <View className="px-4 py-4">
        <P className="mb-4" style={{ color: colors.mutedForeground }}>
          Start with a preset or build your own.
        </P>
        {TEMPLATE_OPTIONS.map((opt) => (
          <Pressable
            key={opt.id}
            onPress={() => handleSelectTemplate(opt.id)}
            disabled={isSubmitting}>
            <Card className="mb-3">
              <CardHeader>
                <CardTitle>{opt.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Text
                  style={{ fontSize: tokens.typography.sizes.sm, color: colors.mutedForeground }}>
                  {opt.description}
                </Text>
              </CardContent>
            </Card>
          </Pressable>
        ))}
        <Card className="mb-3" style={{ borderStyle: "dashed", borderWidth: 2 }}>
          <CardHeader>
            <CardTitle>Custom</CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={{ fontSize: tokens.typography.sizes.sm, color: colors.mutedForeground }}>
              Name your split and add sessions per variant (A, B, C).
            </Text>
          </CardContent>
          <View className="pb-2">
            <Button
              label="Build custom split"
              variant="outline"
              onPress={handleCustom}
              disabled={isSubmitting}
            />
          </View>
        </Card>
      </View>
    </Screen>
  );
}
