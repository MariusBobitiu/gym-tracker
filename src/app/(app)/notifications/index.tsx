import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { Button, P, View as UIView } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";
import {
  getScheduledWorkoutReminder,
  requestNotificationPermissions,
  scheduleWorkoutReminder,
} from "@/lib/notifications";
import {
  getStorageItem,
  setStorageItem,
  STORAGE_KEYS,
  type NotificationPrefs,
} from "@/lib/storage";
import { Checkbox } from "@/components/ui/checkbox";
import { useActivePlan } from "@/features/planner/use-active-plan";

const DEFAULT_PREFS: NotificationPrefs = {
  workoutReminders: true,
  marketing: false,
  reminderHour: 9,
  reminderMinute: 0,
};

function formatReminderTime(hour: number, minute: number): string {
  const h = hour % 24;
  const m = minute % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export default function NotificationsScreen(): React.ReactElement {
  const router = useRouter();
  const { colors, tokens } = useTheme();
  const { state } = useActivePlan();
  const hasPlan = state.kind === "week_view";
  const prefs = getStorageItem(STORAGE_KEYS.notificationPrefs) ?? DEFAULT_PREFS;
  const [workoutReminders, setWorkoutReminders] = useState(
    prefs.workoutReminders
  );
  const [scheduledReminder, setScheduledReminder] = useState<boolean | null>(
    null
  );
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null
  );

  const refreshStatus = useCallback(async () => {
    const prefs =
      getStorageItem(STORAGE_KEYS.notificationPrefs) ?? DEFAULT_PREFS;
    setWorkoutReminders(prefs.workoutReminders);
    const reminder = await getScheduledWorkoutReminder();
    setScheduledReminder(reminder != null);
    const { status } = await import("expo-notifications").then((n) =>
      n.getPermissionsAsync()
    );
    setPermissionGranted(status === "granted");
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshStatus();
    }, [refreshStatus])
  );

  const handleWorkoutRemindersToggle = useCallback(
    async (checked: boolean) => {
      setWorkoutReminders(checked);
      const current =
        getStorageItem(STORAGE_KEYS.notificationPrefs) ?? DEFAULT_PREFS;
      setStorageItem(STORAGE_KEYS.notificationPrefs, {
        ...current,
        workoutReminders: checked,
      });
      if (checked) {
        const granted = await requestNotificationPermissions();
        if (granted && hasPlan) {
          await scheduleWorkoutReminder();
        }
      } else {
        const { cancelWorkoutReminder } = await import("@/lib/notifications");
        await cancelWorkoutReminder();
      }
      await refreshStatus();
    },
    [hasPlan, refreshStatus]
  );

  const handleRequestPermission = useCallback(async () => {
    const granted = await requestNotificationPermissions();
    setPermissionGranted(granted);
    if (granted && workoutReminders && hasPlan) {
      await scheduleWorkoutReminder();
    }
    await refreshStatus();
  }, [hasPlan, refreshStatus, workoutReminders]);

  const hour = prefs.reminderHour ?? 9;
  const minute = prefs.reminderMinute ?? 0;

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["bottom", "top"]}
      contentContainerClassName="pb-24 px-4"
    >
      <Stack.Screen options={headerOptions({ title: "Notifications" })} />
      <AppHeader showBackButton title="Notifications" />

      <UIView className="gap-6 pt-4">
        <UIView
          className="rounded-lg border p-4"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
          }}
        >
          <P
            style={{
              fontWeight: tokens.typography.weights.semibold,
              marginBottom: 4,
            }}
          >
            Workout reminders
          </P>
          <P
            style={{
              color: colors.mutedForeground,
              fontSize: tokens.typography.sizes.sm,
              marginBottom: 12,
            }}
          >
            Get a daily nudge to stay consistent with your plan.
          </P>
          {!hasPlan && (
            <P
              style={{
                color: colors.mutedForeground,
                fontSize: tokens.typography.sizes.sm,
                marginBottom: 12,
              }}
            >
              Set up a plan in the Planner to receive reminders.
            </P>
          )}
          {permissionGranted === false && (
            <Button
              label="Enable notifications"
              variant="outline"
              size="sm"
              onPress={handleRequestPermission}
              className="mb-3"
            />
          )}
          <Checkbox
            checked={workoutReminders}
            onChange={handleWorkoutRemindersToggle}
            label="Daily reminder"
            accessibilityLabel="Toggle workout reminders"
            disabled={!hasPlan}
          />
          {workoutReminders && scheduledReminder && (
            <P
              style={{
                color: colors.mutedForeground,
                fontSize: tokens.typography.sizes.xs,
                marginTop: 8,
              }}
            >
              Next reminder at {formatReminderTime(hour, minute)}
            </P>
          )}
        </UIView>

        <Button
          label="Notification settings"
          variant="ghost"
          size="sm"
          onPress={() => router.push("/(app)/settings/notifications")}
        />
      </UIView>
    </Screen>
  );
}
