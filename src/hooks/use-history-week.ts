import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ActivePlanWithState,
  WorkoutSessionSummary,
} from "@/features/planner/planner-repository";
import {
  getWeekSessionsFromPlan,
  getWeekRange,
  startOfWeekMonday,
} from "@/features/planner";
import type { HistorySessionView } from "@/types/history";
import { getWorkoutSessionsInRange } from "@/features/planner/planner-repository";

export type HistoryWeekStats = {
  completedCount: number;
  totalPlanned: number;
  totalVolumeKg: number;
  averageDurationMins: number | null;
};

export type HistoryWeekData = {
  historySessions: HistorySessionView[];
  weekStats: HistoryWeekStats;
  weekData: ReturnType<typeof getWeekSessionsFromPlan> | null;
};

export type UseHistoryWeekResult = {
  loading: boolean;
  error: Error | null;
  data: HistoryWeekData | null;
  refetch: () => Promise<void>;
};

function buildSessionMap(
  sessions: WorkoutSessionSummary[]
): Map<string, WorkoutSessionSummary> {
  const map = new Map<string, WorkoutSessionSummary>();
  for (const session of sessions) {
    const id = session.plannedSessionTemplateId;
    if (!id) continue;
    const existing = map.get(id);
    if (!existing || existing.completedAt < session.completedAt) {
      map.set(id, session);
    }
  }
  return map;
}

function computeWeekStats(
  sessions: WorkoutSessionSummary[],
  totalPlanned: number
): HistoryWeekStats {
  const totalVolumeKg = sessions.reduce(
    (sum, session) => sum + (session.totalVolumeKg ?? 0),
    0
  );
  const durations = sessions
    .map((session) => session.durationMins)
    .filter((v) => v !== null);
  const averageDurationMins = durations.length
    ? Math.round(durations.reduce((sum, v) => sum + v, 0) / durations.length)
    : null;

  const completedIds = new Set(
    sessions
      .map((session) => session.plannedSessionTemplateId)
      .filter((id): id is string => Boolean(id))
  );
  const completedCount = completedIds.size;

  return {
    completedCount: Math.min(completedCount, totalPlanned),
    totalPlanned,
    totalVolumeKg,
    averageDurationMins,
  };
}

function buildHistorySessions(input: {
  weekData: ReturnType<typeof getWeekSessionsFromPlan> | null;
  plannedSessionMap: Map<string, WorkoutSessionSummary>;
  weekStartDate: Date;
  weekEndDate: Date;
}): HistorySessionView[] {
  const { weekData, plannedSessionMap, weekStartDate, weekEndDate } = input;
  if (!weekData) return [];

  const now = new Date();
  const isPastWeek = weekEndDate < now;
  const isFutureWeek = weekStartDate > now;

  return weekData.sessions.map((session) => {
    const completed = plannedSessionMap.get(session.id);
    const status: HistorySessionView["status"] = completed
      ? "completed"
      : isFutureWeek
        ? "planned"
        : isPastWeek
          ? "missed"
          : "planned";

    return {
      plannedSessionTemplateId: session.id,
      completedSessionId: completed?.id,
      title: session.name,
      tags: session.muscleGroups ?? undefined,
      muscleGroups: session.muscleGroups ?? undefined,
      estimatedMins: completed?.durationMins ?? undefined,
      variantNotes: undefined,
      status,
      completedAt: completed?.completedAt,
      durationMins: completed?.durationMins ?? null,
      totalVolumeKg: completed?.totalVolumeKg ?? null,
      totalSets: completed?.totalSets,
      totalReps: completed?.totalReps,
    };
  });
}

export function useHistoryWeek(
  plan: ActivePlanWithState | null,
  viewedWeekStart: Date
): UseHistoryWeekResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [sessions, setSessions] = useState<WorkoutSessionSummary[]>([]);

  const [weekStartDate, weekEndDate] = useMemo(
    () => getWeekRange(startOfWeekMonday(viewedWeekStart)),
    [viewedWeekStart]
  );

  const refetch = useCallback(async (): Promise<void> => {
    if (!plan) {
      setSessions([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getWorkoutSessionsInRange(
        weekStartDate.getTime(),
        weekEndDate.getTime()
      );
      setSessions(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [plan, weekStartDate, weekEndDate]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const data = useMemo<HistoryWeekData | null>(() => {
    if (!plan) return null;
    const weekData = getWeekSessionsFromPlan(plan, weekStartDate);
    const plannedSessionMap = buildSessionMap(sessions);
    const historySessions = buildHistorySessions({
      weekData,
      plannedSessionMap,
      weekStartDate,
      weekEndDate,
    });
    const weekStats = computeWeekStats(
      sessions,
      weekData?.sessions.length ?? 0
    );

    return {
      historySessions,
      weekStats,
      weekData,
    };
  }, [plan, sessions, weekStartDate, weekEndDate]);

  return {
    loading,
    error,
    data,
    refetch,
  };
}
