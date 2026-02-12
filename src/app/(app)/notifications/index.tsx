import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Pressable } from "react-native";
import * as Notifications from "expo-notifications";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { Button, P, View as UIView } from "@/components/ui";
import { useTheme } from "@/lib/theme-context";
import type { Notification } from "expo-notifications";
import {
  cancelWorkoutReminder,
  dismissNotification,
  getPresentedNotifications,
  getScheduledWorkoutReminder,
  requestNotificationPermissions,
  scheduleWorkoutReminder,
  sendTestNotification,
  updateBadgeFromPresentedNotifications,
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
  const [presentedNotifications, setPresentedNotifications] = useState<
    Notification[]
  >([]);

  const refreshStatus = useCallback(async () => {
    const prefs =
      getStorageItem(STORAGE_KEYS.notificationPrefs) ?? DEFAULT_PREFS;
    setWorkoutReminders(prefs.workoutReminders);
    const reminder = await getScheduledWorkoutReminder();
    setScheduledReminder(reminder != null);

    const { status } = await Notifications.getPermissionsAsync();
    setPermissionGranted(status === "granted");

    const presented = await getPresentedNotifications();
    setPresentedNotifications(presented);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshStatus();
    }, [refreshStatus])
  );

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(() => {
      void refreshStatus();
    });
    return () => sub.remove();
  }, [refreshStatus]);

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

  const handleDismissNotification = useCallback(
    async (identifier: string) => {
      await dismissNotification(identifier);
      await refreshStatus();
      await updateBadgeFromPresentedNotifications();
    },
    [refreshStatus]
  );

  function formatNotificationDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });
    }
    const isYesterday =
      date.toDateString() === new Date(now.getTime() - 86400000).toDateString();
    if (isYesterday) {
      return `Yesterday, ${date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    }
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["bottom", "top"]}
      contentContainerClassName="pb-24 px-4"
    >
      <Stack.Screen
        options={headerOptions({
          title: "Notifications",
          animation: "ios_from_right",
          animationDuration: 300,
        })}
      />
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
              marginBottom: 12,
            }}
          >
            Recent
          </P>
          {presentedNotifications.length === 0 ? (
            <P
              style={{
                color: colors.mutedForeground,
                fontSize: tokens.typography.sizes.sm,
              }}
            >
              No notifications
            </P>
          ) : (
            <UIView className="gap-3">
              {presentedNotifications.map((n) => (
                <UIView
                  key={n.request.identifier}
                  className="rounded-lg border p-3"
                  style={{
                    backgroundColor: colors.muted,
                    borderColor: colors.border,
                  }}
                >
                  <UIView className="flex-row items-start justify-between gap-2">
                    <UIView className="min-w-0 flex-1">
                      <P
                        style={{
                          fontWeight: tokens.typography.weights.medium,
                          marginBottom: 4,
                        }}
                        numberOfLines={1}
                      >
                        {n.request.content.title ?? "Notification"}
                      </P>
                      {(n.request.content.body ?? "").length > 0 && (
                        <P
                          style={{
                            color: colors.mutedForeground,
                            fontSize: tokens.typography.sizes.sm,
                            marginBottom: 4,
                          }}
                          numberOfLines={2}
                        >
                          {n.request.content.body}
                        </P>
                      )}
                      <P
                        style={{
                          color: colors.mutedForeground,
                          fontSize: tokens.typography.sizes.xs,
                        }}
                      >
                        {formatNotificationDate(n.date)}
                      </P>
                    </UIView>
                    <Pressable
                      onPress={() =>
                        void handleDismissNotification(n.request.identifier)
                      }
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Dismiss notification"
                    >
                      <P
                        style={{
                          color: colors.primary,
                          fontSize: tokens.typography.sizes.sm,
                        }}
                      >
                        Dismiss
                      </P>
                    </Pressable>
                  </UIView>
                </UIView>
              ))}
            </UIView>
          )}
        </UIView>

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

        {typeof __DEV__ !== "undefined" && __DEV__ && (
          <Button
            label="Send test notification"
            variant="outline"
            size="sm"
            onPress={() => void sendTestNotification()}
          />
        )}
      </UIView>
    </Screen>
  );
}
