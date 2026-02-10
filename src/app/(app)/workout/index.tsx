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
  DEFAULT_WEIGHT_KG,
  getExerciseById,
} from "@/lib/default-workout";
import { setStorageItem, STORAGE_KEYS } from "@/lib/storage";
import { SESSION_PHASES } from "@/types/workout-session";
import { useTheme } from "@/lib/theme-context";
import { formatElapsedMs } from "@/lib/format-elapsed";
import {
  completePlannedSession,
  completeWorkoutSession,
  getActiveCycleWithSplit,
  getExercisesForSessionTemplate,
  getLastSessionSameWorkoutWeightAndReps,
  getPlannedSessionTemplateId,
  getLastWeightAndRepsForExercise,
} from "@/features/planner/planner-repository";
import { usePlannerStore } from "@/features/planner/planner-store";
import type { PlanExercise, WorkoutSession } from "@/types/workout-session";
import { LoadingState } from "@/components/feedback-states";

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

function DoneForTodayContent({
  sessionTitle,
  elapsedMs,
  completedSetsCount,
  totalSetsInWorkout,
}: {
  sessionTitle: string;
  elapsedMs: number;
  completedSetsCount: number;
  totalSetsInWorkout: number;
}): React.ReactElement {
  const { colors } = useTheme();
  const total = Math.max(1, totalSetsInWorkout);
  const completed = Math.min(completedSetsCount, total);

  return (
    <View className="flex-1 items-center">
      <View className="mt-16 flex-col items-center">
        <H2>Done for Today</H2>
        <P
          className="mt-2"
          style={{
            color: colors.mutedForeground,
            textAlign: "center",
          }}
        >
          {sessionTitle} • {formatElapsedMs(elapsedMs)}
        </P>
      </View>
      <View className="mt-16 items-center">
        <P
          style={{
            color: colors.mutedForeground,
            textAlign: "center",
          }}
        >
          {completed} set{completed !== 1 ? "s" : ""} completed
        </P>
        <View className="items-center">
          <SetsProgressIndicator completed={completed} total={total} />
        </View>
      </View>
      <View className="flex-1" />
      <P
        className="mb-4"
        style={{
          color: colors.mutedForeground,
          textAlign: "center",
        }}
      >
        See you next session.
      </P>
    </View>
  );
}

