import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
  getStorageItem,
  STORAGE_KEYS,
  type NotificationPrefs,
} from "@/lib/storage";
import { getActivePlan } from "@/features/planner/planner-repository";

const WORKOUT_REMINDER_ID = "workout-reminder";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowList: true,
  }),
});

function getDefaultPrefs(): NotificationPrefs {
  return {
    workoutReminders: true,
    marketing: false,
    reminderHour: 9,
    reminderMinute: 0,
  };
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("workout-reminders", {
      name: "Workout reminders",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleWorkoutReminder(): Promise<void> {
  const prefs =
    getStorageItem(STORAGE_KEYS.notificationPrefs) ?? getDefaultPrefs();
  if (!prefs.workoutReminders) {
    await cancelWorkoutReminder();
    return;
  }
  const hasPlan = (await getActivePlan()) != null;
  if (!hasPlan) {
    await cancelWorkoutReminder();
    return;
  }
  const hour = prefs.reminderHour ?? 9;
  const minute = prefs.reminderMinute ?? 0;
  await Notifications.cancelScheduledNotificationAsync(WORKOUT_REMINDER_ID);
  await Notifications.scheduleNotificationAsync({
    identifier: WORKOUT_REMINDER_ID,
    content: {
      title: "Time to train",
      body: "Don't skip your workout today.",
      channelId: "workout-reminders",
    },
    trigger: {
      type: "daily" as const,
      hour,
      minute,
      channelId: "workout-reminders",
    },
  });
}

export async function cancelWorkoutReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(WORKOUT_REMINDER_ID);
}

export async function getScheduledWorkoutReminder(): Promise<Notifications.NotificationRequest | null> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.find((n) => n.identifier === WORKOUT_REMINDER_ID) ?? null;
}
