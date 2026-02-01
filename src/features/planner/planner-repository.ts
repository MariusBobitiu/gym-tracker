import { differenceInCalendarWeeks, startOfWeek } from "date-fns";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import uuid from "react-native-uuid";
import { db } from "@/lib/planner-db/database";
import {
  cycleState,
  cycles,
  sessionTemplateExercises,
  sessionTemplates,
  splitVariants,
  splits,
  workoutSessions,
  workoutSets,
} from "@/lib/planner-db/schema";
import type { InferSelectModel } from "drizzle-orm";
import type { PlanExercise } from "@/types/workout-session";

export type SplitRow = InferSelectModel<typeof splits>;
export type SplitVariantRow = InferSelectModel<typeof splitVariants>;
export type SessionTemplateRow = InferSelectModel<typeof sessionTemplates>;
export type CycleRow = InferSelectModel<typeof cycles>;
export type CycleStateRow = InferSelectModel<typeof cycleState>;
export type WorkoutSessionRow = InferSelectModel<typeof workoutSessions>;
export type WorkoutSetRow = InferSelectModel<typeof workoutSets>;
export type SessionTemplateExerciseRow = InferSelectModel<
  typeof sessionTemplateExercises
>;

export type SessionTemplateView = {
  id: string;
  name: string;
  muscleGroups: string[] | null;
  position: number;
};

export type ActivePlan = {
  split: SplitRow;
  variants: SplitVariantRow[];
  sessionsByVariant: Record<string, SessionTemplateView[]>;
  cycle: CycleRow;
};

export type ActivePlanWithState = ActivePlan & { cycleState: CycleStateRow };

export type WorkoutSessionSummary = {
  id: string;
  plannedSessionTemplateId: string | null;
  sessionTitle: string;
  startedAt: number;
  completedAt: number;
  durationMins: number | null;
  totalVolumeKg: number | null;
  totalSets: number;
  totalReps: number;
  muscleGroups: string[] | null;
};

export type WorkoutSessionDetail = {
  session: WorkoutSessionSummary;
  sets: WorkoutSetRow[];
};

export type CreateWorkoutSessionInput = {
  cycleId: string | null;
  plannedSessionTemplateId: string | null;
  sessionTitle: string;
  startedAt: number;
  completedAt: number;
  durationMins: number | null;
  totalVolumeKg: number | null;
  totalSets: number;
  totalReps: number;
  sets: {
    exerciseId: string;
    exerciseName: string;
    setNumber: number;
    weight: number;
    reps: number;
  }[];
};

export type RotationType = "SAME_EVERY_WEEK" | "ALTERNATE_AB";

/** Normalize rotation value to SAME_EVERY_WEEK or ALTERNATE_AB. Handles legacy JSON array. */
export function getRotationType(rotation: string): RotationType {
  if (rotation === "SAME_EVERY_WEEK" || rotation === "ALTERNATE_AB")
    return rotation;
  try {
    const arr = JSON.parse(rotation) as unknown;
    const list = Array.isArray(arr) ? arr : [];
    return list.length >= 2 ? "ALTERNATE_AB" : "SAME_EVERY_WEEK";
  } catch {
    return "SAME_EVERY_WEEK";
  }
}

function parseMuscleGroups(value: string | null): string[] | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as string[];
  } catch {
    return null;
  }
}

