import React, { useEffect, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
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
  getSplitIfExists,
  getSplitBySplitId,
  createOrUpdateCycle,
  type RotationType,
} from "@/features/planner/planner-repository";
import { startOfWeekMonday } from "@/features/planner/date-utils";
import { LoadingState } from "@/components/feedback-states";

export default function RotationScreen() {
  const router = useRouter();
  const { splitId } = useLocalSearchParams<{ splitId?: string }>();
  const { colors, tokens } = useTheme();
  const [splitOnly, setSplitOnly] =
    useState<Awaited<ReturnType<typeof getSplitIfExists>>>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRotationType, setSelectedRotationType] =
    useState<RotationType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const resolvedSplitId = Array.isArray(splitId) ? splitId[0] : splitId;
    const loadSplit = async (): Promise<void> => {
      const split = resolvedSplitId
        ? await getSplitBySplitId(resolvedSplitId)
        : await getSplitIfExists();
      if (!isMounted) return;
      setSplitOnly(split);
      if (split && split.variants.length > 0) {
        setSelectedRotationType(
          split.variants.length === 1 ? "SAME_EVERY_WEEK" : "ALTERNATE_AB"
        );
      }
      setLoading(false);
    };
    loadSplit().catch((error) => {
      console.error(error);
      if (isMounted) setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [splitId]);

  const handleSave = async (): Promise<void> => {
    if (!splitOnly || !selectedRotationType) return;
    setIsSubmitting(true);
    try {
      const anchorWeekStart = startOfWeekMonday(new Date()).toISOString();
      await createOrUpdateCycle(
        splitOnly.split.id,
        selectedRotationType,
        anchorWeekStart
      );
      router.replace({ pathname: "/planner/plan/summary" } as never);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Screen
        contentContainerClassName="pb-12"
        safeAreaEdges={["top", "bottom"]}
      >
        <Stack.Screen options={headerOptions({ title: "Set rotation" })} />
        <AppHeader title="Set rotation" showBackButton />
        <View className="flex-1 items-center justify-center">
          <LoadingState label="Loading..." />
        </View>
      </Screen>
    );
  }

  if (!splitOnly) {
    return (
      <Screen
        contentContainerClassName="pb-12"
        safeAreaEdges={["top", "bottom"]}
      >
        <Stack.Screen options={headerOptions({ title: "Set rotation" })} />
        <AppHeader title="Set rotation" showBackButton />
        <View className="flex-1 items-center justify-center px-4">
          <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>
            No split found. Create a split first.
          </Text>
          <Button
            label="Back"
            variant="outline"
            className="mt-4"
            onPress={() => router.back()}
          />
        </View>
      </Screen>
    );
  }

  const options: { label: string; rotationType: RotationType }[] = [
    { label: "Same every week", rotationType: "SAME_EVERY_WEEK" },
  ];
  if (splitOnly.variants.length >= 2) {
    options.push({ label: "Alternate A/B", rotationType: "ALTERNATE_AB" });
  }
  if (splitOnly.variants.length >= 3) {
    options.push({ label: "Rotate A/B/C", rotationType: "ALTERNATE_AB" });
  }

  return (
    <Screen contentContainerClassName="pb-12" safeAreaEdges={["top", "bottom"]}>
      <Stack.Screen options={headerOptions({ title: "Set rotation" })} />
      <AppHeader title="How should this plan repeat?" showBackButton />
      <View className="px-4 py-4">
        <P className="mb-4" style={{ color: colors.mutedForeground }}>
          Choose how weeks repeat (e.g. Week A, then Week B, then A again).
        </P>
        {options.map((opt) => (
          <Pressable
            key={opt.label}
            onPress={() => setSelectedRotationType(opt.rotationType)}
            disabled={isSubmitting}
          >
            <Card
              className="mb-3"
              style={{
                borderWidth: 2,
                borderColor:
                  selectedRotationType === opt.rotationType
                    ? colors.primary
                    : colors.border,
              }}
            >
              <CardHeader>
                <CardTitle>{opt.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <Text
                  style={{
                    fontSize: tokens.typography.sizes.sm,
                    color: colors.mutedForeground,
                  }}
                >
                  {opt.rotationType === "SAME_EVERY_WEEK"
                    ? "Same variant each time"
                    : "Alternate variants (A → B → A…)"}
                </Text>
              </CardContent>
            </Card>
          </Pressable>
        ))}
        <Button
          label="Save"
          className="mt-4 w-full"
          onPress={handleSave}
          disabled={!selectedRotationType || isSubmitting}
        />
      </View>
    </Screen>
  );
}
