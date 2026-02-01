import { useCallback, useEffect, useState } from "react";
import type { ActivePlan, ActivePlanWithState } from "./planner-repository";
import {
  getActiveCycleWithSplit,
  getSplitIfExists,
} from "./planner-repository";

export type PlannerGateState =
  | { kind: "loading" }
  | { kind: "hard_empty" }
  | { kind: "needs_rotation"; splitOnly: Omit<ActivePlan, "cycle"> }
  | { kind: "week_view"; plan: ActivePlanWithState };

export function useActivePlan(): {
  state: PlannerGateState;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [state, setState] = useState<PlannerGateState>({ kind: "loading" });
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async (): Promise<void> => {
    setState({ kind: "loading" });
    setError(null);
    try {
      const planWithState = await getActiveCycleWithSplit();
      if (planWithState) {
        setState({ kind: "week_view", plan: planWithState });
        return;
      }
      const splitOnly = await getSplitIfExists();
      if (splitOnly) {
        setState({ kind: "needs_rotation", splitOnly });
        return;
      }
      setState({ kind: "hard_empty" });
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setState({ kind: "hard_empty" });
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { state, error, refetch };
}
