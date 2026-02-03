/**
 * Auth state machine (offline-first):
 * - signedOut: no refresh token; user must sign in.
 * - signedInOffline: refresh token exists but access missing/expired or refresh failed (e.g. network).
 *   User stays in app; full local/offline use; sync paused until online + refresh succeeds.
 * - signedInOnline: access token valid and refresh works; can call API.
 *
 * Access token expiry NEVER logs the user out. Only missing/invalid refresh token does.
 */

import { create } from "zustand";
import {
  getSecureItem,
  getStorageItem,
  removeSecureItem,
  removeStorageItem,
  setSecureItem,
  setStorageItem,
  SECURE_STORAGE_KEYS,
  STORAGE_KEYS,
  type TokenType,
} from "@/lib/storage";
import { refreshSession } from "@/lib/auth/auth-api";
import { isAccessTokenValid } from "@/lib/auth/jwt";
import { OfflineAuthError, SignedOutError } from "@/lib/auth/auth-errors";
import type { User } from "@/types";

export type AuthConnectionStatus =
  | "loading"
  | "signedOut"
  | "signedInOffline"
  | "signedInOnline";

type AuthStoreState = {
  status: AuthConnectionStatus;
  user: User | null;
  /** In-memory access token; also persisted for cold start but expiry is always checked. */
  accessToken: string | null;
};

type AuthStoreActions = {
  setStatus: (status: AuthConnectionStatus) => void;
  setUser: (user: User | null) => void;
  setTokens: (token: TokenType | null) => void;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  /** Ensure we have a valid access token; refresh if needed. Throws OfflineAuthError (network) or SignedOutError (invalid refresh). */
  ensureValidAccessToken: () => Promise<void>;
  /** Call refresh endpoint; used by ensureValidAccessToken and by connectivity recovery. Shared refresh lock inside. */
  refreshAccessToken: () => Promise<string | null>;
  logout: () => void;
};

function readStoredToken(): TokenType | null {
  const secure = getSecureItem(SECURE_STORAGE_KEYS.authToken);
  return secure ?? getStorageItem(STORAGE_KEYS.token);
}

function writeStoredToken(token: TokenType | null): void {
  if (token == null) {
    removeStorageItem(STORAGE_KEYS.token);
    removeSecureItem(SECURE_STORAGE_KEYS.authToken);
    return;
  }
  setStorageItem(STORAGE_KEYS.token, token);
  setSecureItem(SECURE_STORAGE_KEYS.authToken, token);
}

/** Single in-flight refresh promise so concurrent requests share one refresh. */
let refreshLock: Promise<string | null> | null = null;

export const useAuthStore = create<AuthStoreState & AuthStoreActions>(
  (set, get) => ({
    status: "loading",
    user: null,
    accessToken: null,

    setStatus: (status) => set({ status }),
    setUser: (user) => set({ user }),
    setTokens: (token) => {
      if (!token) {
        set({ accessToken: null });
        writeStoredToken(null);
        return;
      }
      set({ accessToken: token.access });
      writeStoredToken(token);
    },

    getAccessToken: () => get().accessToken,
    getRefreshToken: () => readStoredToken()?.refresh ?? null,

    ensureValidAccessToken: async () => {
      const { accessToken: currentAccess, refreshAccessToken: doRefresh } =
        get();
      if (currentAccess && isAccessTokenValid(currentAccess)) return;
      const newAccess = await doRefresh();
      if (newAccess) return;
      const status = get().status;
      if (status === "signedOut") throw new SignedOutError();
      throw new OfflineAuthError();
    },

    refreshAccessToken: async (): Promise<string | null> => {
      const refreshToken = readStoredToken()?.refresh ?? null;
      if (!refreshToken) {
        set({ status: "signedOut", accessToken: null, user: null });
        writeStoredToken(null);
        return null;
      }

      if (refreshLock) {
        const result = await refreshLock;
        const access = get().accessToken;
        return access ?? result;
      }

      const run = async (): Promise<string | null> => {
        const result = await refreshSession(refreshToken);
        if (result.ok && result.data.token?.access) {
          const next: TokenType = {
            access: result.data.token.access,
            refresh:
              result.data.token.refresh ?? readStoredToken()?.refresh ?? "",
          };
          set({
            status: "signedInOnline",
            accessToken: next.access,
          });
          writeStoredToken(next);
          return next.access;
        }
        if (result.status === 401) {
          set({ status: "signedOut", accessToken: null, user: null });
          writeStoredToken(null);
          return null;
        }
        set({ status: "signedInOffline", accessToken: null });
        return null;
      };

      refreshLock = run();
      try {
        return await refreshLock;
      } finally {
        refreshLock = null;
      }
    },

    logout: () => {
      set({ status: "signedOut", user: null, accessToken: null });
      removeStorageItem(STORAGE_KEYS.user);
      removeStorageItem(STORAGE_KEYS.userFirstSeenAt);
      writeStoredToken(null);
    },
  })
);

/** Sync access token from storage into memory (e.g. after app restart). Does not validate expiry. */
export function hydrateAccessTokenFromStorage(): void {
  const stored = readStoredToken();
  if (stored?.access) {
    useAuthStore.setState({ accessToken: stored.access });
  }
}
