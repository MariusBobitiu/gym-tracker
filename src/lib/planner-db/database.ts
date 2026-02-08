import { open } from "@op-engineering/op-sqlite";
import { drizzle } from "drizzle-orm/op-sqlite";

type PlannerDb = ReturnType<typeof drizzle>;

const DEFAULT_DB_NAME = "planner_guest";
const dbCache = new Map<string, PlannerDb>();
let activeDbName = DEFAULT_DB_NAME;

function normalizeUserId(userId: string): string {
  const trimmed = userId.trim();
  if (!trimmed) return "guest";
  return trimmed.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function normalizeDbName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return DEFAULT_DB_NAME;
  return trimmed.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function getOrCreateDb(name: string): PlannerDb {
  const normalized = normalizeDbName(name);
  const existing = dbCache.get(normalized);
  if (existing) return existing;
  const opsqliteDb = open({ name: normalized });
  const created = drizzle(opsqliteDb);
  dbCache.set(normalized, created);
  return created;
}

export function resolvePlannerDbName(
  userId: string | null | undefined
): string {
  if (!userId) return DEFAULT_DB_NAME;
  return `planner_${normalizeUserId(userId)}`;
}

export function getActivePlannerDbName(): string {
  return activeDbName;
}

export function setActivePlannerDbName(name: string): PlannerDb {
  const nextName = normalizeDbName(name);
  const nextDb = getOrCreateDb(nextName);
  activeDbName = nextName;
  db = nextDb;
  return nextDb;
}

export let db: PlannerDb = getOrCreateDb(activeDbName);
