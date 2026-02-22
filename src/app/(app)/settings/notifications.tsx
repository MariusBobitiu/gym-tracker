import { Stack } from "expo-router";
import React, { useCallback, useState } from "react";
import AppHeader, { headerOptions } from "@/components/app-header";
import { Screen } from "@/components/screen";
import { FormField } from "@/components/forms";
import { Checkbox, View as UIView } from "@/components/ui";
import {
  getStorageItem,
  setStorageItem,
  STORAGE_KEYS,
  type NotificationPrefs,
} from "@/lib/storage";

const DEFAULT_PREFS: NotificationPrefs = {
  workoutReminders: true,
  marketing: false,
  reminderHour: 9,
  reminderMinute: 0,
};

export default function NotificationsSettings(): React.ReactElement {
  const initialPrefs =
    getStorageItem(STORAGE_KEYS.notificationPrefs) ?? DEFAULT_PREFS;
  const [workoutReminders, setWorkoutReminders] = useState(
    initialPrefs.workoutReminders
  );
  const [marketing, setMarketing] = useState(initialPrefs.marketing);

  const handleWorkoutReminders = useCallback(async (checked: boolean) => {
    setWorkoutReminders(checked);
    const current =
      getStorageItem(STORAGE_KEYS.notificationPrefs) ?? DEFAULT_PREFS;
    setStorageItem(STORAGE_KEYS.notificationPrefs, {
      ...current,
      workoutReminders: checked,
    });
    const {
      requestNotificationPermissions,
      scheduleWorkoutReminder,
      cancelWorkoutReminder,
    } = await import("@/lib/notifications");
    if (checked) {
      const granted = await requestNotificationPermissions();
      if (granted) void scheduleWorkoutReminder();
    } else {
      await cancelWorkoutReminder();
    }
  }, []);

  const handleMarketing = useCallback((checked: boolean) => {
    setMarketing(checked);
    const current =
      getStorageItem(STORAGE_KEYS.notificationPrefs) ?? DEFAULT_PREFS;
    setStorageItem(STORAGE_KEYS.notificationPrefs, {
      ...current,
      marketing: checked,
    });
  }, []);

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["bottom", "top"]}
      contentContainerClassName="pb-24"
    >
      <Stack.Screen
        options={headerOptions({
          title: "Notifications",
          animation: "ios_from_right",
          animationDuration: 300,
        })}
      />
      <AppHeader showBackButton title="Notifications" />

      <UIView className="gap-4 px-2 pt-4">
        <FormField
          label="Workout reminders"
          helper="Get notified when it's time for your next session."
        />
        <Checkbox
          checked={workoutReminders}
          onChange={handleWorkoutReminders}
          label="Enable workout reminders"
          accessibilityLabel="Toggle workout reminders"
        />

        <FormField
          className="mt-6"
          label="Marketing"
          helper="Tips, offers and product updates (optional)."
        />
        <Checkbox
          checked={marketing}
          onChange={handleMarketing}
          label="Receive marketing emails"
          accessibilityLabel="Toggle marketing emails"
        />
      </UIView>
    </Screen>
  );
}
