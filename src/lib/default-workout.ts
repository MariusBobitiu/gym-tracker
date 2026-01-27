import type { PlanExercise } from "@/types/workout-session";

export const DEFAULT_WORKOUT_EXERCISES: PlanExercise[] = [
  { id: "bench-press", name: "Bench Press", sets: 3, reps: 10, weight: 100 },
  { id: "squats", name: "Squats", sets: 3, reps: 10, weight: 100 },
  { id: "deadlifts", name: "Deadlifts", sets: 3, reps: 10, weight: 100 },
  { id: "overhead-press", name: "Overhead Press", sets: 3, reps: 10, weight: 100 },
];

export function getExerciseById(exercises: PlanExercise[], id: string): PlanExercise | undefined {
  return exercises.find((e) => e.id === id);
}
