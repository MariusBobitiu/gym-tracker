import { create } from "zustand";

/**
 * UI-only planner state. Plan data (splits, cycles, sessions) lives in SQLite via planner-repository.
 * This store holds only ephemeral state (e.g. active planned session ID when starting a workout).
 */
type PlannerStore = {
  activePlannedSessionId: string | null;
  setActivePlannedSessionId: (id: string | null) => void;
};

export const usePlannerStore = create<PlannerStore>((set) => ({
  activePlannedSessionId: null,
  setActivePlannedSessionId: (id) => set({ activePlannedSessionId: id }),
}));
