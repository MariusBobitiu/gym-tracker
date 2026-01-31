import { WorkoutLog } from "@/features/planner/planner-types";

export type HistorySessionView = {
  plannedSessionTemplateId: string;
  title: string;
  tags?: string[];
  muscleGroups?: string[];
  estimatedMins?: number;
  variantNotes?: string;
  status: "planned" | "completed" | "missed";
  completedLog?: WorkoutLog;
};
