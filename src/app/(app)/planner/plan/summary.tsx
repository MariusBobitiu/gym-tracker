import React, { useCallback, useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { View } from "react-native";
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
  getActivePlan,
  getRotationType,
} from "@/features/planner/planner-repository";
import type { ActivePlan } from "@/features/planner/planner-repository";
import { LoadingState } from "@/components/feedback-states";
import { ScrollView } from "moti";

function rotationRuleText(plan: ActivePlan): string {
  const rotationType = getRotationType(plan.cycle.rotation);
  if (rotationType === "SAME_EVERY_WEEK") {
    return "Rotation: same variant each time you train.";
  }
  return "Rotation: alternates between Variant A and B each time you train";
}

export default function PlanSummaryScreen() {
  const router = useRouter();
  const { colors, tokens } = useTheme();
  const [plan, setPlan] = useState<ActivePlan | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getActivePlan()
      .then(setPlan)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <Screen className="pb-24">
        <Stack.Screen options={headerOptions({ title: "Your plan" })} />
        <AppHeader title="Your plan" showBackButton />
        <View className="flex-1 items-center justify-center">
          <LoadingState label="Loading plan..." />
        </View>
      </Screen>
    );
  }

  if (!plan) {
    return (
      <Screen className="pb-24">
        <Stack.Screen options={headerOptions({ title: "Your plan" })} />
        <AppHeader title="Your plan" showBackButton />
        <View className="flex-1 items-center justify-center px-4">
          <P style={{ color: colors.mutedForeground, textAlign: "center" }}>
            No plan found. Create a plan first.
          </P>
          <Button
            label="Back to Planner"
            variant="outline"
            className="mt-4"
            onPress={() => router.replace({ pathname: "/planner" } as never)}
          />
        </View>
      </Screen>
    );
  }

  const rotationType = getRotationType(plan.cycle.rotation);
  const variantKeysToShow =
    rotationType === "SAME_EVERY_WEEK" ? ["A"] : ["A", "B"];

  return (
    <Screen
      safeAreaEdges={["top", "bottom"]}
      contentContainerClassName="pb-12"
      preset="scroll"
    >
      <Stack.Screen options={headerOptions({ title: "Your plan" })} />
      <AppHeader title="Your plan is ready" showBackButton />
      <ScrollView
        className="flex-1 px-4 py-4"
        keyboardShouldPersistTaps={"handled"}
        showsVerticalScrollIndicator={false}
      >
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{plan.split.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <P className="mb-3" style={{ color: colors.mutedForeground }}>
              Variants: {variantKeysToShow.join(", ")}
            </P>
            {variantKeysToShow.map((key) => {
              const sessions = plan.sessionsByVariant[key] ?? [];
              return (
                <View key={key} className="mb-4">
                  <Text
                    style={{
                      fontSize: tokens.typography.sizes.sm,
                      fontWeight: tokens.typography.weights.semibold,
                      color: colors.foreground,
                      marginBottom: 8,
                    }}
                  >
                    Variant {key}
                  </Text>
                  {sessions.map((s) => (
                    <View
                      key={s.id}
                      className="mb-2 rounded-lg px-3 py-2"
                      style={{
                        backgroundColor: colors.muted + "40",
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: tokens.typography.sizes.sm,
                          color: colors.foreground,
                        }}
                      >
                        {s.name}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </CardContent>
        </Card>

        <View
          className="mb-4 rounded-lg px-4 py-3"
          style={{
            backgroundColor: colors.muted + "40",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: tokens.typography.sizes.sm,
              color: colors.foreground,
              marginBottom: 4,
            }}
          >
            {rotationRuleText(plan)}
          </Text>
          <Text
            style={{
              fontSize: tokens.typography.sizes.sm,
              color: colors.mutedForeground,
            }}
          >
            Schedule: flexible — train whenever you want
          </Text>
        </View>

        <Button
          label="Done"
          className="mb-3 w-full"
          onPress={() => router.replace({ pathname: "/planner" } as never)}
        />
        <Button
          label="Edit plan"
          variant="outline"
          className="w-full"
          onPress={() =>
            router.push(
              `/planner/split-builder?splitId=${encodeURIComponent(plan.split.id)}` as never
            )
          }
        />
      </ScrollView>
    </Screen>
  );
}
