import React, { useEffect, useMemo } from "react";
import { useRouter } from "expo-router";
import {
  DEFAULT_WORKOUT_EXERCISES,
  getExerciseById,
} from "@/lib/default-workout";
import { setStorageItem, STORAGE_KEYS, useStorageState } from "@/lib/storage";
import type { PlanExercise, WorkoutSession } from "@/types/workout-session";
import { SESSION_PHASES } from "@/types/workout-session";
import { Alert } from "react-native";

export type CompleteSetResult = "rest" | "workout" | "done";

export type UseWorkoutSessionReturn = {
  loading: boolean;
  session: WorkoutSession | null;
  elapsedMs: number;
  currentExercise: PlanExercise | undefined;
  exerciseName: string;
  setsTotal: number;
  isCompleted: boolean;
  completedExerciseIds: string[];
  handleContinue: () => void;
  completeSetAndAdvance: (
    weight: number,
    reps: number
  ) => CompleteSetResult | null;
  handleFinish: () => void;
  clearAndBack: () => void;
  setSession: (value: WorkoutSession | null) => void;
};

export type WorkoutSessionOptions = {
  onComplete?: () => void | Promise<void>;
  /** Exercise list for this workout; defaults to DEFAULT_WORKOUT_EXERCISES when not from a planned session */
  exercises?: PlanExercise[];
  /** When true, do not auto-initialize session (e.g. while loading planned session exercises) */
  skipInitialization?: boolean;
};

export function useWorkoutSession(
  options?: WorkoutSessionOptions
): UseWorkoutSessionReturn {
  const router = useRouter();
  const [[loading, session], setSession] = useStorageState(
    STORAGE_KEYS.workoutSession
  );
  const exercises = useMemo(
    () =>
      options?.exercises?.length
        ? options.exercises
        : DEFAULT_WORKOUT_EXERCISES,
    [options?.exercises]
  );

  useEffect(() => {
    if (loading || options?.skipInitialization) return;
    if (!session || session.phase === SESSION_PHASES.idle) {
      const first = exercises[0];
      if (first) {
        setSession({
          phase: SESSION_PHASES.inWorkout,
          startedAt: Date.now(),
          currentExerciseId: first.id,
          currentSetNumber: 1,
        });
      }
    }
  }, [loading, session, setSession, exercises, options?.skipInitialization]);

  const [elapsedMs, setElapsedMs] = React.useState(() =>
    session ? Date.now() - session.startedAt : 0
  );
  useEffect(() => {
    if (!session) return;
    setElapsedMs(Date.now() - session.startedAt);
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - session.startedAt);
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const currentExercise = session
    ? getExerciseById(exercises, session.currentExerciseId)
    : undefined;
  const exerciseName = currentExercise?.name ?? "—";
  const setsTotal = currentExercise?.sets ?? 0;
  const isCompleted = session?.phase === SESSION_PHASES.completed;

  const completedExerciseIds = React.useMemo(() => {
    if (!session?.completedSets?.length) return [];
    return exercises
      .filter((ex) => {
        const count = session.completedSets!.filter(
          (s) => s.exerciseId === ex.id
        ).length;
        return count === ex.sets;
      })
      .map((ex) => ex.id);
  }, [session?.completedSets, exercises]);

  function completeSetAndAdvance(
    weight: number,
    reps: number
  ): CompleteSetResult | null {
    if (!session || !currentExercise) return null;
    const completedSets = [...(session.completedSets ?? [])];
    completedSets.push({
      exerciseId: session.currentExerciseId,
      setNumber: session.currentSetNumber,
      weight,
      reps,
    });
    const nextSetNumber = session.currentSetNumber + 1;
    if (nextSetNumber <= currentExercise.sets) {
      setSession({
        ...session,
        phase: SESSION_PHASES.inExercise,
        completedSets,
        currentSetNumber: nextSetNumber,
      });
      return "rest";
    }
    const currentIndex = exercises.findIndex(
      (e) => e.id === session.currentExerciseId
    );
    const next = exercises[currentIndex + 1];
    if (next) {
      setSession({
        ...session,
        phase: SESSION_PHASES.inExercise,
        completedSets,
        currentExerciseId: next.id,
        currentSetNumber: 1,
      });
      return "workout";
    }
    setSession({
      ...session,
      phase: SESSION_PHASES.completed,
      completedSets,
    });
    return "done";
  }

  function handleContinue(): void {
    if (!session) return;
    const exercise = getExerciseById(exercises, session.currentExerciseId);
    if (!exercise) {
      const first = exercises[0];
      if (first) {
        setSession({
          ...session,
          currentExerciseId: first.id,
          currentSetNumber: 1,
        });
      }
      return;
    }
    if (session.currentSetNumber < exercise.sets) {
      setSession({
        ...session,
        phase: SESSION_PHASES.inExercise,
        currentSetNumber: session.currentSetNumber + 1,
      });
      return;
    }
    const currentIndex = exercises.findIndex(
      (e) => e.id === session.currentExerciseId
    );
    const next = exercises[currentIndex + 1];
    if (next) {
      setSession({
        ...session,
        phase: SESSION_PHASES.inExercise,
        currentExerciseId: next.id,
        currentSetNumber: 1,
      });
    } else {
      setSession({ ...session, phase: SESSION_PHASES.completed });
    }
  }

  function handleFinish(): void {
    if (!session) return;
    Alert.alert(
      "Finish workout",
      "Are you sure you want to finish the workout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Finish",
          onPress: () => {
            const completedSession: WorkoutSession = {
              ...session,
              phase: SESSION_PHASES.completed,
              startedAt: session.startedAt ?? Date.now(),
              currentExerciseId:
                session.currentExerciseId ?? exercises[0]?.id ?? "",
              currentSetNumber: session.currentSetNumber ?? 1,
            };
            setStorageItem(STORAGE_KEYS.workoutSession, completedSession);
            setSession(completedSession);
            void options?.onComplete?.();
            router.dismissAll();
          },
        },
      ]
    );
  }

  function clearAndBack(): void {
    setSession(null);
    router.back();
  }

  return {
    loading,
    session,
    elapsedMs,
    currentExercise,
    exerciseName,
    setsTotal,
    isCompleted,
    completedExerciseIds,
    handleContinue,
    completeSetAndAdvance,
    handleFinish,
    clearAndBack,
    setSession,
  };
}
