import { create } from "zustand";
import { getStorageItem, setStorageItem, STORAGE_KEYS } from "@/lib/storage";
import type {
  CycleInstance,
  CyclePattern,
  PlannedSessionTemplate,
  PlannedSessionView,
  PlannerState,
  WeekInstance,
  WeekOverrides,
  WorkoutLog,
  WeekTemplate,
} from "./planner-types";
import {
  endOfWeekSunday,
  formatWeekRange,
  getWeekIndexInCycle,
  getWeekRange,
  startOfWeekMonday,
  weeksBetween,
  isDateInPast,
} from "./date-utils";

const STORAGE_KEY = STORAGE_KEYS.planner;

/**
 * Seed data: 2-week A/B pattern with 4 sessions per week
 */
const SEED_PATTERN: CyclePattern = {
  id: "seed-ab-split",
  name: "Upper/Lower Split",
  lengthWeeks: 2,
  weeks: [
    {
      index: 0,
      label: "A",
      sessions: [
        {
          id: "upper-a",
          title: "Upper Body",
          tags: ["chest", "shoulders", "back", "arms"],
          muscleGroups: ["chest", "shoulders", "back", "biceps", "triceps"],
          estimatedMins: 60,
        },
        {
          id: "lower-a",
          title: "Lower Body",
          tags: ["legs", "glutes"],
          muscleGroups: ["quads", "hamstrings", "glutes", "calves"],
          estimatedMins: 60,
        },
        {
          id: "push-a",
          title: "Push",
          tags: ["chest", "shoulders", "triceps"],
          muscleGroups: ["chest", "shoulders", "triceps"],
          estimatedMins: 50,
        },
        {
          id: "pull-a",
          title: "Pull",
          tags: ["back", "biceps"],
          muscleGroups: ["back", "biceps"],
          estimatedMins: 50,
        },
      ],
    },
    {
      index: 1,
      label: "B",
      sessions: [
        {
          id: "lower-b",
          title: "Lower Body",
          tags: ["legs", "glutes"],
          muscleGroups: ["quads", "hamstrings", "glutes", "calves"],
          estimatedMins: 60,
          variantNotes: "Week B variation",
        },
        {
          id: "upper-b",
          title: "Upper Body",
          tags: ["chest", "shoulders", "back", "arms"],
          muscleGroups: ["chest", "shoulders", "back", "biceps", "triceps"],
          estimatedMins: 60,
          variantNotes: "Week B variation",
        },
        {
          id: "push-b",
          title: "Push (Variation)",
          tags: ["chest", "shoulders", "triceps"],
          muscleGroups: ["chest", "shoulders", "triceps"],
          estimatedMins: 50,
          variantNotes: "Week B variation",
        },
        {
          id: "pull-b",
          title: "Pull (Variation)",
          tags: ["back", "biceps"],
          muscleGroups: ["back", "biceps"],
          estimatedMins: 50,
          variantNotes: "Week B variation",
        },
      ],
    },
  ],
};