function parseRotation(rotationJson: string): string[] {
  try {
    const arr = JSON.parse(rotationJson) as unknown;
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

/** Returns a split by id with its variants and sessions (no cycle). For edit flow. */
export async function getSplitBySplitId(
  splitId: string
): Promise<Omit<ActivePlan, "cycle"> | null> {
  const splitRows = await db
    .select()
    .from(splits)
    .where(eq(splits.id, splitId))
    .limit(1);
  const split = splitRows[0] ?? null;
  if (!split) return null;

  const variantRows = await db
    .select()
    .from(splitVariants)
    .where(eq(splitVariants.split_id, split.id))
    .orderBy(splitVariants.position);

  const sessionsByVariant: Record<string, SessionTemplateView[]> = {};
  for (const v of variantRows) {
    const sessionRows = await db
      .select()
      .from(sessionTemplates)
      .where(eq(sessionTemplates.variant_id, v.id))
      .orderBy(sessionTemplates.position);
    sessionsByVariant[v.key] = sessionRows.map((s) => ({
      id: s.id,
      name: s.name,
      muscleGroups: s.muscle_groups
        ? (JSON.parse(s.muscle_groups) as string[])
        : null,
      position: s.position,
    }));
  }
  return { split, variants: variantRows, sessionsByVariant };
}

/** Returns all splits ordered by created_at descending. */
export async function getAllSplits(): Promise<SplitRow[]> {
  const rows = await db.select().from(splits).orderBy(desc(splits.created_at));
  return rows;
}

/** Deletes a split and all related cycles, cycle_state, session_templates, split_variants. */
export async function deleteSplit(splitId: string): Promise<void> {
  const cycleRows = await db
    .select({ id: cycles.id })
    .from(cycles)
    .where(eq(cycles.split_id, splitId));
  for (const c of cycleRows) {
    await db.delete(cycleState).where(eq(cycleState.cycle_id, c.id));
  }
  await db.delete(cycles).where(eq(cycles.split_id, splitId));

  const variantRows = await db
    .select({ id: splitVariants.id })
    .from(splitVariants)
    .where(eq(splitVariants.split_id, splitId));
  for (const v of variantRows) {
    await db
      .delete(sessionTemplates)
      .where(eq(sessionTemplates.variant_id, v.id));
  }
  await db.delete(splitVariants).where(eq(splitVariants.split_id, splitId));
  await db.delete(splits).where(eq(splits.id, splitId));
}

/** Returns the first split with its variants and sessions (no cycle). Use to detect NeedsRotation. */
export async function getSplitIfExists(): Promise<Omit<
  ActivePlan,
  "cycle"
> | null> {
  const splitRows = await db.select().from(splits).limit(1);
  const split = splitRows[0] ?? null;
  if (!split) return null;

  const variantRows = await db
    .select()
    .from(splitVariants)
    .where(eq(splitVariants.split_id, split.id))
    .orderBy(splitVariants.position);

  const sessionsByVariant: Record<string, SessionTemplateView[]> = {};
  for (const v of variantRows) {
    const sessionRows = await db
      .select()
      .from(sessionTemplates)
      .where(eq(sessionTemplates.variant_id, v.id))
      .orderBy(sessionTemplates.position);
    sessionsByVariant[v.key] = sessionRows.map((s) => ({
      id: s.id,
      name: s.name,
      muscleGroups: s.muscle_groups
        ? (JSON.parse(s.muscle_groups) as string[])
        : null,
      position: s.position,
    }));
  }
  return { split, variants: variantRows, sessionsByVariant };
}

export async function getActivePlan(): Promise<ActivePlan | null> {
  const activeCycles = await db
    .select()
    .from(cycles)
    .where(eq(cycles.is_active, true))
    .limit(1);

  const cycle = activeCycles[0] ?? null;
  if (!cycle) return null;

  const splitRows = await db
    .select()
    .from(splits)
    .where(eq(splits.id, cycle.split_id))
    .limit(1);
  const split = splitRows[0] ?? null;
  if (!split) return null;

  const variantRows = await db
    .select()
    .from(splitVariants)
    .where(eq(splitVariants.split_id, split.id))
    .orderBy(splitVariants.position);

  const sessionsByVariant: Record<string, SessionTemplateView[]> = {};

  for (const v of variantRows) {
    const sessionRows = await db
      .select()
      .from(sessionTemplates)
      .where(eq(sessionTemplates.variant_id, v.id))
      .orderBy(sessionTemplates.position);

    sessionsByVariant[v.key] = sessionRows.map((s) => ({
      id: s.id,
      name: s.name,
      muscleGroups: s.muscle_groups
        ? (JSON.parse(s.muscle_groups) as string[])
        : null,
      position: s.position,
    }));
  }

  return {
    split,
    variants: variantRows,
    sessionsByVariant,
    cycle,
  };
}

/** Returns cycle_state for cycleId; creates default row if missing. */
export async function getOrCreateCycleState(
  cycleId: string
): Promise<CycleStateRow> {
  const rows = await db
    .select()
    .from(cycleState)
    .where(eq(cycleState.cycle_id, cycleId))
    .limit(1);
  const existing = rows[0];
  if (existing) return existing;

  const now = new Date().toISOString();
  const id = uuid.v4();
  await db
    .insert(cycleState)
    .values({
      id,
      cycle_id: cycleId,
      current_variant_key: "A",
      session_index_a: 0,
      session_index_b: 0,
      session_index_c: 0,
      last_completed_at: null,
      created_at: now,
    })
    .onConflictDoNothing();
  const inserted = await db
    .select()
    .from(cycleState)
    .where(eq(cycleState.cycle_id, cycleId))
    .limit(1);
  const row = inserted[0];
  if (!row) throw new Error("Failed to read inserted cycle_state");
  return row;
}

/** Ensures exactly one cycle_state row exists for the cycle (creates default if missing). Alias for getOrCreateCycleState. */
export async function ensureCycleState(
  cycleId: string
): Promise<CycleStateRow> {
  return getOrCreateCycleState(cycleId);
}

/** Returns active plan plus cycle_state (created if missing). */
export async function getActiveCycleWithSplit(): Promise<ActivePlanWithState | null> {
  const plan = await getActivePlan();
  if (!plan) return null;
  const state = await ensureCycleState(plan.cycle.id);
  return { ...plan, cycleState: state };
}

export async function getWorkoutSessionsInRange(
  startMs: number,
  endMs: number
): Promise<WorkoutSessionSummary[]> {
  const rows = await db
    .select({
      id: workoutSessions.id,
      plannedSessionTemplateId: workoutSessions.planned_session_template_id,
      sessionTitle: workoutSessions.session_title,
      startedAt: workoutSessions.started_at,
      completedAt: workoutSessions.completed_at,
      durationMins: workoutSessions.duration_mins,
      totalVolumeKg: workoutSessions.total_volume_kg,
      totalSets: workoutSessions.total_sets,
      totalReps: workoutSessions.total_reps,
      muscleGroups: sessionTemplates.muscle_groups,
    })
    .from(workoutSessions)
    .leftJoin(
      sessionTemplates,
      eq(workoutSessions.planned_session_template_id, sessionTemplates.id)
    )
    .where(
      and(
        gte(workoutSessions.completed_at, startMs),
        lte(workoutSessions.completed_at, endMs)
      )
    )
    .orderBy(desc(workoutSessions.completed_at));

  return rows.map((row) => ({
    id: row.id,
    plannedSessionTemplateId: row.plannedSessionTemplateId,
    sessionTitle: row.sessionTitle,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    durationMins: row.durationMins ?? null,
    totalVolumeKg: row.totalVolumeKg ?? null,
    totalSets: row.totalSets,
    totalReps: row.totalReps,
    muscleGroups: parseMuscleGroups(row.muscleGroups ?? null),
  }));
}

export async function getWorkoutSessionDetail(
  sessionId: string
): Promise<WorkoutSessionDetail | null> {
  const rows = await db
    .select({
      id: workoutSessions.id,
      plannedSessionTemplateId: workoutSessions.planned_session_template_id,
      sessionTitle: workoutSessions.session_title,
      startedAt: workoutSessions.started_at,
      completedAt: workoutSessions.completed_at,
      durationMins: workoutSessions.duration_mins,
      totalVolumeKg: workoutSessions.total_volume_kg,
      totalSets: workoutSessions.total_sets,
      totalReps: workoutSessions.total_reps,
      muscleGroups: sessionTemplates.muscle_groups,
    })
    .from(workoutSessions)
    .leftJoin(
      sessionTemplates,
      eq(workoutSessions.planned_session_template_id, sessionTemplates.id)
    )
    .where(eq(workoutSessions.id, sessionId))
    .limit(1);

  const sessionRow = rows[0];
  if (!sessionRow) return null;

  const sets = await db
    .select()
    .from(workoutSets)
    .where(eq(workoutSets.session_id, sessionId))
    .orderBy(workoutSets.set_number);

  return {
    session: {
      id: sessionRow.id,
      plannedSessionTemplateId: sessionRow.plannedSessionTemplateId,
      sessionTitle: sessionRow.sessionTitle,
      startedAt: sessionRow.startedAt,
      completedAt: sessionRow.completedAt,
      durationMins: sessionRow.durationMins ?? null,
      totalVolumeKg: sessionRow.totalVolumeKg ?? null,
      totalSets: sessionRow.totalSets,
      totalReps: sessionRow.totalReps,
      muscleGroups: parseMuscleGroups(sessionRow.muscleGroups ?? null),
    },
    sets,
  };
}

export async function createWorkoutSession(
  input: CreateWorkoutSessionInput
): Promise<string> {
  const sessionId = String(uuid.v4());
  await db.insert(workoutSessions).values({
    id: sessionId,
    cycle_id: input.cycleId,
    planned_session_template_id: input.plannedSessionTemplateId,
    session_title: input.sessionTitle,
    started_at: input.startedAt,
    completed_at: input.completedAt,
    duration_mins: input.durationMins,
    total_volume_kg: input.totalVolumeKg,
    total_sets: input.totalSets,
    total_reps: input.totalReps,
  });

  if (input.sets.length > 0) {
    const setRows = input.sets.map((set) => ({
      id: String(uuid.v4()),
      session_id: sessionId,
      exercise_id: set.exerciseId,
      exercise_name: set.exerciseName,
      set_number: set.setNumber,
      weight: set.weight,
      reps: set.reps,
    }));
    await db.insert(workoutSets).values(setRows);
  }

  return sessionId;
}

export type ProfileStats = {
  totalSessions: number;
  totalVolumeKg: number;
  weeksTrained: number;
};

/** Aggregate stats for profile: total sessions, total volume, distinct weeks with at least one completed session. */
export async function getProfileStats(): Promise<ProfileStats> {
  const rows = await db
    .select({
      completedAt: workoutSessions.completed_at,
      totalVolumeKg: workoutSessions.total_volume_kg,
    })
    .from(workoutSessions);
  let totalVolumeKg = 0;
  const weekStarts = new Set<number>();
  for (const row of rows) {
    totalVolumeKg += row.totalVolumeKg ?? 0;
    const d = new Date(row.completedAt);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    weekStarts.add(d.getTime());
  }
  return {
    totalSessions: rows.length,
    totalVolumeKg,
    weeksTrained: weekStarts.size,
  };
}

export type BestLift = {
  exerciseName: string;
  weight: number;
  reps: number;
};

/** Per-exercise PR: max weight and reps at that weight from workout_sets (all time). */
export async function getBestLifts(): Promise<BestLift[]> {
  const rows = await db
    .select({
      exerciseName: workoutSets.exercise_name,
      weight: workoutSets.weight,
      reps: workoutSets.reps,
    })
    .from(workoutSets)
    .orderBy(desc(workoutSets.weight));
  const byName = new Map<string, BestLift>();
  for (const row of rows) {
    if (!byName.has(row.exerciseName)) {
      byName.set(row.exerciseName, {
        exerciseName: row.exerciseName,
        weight: row.weight,
        reps: row.reps,
      });
    }
  }
  return Array.from(byName.values());
}

/** Last weight used for an exercise (any time). From workout_sets join workout_sessions, most recent first. */
export async function getLastWeightForExercise(
  exerciseId: string
): Promise<number | null> {
  const rows = await db
    .select({ weight: workoutSets.weight })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSets.session_id, workoutSessions.id))
    .where(eq(workoutSets.exercise_id, exerciseId))
    .orderBy(desc(workoutSessions.completed_at))
    .limit(1);
  const row = rows[0];
  return row?.weight ?? null;
}

