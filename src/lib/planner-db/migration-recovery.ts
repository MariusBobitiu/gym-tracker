/**
 * Migration recovery utilities to handle corrupted database states.
 * Detects and fixes cases where tables exist but migrations failed.
 */

import { db } from "@/lib/planner-db/database";

const PLANNER_TABLES = [
  "splits",
  "split_variants",
  "session_templates",
  "session_template_exercises",
  "cycles",
  "cycle_state",
  "workout_sessions",
  "workout_sets",
] as const;

type QueryResult = { rows?: Record<string, unknown>[] };

async function getTableNames(): Promise<Set<string>> {
  const drizzleDb = db as {
    $client?: { execute: (query: string) => Promise<QueryResult> };
  };
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

async function checkMigrationsTableExists(): Promise<boolean> {
  const drizzleDb = db as {
    $client?: { execute: (query: string) => Promise<QueryResult> };
  };
  const client = drizzleDb.$client;
  if (!client?.execute) {
    return false;
  }
  try {
    const result = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='__drizzle_migrations'"
    );
    const rows = (result as QueryResult).rows ?? [];
    return rows.length > 0;
  } catch {
    return false;
  }
}

/**
 * Drops all planner tables. Use when migration state is corrupted.
 */
async function dropAllPlannerTables(): Promise<void> {
  const drizzleDb = db as {
    $client?: { execute: (query: string) => Promise<QueryResult> };
  };
  const client = drizzleDb.$client;
  if (!client?.execute) {
    return;
  }

  const tableNames = await getTableNames();

  // Drop tables in reverse dependency order to avoid foreign key errors
  const dropOrder = [
    "workout_sets",
    "workout_sessions",
    "cycle_state",
    "cycles",
    "session_template_exercises",
    "session_templates",
    "split_variants",
    "splits",
  ];

  for (const tableName of dropOrder) {
    if (tableNames.has(tableName)) {
      try {
        await client.execute(`DROP TABLE IF EXISTS \`${tableName}\``);
      } catch (error) {
        console.warn(
          `[Migration Recovery] Failed to drop table ${tableName}:`,
          error
        );
      }
    }
  }

  // Also drop the migrations table if it exists
  if (tableNames.has("__drizzle_migrations")) {
    try {
      await client.execute("DROP TABLE IF EXISTS `__drizzle_migrations`");
    } catch (error) {
      console.warn(
        "[Migration Recovery] Failed to drop migrations table:",
        error
      );
    }
  }
}

/**
 * Checks if database is in a corrupted migration state:
 * - Planner tables exist but migrations table doesn't exist or is incomplete
 * - Returns true if recovery is needed
 */
export async function needsMigrationRecovery(): Promise<boolean> {
  const tableNames = await getTableNames();
  const hasPlannerTables = PLANNER_TABLES.some((table) =>
    tableNames.has(table)
  );

  if (!hasPlannerTables) {
    // No planner tables, migrations can run normally
    return false;
  }

  // Planner tables exist, check if migrations table exists
  const hasMigrationsTable = await checkMigrationsTableExists();

  // If tables exist but migrations table doesn't, state is corrupted
  return !hasMigrationsTable;
}

/**
 * Recovers from corrupted migration state by dropping all tables.
 * Call this before running migrations if needsMigrationRecovery returns true.
 */
export async function recoverMigrationState(): Promise<void> {
  console.log(
    "[Migration Recovery] Detected corrupted migration state, dropping all tables..."
  );
  await dropAllPlannerTables();
  console.log(
    "[Migration Recovery] Tables dropped, migrations can now run fresh"
  );
}

/**
 * Checks if an error is a "table already exists" error that indicates corrupted state.
 */
export function isTableExistsError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes("table") &&
    (message.includes("already exists") ||
      message.includes("duplicate table") ||
      message.includes("failed query: create table"))
  );
}
