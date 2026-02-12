import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { scheduleWorkoutReminder } from "@/lib/notifications";

/**
 * Schedules workout reminder notifications when the app is focused.
 * Runs when user has a plan and workout reminders are enabled.
 */
export function NotificationScheduler(): null {
  useFocusEffect(
    useCallback(() => {
      void scheduleWorkoutReminder();
      return () => {};
    }, [])
  );
  return null;
}
