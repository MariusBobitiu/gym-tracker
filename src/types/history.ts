import { WorkoutLog } from "@/features/planner/planner-types";

export type HistorySessionView = {
  plannedSessionTemplateId: string;
  completedSessionId?: string;
  title: string;
  tags?: string[];
  muscleGroups?: string[];
  estimatedMins?: number;
  variantNotes?: string;
  status: "planned" | "completed" | "missed";
  completedLog?: WorkoutLog;
  completedAt?: number;
  durationMins?: number | null;
  totalVolumeKg?: number | null;
  totalSets?: number;
  totalReps?: number;
};
