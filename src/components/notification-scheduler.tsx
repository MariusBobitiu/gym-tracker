import { useCallback, useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";
import * as Notifications from "expo-notifications";
import { useFocusEffect } from "expo-router";
import {
  clearAppBadge,
  scheduleWorkoutReminder,
  updateBadgeFromPresentedNotifications,
} from "@/lib/notifications";

/**
 * Schedules workout reminder notifications when the app is focused.
 * Runs when user has a plan and workout reminders are enabled.
 * Clears the app icon badge when the app is opened.
 * Updates the badge count when notifications are received (app in foreground).
 */
export function NotificationScheduler(): null {
  useFocusEffect(
    useCallback(() => {
      void scheduleWorkoutReminder();
      return () => {};
    }, [])
  );

  useEffect(() => {
    if (AppState.currentState === "active") {
      void clearAppBadge();
    }
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active") {
          void clearAppBadge();
        }
      }
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(() => {
      void updateBadgeFromPresentedNotifications();
    });
    return () => sub.remove();
  }, []);

  return null;
}
