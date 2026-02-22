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
import type {
  CompletedHistorySessionView,
  HistorySessionView,
} from "@/types/history";
import { getWorkoutSessionsInRange } from "@/features/planner/planner-repository";

export type HistoryWeekStats = {
  completedCount: number;
  totalPlanned: number;
  totalVolumeKg: number;
  averageDurationMins: number | null;
};

export type HistoryWeekData = {
  historySessions: HistorySessionView[];
  completedSessions: CompletedHistorySessionView[];
  extraCompletedSessions: CompletedHistorySessionView[];
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

/** Current week's planned session template IDs (so we only count completions that match this plan). */
function computeWeekStats(
  sessions: WorkoutSessionSummary[],
  totalPlanned: number,
  currentWeekSessionTemplateIds: Set<string>
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
      .filter(
        (id): id is string =>
          Boolean(id) && currentWeekSessionTemplateIds.has(id)
      )
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
  /** Weeks ending before this date are not shown as "missed" (e.g. before user registered). */
  registrationDate: Date | null;
}): HistorySessionView[] {
  const {
    weekData,
    plannedSessionMap,
    weekStartDate,
    weekEndDate,
    registrationDate,
  } = input;
  if (!weekData) return [];

  const now = new Date();
  const isPastWeek = weekEndDate < now;
  const isFutureWeek = weekStartDate > now;
  const isBeforeRegistration =
    registrationDate != null && weekEndDate < registrationDate;

  return weekData.sessions.map((session) => {
    const completed = plannedSessionMap.get(session.id);
    const status: HistorySessionView["status"] = completed
      ? "completed"
      : isBeforeRegistration
        ? "planned"
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

function buildCompletedSessions(
  sessions: WorkoutSessionSummary[]
): CompletedHistorySessionView[] {
  return sessions
    .filter((session) => session.completedAt != null)
    .map((session) => ({
      sessionId: session.id,
      plannedSessionTemplateId: session.plannedSessionTemplateId,
      title: session.sessionTitle,
      completedAt: session.completedAt ?? 0,
      durationMins: session.durationMins ?? null,
      totalVolumeKg: session.totalVolumeKg ?? null,
      totalSets: session.totalSets,
      totalReps: session.totalReps,
      muscleGroups: session.muscleGroups ?? undefined,
    }));
}

export function useHistoryWeek(
  plan: ActivePlanWithState | null,
  viewedWeekStart: Date,
  registrationDate: Date | null = null
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
    const currentWeekSessionTemplateIds = new Set(
      (weekData?.sessions ?? []).map((s) => s.id)
    );
    const plannedSessionMap = buildSessionMap(sessions);
    const plannedCompletedSessionIds = new Set<string>();
    for (const sessionTemplateId of currentWeekSessionTemplateIds) {
      const session = plannedSessionMap.get(sessionTemplateId);
      if (session) plannedCompletedSessionIds.add(session.id);
    }
    const historySessions = buildHistorySessions({
      weekData,
      plannedSessionMap,
      weekStartDate,
      weekEndDate,
      registrationDate,
    });
    const completedSessions = buildCompletedSessions(sessions);
    const extraCompletedSessions = completedSessions.filter(
      (session) => !plannedCompletedSessionIds.has(session.sessionId)
    );
    const weekStats = computeWeekStats(
      sessions,
      weekData?.sessions.length ?? 0,
      currentWeekSessionTemplateIds
    );

    return {
      historySessions,
      completedSessions,
      extraCompletedSessions,
      weekStats,
      weekData,
    };
  }, [plan, sessions, weekStartDate, weekEndDate, registrationDate]);

  return {
    loading,
    error,
    data,
    refetch,
  };
}
