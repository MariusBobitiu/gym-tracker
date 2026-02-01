import Constants from "expo-constants";
import { Link, Stack, router } from "expo-router";
import * as React from "react";
import { useState } from "react";
import { Linking } from "react-native";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { SettingsSection, SettingsRow } from "@/components/settings-row";
import {
  Button,
  Modal,
  P,
  Radio,
  Text,
  useModal,
  View as UIView,
} from "@/components/ui";
import { useAuth } from "@/lib/auth/context";
import { resetPlannerDatabase } from "@/features/planner/planner-repository";
import { resetRotationPointer } from "@/features/planner/rotation-state";
import { useTheme } from "@/lib/theme-context";
import { runPlannerDbDiagnostics } from "@/lib/planner-db/diagnostics";
import {
  useSelectedTheme,
  type ColorSchemeType,
} from "@/hooks/use-selected-theme";

const themeOptions: { value: ColorSchemeType; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

function themeLabel(value: ColorSchemeType): string {
  return value === "system" ? "System" : value === "dark" ? "Dark" : "Light";
}

export default function Settings(): React.ReactElement {
  const { signOut } = useAuth();
  const { colors, tokens } = useTheme();
  const { selectedTheme, setSelectedTheme } = useSelectedTheme();
  const [resettingDb, setResettingDb] = useState(false);

  const themeModal = useModal();
  const contactSupportModal = useModal();

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

  const version = Constants.expoConfig?.version ?? "1.0.0";
  const buildNumber =
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.expoConfig?.android?.versionCode ??
    "–";

  return (
    <Screen
      preset="scroll"
      padding="none"
      safeAreaEdges={["bottom", "top"]}
      contentContainerClassName="px-4 pt-2 pb-24"
    >
      <Stack.Screen
        options={headerOptions({
          title: "Settings",
          animation: "ios_from_right",
          animationDuration: 300,
        })}
      />
      <AppHeader showBackButton title="Settings" />

      <UIView className="gap-6">
        <SettingsSection title="ACCOUNT">
          <SettingsRow
            label="Email & password"
            href="/settings/email-password"
            showDivider
          />
          <SettingsRow
            label="Profile"
            href="/settings/profile"
            showDivider={false}
          />
        </SettingsSection>

        <SettingsSection title="PREFERENCE">
          <SettingsRow label="Units" href="/settings/units" showDivider />
          <SettingsRow
            label="Theme"
            value={themeLabel(selectedTheme)}
            valueStyle="primary"
            onPress={() => themeModal.present()}
            showDivider
          />
          <SettingsRow
            label="Notifications"
            href="/settings/notifications"
            showDivider={false}
          />
        </SettingsSection>

        <SettingsSection title="HEALTH">
          <SettingsRow
            label="Apple Health"
            value="Coming soon"
            valueStyle="muted"
            href="/settings/apple-health"
            showDivider={false}
          />
        </SettingsSection>

        <SettingsSection title="SUPPORT">
          <SettingsRow
            label="Help & FAQ"
            href="/settings/help-faq"
            showDivider
          />
          <SettingsRow
            label="Contact Support"
            onPress={() => contactSupportModal.present()}
            showDivider
          />
          <SettingsRow
            label="Report a bug"
            href="/settings/report-bug"
            showDivider={false}
          />
        </SettingsSection>

        {typeof __DEV__ !== "undefined" && __DEV__ && (
          <UIView className="gap-2">
            <P
              style={{
                fontSize: tokens.typography.sizes.sm,
                fontWeight: tokens.typography.weights.semibold,
                color: colors.mutedForeground,
              }}
            >
              Development
            </P>
            <Button
              label="DB Diagnostics"
              variant="ghost"
              size="sm"
              onPress={() => runPlannerDbDiagnostics()}
            />
            <Button
              label="Reset database"
              variant="outline"
              onPress={handleResetDatabase}
              disabled={resettingDb}
            />
          </UIView>
        )}

        <UIView className="mt-4 items-center gap-4">
          <P
            style={{
              color: colors.mutedForeground,
              fontSize: tokens.typography.sizes.xs,
            }}
          >
            Version {version} ({buildNumber})
          </P>
          <Button
            variant="destructive"
            onPress={handleSignOut}
            label="Sign out"
            className="w-full"
          />
        </UIView>
      </UIView>

      <Modal ref={themeModal.ref} title="Theme" snapPoints={["40%"]}>
        <UIView className="gap-4 px-4 pb-8">
          {themeOptions.map((option) => {
            const isSelected = selectedTheme === option.value;
            return (
              <Radio
                key={option.value}
                checked={isSelected}
                onChange={() => {
                  setSelectedTheme(option.value);
                  themeModal.dismiss();
                }}
                label={option.label}
                accessibilityLabel={`Select ${option.label} theme`}
              />
            );
          })}
        </UIView>
      </Modal>

      <Modal
        ref={contactSupportModal.ref}
        title="Contact Support"
        snapPoints={["35%"]}
      >
        <UIView className="gap-4 px-4 pb-8">
          <Text style={{ color: colors.mutedForeground }}>
            Email us at support@example.com or open our help center.
          </Text>
          <Button
            label="Open support email"
            variant="outline"
            onPress={() => {
              Linking.openURL("mailto:support@example.com");
              contactSupportModal.dismiss();
            }}
          />
        </UIView>
      </Modal>
    </Screen>
  );
}
