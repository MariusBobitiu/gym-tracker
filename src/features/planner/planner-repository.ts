import { differenceInCalendarWeeks, startOfWeek } from "date-fns";
import { eq, sql } from "drizzle-orm";
import uuid from "react-native-uuid";
import { db } from "@/lib/planner-db/database";
import { startOfWeekMonday } from "@/features/planner/date-utils";
import {
  cycleState,
  cycles,
  sessionTemplates,
  splitVariants,
  splits,
} from "@/lib/planner-db/schema";
import type { InferSelectModel } from "drizzle-orm";

export type SplitRow = InferSelectModel<typeof splits>;
export type SplitVariantRow = InferSelectModel<typeof splitVariants>;
export type SessionTemplateRow = InferSelectModel<typeof sessionTemplates>;
export type CycleRow = InferSelectModel<typeof cycles>;
export type CycleStateRow = InferSelectModel<typeof cycleState>;

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

export type RotationType = "SAME_EVERY_WEEK" | "ALTERNATE_AB";

/** Normalize rotation value to SAME_EVERY_WEEK or ALTERNATE_AB. Handles legacy JSON array. */
export function getRotationType(rotation: string): RotationType {
  if (rotation === "SAME_EVERY_WEEK" || rotation === "ALTERNATE_AB") return rotation;
  try {
    const arr = JSON.parse(rotation) as unknown;
    const list = Array.isArray(arr) ? arr : [];
    return list.length >= 2 ? "ALTERNATE_AB" : "SAME_EVERY_WEEK";
  } catch {
    return "SAME_EVERY_WEEK";
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
  const splitRows = await db.select().from(splits).where(eq(splits.id, splitId)).limit(1);
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
      muscleGroups: s.muscle_groups ? (JSON.parse(s.muscle_groups) as string[]) : null,
      position: s.position,
    }));
  }
  return { split, variants: variantRows, sessionsByVariant };
}

/** Returns the first split with its variants and sessions (no cycle). Use to detect NeedsRotation. */
export async function getSplitIfExists(): Promise<Omit<ActivePlan, "cycle"> | null> {
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
      muscleGroups: s.muscle_groups ? (JSON.parse(s.muscle_groups) as string[]) : null,
      position: s.position,
    }));
  }
  return { split, variants: variantRows, sessionsByVariant };
}

export async function getActivePlan(): Promise<ActivePlan | null> {
  const activeCycles = await db.select().from(cycles).where(eq(cycles.is_active, true)).limit(1);

  const cycle = activeCycles[0] ?? null;
  if (!cycle) return null;

  const splitRows = await db.select().from(splits).where(eq(splits.id, cycle.split_id)).limit(1);
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
      muscleGroups: s.muscle_groups ? (JSON.parse(s.muscle_groups) as string[]) : null,
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
export async function getOrCreateCycleState(cycleId: string): Promise<CycleStateRow> {
  const rows = await db.select().from(cycleState).where(eq(cycleState.cycle_id, cycleId)).limit(1);
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
export async function ensureCycleState(cycleId: string): Promise<CycleStateRow> {
  return getOrCreateCycleState(cycleId);
}

/** Returns active plan plus cycle_state (created if missing). */
export async function getActiveCycleWithSplit(): Promise<ActivePlanWithState | null> {
  const plan = await getActivePlan();
  if (!plan) return null;
  const state = await ensureCycleState(plan.cycle.id);
  return { ...plan, cycleState: state };
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
      { key: "A", sessions: ["Upper Body", "Lower Body", "Upper Body", "Lower Body"] },
      { key: "B", sessions: ["Upper Body", "Lower Body", "Upper Body", "Lower Body"] },
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

export async function createTemplateSplit(templateId: TemplateId): Promise<string> {
  const template = TEMPLATES[templateId];
  if (!template) throw new Error(`Unknown template: ${templateId}`);

  const variants: CustomVariantInput[] = template.variants.map((v) => ({
    key: v.key,
    sessionNames: v.sessions,
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

  const existing = await db.select().from(cycles).where(eq(cycles.id, id)).limit(1);

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
  const active = await db.select().from(cycles).where(eq(cycles.is_active, true)).limit(1);
  if (active.length === 0) return;
  const splitId = active[0].split_id;

  await db.delete(cycles).where(eq(cycles.split_id, splitId));

  const variantRows = await db
    .select({ id: splitVariants.id })
    .from(splitVariants)
    .where(eq(splitVariants.split_id, splitId));
  for (const v of variantRows) {
    await db.delete(sessionTemplates).where(eq(sessionTemplates.variant_id, v.id));
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
  const cycleStartWeekStart = startOfWeek(new Date(anchorWeekStart), { weekStartsOn: 1 });
  const viewedWeekStart = startOfWeek(weekStartMonday, { weekStartsOn: 1 });
  const weekIndex = differenceInCalendarWeeks(viewedWeekStart, cycleStartWeekStart, {
    weekStartsOn: 1,
  });
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
  const index = ((weeksSinceAnchor % rotation.length) + rotation.length) % rotation.length;
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

export async function updateSplit(splitId: string, name: string): Promise<void> {
  await db.update(splits).set({ name }).where(eq(splits.id, splitId));
}

/**
 * Updates split name and syncs variants/sessions to match the given payload.
 * Deletes existing variants/sessions for the split and reinserts.
 */
export async function updateSplitWithVariantsAndSessions(
  splitId: string,
  name: string,
  variants: CustomVariantInput[]
): Promise<void> {
  if (variants.length === 0) throw new Error("At least one variant required");

  await db.update(splits).set({ name }).where(eq(splits.id, splitId));

  const variantRows = await db
    .select({ id: splitVariants.id })
    .from(splitVariants)
    .where(eq(splitVariants.split_id, splitId));

  for (const v of variantRows) {
    await db.delete(sessionTemplates).where(eq(sessionTemplates.variant_id, v.id));
  }
  await db.delete(splitVariants).where(eq(splitVariants.split_id, splitId));

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
}

/** Returns the session template id that is "up next" based on cycle_state and rotation type. */
export function getUpNextSessionId(plan: ActivePlan, state: CycleStateRow): string | null {
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

export type UpNextSession = { variantKey: string; sessionName: string; sessionId: string };

/** Next session from cycle_state: { variantKey, sessionTemplateId, name }. Used for "Up next" (Model B). */
export type NextSession = {
  variantKey: string;
  sessionTemplateId: string;
  name: string;
};

/** Returns the next session from cycle_state (variant + template id + name). Sync; use with plan + state. */
export function getNextSessionFromPlan(plan: ActivePlan, state: CycleStateRow): NextSession | null {
  const sessionId = getUpNextSessionId(plan, state);
  if (!sessionId) return null;
  for (const [key, sessions] of Object.entries(plan.sessionsByVariant)) {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) return { variantKey: key, sessionTemplateId: session.id, name: session.name };
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
export function getUpNextSession(plan: ActivePlan, state: CycleStateRow): UpNextSession | null {
  const sessionId = getUpNextSessionId(plan, state);
  if (!sessionId) return null;
  for (const [key, sessions] of Object.entries(plan.sessionsByVariant)) {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) return { variantKey: key, sessionName: session.name, sessionId };
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
  const index = sessions.findIndex((session) => session.id === sessionTemplateId);
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
    await db.update(cycleState).set(update).where(eq(cycleState.cycle_id, cycleId));
  }
}
