import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useMigrations } from "drizzle-orm/op-sqlite/migrator";
import {
  resolvePlannerDbName,
  setActivePlannerDbName,
} from "@/lib/planner-db/database";
import { runPlannerDbDiagnostics } from "@/lib/planner-db/diagnostics";
import {
  needsMigrationRecovery,
  recoverMigrationState,
  isTableExistsError,
} from "@/lib/planner-db/migration-recovery";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/lib/theme-context";
import { useAuth } from "@/lib/auth/context";

type MigrationConfig = {
  journal: {
    entries: { idx: number; when: number; tag: string; breakpoints: boolean }[];
  };
  migrations: Record<string, string>;
};

// Load generated migrations (drizzle/migrations.js imports .sql; babel inline-import inlines .sql)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const migrationsConfig = require("../../../drizzle/migrations.js")
  .default as MigrationConfig;

type PlannerDbProviderProps = {
  children: React.ReactNode;
};

type PlannerDbProviderInnerProps = {
  dbName: string;
  children: React.ReactNode;
};

/**
 * Runs Drizzle migrations for the planner DB before rendering children.
 * Use inside (app) layout so planner screens never read before migrations complete.
 */
export function PlannerDbProvider({
  children,
}: PlannerDbProviderProps): React.ReactElement {
  const { user, status } = useAuth();
  const { colors } = useTheme();
  const targetDbName = useMemo(() => {
    if (status === "loading") return null;
    return resolvePlannerDbName(user?.id ?? null);
  }, [status, user?.id]);

  if (!targetDbName) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: colors.mutedForeground }}>Preparing...</Text>
      </View>
    );
  }

  return (
    <PlannerDbProviderInner key={targetDbName} dbName={targetDbName}>
      {children}
    </PlannerDbProviderInner>
  );
}

function PlannerDbProviderInner({
  dbName,
  children,
}: PlannerDbProviderInnerProps): React.ReactElement {
  const [recoveryCompleted, setRecoveryCompleted] = useState(false);
  const [recoveryError, setRecoveryError] = useState<Error | null>(null);
  const activeDb = useMemo(() => setActivePlannerDbName(dbName), [dbName]);
  const { success, error } = useMigrations(activeDb, migrationsConfig);
  const { colors } = useTheme();

  // Check for corrupted migration state and recover BEFORE migrations run
  useEffect(() => {
    async function checkAndRecover(): Promise<void> {
      if (recoveryCompleted) return;

      try {
        const needsRecovery = await needsMigrationRecovery();
        if (needsRecovery) {
          console.log(
            "[Migration Recovery] Detected corrupted state, attempting recovery..."
          );
          await recoverMigrationState();
        }
        setRecoveryCompleted(true);
      } catch (e) {
        console.error("[Migration Recovery] Recovery check failed:", e);
        setRecoveryError(e as Error);
        setRecoveryCompleted(true);
      }
    }

    checkAndRecover();
  }, [recoveryCompleted]);

  // Handle migration errors that indicate table already exists (fallback recovery)
  useEffect(() => {
    async function handleMigrationError(): Promise<void> {
      if (!error || !isTableExistsError(error)) return;

      console.log(
        "[Migration Recovery] Migration failed with table exists error, attempting recovery..."
      );
      try {
        await recoverMigrationState();
        // Recovery completed, but migrations hook won't retry automatically
        // User needs to restart app, or we could show a "Retry" button
        setRecoveryError(
          new Error(
            "Database was recovered. Please close and reopen the app to continue."
          )
        );
      } catch (e) {
        console.error("[Migration Recovery] Recovery failed:", e);
        setRecoveryError(e as Error);
      }
    }

    if (error && recoveryCompleted) {
      handleMigrationError();
    }
  }, [error, recoveryCompleted]);

  useEffect(() => {
    if (typeof __DEV__ !== "undefined" && __DEV__ && success) {
      runPlannerDbDiagnostics();
    }
  }, [success]);

  // Block rendering until recovery check completes
  if (!recoveryCompleted) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: colors.mutedForeground }}>
          Preparing database...
        </Text>
      </View>
    );
  }

  if (recoveryError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Text style={{ color: colors.destructive, textAlign: "center" }}>
          Database recovery failed: {recoveryError.message}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Text style={{ color: colors.destructive, textAlign: "center" }}>
          Database error: {error.message}
        </Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: colors.mutedForeground }}>Preparing...</Text>
      </View>
    );
  }

  return <>{children}</>;
}