/** Last weight used for an exercise in the previous calendar week (Monday–Sunday). */
export async function getLastWeekWeightForExercise(
  exerciseId: string
): Promise<number | null> {
  const now = new Date();
  const thisWeekMonday = startOfWeek(now, { weekStartsOn: 1 });
  const lastWeekMonday = new Date(thisWeekMonday);
  lastWeekMonday.setDate(lastWeekMonday.getDate() - 7);
  const lastWeekSunday = new Date(lastWeekMonday);
  lastWeekSunday.setDate(lastWeekSunday.getDate() + 6);
  lastWeekSunday.setHours(23, 59, 59, 999);
  const startMs = lastWeekMonday.getTime();
  const endMs = lastWeekSunday.getTime();

  const rows = await db
    .select({ weight: workoutSets.weight })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSets.session_id, workoutSessions.id))
    .where(
      and(
        eq(workoutSets.exercise_id, exerciseId),
        gte(workoutSessions.completed_at, startMs),
        lte(workoutSessions.completed_at, endMs)
      )
    )
    .orderBy(desc(workoutSessions.completed_at))
    .limit(1);
  const row = rows[0];
  return row?.weight ?? null;
}

export async function getExercisesForSessionTemplate(
  sessionTemplateId: string
): Promise<PlanExercise[]> {
  const rows = await db
    .select()
    .from(sessionTemplateExercises)
    .where(eq(sessionTemplateExercises.session_template_id, sessionTemplateId))
    .orderBy(sessionTemplateExercises.position);
  return rows.map((r, i) => ({
    id: r.id,
    name: r.name,
    sets: r.sets,
    reps: r.reps,
    weight: r.weight,
  }));
}

