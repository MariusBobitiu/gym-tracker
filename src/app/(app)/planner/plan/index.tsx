import React, { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { View } from "react-native";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { Button, Card, CardContent, CardHeader, CardTitle, P, Text } from "@/components/ui";
import { Modal, useModal } from "@/components/ui/modal";
import { useTheme } from "@/lib/theme-context";
import {
  getActivePlan,
  getSplitIfExists,
  resetPlan,
  parseRotation,
} from "@/features/planner/planner-repository";
import { resetRotationPointer } from "@/features/planner/rotation-state";
import { LoadingState } from "@/components/feedback-states";

export default function PlanScreen() {
  const router = useRouter();
  const { colors, tokens } = useTheme();
  const [plan, setPlan] = useState<Awaited<ReturnType<typeof getActivePlan>>>(null);
  const [splitOnly, setSplitOnly] = useState<Awaited<ReturnType<typeof getSplitIfExists>>>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const resetModal = useModal();

  const load = async (): Promise<void> => {
    setLoading(true);
    const [p, s] = await Promise.all([getActivePlan(), getSplitIfExists()]);
    setPlan(p);
    setSplitOnly(s);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleReset = async (): Promise<void> => {
    resetModal.dismiss();
    setResetting(true);
    try {
      await resetPlan();
      try {
        resetRotationPointer();
      } catch (e) {
        console.warn("resetRotationPointer:", e);
      }
      router.replace({ pathname: "/planner" } as never);
    } catch (e) {
      console.error(e);
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <Screen safeAreaEdges={["top", "bottom"]} contentContainerClassName="pb-12">
        <Stack.Screen
          options={headerOptions({
            title: "Manage plan",
            animation: "ios_from_right",
            animationDuration: 380,
          })}
        />
        <AppHeader title="Manage plan" showBackButton />
        <View className="flex-1 items-center justify-center">
          <LoadingState label="Loading..." />
        </View>
      </Screen>
    );
  }

  const displaySplit = plan?.split ?? splitOnly?.split ?? null;
  const rotation = plan?.cycle ? parseRotation(plan.cycle.rotation) : [];
  const variantKeys =
    plan?.variants.map((v) => v.key) ?? splitOnly?.variants.map((v) => v.key) ?? [];

  return (
    <Screen safeAreaEdges={["top", "bottom"]} contentContainerClassName="pb-12" preset="scroll">
      <Stack.Screen options={headerOptions({ title: "Manage plan" })} />
      <AppHeader title="Manage plan" showBackButton />
      <View className="px-4 py-4">
        {displaySplit ? (
          <>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>{displaySplit.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Text
                  style={{ fontSize: tokens.typography.sizes.sm, color: colors.mutedForeground }}>
                  Variants: {variantKeys.join(", ")}
                </Text>
                {rotation.length > 0 && (
                  <View className="mt-2 flex-row flex-wrap gap-2">
                    {rotation.map((key, i) => (
                      <View
                        key={`${key}-${i}`}
                        className="rounded-full px-3 py-1"
                        style={{ backgroundColor: colors.muted }}>
                        <Text
                          style={{
                            fontSize: tokens.typography.sizes.sm,
                            color: colors.foreground,
                          }}>
                          {key}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </CardContent>
            </Card>

            <View className="gap-3">
              <Button
                label="Change split"
                variant="outline"
                onPress={() => router.push({ pathname: "/planner/split-template" } as never)}
              />
              <Button
                label="Edit split"
                variant="outline"
                onPress={() => router.push({ pathname: "/planner/split-builder" } as never)}
              />
              <Button
                label="Edit rotation"
                variant="outline"
                onPress={() => router.push({ pathname: "/planner/rotation" } as never)}
              />
              <Button
                label="Reset plan"
                variant="outline"
                onPress={() => resetModal.present()}
                disabled={resetting}
                style={{ borderColor: colors.destructive }}
              />
            </View>
          </>
        ) : (
          <View className="flex-1 items-center justify-center py-8">
            <P style={{ color: colors.mutedForeground, textAlign: "center" }}>
              No plan yet. Create a split from the Planner.
            </P>
            <Button
              label="Back to Planner"
              variant="outline"
              className="mt-4"
              onPress={() => router.back()}
            />
          </View>
        )}
      </View>

      <Modal ref={resetModal.ref} snapPoints={["35%"]} title="Reset plan?">
        <View className="px-4 pb-8">
          <P className="mb-4" style={{ color: colors.mutedForeground }}>
            This will delete your current split and rotation. You can create a new plan afterward.
          </P>
          <Button
            label="Reset plan"
            variant="destructive"
            onPress={handleReset}
            disabled={resetting}
          />
          <Button
            label="Cancel"
            variant="outline"
            onPress={() => resetModal.dismiss()}
            className="mb-2"
          />
        </View>
      </Modal>
    </Screen>
  );
}
