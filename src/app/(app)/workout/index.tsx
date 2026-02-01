import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dimensions, StyleSheet } from "react-native";
import Animated, { Easing, FadeIn, FadeInDown } from "react-native-reanimated";
import { Stack, useRouter } from "expo-router";
import ConfettiCannon from "react-native-confetti-cannon";
import { H2, P, View } from "@/components/ui";
import { Screen } from "@/components/screen";
import { BackgroundGradient } from "@/components/background-gradient";
import {
  SetsProgressIndicator,
  WorkoutActions,
  WorkoutCurrentExercise,
  WorkoutExerciseList,
  WorkoutHeader,
  WorkoutLogSetContent,
  WorkoutRestContent,
} from "@/features/workout";
import { useWorkoutSession } from "@/hooks/use-workout-session";
import {
  DEFAULT_WORKOUT_EXERCISES,
  getExerciseById,
} from "@/lib/default-workout";
import { setStorageItem, STORAGE_KEYS } from "@/lib/storage";
import { SESSION_PHASES } from "@/types/workout-session";
import { useTheme } from "@/lib/theme-context";
import { formatElapsedMs } from "@/lib/format-elapsed";
import {
  completePlannedSession,
  createWorkoutSession,
  getActiveCycleWithSplit,
} from "@/features/planner/planner-repository";
import { usePlannerStore } from "@/features/planner/planner-store";

type WorkoutView = "list" | "log-set" | "rest";

function findPlannedSessionTitle(
  plan: Awaited<ReturnType<typeof getActiveCycleWithSplit>> | null,
  plannedSessionId: string | null
): string {
  if (!plan || !plannedSessionId) return "Workout";
  for (const sessions of Object.values(plan.sessionsByVariant)) {
    const match = sessions.find((session) => session.id === plannedSessionId);
    if (match) return match.name;
  }
  return "Workout";
}

function toDurationMins(startedAt: number, completedAt: number): number {
  const durationMs = Math.max(0, completedAt - startedAt);
  return Math.round(durationMs / 60000);
}