export type SessionTemplateExerciseInput = {
  name: string;
  sets: number;
  reps: number;
  weight: number;
};

export async function addExerciseToSessionTemplate(
  sessionTemplateId: string,
  exercise: SessionTemplateExerciseInput,
  position?: number
): Promise<string> {
  const id = String(uuid.v4());
  let nextPosition: number;
  if (typeof position === "number") {
    nextPosition = position;
  } else {
    const posRows = await db
      .select({ pos: sessionTemplateExercises.position })
      .from(sessionTemplateExercises)
      .where(
        eq(sessionTemplateExercises.session_template_id, sessionTemplateId)
      )
      .orderBy(desc(sessionTemplateExercises.position))
      .limit(1);
    nextPosition = (posRows[0]?.pos ?? -1) + 1;
  }
  await db.insert(sessionTemplateExercises).values({
    id,
    session_template_id: sessionTemplateId,
    name: exercise.name,
    sets: exercise.sets,
    reps: exercise.reps,
    weight: exercise.weight,
    position: nextPosition,
  });
  return id;
}

export async function updateSessionTemplateExercise(
  exerciseRowId: string,
  updates: Partial<SessionTemplateExerciseInput> & { position?: number }
): Promise<void> {
  const set: Partial<Record<keyof SessionTemplateExerciseRow, unknown>> = {};
  if (updates.name !== undefined) set.name = updates.name;
  if (updates.sets !== undefined) set.sets = updates.sets;
  if (updates.reps !== undefined) set.reps = updates.reps;
  if (updates.weight !== undefined) set.weight = updates.weight;
  if (updates.position !== undefined) set.position = updates.position;
  if (Object.keys(set).length === 0) return;
  await db
    .update(sessionTemplateExercises)
    .set(set as Record<string, unknown>)
    .where(eq(sessionTemplateExercises.id, exerciseRowId));
}

