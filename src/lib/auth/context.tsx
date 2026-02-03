/**
 * Auth context (offline-first). Navigation depends ONLY on presence/validity of
 * refresh token: signedInOffline and signedInOnline both count as "signed in";
 * only signedOut redirects to login. Access token expiry never logs the user out.
 */

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";
import { router } from "expo-router";

import {
  getStorageItem,
  setStorageItem,
  STORAGE_KEYS,
  type TokenType,
} from "@/lib/storage";
import {
  setAuthStoreGetters,
  setRefreshHandler,
  setUnauthorizedHandler,
} from "@/lib/api-client";
import { getMe, login } from "@/lib/auth/auth-api";
import {
  useAuthStore,
  hydrateAccessTokenFromStorage,
  type AuthConnectionStatus,
} from "@/lib/auth/auth-store";
import type { User } from "@/types";

/** Legacy status for backwards compat: "authed" = signedInOnline | signedInOffline, "guest" = signedOut */
export type AuthStatus = "loading" | "authed" | "guest";
export type AuthUser = User;
export type AuthSession = {
  user: AuthUser | null;
  token: TokenType | null;
};
export type AuthCredentials =
  | ({
      email: string;
      password: string;
    } & Record<string, unknown>)
  | AuthSession;

type AuthContextValue = {
  user: AuthUser | null;
  token: TokenType | null;
  /** Legacy: "authed" if signedInOnline or signedInOffline, "guest" if signedOut */
  status: AuthStatus;
  /** Fine-grained connection status for offline banner / sync UI */
  connectionStatus: AuthConnectionStatus;
  signIn: (credentials: AuthCredentials) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  hydrateFromStorage: () => Promise<void>;
};

type SessionProviderProps = PropsWithChildren<{
  authenticate?: (credentials: AuthCredentials) => Promise<AuthSession>;
  onSignOut?: () => Promise<void>;
}>;

const AuthContext = createContext<AuthContextValue | null>(null);

function isAuthSession(
  value: AuthCredentials | AuthSession
): value is AuthSession {
  return (
    typeof value === "object" &&
    value !== null &&
    "token" in value &&
    "user" in value
  );
}

function connectionStatusToLegacy(status: AuthConnectionStatus): AuthStatus {
  if (status === "loading") return "loading";
  if (status === "signedOut") return "guest";
  return "authed";
}

// Use this hook to access the auth user/session data.
export function useSession() {
  const value = use(AuthContext);
  if (!value) {
    throw new Error("useSession must be wrapped in a <SessionProvider />");
  }
  const { user, token, status } = value;
  return { user, token, status };
}

export function useAuth() {
  const value = use(AuthContext);
  if (!value) {
    throw new Error("useAuth must be wrapped in a <SessionProvider />");
  }
  return value;
}

function subscribeToAuthStore(callback: () => void): () => void {
  return useAuthStore.subscribe(callback);
}

