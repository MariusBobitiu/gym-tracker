import { useEffect, useState } from "react";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { usePlannerStore } from "@/features/planner/planner-store";
import {
  getActiveCycleWithSplit,
  getUpNextSession,
  completeWorkoutAndAdvance,
} from "@/features/planner/planner-repository";
import { Screen } from "@/components/screen";
import { Button, P, Text } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";
import { LoadingState } from "@/components/feedback-states";
import AppHeader, { headerOptions } from "@/components/app-header";

/**
 * Route: /workout/start?plannedSessionId=... | ?fromSummary=1
 *
 * - fromSummary=1: Shows placeholder "Today: Variant X — Session Y" and "Complete workout";
 *   Complete calls completeWorkoutAndAdvance() and navigates to Planner.
 * - plannedSessionId only: Stores active planned session and navigates to main workout screen.
 */
export default function WorkoutStart() {
  const router = useRouter();
  const { colors, tokens } = useTheme();
  const { plannedSessionId, fromSummary } = useLocalSearchParams<{
    plannedSessionId?: string;
    fromSummary?: string;
  }>();
  const { setActivePlannedSessionId } = usePlannerStore();

  const [planWithState, setPlanWithState] = useState<Awaited<
    ReturnType<typeof getActiveCycleWithSplit>
  > | null>(null);
  const [loading, setLoading] = useState(true);

  const showPlaceholder = fromSummary === "1";

  useEffect(() => {
    if (showPlaceholder) {
      getActiveCycleWithSplit()
        .then(setPlanWithState)
        .finally(() => setLoading(false));
      return;
    }

    if (plannedSessionId) {
      setActivePlannedSessionId(plannedSessionId);
    }
    router.replace("/workout");
  }, [showPlaceholder, plannedSessionId, router, setActivePlannedSessionId]);

  const nextWorkout = planWithState
    ? getUpNextSession(planWithState, planWithState.cycleState)
    : null;

  const handleCompleteWorkout = async (): Promise<void> => {
    if (!planWithState) return;
    try {
      await completeWorkoutAndAdvance(planWithState.cycle.id, planWithState);
      router.replace("/planner" as never);
    } catch (e) {
      console.error(e);
    }
  };

  if (!showPlaceholder) {
    return null;
  }

  if (loading) {
    return (
      <Screen className="pb-24">
        <Stack.Screen options={headerOptions({ title: "Workout" })} />
        <AppHeader title="Workout" showBackButton />
        <View className="flex-1 items-center justify-center">
          <LoadingState label="Loading..." />
        </View>
      </Screen>
    );
  }

  if (!planWithState || !nextWorkout) {
    return (
      <Screen className="pb-24">
        <Stack.Screen options={headerOptions({ title: "Workout" })} />
        <AppHeader title="Workout" showBackButton />
        <View className="flex-1 items-center justify-center px-4">
          <P style={{ color: colors.mutedForeground, textAlign: "center" }}>
            No plan or next workout. Go to Planner to set up your plan.
          </P>
          <Button
            label="Back to Planner"
            variant="outline"
            className="mt-4"
            onPress={() => router.replace("/planner" as never)}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen className="pb-24">
      <Stack.Screen options={headerOptions({ title: "Workout" })} />
      <AppHeader title="Workout" showBackButton />
      <View className="flex-1 px-4 py-6">
        <Text
          style={{
            fontSize: tokens.typography.sizes.lg,
            fontWeight: tokens.typography.weights.semibold,
            color: colors.foreground,
            marginBottom: 8,
          }}>
          Today: Variant {nextWorkout.variantKey} — {nextWorkout.sessionName}
        </Text>
        <Button label="Complete workout" className="mt-4 w-full" onPress={handleCompleteWorkout} />
      </View>
    </Screen>
  );
}