export async function deleteSessionTemplateExercise(
  exerciseRowId: string
): Promise<void> {
  await db
    .delete(sessionTemplateExercises)
    .where(eq(sessionTemplateExercises.id, exerciseRowId));
}

const TEMPLATES = {
  "ppl-ab": {
    name: "Push / Pull / Legs (A/B)",
    variants: [
      { key: "A", sessions: ["Push", "Pull", "Legs"] },
      { key: "B", sessions: ["Push", "Pull", "Legs"] },
    ],
  },
  "upper-lower-ab": {
    name: "Upper / Lower (A/B)",
    variants: [
      {
        key: "A",
        sessions: ["Upper Body", "Lower Body", "Upper Body", "Lower Body"],
      },
      {
        key: "B",
        sessions: ["Upper Body", "Lower Body", "Upper Body", "Lower Body"],
      },
    ],
  },
  "full-body-abc": {
    name: "Full Body (A/B/C)",
    variants: [
      { key: "A", sessions: ["Full Body A", "Full Body A", "Full Body A"] },
      { key: "B", sessions: ["Full Body B", "Full Body B", "Full Body B"] },
      { key: "C", sessions: ["Full Body C", "Full Body C", "Full Body C"] },
    ],
  },
} as const;

export type TemplateId = keyof typeof TEMPLATES;

export async function createTemplateSplit(
  templateId: TemplateId
): Promise<string> {
  const template = TEMPLATES[templateId];
  if (!template) throw new Error(`Unknown template: ${templateId}`);

  const variants: CustomVariantInput[] = template.variants.map((v) => ({
    key: v.key,
    sessionNames: [...v.sessions],
  }));
  return createSplitWithVariantsAndSessions(template.name, variants);
}

export type CustomVariantInput = { key: string; sessionNames: string[] };

/** Creates a split with variants and session templates. Returns splitId. */
export async function createSplitWithVariantsAndSessions(
  name: string,
  variants: CustomVariantInput[]
): Promise<string> {
  if (variants.length === 0) throw new Error("At least one variant required");
  const splitId = uuid.v4();
  const now = new Date().toISOString();

  await db.insert(splits).values({
    id: splitId,
    name,
    created_at: now,
  });

  for (let v = 0; v < variants.length; v += 1) {
    const variantId = uuid.v4();
    await db.insert(splitVariants).values({
      id: variantId,
      split_id: splitId,
      key: variants[v].key,
      name: `Week ${variants[v].key}`,
      position: v,
    });
    const sessionRows = variants[v].sessionNames.map((sessionName, i) => ({
      id: uuid.v4(),
      variant_id: variantId,
      name: sessionName,
      muscle_groups: JSON.stringify([]),
      position: i,
    }));
    await db.insert(sessionTemplates).values(sessionRows);
  }

  return splitId;
}

