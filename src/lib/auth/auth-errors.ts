import type { ApiError } from "@/lib/api-client";
import type { FieldValues, UseFormSetError, Path } from "react-hook-form";

/** Thrown when a network request cannot proceed because we're offline or refresh failed due to network. User stays signed in locally. */
export class OfflineAuthError extends Error {
  readonly name = "OfflineAuthError";
  constructor(
    message = "Offline — sync paused. Changes will sync when back online."
  ) {
    super(message);
    Object.setPrototypeOf(this, OfflineAuthError.prototype);
  }
}

/** Thrown when refresh token is invalid/expired. User must sign in again. */
export class SignedOutError extends Error {
  readonly name = "SignedOutError";
  constructor(message = "Session expired. Please sign in again.") {
    super(message);
    Object.setPrototypeOf(this, SignedOutError.prototype);
  }
}

export function resolveErrorMessage(
  error: unknown,
  fallback = "Something went wrong."
): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  fields: (keyof T)[],
  setError: UseFormSetError<T>
): boolean {
  if (!error || typeof error !== "object" || !("details" in error)) {
    return false;
  }

  const details = (error as ApiError).details;
  if (!details || typeof details !== "object") {
    return false;
  }

  let applied = false;
  for (const [key, value] of Object.entries(
    details as Record<string, unknown>
  )) {
    if (!fields.includes(key as keyof T)) {
      continue;
    }

    const message = Array.isArray(value)
      ? value.map((item) => String(item)).join("\n")
      : String(value);

    setError(key as Path<T>, {
      type: "server",
      message,
    });
    applied = true;
  }

  return applied;
}
