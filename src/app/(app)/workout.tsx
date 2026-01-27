import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Dimensions, StyleSheet } from "react-native";
import Animated, { Easing, FadeIn, FadeInDown } from "react-native-reanimated";
import { Stack, useRouter } from "expo-router";
import ConfettiCannon from "react-native-confetti-cannon";
import { H1, H2, P, View } from "@/components/ui";
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
} from "@/components/workout";
import { useWorkoutSession } from "@/hooks/use-workout-session";
import { DEFAULT_WORKOUT_EXERCISES, getExerciseById } from "@/lib/default-workout";
import { setStorageItem, STORAGE_KEYS } from "@/lib/storage";
import { SESSION_PHASES } from "@/types/workout-session";
import { useTheme } from "@/lib/theme-context";
import { formatElapsedMs } from "@/lib/format-elapsed";
import { NoiseOverlay } from "@/components/ambient-background";

type WorkoutView = "list" | "log-set" | "rest";

export default function Workout(): React.ReactElement {
  const router = useRouter();
  const { colors } = useTheme();
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
  } = useWorkoutSession();

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

  const handleWorkoutComplete = useCallback(() => {
    setStorageItem(STORAGE_KEYS.workoutSession, null);
    router.dismissAll();
  }, [router]);

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
  const confettiOrigin = useMemo(() => ({ x: width / 2, y: height * 0.1 }), [width, height]);

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

      <Screen preset="modal" background="gradient" contentContainerClassName="flex-1 px-4 pt-8">
        <BackgroundGradient />
        {view === "list" && (
          <Animated.View
            entering={FadeIn.duration(TRANSITION_MS).easing(transitionEasing)}
            style={{ flex: 1 }}>
            {isCompleted ? (
              <View className="flex-1 items-center justify-center">
                <View className="mt-16 flex-col">
                  <H2>Done for Today</H2>
                  <P className="mt-2" style={{ color: colors.mutedForeground }}>
                    {exerciseName} • {formatElapsedMs(elapsedMs)}
                  </P>
                </View>
                <View className="mt-24 flex-1 items-center">
                  <P style={{ color: colors.mutedForeground }}>{setsTotal} sets completed</P>
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
            entering={FadeInDown.duration(TRANSITION_MS).easing(transitionEasing)}
            style={{ flex: 1 }}>
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
            entering={FadeInDown.duration(TRANSITION_MS).easing(transitionEasing)}
            style={{ flex: 1 }}>
            <WorkoutRestContent completedLabel={restCompletedLabel} onSkipRest={handleSkipRest} />
          </Animated.View>
        )}

        {showConfetti ? (
          <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]} pointerEvents="none">
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
