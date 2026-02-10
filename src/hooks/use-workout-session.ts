import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  DEFAULT_WORKOUT_EXERCISES,
  getExerciseById,
} from "@/lib/default-workout";
import { setStorageItem, STORAGE_KEYS, useStorageState } from "@/lib/storage";
import type {
  CompletedSet,
  PlanExercise,
  WorkoutSession,
  WorkoutSessionUIState,
} from "@/types/workout-session";
import { SESSION_PHASES } from "@/types/workout-session";
import { Alert } from "react-native";
import {
  addSetToWorkoutSession,
  deleteActiveWorkoutSession,
  getSetsForWorkoutSession,
  startActiveWorkoutSession,
} from "@/features/planner/planner-repository";

export type CompleteSetResult = "rest" | "workout" | "done";

export type UseWorkoutSessionReturn = {
  loading: boolean;
  session: WorkoutSession | null;
  activeSessionId: string | null;
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

export type StartActiveSessionInput = {
  cycleId: string | null;
  plannedSessionTemplateId: string | null;
  sessionTitle: string;
};

export type WorkoutSessionOptions = {
  onComplete?: () => void | Promise<void>;
  /** Called when user finishes early. Caller should complete session in DB (completeWorkoutSession), advance planner, clear UI state, dismiss. */
  onFinishEarly?: (
    completedSession: WorkoutSession,
    activeSessionId: string
  ) => void | Promise<void>;
  /** Exercise list for this workout; defaults to DEFAULT_WORKOUT_EXERCISES when not from a planned session */
  exercises?: PlanExercise[];
  /** When true, do not auto-initialize session (e.g. while loading planned session exercises) */
  skipInitialization?: boolean;
  /** When starting a new session, use this for the SQLite row (session title, plan refs). */
  startActiveSessionInput?: StartActiveSessionInput;
};

function uiStateToSession(
  ui: WorkoutSessionUIState,
  completedSets: CompletedSet[]
): WorkoutSession {
  return {
    phase: ui.phase,
    startedAt: ui.startedAt,
    currentExerciseId: ui.currentExerciseId,
    currentSetNumber: ui.currentSetNumber,
    completedSets,
  };
}

export function useWorkoutSession(
  options?: WorkoutSessionOptions
): UseWorkoutSessionReturn {
  const router = useRouter();
  const [[storageLoading, uiState], setUIState] = useStorageState(
    STORAGE_KEYS.workoutSessionUI
  );
  const [setsFromDb, setSetsFromDb] = useState<CompletedSet[]>([]);
  const [setsLoading, setSetsLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);

  const exercises = useMemo(
    () =>
      options?.exercises?.length
        ? options.exercises
        : DEFAULT_WORKOUT_EXERCISES,
    [options?.exercises]
  );

  const session: WorkoutSession | null = useMemo(
    () => (uiState ? uiStateToSession(uiState, setsFromDb) : null),
    [uiState, setsFromDb]
  );

  useEffect(() => {
    if (!uiState?.activeSessionId) {
      setSetsFromDb([]);
      return;
    }
    let cancelled = false;
    setSetsLoading(true);
    getSetsForWorkoutSession(uiState.activeSessionId)
      .then((rows) => {
        if (cancelled) return;
        setSetsFromDb(
          rows.map((r) => ({
            exerciseId: r.exercise_id,
            setNumber: r.set_number,
            weight: r.weight,
            reps: r.reps,
          }))
        );
      })
      .finally(() => {
        if (!cancelled) setSetsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uiState?.activeSessionId]);

  useEffect(() => {
    if (storageLoading || options?.skipInitialization || uiState) return;
    const first = exercises[0];
    if (!first) return;

    let cancelled = false;
    setInitializing(true);
    const startedAt = Date.now();
    const input = options?.startActiveSessionInput ?? {
      cycleId: null,
      plannedSessionTemplateId: null,
      sessionTitle: "Workout",
    };
    startActiveWorkoutSession({
      ...input,
      startedAt,
    })
      .then((activeSessionId) => {
        if (cancelled) return;
        const newUI: WorkoutSessionUIState = {
          activeSessionId,
          startedAt,
          phase: SESSION_PHASES.inWorkout,
          currentExerciseId: first.id,
          currentSetNumber: 1,
          currentExerciseName: first.name,
          currentExerciseSets: first.sets,
        };
        setStorageItem(STORAGE_KEYS.workoutSessionUI, newUI);
        setUIState(newUI);
      })
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    storageLoading,
    options?.skipInitialization,
    options?.startActiveSessionInput,
    uiState,
    exercises,
    setUIState,
  ]);

  const loading = storageLoading || initializing;

  const [elapsedMs, setElapsedMs] = useState(() =>
    uiState ? Date.now() - uiState.startedAt : 0
  );
  const [frozenElapsedMs, setFrozenElapsedMs] = useState<number | null>(null);

  useEffect(() => {
    if (!uiState) return;
    if (uiState.phase === SESSION_PHASES.completed) {
      setFrozenElapsedMs(Date.now() - uiState.startedAt);
      return;
    }
    setFrozenElapsedMs(null);
    setElapsedMs(Date.now() - uiState.startedAt);
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - uiState.startedAt);
    }, 1000);
    return () => clearInterval(interval);
  }, [uiState]);

  const displayElapsedMs =
    session?.phase === SESSION_PHASES.completed
      ? (frozenElapsedMs ?? (uiState ? Date.now() - uiState.startedAt : 0))
      : elapsedMs;

  const currentExercise = session
    ? getExerciseById(exercises, session.currentExerciseId)
    : undefined;
  const exerciseName = currentExercise?.name ?? "—";
  const setsTotal = currentExercise?.sets ?? 0;
  const isCompleted = session?.phase === SESSION_PHASES.completed;

  const completedExerciseIds = useMemo(() => {
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

  const completeSetAndAdvance = useCallback(
    (weight: number, reps: number): CompleteSetResult | null => {
      if (!session || !uiState || !currentExercise) return null;
      const newSet: CompletedSet = {
        exerciseId: session.currentExerciseId,
        setNumber: session.currentSetNumber,
        weight,
        reps,
      };
      setSetsFromDb((prev) => [...prev, newSet]);
      void addSetToWorkoutSession(uiState.activeSessionId, {
        exerciseId: newSet.exerciseId,
        exerciseName: currentExercise.name,
        setNumber: newSet.setNumber,
        weight: newSet.weight,
        reps: newSet.reps,
      });

      const nextSetNumber = session.currentSetNumber + 1;
      if (nextSetNumber <= currentExercise.sets) {
        const next: WorkoutSessionUIState = {
          ...uiState,
          phase: SESSION_PHASES.inExercise,
          currentSetNumber: nextSetNumber,
          currentExerciseName: currentExercise.name,
          currentExerciseSets: currentExercise.sets,
        };
        setStorageItem(STORAGE_KEYS.workoutSessionUI, next);
        setUIState(next);
        return "rest";
      }
      const currentIndex = exercises.findIndex(
        (e) => e.id === session.currentExerciseId
      );
      const nextEx = exercises[currentIndex + 1];
      if (nextEx) {
        const nextUI: WorkoutSessionUIState = {
          ...uiState,
          phase: SESSION_PHASES.inExercise,
          currentExerciseId: nextEx.id,
          currentSetNumber: 1,
          currentExerciseName: nextEx.name,
          currentExerciseSets: nextEx.sets,
        };
        setStorageItem(STORAGE_KEYS.workoutSessionUI, nextUI);
        setUIState(nextUI);
        return "workout";
      }
      const completedUI: WorkoutSessionUIState = {
        ...uiState,
        phase: SESSION_PHASES.completed,
      };
      setStorageItem(STORAGE_KEYS.workoutSessionUI, completedUI);
      setUIState(completedUI);
      return "done";
    },
    [session, uiState, currentExercise, exercises, setUIState]
  );

  const handleContinue = useCallback(() => {
    if (!session || !uiState) return;
    const exercise = getExerciseById(exercises, session.currentExerciseId);
    if (!exercise) {
      const first = exercises[0];
      if (first) {
        const next: WorkoutSessionUIState = {
          ...uiState,
          currentExerciseId: first.id,
          currentSetNumber: 1,
          currentExerciseName: first.name,
          currentExerciseSets: first.sets,
        };
        setStorageItem(STORAGE_KEYS.workoutSessionUI, next);
        setUIState(next);
      }
      return;
    }
    if (session.currentSetNumber < exercise.sets) {
      const next: WorkoutSessionUIState = {
        ...uiState,
        phase: SESSION_PHASES.inExercise,
        currentSetNumber: session.currentSetNumber + 1,
        currentExerciseName: exercise.name,
        currentExerciseSets: exercise.sets,
      };
      setStorageItem(STORAGE_KEYS.workoutSessionUI, next);
      setUIState(next);
      return;
    }
    const currentIndex = exercises.findIndex(
      (e) => e.id === session.currentExerciseId
    );
    const nextEx = exercises[currentIndex + 1];
    if (nextEx) {
      const next: WorkoutSessionUIState = {
        ...uiState,
        phase: SESSION_PHASES.inExercise,
        currentExerciseId: nextEx.id,
        currentSetNumber: 1,
        currentExerciseName: nextEx.name,
        currentExerciseSets: nextEx.sets,
      };
      setStorageItem(STORAGE_KEYS.workoutSessionUI, next);
      setUIState(next);
    } else {
      const completed: WorkoutSessionUIState = {
        ...uiState,
        phase: SESSION_PHASES.completed,
      };
      setStorageItem(STORAGE_KEYS.workoutSessionUI, completed);
      setUIState(completed);
    }
  }, [session, uiState, exercises, setUIState]);

  const handleFinish = useCallback(() => {
    if (!session || !uiState) return;
    Alert.alert(
      "Finish workout",
      "Are you sure you want to finish the workout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Finish",
          onPress: () => {
            const completedSession: WorkoutSession = {
              phase: SESSION_PHASES.completed,
              startedAt: uiState.startedAt,
              currentExerciseId:
                uiState.currentExerciseId ?? exercises[0]?.id ?? "",
              currentSetNumber: uiState.currentSetNumber ?? 1,
              completedSets: setsFromDb,
            };
            if (options?.onFinishEarly) {
              void options.onFinishEarly(
                completedSession,
                uiState.activeSessionId
              );
            } else {
              void options?.onComplete?.();
              router.dismissAll();
            }
          },
        },
      ]
    );
  }, [
    session,
    uiState,
    setsFromDb,
    exercises,
    options?.onFinishEarly,
    options?.onComplete,
    router,
  ]);

  const clearAndBack = useCallback(() => {
    if (uiState?.activeSessionId) {
      void deleteActiveWorkoutSession(uiState.activeSessionId);
    }
    setStorageItem(STORAGE_KEYS.workoutSessionUI, null);
    setUIState(null);
    router.back();
  }, [uiState?.activeSessionId, setUIState, router]);

  const setSession = useCallback(
    (value: WorkoutSession | null) => {
      if (value !== null) return;
      if (uiState?.activeSessionId) {
        void deleteActiveWorkoutSession(uiState.activeSessionId);
      }
      setStorageItem(STORAGE_KEYS.workoutSessionUI, null);
      setUIState(null);
    },
    [uiState?.activeSessionId, setUIState]
  );

  return {
    loading,
    session,
    activeSessionId: uiState?.activeSessionId ?? null,
    elapsedMs: displayElapsedMs,
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
