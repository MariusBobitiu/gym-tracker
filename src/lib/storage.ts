import { useEffect, useCallback, useReducer } from 'react';
import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({ id: 'gym-tracker' });

type UseStateHook<T> = [[boolean, T | null], (value: T | null) => void];

function useAsyncState<T>(
  initialValue: [boolean, T | null] = [true, null],
): UseStateHook<T> {
  return useReducer(
    (state: [boolean, T | null], action: T | null = null): [boolean, T | null] => [false, action],
    initialValue
  ) as UseStateHook<T>;
}

export async function setStorageItemAsync(key: string, value: string | null): Promise<void> {
  try {
    if (value === null) {
      storage.remove(key);
    } else {
      storage.set(key, value);
    }
  } catch (e) {
    console.error('MMKV storage error:', e);
  }
}

export function getItem<T>(key: string): T | null {
  try {
    const value = storage.getString(key);
    if (value === undefined) {
      return null;
    }
    return JSON.parse(value) as T;
  } catch (e) {
    console.error('MMKV storage error:', e);
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    storage.set(key, JSON.stringify(value));
  } catch (e) {
    console.error('MMKV storage error:', e);
  }
}

export function removeItem(key: string): void {
  try {
    storage.remove(key);
  } catch (e) {
    console.error('MMKV storage error:', e);
  }
}

export function useStorageState(key: string): UseStateHook<string> {
  // Public
  const [state, setState] = useAsyncState<string>();

  // Get
  useEffect(() => {
    try {
      const value = storage.getString(key);
      setState(value ?? null);
    } catch (e) {
      console.error('MMKV storage error:', e);
      setState(null);
    }
  }, [key]);

  // Set
  const setValue = useCallback(
    (value: string | null) => {
      setState(value);
      setStorageItemAsync(key, value);
    },
    [key]
  );

  return [state, setValue];
}
