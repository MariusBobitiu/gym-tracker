export type User = {
  id: string;
  email?: string;
  name?: string;
  /** ISO date string from API if available (e.g. user registration). */
  createdAt?: string;
  [key: string]: unknown;
};
