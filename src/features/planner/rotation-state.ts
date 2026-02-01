/**
 * Rotation state: computes "next workout" and advances after completion.
 * Persists pointer in MMKV (plannerNextWorkout). Plan data lives in SQLite.
 */

import type { ActivePlan } from "./planner-repository";
import { parseRotation } from "./planner-repository";
import {
  getStorageItem,
  setStorageItem,
  STORAGE_KEYS,
  type PlannerNextWorkoutState,
} from "@/lib/storage";

export type NextWorkoutResult = {
  variantKey: string;
  sessionName: string;
  sessionId: string;
  variantIndex: number;
  sessionIndex: number;
} | null;

function getStoredPointer(): PlannerNextWorkoutState {
  const v = getStorageItem(STORAGE_KEYS.plannerNextWorkout);
  return v ?? null;
}

function setStoredPointer(pointer: PlannerNextWorkoutState): void {
  setStorageItem(STORAGE_KEYS.plannerNextWorkout, pointer);
}

/**
 * Returns the next workout from the plan using stored rotation pointer.
 * If only one variant: loops through that variant's sessions.
 * If A and B: alternates variants, advancing session index when cycling back to first variant.
 */
export function getNextWorkout(plan: ActivePlan): NextWorkoutResult {
  const rotation = parseRotation(plan.cycle.rotation);
  if (rotation.length === 0) return null;

  const variantKeys = plan.variants.map((v) => v.key);
  const sessionsByKey: Record<string, { id: string; name: string }[]> = {};
  for (const v of plan.variants) {
    sessionsByKey[v.key] = (plan.sessionsByVariant[v.key] ?? []).map((s) => ({
      id: s.id,
      name: s.name,
    }));
  }

  let pointer = getStoredPointer();
  if (pointer === null) {
    pointer = { variantIndex: 0, sessionIndex: 0 };
    setStoredPointer(pointer);
  }

  const variantKey =
    rotation[pointer.variantIndex % rotation.length] ?? rotation[0];
  const sessions = sessionsByKey[variantKey] ?? [];
  if (sessions.length === 0) return null;

  const sessionIndex = pointer.sessionIndex % sessions.length;
  const session = sessions[sessionIndex];
  if (!session) return null;

  return {
    variantKey,
    sessionName: session.name,
    sessionId: session.id,
    variantIndex: pointer.variantIndex % rotation.length,
    sessionIndex,
  };
}

/**
 * Advances the rotation pointer after a workout is completed.
 * Single variant: session index increments (wraps).
 * Two+ variants: alternate variant; when coming back to first variant, session index increments (wraps).
 * Persists updated pointer to MMKV.
 */
export function advanceRotation(plan: ActivePlan): void {
  const rotation = parseRotation(plan.cycle.rotation);
  if (rotation.length === 0) return;

  let pointer = getStoredPointer();
  if (pointer === null) {
    pointer = { variantIndex: 0, sessionIndex: 0 };
  }

  const variantKeys = plan.variants.map((v) => v.key);
  const firstVariantKey = rotation[0];
  const sessionsForFirst = plan.sessionsByVariant[firstVariantKey] ?? [];
  const sessionCount = sessionsForFirst.length || 1;

  if (rotation.length === 1) {
    pointer = {
      variantIndex: 0,
      sessionIndex: (pointer.sessionIndex + 1) % sessionCount,
    };
  } else {
    const nextVariantIndex = (pointer.variantIndex + 1) % rotation.length;
    const goingBackToFirst = nextVariantIndex === 0;
    pointer = {
      variantIndex: nextVariantIndex,
      sessionIndex: goingBackToFirst
        ? (pointer.sessionIndex + 1) % sessionCount
        : pointer.sessionIndex,
    };
  }

  setStoredPointer(pointer);
}

/**
 * Resets the stored pointer (e.g. when plan is reset). Call from resetPlan or when needed.
 */
export function resetRotationPointer(): void {
  setStoredPointer(null);
}
