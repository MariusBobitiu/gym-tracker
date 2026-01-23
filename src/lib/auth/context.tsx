import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

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

export type AuthStatus = "loading" | "authed" | "guest";
export type AuthUser = Record<string, unknown>;
export type AuthCredentials = Record<string, unknown>;
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
  hydrateFromStorage: () => void;
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

  const hydrateFromStorage = useCallback(() => {
    const storedUser = getStorageItem(STORAGE_KEYS.user);
    const storedToken = readStoredToken();

    setUser(storedUser ?? null);
    setToken(storedToken ?? null);
    setStatus(storedToken ? "authed" : "guest");
  }, []);

  useEffect(() => {
    hydrateFromStorage();
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
    }
    setUser(null);
    setToken(null);
    removeStorageItem(STORAGE_KEYS.user);
    clearStoredToken();
    setStatus("guest");
  }, [onSignOut]);

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
