import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { router } from "expo-router";

import {
  getSecureItem,
  getStorageItem,
  removeSecureItem,
  removeStorageItem,
  secureStorage,
  setSecureItem,
  setStorageItem,
  SECURE_STORAGE_KEYS,
  STORAGE_KEYS,
  type TokenType,
} from "@/lib/storage";
import { setRefreshHandler, setUnauthorizedHandler } from "@/lib/api-client";
import { getMe, login, logout, refreshSession } from "@/lib/auth/auth-api";
import type { User } from "@/types";

export type AuthStatus = "loading" | "authed" | "guest";
export type AuthUser = User;
export type AuthCredentials = {
  email: string;
  password: string;
} & Record<string, unknown>;
export type AuthSession = {
  user: AuthUser | null;
  token: TokenType | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: TokenType | null;
  status: AuthStatus;
  signIn: (credentials: AuthCredentials) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  hydrateFromStorage: () => Promise<void>;
};

type SessionProviderProps = PropsWithChildren<{
  authenticate?: (credentials: AuthCredentials) => Promise<AuthSession>;
  onSignOut?: () => Promise<void>;
}>;

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredToken(): TokenType | null {
  const secureToken = secureStorage ? getSecureItem(SECURE_STORAGE_KEYS.authToken) : null;
  return secureToken ?? getStorageItem(STORAGE_KEYS.token);
}

function writeStoredToken(token: TokenType | null): void {
  if (secureStorage) {
    setSecureItem(SECURE_STORAGE_KEYS.authToken, token);
    return;
  }
  setStorageItem(STORAGE_KEYS.token, token);
}

function clearStoredToken(): void {
  removeStorageItem(STORAGE_KEYS.token);
  if (secureStorage) {
    removeSecureItem(SECURE_STORAGE_KEYS.authToken);
  }
}

function isAuthSession(value: AuthCredentials | AuthSession): value is AuthSession {
  return typeof value === "object" && value !== null && "token" in value && "user" in value;
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

export function SessionProvider({ children, authenticate, onSignOut }: SessionProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<TokenType | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const hasHandledUnauthorized = useRef(false);

  const hydrateFromStorage = useCallback(async (): Promise<void> => {
    setStatus("loading");
    const storedToken = readStoredToken();

    if (!storedToken?.access) {
      setUser(null);
      setToken(null);
      setStatus("guest");
      return;
    }

    const meResult = await getMe();
    if (!meResult.ok) {
      setUser(null);
      setToken(null);
      removeStorageItem(STORAGE_KEYS.user);
      clearStoredToken();
      setStatus("guest");
      return;
    }

    setUser(meResult.data);
    setToken(storedToken);
    setStorageItem(STORAGE_KEYS.user, meResult.data);
    setStatus("authed");
  }, []);

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  const signIn = useCallback(
    async (credentials: AuthCredentials): Promise<AuthSession> => {
      setStatus("loading");

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
          if (!loginResult.ok) {
            throw loginResult.error;
          }

          const meResult = await getMe(loginResult.data.token.access);
          if (!meResult.ok) {
            throw meResult.error;
          }

          const apiSession: AuthSession = {
            user: meResult.data,
            token: loginResult.data.token,
          };

          setUser(apiSession.user);
          setToken(apiSession.token);
          setStorageItem(STORAGE_KEYS.user, apiSession.user);
          writeStoredToken(apiSession.token);
          setStatus("authed");
          return apiSession;
        }

        if (!session) {
          throw new Error("Auth signIn not configured. Provide an authenticate handler.");
        }

        setUser(session.user ?? null);
        setToken(session.token ?? null);
        setStorageItem(STORAGE_KEYS.user, session.user ?? null);
        writeStoredToken(session.token ?? null);
        setStatus(session.token ? "authed" : "guest");
        return session;
      } catch (error) {
        setStatus("guest");
        throw error;
      }
    },
    [authenticate]
  );

  const signOut = useCallback(async () => {
    setStatus("loading");
    if (onSignOut) {
      await onSignOut();
    } else {
      void logout();
    }
    setUser(null);
    setToken(null);
    removeStorageItem(STORAGE_KEYS.user);
    clearStoredToken();
    setStatus("guest");
  }, [onSignOut]);

  useEffect(() => {
    if (status === "authed") {
      hasHandledUnauthorized.current = false;
    }
  }, [status]);

  useEffect(() => {
    async function handleRefresh(currentToken: string | null): Promise<string | null> {
      const storedToken = token ?? readStoredToken();
      const refreshToken = storedToken?.refresh ?? null;
      const tokenToRefresh = refreshToken || currentToken || storedToken?.access || null;

      if (!tokenToRefresh) {
        return null;
      }

      const refreshResult = await refreshSession(tokenToRefresh);
      if (!refreshResult.ok) {
        return null;
      }

      const nextToken: TokenType = {
        access: refreshResult.data.token.access,
        refresh: refreshResult.data.token.refresh ?? storedToken?.refresh ?? "",
      };

      setToken(nextToken);
      writeStoredToken(nextToken);
      return nextToken.access;
    }

    setRefreshHandler(handleRefresh);
    setUnauthorizedHandler(() => {
      if (status !== "authed" || hasHandledUnauthorized.current) {
        return;
      }
      hasHandledUnauthorized.current = true;
      void signOut();
      router.replace("/(auth)/sign-in");
    });

    return () => {
      setRefreshHandler(null);
      setUnauthorizedHandler(null);
    };
  }, [signOut, status, token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      status,
      signIn,
      signOut,
      hydrateFromStorage,
    }),
    [hydrateFromStorage, signIn, signOut, status, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
