/**
 * Decode JWT payload without verification (client-side only; used for expiry check).
 * Do not use for security decisions; backend validates tokens.
 */

const JWT_EXP_LEEWAY_SEC = 120; // 2 minutes: refresh if exp is within this window

export function getJwtExpirationSeconds(accessToken: string): number | null {
  try {
    const parts = accessToken.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    if (!payload) return null;
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    ) as { exp?: number };
    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
}

/**
 * Returns true if the access token is considered valid (not expired and not within leeway).
 * Used to decide whether to refresh before a request.
 */
export function isAccessTokenValid(accessToken: string): boolean {
  const exp = getJwtExpirationSeconds(accessToken);
  if (exp == null) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  return exp > nowSec + JWT_EXP_LEEWAY_SEC;
}
