import { create } from "zustand";
import { getStorageItem, setStorageItem, STORAGE_KEYS } from "@/lib/storage";

type OnboardingState = {
  hasCompleted: boolean | null;
  setCompleted: () => void;
  hydrate: () => void;
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasCompleted: null,

  setCompleted: () => {
    setStorageItem(STORAGE_KEYS.onboardingComplete, true);
    set({ hasCompleted: true });
  },

  hydrate: () => {
    const value = getStorageItem(STORAGE_KEYS.onboardingComplete);
    set({ hasCompleted: value === true });
  },
}));
