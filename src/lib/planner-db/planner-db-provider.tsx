import React, { useEffect } from "react";
import { View } from "react-native";
import { useMigrations } from "drizzle-orm/op-sqlite/migrator";
import { db } from "@/lib/planner-db/database";
import { runPlannerDbDiagnostics } from "@/lib/planner-db/diagnostics";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/lib/theme-context";

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

/**
 * Runs Drizzle migrations for the planner DB before rendering children.
 * Use inside (app) layout so planner screens never read before migrations complete.
 */
export function PlannerDbProvider({
  children,
}: PlannerDbProviderProps): React.ReactElement {
  const { success, error } = useMigrations(db, migrationsConfig);
  const { colors } = useTheme();

  useEffect(() => {
    if (typeof __DEV__ !== "undefined" && __DEV__ && success) {
      runPlannerDbDiagnostics();
    }
  }, [success]);

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
