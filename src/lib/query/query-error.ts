import { showMessage } from "react-native-flash-message";
import { OfflineAuthError } from "@/lib/auth/auth-errors";

const FALLBACK_MESSAGE = "Something went wrong";

function extractMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    if (
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    ) {
      return (error as { message: string }).message;
    }
    if (
      "error" in error &&
      (error as { error?: unknown }).error &&
      typeof (error as { error?: { message?: unknown } }).error?.message ===
        "string"
    ) {
      return (error as { error: { message: string } }).error.message;
    }
  }
  return FALLBACK_MESSAGE;
}

/**
 * Show error toast. OfflineAuthError is shown as info (sync paused), not as a fatal error.
 */
export function showQueryError(error: unknown): void {
  if (error instanceof OfflineAuthError) {
    showMessage({
      message: "Offline",
      description: error.message,
      type: "info",
      duration: 4000,
      icon: "info",
    });
    return;
  }
  showMessage({
    message: "Error",
    description: extractMessage(error),
    type: "danger",
    duration: 4000,
    icon: "danger",
  });
}