export function SessionProvider({
  children,
  authenticate,
  onSignOut,
}: SessionProviderProps) {
  const connectionStatus = useSyncExternalStore(
    subscribeToAuthStore,
    () => useAuthStore.getState().status,
    () => "loading" as AuthConnectionStatus
  );
  const user = useSyncExternalStore(
    subscribeToAuthStore,
    () => useAuthStore.getState().user,
    () => null as User | null
  );
  const accessToken = useSyncExternalStore(
    subscribeToAuthStore,
    () => useAuthStore.getState().accessToken,
    () => null as string | null
  );
  const token: TokenType | null = useMemo(() => {
    const refresh = useAuthStore.getState().getRefreshToken();
    if (!accessToken && !refresh) return null;
    return { access: accessToken ?? "", refresh: refresh ?? "" };
  }, [accessToken]);

  const status = useMemo(
    () => connectionStatusToLegacy(connectionStatus),
    [connectionStatus]
  );

  const hydrateFromStorage = useCallback(async (): Promise<void> => {
    useAuthStore.getState().setStatus("loading");
    const storedRefresh = useAuthStore.getState().getRefreshToken();
    const storedToken = getStorageItem(STORAGE_KEYS.token) as TokenType | null;
    const refresh = storedRefresh ?? storedToken?.refresh ?? null;

    if (!refresh) {
      useAuthStore.getState().logout();
      return;
    }

    // We have a refresh token: stay signed in locally (offline until refresh succeeds).
    useAuthStore.getState().setStatus("signedInOffline");
    const cachedUser = getStorageItem(STORAGE_KEYS.user) as User | null;
    useAuthStore.getState().setUser(cachedUser ?? null);
    hydrateAccessTokenFromStorage();

    const newAccess = await useAuthStore.getState().refreshAccessToken();
    if (newAccess) {
      const meResult = await getMe();
      if (meResult.ok) {
        useAuthStore.getState().setUser(meResult.data);
        setStorageItem(STORAGE_KEYS.user, meResult.data);
        if (getStorageItem(STORAGE_KEYS.userFirstSeenAt) == null) {
          setStorageItem(STORAGE_KEYS.userFirstSeenAt, Date.now());
        }
      }
      // Status already set to signedInOnline by refreshAccessToken
    }
    // If refresh failed (null): store is already signedInOffline or signedOut; keep cached user for offline
  }, []);

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  const signIn = useCallback(
    async (credentials: AuthCredentials): Promise<AuthSession> => {
      useAuthStore.getState().setStatus("loading");

      try {
        const session = authenticate
          ? await authenticate(credentials)
          : isAuthSession(credentials)
            ? credentials
            : null;

        if (!session && !authenticate) {
          const email = credentials.email;
          const password = credentials.password;
          if (!email || !password) {
            throw new Error("Email and password are required to sign in.");
          }

          const loginResult = await login({ email, password });
          if (!loginResult.ok) throw loginResult.error;

          const meResult = await getMe(loginResult.data.token.access);
          if (!meResult.ok) throw meResult.error;

          const apiSession: AuthSession = {
            user: meResult.data,
            token: loginResult.data.token,
          };

          useAuthStore.getState().setTokens(apiSession.token);
          useAuthStore.getState().setUser(apiSession.user);
          useAuthStore.getState().setStatus("signedInOnline");
          setStorageItem(STORAGE_KEYS.user, apiSession.user);
          if (getStorageItem(STORAGE_KEYS.userFirstSeenAt) == null) {
            setStorageItem(STORAGE_KEYS.userFirstSeenAt, Date.now());
          }
          return apiSession;
        }

        if (!session) {
          throw new Error(
            "Auth signIn not configured. Provide an authenticate handler."
          );
        }

        useAuthStore.getState().setUser(session.user ?? null);
        useAuthStore.getState().setTokens(session.token ?? null);
        useAuthStore
          .getState()
          .setStatus(session.token ? "signedInOnline" : "signedOut");
        setStorageItem(STORAGE_KEYS.user, session.user ?? null);
        return session;
      } catch (error) {
        useAuthStore.getState().setStatus("signedOut");
        throw error;
      }
    },
    [authenticate]
  );

  const signOut = useCallback(async () => {
    useAuthStore.getState().setStatus("loading");
    if (onSignOut) await onSignOut();
    useAuthStore.getState().logout();
    const { logout: apiLogout } = await import("@/lib/auth/auth-api");
    void apiLogout();
    router.replace("/(auth)/sign-in");
  }, [onSignOut]);

  useEffect(() => {
    setAuthStoreGetters(
      () => useAuthStore.getState().getAccessToken(),
      () => useAuthStore.getState().ensureValidAccessToken(),
      () => useAuthStore.getState().status
    );
    setRefreshHandler(() => useAuthStore.getState().refreshAccessToken());
    setUnauthorizedHandler(() => {
      router.replace("/(auth)/sign-in");
    });

    return () => {
      setAuthStoreGetters(
        () => null,
        () => Promise.resolve(),
        () => "signedOut"
      );
      setRefreshHandler(null);
      setUnauthorizedHandler(null);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      status,
      connectionStatus,
      signIn,
      signOut,
      hydrateFromStorage,
    }),
    [connectionStatus, hydrateFromStorage, signIn, signOut, status, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
