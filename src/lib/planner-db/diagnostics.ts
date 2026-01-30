/**
 * DB diagnostics: verify tables exist and log row counts.
 * Call from Planner __DEV__ button or on boot when __DEV__.
 */

import { db } from "@/lib/planner-db/database";
import {
  cycleState,
  cycles,
  sessionTemplates,
  splitVariants,
  splits,
} from "@/lib/planner-db/schema";

const PLANNER_TABLES = [
  "splits",
  "split_variants",
  "session_templates",
  "cycles",
  "cycle_state",
] as const;

type TableName = (typeof PLANNER_TABLES)[number];

type DiagnosticsResult = {
  tables: Record<TableName, boolean>;
  counts: Record<TableName, number>;
};

type QueryResult = { rows?: Record<string, unknown>[] };

async function getTableNames(): Promise<Set<string>> {
  const drizzleDb = db as { $client?: { execute: (query: string) => Promise<QueryResult> } };
  const client = drizzleDb.$client;
  if (!client?.execute) {
    return new Set();
  }
  const result = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );
  const rows = (result as QueryResult).rows ?? [];
  return new Set(rows.map((r) => r.name as string).filter(Boolean));
}

async function getCount(table: TableName): Promise<number> {
  const tableMap = {
    splits,
    split_variants: splitVariants,
    session_templates: sessionTemplates,
    cycles,
    cycle_state: cycleState,
  };
  const t = tableMap[table];
  const rows = await db.select().from(t);
  return rows.length;
}

/**
 * Runs planner DB diagnostics: which tables exist and row counts.
 * Logs result with [Planner DB] prefix so it's obvious in dev.
 */
export async function runPlannerDbDiagnostics(): Promise<void> {
  const tables: Record<string, boolean> = {};
  const counts: Record<string, number> = {};

  let tableNames: Set<string>;
  try {
    tableNames = await getTableNames();
  } catch (e) {
    console.warn("[Planner DB] Failed to read sqlite_master:", e);
    tableNames = new Set();
  }

  for (const name of PLANNER_TABLES) {
    const exists = tableNames.has(name);
    tables[name] = exists;
    if (!exists) {
      counts[name] = 0;
      continue;
    }
    try {
      counts[name] = await getCount(name);
    } catch (e) {
      console.warn(`[Planner DB] Failed to count ${name}:`, e);
      counts[name] = -1;
    }
  }

  const result: DiagnosticsResult = {
    tables: tables as DiagnosticsResult["tables"],
    counts: counts as DiagnosticsResult["counts"],
  };
  console.log("[Planner DB] Diagnostics:", JSON.stringify(result, null, 2));
}
