import { useEffect, useCallback, useReducer } from "react";
import { createMMKV } from "react-native-mmkv";
import type { User } from "@/types";
import type { WorkoutSession } from "@/types/workout-session";

export const storage = createMMKV({ id: "gym-tracker" });

const ENCRYPTION_KEY = process.env.EXPO_PUBLIC_MMKV_ENCRYPTION_KEY;
export const secureStorage = ENCRYPTION_KEY
  ? createMMKV({ id: "gym-tracker-secure", encryptionKey: ENCRYPTION_KEY })
  : null;

export const STORAGE_KEYS = {
  storageVersion: "storage_version",
  selectedTheme: "selected_theme",
  session: "session",
  token: "token",
  user: "user",
  workoutSession: "workout_session",
} as const;

export const SECURE_STORAGE_KEYS = {
  authToken: "secure_auth_token",
} as const;

export type ThemePreference = "light" | "dark" | "system";

export type TokenType = {
  access: string;
  refresh: string;
};

export type StorageSchema = {
  [STORAGE_KEYS.storageVersion]: number;
  [STORAGE_KEYS.selectedTheme]: ThemePreference;
  [STORAGE_KEYS.session]: string;
  [STORAGE_KEYS.token]: TokenType;
  [STORAGE_KEYS.user]: User;
  [STORAGE_KEYS.workoutSession]: WorkoutSession | null;
};

export type SecureStorageSchema = {
  [SECURE_STORAGE_KEYS.authToken]: TokenType;
};

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
export type SecureStorageKey = (typeof SECURE_STORAGE_KEYS)[keyof typeof SECURE_STORAGE_KEYS];

type UseStateHook<T> = [[boolean, T | null], (value: T | null) => void];

const STORAGE_VERSION = 1;

function useAsyncState<T>(initialValue: [boolean, T | null] = [true, null]): UseStateHook<T> {
  return useReducer(
    (state: [boolean, T | null], action: T | null = null): [boolean, T | null] => [false, action],
    initialValue
  ) as UseStateHook<T>;
}

function readRawValue(store: typeof storage, key: string): string | number | boolean | undefined {
  const stringValue = store.getString(key);
  if (stringValue !== undefined) return stringValue;
  const numberValue = store.getNumber(key);
  if (numberValue !== undefined) return numberValue;
  const booleanValue = store.getBoolean(key);
  if (booleanValue !== undefined) return booleanValue;
  return undefined;
}

function parseStoredValue<T>(raw: string | number | boolean): T {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as T;
    }
  }

  return raw as T;
}

function setStoreValue(store: typeof storage, key: string, value: unknown): void {
  if (value === null || value === undefined) {
    store.remove(key);
    return;
  }

  if (typeof value === "string") {
    store.set(key, value);
    return;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    store.set(key, value);
    return;
  }

  store.set(key, JSON.stringify(value));
}

export function getStorageItem<K extends StorageKey>(key: K): StorageSchema[K] | null {
  try {
    const rawValue = readRawValue(storage, key);
    if (rawValue === undefined) {
      return null;
    }
    return parseStoredValue<StorageSchema[K]>(rawValue);
  } catch (e) {
    console.error("MMKV storage error:", e);
    return null;
  }
}

export function setStorageItem<K extends StorageKey>(key: K, value: StorageSchema[K] | null): void {
  try {
    setStoreValue(storage, key, value);
  } catch (e) {
    console.error("MMKV storage error:", e);
  }
}

export function removeStorageItem(key: StorageKey): void {
  try {
    storage.remove(key);
  } catch (e) {
    console.error("MMKV storage error:", e);
  }
}

export async function setStorageItemAsync<K extends StorageKey>(
  key: K,
  value: StorageSchema[K] | null
): Promise<void> {
  setStorageItem(key, value);
}

export function getSecureItem<K extends SecureStorageKey>(key: K): SecureStorageSchema[K] | null {
  if (!secureStorage) {
    console.warn("Secure storage not configured. Set EXPO_PUBLIC_MMKV_ENCRYPTION_KEY.");
    return null;
  }

  try {
    const rawValue = readRawValue(secureStorage, key);
    if (rawValue === undefined) {
      return null;
    }
    return parseStoredValue<SecureStorageSchema[K]>(rawValue);
  } catch (e) {
    console.error("MMKV secure storage error:", e);
    return null;
  }
}

export function setSecureItem<K extends SecureStorageKey>(
  key: K,
  value: SecureStorageSchema[K] | null
): void {
  if (!secureStorage) {
    console.warn("Secure storage not configured. Set EXPO_PUBLIC_MMKV_ENCRYPTION_KEY.");
    return;
  }

  try {
    setStoreValue(secureStorage, key, value);
  } catch (e) {
    console.error("MMKV secure storage error:", e);
  }
}

export function removeSecureItem(key: SecureStorageKey): void {
  if (!secureStorage) {
    console.warn("Secure storage not configured. Set EXPO_PUBLIC_MMKV_ENCRYPTION_KEY.");
    return;
  }

  try {
    secureStorage.remove(key);
  } catch (e) {
    console.error("MMKV secure storage error:", e);
  }
}

type StorageMigrationHelpers = {
  getItem: typeof getStorageItem;
  setItem: typeof setStorageItem;
  removeItem: typeof removeStorageItem;
};

const migrations: Record<number, (helpers: StorageMigrationHelpers) => void> = {
  1: () => null,
};

function readStorageVersion(): number {
  const rawValue = readRawValue(storage, STORAGE_KEYS.storageVersion);
  if (rawValue === undefined) return 0;
  if (typeof rawValue === "number") return rawValue;
  if (typeof rawValue === "boolean") return rawValue ? 1 : 0;
  const parsedNumber = Number(rawValue);
  if (!Number.isNaN(parsedNumber)) return parsedNumber;
  try {
    const parsed = JSON.parse(rawValue);
    return typeof parsed === "number" ? parsed : 0;
  } catch {
    return 0;
  }
}

export function runStorageMigrations(): void {
  const currentVersion = readStorageVersion();
  if (currentVersion >= STORAGE_VERSION) {
    return;
  }

  const helpers: StorageMigrationHelpers = {
    getItem: getStorageItem,
    setItem: setStorageItem,
    removeItem: removeStorageItem,
  };

  for (let version = currentVersion + 1; version <= STORAGE_VERSION; version += 1) {
    const migrate = migrations[version];
    if (migrate) {
      migrate(helpers);
    }
  }

  storage.set(STORAGE_KEYS.storageVersion, STORAGE_VERSION);
}

export function useStorageState<K extends StorageKey>(key: K): UseStateHook<StorageSchema[K]> {
  const [state, setState] = useAsyncState<StorageSchema[K]>();

  useEffect(() => {
    const value = getStorageItem(key);
    setState(value ?? null);
  }, [key, setState]);

  const setValue = useCallback(
    (value: StorageSchema[K] | null) => {
      setState(value);
      setStorageItemAsync(key, value);
    },
    [key, setState]
  );

  return [state, setValue];
}