export async function createCustomSplit(
  splitName: string,
  variants: CustomVariantInput[]
): Promise<string> {
  return createSplitWithVariantsAndSessions(splitName, variants);
}

export async function createOrUpdateCycle(
  splitId: string,
  rotationType: RotationType,
  anchorWeekStart: string,
  cycleId?: string
): Promise<string> {
  const now = new Date().toISOString();
  const id = cycleId ?? uuid.v4();

  await db
    .update(cycles)
    .set({ is_active: false })
    .where(sql`1 = 1`);

  const existing = await db
    .select()
    .from(cycles)
    .where(eq(cycles.id, id))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(cycles)
      .set({
        rotation: rotationType,
        anchor_week_start: anchorWeekStart,
        is_active: true,
      })
      .where(eq(cycles.id, id));
  } else {
    await db.insert(cycles).values({
      id,
      split_id: splitId,
      rotation: rotationType,
      anchor_week_start: anchorWeekStart,
      created_at: now,
      is_active: true,
    });
  }

  await db.delete(cycleState).where(eq(cycleState.cycle_id, id));

  return id;
}

export async function resetPlan(): Promise<void> {
  const active = await db
    .select()
    .from(cycles)
    .where(eq(cycles.is_active, true))
    .limit(1);
  if (active.length === 0) return;
  const splitId = active[0].split_id;

  await db.delete(cycles).where(eq(cycles.split_id, splitId));

  const variantRows = await db
    .select({ id: splitVariants.id })
    .from(splitVariants)
    .where(eq(splitVariants.split_id, splitId));
  for (const v of variantRows) {
    await db
      .delete(sessionTemplates)
      .where(eq(sessionTemplates.variant_id, v.id));
  }
  await db.delete(splitVariants).where(eq(splitVariants.split_id, splitId));
  await db.delete(splits).where(eq(splits.id, splitId));
}

/** Clears all planner tables (cycle_state, cycles, session_templates, split_variants, splits). For dev reset. */
export async function resetPlannerDatabase(): Promise<void> {
  await db.delete(cycleState);
  await db.delete(cycles);
  await db.delete(sessionTemplates);
  await db.delete(splitVariants);
  await db.delete(splits);
}

/** Variant key for week display (ALTERNATE_AB: anchored to cycle start, A/B alternating; SAME_EVERY_WEEK: always A). */
export function getVariantKeyForWeekDisplay(
  rotationType: RotationType,
  anchorWeekStart: string,
  weekStartMonday: Date
): string {
  if (rotationType === "SAME_EVERY_WEEK") return "A";
  const cycleStartWeekStart = startOfWeek(new Date(anchorWeekStart), {
    weekStartsOn: 1,
  });
  const viewedWeekStart = startOfWeek(weekStartMonday, { weekStartsOn: 1 });
  const weekIndex = differenceInCalendarWeeks(
    viewedWeekStart,
    cycleStartWeekStart,
    {
      weekStartsOn: 1,
    }
  );
  return weekIndex % 2 === 0 ? "A" : "B";
}

export function getVariantKeyForWeek(
  rotation: string[],
  anchorWeekStart: string,
  weekStartMonday: Date
): string {
  if (rotation.length === 0) return "A";
  const anchor = new Date(anchorWeekStart);
  anchor.setHours(0, 0, 0, 0);
  const weekStart = new Date(weekStartMonday);
  weekStart.setHours(0, 0, 0, 0);
  const diffMs = weekStart.getTime() - anchor.getTime();
  const weeksSinceAnchor = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  const index =
    ((weeksSinceAnchor % rotation.length) + rotation.length) % rotation.length;
  return rotation[index] ?? "A";
}

export { parseRotation };

/** Build week session list and variant key for a given week start (Monday). Uses rotation type for display. */
export function getWeekSessionsFromPlan(
  plan: ActivePlan,
  weekStartMonday: Date
): {
  variantKey: string;
  sessions: SessionTemplateView[];
  totalPlanned: number;
} {
  const rotationType = getRotationType(plan.cycle.rotation);
  const variantKey = getVariantKeyForWeekDisplay(
    rotationType,
    plan.cycle.anchor_week_start,
    weekStartMonday
  );
  const sessions = plan.sessionsByVariant[variantKey] ?? [];
  return {
    variantKey,
    sessions,
    totalPlanned: sessions.length,
  };
}

export async function updateSplit(
  splitId: string,
  name: string
): Promise<void> {
  await db.update(splits).set({ name }).where(eq(splits.id, splitId));
}

