import React, { useState } from "react";
import { Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  P,
  Text,
} from "@/components/ui";
import { useTheme } from "@/lib/theme-context";
import {
  createTemplateSplit,
  type TemplateId,
} from "@/features/planner/planner-repository";

const TEMPLATE_OPTIONS: {
  id: TemplateId;
  title: string;
  description: string;
}[] = [
  {
    id: "ppl-ab",
    title: "Push / Pull / Legs (A/B)",
    description: "3 sessions per week with A/B variations",
  },
  {
    id: "upper-lower-ab",
    title: "Upper / Lower (A/B)",
    description: "4 sessions per week with distinct A/B weeks",
  },
  {
    id: "full-body-abc",
    title: "Full Body (A/B/C)",
    description: "3 variants, full body each day",
  },
  {
    id: "phul-4d",
    title: "PHUL (4-day)",
    description: "4 sessions per week, power + hypertrophy",
  },
  {
    id: "beginner-full-body-3d",
    title: "Beginner Full Body (3-day)",
    description: "3 sessions per week, beginner friendly",
  },
];

export default function SplitTemplateScreen() {
  const router = useRouter();
  const { colors, tokens } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectTemplate = async (
    templateId: TemplateId
  ): Promise<void> => {
    setIsSubmitting(true);
    try {
      const splitId = await createTemplateSplit(templateId);
      router.replace({
        pathname: "/planner/rotation",
        params: { splitId },
      } as never);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  const handleCustom = (): void => {
    router.push({ pathname: "/planner/split-builder" } as never);
  };

  return (
    <Screen safeAreaEdges={["top", "bottom"]}>
      <Stack.Screen options={headerOptions({ title: "Choose a template" })} />
      <AppHeader title="Choose a template" showBackButton />
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 px-4 pb-4"
        contentContainerStyle={{ paddingBottom: tokens.spacing.xl }}
      >
        <Card
          className="mb-3"
          style={{
            borderStyle: "dashed",
            borderWidth: 1,
            padding: tokens.spacing.xs,
          }}
        >
          <View className="gap-1">
            <Text
              style={{
                fontSize: tokens.typography.sizes.md,
                color: colors.foreground,
                fontWeight: tokens.typography.weights.semibold,
              }}
            >
              Custom
            </Text>
            <Text
              style={{
                fontSize: tokens.typography.sizes.sm,
                color: colors.mutedForeground,
              }}
            >
              Name your split and add sessions per variant (A, B, C).
            </Text>
            <View className="pt-1">
              <Button
                label="Build custom split"
                variant="outline"
                size="sm"
                className="my-0"
                onPress={handleCustom}
                disabled={isSubmitting}
              />
            </View>
          </View>
        </Card>
        <P className="mb-4" style={{ color: colors.mutedForeground }}>
          Or you can start with one of our presets.
        </P>
        {TEMPLATE_OPTIONS.map((opt) => (
          <Pressable
            key={opt.id}
            onPress={() => handleSelectTemplate(opt.id)}
            disabled={isSubmitting}
          >
            <Card className="mb-3">
              <CardHeader>
                <CardTitle>{opt.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Text
                  style={{
                    fontSize: tokens.typography.sizes.sm,
                    color: colors.mutedForeground,
                  }}
                >
                  {opt.description}
                </Text>
              </CardContent>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}
