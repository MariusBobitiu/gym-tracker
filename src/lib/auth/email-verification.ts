import type { User } from "@/types";

export type EmailVerificationStatus = "verified" | "unverified" | "unknown";

const ZERO_DATE_PREFIX = "0001-01-01T00:00:00Z";

function isVerifiedAtValid(value: string): boolean {
  if (!value) return false;
  if (value.startsWith(ZERO_DATE_PREFIX)) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

export function getEmailVerificationStatus(
  user: User | null
): EmailVerificationStatus {
  if (!user) return "unknown";

  if (typeof user.emailVerifiedAt === "string") {
    return isVerifiedAtValid(user.emailVerifiedAt) ? "verified" : "unverified";
  }

  if (typeof user.emailVerified === "boolean") {
    return user.emailVerified ? "verified" : "unverified";
  }

  const legacy = user as { isEmailVerified?: boolean; verified?: boolean };
  if (typeof legacy.isEmailVerified === "boolean") {
    return legacy.isEmailVerified ? "verified" : "unverified";
  }
  if (typeof legacy.verified === "boolean") {
    return legacy.verified ? "verified" : "unverified";
  }

  return "unknown";
}
