import { useState } from "react";
import { Link, Stack, router } from "expo-router";
import AppHeader, { headerOptions } from "@/components/app-header";
import { ThemeToggler } from "@/components/theme-toggler";
import { Screen } from "@/components/screen";
import { Button, P, View } from "@/components/ui";
import { useAuth } from "@/lib/auth/context";
import { resetPlannerDatabase } from "@/features/planner/planner-repository";
import { resetRotationPointer } from "@/features/planner/rotation-state";
import { useTheme } from "@/lib/theme-context";
import { runPlannerDbDiagnostics } from "@/lib/planner-db/diagnostics";

export default function Settings() {
  const { signOut } = useAuth();
  const { colors, tokens } = useTheme();
  const [resettingDb, setResettingDb] = useState(false);

  async function handleSignOut(): Promise<void> {
    await signOut();
    router.replace("/(auth)/sign-in");
  }

  async function handleResetDatabase(): Promise<void> {
    setResettingDb(true);
    try {
      await resetPlannerDatabase();
      resetRotationPointer();
      router.replace("/planner" as never);
    } catch (e) {
      console.error(e);
    } finally {
      setResettingDb(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen
        options={headerOptions({
          title: "Settings",
          animation: "ios_from_right",
          animationDuration: 300,
        })}
      />
      <AppHeader showBackButton={true} title="Settings" />
      <ThemeToggler />
      <Link href="/profile/account" asChild>
        <Button label="Account" variant="outline" />
      </Link>
      {typeof __DEV__ !== "undefined" && __DEV__ && (
        <View className="mt-6 px-4">
          <P
            className="mb-2"
            style={{
              fontSize: tokens.typography.sizes.sm,
              fontWeight: tokens.typography.weights.semibold,
              color: colors.mutedForeground,
            }}>
            Development
          </P>
          <Button
            label="DB Diagnostics"
            variant="ghost"
            size="sm"
            onPress={() => runPlannerDbDiagnostics()}
            className="mb-2"
          />
          <Button
            label="Reset database"
            variant="outline"
            onPress={handleResetDatabase}
            disabled={resettingDb}
          />
        </View>
      )}
      <View className="flex-1 pb-24">
        <Button variant="destructive" onPress={handleSignOut} label="Sign Out" />
      </View>
    </Screen>
  );
}
