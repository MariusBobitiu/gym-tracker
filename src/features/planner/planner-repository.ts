import { eq } from "drizzle-orm";
import uuid from "react-native-uuid";
import { db } from "@/lib/planner-db/database";
import { cycles, sessionTemplates, splitVariants, splits } from "@/lib/planner-db/schema";
import type { InferSelectModel } from "drizzle-orm";

export type SplitRow = InferSelectModel<typeof splits>;
export type SplitVariantRow = InferSelectModel<typeof splitVariants>;
export type SessionTemplateRow = InferSelectModel<typeof sessionTemplates>;
export type CycleRow = InferSelectModel<typeof cycles>;

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

function parseRotation(rotationJson: string): string[] {
  try {
    const arr = JSON.parse(rotationJson) as unknown;
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
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

  const splitId = uuid.v4();
  const now = new Date().toISOString();

  await db.insert(splits).values({
    id: splitId,
    name: template.name,
    created_at: now,
  });

  let position = 0;
  for (const v of template.variants) {
    const variantId = uuid.v4();
    await db.insert(splitVariants).values({
      id: variantId,
      split_id: splitId,
      key: v.key,
      name: `Week ${v.key}`,
      position,
    });
    position += 1;

    const sessionRows = v.sessions.map((name, i) => ({
      id: uuid.v4(),
      variant_id: variantId,
      name,
      muscle_groups: JSON.stringify([]),
      position: i,
    }));
    await db.insert(sessionTemplates).values(sessionRows);
  }

  return splitId;
}

export type CustomVariantInput = { key: string; sessionNames: string[] };

export async function createCustomSplit(
  splitName: string,
  variants: CustomVariantInput[]
): Promise<string> {
  if (variants.length === 0) throw new Error("At least one variant required");
  const splitId = uuid.v4();
  const now = new Date().toISOString();

  await db.insert(splits).values({
    id: splitId,
    name: splitName,
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
    const sessionRows = variants[v].sessionNames.map((name, i) => ({
      id: uuid.v4(),
      variant_id: variantId,
      name,
      muscle_groups: JSON.stringify([]),
      position: i,
    }));
    await db.insert(sessionTemplates).values(sessionRows);
  }

  return splitId;
}

export async function createOrUpdateCycle(
  splitId: string,
  rotation: string[],
  anchorWeekStart: string,
  cycleId?: string
): Promise<string> {
  const now = new Date().toISOString();
  const id = cycleId ?? uuid.v4();

  await db.update(cycles).set({ is_active: false }).where(eq(cycles.split_id, splitId));

  const existing = await db.select().from(cycles).where(eq(cycles.id, id)).limit(1);

  if (existing.length > 0) {
    await db
      .update(cycles)
      .set({
        rotation: JSON.stringify(rotation),
        anchor_week_start: anchorWeekStart,
        is_active: true,
      })
      .where(eq(cycles.id, id));
  } else {
    await db.insert(cycles).values({
      id,
      split_id: splitId,
      rotation: JSON.stringify(rotation),
      anchor_week_start: anchorWeekStart,
      created_at: now,
      is_active: true,
    });
  }

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

/** Build week session list and variant key for a given week start (Monday). */
export function getWeekSessionsFromPlan(
  plan: ActivePlan,
  weekStartMonday: Date
): {
  variantKey: string;
  sessions: SessionTemplateView[];
  totalPlanned: number;
} {
  const rotation = parseRotation(plan.cycle.rotation);
  const variantKey = getVariantKeyForWeek(rotation, plan.cycle.anchor_week_start, weekStartMonday);
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