type PlannerStore = PlannerState & {
  // Actions
  initialize: () => void;
  setActiveCycle: (cycleInstance: CycleInstance) => void;
  createCycleFromPattern: (patternId: string, startDateMonday: Date) => void;
  getWeekInstance: (weekStartMonday: Date) => WeekInstance | null;
  assignLogToPlannedSession: (logDate: Date, weekInstance: WeekInstance) => string | null;
  addWorkoutLog: (log: Omit<WorkoutLog, "id">) => void;
  markSessionAsDone: (
    plannedSessionTemplateId: string,
    weekStartMonday: Date,
    log: Omit<WorkoutLog, "id" | "plannedSessionTemplateId">
  ) => void;
  swapSession: (
    weekStartMonday: Date,
    originalId: string,
    replacement: PlannedSessionTemplate
  ) => void;
  editSessionTitle: (
    weekStartMonday: Date,
    sessionId: string,
    title: string,
    variantNotes?: string
  ) => void;
  addExtraSession: (weekStartMonday: Date, session: PlannedSessionTemplate) => void;
  reorderSessions: (weekStartMonday: Date, sessionIds: string[]) => void;
  carrySessionToNextWeek: (weekStartMonday: Date, sessionId: string) => void;
  setActivePlannedSessionId: (id: string | null) => void;
  // Persistence
  loadFromStorage: () => void;
  saveToStorage: () => void;
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function loadStateFromStorage(): PlannerState {
  const stored = getStorageItem(STORAGE_KEY);
  if (stored && typeof stored === "object") {
    return stored as PlannerState;
  }
  return {
    patterns: [SEED_PATTERN],
    activeCycleInstance: null,
    weekOverrides: {},
    workoutLogs: [],
    activePlannedSessionId: null,
  };
}

export const usePlannerStore = create<PlannerStore>((set, get) => ({
  // Initial state
  patterns: [SEED_PATTERN],
  activeCycleInstance: null,
  weekOverrides: {},
  workoutLogs: [],
  activePlannedSessionId: null,

  initialize: () => {
    const state = loadStateFromStorage();
    set(state);
    // Auto-create cycle if none exists and we have patterns
    if (!state.activeCycleInstance && state.patterns.length > 0) {
      const pattern = state.patterns[0];
      const thisMonday = startOfWeekMonday(new Date());
      get().createCycleFromPattern(pattern.id, thisMonday);
    }
  },

  loadFromStorage: () => {
    const state = loadStateFromStorage();
    set(state);
  },

  saveToStorage: () => {
    const state = get();
    const toSave: PlannerState = {
      patterns: state.patterns,
      activeCycleInstance: state.activeCycleInstance,
      weekOverrides: state.weekOverrides,
      workoutLogs: state.workoutLogs,
      activePlannedSessionId: null, // Don't persist active session
    };
    setStorageItem(STORAGE_KEY, toSave);
  },

  setActiveCycle: (cycleInstance) => {
    set({ activeCycleInstance: cycleInstance });
    get().saveToStorage();
  },

  createCycleFromPattern: (patternId, startDateMonday) => {
    const pattern = get().patterns.find((p) => p.id === patternId);
    if (!pattern) return;

    const cycleInstance: CycleInstance = {
      id: generateId(),
      patternId,
      startDateMonday: startDateMonday.getTime(),
      createdAt: Date.now(),
    };

    set({ activeCycleInstance: cycleInstance });
    get().saveToStorage();
  },

  getWeekInstance: (weekStartMonday) => {
    const state = get();
    const cycle = state.activeCycleInstance;
    if (!cycle) return null;

    const pattern = state.patterns.find((p) => p.id === cycle.patternId);
    if (!pattern) return null;

    const weekStart = startOfWeekMonday(weekStartMonday);
    const weekEnd = endOfWeekSunday(weekStart);
    const weekIndex = getWeekIndexInCycle(
      new Date(cycle.startDateMonday),
      weekStart,
      pattern.lengthWeeks
    );
    const template = pattern.weeks[weekIndex];
    if (!template) return null;

    // Get overrides for this week
    const overrides = state.weekOverrides[weekStart.getTime()] || {};

    // Build planned sessions list (apply overrides)
    const sessionOrder = overrides.sessionOrder || template.sessions.map((s) => s.id);
    const plannedSessions: PlannedSessionView[] = [];

    // Get logs for this week
    const weekLogs = state.workoutLogs.filter(
      (log) => log.date >= weekStart.getTime() && log.date <= weekEnd.getTime()
    );

    // Track which planned sessions are completed
    const completedSessionIds = new Set(
      weekLogs.map((log) => log.plannedSessionTemplateId).filter((id): id is string => !!id)
    );

    // Build planned sessions with status
    let firstUncompletedFound = false;
    const isCurrentWeek = !isDateInPast(weekEnd);

    for (const sessionId of sessionOrder) {
      // Check if swapped
      const swapped = overrides.swappedSessions?.[sessionId];
      const sessionTemplate = swapped || template.sessions.find((s) => s.id === sessionId);
      if (!sessionTemplate) continue;

      // Apply title/notes edits
      const edits = overrides.editedSessions?.[sessionId];
      const title = edits?.title || sessionTemplate.title;
      const variantNotes = edits?.variantNotes ?? sessionTemplate.variantNotes;

      const isCompleted = completedSessionIds.has(sessionId);
      const completedLog = isCompleted
        ? weekLogs.find((log) => log.plannedSessionTemplateId === sessionId)
        : undefined;

      const status: "planned" | "completed" | "missed" = isCompleted
        ? "completed"
        : isCurrentWeek
          ? "planned"
          : "missed";

      const isUpNext = !firstUncompletedFound && !isCompleted && isCurrentWeek;
      if (isUpNext) firstUncompletedFound = true;

      plannedSessions.push({
        plannedSessionTemplateId: sessionId,
        title,
        tags: sessionTemplate.tags,
        muscleGroups: sessionTemplate.muscleGroups,
        estimatedMins: sessionTemplate.estimatedMins,
        variantNotes,
        status,
        completedLog,
        isUpNext,
      });
    }

    // Add extra sessions (from overrides)
    const extraSessionsFromOverrides = (overrides.extraSessions || []).map((session) => {
      const log = weekLogs.find(
        (l) => !l.plannedSessionTemplateId && l.actualSessionTitle === session.title
      );
      return {
        ...session,
        log,
      };
    });

    // Get extra logs (logs without plannedSessionTemplateId)
    const extraLogs = weekLogs.filter((log) => !log.plannedSessionTemplateId);

    const totalPlanned = plannedSessions.length;
    const completedCount = plannedSessions.filter((s) => s.status === "completed").length;
    const missedCount = plannedSessions.filter((s) => s.status === "missed").length;

    return {
      weekStartMonday: weekStart.getTime(),
      weekEndSunday: weekEnd.getTime(),
      weekIndex,
      templateLabel: template.label,
      plannedSessions,
      extraSessions: extraLogs,
      totalPlanned,
      completedCount,
      missedCount,
    };
  },

  assignLogToPlannedSession: (logDate, weekInstance) => {
    // Find the earliest uncompleted planned session
    const uncompleted = weekInstance.plannedSessions.find((s) => s.status === "planned");
    return uncompleted?.plannedSessionTemplateId || null;
  },

  addWorkoutLog: (log) => {
    const newLog: WorkoutLog = {
      ...log,
      id: generateId(),
    };
    set((state) => ({
      workoutLogs: [...state.workoutLogs, newLog],
    }));
    get().saveToStorage();
    return newLog;
  },

  markSessionAsDone: (plannedSessionTemplateId, weekStartMonday, log) => {
    const weekStart = startOfWeekMonday(weekStartMonday);
    const logDate = log.date || Date.now();
    const newLog: WorkoutLog = {
      ...log,
      id: generateId(),
      plannedSessionTemplateId,
      date: logDate,
    };
    set((state) => ({
      workoutLogs: [...state.workoutLogs, newLog],
    }));
    get().saveToStorage();
  },

  swapSession: (weekStartMonday, originalId, replacement) => {
    const weekStart = startOfWeekMonday(weekStartMonday).getTime();
    set((state) => {
      const overrides = state.weekOverrides[weekStart] || {};
      return {
        weekOverrides: {
          ...state.weekOverrides,
          [weekStart]: {
            ...overrides,
            swappedSessions: {
              ...overrides.swappedSessions,
              [originalId]: replacement,
            },
          },
        },
      };
    });
    get().saveToStorage();
  },

  editSessionTitle: (weekStartMonday, sessionId, title, variantNotes) => {
    const weekStart = startOfWeekMonday(weekStartMonday).getTime();
    set((state) => {
      const overrides = state.weekOverrides[weekStart] || {};
      return {
        weekOverrides: {
          ...state.weekOverrides,
          [weekStart]: {
            ...overrides,
            editedSessions: {
              ...overrides.editedSessions,
              [sessionId]: {
                ...overrides.editedSessions?.[sessionId],
                title,
                variantNotes,
              },
            },
          },
        },
      };
    });
    get().saveToStorage();
  },

  addExtraSession: (weekStartMonday, session) => {
    const weekStart = startOfWeekMonday(weekStartMonday).getTime();
    set((state) => {
      const overrides = state.weekOverrides[weekStart] || {};
      return {
        weekOverrides: {
          ...state.weekOverrides,
          [weekStart]: {
            ...overrides,
            extraSessions: [...(overrides.extraSessions || []), session],
          },
        },
      };
    });
    get().saveToStorage();
  },

  reorderSessions: (weekStartMonday, sessionIds) => {
    const weekStart = startOfWeekMonday(weekStartMonday).getTime();
    set((state) => {
      const overrides = state.weekOverrides[weekStart] || {};
      return {
        weekOverrides: {
          ...state.weekOverrides,
          [weekStart]: {
            ...overrides,
            sessionOrder: sessionIds,
          },
        },
      };
    });
    get().saveToStorage();
  },

  carrySessionToNextWeek: (weekStartMonday, sessionId) => {
    const weekStart = startOfWeekMonday(weekStartMonday);
    const nextWeekStart = new Date(weekStart);
    nextWeekStart.setDate(weekStart.getDate() + 7);
    const nextWeekStartTime = nextWeekStart.getTime();

    // Get the session template from current week
    const weekInstance = get().getWeekInstance(weekStart);
    if (!weekInstance) return;

    const session = weekInstance.plannedSessions.find(
      (s) => s.plannedSessionTemplateId === sessionId
    );
    if (!session) return;

    // Create an extra session in next week
    const extraSession: PlannedSessionTemplate = {
      id: generateId(),
      title: session.title,
      tags: session.tags,
      muscleGroups: session.muscleGroups,
      estimatedMins: session.estimatedMins,
      variantNotes: session.variantNotes
        ? `${session.variantNotes} (Carried over)`
        : "Carried over",
    };

    get().addExtraSession(nextWeekStart, extraSession);
  },

  setActivePlannedSessionId: (id) => {
    set({ activePlannedSessionId: id });
  },
}));