/**
 * Updates split name and syncs variants/sessions to match the given payload.
 * Deletes existing variants/sessions for the split and reinserts.
 * Migrates session template exercises by (variantKey, position) so edit doesn't wipe them.
 */
export async function updateSplitWithVariantsAndSessions(
  splitId: string,
  name: string,
  variants: CustomVariantInput[]
): Promise<void> {
  if (variants.length === 0) throw new Error("At least one variant required");

  await db.update(splits).set({ name }).where(eq(splits.id, splitId));

  const variantRows = await db
    .select({ id: splitVariants.id, key: splitVariants.key })
    .from(splitVariants)
    .where(eq(splitVariants.split_id, splitId));

  const oldExercisesByKey: Record<
    string,
    {
      name: string;
      sets: number;
      reps: number;
      weight: number;
      position: number;
    }[]
  > = {};
  for (const v of variantRows) {
    const sessionRows = await db
      .select({
        id: sessionTemplates.id,
        name: sessionTemplates.name,
        position: sessionTemplates.position,
      })
      .from(sessionTemplates)
      .where(eq(sessionTemplates.variant_id, v.id))
      .orderBy(sessionTemplates.position);
    for (const s of sessionRows) {
      const exRows = await db
        .select()
        .from(sessionTemplateExercises)
        .where(eq(sessionTemplateExercises.session_template_id, s.id))
        .orderBy(sessionTemplateExercises.position);
      const key = `${v.key}-${s.position}`;
      oldExercisesByKey[key] = exRows.map((r) => ({
        name: r.name,
        sets: r.sets,
        reps: r.reps,
        weight: r.weight,
        position: r.position,
      }));
    }
  }

  for (const v of variantRows) {
    await db
      .delete(sessionTemplates)
      .where(eq(sessionTemplates.variant_id, v.id));
  }
  await db.delete(splitVariants).where(eq(splitVariants.split_id, splitId));

  const newTemplateIdsByKey: Record<string, string> = {};
  for (let v = 0; v < variants.length; v += 1) {
    const variantId = String(uuid.v4());
    await db.insert(splitVariants).values({
      id: variantId,
      split_id: splitId,
      key: variants[v].key,
      name: `Week ${variants[v].key}`,
      position: v,
    });
    const sessionRows = variants[v].sessionNames.map((sessionName, i) => {
      const id = String(uuid.v4());
      newTemplateIdsByKey[`${variants[v].key}-${i}`] = id;
      return {
        id,
        variant_id: variantId,
        name: sessionName,
        muscle_groups: JSON.stringify([]),
        position: i,
      };
    });
    await db.insert(sessionTemplates).values(sessionRows);
  }

  for (const key of Object.keys(oldExercisesByKey)) {
    const exercises = oldExercisesByKey[key];
    if (exercises.length === 0) continue;
    const newTemplateId = newTemplateIdsByKey[key];
    if (!newTemplateId) continue;
    for (let i = 0; i < exercises.length; i += 1) {
      const ex = exercises[i];
      await db.insert(sessionTemplateExercises).values({
        id: String(uuid.v4()),
        session_template_id: newTemplateId,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        position: i,
      });
    }
  }
}

/** Returns the session template id that is "up next" based on cycle_state and rotation type. */
export function getUpNextSessionId(
  plan: ActivePlan,
  state: CycleStateRow
): string | null {
  const rotationType = getRotationType(plan.cycle.rotation);
  const sessionsA = plan.sessionsByVariant["A"] ?? [];
  const sessionsB = plan.sessionsByVariant["B"] ?? [];

  if (rotationType === "SAME_EVERY_WEEK") {
    if (sessionsA.length === 0) return null;
    const idx = state.session_index_a % sessionsA.length;
    return sessionsA[idx]?.id ?? null;
  }

  if (rotationType === "ALTERNATE_AB") {
    const key = state.current_variant_key;
    const sessions = key === "B" ? sessionsB : sessionsA;
    const idx =
      key === "B"
        ? state.session_index_b % sessions.length
        : state.session_index_a % sessions.length;
    return sessions[idx]?.id ?? null;
  }

  return null;
}

export type UpNextSession = {
  variantKey: string;
  sessionName: string;
  sessionId: string;
};

/** Next session from cycle_state: { variantKey, sessionTemplateId, name }. Used for "Up next" (Model B). */
export type NextSession = {
  variantKey: string;
  sessionTemplateId: string;
  name: string;
};

