import { useEffect, useState } from "react";
import type { ActivePlan } from "./planner-repository";
import { getActivePlan, getSplitIfExists } from "./planner-repository";

export type PlannerGateState =
  | { kind: "loading" }
  | { kind: "hard_empty" }
  | { kind: "needs_rotation"; splitOnly: Omit<ActivePlan, "cycle"> }
  | { kind: "week_view"; plan: ActivePlan };

export function useActivePlan(): {
  state: PlannerGateState;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [state, setState] = useState<PlannerGateState>({ kind: "loading" });
  const [error, setError] = useState<Error | null>(null);

  const refetch = async (): Promise<void> => {
    setState({ kind: "loading" });
    setError(null);
    try {
      const plan = await getActivePlan();
      if (plan) {
        setState({ kind: "week_view", plan });
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
  };

  useEffect(() => {
    refetch();
  }, []);

  return { state, error, refetch };
}
