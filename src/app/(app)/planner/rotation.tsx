import React, { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { Button, Card, CardContent, CardHeader, CardTitle, P, Text } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";
import { getSplitIfExists, createOrUpdateCycle } from "@/features/planner/planner-repository";
import { startOfWeekMonday } from "@/features/planner/date-utils";
import { LoadingState } from "@/components/feedback-states";

export default function RotationScreen() {
  const router = useRouter();
  const { colors, tokens } = useTheme();
  const [splitOnly, setSplitOnly] = useState<Awaited<ReturnType<typeof getSplitIfExists>>>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRotation, setSelectedRotation] = useState<string[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getSplitIfExists().then((s) => {
      setSplitOnly(s);
      if (s && s.variants.length > 0) {
        const keys = s.variants.map((v) => v.key);
        setSelectedRotation(keys.length === 1 ? ["A"] : ["A", "B"]);
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async (): Promise<void> => {
    if (!splitOnly || !selectedRotation || selectedRotation.length === 0) return;
    setIsSubmitting(true);
    try {
      const anchorWeekStart = startOfWeekMonday(new Date()).toISOString();
      await createOrUpdateCycle(splitOnly.split.id, selectedRotation, anchorWeekStart);
      router.replace({ pathname: "/planner" } as never);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Screen className="pb-24">
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
      <Screen className="pb-24">
        <Stack.Screen options={headerOptions({ title: "Set rotation" })} />
        <AppHeader title="Set rotation" showBackButton />
        <View className="flex-1 items-center justify-center px-4">
          <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>
            No split found. Create a split first.
          </Text>
          <Button label="Back" variant="outline" className="mt-4" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const variantKeys = splitOnly.variants.map((v) => v.key);

  const options: { label: string; rotation: string[] }[] = [
    { label: "Same every week", rotation: [variantKeys[0] ?? "A"] },
  ];
  if (variantKeys.length >= 2) {
    options.push({ label: "Alternate A/B", rotation: [variantKeys[0], variantKeys[1]] });
  }
  if (variantKeys.length >= 3) {
    options.push({
      label: "Rotate A/B/C",
      rotation: [variantKeys[0], variantKeys[1], variantKeys[2]],
    });
  }

  return (
    <Screen className="pb-24">
      <Stack.Screen options={headerOptions({ title: "Set rotation" })} />
      <AppHeader title="How should this plan repeat?" showBackButton />
      <View className="px-4 py-4">
        <P className="mb-4" style={{ color: colors.mutedForeground }}>
          Choose how weeks repeat (e.g. Week A, then Week B, then A again).
        </P>
        {options.map((opt) => (
          <Pressable
            key={opt.label}
            onPress={() => setSelectedRotation(opt.rotation)}
            disabled={isSubmitting}>
            <Card
              className="mb-3"
              style={{
                borderWidth: 2,
                borderColor:
                  JSON.stringify(selectedRotation) === JSON.stringify(opt.rotation)
                    ? colors.primary
                    : colors.border,
              }}>
              <CardHeader>
                <CardTitle>{opt.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <Text
                  style={{ fontSize: tokens.typography.sizes.sm, color: colors.mutedForeground }}>
                  {opt.rotation.join(" → ")} (repeat)
                </Text>
              </CardContent>
            </Card>
          </Pressable>
        ))}
        <Button
          label="Save"
          className="mt-4 w-full"
          onPress={handleSave}
          disabled={!selectedRotation || isSubmitting}
        />
      </View>
    </Screen>
  );
}
