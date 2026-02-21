export type User = {
  id: string;
  email?: string;
  name?: string;
  username?: string;
  emailVerified?: boolean;
  emailVerifiedAt?: string;
  /** ISO date string from API if available (e.g. user registration). */
  createdAt?: string;
  [key: string]: unknown;
};
