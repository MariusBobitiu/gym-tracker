import { useCallback, useEffect, useState } from "react";
import {
  getWorkoutSessionDetail,
  type WorkoutSessionDetail,
} from "@/features/planner/planner-repository";

export type UseHistorySessionDetailResult = {
  loading: boolean;
  error: Error | null;
  data: WorkoutSessionDetail | null;
  refetch: () => Promise<void>;
};

export function useHistorySessionDetail(
  sessionId: string | null
): UseHistorySessionDetailResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<WorkoutSessionDetail | null>(null);

  const refetch = useCallback(async (): Promise<void> => {
    if (!sessionId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getWorkoutSessionDetail(sessionId);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { loading, error, data, refetch };
}