export default function Workout(): React.ReactElement {
  const router = useRouter();
  const { colors } = useTheme();
  const { activePlannedSessionId, setActivePlannedSessionId } =
    usePlannerStore();
  const hasAdvancedPlannerRef = useRef(false);

  const advancePlannerState = useCallback(async (): Promise<void> => {
    if (!activePlannedSessionId || hasAdvancedPlannerRef.current) return;
    hasAdvancedPlannerRef.current = true;
    try {
      const planWithState = await getActiveCycleWithSplit();
      if (!planWithState) return;
      await completePlannedSession(
        planWithState.cycle.id,
        planWithState,
        activePlannedSessionId
      );
    } catch (e) {
      console.error(e);
    } finally {
      setActivePlannedSessionId(null);
    }
  }, [activePlannedSessionId, setActivePlannedSessionId]);
  const {
    session,
    elapsedMs,
    exerciseName,
    setsTotal,
    isCompleted,
    completedExerciseIds,
    currentExercise,
    completeSetAndAdvance,
    handleFinish,
  } = useWorkoutSession({ onComplete: advancePlannerState });

  const [view, setView] = useState<WorkoutView>("list");
  const [showConfetti, setShowConfetti] = useState(false);

  const handleContinue = useCallback(() => setView("log-set"), []);

  const handleCompleteSet = useCallback(
    (weight: number, reps: number) => {
      const result = completeSetAndAdvance(weight, reps);
      if (result === "done") {
        setView("list");
        return;
      }
      if (result === "workout") {
        setView("list");
        return;
      }
      if (result === "rest") {
        setView("rest");
      }
    },
    [completeSetAndAdvance]
  );

  const handleFinishWithConfetti = useCallback(() => setShowConfetti(true), []);

  const logWorkoutSession = useCallback(async (): Promise<void> => {
    if (!session?.completedSets?.length) return;
    const planWithState = await getActiveCycleWithSplit();
    const completedAt = Date.now();
    const startedAt = session.startedAt ?? completedAt;
    const sessionTitle = findPlannedSessionTitle(
      planWithState,
      activePlannedSessionId
    );

    const totalVolumeKg = session.completedSets.reduce(
      (sum, set) => sum + set.weight * set.reps,
      0
    );
    const totalReps = session.completedSets.reduce(
      (sum, set) => sum + set.reps,
      0
    );
    const totalSets = session.completedSets.length;

    const sets = session.completedSets.map((set) => {
      const exercise = getExerciseById(
        DEFAULT_WORKOUT_EXERCISES,
        set.exerciseId
      );
      return {
        exerciseId: set.exerciseId,
        exerciseName: exercise?.name ?? "Exercise",
        setNumber: set.setNumber,
        weight: set.weight,
        reps: set.reps,
      };
    });

    await createWorkoutSession({
      cycleId: planWithState?.cycle.id ?? null,
      plannedSessionTemplateId: activePlannedSessionId ?? null,
      sessionTitle,
      startedAt,
      completedAt,
      durationMins: toDurationMins(startedAt, completedAt),
      totalVolumeKg,
      totalSets,
      totalReps,
      sets,
    });
  }, [activePlannedSessionId, session]);

  const handleWorkoutComplete = useCallback(() => {
    void (async () => {
      await logWorkoutSession();
      await advancePlannerState();
      setStorageItem(STORAGE_KEYS.workoutSession, null);
      router.dismissAll();
    })();
  }, [advancePlannerState, logWorkoutSession, router]);

  const handleSkipRest = useCallback(() => setView("log-set"), []);

  const sessionPhase = session?.phase;
  useEffect(() => {
    if (!sessionPhase) return;
    if (sessionPhase === SESSION_PHASES.completed && !showConfetti) {
      setView("list");
    }
  }, [sessionPhase, showConfetti]);

  const lastCompleted = session?.completedSets?.length
    ? session.completedSets[session.completedSets.length - 1]
    : undefined;
  const lastExercise = lastCompleted
    ? getExerciseById(DEFAULT_WORKOUT_EXERCISES, lastCompleted.exerciseId)
    : undefined;
  const restCompletedLabel =
    lastExercise && lastCompleted
      ? `${lastExercise.name} • Set ${lastCompleted.setNumber} completed`
      : "Set completed";

  const { width, height } = Dimensions.get("window");
  const confettiOrigin = useMemo(
    () => ({ x: width / 2, y: height * 0.1 }),
    [width, height]
  );

  const TRANSITION_MS = 540;
  const transitionEasing = Easing.out(Easing.cubic);

  const stackScreenOptions = useMemo(
    () => ({
      headerShown: false,
      presentation: "modal" as const,
      animation: "slide_from_bottom" as const,
      animationDuration: 400,
    }),
    []
  );

  return (
    <>
      <Stack.Screen options={stackScreenOptions} />
      <BackgroundGradient />

      <Screen
        preset="modal"
        background="gradient"
        safeAreaEdges={[]}
        contentContainerClassName="flex-1 px-4 pt-8"
      >
        <BackgroundGradient />
        {view === "list" && (
          <Animated.View
            entering={FadeIn.duration(TRANSITION_MS).easing(transitionEasing)}
            style={{ flex: 1 }}
          >
            {isCompleted ? (
              <View className="flex-1 items-center justify-center">
                <View className="mt-16 flex-col">
                  <H2>Done for Today</H2>
                  <P className="mt-2" style={{ color: colors.mutedForeground }}>
                    {exerciseName} • {formatElapsedMs(elapsedMs)}
                  </P>
                </View>
                <View className="mt-24 flex-1 items-center">
                  <P style={{ color: colors.mutedForeground }}>
                    {setsTotal} sets completed
                  </P>
                  <SetsProgressIndicator completed={3} total={4} />
                </View>
                <P className="mb-4" style={{ color: colors.mutedForeground }}>
                  See you next session.
                </P>
              </View>
            ) : (
              <>
                <WorkoutHeader elapsedMs={elapsedMs} />
                <WorkoutCurrentExercise
                  exerciseName={exerciseName}
                  currentSetNumber={session?.currentSetNumber ?? 1}
                  setsTotal={setsTotal}
                />
                <WorkoutExerciseList
                  exercises={DEFAULT_WORKOUT_EXERCISES}
                  currentExerciseId={session?.currentExerciseId}
                  completedExerciseIds={completedExerciseIds}
                />
              </>
            )}
            <WorkoutActions
              isCompleted={isCompleted}
              onDone={handleFinishWithConfetti}
              onContinue={handleContinue}
              onFinish={handleFinish}
            />
          </Animated.View>
        )}

        {view === "log-set" && currentExercise && (
          <Animated.View
            entering={FadeInDown.duration(TRANSITION_MS).easing(
              transitionEasing
            )}
            style={{ flex: 1 }}
          >
            <WorkoutLogSetContent
              exerciseName={exerciseName}
              setsTotal={setsTotal}
              currentSetNumber={session?.currentSetNumber ?? 1}
              currentExercise={currentExercise}
              onComplete={handleCompleteSet}
              clearAndBack={() => setView("list")}
            />
          </Animated.View>
        )}

        {view === "rest" && (
          <Animated.View
            entering={FadeInDown.duration(TRANSITION_MS).easing(
              transitionEasing
            )}
            style={{ flex: 1 }}
          >
            <WorkoutRestContent
              completedLabel={restCompletedLabel}
              onSkipRest={handleSkipRest}
            />
          </Animated.View>
        )}

        {showConfetti ? (
          <View
            style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}
            pointerEvents="none"
          >
            <ConfettiCannon
              count={100}
              origin={confettiOrigin}
              autoStart
              fadeOut
              explosionSpeed={650}
              fallSpeed={900}
              colors={["#FFD700", "#FFA500", "#FF8C00", "#FF6347", "#FF4500"]}
              onAnimationEnd={handleWorkoutComplete}
            />
          </View>
        ) : null}
      </Screen>
    </>
  );
}
