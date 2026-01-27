export const SESSION_PHASES = {
  idle: "idle",
  inWorkout: "inWorkout",
  inExercise: "inExercise",
  resting: "resting",
  completed: "completed",
} as const;

export type SessionPhase = (typeof SESSION_PHASES)[keyof typeof SESSION_PHASES];

export type CompletedSet = {
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
};

export type WorkoutSession = {
  phase: SessionPhase;
  startedAt: number;
  currentExerciseId: string;
  currentSetNumber: number;
  completedSets?: CompletedSet[];
};

export type PlanExercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
};
