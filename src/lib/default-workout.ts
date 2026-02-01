import type { PlanExercise } from "@/types/workout-session";

export const DEFAULT_WEIGHT_KG = 20;

export const DEFAULT_WORKOUT_EXERCISES: PlanExercise[] = [
  {
    id: "bench-press",
    name: "Bench Press",
    sets: 3,
    reps: 10,
    weight: DEFAULT_WEIGHT_KG,
  },
  {
    id: "squats",
    name: "Squats",
    sets: 3,
    reps: 10,
    weight: DEFAULT_WEIGHT_KG,
  },
  {
    id: "deadlifts",
    name: "Deadlifts",
    sets: 3,
    reps: 10,
    weight: DEFAULT_WEIGHT_KG,
  },
  {
    id: "overhead-press",
    name: "Overhead Press",
    sets: 3,
    reps: 10,
    weight: DEFAULT_WEIGHT_KG,
  },
];

export function getExerciseById(
  exercises: PlanExercise[],
  id: string
): PlanExercise | undefined {
  return exercises.find((e) => e.id === id);
}
