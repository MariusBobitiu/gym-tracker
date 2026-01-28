/**
 * TypeScript types for Planner feature
 */

/**
 * A planned session template defines what a session should be
 * (e.g., "Upper Body", "Lower Body", etc.)
 */
export type PlannedSessionTemplate = {
  id: string;
  title: string;
  tags?: string[]; // e.g., ["chest", "shoulders", "triceps"]
  muscleGroups?: string[]; // Alternative/additional to tags
  estimatedMins?: number;
  variantNotes?: string; // Optional notes for variations (e.g., "Week B variation")
};

/**
 * A week template defines the sessions for a specific week in a cycle
 * (e.g., Week A has Upper, Lower, Push, Pull)
 */
export type WeekTemplate = {
  index: number; // 0-based index within the cycle
  label: string; // e.g., "A", "B", "C", or "Deload"
  sessions: PlannedSessionTemplate[];
};

/**
 * A cycle pattern defines the repeating structure
 * (e.g., 2-week A/B split, 3-week A/B/C, etc.)
 */
export type CyclePattern = {
  id: string;
  name: string; // e.g., "Upper/Lower Split", "Push/Pull/Legs"
  lengthWeeks: number; // e.g., 2 for A/B, 3 for A/B/C
  weeks: WeekTemplate[];
};

/**
 * A cycle instance represents an active cycle that started on a specific date
 */
export type CycleInstance = {
  id: string;
  patternId: string;
  startDateMonday: number; // Timestamp of Monday 00:00:00 when cycle started
  createdAt: number; // Timestamp when cycle was created
};

/**
 * Per-week overrides allow users to customize a specific week without changing the template
 * These are stored keyed by week start timestamp (Monday 00:00:00)
 */
export type WeekOverrides = {
  [weekStartTimestamp: number]: {
    sessionOrder?: string[]; // Array of plannedSessionTemplateId in custom order
    swappedSessions?: {
      [originalId: string]: PlannedSessionTemplate; // Replace a template session with a different one
    };
    editedSessions?: {
      [sessionId: string]: {
        title?: string;
        variantNotes?: string;
      };
    };
    extraSessions?: PlannedSessionTemplate[]; // Ad-hoc sessions added just for this week
  };
};

/**
 * A workout log entry represents a completed workout
 */
export type WorkoutLog = {
  id: string;
  date: number; // Timestamp of when workout was completed
  plannedSessionTemplateId?: string; // If null, it's an "extra" session not from the plan
  actualSessionTitle: string; // What the user actually did (may differ from template)
  exercisesSummary?: string; // Optional summary of exercises
  durationMins?: number; // Optional duration
};

/**
 * View model: Represents a planned session in a specific week with its completion status
 */
export type PlannedSessionView = {
  plannedSessionTemplateId: string;
  title: string;
  tags?: string[];
  muscleGroups?: string[];
  estimatedMins?: number;
  variantNotes?: string;
  status: "planned" | "completed" | "missed";
  completedLog?: WorkoutLog; // If completed, the log entry
  isUpNext?: boolean; // True for the first uncompleted planned session in current week
};

/**
 * View model: Represents a week instance with all its planned sessions and logs
 */
export type WeekInstance = {
  weekStartMonday: number; // Timestamp of Monday 00:00:00
  weekEndSunday: number; // Timestamp of Sunday 23:59:59.999
  weekIndex: number; // Week index within the cycle (0-based)
  templateLabel: string; // e.g., "A", "B"
  plannedSessions: PlannedSessionView[];
  extraSessions: WorkoutLog[]; // Logs without plannedSessionTemplateId in this week
  totalPlanned: number;
  completedCount: number;
  missedCount: number;
};

/**
 * Complete planner state stored in MMKV
 */
export type PlannerState = {
  patterns: CyclePattern[];
  activeCycleInstance: CycleInstance | null;
  weekOverrides: WeekOverrides;
  workoutLogs: WorkoutLog[];
  activePlannedSessionId: string | null; // Currently active planned session (set when starting workout)
};