export default function Workout(): React.ReactElement {
  const router = useRouter();
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

  const [sessionExercises, setSessionExercises] = useState<
    PlanExercise[] | null
  >(null);
  const [sessionTitle, setSessionTitle] = useState<string>("Workout");

  useEffect(() => {
    if (!activePlannedSessionId) {
      setSessionExercises(null);
      setSessionTitle("Workout");
      return;
    }
    let cancelled = false;
    getExercisesForSessionTemplate(activePlannedSessionId)
      .then((list) => {
        if (!cancelled) setSessionExercises(list);
      })
      .catch(() => {
        if (!cancelled) setSessionExercises([]);
      });
    getActiveCycleWithSplit()
      .then((plan) => {
        if (!cancelled)
          setSessionTitle(
            findPlannedSessionTitle(plan, activePlannedSessionId)
          );
      })
      .catch(() => {
        if (!cancelled) setSessionTitle("Workout");
      });
    return () => {
      cancelled = true;
    };
  }, [activePlannedSessionId]);

  const exercises = useMemo(
    () =>
      sessionExercises?.length ? sessionExercises : DEFAULT_WORKOUT_EXERCISES,
    [sessionExercises]
  );

  const isLoadingSessionExercises =
    Boolean(activePlannedSessionId) && sessionExercises === null;

  const finishEarlyHandlerRef =
    useRef<
      (
        completedSession: WorkoutSession,
        activeSessionId: string
      ) => void | Promise<void>
    >(null);

  const startActiveSessionInput = useMemo(
    () => ({
      cycleId: null as string | null,
      plannedSessionTemplateId: activePlannedSessionId ?? null,
      sessionTitle: "Workout",
    }),
    [activePlannedSessionId]
  );

  const {
    session,
    activeSessionId,
    elapsedMs,
    exerciseName,
    setsTotal,
    isCompleted,
    completedExerciseIds,
    currentExercise,
    completeSetAndAdvance,
    handleFinish,
  } = useWorkoutSession({
    onComplete: advancePlannerState,
    exercises: isLoadingSessionExercises ? undefined : exercises,
    skipInitialization: isLoadingSessionExercises,
    onFinishEarly: (completedSession, activeSessionId) =>
      void finishEarlyHandlerRef.current?.(completedSession, activeSessionId),
    startActiveSessionInput,
  });

  // When resuming (we have active session but store lost activePlannedSessionId), restore it so we load the correct exercises
  useEffect(() => {
    if (!activeSessionId || activePlannedSessionId != null) return;
    let cancelled = false;
    getPlannedSessionTemplateId(activeSessionId).then((templateId) => {
      if (!cancelled && templateId) setActivePlannedSessionId(templateId);
    });
    return () => {
      cancelled = true;
    };
  }, [activeSessionId, activePlannedSessionId, setActivePlannedSessionId]);

  const [view, setView] = useState<WorkoutView>("list");
  const [showConfetti, setShowConfetti] = useState(false);
  const [suggestedByExerciseId, setSuggestedByExerciseId] = useState<
    Record<string, { weight: number; reps: number }>
  >({});

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      const exerciseIds = exercises.map((e) => e.id);
      const lastSessionMap = await getLastSessionSameWorkoutWeightAndReps(
        activePlannedSessionId,
        exerciseIds
      );
      const next: Record<string, { weight: number; reps: number }> = {};
      for (const ex of exercises) {
        if (cancelled) return;
        const last = await getLastWeightAndRepsForExercise(ex.id);
        const fromLastSession = lastSessionMap[ex.id];
        next[ex.id] =
          last ??
          (fromLastSession
            ? {
                weight: fromLastSession.weight,
                reps: fromLastSession.reps,
              }
            : {
                weight: ex.weight ?? DEFAULT_WEIGHT_KG,
                reps: ex.reps ?? 10,
              });
      }
      if (!cancelled) setSuggestedByExerciseId(next);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [exercises, activePlannedSessionId]);

  const handleContinue = useCallback(() => setView("log-set"), []);

  const handleCompleteSet = useCallback(
    (weight: number, reps: number) => {
      if (currentExercise) {
        setSuggestedByExerciseId((prev) => ({
          ...prev,
          [currentExercise.id]: { weight, reps },
        }));
      }
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
    [completeSetAndAdvance, currentExercise]
  );

  const handleFinishWithConfetti = useCallback(() => setShowConfetti(true), []);

  function totalsFromCompletedSets(
    completedSets: { weight: number; reps: number }[]
  ) {
    const totalVolumeKg = completedSets.reduce(
      (sum, set) => sum + set.weight * set.reps,
      0
    );
    const totalReps = completedSets.reduce((sum, set) => sum + set.reps, 0);
    return { totalVolumeKg, totalReps, totalSets: completedSets.length };
  }

  const handleFinishEarly = useCallback(
    async (
      completedSession: WorkoutSession,
      activeSessionId: string
    ): Promise<void> => {
      const completedAt = Date.now();
      const startedAt = completedSession.startedAt ?? completedAt;
      const { totalVolumeKg, totalReps, totalSets } = totalsFromCompletedSets(
        completedSession.completedSets ?? []
      );
      await completeWorkoutSession(activeSessionId, completedAt, {
        durationMins: toDurationMins(startedAt, completedAt),
        totalVolumeKg,
        totalSets,
        totalReps,
      });
      await advancePlannerState();
      setStorageItem(STORAGE_KEYS.workoutSessionUI, null);
      router.dismissAll();
    },
    [advancePlannerState, router]
  );

  useEffect(() => {
    finishEarlyHandlerRef.current = handleFinishEarly;
  }, [handleFinishEarly]);

  const handleWorkoutComplete = useCallback(() => {
    if (!activeSessionId || !session) return;
    void (async () => {
      const completedAt = Date.now();
      const startedAt = session.startedAt ?? completedAt;
      const { totalVolumeKg, totalReps, totalSets } = totalsFromCompletedSets(
        session.completedSets ?? []
      );
      await completeWorkoutSession(activeSessionId, completedAt, {
        durationMins: toDurationMins(startedAt, completedAt),
        totalVolumeKg,
        totalSets,
        totalReps,
      });
      await advancePlannerState();
      setStorageItem(STORAGE_KEYS.workoutSessionUI, null);
      router.dismissAll();
    })();
  }, [activeSessionId, session, advancePlannerState, router]);

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
    ? getExerciseById(exercises, lastCompleted.exerciseId)
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

  if (isLoadingSessionExercises) {
    return (
      <>
        <Stack.Screen options={stackScreenOptions} />
        <BackgroundGradient />
        <Screen
          preset="modal"
          background="gradient"
          safeAreaEdges={[]}
          contentContainerClassName="flex-1 items-center justify-center px-4 pt-8"
        >
          <LoadingState label="Loading workout..." />
        </Screen>
      </>
    );
  }

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
        {(view === "list" || (view === "log-set" && !currentExercise)) && (
          <Animated.View
            entering={FadeIn.duration(TRANSITION_MS).easing(transitionEasing)}
            style={{ flex: 1 }}
          >
            {isCompleted ? (
              <DoneForTodayContent
                sessionTitle={sessionTitle}
                elapsedMs={elapsedMs}
                completedSetsCount={session?.completedSets?.length ?? 0}
                totalSetsInWorkout={exercises.reduce(
                  (sum, ex) => sum + ex.sets,
                  0
                )}
              />
            ) : (
              <>
                <WorkoutHeader elapsedMs={elapsedMs} />
                <WorkoutCurrentExercise
                  exerciseName={exerciseName}
                  currentSetNumber={session?.currentSetNumber ?? 1}
                  setsTotal={setsTotal}
                />
                <WorkoutExerciseList
                  exercises={exercises}
                  currentExerciseId={session?.currentExerciseId}
                  completedExerciseIds={completedExerciseIds}
                  suggestedByExerciseId={suggestedByExerciseId}
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

        {view === "log-set" && currentExercise ? (
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
              initialWeight={suggestedByExerciseId[currentExercise.id]?.weight}
              initialReps={suggestedByExerciseId[currentExercise.id]?.reps}
            />
          </Animated.View>
        ) : null}

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
