import { Env } from "@/lib/env";

export function resolveLegalUrl(path: string): string | null {
  const base = Env.EXPO_PUBLIC_SITE_URL?.trim();
  if (!base) return null;
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