/** Returns the next session from cycle_state (variant + template id + name). Sync; use with plan + state. */
export function getNextSessionFromPlan(
  plan: ActivePlan,
  state: CycleStateRow
): NextSession | null {
  const sessionId = getUpNextSessionId(plan, state);
  if (!sessionId) return null;
  for (const [key, sessions] of Object.entries(plan.sessionsByVariant)) {
    const session = sessions.find((s) => s.id === sessionId);
    if (session)
      return {
        variantKey: key,
        sessionTemplateId: session.id,
        name: session.name,
      };
  }
  return null;
}

/** Loads active plan + state and returns next session for the given cycle (or null if not active). viewedWeekStart is optional (for future filtering). */
export async function getNextSession(
  cycleId: string,
  _viewedWeekStart?: Date
): Promise<NextSession | null> {
  const planWithState = await getActiveCycleWithSplit();
  if (!planWithState || planWithState.cycle.id !== cycleId) return null;
  return getNextSessionFromPlan(planWithState, planWithState.cycleState);
}

/** Returns up-next session info for display (e.g. "Today: Variant A — Push"). */
export function getUpNextSession(
  plan: ActivePlan,
  state: CycleStateRow
): UpNextSession | null {
  const sessionId = getUpNextSessionId(plan, state);
  if (!sessionId) return null;
  for (const [key, sessions] of Object.entries(plan.sessionsByVariant)) {
    const session = sessions.find((s) => s.id === sessionId);
    if (session)
      return { variantKey: key, sessionName: session.name, sessionId };
  }
  return null;
}

/**
 * Advances cycle_state after a workout is completed.
 * No completion table exists; only state is updated.
 * SAME_EVERY_WEEK: increment session_index_a mod A count.
 * ALTERNATE_AB: if current A -> advance session_index_a, set current_variant_key B; else advance session_index_b, set current_variant_key A.
 * Returns the new "next" session after advancing.
 */
export async function completeWorkoutAndAdvance(
  cycleId: string,
  plan: ActivePlan
): Promise<NextSession | null> {
  const state = await ensureCycleState(cycleId);
  const rotationType = getRotationType(plan.cycle.rotation);
  const sessionsA = plan.sessionsByVariant["A"] ?? [];
  const sessionsB = plan.sessionsByVariant["B"] ?? [];
  const countA = sessionsA.length || 1;
  const countB = sessionsB.length || 1;
  const now = new Date().toISOString();

  if (rotationType === "SAME_EVERY_WEEK") {
    await db
      .update(cycleState)
      .set({
        session_index_a: (state.session_index_a + 1) % countA,
        last_completed_at: now,
      })
      .where(eq(cycleState.cycle_id, cycleId));
  } else if (rotationType === "ALTERNATE_AB") {
    if (state.current_variant_key === "A") {
      await db
        .update(cycleState)
        .set({
          session_index_a: (state.session_index_a + 1) % countA,
          current_variant_key: "B",
          last_completed_at: now,
        })
        .where(eq(cycleState.cycle_id, cycleId));
    } else {
      await db
        .update(cycleState)
        .set({
          session_index_b: (state.session_index_b + 1) % countB,
          current_variant_key: "A",
          last_completed_at: now,
        })
        .where(eq(cycleState.cycle_id, cycleId));
    }
  }

  const newState = await getOrCreateCycleState(cycleId);
  return getNextSessionFromPlan(plan, newState);
}

export async function completePlannedSession(
  cycleId: string,
  plan: ActivePlan,
  sessionTemplateId: string
): Promise<void> {
  const state = await ensureCycleState(cycleId);
  const entries = Object.entries(plan.sessionsByVariant);
  const match = entries.find(([, sessions]) =>
    sessions.some((session) => session.id === sessionTemplateId)
  );
  if (!match) return;

  const [variantKey, sessions] = match;
  const index = sessions.findIndex(
    (session) => session.id === sessionTemplateId
  );
  if (index < 0) return;

  const count = sessions.length || 1;
  const nextIndex = (index + 1) % count;
  const now = new Date().toISOString();

  const update =
    variantKey === "B"
      ? {
          session_index_b: nextIndex,
          current_variant_key: "B",
          last_completed_at: now,
        }
      : variantKey === "C"
        ? {
            session_index_c: nextIndex,
            current_variant_key: "C",
            last_completed_at: now,
          }
        : {
            session_index_a: nextIndex,
            current_variant_key: "A",
            last_completed_at: now,
          };

  if (state) {
    await db
      .update(cycleState)
      .set(update)
      .where(eq(cycleState.cycle_id, cycleId));
  }
}
