import { useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { usePlannerStore } from "@/features/planner/planner-store";

/**
 * Route: /workout/start?plannedSessionId=...
 *
 * This route accepts a plannedSessionId query parameter, stores it in the planner store
 * as the active planned session, and then navigates to the main workout screen.
 *
 * The workout screen can later use this active planned session ID to log the workout
 * against the planned session when the workout is completed.
 */
export default function WorkoutStart() {
  const router = useRouter();
  const { plannedSessionId } = useLocalSearchParams<{ plannedSessionId?: string }>();
  const { setActivePlannedSessionId } = usePlannerStore();

  useEffect(() => {
    if (plannedSessionId) {
      // Store the active planned session ID
      setActivePlannedSessionId(plannedSessionId);
    }

    // Navigate to the main workout screen
    // The workout screen will handle the actual workout flow
    router.replace("/workout");
  }, [plannedSessionId, router, setActivePlannedSessionId]);

  // This component doesn't render anything - it just handles the navigation
  return null;
}
